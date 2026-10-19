/**
 * Pemilihan tingkat kualitas otomatis — F-30 & PRD §10.
 *
 * PRD §10: "Tingkat kualitas dipilih otomatis dari hasil uji frame rate 2 detik
 * pertama, dan bisa diubah manual di pengaturan."
 *
 * PRD §15 menetapkan targetnya: 60 fps, minimal 45 fps di perangkat acuan.
 * Jadi ambangnya:
 *   >= 52 fps  -> Tinggi
 *   >= 38 fps  -> Standar
 *   <  38 fps  -> Hemat
 */

import type { QualityTier } from '@/renderer2d/palette'

/** Lama uji frame rate (ms) — PRD §10: "2 detik pertama". */
export const PROBE_MS = 2000

export const TIER_LABEL: Record<QualityTier, string> = {
  high: 'Tinggi',
  standard: 'Standar',
  saver: 'Hemat',
}

export const TIER_NOTE: Record<QualityTier, string> = {
  high: 'Semua efek aktif: glow, blur, partikel, dan jejak gerak.',
  standard: 'Partikel dikurangi. Cocok untuk HP kelas menengah.',
  saver: 'Tanpa partikel dan tanpa blur; boot-up lapangan dipersingkat.',
}

export function tierFromFps(fps: number): QualityTier {
  if (fps >= 52) return 'high'
  if (fps >= 38) return 'standard'
  return 'saver'
}

/**
 * Kelas perangkat kasar untuk properti analitik `device_class`
 * (PRD §16 event `quality_tier_assigned`).
 */
export function deviceClass(): string {
  if (typeof navigator === 'undefined') return 'server'
  const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number }
  const cores = nav.hardwareConcurrency ?? 0
  const mem = (nav as unknown as { deviceMemory?: number }).deviceMemory ?? 0
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  if (!mobile && cores >= 8) return 'desktop-high'
  if (!mobile) return 'desktop-standard'
  if (cores >= 8 || mem >= 6) return 'mobile-high'
  if (cores >= 4) return 'mobile-mid'
  return 'mobile-low'
}

/**
 * Pengumpul sampel fps. CourtCanvas melaporkan fps tiap ~500 ms; kelas ini
 * mengumpulkannya selama PROBE_MS lalu memutuskan satu kali.
 *
 * Keputusan dibuat SEKALI per sesi. Mengubah tier di tengah animasi akan
 * membuat tampilan berkedip, dan itu lebih buruk daripada beberapa frame yang
 * terlewat.
 */
export class FpsProbe {
  private samples: number[] = []
  private startedAt: number | null = null
  private decided = false

  /** Masukkan satu sampel fps. Mengembalikan tier bila keputusan sudah bisa diambil. */
  push(fps: number, now = performance.now()): QualityTier | null {
    if (this.decided) return null
    if (this.startedAt === null) this.startedAt = now
    // Lewati sampel pertama: boot-up lapangan (A-01) memang berat dan tidak
    // mewakili performa pemutaran normal.
    if (now - this.startedAt < 600) return null

    this.samples.push(fps)
    if (now - this.startedAt < PROBE_MS) return null

    this.decided = true
    return tierFromFps(this.median())
  }

  median(): number {
    if (this.samples.length === 0) return 60
    const s = [...this.samples].sort((a, b) => a - b)
    const mid = Math.floor(s.length / 2)
    return s.length % 2 === 1
      ? (s[mid] as number)
      : ((s[mid - 1] as number) + (s[mid] as number)) / 2
  }

  get isDecided(): boolean {
    return this.decided
  }

  reset(): void {
    this.samples = []
    this.startedAt = null
    this.decided = false
  }
}

/** Apakah browser mendukung WebGL2? PRD §15: tanpa WebGL2 otomatis ke 2D. */
export function supportsWebGL2(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2'))
  } catch {
    return false
  }
}
