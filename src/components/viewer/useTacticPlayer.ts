'use client'

/**
 * Hook yang memiliki jam induk sebuah lapangan taktik.
 *
 * Mengapa hook, bukan store: waktu berubah 60 kali per detik. Menaruhnya di
 * store React berarti 60 render per detik untuk seluruh pohon komponen, dan
 * target 60 fps PRD §15 langsung hilang. Jadi:
 *
 *   - MasterClock menyimpan waktu, di luar React
 *   - CourtCanvas membaca clock.time langsung di dalam loop rAF-nya
 *   - komponen yang butuh waktu untuk TEKS (timeline, panel fase, checklist POV)
 *     berlangganan snapshot yang di-throttle ke ~12 Hz
 *
 * 12 Hz cukup untuk teks dan penanda timeline — mata tidak bisa membedakan label
 * fase yang diperbarui 12 atau 60 kali per detik, tetapi React bisa.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import {
  MasterClock,
  TacticEventBus,
  getState,
  getStateContext,
  type ClockSnapshot,
  type CourtState,
  type PlaybackSpeed,
  type StateContext,
  type Tactic,
} from '@/engine/runtime'

/** Frekuensi pembaruan state untuk komponen teks (Hz). */
const TEXT_UPDATE_HZ = 12

export interface TacticPlayer {
  clock: MasterClock
  bus: TacticEventBus
  ctx: StateContext
  /** Keadaan lapangan terakhir untuk komponen teks (di-throttle) */
  state: CourtState
  snapshot: ClockSnapshot
  play: () => void
  pause: () => void
  toggle: () => void
  seek: (t: number) => void
  nudge: (delta: number) => void
  stepPhase: (dir: 1 | -1) => void
  replayPhase: () => void
  jumpToPhase: (index: number) => void
  setSpeed: (speed: PlaybackSpeed) => void
  slower: () => void
  faster: () => void
}

export interface UseTacticPlayerOptions {
  tactic: Tactic
  activeBranches: readonly string[]
  reducedMotion: boolean
  /** Mulai memutar otomatis saat dipasang (hero landing page, thumbnail) */
  autoPlay?: boolean
  loop?: boolean
  onPhaseChange?: (phaseId: string | null) => void
  onDecisionEnter?: (decisionId: string) => void
  onTacticEnd?: () => void
}

export function useTacticPlayer({
  tactic,
  activeBranches,
  reducedMotion,
  autoPlay = false,
  loop = false,
  onPhaseChange,
  onDecisionEnter,
  onTacticEnd,
}: UseTacticPlayerOptions): TacticPlayer {
  // Konteks engine di-cache per (taktik, kombinasi cabang) oleh loader.
  const branchKeyStr = [...activeBranches].sort().join('|')
  const { ctx } = useMemo(
    () => getStateContext(tactic, activeBranches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tactic, branchKeyStr],
  )

  const bus = useMemo(() => new TacticEventBus(), [])

  const clock = useMemo(
    () =>
      new MasterClock({
        duration: tactic.duration,
        phases: tactic.phases,
        decisions: tactic.decisions,
        reducedMotion,
        loop,
      }),
    // Jam dibuat ulang hanya bila TAKTIK berganti. Mengganti cabang tidak boleh
    // membuat jam baru — itulah syarat F-14 "tanpa kembali ke awal".
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tactic.id],
  )

  const [snapshot, setSnapshot] = useState<ClockSnapshot>(() => clock.snapshot())
  const [state, setState] = useState<CourtState>(() => getState(ctx, clock.time))

  // Callback disimpan di ref agar efek langganan tidak dibuat ulang tiap render.
  const cbRef = useRef({ onPhaseChange, onDecisionEnter, onTacticEnd })
  useLayoutEffect(() => {
    cbRef.current = { onPhaseChange, onDecisionEnter, onTacticEnd }
  })

  /* ---------------------------------------------------------------------- */
  /* Kurangi Gerak & siklus hidup jam                                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    clock.setReducedMotion(reducedMotion)
  }, [clock, reducedMotion])

  useEffect(() => () => clock.destroy(), [clock])

  useEffect(() => {
    if (autoPlay) clock.play()
  }, [autoPlay, clock])

  /* ---------------------------------------------------------------------- */
  /* Pembaruan teks yang di-throttle                                        */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let raf = 0
    let lastEmit = 0
    const interval = 1000 / TEXT_UPDATE_HZ
    let lastT = -1
    let lastPlaying: boolean | null = null

    const tick = (now: number) => {
      // Perbarui bila cukup waktu berlalu DAN ada yang berubah.
      const snap = clock.snapshot()
      const changed = snap.t !== lastT || snap.playing !== lastPlaying
      if (changed && now - lastEmit >= interval) {
        lastEmit = now
        lastT = snap.t
        lastPlaying = snap.playing
        setSnapshot(snap)
        setState(getState(ctx, snap.t))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [clock, ctx])

  /* ---------------------------------------------------------------------- */
  /* Event bus -> callback                                                  */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const offPhase = bus.on('phasechange', (e) => cbRef.current.onPhaseChange?.(e.phase?.id ?? null))
    const offDecision = bus.on('decisionenter', (e) => {
      if (e.decision) cbRef.current.onDecisionEnter?.(e.decision.id)
    })
    const offEnd = bus.on('tacticend', () => cbRef.current.onTacticEnd?.())
    return () => {
      offPhase()
      offDecision()
      offEnd()
    }
  }, [bus])

  // Mengganti cabang membuat perbandingan frame-ke-frame bus tidak sahih.
  useEffect(() => {
    bus.reset()
  }, [bus, branchKeyStr])

  /* ---------------------------------------------------------------------- */
  /* Kendali                                                                */
  /* ---------------------------------------------------------------------- */

  const play = useCallback(() => clock.play(), [clock])
  const pause = useCallback(() => clock.pause(), [clock])
  const toggle = useCallback(() => clock.toggle(), [clock])
  const seek = useCallback((t: number) => clock.seek(t), [clock])
  const nudge = useCallback((d: number) => clock.nudge(d), [clock])
  const stepPhase = useCallback((dir: 1 | -1) => clock.stepPhase(dir), [clock])
  const replayPhase = useCallback(() => clock.replayPhase(), [clock])
  const jumpToPhase = useCallback((i: number) => clock.jumpToPhase(i), [clock])
  const setSpeed = useCallback((s: PlaybackSpeed) => clock.setSpeed(s), [clock])
  const slower = useCallback(() => clock.slower(), [clock])
  const faster = useCallback(() => clock.faster(), [clock])

  return {
    clock,
    bus,
    ctx,
    state,
    snapshot,
    play,
    pause,
    toggle,
    seek,
    nudge,
    stepPhase,
    replayPhase,
    jumpToPhase,
    setSpeed,
    slower,
    faster,
  }
}
