/**
 * Snapshot API — PRD §14:
 *   "getState(t) untuk renderer, kuis, ekspor video, dan pengujian"
 *
 * Keputusan arsitektur PRD §14 yang dijaga ketat di sini:
 *   "Satu sumber kebenaran: renderer tidak menyimpan posisi sendiri; semua
 *    diambil dari getState(t). Inilah yang membuat 2D <-> 3D dan perpindahan
 *    POV mulus."
 *   "Deterministik: fungsi getState(t) murni, sehingga pengujian otomatis bisa
 *    membandingkan posisi di waktu mana pun."
 *
 * Karena itu TIDAK ADA keacakan, tanggal, atau state frame sebelumnya di modul
 * ini. Efek dekoratif (partikel, riak) dihitung di renderer dengan PRNG
 * ber-seed, sesuai PRD §10 "Orkestrasi".
 */

import {
  type Vec2,
  PAINT_HALF_WIDTH,
  clamp,
  courtSide,
  dist,
  distToRim,
  isInPaint,
  shotValue,
} from './court'
import { type BallSegment, type BallState, ballStateAt, buildBallTimeline, passLaneClearance } from './ball'
import {
  type CompiledEvent,
  type CompiledTactic,
  playerFacingAt,
  playerMotionAt,
  predictionPath,
  trailPath,
} from './interpolator'
import type { Decision, Phase, PlayerId, Team, Tactic } from './schema'

/* -------------------------------------------------------------------------- */
/* Bentuk keadaan                                                             */
/* -------------------------------------------------------------------------- */

export interface PlayerState {
  id: PlayerId
  team: Team
  /** Label tampil: "1".."5" untuk menyerang, "X1".."X5" untuk bertahan */
  label: string
  position: Vec2
  facing: number
  /** Kecepatan sesaat (m/s) */
  speed: number
  heading: Vec2
  /** Memegang bola saat ini */
  hasBall: boolean
  /** Jenis event gerak yang sedang dijalankan, bila ada */
  action: CompiledEvent['type'] | null
  /** Id event gerak aktif */
  actionEventId: string | null
  /** Bek: pemain yang dijaga */
  guards?: PlayerId
  /** Jarak ke ring (meter) */
  distToRim: number
  /** Berada di dalam paint */
  inPaint: boolean
  /** Sisi lapangan relatif bola */
  side: 'strong' | 'weak' | 'middle'
}

/** Event yang sedang berlangsung pada waktu t, lengkap dengan progresnya. */
export interface ActiveEvent {
  id: string
  type: CompiledEvent['type']
  actor: PlayerId
  target: string | undefined
  label: string | undefined
  /** Progres 0..1 di dalam event */
  progress: number
  tStart: number
  tEnd: number
  /** Jalur event dalam meter (bila ada) */
  path: Vec2[] | null
  /** Jarak yang sudah ditempuh aktor pada jalur ini (meter) */
  travelled: number
  wrong: boolean
}

/** Metrik spacing untuk lapisan A-14. */
export interface SpacingLink {
  a: PlayerId
  b: PlayerId
  distance: number
  /** hijau >= 4,5 m · kuning 3-4,5 m · merah < 3 m (PRD §10 A-14) */
  grade: 'good' | 'tight' | 'bad'
}

/** Jalur umpan untuk lapisan A-16. */
export interface PassLane {
  from: PlayerId
  to: PlayerId
  fromPos: Vec2
  toPos: Vec2
  /** Jarak bek terdekat ke jalur (meter) */
  clearance: number
  /** 0..1 — lebar berkas cahaya; merah bila terhalang */
  safety: number
  blocked: boolean
  /** Nilai tembakan bila penerima langsung menembak */
  shotValue: 2 | 3
}

export interface CourtState {
  /** Waktu taktik (detik) */
  t: number
  players: PlayerState[]
  /** Peta untuk akses cepat per id */
  byId: Record<PlayerId, PlayerState>
  ball: BallState
  phase: Phase | null
  phaseIndex: number
  /** Progres 0..1 di dalam fase aktif */
  phaseProgress: number
  activeEvents: ActiveEvent[]
  /**
   * Keputusan yang jendela bullet time-nya sedang aktif (A-09), atau null.
   * Jam induk memakai ini untuk meramp timeScale ke 0,3x.
   */
  decision: Decision | null
  /** Jarak waktu ke keputusan berikutnya (detik), Infinity bila tidak ada */
  timeToDecision: number
  spacing: SpacingLink[]
  passLanes: PassLane[]
  /** Sudah mencapai akhir taktik */
  ended: boolean
}

