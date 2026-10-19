/**
 * Bola — kepemilikan, umpan, dan tembakan.
 *
 * Aturan validasi PRD §13: "Bola hanya dimiliki satu pemain pada satu waktu,
 * atau sedang di udara karena umpan/tembakan."
 *
 * Modul ini membangun GARIS WAKTU KEPEMILIKAN dari daftar event, lalu menjawab
 * "di mana bola pada waktu t" sebagai fungsi murni. Garis waktu itu juga dipakai
 * validator untuk membuktikan tidak ada dua pemain memegang bola bersamaan.
 */

import { type Vec2, dist, rimPosition } from './court'
import { arcHeight, arcPoint } from './geometry'
import { dribbleFrequency } from './speed'
import type { CompiledEvent, CompiledTactic } from './interpolator'
import { playerMotionAt } from './interpolator'
import type { PlayerId } from './schema'

/** Satu ruas garis waktu kepemilikan bola. */
export interface BallSegment {
  tStart: number
  tEnd: number
  kind: 'held' | 'air' | 'loose'
  /** Untuk 'held': pemegang bola. */
  holder?: PlayerId
  /** Untuk 'air': pengirim. */
  from?: PlayerId
  /** Untuk 'air': penerima, atau 'rim' untuk tembakan. */
  to?: PlayerId | 'rim'
  /** Event penyebab ruas ini. */
  eventId?: string
  /** Jenis event penyebab — membedakan umpan, handoff, dan tembakan. */
  cause?: 'pass' | 'handoff' | 'shot'
  /** Khusus tembakan: apakah masuk. */
  made?: boolean
}

/**
 * Bangun garis waktu kepemilikan bola.
 *
 * Event yang memindahkan bola diproses urut waktu:
 *  - pass / handoff : bola di udara dari aktor ke target, lalu dipegang target
 *  - shot           : bola di udara menuju ring, setelah itu lepas (loose)
 *  - rebound        : aktor menguasai bola di akhir event rebound
 */
export function buildBallTimeline(ct: CompiledTactic): BallSegment[] {
  const initialHolder =
    ct.tactic.players.find((p) => p.hasBall)?.id ??
    // Fallback aman: penyerang pertama yang punya event dribble/pass paling awal.
    ct.events.find((e) => e.type === 'dribble' || e.type === 'pass')?.actor ??
    ct.tactic.players.find((p) => p.team === 'offense')?.id

  const segments: BallSegment[] = []
  let currentHolder: PlayerId | null = initialHolder ?? null
  let cursor = 0

  const transfers = ct.events
    .filter(
      (e): e is CompiledEvent =>
        e.type === 'pass' || e.type === 'handoff' || e.type === 'shot' || e.type === 'rebound',
    )
    .sort((a, b) => a.t - b.t)

  for (const e of transfers) {
    if (e.type === 'rebound') {
      // Rebound hanya berarti bila bola sedang lepas.
      if (currentHolder === null) {
        if (e.tEnd > cursor) {
          segments.push({ tStart: cursor, tEnd: e.tEnd, kind: 'loose', eventId: e.id })
        }
        cursor = e.tEnd
        currentHolder = e.actor
      }
      continue
    }

    // Tutup ruas "dipegang" sampai saat bola berangkat.
    if (currentHolder !== null && e.t > cursor) {
      segments.push({ tStart: cursor, tEnd: e.t, kind: 'held', holder: currentHolder })
    }

    if (e.type === 'shot') {
      segments.push({
        tStart: e.t,
        tEnd: e.tEnd,
        kind: 'air',
        from: e.actor,
        to: 'rim',
        eventId: e.id,
        cause: 'shot',
        made: e.raw.made ?? true,
      })
      currentHolder = null
    } else {
      const to = e.target
      if (!to || to === 'rim') {
        // Umpan tanpa penerima yang sah: bola jadi lepas (biasanya turnover).
        segments.push({
          tStart: e.t,
          tEnd: e.tEnd,
          kind: 'air',
          from: e.actor,
          eventId: e.id,
          cause: e.type === 'handoff' ? 'handoff' : 'pass',
        })
        currentHolder = null
      } else {
        segments.push({
          tStart: e.t,
          tEnd: e.tEnd,
          kind: 'air',
          from: e.actor,
          to,
          eventId: e.id,
          cause: e.type === 'handoff' ? 'handoff' : 'pass',
        })
        currentHolder = to
      }
    }
    cursor = e.tEnd
  }

  // Ruas terakhir sampai akhir taktik.
  if (cursor < ct.duration) {
    segments.push(
      currentHolder !== null
        ? { tStart: cursor, tEnd: ct.duration, kind: 'held', holder: currentHolder }
        : { tStart: cursor, tEnd: ct.duration, kind: 'loose' },
    )
  }

  return segments
}

/** Ruas yang mencakup waktu t. */
export function segmentAt(segments: readonly BallSegment[], t: number): BallSegment | null {
  for (const s of segments) {
    if (t >= s.tStart && t < s.tEnd) return s
  }
  return segments.length > 0 ? (segments[segments.length - 1] as BallSegment) : null
}

