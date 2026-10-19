/**
 * Geometri lapangan & sistem koordinat — PRD §4 (modul 1.2/1.3) dan §13.
 *
 * Satuan selalu METER. Ada dua sistem koordinat:
 *
 *  half  — titik asal (0,0) = proyeksi pusat ring di lantai.
 *          x = lebar lapangan, -7,5 .. 7,5 (positif ke kanan dari sudut
 *              pandang penyerang yang menghadap ring)
 *          y = arah ke garis tengah, -1,575 (garis akhir) .. 12,425 (garis tengah)
 *
 *  full  — titik asal di pusat lingkaran tengah.
 *          x = panjang, -14 .. 14
 *          y = lebar, -7,5 .. 7,5
 *
 * Arah hadap (`facing`) dalam derajat, 0 derajat = menghadap ring serang.
 * Vektor arah = (sin t, -cos t) pada sistem `half`.
 */

export type CourtKind = 'half' | 'full'

export interface Vec2 {
  x: number
  y: number
}

/** Ukuran resmi FIBA (Official Basketball Rules). Perbedaan NBA dicatat terpisah. */
export const FIBA = {
  /** Panjang lapangan (m) */
  length: 28,
  /** Lebar lapangan (m) */
  width: 15,
  /** Jarak pusat ring dari garis akhir (m) */
  rimFromEndline: 1.575,
  /** Tinggi ring dari lantai (m) */
  rimHeight: 3.05,
  /** Radius ring (m) */
  rimRadius: 0.225,
  /** Radius busur 3 poin diukur dari pusat ring (m) */
  threePointRadius: 6.75,
  /** Jarak segmen lurus garis 3 poin dari garis samping (m) -> sudut 6,60 m */
  threePointCornerInset: 0.9,
  /** Lebar paint / restricted area (m) */
  paintWidth: 4.9,
  /** Jarak garis lemparan bebas dari garis akhir (m) */
  freeThrowFromEndline: 5.8,
  /** Radius lingkaran lemparan bebas (m) */
  freeThrowCircleRadius: 1.8,
  /** Radius lingkaran tengah (m) */
  centerCircleRadius: 1.8,
  /** Radius area tanpa charge dari pusat ring (m) */
  noChargeRadius: 1.25,
  /** Lebar papan pantul (m) */
  backboardWidth: 1.8,
  /** Jarak papan pantul dari garis akhir (m) */
  backboardFromEndline: 1.2,
} as const

/** Perbedaan NBA — ditampilkan sebagai catatan bertanda "NBA" (PRD §4). */
export const NBA_DIFF = {
  length: 28.65,
  width: 15.24,
  threePointRadius: 7.24,
  threePointCornerDistance: 6.7,
  paintWidth: 4.88,
  quarterMinutes: 12,
  foulsToEject: 6,
} as const

/* -------------------------------------------------------------------------- */
/* Turunan geometri pada sistem `half`                                        */
/* -------------------------------------------------------------------------- */

/** Garis akhir (baseline) pada sistem half: y = -1,575 */
export const HALF_ENDLINE_Y = -FIBA.rimFromEndline
/** Garis tengah pada sistem half: y = 12,425 */
export const HALF_MIDLINE_Y = FIBA.length / 2 - FIBA.rimFromEndline
/** Setengah lebar lapangan: 7,5 */
export const HALF_WIDTH = FIBA.width / 2
/** Setengah lebar paint: 2,45 */
export const PAINT_HALF_WIDTH = FIBA.paintWidth / 2
/** y garis lemparan bebas pada sistem half: 4,225 */
export const FREE_THROW_Y = FIBA.freeThrowFromEndline - FIBA.rimFromEndline
/** |x| segmen lurus garis 3 poin: 6,60 */
export const THREE_CORNER_X = HALF_WIDTH - FIBA.threePointCornerInset

/**
 * y tempat busur 3 poin bertemu segmen lurusnya.
 * Di bawah nilai ini garis 3 poin lurus sejajar garis samping.
 */
export const THREE_ARC_JOIN_Y = Math.sqrt(
  FIBA.threePointRadius ** 2 - THREE_CORNER_X ** 2,
)

