'use client'

/**
 * Mini-animasi istilah — F-08: "tiap istilah dengan mini-animasi 3-6 detik".
 *
 * Bukan video: potongan waktu [from, to] dari taktik yang sudah ada, diputar
 * berulang oleh Tactic Engine dan renderer yang sama dengan Tactic Viewer.
 * Jam dan konteks engine milik komponen ini sendiri (bukan viewerStore), jadi
 * beberapa klip bisa tampil bersamaan tanpa saling memengaruhi.
 */

import { useEffect, useMemo, useState } from 'react'

import type { TermClip as TermClipData } from '@content/glossary'
import { MasterClock, getStateContext, t as localize } from '@/engine'
import { getTacticById } from '@/lib/content'
import { CourtCanvas } from '@/renderer2d/CourtCanvas'
import { DEFAULT_LAYERS, type LayerFlags } from '@/renderer2d/types'
import { effectiveQuality, effectiveReducedMotion, useSettings } from '@/stores/settingsStore'
import { Icon, IconButton } from '@/components/ui'

export function TermClip({
  clip,
  label,
  className,
}: {
  clip: TermClipData
  /** Nama istilah — untuk label aksesibilitas */
  label: string
  className?: string
}) {
  const settings = useSettings()
  const reducedMotion = effectiveReducedMotion(settings)
  const quality = effectiveQuality(settings)

  const tactic = getTacticById(clip.tacticId)

  const ctx = useMemo(
    () => (tactic ? getStateContext(tactic, clip.branches ?? []).ctx : null),
    [tactic, clip.branches],
  )

  const clock = useMemo(
    () =>
      tactic
        ? new MasterClock({ duration: tactic.duration, phases: tactic.phases, decisions: [] })
        : null,
    [tactic],
  )

  // Kurangi Gerak: klip tidak berputar sendiri; pengguna menekan putar.
  const [playing, setPlaying] = useState(!reducedMotion)

  useEffect(() => {
    if (!clock) return
    clock.seek(clip.from)
    // Ulang di dalam jendela [from, to] — tanpa lompatan ke awal taktik.
    const off = clock.subscribe((snap) => {
      if (snap.t >= clip.to - 1e-3) clock.seek(clip.from)
    })
    return () => {
      off()
      clock.destroy()
    }
  }, [clock, clip.from, clip.to])

  useEffect(() => {
    if (!clock) return
    if (playing) clock.play()
    else clock.pause()
  }, [clock, playing])

  const layers = useMemo<LayerFlags>(() => {
    const out: LayerFlags = { ...DEFAULT_LAYERS }
    for (const key of clip.layers ?? []) out[key] = true
    return out
  }, [clip.layers])

  if (!tactic || !ctx) return null

  return (
    <figure className={className}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[var(--bg-void)]">
        <CourtCanvas
          ctx={ctx}
          clock={clock}
          layers={layers}
          pov={{ playerId: clip.pov ?? null, blend: clip.pov ? 1 : 0 }}
          quality={quality}
          reducedMotion={reducedMotion}
          skipBootUp
          className="absolute inset-0"
          ariaLabel={`Mini-animasi ${label} dari taktik ${localize(tactic.title)}`}
        />
        <div className="absolute bottom-2 right-2">
          <IconButton
            label={playing ? 'Jeda animasi' : 'Putar animasi'}
            size="sm"
            onClick={() => setPlaying((v) => !v)}
            className="bg-[color-mix(in_srgb,var(--bg-void)_70%,transparent)]"
          >
            {playing ? <Icon.Pause size={15} /> : <Icon.Play size={15} />}
          </IconButton>
        </div>
      </div>
      <figcaption className="mt-1.5 text-xs text-[var(--text-secondary)]">
        Potongan dari <span className="text-[var(--text-primary)]">{localize(tactic.title)}</span>
        {clip.pov ? ` · POV ${clip.pov.startsWith('O') ? clip.pov.slice(1) : clip.pov}` : ''}
      </figcaption>
    </figure>
  )
}