export interface BallState {
  /** Posisi bola di lantai (meter) */
  position: Vec2
  /** Pemegang bola, atau null bila di udara / lepas */
  holder: PlayerId | null
  inAir: boolean
  /** Ketinggian relatif 0..1 selama di udara — dipakai ukuran & bayangan */
  height: number
  /** Sedang di-dribble (pemegang bergerak) */
  dribbling: boolean
  /** Fase pantulan dribble 0..1 — menggerakkan orbit bola di sisi tangan */
  bouncePhase: number
  /** Ruas kepemilikan aktif */
  segment: BallSegment | null
  /** Untuk tembakan: apakah masuk */
  shotMade: boolean | null
  /** Garis lintasan umpan/tembakan dari-ke (meter), untuk notasi */
  flight: { from: Vec2; to: Vec2; progress: number; cause: BallSegment['cause'] } | null
}

/** Offset bola dari token pemegang (meter) — bola tidak pernah tepat di tengah. */
const CARRY_OFFSET = 0.42

/**
 * Posisi & keadaan bola pada waktu t.
 *
 * PRD §9: "saat dipegang, mengorbit token pembawa".
 * PRD §10: "bola memantul di sisi tangan dominan, frekuensi sekitar 2 pantulan
 * per detik saat berjalan dan lebih cepat saat sprint".
 */
export function ballStateAt(
  ct: CompiledTactic,
  segments: readonly BallSegment[],
  t: number,
): BallState {
  const seg = segmentAt(segments, t)

  if (!seg) {
    return {
      position: rimPosition(ct.court),
      holder: null,
      inAir: false,
      height: 0,
      dribbling: false,
      bouncePhase: 0,
      segment: null,
      shotMade: null,
      flight: null,
    }
  }

  if (seg.kind === 'air') {
    const span = Math.max(1e-4, seg.tEnd - seg.tStart)
    const u = Math.min(1, Math.max(0, (t - seg.tStart) / span))

    const from = seg.from
      ? playerMotionAt(ct, seg.from, seg.tStart).position
      : rimPosition(ct.court)
    const to =
      seg.to === 'rim' || !seg.to
        ? rimPosition(ct.court)
        : // Penerima dinilai pada saat bola TIBA, bukan saat berangkat — ini yang
          // membuat umpan memimpin pemain yang sedang bergerak.
          playerMotionAt(ct, seg.to, seg.tEnd).position

    // Tembakan melengkung jauh lebih tinggi daripada umpan.
    const bow = seg.cause === 'shot' ? 0.22 : seg.cause === 'handoff' ? 0.02 : 0.07
    const position = arcPoint(from, to, u, bow)

    return {
      position,
      holder: null,
      inAir: true,
      height: arcHeight(u),
      dribbling: false,
      bouncePhase: 0,
      segment: seg,
      shotMade: seg.cause === 'shot' ? (seg.made ?? true) : null,
      flight: { from, to, progress: u, cause: seg.cause },
    }
  }

  if (seg.kind === 'loose') {
    // Bola lepas setelah tembakan: tetap di dekat ring.
    const rim = rimPosition(ct.court)
    return {
      position: { x: rim.x + 0.5, y: rim.y + 0.6 },
      holder: null,
      inAir: false,
      height: 0,
      dribbling: false,
      bouncePhase: 0,
      segment: seg,
      shotMade: null,
      flight: null,
    }
  }

  // Dipegang.
  const holder = seg.holder as PlayerId
  const motion = playerMotionAt(ct, holder, t)
  const dribbling = motion.speed > 0.15 || motion.activeEvent?.type === 'dribble'
  const freq = dribbleFrequency(motion.speed)
  const bouncePhase = dribbling ? (t * freq) % 1 : 0

  // Bola di sisi tangan: tegak lurus arah gerak bila bergerak, kalau tidak di
  // sisi kanan arah hadap. Semuanya fungsi dari t -> deterministik.
  let ox: number
  let oy: number
  if (dribbling && (motion.heading.x !== 0 || motion.heading.y !== 0)) {
    ox = -motion.heading.y
    oy = motion.heading.x
  } else {
    ox = 1
    oy = 0
  }
  // Amplitudo orbit mengikuti pantulan: dekat badan saat bola di atas.
  const amp = CARRY_OFFSET * (dribbling ? 0.72 + 0.28 * Math.abs(Math.sin(bouncePhase * Math.PI)) : 1)

  return {
    position: { x: motion.position.x + ox * amp, y: motion.position.y + oy * amp },
    holder,
    inAir: false,
    height: 0,
    dribbling,
    bouncePhase,
    segment: seg,
    shotMade: null,
    flight: null,
  }
}

/**
 * Apakah jalur umpan dari a ke b terhalang bek? Dipakai lapisan "jalur umpan"
 * (A-16): "lebar berkas = tingkat keamanan; berkas merah bila terhalang bek".
 *
 * Mengembalikan jarak bek terdekat ke segmen umpan (meter).
 */
export function passLaneClearance(
  from: Vec2,
  to: Vec2,
  defenders: readonly Vec2[],
): number {
  let min = Infinity
  for (const d of defenders) {
    min = Math.min(min, pointToSegmentDistance(d, from, to))
  }
  return min === Infinity ? 99 : min
}

function pointToSegmentDistance(p: Vec2, a: Vec2, b: Vec2): number {
  const vx = b.x - a.x
  const vy = b.y - a.y
  const len2 = vx * vx + vy * vy
  if (len2 < 1e-9) return dist(p, a)
  let u = ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2
  u = u < 0 ? 0 : u > 1 ? 1 : u
  return Math.hypot(p.x - (a.x + vx * u), p.y - (a.y + vy * u))
}