/* -------------------------------------------------------------------------- */
/* Jendela bullet time                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Lebar jendela (detik) sebelum dan sesudah momen keputusan tempat waktu
 * melambat. PRD §7: "waktu melambat ke 0,3x"; PRD §10 A-09: ramp 250 ms masuk.
 */
export const DECISION_LEAD = 0.45
export const DECISION_TRAIL = 1.1

export function decisionAt(tactic: Tactic, t: number): Decision | null {
  for (const d of tactic.decisions) {
    if (t >= d.t - DECISION_LEAD && t <= d.t + DECISION_TRAIL) return d
  }
  return null
}

export function nextDecisionDelta(tactic: Tactic, t: number): number {
  let best = Infinity
  for (const d of tactic.decisions) {
    const delta = d.t - DECISION_LEAD - t
    if (delta >= 0 && delta < best) best = delta
  }
  return best
}

/* -------------------------------------------------------------------------- */
/* Fase                                                                       */
/* -------------------------------------------------------------------------- */

export function phaseAt(tactic: Tactic, t: number): { phase: Phase | null; index: number } {
  const phases = tactic.phases
  for (let i = 0; i < phases.length; i++) {
    const p = phases[i] as Phase
    if (t >= p.tStart && t < p.tEnd) return { phase: p, index: i }
  }
  if (phases.length === 0) return { phase: null, index: -1 }
  // Di luar semua fase: jepit ke fase pertama/terakhir agar panel tidak kosong.
  const first = phases[0] as Phase
  if (t < first.tStart) return { phase: first, index: 0 }
  return { phase: phases[phases.length - 1] as Phase, index: phases.length - 1 }
}

/* -------------------------------------------------------------------------- */
/* getState                                                                   */
/* -------------------------------------------------------------------------- */

/** Konteks yang sudah dipra-hitung: dipakai ulang antar frame. */
export interface StateContext {
  compiled: CompiledTactic
  ballTimeline: BallSegment[]
}

export function createStateContext(compiled: CompiledTactic): StateContext {
  return { compiled, ballTimeline: buildBallTimeline(compiled) }
}

/**
 * FUNGSI INTI APLIKASI.
 *
 * Murni: dipanggil dua kali dengan t yang sama selalu memberi hasil identik,
 * dan memanggil dengan t menurun memutar taktik mundur dengan tepat.
 */
export function getState(ctx: StateContext, tRaw: number): CourtState {
  const ct = ctx.compiled
  const t = clamp(tRaw, 0, ct.duration)
  const tactic = ct.tactic

  const ball = ballStateAt(ct, ctx.ballTimeline, t)

  const players: PlayerState[] = []
  const byId: Record<PlayerId, PlayerState> = {}

  for (const p of tactic.players) {
    const motion = playerMotionAt(ct, p.id, t)
    const facing = playerFacingAt(ct, p.id, t, motion, ball.holder)
    const state: PlayerState = {
      id: p.id,
      team: p.team,
      label: p.id.startsWith('O') ? p.id.slice(1) : p.id,
      position: motion.position,
      facing,
      speed: motion.speed,
      heading: motion.heading,
      hasBall: ball.holder === p.id,
      action: motion.activeEvent?.type ?? null,
      actionEventId: motion.activeEvent?.id ?? null,
      ...(p.guards ? { guards: p.guards } : {}),
      distToRim: distToRim(motion.position, ct.court),
      inPaint: ct.court === 'half' ? isInPaint(motion.position) : false,
      side: courtSide(motion.position, ball.position),
    }
    players.push(state)
    byId[p.id] = state
  }

  // Event aktif — termasuk umpan/tembakan yang tidak memindahkan aktornya.
  const activeEvents: ActiveEvent[] = []
  for (const ce of ct.events) {
    if (t < ce.t || t >= ce.tEnd) continue
    const span = Math.max(1e-6, ce.tEnd - ce.t)
    activeEvents.push({
      id: ce.id,
      type: ce.type,
      actor: ce.actor,
      target: ce.target,
      label: ce.raw.label,
      progress: (t - ce.t) / span,
      tStart: ce.t,
      tEnd: ce.tEnd,
      path: ce.lut ? ce.lut.control.map((p) => ({ x: p.x, y: p.y })) : null,
      travelled: ce.motion?.distanceAt(t - ce.t) ?? 0,
      wrong: ce.raw.wrong ?? false,
    })
  }

  const { phase, index } = phaseAt(tactic, t)
  const phaseProgress = phase
    ? clamp((t - phase.tStart) / Math.max(1e-6, phase.tEnd - phase.tStart), 0, 1)
    : 0

  const offense = players.filter((p) => p.team === 'offense')
  const defenders = players.filter((p) => p.team === 'defense').map((p) => p.position)

  return {
    t,
    players,
    byId,
    ball,
    phase,
    phaseIndex: index,
    phaseProgress,
    activeEvents,
    decision: decisionAt(tactic, t),
    timeToDecision: nextDecisionDelta(tactic, t),
    spacing: computeSpacing(offense),
    passLanes: computePassLanes(offense, defenders, ball.holder),
    ended: t >= ct.duration - 1e-6,
  }
}

