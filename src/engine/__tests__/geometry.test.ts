import { describe, expect, it } from 'vitest'

import {
  arcHeight,
  arcPoint,
  buildPath,
  measurePathLength,
  pathEnd,
  pathSlice,
  pathStart,
  samplePath,
  samplePathAtDistance,
} from '../geometry'

describe('buildPath', () => {
  it('jalur kosong punya panjang nol', () => {
    const lut = buildPath([])
    expect(lut.length).toBe(0)
    expect(lut.points).toHaveLength(0)
    expect(samplePathAtDistance(lut, 5).point).toEqual({ x: 0, y: 0 })
  })

  it('satu titik menghasilkan jalur diam', () => {
    const lut = buildPath([[2, 3]])
    expect(lut.length).toBe(0)
    expect(samplePath(lut, 0.5).point).toEqual({ x: 2, y: 3 })
    expect(pathStart(lut)).toEqual({ x: 2, y: 3 })
    expect(pathEnd(lut)).toEqual({ x: 2, y: 3 })
  })

  it('dua titik menghasilkan garis lurus dengan panjang tepat', () => {
    const lut = buildPath([[0, 0], [3, 4]])
    expect(lut.length).toBeCloseTo(5, 6)
    expect(samplePath(lut, 0.5).point.x).toBeCloseTo(1.5, 6)
    expect(samplePath(lut, 0.5).point.y).toBeCloseTo(2, 6)
  })

  it('kurva melewati semua titik kontrolnya', () => {
    const control: [number, number][] = [
      [0, 0],
      [2, 3],
      [5, 3],
      [7, 0],
    ]
    const lut = buildPath(control)
    for (const [cx, cy] of control) {
      // Cari jarak minimum dari titik kontrol ke kurva.
      let min = Infinity
      for (let i = 0; i <= 400; i++) {
        const p = samplePath(lut, i / 400).point
        min = Math.min(min, Math.hypot(p.x - cx, p.y - cy))
      }
      expect(min).toBeLessThan(0.02)
    }
  })

  it('titik awal dan akhir kurva sama dengan titik kontrol pertama dan terakhir', () => {
    const lut = buildPath([[1, 1], [4, 2], [6, 5]])
    expect(pathStart(lut).x).toBeCloseTo(1, 6)
    expect(pathStart(lut).y).toBeCloseTo(1, 6)
    expect(pathEnd(lut).x).toBeCloseTo(6, 6)
    expect(pathEnd(lut).y).toBeCloseTo(5, 6)
  })

  it('menangani titik kontrol kembar tanpa NaN', () => {
    const lut = buildPath([[1, 1], [1, 1], [3, 1], [3, 1]])
    expect(Number.isFinite(lut.length)).toBe(true)
    for (const p of lut.points) {
      expect(Number.isFinite(p.x)).toBe(true)
      expect(Number.isFinite(p.y)).toBe(true)
    }
  })
})

describe('parameterisasi panjang busur', () => {
  it('panjang LUT cocok dengan integrasi numerik rapat', () => {
    const lut = buildPath([
      [0, 8.2],
      [-1.7, 8.0],
      [0.4, 6.1],
      [2.8, 4.0],
    ])
    const measured = measurePathLength(lut, 8000)
    // LUT memakai 24 sampel per segmen; selisihnya harus di bawah 0,5%.
    expect(Math.abs(lut.length - measured) / measured).toBeLessThan(0.005)
  })

  it('kecepatan merata: jarak yang sama memberi langkah yang sama di tikungan', () => {
    // Jalur dengan satu segmen panjang dan satu segmen pendek. Tanpa
    // parameterisasi panjang busur, langkah di segmen panjang akan jauh lebih
    // besar daripada di segmen pendek.
    const lut = buildPath([
      [0, 0],
      [8, 0],
      [9, 1],
      [10, 6],
    ])
    const steps: number[] = []
    const n = 50
    for (let i = 1; i <= n; i++) {
      const a = samplePathAtDistance(lut, (lut.length * (i - 1)) / n).point
      const b = samplePathAtDistance(lut, (lut.length * i) / n).point
      steps.push(Math.hypot(b.x - a.x, b.y - a.y))
    }
    const max = Math.max(...steps)
    const min = Math.min(...steps)
    // Semua langkah harus hampir sama panjang.
    expect(max / min).toBeLessThan(1.1)
  })

  it('menjepit jarak di luar rentang ke ujung jalur', () => {
    const lut = buildPath([[0, 0], [4, 0]])
    expect(samplePathAtDistance(lut, -10).point.x).toBeCloseTo(0, 6)
    expect(samplePathAtDistance(lut, 99).point.x).toBeCloseTo(4, 6)
  })

  it('tangen menunjuk ke arah gerak', () => {
    const lut = buildPath([[0, 0], [10, 0]])
    const s = samplePath(lut, 0.5)
    expect(s.tangent.x).toBeCloseTo(1, 3)
    expect(s.tangent.y).toBeCloseTo(0, 3)
  })
})

