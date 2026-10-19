/**
 * Master Clock — PRD §14:
 *   "Putar, jeda, geser, skala waktu, dan rampa bullet time."
 *
 * PRD §10 "Orkestrasi":
 *   "Semua animasi taktik (pemain, bola, garis, label fase) adalah fungsi murni
 *    dari waktu t; geser mundur memutar semuanya mundur dengan tepat."
 *
 * Jam ini adalah SATU-SATUNYA sumber waktu. Keluarannya hanya `t` — ia tidak
 * pernah menyimpan posisi apa pun. Dengan begitu kriteria penerimaan F-10
 * ("geser timeline -> semua pemain dan bola berada di posisi yang tepat untuk
 * waktu itu tanpa lompatan") terpenuhi dengan sendirinya.
 */

import { clamp } from './court'
import type { Decision, Phase } from './schema'

/** Kecepatan yang bisa dipilih pengguna — PRD §8 F-10: 0,25x sampai 2x. */
export const SPEED_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const
export type PlaybackSpeed = (typeof SPEED_STEPS)[number]

/** Skala waktu saat bullet time — PRD §7: "waktu melambat ke 0,3x". */
export const BULLET_TIME_SCALE = 0.3
/** Durasi ramp masuk/keluar bullet time — PRD §10 A-09: "250 ms masuk". */
export const BULLET_RAMP_MS = 250

export interface ClockSnapshot {
  t: number
  playing: boolean
  /** Kecepatan yang dipilih pengguna */
  speed: PlaybackSpeed
  /** Skala bullet time aktif (1 = normal, 0,3 = melambat penuh) */
  bulletScale: number
  /** Skala waktu efektif = speed * bulletScale */
  effectiveScale: number
  duration: number
  /** Batas waktu tempat pemutaran berhenti otomatis (fase berikutnya) */
  stopAt: number | null
}

export interface ClockOptions {
  duration: number
  /** Fase taktik — dipakai stepPhase & replayPhase */
  phases: readonly Phase[]
  /** Keputusan — memicu ramp bullet time (A-09) */
  decisions: readonly Decision[]
  /**
   * F-30: saat "Kurangi Gerak" aktif, bullet time DIGANTI JEDA LANGSUNG
   * (lihat matriks PRD §10 "Tingkat kualitas & kurangi gerak").
   */
  reducedMotion?: boolean
  /** Ulang dari awal setelah mencapai akhir */
  loop?: boolean
  onTick?: (snap: ClockSnapshot) => void
}

/** Jendela waktu tempat bullet time aktif, sepadan dengan state.ts. */
const DECISION_LEAD = 0.45
const DECISION_TRAIL = 1.1

export class MasterClock {
  private t = 0
  private playing = false
  private speed: PlaybackSpeed = 1
  private bulletScale = 1
  private stopAt: number | null = null
  private rafId: number | null = null
  private lastFrameMs: number | null = null
  private opts: ClockOptions
  private listeners = new Set<(snap: ClockSnapshot) => void>()
  /**
   * Keputusan yang jedanya SUDAH diberikan dalam mode Kurangi Gerak.
   * Tanpa ini, jam akan menjeda ulang setiap frame selama masih berada di
   * jendela keputusan — pengguna tidak akan pernah bisa melanjutkan.
   */
  private reducedMotionHandled: string | null = null

  constructor(opts: ClockOptions) {
    this.opts = opts
    if (opts.onTick) this.listeners.add(opts.onTick)
  }

  /* ---------------------------------------------------------------------- */
  /* Pembacaan                                                              */
  /* ---------------------------------------------------------------------- */

  get time(): number {
    return this.t
  }

  get isPlaying(): boolean {
    return this.playing
  }

  snapshot(): ClockSnapshot {
    return {
      t: this.t,
      playing: this.playing,
      speed: this.speed,
      bulletScale: this.bulletScale,
      effectiveScale: this.speed * this.bulletScale,
      duration: this.opts.duration,
      stopAt: this.stopAt,
    }
  }

