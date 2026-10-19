/**
 * Interpolator — PRD §14 komponen Tactic Engine:
 *   "Menghitung posisi pemain, bola, dan event aktif untuk waktu t."
 *
 * Dua tahap:
 *
 *  1. KOMPILASI (sekali per taktik + kombinasi cabang): setiap event gerak
 *     diubah menjadi PathLUT + MotionProfile. Di sinilah durasi diturunkan dari
 *     profil kecepatan bila event tidak menyebut `dur`.
 *
 *  2. PENYAMPELAN (tiap frame, murni): posisi pemain pada waktu t.
 *
 * Prinsip PRD §10 yang ditegakkan di sini — "Kontinu: tidak ada objek yang
 * muncul atau pindah tiba-tiba". Saat tidak ada event gerak aktif, pemain
 * DITAHAN di titik akhir event terakhirnya, bukan dikembalikan ke posisi awal.
 */

import {
  type Vec2,
  facingToVector,
  lerpAngle,
  rimPosition,
  vectorToFacing,
} from './court'
import {
  type PathLUT,
  buildPath,
  pathEnd,
  pathStart,
  samplePathAtDistance,
} from './geometry'
import {
  type MotionProfile,
  MIN_PASS_SEC,
  SHOT_FLIGHT_SEC,
  buildMotionProfile,
  naturalDuration,
} from './speed'
import type { CourtKind } from './court'
import type { Player, PlayerId, SpeedProfile, Tactic, TacticEvent } from './schema'

/** Jenis event yang benar-benar memindahkan aktornya. */
const MOTION_TYPES = new Set(['move', 'dribble', 'cut', 'screen', 'rotate', 'rebound'])

export function isMotionEvent(e: TacticEvent): boolean {
  return MOTION_TYPES.has(e.type) && (e.path?.length ?? 0) > 0
}

/** Profil kecepatan bawaan per jenis event, bila konten tidak menyebutkannya. */
function defaultSpeed(e: TacticEvent): SpeedProfile {
  switch (e.type) {
    case 'cut':
      return 'sprint'
    case 'dribble':
      return 'jog'
    case 'screen':
      return 'jog'
    case 'rotate':
      return 'slide'
    case 'rebound':
      return 'sprint'
    default:
      return 'jog'
  }
}

export interface CompiledEvent {
  raw: TacticEvent
  id: string
  type: TacticEvent['type']
  actor: PlayerId
  target: string | undefined
  t: number
  dur: number
  tEnd: number
  /** Hanya untuk event gerak */
  lut: PathLUT | null
  motion: MotionProfile | null
  isMotion: boolean
}

export interface CompiledTactic {
  tactic: Tactic
  court: CourtKind
  duration: number
  /** Semua event efektif (setelah cabang diselesaikan), urut menurut waktu */
  events: CompiledEvent[]
  /** Event gerak per aktor, urut menurut waktu — pencarian posisi jadi murah */
  motionByActor: Map<PlayerId, CompiledEvent[]>
  playersById: Map<PlayerId, Player>
  /** Kunci cabang aktif yang menghasilkan kompilasi ini */
  branchKey: string
  activeBranchIds: string[]
}

/**
 * Kompilasi satu daftar event menjadi bentuk siap sampel.
 * `events` sudah harus hasil resolveEvents() dari branch.ts.
 */
