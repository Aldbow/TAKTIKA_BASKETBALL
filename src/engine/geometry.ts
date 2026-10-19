/**
 * Jalur gerak — PRD §10 "Gerak pemain dan bola":
 *
 *   "Jalur: spline Catmull-Rom sentripetal dengan parameter panjang busur,
 *    sehingga kecepatan merata dan tikungan halus."
 *
 * Dua sifat itu dibangun di sini:
 *
 *  1. Catmull-Rom SENTRIPETAL (alpha = 0,5) — varian ini tidak pernah membentuk
 *     simpul (cusp) atau lingkaran kecil saat dua titik jalur berdekatan, yang
 *     jadi masalah nyata di jalur cut tajam. Dievaluasi lewat formulasi
 *     piramidal Barry-Goldman supaya tetap eksak pada knot tak seragam.
 *
 *  2. PARAMETER PANJANG BUSUR — spline mentah bergerak lebih cepat di segmen
 *     panjang. Kita bangun tabel (LUT) jarak kumulatif, lalu menyampel menurut
 *     jarak tempuh, bukan parameter spline. Tanpa ini "sprint 6,5 m/s" tidak
 *     berarti apa pun.
 */

import type { Vec2 } from './court'

const EPS = 1e-6
/** Jumlah sampel per segmen untuk tabel panjang busur. */
const SAMPLES_PER_SEGMENT = 24

export interface PathSample {
  /** Posisi (meter) */
  point: Vec2
  /** Vektor satuan arah gerak di titik itu */
  tangent: Vec2
}

/** Jalur yang sudah dipra-hitung. Dibuat sekali, dipakai tiap frame. */
export interface PathLUT {
  /** Titik kontrol asli (meter) */
  control: Vec2[]
  /** Titik hasil sampel padat */
  points: Vec2[]
  /** Jarak kumulatif di setiap titik sampel (meter), naik monoton */
  cumulative: number[]
  /** Panjang total jalur (meter) */
  length: number
  /**
   * Indeks titik kontrol yang merupakan tikungan tajam, beserta jarak
   * kumulatifnya — dipakai jeda tanam kaki 80 ms (PRD §10).
   */
  corners: { index: number; distance: number; angleDeg: number }[]
}

/* -------------------------------------------------------------------------- */
/* Evaluasi spline                                                            */
/* -------------------------------------------------------------------------- */

function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y }
}

function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

function scale(a: Vec2, k: number): Vec2 {
  return { x: a.x * k, y: a.y * k }
}

function norm(a: Vec2): Vec2 {
  const m = Math.hypot(a.x, a.y)
  return m < EPS ? { x: 0, y: 0 } : { x: a.x / m, y: a.y / m }
}

/** Knot sentripetal: jarak^0,5 antar titik kontrol. */
function knotDelta(a: Vec2, b: Vec2): number {
  const d = Math.hypot(b.x - a.x, b.y - a.y)
  // Jarak nol akan membuat pembagian meledak; jaga dengan lantai kecil.
  return Math.max(Math.sqrt(d), EPS)
}

/** Interpolasi linear antar dua titik dengan parameter knot tak seragam. */
function knotLerp(p0: Vec2, p1: Vec2, t0: number, t1: number, t: number): Vec2 {
  const span = t1 - t0
  if (Math.abs(span) < EPS) return { ...p1 }
  const u = (t - t0) / span
  return add(scale(p0, 1 - u), scale(p1, u))
}

/**
 * Satu segmen Catmull-Rom sentripetal P1 -> P2 lewat piramida Barry-Goldman.
 * `t` berada di [t1, t2].
 */
function evalSegment(
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  t0: number,
  t1: number,
  t2: number,
  t3: number,
  t: number,
): Vec2 {
  const a1 = knotLerp(p0, p1, t0, t1, t)
  const a2 = knotLerp(p1, p2, t1, t2, t)
  const a3 = knotLerp(p2, p3, t2, t3, t)
  const b1 = knotLerp(a1, a2, t0, t2, t)
  const b2 = knotLerp(a2, a3, t1, t3, t)
  return knotLerp(b1, b2, t1, t2, t)
}

/**
 * Bangun LUT dari titik kontrol (meter).
 *
 * - 0 titik  -> jalur kosong panjang 0
 * - 1 titik  -> jalur diam di titik itu
 * - 2 titik  -> garis lurus (tidak perlu spline)
 * - 3+ titik -> Catmull-Rom sentripetal dengan titik hantu di kedua ujung
 */