describe('deteksi tikungan tajam', () => {
  it('menemukan titik belok V-cut', () => {
    // Turun lalu balik naik = belokan hampir 180 derajat.
    const lut = buildPath([[0, 6], [0, 3], [3, 6]])
    expect(lut.corners).toHaveLength(1)
    expect(lut.corners[0]?.index).toBe(1)
    expect(lut.corners[0]?.angleDeg).toBeGreaterThan(55)
  })

  it('tidak menandai kurva mulus sebagai tikungan', () => {
    const lut = buildPath([[0, 0], [2, 0.3], [4, 0.6], [6, 0.9]])
    expect(lut.corners).toHaveLength(0)
  })

  it('jarak kumulatif tikungan berada di dalam jalur', () => {
    const lut = buildPath([[0, 6], [0, 3], [3, 6]])
    const c = lut.corners[0]
    expect(c).toBeDefined()
    expect(c!.distance).toBeGreaterThan(0)
    expect(c!.distance).toBeLessThan(lut.length)
  })
})

describe('pathSlice', () => {
  it('mengembalikan potongan yang mulai dan berakhir di jarak yang diminta', () => {
    const lut = buildPath([[0, 0], [10, 0]])
    const slice = pathSlice(lut, 2, 6)
    expect(slice[0]?.x).toBeCloseTo(2, 4)
    expect(slice[slice.length - 1]?.x).toBeCloseTo(6, 4)
  })

  it('menormalkan urutan terbalik', () => {
    const lut = buildPath([[0, 0], [10, 0]])
    const slice = pathSlice(lut, 6, 2)
    expect(slice[0]?.x).toBeCloseTo(2, 4)
    expect(slice[slice.length - 1]?.x).toBeCloseTo(6, 4)
  })

  it('potongan nol mengembalikan satu titik', () => {
    const lut = buildPath([[0, 0], [10, 0]])
    expect(pathSlice(lut, 3, 3)).toHaveLength(1)
  })

  it('jalur kosong mengembalikan array kosong', () => {
    expect(pathSlice(buildPath([]), 0, 1)).toHaveLength(0)
  })
})

describe('busur bola', () => {
  it('mulai di pengirim dan berakhir di penerima', () => {
    const from = { x: 0, y: 8 }
    const to = { x: 5, y: 2 }
    const a = arcPoint(from, to, 0, 0.1)
    const b = arcPoint(from, to, 1, 0.1)
    expect(a.x).toBeCloseTo(from.x, 6)
    expect(a.y).toBeCloseTo(from.y, 6)
    expect(b.x).toBeCloseTo(to.x, 6)
    expect(b.y).toBeCloseTo(to.y, 6)
  })

  it('melengkung keluar dari garis lurus di tengah lintasan', () => {
    const from = { x: 0, y: 8 }
    const to = { x: 6, y: 8 }
    const mid = arcPoint(from, to, 0.5, 0.2)
    // Garis lurus akan memberi y = 8 tepat; busur harus menyimpang.
    expect(Math.abs(mid.y - 8)).toBeGreaterThan(0.2)
  })

  it('jarak nol tidak menghasilkan NaN', () => {
    const p = arcPoint({ x: 1, y: 1 }, { x: 1, y: 1 }, 0.5, 0.2)
    expect(p).toEqual({ x: 1, y: 1 })
  })

  it('ketinggian busur nol di ujung dan maksimum di tengah', () => {
    expect(arcHeight(0)).toBeCloseTo(0, 6)
    expect(arcHeight(1)).toBeCloseTo(0, 6)
    expect(arcHeight(0.5)).toBeCloseTo(1, 6)
  })
})
