/**
 * Profil kecepatan & waktu gerak — PRD §10 "Gerak pemain dan bola".
 *
 *   "Profil kecepatan (perkiraan dunia nyata): jalan sekitar 1,5 m/s,
 *    jogging 3-4 m/s, sprint 6-7 m/s, slide bertahan 2,5-3,5 m/s."
 *
 *   "Tikungan tajam: V-cut dan L-cut punya jeda tanam kaki 80 ms di titik
 *    belok, lalu akselerasi keluar."
 *
 * Modul ini mengubah sebuah jalur (PathLUT) + durasi menjadi fungsi
 * waktu -> jarak tempuh. Dipisah dari interpolator supaya bisa diuji sendiri
 * dan dipakai validator untuk memeriksa sanity kecepatan (<= 8 m/s).
 */

import type { PathLUT } from './geometry'
import type { SpeedProfile } from './schema'

/** Kecepatan jelajah (m/s) per profil — titik tengah rentang PRD §10. */
export const SPEED_MPS: Record<SpeedProfile, number> = {
  slow: 0.8,
  walk: 1.5,
  jog: 3.5,
  sprint: 6.5,
  slide: 3.0,
}

/** Sanity check PRD §13: kecepatan pemain tidak boleh melewati 8 m/s. */
export const MAX_PLAYER_SPEED = 8

/** Jeda tanam kaki di tikungan tajam (detik) — PRD §10. */
export const FOOT_PLANT_SEC = 0.08

/** Umpan selalu tampil minimal 250 ms di layar (PRD §10). */
export const MIN_PASS_SEC = 0.25

/** Waktu terbang tembakan (detik) — PRD §10 "busur parabola ~1 detik". */
export const SHOT_FLIGHT_SEC = 1.0

/** Fraksi waktu leg untuk ramp akselerasi dan deselerasi. */
const ACCEL_RAMP = 0.25
const DECEL_RAMP = 0.25

/**
 * Satu "leg" = bagian jalur antara dua jeda tanam kaki (atau ujung jalur).
 * Pemain melambat masuk tikungan, menanam kaki, lalu akselerasi keluar —
 * persis perilaku yang diminta PRD.
 */
interface Leg {
  /** Jarak kumulatif awal leg (meter) */
  startS: number
  /** Jarak kumulatif akhir leg (meter) */
  endS: number
  /** Durasi bergerak di leg ini (detik) */
  duration: number
  /** Jeda diam setelah leg ini (detik) — 0 di leg terakhir */
  dwellAfter: number
  accelRamp: number
  decelRamp: number
}

/** Fungsi waktu -> jarak untuk satu event gerak. */
export interface MotionProfile {
  /** Panjang total jalur (meter) */
  length: number
  /** Total durasi event termasuk jeda tanam kaki (detik) */
  duration: number
  /** Jarak tempuh (meter) pada waktu lokal `dt` detik sejak event mulai */
  distanceAt(dt: number): number
  /** Kecepatan sesaat (m/s) pada waktu lokal `dt` */
  speedAt(dt: number): number
  /** Kecepatan jelajah efektif (m/s) — dipakai validator & frekuensi dribble */
  cruiseSpeed: number
}

/**
 * Integral profil kecepatan trapesium, dinormalkan sehingga f(0)=0 dan f(1)=1.
 *
 * Kecepatan: naik linear selama `ra`, jelajah tetap, turun linear selama `rd`.
 * Hasilnya percepatan dan perlambatan yang terasa nyata, tetapi dengan segmen
 * jelajah berkecepatan tetap — syarat agar "sprint 6,5 m/s" punya arti.
 */
function trapezoidFraction(tau: number, ra: number, rd: number): number {
  if (tau <= 0) return 0
  if (tau >= 1) return 1

  // Luas di bawah kurva kecepatan tak-ternormalisasi (puncak = 1).
  const k = 1 - ra / 2 - rd / 2
  const cruiseEnd = 1 - rd

  let area: number
  if (tau < ra) {
    // Fase akselerasi: luas segitiga.
    area = (tau * tau) / (2 * ra)
  } else if (tau <= cruiseEnd) {
    area = ra / 2 + (tau - ra)
  } else {
    const back = 1 - tau
    area = k - (back * back) / (2 * rd)
  }
  return area / k
}

/** Kecepatan ternormalkan (0..1/k) pada fraksi waktu tau. */
function trapezoidSpeed(tau: number, ra: number, rd: number): number {
  if (tau <= 0 || tau >= 1) return 0
  const k = 1 - ra / 2 - rd / 2
  const cruiseEnd = 1 - rd
  let v: number
  if (tau < ra) v = tau / ra
  else if (tau <= cruiseEnd) v = 1
  else v = (1 - tau) / rd
  return v / k
}

