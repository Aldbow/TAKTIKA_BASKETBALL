/**
 * Event Bus — PRD §14:
 *   "Memberi tahu UI saat fase berganti, keputusan tercapai, atau umpan terjadi."
 *
 * Dipakai oleh:
 *  - panel POV (mencentang langkah saat fase berjalan — F-13)
 *  - narasi fase lewat aria-live (PRD §15 aksesibilitas)
 *  - kuis Baca & Bereaksi (membekukan lapangan di titik jeda — F-18)
 *  - analitik (PRD §16)
 *  - efek renderer (riak kontak screen A-06, partikel tembakan A-08)
 *
 * Bus ini mendeteksi perubahan dengan MEMBANDINGKAN dua CourtState berurutan,
 * bukan dengan menyimpan state sendiri. Akibatnya: menggeser timeline mundur
 * juga memancarkan event dengan benar, dan bus tidak pernah "kehilangan sinkron"
 * dengan jam induk.
 */

import type { CourtState } from './state'
import type { Decision, Phase, PlayerId } from './schema'

export type TacticEventName =
  | 'phasechange'
  | 'decisionenter'
  | 'decisionexit'
  | 'pass'
  | 'screen'
  | 'shot'
  | 'cut'
  | 'handoff'
  | 'tacticend'
  | 'seek'

export interface TacticBusEvent {
  name: TacticEventName
  t: number
  /** Arah waktu: maju atau mundur (geser timeline) */
  direction: 1 | -1
  phase?: Phase | null
  previousPhase?: Phase | null
  decision?: Decision | null
  actor?: PlayerId
  target?: string
  eventId?: string
  label?: string
  made?: boolean
}

type Handler = (e: TacticBusEvent) => void

export class TacticEventBus {
  private handlers = new Map<TacticEventName, Set<Handler>>()
  private anyHandlers = new Set<Handler>()
  private prev: CourtState | null = null

  on(name: TacticEventName, fn: Handler): () => void {
    const set = this.handlers.get(name) ?? new Set<Handler>()
    set.add(fn)
    this.handlers.set(name, set)
    return () => set.delete(fn)
  }

  onAny(fn: Handler): () => void {
    this.anyHandlers.add(fn)
    return () => this.anyHandlers.delete(fn)
  }

  private dispatch(e: TacticBusEvent): void {
    const set = this.handlers.get(e.name)
    if (set) for (const fn of set) fn(e)
    for (const fn of this.anyHandlers) fn(e)
  }

  /** Lupakan state sebelumnya — dipakai saat taktik atau cabang berganti. */
  reset(): void {
    this.prev = null
  }

  /**
   * Beri bus keadaan frame terbaru; bus memancarkan perbedaan terhadap frame
   * sebelumnya. Dipanggil sekali per frame oleh renderer.
   */
  update(state: CourtState): void {
    const prev = this.prev
    this.prev = state

    if (!prev) return

    const direction: 1 | -1 = state.t >= prev.t ? 1 : -1

    // Lompatan besar = pengguna menggeser timeline.
    if (Math.abs(state.t - prev.t) > 0.5) {
      this.dispatch({ name: 'seek', t: state.t, direction })
    }

    // Pergantian fase (A-10).
    if (state.phase?.id !== prev.phase?.id) {
      this.dispatch({
        name: 'phasechange',
        t: state.t,
        direction,
        phase: state.phase,
        previousPhase: prev.phase,
      })
    }

    // Masuk / keluar jendela keputusan (A-09).
    if (state.decision?.id !== prev.decision?.id) {
      if (prev.decision) {
        this.dispatch({ name: 'decisionexit', t: state.t, direction, decision: prev.decision })
      }
      if (state.decision) {
        this.dispatch({ name: 'decisionenter', t: state.t, direction, decision: state.decision })
      }
    }

    // Event yang baru mulai di frame ini.
    const prevIds = new Set(prev.activeEvents.map((e) => e.id))
    for (const e of state.activeEvents) {
      if (prevIds.has(e.id)) continue
      const name = eventNameFor(e.type)
      if (!name) continue
      this.dispatch({
        name,
        t: state.t,
        direction,
        actor: e.actor,
        target: e.target,
        eventId: e.id,
        label: e.label,
      })
    }

    // Akhir taktik.
    if (state.ended && !prev.ended) {
      this.dispatch({ name: 'tacticend', t: state.t, direction })
    }
  }
}

function eventNameFor(type: string): TacticEventName | null {
  switch (type) {
    case 'pass':
      return 'pass'
    case 'screen':
      return 'screen'
    case 'shot':
      return 'shot'
    case 'cut':
      return 'cut'
    case 'handoff':
      return 'handoff'
    default:
      return null
  }
}