export function compileEvents(
  tactic: Tactic,
  events: readonly TacticEvent[],
  activeBranchIds: readonly string[] = [],
  branchKeyValue = '',
): CompiledTactic {
  const compiled: CompiledEvent[] = []

  for (const e of events) {
    const motionEvent = isMotionEvent(e)
    let lut: PathLUT | null = null
    let motion: MotionProfile | null = null
    let dur: number

    if (motionEvent) {
      lut = buildPath(e.path as [number, number][])
      const speed = e.speed ?? defaultSpeed(e)
      dur = e.dur ?? naturalDuration(lut, speed)
      // Jeda tanam kaki hanya untuk gerak kaki sungguhan, bukan slide bertahan.
      motion = buildMotionProfile(lut, dur, {
        footPlant: e.type === 'cut' || e.type === 'move' || e.type === 'dribble',
      })
    } else if (e.type === 'pass' || e.type === 'handoff') {
      // PRD §10: umpan selalu tampil minimal 250 ms di layar.
      dur = Math.max(e.dur ?? MIN_PASS_SEC, MIN_PASS_SEC)
    } else if (e.type === 'shot') {
      dur = e.dur ?? SHOT_FLIGHT_SEC
    } else {
      dur = e.dur ?? 0.3
    }

    compiled.push({
      raw: e,
      id: e.id,
      type: e.type,
      actor: e.actor,
      target: e.target,
      t: e.t,
      dur,
      tEnd: e.t + dur,
      lut,
      motion,
      isMotion: motionEvent,
    })
  }

  const motionByActor = new Map<PlayerId, CompiledEvent[]>()
  for (const ce of compiled) {
    if (!ce.isMotion) continue
    const list = motionByActor.get(ce.actor)
    if (list) list.push(ce)
    else motionByActor.set(ce.actor, [ce])
  }
  for (const list of motionByActor.values()) list.sort((a, b) => a.t - b.t)

  const playersById = new Map<PlayerId, Player>()
  for (const p of tactic.players) playersById.set(p.id, p)

  return {
    tactic,
    court: tactic.court,
    duration: tactic.duration,
    events: compiled,
    motionByActor,
    playersById,
    branchKey: branchKeyValue,
    activeBranchIds: [...activeBranchIds],
  }
}

/* -------------------------------------------------------------------------- */
/* Penyampelan posisi                                                         */
/* -------------------------------------------------------------------------- */

export interface PlayerMotion {
  position: Vec2
  /** Kecepatan sesaat (m/s) */
  speed: number
  /** Vektor arah gerak; (0,0) bila diam */
  heading: Vec2
  /** Event gerak yang sedang aktif, bila ada */
  activeEvent: CompiledEvent | null
  /** Jarak tempuh di event aktif (meter) — dipakai garis prediksi A-03 */
  travelled: number
}

/**
 * Posisi & kecepatan satu pemain pada waktu t.
 *
 * Urutan pencarian:
 *  1. event gerak yang mencakup t  -> sampel jalurnya
 *  2. event gerak terakhir sebelum t -> tahan di titik akhir jalurnya
 *  3. tidak ada event              -> posisi awal pemain
 */
export function playerMotionAt(
  ct: CompiledTactic,
  playerId: PlayerId,
  t: number,
): PlayerMotion {
  const player = ct.playersById.get(playerId)
  const fallback: Vec2 = player
    ? { x: player.start.x, y: player.start.y }
    : { x: 0, y: 0 }

  const list = ct.motionByActor.get(playerId)
  if (!list || list.length === 0) {
    return {
      position: fallback,
      speed: 0,
      heading: { x: 0, y: 0 },
      activeEvent: null,
      travelled: 0,
    }
  }

  let last: CompiledEvent | null = null

  for (const ce of list) {
    if (t < ce.t) break
    if (t < ce.tEnd) {
      const dt = t - ce.t
      const s = ce.motion?.distanceAt(dt) ?? 0
      const sample = samplePathAtDistance(ce.lut as PathLUT, s)
      const speed = ce.motion?.speedAt(dt) ?? 0
      return {
        position: sample.point,
        speed,
        heading: speed > 0.05 ? sample.tangent : { x: 0, y: 0 },
        activeEvent: ce,
        travelled: s,
      }
    }
    last = ce
  }

  if (last) {
    return {
      position: pathEnd(last.lut as PathLUT),
      speed: 0,
      heading: { x: 0, y: 0 },
      activeEvent: null,
      travelled: last.lut?.length ?? 0,
    }
  }

  // t sebelum event gerak pertama: pakai titik awal jalur pertama bila ada,
  // supaya tidak ada lompatan saat event pertama mulai.
  const firstEvent = list[0] as CompiledEvent
  const startOfFirst = firstEvent.lut ? pathStart(firstEvent.lut) : fallback
  return {
    position: startOfFirst,
    speed: 0,
    heading: { x: 0, y: 0 },
    activeEvent: null,
    travelled: 0,
  }
}

