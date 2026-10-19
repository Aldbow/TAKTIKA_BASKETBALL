'use client'

/**
 * Timeline — PRD §9 "Komponen antarmuka":
 *   "Timeline: trek tersegmen per fase dengan warna kategori; momen keputusan
 *    ditandai BERLIAN VOLT."
 *
 * Kriteria penerimaan F-10: "ketika pengguna menggeser timeline, maka semua
 * pemain dan bola berada di posisi yang tepat untuk waktu itu TANPA LOMPATAN".
 * Itu dijamin engine; tugas komponen ini hanya mengubah posisi pointer menjadi
 * `t` dan memanggil seek — tidak ada interpolasi sendiri di sini.
 *
 * Dapat digeser dengan keyboard: panah kiri/kanan menggeser satu langkah,
 * Home/End ke ujung, PageUp/PageDown per fase (PRD §15 navigasi keyboard).
 */

import { useCallback, useMemo, useRef } from 'react'

import { CATEGORY_TOKEN, t as localize, type Decision, type Phase, type TacticCategory } from '@/engine'
import { clockTime } from '@/lib/format'
import { cx } from '@/components/ui'

export interface TimelineProps {
  phases: readonly Phase[]
  decisions: readonly Decision[]
  duration: number
  /** Waktu sekarang (detik) */
  t: number
  category: TacticCategory
  /** Fase aktif untuk menyorot segmen */
  activePhaseIndex: number
  /** Bullet time aktif — segmen berdenyut */
  bulletTime: boolean
  onSeek: (t: number) => void
  onJumpToPhase: (index: number) => void
  className?: string
}

export function Timeline({
  phases,
  decisions,
  duration,
  t,
  category,
  activePhaseIndex,
  bulletTime,
  onSeek,
  onJumpToPhase,
  className,
}: TimelineProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const dragging = useRef(false)
  const accent = CATEGORY_TOKEN[category]

  const pct = useCallback((time: number) => (duration <= 0 ? 0 : (time / duration) * 100), [duration])

  const seekFromPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const u = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)))
      onSeek(u * duration)
    },
    [duration, onSeek],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      seekFromPointer(e.clientX)
    },
    [seekFromPointer],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return
      seekFromPointer(e.clientX)
    },
    [seekFromPointer],
  )

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 1 : 0.1
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          onSeek(Math.max(0, t - step))
          break
        case 'ArrowRight':
          e.preventDefault()
          onSeek(Math.min(duration, t + step))
          break
        case 'Home':
          e.preventDefault()
          onSeek(0)
          break
        case 'End':
          e.preventDefault()
          onSeek(duration)
          break
        case 'PageUp':
          e.preventDefault()
          onJumpToPhase(Math.max(0, activePhaseIndex - 1))
          break
        case 'PageDown':
          e.preventDefault()
          onJumpToPhase(Math.min(phases.length - 1, activePhaseIndex + 1))
          break
        default:
          break
      }
    },
    [activePhaseIndex, duration, onJumpToPhase, onSeek, phases.length, t],
  )

  const phaseLabel = useMemo(() => {
    const p = phases[activePhaseIndex]
    return p ? localize(p.title) : ''
  }, [activePhaseIndex, phases])

  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {/* Label fase & waktu */}
      <div className="flex items-baseline justify-between gap-3 px-0.5">
        <p className="min-w-0 truncate text-sm font-medium text-[var(--text-primary)]">
          <span className="hud mr-2 text-xs text-[var(--text-secondary)]">
            Fase {activePhaseIndex + 1}/{phases.length}
          </span>
          {phaseLabel}
        </p>
        <p className="hud shrink-0 text-xs tabular-nums text-[var(--text-secondary)]">
          <span style={{ color: bulletTime ? 'var(--ball)' : undefined }}>{clockTime(t)}</span>
          <span className="opacity-50"> / {clockTime(duration)}</span>
        </p>
      </div>

      {/* Trek */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Garis waktu taktik"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration * 10) / 10}
        aria-valuenow={Math.round(t * 10) / 10}
        aria-valuetext={`${clockTime(t)} dari ${clockTime(duration)}, fase ${phaseLabel}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="relative cursor-pointer touch-none select-none rounded-lg py-3"
        style={{ touchAction: 'none' }}
      >
        {/* Segmen per fase */}
        <div className="relative flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
          {phases.map((p, i) => {
            const width = ((p.tEnd - p.tStart) / Math.max(1e-6, duration)) * 100
            const isActive = i === activePhaseIndex
            const isPast = t >= p.tEnd
            // Progres di dalam fase aktif.
            const inner = isActive
              ? Math.max(0, Math.min(1, (t - p.tStart) / Math.max(1e-6, p.tEnd - p.tStart)))
              : isPast
                ? 1
                : 0
            return (
              <div
                key={p.id}
                className="relative h-full shrink-0 overflow-hidden rounded-full"
                style={{
                  width: `${width}%`,
                  background: `color-mix(in srgb, ${accent} 16%, transparent)`,
                }}
                title={localize(p.title)}
              >
                <div
                  className="absolute inset-y-0 left-0 transition-[width] duration-instant"
                  style={{
                    width: `${inner * 100}%`,
                    background: accent,
                    boxShadow: isActive ? `0 0 10px ${accent}` : undefined,
                    opacity: isActive ? 1 : 0.65,
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Berlian volt di momen keputusan */}
        {decisions.map((d) => (
          <div
            key={d.id}
            aria-hidden="true"
            title={`Momen keputusan: ${localize(d.cue)}`}
            className={cx('absolute top-1/2 -translate-x-1/2 -translate-y-1/2', bulletTime && 'animate-pulse-halo')}
            style={{ left: `${pct(d.t)}%` }}
          >
            <span
              className="block"
              style={{
                width: 11,
                height: 11,
                transform: 'rotate(45deg)',
                background: 'var(--ball)',
                boxShadow: '0 0 10px var(--ball)',
                borderRadius: 2,
              }}
            />
          </div>
        ))}

        {/* Kepala pemutar */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${pct(t)}%` }}
        >
          <span
            className="block rounded-full"
            style={{
              width: 14,
              height: 14,
              background: 'var(--focus-selected)',
              boxShadow: `0 0 0 2px ${accent}, 0 0 14px ${accent}`,
            }}
          />
        </div>
      </div>

      {/* Tombol fase — alternatif klik untuk layar sentuh & keyboard */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {phases.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onJumpToPhase(i)}
            aria-current={i === activePhaseIndex ? 'step' : undefined}
            className={cx(
              'hud shrink-0 rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-wide transition-colors duration-fast',
              i === activePhaseIndex
                ? 'text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
            style={
              i === activePhaseIndex
                ? {
                    borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`,
                    background: `color-mix(in srgb, ${accent} 14%, transparent)`,
                  }
                : undefined
            }
          >
            {i + 1}. {localize(p.title)}
          </button>
        ))}
      </div>
    </div>
  )
}
