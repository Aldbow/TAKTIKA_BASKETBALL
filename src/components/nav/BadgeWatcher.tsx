'use client'

/**
 * Pemberi lencana — F-25.
 *
 * Aturan lencana ada di src/lib/xp.ts dan murni dihitung dari progres. Komponen
 * ini memantau progres, mencatat lencana yang baru layak didapat, lalu
 * menampilkannya sekali dengan animasi A-18 ("lencana berputar 360° sekali").
 */

import { useEffect, useState } from 'react'

import { findBadge, type BadgeDef } from '@/lib/xp'
import { useProgressHydrated } from '@/lib/hydration'
import { newlyEarnedBadges, useProgress, type ProgressState } from '@/stores/progressStore'

const TOAST_MS = 4200

export function BadgeWatcher() {
  const hydrated = useProgressHydrated()
  const [queue, setQueue] = useState<BadgeDef[]>([])

  useEffect(() => {
    if (!hydrated) return
    let off: (() => void) | null = null
    let cancelled = false

    // Kurikulum (untuk lencana level) dimuat terpisah: watcher ini ada di
    // setiap halaman, termasuk landing yang tidak butuh kurikulum di muatan awal.
    void import('@/lib/learning').then(({ isLevelDone }) => {
      if (cancelled) return
      const check = (s: ProgressState) => {
        const fresh = newlyEarnedBadges(s, {
          level1Done: isLevelDone(s.lessons, 1),
          level2Done: isLevelDone(s.lessons, 2),
        })
        if (fresh.length === 0) return
        s.awardBadges(fresh)
        const defs = fresh.map(findBadge).filter((b): b is BadgeDef => Boolean(b))
        setQueue((q) => [...q, ...defs])
      }
      // Periksa sekali (lencana yang layak tapi belum tercatat), lalu setiap
      // kali progres berubah.
      check(useProgress.getState())
      off = useProgress.subscribe(check)
    })

    return () => {
      cancelled = true
      off?.()
    }
  }, [hydrated])

  const current = queue[0]

  useEffect(() => {
    if (!current) return
    const id = window.setTimeout(() => setQueue((q) => q.slice(1)), TOAST_MS)
    return () => window.clearTimeout(id)
  }, [current])

  if (!current) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[calc(var(--tabbar-height)+1rem+env(safe-area-inset-bottom))] right-4 z-50 tablet:bottom-6"
    >
      <div
        key={current.id}
        className="glass flex animate-rise-in items-center gap-3 p-3 pr-5 shadow-glass"
        style={{ borderColor: 'color-mix(in srgb, var(--ball) 50%, transparent)' }}
      >
        <span className="inline-block animate-spin-once text-3xl" aria-hidden="true">
          {current.emoji}
        </span>
        <div>
          <p className="hud text-[10px] uppercase tracking-[0.16em] text-[var(--ball)]">Lencana baru</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{current.title}</p>
        </div>
      </div>
    </div>
  )
}