export function buildPath(control: readonly (Vec2 | [number, number])[]): PathLUT {
  const pts: Vec2[] = control.map((p) =>
    Array.isArray(p) ? { x: p[0], y: p[1] } : { x: p.x, y: p.y },
  )

  if (pts.length === 0) {
    return { control: [], points: [], cumulative: [], length: 0, corners: [] }
  }

  const first = pts[0] as Vec2

  if (pts.length === 1) {
    return {
      control: pts,
      points: [first],
      cumulative: [0],
      length: 0,
      corners: [],
    }
  }

  let sampled: Vec2[]

  if (pts.length === 2) {
    const a = pts[0] as Vec2
    const b = pts[1] as Vec2
    sampled = []
    for (let i = 0; i <= SAMPLES_PER_SEGMENT; i++) {
      const u = i / SAMPLES_PER_SEGMENT
      sampled.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u })
    }
  } else {
    // Titik hantu: cerminkan segmen ujung supaya kurva melewati titik pertama
    // dan terakhir dengan arah masuk/keluar yang wajar.
    const p1 = pts[1] as Vec2
    const pLast = pts[pts.length - 1] as Vec2
    const pPrev = pts[pts.length - 2] as Vec2
    const ghostStart: Vec2 = { x: first.x * 2 - p1.x, y: first.y * 2 - p1.y }
    const ghostEnd: Vec2 = { x: pLast.x * 2 - pPrev.x, y: pLast.y * 2 - pPrev.y }
    const ext = [ghostStart, ...pts, ghostEnd]

    // Knot kumulatif sentripetal.
    const knots: number[] = [0]
    for (let i = 1; i < ext.length; i++) {
      knots.push((knots[i - 1] as number) + knotDelta(ext[i - 1] as Vec2, ext[i] as Vec2))
    }

    sampled = []
    for (let seg = 1; seg < ext.length - 2; seg++) {
      const p0 = ext[seg - 1] as Vec2
      const pa = ext[seg] as Vec2
      const pb = ext[seg + 1] as Vec2
      const p3 = ext[seg + 2] as Vec2
      const t0 = knots[seg - 1] as number
      const t1 = knots[seg] as number
      const t2 = knots[seg + 1] as number
      const t3 = knots[seg + 2] as number

      // Titik akhir segmen dilewati agar tidak tergandakan; ditambahkan di akhir.
      for (let i = 0; i < SAMPLES_PER_SEGMENT; i++) {
        const u = i / SAMPLES_PER_SEGMENT
        sampled.push(evalSegment(p0, pa, pb, p3, t0, t1, t2, t3, t1 + (t2 - t1) * u))
      }
    }
    sampled.push({ ...pLast })
  }

  // Tabel jarak kumulatif.
  const cumulative: number[] = [0]
  for (let i = 1; i < sampled.length; i++) {
    const a = sampled[i - 1] as Vec2
    const b = sampled[i] as Vec2
    cumulative.push((cumulative[i - 1] as number) + Math.hypot(b.x - a.x, b.y - a.y))
  }
  const length = cumulative[cumulative.length - 1] as number

  return {
    control: pts,
    points: sampled,
    cumulative,
    length,
    corners: findCorners(pts, sampled, cumulative),
  }
}

/**
 * Tikungan tajam pada titik kontrol (sudut belok > 55 derajat).
 * PRD §10: "V-cut dan L-cut punya jeda tanam kaki 80 ms di titik belok,
 * lalu akselerasi keluar."
 */
function findCorners(
  control: Vec2[],
  sampled: Vec2[],
  cumulative: number[],
): PathLUT['corners'] {
  const out: PathLUT['corners'] = []
  if (control.length < 3) return out

  for (let i = 1; i < control.length - 1; i++) {
    const prev = control[i - 1] as Vec2
    const cur = control[i] as Vec2
    const next = control[i + 1] as Vec2
    const a = norm(sub(cur, prev))
    const b = norm(sub(next, cur))
    if ((a.x === 0 && a.y === 0) || (b.x === 0 && b.y === 0)) continue

    const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y))
    const angleDeg = (Math.acos(dot) * 180) / Math.PI
    if (angleDeg > 55) {
      out.push({ index: i, distance: nearestDistance(sampled, cumulative, cur), angleDeg })
    }
  }
  return out
}

/** Jarak kumulatif titik sampel yang paling dekat ke sebuah titik kontrol. */
function nearestDistance(sampled: Vec2[], cumulative: number[], target: Vec2): number {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < sampled.length; i++) {
    const p = sampled[i] as Vec2
    const d = (p.x - target.x) ** 2 + (p.y - target.y) ** 2
    if (d < bestD) {
      bestD = d
      best = cumulative[i] as number
    }
  }
  return best
}

/* -------------------------------------------------------------------------- */
/* Penyampelan                                                                */
/* -------------------------------------------------------------------------- */

/** Pencarian biner: indeks sampel terakhir yang jarak kumulatifnya <= s. */
function findIndex(cumulative: number[], s: number): number {
  let lo = 0
  let hi = cumulative.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if ((cumulative[mid] as number) <= s) lo = mid
    else hi = mid - 1
  }
  return lo
}

/**
 * Sampel jalur pada jarak tempuh `s` meter (dijepit ke [0, length]).
 * Inilah yang membuat kecepatan merata: s bertambah linear terhadap waktu.
 */
