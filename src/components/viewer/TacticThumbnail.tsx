'use client'

/**
 * Thumbnail taktik untuk kartu perpustakaan (S-06).
 *
 * PRD §11 S-06: "Thumbnail animasi berputar saat hover."
 *
 * Memakai renderer dan engine yang SAMA dengan Tactic Viewer, bukan gambar
 * statis. Konsekuensinya: thumbnail tidak pernah bisa menampilkan formasi yang
 * berbeda dari taktik sebenarnya, dan menambah taktik tidak perlu membuat aset
 * gambar apa pun.
 *
 * Demi performa, animasi hanya berjalan saat hover/fokus — sepuluh kartu yang
 * semuanya beranimasi akan menghabiskan anggaran frame halaman perpustakaan.
 */

import { useEffect, useMemo, useRef } from 'react'

import { MasterClock, getStateContext, type Tactic } from '@/engine/runtime'
import { useIsClient } from '@/lib/hydration'
import { CourtCanvas } from '@/renderer2d/CourtCanvas'
import { DEFAULT_LAYERS } from '@/renderer2d/types'
import { effectiveQuality, effectiveReducedMotion, useSettings } from '@/stores/settingsStore'

export interface TacticThumbnailProps {
  tactic: Tactic
  /** Animasi berjalan (hover/fokus kartu) */
  active: boolean
  className?: string
}

export function TacticThumbnail({ tactic, active, className }: TacticThumbnailProps) {
  const settings = useSettings()
  const reducedMotion = effectiveReducedMotion(settings)
  const quality = effectiveQuality(settings)

  const { ctx } = useMemo(() => getStateContext(tactic, []), [tactic])

  const clock = useMemo(
    () =>
      new MasterClock({
        duration: tactic.duration,
        phases: tactic.phases,
        // Thumbnail tidak memakai bullet time: melambat di kartu kecil hanya
        // terlihat seperti animasi yang macet.
        decisions: [],
        loop: true,
      }),
    [tactic],
  )

  useEffect(() => () => clock.destroy(), [clock])

  useEffect(() => {
    if (active && !reducedMotion) clock.play()
    else {
      clock.pause()
      // Kembali ke formasi awal agar kartu selalu memperlihatkan "formasi awal"
      // (butir 2 anatomi halaman taktik PRD §6) saat tidak aktif.
      clock.seek(0)
    }
  }, [active, clock, reducedMotion])

  // Lapisan thumbnail disederhanakan: label dan jalur umpan membuat kartu kecil
  // terlalu padat untuk dibaca.
  const layers = useMemo(
    () => ({ ...DEFAULT_LAYERS, labels: false, passLanes: false, trails: false }),
    [],
  )

  const mounted = useIsClient()

  const ref = useRef<HTMLDivElement | null>(null)

  return (
    <div ref={ref} className={className} aria-hidden="true">
      {mounted && (
        <CourtCanvas
          ctx={ctx}
          clock={clock}
          layers={layers}
          pov={{ playerId: null, blend: 0 }}
          quality={quality}
          reducedMotion={reducedMotion}
          skipBootUp
          className="h-full w-full"
          ariaLabel=""
        />
      )}
    </div>
  )
}
