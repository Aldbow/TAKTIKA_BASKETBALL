/**
 * Pengukuran performa di perangkat nyata — gerbang Fase 0 (PRD §17) dan
 * target PRD §15/§16:
 *
 *   G4  "Frame rate di perangkat menengah: stabil 60 fps (minimum 45 fps)"
 *   §16 "Median fps di Tactic Viewer pada perangkat nyata >= 55 fps"
 *
 * Diukur dari selang antar-frame requestAnimationFrame. Persentil dipakai
 * (bukan rata-rata) karena satu patahan 200 ms terasa jelas oleh mata, tetapi
 * hampir tidak menggeser rata-rata.
 */

/** Selang frame untuk 45 fps — batas bawah PRD G4. */
export const FRAME_MS_45 = 1000 / 45
/** Selang frame untuk 30 fps — patahan yang jelas terlihat. */
export const FRAME_MS_30 = 1000 / 30

/** Sampel terakhir yang disimpan (~1 menit pada 60 Hz). */
const MAX_SAMPLES = 3600
/** Selang lebih panjang dari ini dianggap tab tersembunyi/jeda, bukan patahan. */
const MAX_INTERVAL_MS = 1000

export interface FrameSummary {
  frames: number
  seconds: number
  /** fps dari median selang frame */
  medianFps: number
  /** fps dari persentil-95 selang frame ("low" — 5% frame terburuk) */
  lowFps: number
  /** % frame yang lebih lambat dari 45 fps */
  slowPct: number
  /** % frame yang lebih lambat dari 30 fps */
  verySlowPct: number
  /** Selang frame terburuk (ms) */
  worstMs: number
}

export type PerfVerdict = 'lolos' | 'batas' | 'gagal' | 'kurang-data'

export class FrameStats {
  private intervals: number[] = []

  push(dtMs: number): void {
    if (!(dtMs > 0) || dtMs > MAX_INTERVAL_MS) return
    this.intervals.push(dtMs)
    if (this.intervals.length > MAX_SAMPLES) this.intervals.shift()
  }

  reset(): void {
    this.intervals = []
  }

  get count(): number {
    return this.intervals.length
  }

  summary(): FrameSummary {
    const n = this.intervals.length
    if (n === 0) {
      return { frames: 0, seconds: 0, medianFps: 0, lowFps: 0, slowPct: 0, verySlowPct: 0, worstMs: 0 }
    }
    const sorted = [...this.intervals].sort((a, b) => a - b)
    const at = (q: number) => sorted[Math.min(n - 1, Math.floor(q * (n - 1)))] as number
    let slow = 0
    let verySlow = 0
    let total = 0
    for (const dt of this.intervals) {
      total += dt
      if (dt > FRAME_MS_45) slow++
      if (dt > FRAME_MS_30) verySlow++
    }
    return {
      frames: n,
      seconds: total / 1000,
      medianFps: 1000 / at(0.5),
      lowFps: 1000 / at(0.95),
      slowPct: (slow / n) * 100,
      verySlowPct: (verySlow / n) * 100,
      worstMs: sorted[n - 1] as number,
    }
  }
}

/**
 * Putusan gerbang Fase 0:
 *   lolos — median >= 55 fps DAN 95% frame >= 45 fps
 *   batas — median >= 45 fps (masih di atas minimum G4, tapi belum stabil)
 *   gagal — median < 45 fps
 * Butuh minimal 10 detik data agar tidak memutus dari boot-up saja.
 */
export function verdict(s: FrameSummary): PerfVerdict {
  if (s.seconds < 10) return 'kurang-data'
  if (s.medianFps >= 55 && s.lowFps >= 45) return 'lolos'
  if (s.medianFps >= 45) return 'batas'
  return 'gagal'
}

export const VERDICT_LABEL: Record<PerfVerdict, string> = {
  lolos: 'LOLOS',
  batas: 'BATAS',
  gagal: 'GAGAL',
  'kurang-data': 'UKUR ≥ 10 DTK',
}