  subscribe(fn: (snap: ClockSnapshot) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit(): void {
    const snap = this.snapshot()
    for (const fn of this.listeners) fn(snap)
  }

  /* ---------------------------------------------------------------------- */
  /* Kendali pemutaran (F-10)                                               */
  /* ---------------------------------------------------------------------- */

  play(): void {
    if (this.playing) return
    // Menekan putar di ujung taktik memulai ulang dari awal.
    if (this.t >= this.opts.duration - 1e-6) this.t = 0
    this.playing = true
    this.lastFrameMs = null
    this.startLoop()
    this.emit()
  }

  pause(): void {
    if (!this.playing) return
    this.playing = false
    this.stopLoop()
    this.emit()
  }

  toggle(): void {
    if (this.playing) this.pause()
    else this.play()
  }

  /** Geser ke waktu tertentu. Tidak pernah melompati batas taktik. */
  seek(t: number, opts: { clearStop?: boolean } = {}): void {
    this.t = clamp(t, 0, this.opts.duration)
    if (opts.clearStop !== false) this.stopAt = null
    // Bullet time dihitung ulang langsung agar geser ke momen keputusan
    // menampilkan kondisi melambat tanpa harus menunggu ramp.
    this.bulletScale = this.targetBulletScale(this.t)
    // Menggeser TEPAT ke dalam jendela keputusan berarti pengguna sengaja ke
    // sana; menekan putar setelah itu harus melanjutkan, bukan langsung
    // menjeda lagi. Menggeser ke luar jendela mengembalikan jeda otomatis.
    this.reducedMotionHandled = this.activeDecisionId(this.t)
    this.emit()
  }

  /** Geser relatif — Shift + panah menggeser 1 detik (PRD §11). */
  nudge(delta: number): void {
    this.seek(this.t + delta)
  }

  setSpeed(speed: PlaybackSpeed): void {
    this.speed = speed
    this.emit()
  }

  /** Turunkan kecepatan satu langkah — tombol `[` (PRD §11). */
  slower(): void {
    const i = SPEED_STEPS.indexOf(this.speed)
    this.setSpeed(SPEED_STEPS[Math.max(0, i - 1)] as PlaybackSpeed)
  }

  /** Naikkan kecepatan satu langkah — tombol `]` (PRD §11). */
  faster(): void {
    const i = SPEED_STEPS.indexOf(this.speed)
    this.setSpeed(SPEED_STEPS[Math.min(SPEED_STEPS.length - 1, i + 1)] as PlaybackSpeed)
  }

  setReducedMotion(value: boolean): void {
    this.opts.reducedMotion = value
    if (!value) this.reducedMotionHandled = null
  }

  /* ---------------------------------------------------------------------- */
  /* Navigasi fase                                                          */
  /* ---------------------------------------------------------------------- */

  private phaseIndexAt(t: number): number {
    const phases = this.opts.phases
    for (let i = 0; i < phases.length; i++) {
      const p = phases[i] as Phase
      if (t >= p.tStart && t < p.tEnd) return i
    }
    return t <= 0 ? 0 : phases.length - 1
  }

  /**
   * Maju / mundur satu fase.
   *
   * Kriteria penerimaan F-10: "ketika pengguna menekan 'fase berikutnya', maka
   * animasi berjalan sampai akhir fase lalu berhenti otomatis." Jadi tombol ini
   * tidak melompat — ia MEMUTAR fase itu lalu berhenti di batasnya.
   */
  stepPhase(direction: 1 | -1): void {
    const phases = this.opts.phases
    if (phases.length === 0) return

    const current = this.phaseIndexAt(this.t)

    if (direction === 1) {
      const target = phases[Math.min(current + 1, phases.length - 1)] as Phase
      const currentPhase = phases[current] as Phase
      // Bila belum selesai fase sekarang: putar sisa fase sekarang lalu berhenti.
      if (this.t < currentPhase.tEnd - 1e-3) {
        this.stopAt = currentPhase.tEnd
      } else {
        this.seek(target.tStart, { clearStop: false })
        this.stopAt = target.tEnd
      }
    } else {
      const currentPhase = phases[current] as Phase
      // Jika baru masuk fase ini, mundur ke fase sebelumnya; kalau sudah jauh
      // di dalam fase, kembali ke awal fase ini (perilaku "rewind" yang lazim).
      const atStart = this.t - currentPhase.tStart < 0.25
      const target = atStart ? (phases[Math.max(0, current - 1)] as Phase) : currentPhase
      this.seek(target.tStart, { clearStop: false })
      this.stopAt = target.tEnd
    }

    this.play()
  }

  /** Ulang fase saat ini dari awalnya (F-10 "ulang fase"). */
  replayPhase(): void {
    const phases = this.opts.phases
    if (phases.length === 0) return
    const p = phases[this.phaseIndexAt(this.t)] as Phase
    this.seek(p.tStart, { clearStop: false })
    this.stopAt = p.tEnd
    this.play()
  }

  /** Lompat ke awal sebuah fase tanpa memutar (klik segmen timeline). */
  jumpToPhase(index: number): void {
    const p = this.opts.phases[clamp(index, 0, this.opts.phases.length - 1)]
    if (p) this.seek(p.tStart)
  }

  /* ---------------------------------------------------------------------- */
  /* Bullet time (A-09)                                                     */
  /* ---------------------------------------------------------------------- */

  /** Id keputusan yang jendelanya mencakup t, atau null. */
  private activeDecisionId(t: number): string | null {
    for (const d of this.opts.decisions) {
      if (t >= d.t - DECISION_LEAD && t <= d.t + DECISION_TRAIL) return d.id
    }
    return null
  }

  /** Skala bullet time yang dituju pada waktu t. */
  private targetBulletScale(t: number): number {
    return this.activeDecisionId(t) === null ? 1 : BULLET_TIME_SCALE
  }

  /** Apakah waktu t berada di dalam jendela keputusan. */
  inDecisionWindow(t = this.t): boolean {
    return this.targetBulletScale(t) < 1
  }

  /* ---------------------------------------------------------------------- */
  /* Loop                                                                   */
  /* ---------------------------------------------------------------------- */

  private startLoop(): void {
    if (this.rafId !== null) return
    if (typeof requestAnimationFrame !== 'function') return
    const step = (nowMs: number) => {
      this.rafId = null
      this.advanceFrame(nowMs)
      if (this.playing) {
        this.rafId = requestAnimationFrame(step)
      }
    }
    this.rafId = requestAnimationFrame(step)
  }

  private stopLoop(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId)
    }
    this.rafId = null
    this.lastFrameMs = null
  }

  /**
   * Satu langkah frame. Dipisahkan dari requestAnimationFrame agar bisa diuji
   * secara deterministik dengan `tick(dtMs)`.
   */
  private advanceFrame(nowMs: number): void {
    if (this.lastFrameMs === null) {
      this.lastFrameMs = nowMs
      return
    }
    const dtMs = nowMs - this.lastFrameMs
    this.lastFrameMs = nowMs
    this.tick(dtMs)
  }

  /**
   * Majukan waktu `dtMs` milidetik waktu nyata.
   *
   * - delta dijepit ke 100 ms: tab yang kembali dari latar belakang tidak boleh
   *   membuat pemain "teleportasi" (PRD §10 prinsip "Kontinu")
   * - skala waktu = kecepatan pengguna x skala bullet time
   * - bullet time di-ramp selama 250 ms, atau diganti jeda langsung saat
   *   Kurangi Gerak aktif (F-30)
   */
  tick(dtMsRaw: number): void {
    if (!this.playing) return

    const dtMs = clamp(dtMsRaw, 0, 100)

    const activeDecision = this.activeDecisionId(this.t)
    const target = activeDecision === null ? 1 : BULLET_TIME_SCALE

    if (this.opts.reducedMotion) {
      // Kurangi Gerak: tanpa perlambatan bertahap. Saat mencapai momen
      // keputusan, pemutaran berhenti SEKALI supaya pengguna tetap punya waktu
      // membaca kartu isyarat — ini padanan "diganti jeda langsung" di matriks
      // PRD §10. Menekan putar lagi melanjutkan dengan kecepatan penuh.
      this.bulletScale = 1
      if (activeDecision !== null) {
        if (this.reducedMotionHandled !== activeDecision) {
          this.reducedMotionHandled = activeDecision
          this.pause()
          return
        }
      } else {
        this.reducedMotionHandled = null
      }
    } else {
      const rampStep = dtMs / BULLET_RAMP_MS
      if (this.bulletScale < target) {
        this.bulletScale = Math.min(target, this.bulletScale + rampStep * (1 - BULLET_TIME_SCALE))
      } else if (this.bulletScale > target) {
        this.bulletScale = Math.max(target, this.bulletScale - rampStep * (1 - BULLET_TIME_SCALE))
      }
    }

    const dt = (dtMs / 1000) * this.speed * this.bulletScale
    let next = this.t + dt

    // Berhenti otomatis di batas fase (F-10).
    if (this.stopAt !== null && next >= this.stopAt) {
      next = this.stopAt
      this.t = next
      this.stopAt = null
      this.pause()
      return
    }

    if (next >= this.opts.duration) {
      if (this.opts.loop) {
        this.t = next % this.opts.duration
        this.bulletScale = this.targetBulletScale(this.t)
      } else {
        this.t = this.opts.duration
        this.pause()
        return
      }
    } else {
      this.t = next
    }

    this.emit()
  }

  /** Hentikan loop & lepas pendengar. Wajib dipanggil saat komponen dilepas. */
  destroy(): void {
    this.stopLoop()
    this.listeners.clear()
  }
}