/**
 * Arah hadap pemain pada waktu t.
 *
 * Saat bergerak: mengikuti arah gerak.
 * Saat diam, tiga aturan berurutan — semuanya fungsi murni dari t:
 *   1. bek dengan penugasan `guards` menghadap pemain yang dijaganya
 *   2. penyerang pemegang bola menghadap ring
 *   3. sisanya mempertahankan arah hadap terakhir / arah hadap awal
 */
export function playerFacingAt(
  ct: CompiledTactic,
  playerId: PlayerId,
  t: number,
  motion: PlayerMotion,
  ballHolder: PlayerId | null,
): number {
  if (motion.heading.x !== 0 || motion.heading.y !== 0) {
    return vectorToFacing(motion.heading)
  }

  const player = ct.playersById.get(playerId)
  const startFacing = player?.start.facing ?? 0

  if (player?.team === 'defense' && player.guards) {
    const guarded = playerMotionAt(ct, player.guards, t).position
    const v = { x: guarded.x - motion.position.x, y: guarded.y - motion.position.y }
    if (Math.hypot(v.x, v.y) > 0.2) return vectorToFacing(v)
  }

  if (ballHolder === playerId) {
    const rim = rimPosition(ct.court)
    const v = { x: rim.x - motion.position.x, y: rim.y - motion.position.y }
    if (Math.hypot(v.x, v.y) > 0.2) return vectorToFacing(v)
  }

  return startFacing
}

/**
 * Arah hadap dengan pelicinan menuju target — dipakai renderer agar panah arah
 * tidak menyentak saat pemain berhenti. Tetap deterministik karena hanya
 * fungsi dari t (bukan dari frame sebelumnya).
 */
export function smoothedFacing(current: number, target: number, blend = 0.35): number {
  return lerpAngle(current, target, blend)
}

/** Vektor hadap satuan — dipakai kerucut pandang bek (A-15). */
export function facingVectorOf(facingDeg: number): Vec2 {
  return facingToVector(facingDeg)
}

/**
 * Jalur ke depan pemain terpilih untuk GARIS PREDIKSI (A-03).
 * PRD §7: "Jalur pemain terpilih digambar sebagai garis prediksi 0,6 detik di
 * depan gerakannya, sehingga pengguna tahu ke mana harus bergerak."
 *
 * Mengembalikan polyline dalam meter dari posisi sekarang sampai posisi pada
 * t + lookahead, melintasi batas event bila perlu.
 */
export function predictionPath(
  ct: CompiledTactic,
  playerId: PlayerId,
  t: number,
  lookahead = 0.6,
  samples = 12,
): Vec2[] {
  const out: Vec2[] = []
  for (let i = 0; i <= samples; i++) {
    const tt = t + (lookahead * i) / samples
    if (tt > ct.duration) break
    out.push(playerMotionAt(ct, playerId, tt).position)
  }
  // Buang titik kembar agar renderer tidak menggambar segmen nol.
  return out.filter((p, i) => i === 0 || Math.hypot(p.x - (out[i - 1] as Vec2).x, p.y - (out[i - 1] as Vec2).y) > 0.02)
}

/**
 * Jejak gerak (A-04): posisi 1,2 detik terakhir sebagai bayangan memudar.
 * PRD §10: "Bayangan jalur 1,2 dtk terakhir memudar di belakang pemain."
 */
export function trailPath(
  ct: CompiledTactic,
  playerId: PlayerId,
  t: number,
  window = 1.2,
  samples = 10,
): Vec2[] {
  const out: Vec2[] = []
  const start = Math.max(0, t - window)
  if (t - start < 1e-3) return out
  for (let i = 0; i <= samples; i++) {
    const tt = start + ((t - start) * i) / samples
    out.push(playerMotionAt(ct, playerId, tt).position)
  }
  return out
}