/** Batas (meter) dari sebuah jenis lapangan — dipakai transform ke piksel. */
export interface CourtBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export function courtBounds(kind: CourtKind): CourtBounds {
  return kind === 'half'
    ? { minX: -HALF_WIDTH, maxX: HALF_WIDTH, minY: HALF_ENDLINE_Y, maxY: HALF_MIDLINE_Y }
    : { minX: -FIBA.length / 2, maxX: FIBA.length / 2, minY: -HALF_WIDTH, maxY: HALF_WIDTH }
}

export function courtSizeMeters(kind: CourtKind): { w: number; h: number } {
  const b = courtBounds(kind)
  return { w: b.maxX - b.minX, h: b.maxY - b.minY }
}

/** Pusat ring pada sistem koordinat yang diberikan. */
export function rimPosition(kind: CourtKind): Vec2 {
  // half: asal koordinat memang pusat ring.
  // full: ring serang di ujung x positif.
  return kind === 'half'
    ? { x: 0, y: 0 }
    : { x: FIBA.length / 2 - FIBA.rimFromEndline, y: 0 }
}

/* -------------------------------------------------------------------------- */
/* Transform meter <-> piksel                                                 */
/* -------------------------------------------------------------------------- */

export interface CourtTransform {
  kind: CourtKind
  /** Piksel per meter */
  scale: number
  /** Offset piksel tepi kiri area lapangan */
  offsetX: number
  /** Offset piksel tepi atas area lapangan */
  offsetY: number
  /** Lebar area lapangan dalam piksel */
  pxWidth: number
  /** Tinggi area lapangan dalam piksel */
  pxHeight: number
}

/**
 * Hitung transform yang memuat lapangan utuh di dalam kotak piksel (contain),
 * terpusat, dengan padding opsional.
 *
 * Orientasi layar:
 *  - half: ring di ATAS (PRD §9 — "di mobile portrait, ring berada di atas")
 *  - full: lapangan membentang horizontal
 */
export function fitCourt(
  kind: CourtKind,
  boxWidth: number,
  boxHeight: number,
  padding = 0,
): CourtTransform {
  const { w, h } = courtSizeMeters(kind)
  const availW = Math.max(1, boxWidth - padding * 2)
  const availH = Math.max(1, boxHeight - padding * 2)
  const scale = Math.min(availW / w, availH / h)
  const pxWidth = w * scale
  const pxHeight = h * scale
  return {
    kind,
    scale,
    offsetX: padding + (availW - pxWidth) / 2,
    offsetY: padding + (availH - pxHeight) / 2,
    pxWidth,
    pxHeight,
  }
}

/** Meter -> piksel. */
export function toPx(t: CourtTransform, p: Vec2): Vec2 {
  const b = courtBounds(t.kind)
  return {
    x: t.offsetX + (p.x - b.minX) * t.scale,
    y: t.offsetY + (p.y - b.minY) * t.scale,
  }
}

/** Piksel -> meter (dipakai Studio Konten & target ketuk kuis). */
export function toMeters(t: CourtTransform, px: Vec2): Vec2 {
  const b = courtBounds(t.kind)
  return {
    x: (px.x - t.offsetX) / t.scale + b.minX,
    y: (px.y - t.offsetY) / t.scale + b.minY,
  }
}

/** Panjang skalar meter -> piksel. */
export function lenPx(t: CourtTransform, meters: number): number {
  return meters * t.scale
}

/* -------------------------------------------------------------------------- */
/* Vektor & sudut                                                             */
/* -------------------------------------------------------------------------- */

export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u
}

export function lerpVec(a: Vec2, b: Vec2, u: number): Vec2 {
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) }
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

/** Vektor arah satuan dari sudut hadap (derajat). 0 = menghadap ring. */
export function facingToVector(facingDeg: number): Vec2 {
  const r = (facingDeg * Math.PI) / 180
  return { x: Math.sin(r), y: -Math.cos(r) }
}

/** Sudut hadap (derajat, 0..360) dari vektor arah. */
export function vectorToFacing(v: Vec2): number {
  const deg = (Math.atan2(v.x, -v.y) * 180) / Math.PI
  return (deg + 360) % 360
}