/**
 * Durasi alami sebuah gerak bila event tidak menyebut `dur`:
 * panjang jalur / kecepatan profil, ditambah jeda tanam kaki di tiap tikungan.
 */
export function naturalDuration(
  lut: PathLUT,
  profile: SpeedProfile,
  countCorners = true,
): number {
  const cruise = SPEED_MPS[profile]
  const dwell = countCorners ? lut.corners.length * FOOT_PLANT_SEC : 0
  if (lut.length < 1e-6) return Math.max(0.1, dwell)
  return lut.length / cruise + dwell
}

/**
 * Bangun profil gerak untuk satu event.
 *
 * @param lut      jalur yang sudah dipra-hitung
 * @param duration durasi total event (detik), termasuk jeda tanam kaki
 * @param opts.footPlant pakai jeda tanam kaki di tikungan tajam (cut/move)
 */
export function buildMotionProfile(
  lut: PathLUT,
  duration: number,
  opts: { footPlant?: boolean } = {},
): MotionProfile {
  const total = Math.max(duration, 1e-4)
  const useFootPlant = opts.footPlant !== false && lut.corners.length > 0

  // Jalur diam: tidak ada yang bergerak.
  if (lut.length < 1e-6) {
    return {
      length: 0,
      duration: total,
      distanceAt: () => 0,
      speedAt: () => 0,
      cruiseSpeed: 0,
    }
  }

  // Titik jeda = tikungan tajam yang benar-benar di tengah jalur.
  const dwellPoints = useFootPlant
    ? lut.corners
        .map((c) => c.distance)
        .filter((d) => d > 0.05 * lut.length && d < 0.95 * lut.length)
        .sort((a, b) => a - b)
    : []

  const totalDwell = dwellPoints.length * FOOT_PLANT_SEC
  // Jangan biarkan jeda menelan seluruh durasi: sisakan minimal 55% untuk gerak.
  const movingTime = Math.max(total * 0.55, total - totalDwell)
  const dwellEach =
    dwellPoints.length > 0 ? (total - movingTime) / dwellPoints.length : 0

  // Bagi jalur menjadi leg, waktu dialokasikan proporsional panjang
  // sehingga kecepatan jelajah seragam di seluruh jalur.
  const legs: Leg[] = []
  const edges = [0, ...dwellPoints, lut.length]
  for (let i = 0; i < edges.length - 1; i++) {
    const startS = edges[i] as number
    const endS = edges[i + 1] as number
    const legLen = endS - startS
    const isLast = i === edges.length - 2
    legs.push({
      startS,
      endS,
      duration: movingTime * (legLen / lut.length),
      dwellAfter: isLast ? 0 : dwellEach,
      // Leg pertama mulai dari diam; leg berikutnya juga (baru menanam kaki).
      accelRamp: ACCEL_RAMP,
      decelRamp: DECEL_RAMP,
    })
  }

  const cruiseSpeed = lut.length / movingTime / (1 - ACCEL_RAMP / 2 - DECEL_RAMP / 2)

  function walk(dt: number): { leg: Leg; tau: number; dwelling: boolean } | null {
    let remaining = dt
    for (const leg of legs) {
      if (remaining < leg.duration) {
        return { leg, tau: leg.duration < 1e-9 ? 1 : remaining / leg.duration, dwelling: false }
      }
      remaining -= leg.duration
      if (leg.dwellAfter > 0) {
        if (remaining < leg.dwellAfter) return { leg, tau: 1, dwelling: true }
        remaining -= leg.dwellAfter
      }
    }
    return null
  }

  return {
    length: lut.length,
    duration: total,
    cruiseSpeed,

    distanceAt(dt: number): number {
      if (dt <= 0) return 0
      if (dt >= total) return lut.length
      const hit = walk(dt)
      if (!hit) return lut.length
      const { leg, tau, dwelling } = hit
      if (dwelling) return leg.endS
      const frac = trapezoidFraction(tau, leg.accelRamp, leg.decelRamp)
      return leg.startS + (leg.endS - leg.startS) * frac
    },

    speedAt(dt: number): number {
      if (dt <= 0 || dt >= total) return 0
      const hit = walk(dt)
      if (!hit) return 0
      const { leg, tau, dwelling } = hit
      if (dwelling || leg.duration < 1e-9) return 0
      const legLen = leg.endS - leg.startS
      return (trapezoidSpeed(tau, leg.accelRamp, leg.decelRamp) * legLen) / leg.duration
    },
  }
}

/**
 * Frekuensi pantulan dribble (pantulan per detik).
 * PRD §10: "sekitar 2 pantulan per detik saat berjalan dan lebih cepat
 * saat sprint."
 */
export function dribbleFrequency(speedMps: number): number {
  return 2 + Math.max(0, speedMps) * 0.28
}
