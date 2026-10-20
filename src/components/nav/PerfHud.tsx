'use client'

/**
 * HUD performa untuk uji perangkat nyata — gerbang Fase 0.
 *
 * Aktif dengan menambahkan `?perf=1` ke URL mana pun (bertahan selama tab
 * terbuka; `?perf=0` mematikannya). Saat tidak aktif komponen ini tidak
 * merender apa pun dan tidak memasang loop.
 *
 * Yang diukur, per rute: fps (median & persentil-95), frame patah, LCP dan CLS
 * muat awal, long task, total JS terunduh, tier kualitas otomatis (F-30), dan
 * profil perangkat. "Salin laporan" menghasilkan teks yang bisa ditempel ke
 * issue atau chat.
 */

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { FrameStats, VERDICT_LABEL, verdict, type FrameSummary, type PerfVerdict } from '@/lib/perf'
import { TIER_LABEL, deviceClass } from '@/lib/quality'
import { effectiveQuality, effectiveReducedMotion, useSettings } from '@/stores/settingsStore'

const FLAG_KEY = 'taktika:perf'

function readPerfFlag(): boolean {
  const p = new URLSearchParams(window.location.search).get('perf')
  try {
    if (p === '1') sessionStorage.setItem(FLAG_KEY, '1')
    if (p === '0') sessionStorage.removeItem(FLAG_KEY)
    return sessionStorage.getItem(FLAG_KEY) === '1'
  } catch {
    return p === '1'
  }
}

interface Vitals {
  lcpMs: number | null
  cls: number
  longTasks: number
  longTaskMs: number
}

interface Snapshot {
  route: string
  frames: FrameSummary
  verdict: PerfVerdict
  vitals: Vitals
  jsKb: number
}

const VERDICT_COLOR: Record<PerfVerdict, string> = {
  lolos: 'var(--state-success)',
  batas: 'var(--state-warn)',
  gagal: 'var(--state-error)',
  'kurang-data': 'var(--text-secondary)',
}

/** Total JS aplikasi yang sudah diunduh (ukuran terkompresi). */
function loadedJsKb(): number {
  let bytes = 0
  for (const e of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
    if (e.name.includes('/_next/static/') && e.name.endsWith('.js')) {
      bytes += e.encodedBodySize || e.transferSize
    }
  }
  return bytes / 1024
}

const num = (v: number, digits = 0) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v)