/** Interpolasi sudut lewat jalur terpendek — mencegah bek berputar 350 derajat. */
export function lerpAngle(a: number, b: number, u: number): number {
  const d = ((b - a + 540) % 360) - 180
  return (a + d * u + 360) % 360
}

/* -------------------------------------------------------------------------- */
/* Zona lapangan — materi modul 1.3 "Nama Area Lapangan"                      */
/* -------------------------------------------------------------------------- */

export type ZoneId =
  | 'paint'
  | 'low-block-left'
  | 'low-block-right'
  | 'mid-post-left'
  | 'mid-post-right'
  | 'elbow-left'
  | 'elbow-right'
  | 'high-post'
  | 'top-of-key'
  | 'slot-left'
  | 'slot-right'
  | 'wing-left'
  | 'wing-right'
  | 'corner-left'
  | 'corner-right'
  | 'short-corner-left'
  | 'short-corner-right'

export interface Zone {
  id: ZoneId
  /** Nama tampil — istilah asli dipertahankan (PRD prinsip pengalaman) */
  label: string
  /** Penjelasan ringkas Bahasa Indonesia */
  note: string
  /** Titik acuan tengah zona (meter, sistem half) */
  center: Vec2
  /** Radius sentuh untuk peta zona interaktif (meter) */
  radius: number
}

/**
 * Ke-17 zona setengah lapangan. Koordinat diturunkan dari geometri FIBA di atas,
 * bukan angka ajaib: elbow = pertemuan garis lemparan bebas dan sisi paint, dst.
 */
export const ZONES: readonly Zone[] = [
  {
    id: 'paint',
    label: 'Paint / Key',
    note: 'Area persegi di depan ring. Penyerang hanya boleh 3 detik di sini.',
    center: { x: 0, y: (HALF_ENDLINE_Y + FREE_THROW_Y) / 2 },
    radius: 1.6,
  },
  {
    id: 'low-block-left',
    label: 'Low block (kiri)',
    note: 'Kotak di samping paint dekat ring — tempat post up.',
    center: { x: -PAINT_HALF_WIDTH, y: 1.0 },
    radius: 0.8,
  },
  {
    id: 'low-block-right',
    label: 'Low block (kanan)',
    note: 'Kotak di samping paint dekat ring — tempat post up.',
    center: { x: PAINT_HALF_WIDTH, y: 1.0 },
    radius: 0.8,
  },
  {
    id: 'mid-post-left',
    label: 'Mid-post (kiri)',
    note: 'Di antara low block dan elbow, di sisi paint.',
    center: { x: -PAINT_HALF_WIDTH, y: 2.6 },
    radius: 0.8,
  },
  {
    id: 'mid-post-right',
    label: 'Mid-post (kanan)',
    note: 'Di antara low block dan elbow, di sisi paint.',
    center: { x: PAINT_HALF_WIDTH, y: 2.6 },
    radius: 0.8,
  },
  {
    id: 'elbow-left',
    label: 'Elbow (kiri)',
    note: 'Sudut pertemuan garis lemparan bebas dan sisi paint.',
    center: { x: -PAINT_HALF_WIDTH, y: FREE_THROW_Y },
    radius: 0.8,
  },
  {
    id: 'elbow-right',
    label: 'Elbow (kanan)',
    note: 'Sudut pertemuan garis lemparan bebas dan sisi paint.',
    center: { x: PAINT_HALF_WIDTH, y: FREE_THROW_Y },
    radius: 0.8,
  },
  {
    id: 'high-post',
    label: 'High post',
    note: 'Area sekitar garis lemparan bebas — pos pengumpan.',
    center: { x: 0, y: FREE_THROW_Y },
    radius: 1.0,
  },
  {
    id: 'top-of-key',
    label: 'Top of key',
    note: 'Area di atas busur lemparan bebas, tempat PG memulai set.',
    center: { x: 0, y: 7.8 },
    radius: 1.3,
  },
  {
    id: 'slot-left',
    label: 'Slot (kiri)',
    note: 'Area di antara top of key dan wing.',
    center: { x: -3.1, y: 7.0 },
    radius: 1.1,
  },
  {
    id: 'slot-right',
    label: 'Slot (kanan)',
    note: 'Area di antara top of key dan wing.',
    center: { x: 3.1, y: 7.0 },
    radius: 1.1,
  },
  {
    id: 'wing-left',
    label: 'Wing (kiri)',
    note: 'Samping lapangan di garis 3 poin, sejajar garis lemparan bebas.',
    center: { x: -5.5, y: 4.6 },
    radius: 1.2,
  },
  {
    id: 'wing-right',
    label: 'Wing (kanan)',
    note: 'Samping lapangan di garis 3 poin, sejajar garis lemparan bebas.',
    center: { x: 5.5, y: 4.6 },
    radius: 1.2,
  },
  {
    id: 'corner-left',
    label: 'Corner (kiri)',
    note: 'Sudut lapangan, pertemuan baseline dan sideline. Tembakan 3 terdekat (6,60 m).',
    center: { x: -THREE_CORNER_X, y: 0.4 },
    radius: 1.1,
  },
  {
    id: 'corner-right',
    label: 'Corner (kanan)',
    note: 'Sudut lapangan, pertemuan baseline dan sideline. Tembakan 3 terdekat (6,60 m).',
    center: { x: THREE_CORNER_X, y: 0.4 },
    radius: 1.1,
  },
  {
    id: 'short-corner-left',
    label: 'Short corner (kiri)',
    note: 'Di dalam garis 3 poin dekat baseline, di luar paint.',
    center: { x: -3.6, y: 0.4 },
    radius: 0.9,
  },
  {
    id: 'short-corner-right',
    label: 'Short corner (kanan)',
    note: 'Di dalam garis 3 poin dekat baseline, di luar paint.',
    center: { x: 3.6, y: 0.4 },
    radius: 0.9,
  },
]