/* -------------------------------------------------------------------------- */
/* Lapisan analitik                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Lapisan spacing (A-14). PRD §5 modul 2.1: "jarak ideal antarpemain sekitar
 * 4,5-5,5 m". PRD §10 A-14: "garis jarak hijau >= 4,5 m, kuning 3-4,5 m,
 * merah < 3 m".
 *
 * Hanya pasangan penyerang yang bersebelahan di sekeliling lapangan dihitung;
 * menggambar semua 10 pasang akan membuat lapangan penuh garis dan melanggar
 * prinsip "satu layar, satu ide".
 */
export function computeSpacing(offense: readonly PlayerState[]): SpacingLink[] {
  if (offense.length < 2) return []

  // Urutkan menurut sudut di sekitar ring supaya "bersebelahan" berarti
  // bersebelahan di lantai, bukan bersebelahan di nomor punggung.
  const sorted = [...offense].sort(
    (a, b) => Math.atan2(a.position.y, a.position.x) - Math.atan2(b.position.y, b.position.x),
  )

  const links: SpacingLink[] = []
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i] as PlayerState
    const b = sorted[(i + 1) % sorted.length] as PlayerState
    if (sorted.length === 2 && i === 1) break
    const d = dist(a.position, b.position)
    links.push({
      a: a.id,
      b: b.id,
      distance: d,
      grade: d >= 4.5 ? 'good' : d >= 3 ? 'tight' : 'bad',
    })
  }
  return links
}

/**
 * Lapisan jalur umpan (A-16): "Berkas cahaya dari pembawa bola ke calon
 * penerima; lebar berkas = tingkat keamanan; berkas merah bila terhalang bek."
 */
export function computePassLanes(
  offense: readonly PlayerState[],
  defenders: readonly Vec2[],
  holder: PlayerId | null,
): PassLane[] {
  if (!holder) return []
  const from = offense.find((p) => p.id === holder)
  if (!from) return []

  const lanes: PassLane[] = []
  for (const p of offense) {
    if (p.id === holder) continue
    const clearance = passLaneClearance(from.position, p.position, defenders)
    // Bek dalam 0,6 m dari jalur = terhalang; 1,8 m atau lebih = aman penuh.
    const safety = clamp((clearance - 0.6) / 1.2, 0, 1)
    lanes.push({
      from: holder,
      to: p.id,
      fromPos: from.position,
      toPos: p.position,
      clearance,
      safety,
      blocked: clearance < 0.6,
      shotValue: shotValue(p.position),
    })
  }
  return lanes
}

/* -------------------------------------------------------------------------- */
/* Pembantu untuk UI & renderer                                               */
/* -------------------------------------------------------------------------- */

/** Garis prediksi A-03 untuk pemain POV terpilih. */
export function getPredictionPath(ctx: StateContext, playerId: PlayerId, t: number): Vec2[] {
  return predictionPath(ctx.compiled, playerId, t, 0.6)
}

/** Jejak gerak A-04. */
export function getTrail(ctx: StateContext, playerId: PlayerId, t: number): Vec2[] {
  return trailPath(ctx.compiled, playerId, t, 1.2)
}

/**
 * Apakah ada pemain yang berada di paint lebih dari 3 detik berturut-turut?
 * Dipakai pelajaran modul 1.4 "Aturan Waktu" untuk menyorot pelanggaran 3 detik.
 */
export function paintDwellSeconds(
  ctx: StateContext,
  playerId: PlayerId,
  t: number,
  step = 0.1,
): number {
  let dwell = 0
  for (let tt = t; tt >= 0; tt -= step) {
    const pos = playerMotionAt(ctx.compiled, playerId, tt).position
    if (!isInPaint(pos)) break
    dwell += step
  }
  return dwell
}

/** Lebar paint dipakai pelajaran 1.2 — diekspor ulang agar UI tidak impor court.ts. */
export const PAINT_HALF = PAINT_HALF_WIDTH