export function samplePathAtDistance(lut: PathLUT, s: number): PathSample {
  const n = lut.points.length
  if (n === 0) return { point: { x: 0, y: 0 }, tangent: { x: 0, y: 0 } }
  if (n === 1 || lut.length < EPS) {
    return { point: { ...(lut.points[0] as Vec2) }, tangent: { x: 0, y: 0 } }
  }

  const clamped = s <= 0 ? 0 : s >= lut.length ? lut.length : s
  const i = findIndex(lut.cumulative, clamped)
  const iNext = Math.min(i + 1, n - 1)
  const a = lut.points[i] as Vec2
  const b = lut.points[iNext] as Vec2
  const dStart = lut.cumulative[i] as number
  const dEnd = lut.cumulative[iNext] as number
  const span = dEnd - dStart
  const u = span < EPS ? 0 : (clamped - dStart) / span

  const point: Vec2 = { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }

  // Tangen dari jendela kecil di sekitar titik agar stabil di sambungan sampel.
  const prev = lut.points[Math.max(0, i - 1)] as Vec2
  const nextNext = lut.points[Math.min(n - 1, iNext + 1)] as Vec2
  const tangent = norm(sub(nextNext, prev))

  return { point, tangent }
}

/** Sampel jalur pada fraksi panjang busur `u` di [0, 1]. */
export function samplePath(lut: PathLUT, u: number): PathSample {
  return samplePathAtDistance(lut, u * lut.length)
}

/** Titik awal jalur. */
export function pathStart(lut: PathLUT): Vec2 {
  return lut.points.length ? { ...(lut.points[0] as Vec2) } : { x: 0, y: 0 }
}

/** Titik akhir jalur. */
export function pathEnd(lut: PathLUT): Vec2 {
  return lut.points.length
    ? { ...(lut.points[lut.points.length - 1] as Vec2) }
    : { x: 0, y: 0 }
}

/**
 * Potongan polyline jalur antara dua jarak — dipakai menggambar jalur yang
 * "menggambar dirinya sendiri" (A-03 garis prediksi, A-07 cut).
 */
export function pathSlice(lut: PathLUT, fromS: number, toS: number): Vec2[] {
  if (lut.points.length === 0) return []
  const lo = Math.max(0, Math.min(fromS, toS))
  const hi = Math.min(lut.length, Math.max(fromS, toS))
  if (hi - lo < EPS) return [samplePathAtDistance(lut, lo).point]

  const out: Vec2[] = [samplePathAtDistance(lut, lo).point]
  for (let i = 0; i < lut.points.length; i++) {
    const d = lut.cumulative[i] as number
    if (d > lo && d < hi) out.push({ ...(lut.points[i] as Vec2) })
  }
  out.push(samplePathAtDistance(lut, hi).point)
  return out
}

/* -------------------------------------------------------------------------- */
/* Busur bola                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Busur bola pada tampilan atas. Karena kamera 2D melihat dari atas, ketinggian
 * bola tidak terlihat — jadi lengkungnya digambar sebagai bow tegak lurus garis
 * lintasan. Besarnya proporsional terhadap jarak, dibatasi agar tetap terbaca.
 *
 * PRD §10: "Tembakan: busur parabola dengan waktu terbang sekitar 1 detik."
 */
export function arcPoint(from: Vec2, to: Vec2, u: number, bowFactor: number): Vec2 {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const d = Math.hypot(dx, dy)
  if (d < EPS) return { ...to }

  // Normal tegak lurus, selalu melengkung ke sisi yang sama (menjauhi tengah
  // lapangan) agar busur tembakan tidak pernah menutupi token pemain.
  const nx = -dy / d
  const ny = dx / d
  const sign = (from.x + to.x) / 2 >= 0 ? 1 : -1
  // Parabola: puncak di tengah lintasan.
  const bow = 4 * u * (1 - u) * Math.min(d * bowFactor, 1.6) * sign

  return { x: from.x + dx * u + nx * bow, y: from.y + dy * u + ny * bow }
}

/** Ketinggian relatif bola (0..1) di sepanjang busur — dipakai ukuran & bayangan. */
export function arcHeight(u: number): number {
  return 4 * u * (1 - u)
}

/* -------------------------------------------------------------------------- */
/* Pembantu numerik untuk pengujian                                           */
/* -------------------------------------------------------------------------- */

/**
 * Panjang jalur hasil integrasi numerik rapat — acuan independen untuk
 * memverifikasi LUT panjang busur di unit test.
 */
export function measurePathLength(lut: PathLUT, steps = 4000): number {
  if (lut.points.length < 2) return 0
  let total = 0
  let prev = samplePath(lut, 0).point
  for (let i = 1; i <= steps; i++) {
    const cur = samplePath(lut, i / steps).point
    total += Math.hypot(cur.x - prev.x, cur.y - prev.y)
    prev = cur
  }
  return total
}
