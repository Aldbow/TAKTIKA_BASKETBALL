import { describe, expect, it } from 'vitest'

import {
  FIBA,
  FREE_THROW_Y,
  HALF_ENDLINE_Y,
  HALF_MIDLINE_Y,
  HALF_WIDTH,
  PAINT_HALF_WIDTH,
  THREE_ARC_JOIN_Y,
  THREE_CORNER_X,
  clampToCourt,
  courtBounds,
  courtSide,
  courtSizeMeters,
  distToRim,
  facingToVector,
  fitCourt,
  isBehindThreePointLine,
  isInPaint,
  lenPx,
  lerpAngle,
  rimPosition,
  shotValue,
  toMeters,
  toPx,
  vectorToFacing,
  zoneAt,
  ZONES,
} from '../court'

describe('konstanta FIBA (PRD §4 modul 1.2)', () => {
  it('ukuran lapangan 28 x 15 m', () => {
    expect(FIBA.length).toBe(28)
    expect(FIBA.width).toBe(15)
  })

  it('garis 3 poin 6,75 m dengan sudut 6,60 m', () => {
    expect(FIBA.threePointRadius).toBe(6.75)
    expect(THREE_CORNER_X).toBeCloseTo(6.6, 6)
  })

  it('lebar paint 4,90 m dan tinggi ring 3,05 m', () => {
    expect(FIBA.paintWidth).toBe(4.9)
    expect(PAINT_HALF_WIDTH).toBeCloseTo(2.45, 6)
    expect(FIBA.rimHeight).toBe(3.05)
  })

  it('batas sistem half sesuai PRD §13: y -1,575 sampai 12,425', () => {
    expect(HALF_ENDLINE_Y).toBeCloseTo(-1.575, 6)
    expect(HALF_MIDLINE_Y).toBeCloseTo(12.425, 6)
    expect(HALF_WIDTH).toBe(7.5)
  })

  it('garis lemparan bebas 5,80 m dari garis akhir -> y 4,225', () => {
    expect(FREE_THROW_Y).toBeCloseTo(4.225, 6)
  })

  it('busur 3 poin bertemu segmen lurus di y positif di bawah garis lemparan bebas', () => {
    expect(THREE_ARC_JOIN_Y).toBeGreaterThan(0)
    expect(THREE_ARC_JOIN_Y).toBeLessThan(FREE_THROW_Y)
    // Titik temu harus berada tepat pada radius 6,75 m dari ring.
    expect(Math.hypot(THREE_CORNER_X, THREE_ARC_JOIN_Y)).toBeCloseTo(6.75, 6)
  })
})

describe('batas & ukuran lapangan', () => {
  it('half: 15 m lebar x 14 m panjang', () => {
    const { w, h } = courtSizeMeters('half')
    expect(w).toBeCloseTo(15, 6)
    expect(h).toBeCloseTo(14, 6)
  })

  it('full: 28 m x 15 m', () => {
    const { w, h } = courtSizeMeters('full')
    expect(w).toBeCloseTo(28, 6)
    expect(h).toBeCloseTo(15, 6)
  })

  it('asal half adalah pusat ring; full punya ring di ujung x positif', () => {
    expect(rimPosition('half')).toEqual({ x: 0, y: 0 })
    expect(rimPosition('full').x).toBeCloseTo(14 - 1.575, 6)
  })

  it('clampToCourt menjepit titik di luar batas', () => {
    const b = courtBounds('half')
    const p = clampToCourt({ x: 99, y: -99 }, 'half')
    expect(p.x).toBe(b.maxX)
    expect(p.y).toBe(b.minY)
  })
})

describe('transform meter <-> piksel', () => {
  it('memuat lapangan utuh dan terpusat (contain)', () => {
    const t = fitCourt('half', 800, 600, 10)
    expect(t.pxWidth).toBeLessThanOrEqual(780.001)
    expect(t.pxHeight).toBeLessThanOrEqual(580.001)
    // Rasio aspek harus terjaga.
    expect(t.pxWidth / t.pxHeight).toBeCloseTo(15 / 14, 6)
  })

  it('toPx dan toMeters saling membalik', () => {
    const t = fitCourt('half', 900, 700, 16)
    const p = { x: 2.35, y: 6.1 }
    const back = toMeters(t, toPx(t, p))
    expect(back.x).toBeCloseTo(p.x, 9)
    expect(back.y).toBeCloseTo(p.y, 9)
  })

  it('half court menempatkan ring di ATAS layar (PRD §9)', () => {
    const t = fitCourt('half', 400, 800)
    const rimPx = toPx(t, { x: 0, y: 0 })
    const midlinePx = toPx(t, { x: 0, y: HALF_MIDLINE_Y })
    expect(rimPx.y).toBeLessThan(midlinePx.y)
  })

  it('lenPx menskalakan panjang meter', () => {
    const t = fitCourt('half', 1500, 1400)
    expect(lenPx(t, 1)).toBeCloseTo(t.scale, 9)
  })

  it('kotak berukuran nol tidak menghasilkan NaN', () => {
    const t = fitCourt('half', 0, 0)
    expect(Number.isFinite(t.scale)).toBe(true)
  })
})

