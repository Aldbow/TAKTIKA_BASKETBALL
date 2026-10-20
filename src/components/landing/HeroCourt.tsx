'use client'

/**
 * Lapangan animasi hero landing — dimuat sebagai chunk terpisah.
 *
 * Engine + renderer 2D sekitar 50 KB gzip. Teks hero (yang menjadi LCP) tidak
 * membutuhkannya, jadi lapangan ini dimuat setelah halaman tampil — menjaga
 * JS awal landing dalam anggaran PRD §15 (<= 200 KB gzip). Animasi tetap mulai
 * otomatis tanpa klik (PRD §12 Alur 1).
 */

import { useEffect, useMemo, useState } from 'react'

import { MasterClock, getStateContext, t as localize, type PlayerId, type Tactic } from '@/engine/runtime'
import { CourtCanvas } from '@/renderer2d/CourtCanvas'
import { DEFAULT_LAYERS } from '@/renderer2d/types'
import type { QualityTier } from '@/renderer2d/palette'

export interface HeroCourtProps {
  tactic: Tactic
  pov: PlayerId | null
  /** Progres gulir hero 0..1 (A-21) */
  scrollU: number
  reducedMotion: boolean
  quality: QualityTier
}

export function HeroCourt({ tactic, pov, scrollU, reducedMotion, quality }: HeroCourtProps) {
  const [povBlend, setPovBlend] = useState(0)

  const { ctx } = useMemo(() => getStateContext(tactic, []), [tactic])

  const clock = useMemo(
    () =>
      new MasterClock({
        duration: tactic.duration,
        phases: tactic.phases,
        decisions: tactic.decisions,
        reducedMotion,
        loop: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tactic.id],
  )

  useEffect(() => {
    clock.setReducedMotion(reducedMotion)
    clock.play()
    return () => clock.destroy()
  }, [clock, reducedMotion])

  // Transisi POV mini. Tanpa POV atau dengan Kurangi Gerak, blend diturunkan
  // saat render (lihat `blend` di bawah) — efek ini hanya menganimasikan dolly
  // 900 ms.
  useEffect(() => {
    if (!pov || reducedMotion) return
    let raf = 0
    const start = performance.now()
    const step = (now: number) => {
      const u = Math.min(1, (now - start) / 900)
      setPovBlend(u)
      if (u < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [pov, reducedMotion])

  const camera = useMemo(
    () => ({
      mode: 'tactical' as const,
      tilt: 0,
      orbit: 0,
      zoom: 1 + scrollU * 0.35,
      focus: null,
    }),
    [scrollU],
  )

  return (
    <CourtCanvas
      ctx={ctx}
      clock={clock}
      layers={{ ...DEFAULT_LAYERS, labels: true }}
      pov={{ playerId: pov, blend: !pov ? 0 : reducedMotion ? 1 : povBlend }}
      camera={camera}
      quality={quality}
      reducedMotion={reducedMotion}
      className="absolute inset-0"
      ariaLabel={`Pratinjau animasi taktik ${localize(tactic.title)}`}
    />
  )
}