/** Zona terdekat dari satu titik, bila berada dalam radius sentuhnya. */
export function zoneAt(p: Vec2): Zone | null {
  let best: Zone | null = null
  let bestD = Infinity
  for (const z of ZONES) {
    const d = dist(p, z.center)
    if (d <= z.radius && d < bestD) {
      best = z
      bestD = d
    }
  }
  return best
}

/* -------------------------------------------------------------------------- */
/* Pertanyaan taktis atas geometri                                            */
/* -------------------------------------------------------------------------- */

/** Jarak satu titik ke pusat ring (meter). */
export function distToRim(p: Vec2, kind: CourtKind = 'half'): number {
  return dist(p, rimPosition(kind))
}

/**
 * Apakah sebuah titik berada di luar garis 3 poin?
 * Memakai segmen lurus di sudut (|x| >= 6,60 dan y di bawah titik temu busur)
 * dan busur 6,75 m di atasnya — persis seperti lapangan FIBA sebenarnya.
 */
export function isBehindThreePointLine(p: Vec2): boolean {
  if (p.y <= THREE_ARC_JOIN_Y) return Math.abs(p.x) >= THREE_CORNER_X
  return distToRim(p) >= FIBA.threePointRadius
}

/** Apakah titik berada di dalam paint? */
export function isInPaint(p: Vec2): boolean {
  return Math.abs(p.x) <= PAINT_HALF_WIDTH && p.y >= HALF_ENDLINE_Y && p.y <= FREE_THROW_Y
}

/** Nilai tembakan dari satu titik: 2 atau 3 poin. */
export function shotValue(p: Vec2): 2 | 3 {
  return isBehindThreePointLine(p) ? 3 : 2
}

/**
 * Sisi kuat (ball side) atau sisi lemah (help side) relatif posisi bola.
 * Lapangan dibagi oleh garis tengah memanjang (x = 0).
 */
export function courtSide(p: Vec2, ball: Vec2): 'strong' | 'weak' | 'middle' {
  if (Math.abs(ball.x) < 0.75) return 'middle'
  return Math.sign(p.x) === Math.sign(ball.x) ? 'strong' : 'weak'
}

/** Titik dijepit agar tetap di dalam batas lapangan. */
export function clampToCourt(p: Vec2, kind: CourtKind): Vec2 {
  const b = courtBounds(kind)
  return { x: clamp(p.x, b.minX, b.maxX), y: clamp(p.y, b.minY, b.maxY) }
}