describe('sudut hadap', () => {
  it('0 derajat menghadap ring (arah -y pada sistem half)', () => {
    const v = facingToVector(0)
    expect(v.x).toBeCloseTo(0, 9)
    expect(v.y).toBeCloseTo(-1, 9)
  })

  it('180 derajat menjauhi ring', () => {
    const v = facingToVector(180)
    expect(v.y).toBeCloseTo(1, 9)
  })

  it('90 derajat menghadap kanan', () => {
    const v = facingToVector(90)
    expect(v.x).toBeCloseTo(1, 9)
  })

  it('vectorToFacing membalik facingToVector', () => {
    for (const deg of [0, 37, 90, 180, 271, 359]) {
      expect(vectorToFacing(facingToVector(deg))).toBeCloseTo(deg, 6)
    }
  })

  it('lerpAngle memilih jalur terpendek melewati 0/360', () => {
    // 350 -> 10 harus lewat 0, bukan memutar 340 derajat.
    expect(lerpAngle(350, 10, 0.5)).toBeCloseTo(0, 6)
    expect(lerpAngle(10, 350, 0.5)).toBeCloseTo(0, 6)
  })
})

describe('pertanyaan taktis', () => {
  it('sudut di |x| >= 6,60 berada di luar garis 3 poin', () => {
    expect(isBehindThreePointLine({ x: 6.7, y: 0.4 })).toBe(true)
    expect(isBehindThreePointLine({ x: 6.4, y: 0.4 })).toBe(false)
  })

  it('top of key di luar busur 6,75 m', () => {
    expect(isBehindThreePointLine({ x: 0, y: 7.2 })).toBe(true)
    expect(isBehindThreePointLine({ x: 0, y: 6.2 })).toBe(false)
  })

  it('shotValue memberi 3 di luar garis dan 2 di dalam', () => {
    expect(shotValue({ x: 0, y: 7.5 })).toBe(3)
    expect(shotValue({ x: 6.7, y: 0.3 })).toBe(3)
    expect(shotValue({ x: 0, y: 1.2 })).toBe(2)
  })

  it('isInPaint mengenali area persegi di depan ring', () => {
    expect(isInPaint({ x: 0, y: 2 })).toBe(true)
    expect(isInPaint({ x: 2.4, y: 4.0 })).toBe(true)
    expect(isInPaint({ x: 2.6, y: 2 })).toBe(false)
    expect(isInPaint({ x: 0, y: 5.0 })).toBe(false)
  })

  it('distToRim mengukur dari pusat ring', () => {
    expect(distToRim({ x: 3, y: 4 })).toBeCloseTo(5, 6)
  })

  it('courtSide membedakan sisi kuat, lemah, dan tengah', () => {
    const ball = { x: 5, y: 2 }
    expect(courtSide({ x: 6, y: 1 }, ball)).toBe('strong')
    expect(courtSide({ x: -6, y: 1 }, ball)).toBe('weak')
    expect(courtSide({ x: 6, y: 1 }, { x: 0.2, y: 8 })).toBe('middle')
  })
})

describe('zona lapangan (materi modul 1.3)', () => {
  it('ada 17 zona bernama', () => {
    expect(ZONES).toHaveLength(17)
  })

  it('setiap zona punya label dan penjelasan Bahasa Indonesia', () => {
    for (const z of ZONES) {
      expect(z.label.length).toBeGreaterThan(0)
      expect(z.note.length).toBeGreaterThan(10)
    }
  })

  it('elbow berada tepat di pertemuan garis lemparan bebas dan sisi paint', () => {
    const elbow = ZONES.find((z) => z.id === 'elbow-right')
    expect(elbow?.center.x).toBeCloseTo(PAINT_HALF_WIDTH, 6)
    expect(elbow?.center.y).toBeCloseTo(FREE_THROW_Y, 6)
  })

  it('sudut berada pada segmen lurus garis 3 poin', () => {
    const corner = ZONES.find((z) => z.id === 'corner-right')
    expect(corner?.center.x).toBeCloseTo(THREE_CORNER_X, 6)
    expect(isBehindThreePointLine(corner!.center)).toBe(true)
  })

  it('zoneAt menemukan zona di titik yang disentuh', () => {
    expect(zoneAt({ x: 0, y: 7.8 })?.id).toBe('top-of-key')
    expect(zoneAt({ x: 5.5, y: 4.6 })?.id).toBe('wing-right')
  })

  it('zoneAt mengembalikan null di luar semua radius', () => {
    expect(zoneAt({ x: 7.4, y: 11 })).toBeNull()
  })
})