export function PerfHud() {
  const pathname = usePathname() ?? '/'
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState<'ok' | 'manual' | null>(null)

  const settings = useSettings()
  const routeRef = useRef(pathname)
  const statsRef = useRef(new FrameStats())
  const vitalsRef = useRef<Vitals>({ lcpMs: null, cls: 0, longTasks: 0, longTaskMs: 0 })

  // Statistik frame dihitung per rute.
  useEffect(() => {
    routeRef.current = pathname
    statsRef.current.reset()
  }, [pathname])

  useEffect(() => {
    if (!readPerfFlag()) return

    let raf = 0
    let last = performance.now()
    let lastEmit = 0
    const loop = (now: number) => {
      statsRef.current.push(now - last)
      last = now
      if (now - lastEmit > 500) {
        lastEmit = now
        const frames = statsRef.current.summary()
        setSnap({
          route: routeRef.current,
          frames,
          verdict: verdict(frames),
          vitals: { ...vitalsRef.current },
          jsKb: loadedJsKb(),
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const observers: PerformanceObserver[] = []
    const observe = (type: string, onEntry: (e: PerformanceEntry) => void) => {
      try {
        const po = new PerformanceObserver((list) => list.getEntries().forEach(onEntry))
        po.observe({ type, buffered: true })
        observers.push(po)
      } catch {
        // Jenis entri tidak didukung browser ini (mis. Safari tanpa longtask).
      }
    }
    observe('largest-contentful-paint', (e) => {
      vitalsRef.current.lcpMs = e.startTime
    })
    observe('layout-shift', (e) => {
      const ls = e as PerformanceEntry & { value: number; hadRecentInput: boolean }
      if (!ls.hadRecentInput) vitalsRef.current.cls += ls.value
    })
    observe('longtask', (e) => {
      vitalsRef.current.longTasks += 1
      vitalsRef.current.longTaskMs += e.duration
    })

    return () => {
      cancelAnimationFrame(raf)
      observers.forEach((o) => o.disconnect())
    }
  }, [])

  if (!snap) return null

  const quality = effectiveQuality(settings)
  const reduced = effectiveReducedMotion(settings)
  const nav = navigator as Navigator & { deviceMemory?: number }
  const f = snap.frames

  const report = [
    `TAKTIKA perf · ${snap.route} · ${new Date().toISOString()}`,
    `Perangkat: ${deviceClass()} · ${nav.hardwareConcurrency ?? '?'} core · ${nav.deviceMemory ?? '?'} GB · DPR ${num(window.devicePixelRatio, 2)} · ${window.innerWidth}x${window.innerHeight}`,
    `UA: ${navigator.userAgent}`,
    `Frame: median ${num(f.medianFps)} fps · p95 ${num(f.lowFps)} fps · <45 fps ${num(f.slowPct, 1)}% · <30 fps ${num(f.verySlowPct, 1)}% · terburuk ${num(f.worstMs)} ms · ${f.frames} frame / ${num(f.seconds, 1)} dtk`,
    `Putusan: ${VERDICT_LABEL[snap.verdict]}`,
    `Tier otomatis: ${settings.detectedTier ? TIER_LABEL[settings.detectedTier] : 'belum'} · dipakai: ${TIER_LABEL[quality]} · pengaturan: ${settings.quality} · kurangi gerak: ${reduced ? 'ya' : 'tidak'}`,
    `LCP awal: ${snap.vitals.lcpMs === null ? 'n/a' : `${num(snap.vitals.lcpMs / 1000, 2)} dtk`} · CLS: ${num(snap.vitals.cls, 3)} · long task: ${snap.vitals.longTasks} (${num(snap.vitals.longTaskMs)} ms)`,
    `JS terunduh (terkompresi): ${num(snap.jsKb)} KB`,
  ].join('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report)
      setCopied('ok')
    } catch {
      // Clipboard API butuh HTTPS; di http://IP-LAN tampilkan teks untuk disalin manual.
      setCopied('manual')
    }
  }

  return (
    <div
      className="fixed right-2 top-2 z-[60] w-[min(92vw,300px)] rounded-xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-void)_92%,transparent)] p-2.5 text-[11px] leading-snug text-[var(--text-primary)] shadow-glass"
      style={{ top: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
      aria-label="HUD performa"
    >
      <div className="flex items-center gap-2">
        <span className="hud font-bold" style={{ color: VERDICT_COLOR[snap.verdict] }}>
          {VERDICT_LABEL[snap.verdict]}
        </span>
        <span className="hud text-[var(--text-secondary)]">
          {num(f.medianFps)} fps · p95 {num(f.lowFps)}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto rounded px-1.5 py-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {open ? 'tutup' : 'buka'}
        </button>
      </div>

      {open && (
        <div className="mt-1.5 flex flex-col gap-1">
          <p className="hud truncate text-[var(--text-secondary)]">{snap.route}</p>
          <p className="hud">
            &lt;45 fps {num(f.slowPct, 1)}% · &lt;30 fps {num(f.verySlowPct, 1)}% · terburuk {num(f.worstMs)} ms
          </p>
          <p className="hud text-[var(--text-secondary)]">
            {f.frames} frame / {num(f.seconds, 1)} dtk
          </p>
          <p className="hud">
            Tier: {settings.detectedTier ? TIER_LABEL[settings.detectedTier] : '—'} → {TIER_LABEL[quality]}
            {reduced ? ' · kurangi gerak' : ''}
          </p>
          <p className="hud">
            LCP {snap.vitals.lcpMs === null ? 'n/a' : `${num(snap.vitals.lcpMs / 1000, 2)} dtk`} · CLS{' '}
            {num(snap.vitals.cls, 3)} · JS {num(snap.jsKb)} KB
          </p>
          <div className="mt-1 flex gap-1.5">
            <button
              type="button"
              onClick={copy}
              className="rounded-full bg-[var(--team-offense)] px-2.5 py-1 font-semibold text-[var(--text-inverse)]"
            >
              {copied === 'ok' ? 'Tersalin' : 'Salin laporan'}
            </button>
            <button
              type="button"
              onClick={() => statsRef.current.reset()}
              className="rounded-full border border-[var(--glass-border)] px-2.5 py-1 text-[var(--text-secondary)]"
            >
              Ukur ulang
            </button>
          </div>
          {copied === 'manual' && (
            <textarea
              readOnly
              value={report}
              rows={6}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Laporan performa untuk disalin"
              className="hud mt-1 w-full rounded-lg bg-[var(--bg-surface)] p-1.5 text-[10px] text-[var(--text-primary)]"
            />
          )}
        </div>
      )}
    </div>
  )
}
