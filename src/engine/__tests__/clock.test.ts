/**
 * Uji Master Clock — kriteria penerimaan F-10 (PRD §8):
 *  - "ketika kecepatan diubah ke 0,25x, maka seluruh animasi termasuk efek ikut
 *     melambat secara konsisten"
 *  - "ketika pengguna menekan 'fase berikutnya', maka animasi berjalan sampai
 *     akhir fase lalu berhenti otomatis"
 * dan F-30: "bullet time dimatikan" saat Kurangi Gerak aktif.
 *
 * Jam diuji lewat tick(dtMs) manual, bukan requestAnimationFrame, supaya
 * deterministik.
 */

import { describe, expect, it, vi } from 'vitest'

import { BULLET_TIME_SCALE, MasterClock, SPEED_STEPS, type ClockOptions } from '../clock'
import type { Decision, Phase } from '../schema'

const phases: Phase[] = [
  { id: 'p1', title: { id: 'Setup' }, tStart: 0, tEnd: 2 },
  { id: 'p2', title: { id: 'Screen' }, tStart: 2, tEnd: 3 },
  { id: 'p3', title: { id: 'Roll' }, tStart: 3, tEnd: 4 },
]

const decisions: Decision[] = [
  {
    id: 'd1',
    t: 3.5,
    owner: 'O1',
    cue: { id: 'Baca bek' },
    options: [
      { id: 'a', label: { id: 'A' }, correct: true, explain: { id: 'benar' } },
      { id: 'b', label: { id: 'B' }, correct: false, explain: { id: 'salah' } },
    ],
  },
]

function makeClock(opts: Partial<ClockOptions> = {}) {
  return new MasterClock({ duration: 4, phases, decisions: [], ...opts })
}

describe('putar / jeda', () => {
  it('mulai dari jeda di t = 0', () => {
    const c = makeClock()
    expect(c.time).toBe(0)
    expect(c.isPlaying).toBe(false)
  })

  it('tick tidak memajukan waktu saat dijeda', () => {
    const c = makeClock()
    c.tick(1000)
    expect(c.time).toBe(0)
  })

  it('maju 1 detik waktu nyata = 1 detik taktik pada kecepatan 1x', () => {
    const c = makeClock()
    c.play()
    for (let i = 0; i < 20; i++) c.tick(50)
    expect(c.time).toBeCloseTo(1, 6)
  })

  it('toggle membalik keadaan', () => {
    const c = makeClock()
    c.toggle()
    expect(c.isPlaying).toBe(true)
    c.toggle()
    expect(c.isPlaying).toBe(false)
  })

  it('menekan putar di ujung taktik memulai ulang dari awal', () => {
    const c = makeClock()
    c.seek(4)
    c.play()
    expect(c.time).toBe(0)
  })

  it('berhenti otomatis di akhir durasi', () => {
    const c = makeClock()
    c.play()
    for (let i = 0; i < 200; i++) c.tick(50)
    expect(c.time).toBe(4)
    expect(c.isPlaying).toBe(false)
  })

  it('loop mengulang dari awal bila diaktifkan', () => {
    const c = makeClock({ loop: true })
    c.play()
    for (let i = 0; i < 100; i++) c.tick(50)
    expect(c.isPlaying).toBe(true)
    expect(c.time).toBeLessThan(4)
  })
})

describe('kecepatan 0,25x - 2x (F-10)', () => {
  it('menyediakan tujuh langkah kecepatan dari 0,25 sampai 2', () => {
    expect(SPEED_STEPS[0]).toBe(0.25)
    expect(SPEED_STEPS[SPEED_STEPS.length - 1]).toBe(2)
  })

  it('0,25x memajukan waktu seperempat kecepatan', () => {
    const c = makeClock()
    c.setSpeed(0.25)
    c.play()
    for (let i = 0; i < 20; i++) c.tick(50)
    expect(c.time).toBeCloseTo(0.25, 6)
  })

  it('2x memajukan waktu dua kali kecepatan', () => {
    const c = makeClock()
    c.setSpeed(2)
    c.play()
    for (let i = 0; i < 10; i++) c.tick(50)
    expect(c.time).toBeCloseTo(1, 6)
  })

  it('slower dan faster bergerak satu langkah dan berhenti di batas', () => {
    const c = makeClock()
    c.slower()
    expect(c.snapshot().speed).toBe(0.75)
    c.slower()
    c.slower()
    expect(c.snapshot().speed).toBe(0.25)
    c.slower()
    expect(c.snapshot().speed).toBe(0.25)

    for (let i = 0; i < 10; i++) c.faster()
    expect(c.snapshot().speed).toBe(2)
  })

  it('delta frame yang sangat besar dijepit agar tidak teleportasi', () => {
    // Tab yang kembali dari latar belakang bisa memberi delta 5 detik.
    const c = makeClock()
    c.play()
    c.tick(5000)
    expect(c.time).toBeLessThanOrEqual(0.1)
  })
})

describe('geser (seek)', () => {
  it('seek menjepit ke [0, durasi]', () => {
    const c = makeClock()
    c.seek(-5)
    expect(c.time).toBe(0)
    c.seek(99)
    expect(c.time).toBe(4)
  })

  it('nudge menggeser relatif — Shift + panah menggeser 1 detik', () => {
    const c = makeClock()
    c.seek(2)
    c.nudge(1)
    expect(c.time).toBeCloseTo(3, 6)
    c.nudge(-1)
    expect(c.time).toBeCloseTo(2, 6)
  })

  it('memberi tahu pelanggan saat digeser', () => {
    const c = makeClock()
    const spy = vi.fn()
    c.subscribe(spy)
    c.seek(1.5)
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls.at(-1)?.[0].t).toBeCloseTo(1.5, 6)
  })

  it('berhenti berlangganan setelah unsubscribe', () => {
    const c = makeClock()
    const spy = vi.fn()
    const off = c.subscribe(spy)
    off()
    c.seek(1)
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('navigasi fase (F-10)', () => {
  it('fase berikutnya MEMUTAR sisa fase lalu berhenti otomatis di batasnya', () => {
    const c = makeClock()
    c.seek(0.5)
    c.stepPhase(1)
    expect(c.isPlaying).toBe(true)
    for (let i = 0; i < 200; i++) c.tick(20)
    // Harus berhenti tepat di tEnd fase 1, bukan lanjut ke fase 2.
    expect(c.time).toBeCloseTo(2, 6)
    expect(c.isPlaying).toBe(false)
  })

  it('dari batas fase, fase berikutnya memutar fase berikutnya penuh', () => {
    const c = makeClock()
    c.seek(2)
    c.stepPhase(1)
    for (let i = 0; i < 200; i++) c.tick(20)
    expect(c.time).toBeCloseTo(3, 6)
  })

  it('fase sebelumnya kembali ke awal fase saat ini bila sudah jauh di dalamnya', () => {
    const c = makeClock()
    c.seek(2.7)
    c.stepPhase(-1)
    expect(c.time).toBeCloseTo(2, 6)
  })

  it('fase sebelumnya mundur ke fase sebelumnya bila baru masuk', () => {
    const c = makeClock()
    c.seek(2.1)
    c.stepPhase(-1)
    expect(c.time).toBeCloseTo(0, 6)
  })

  it('replayPhase kembali ke awal fase dan memutar sampai batasnya', () => {
    const c = makeClock()
    c.seek(2.6)
    c.replayPhase()
    expect(c.time).toBeCloseTo(2, 6)
    for (let i = 0; i < 200; i++) c.tick(20)
    expect(c.time).toBeCloseTo(3, 6)
    expect(c.isPlaying).toBe(false)
  })

  it('jumpToPhase melompat tanpa memutar', () => {
    const c = makeClock()
    c.jumpToPhase(2)
    expect(c.time).toBeCloseTo(3, 6)
    expect(c.isPlaying).toBe(false)
  })

  it('jumpToPhase menjepit indeks di luar rentang', () => {
    const c = makeClock()
    c.jumpToPhase(99)
    expect(c.time).toBeCloseTo(3, 6)
  })

  it('tanpa fase, navigasi fase tidak melakukan apa pun', () => {
    const c = new MasterClock({ duration: 4, phases: [], decisions: [] })
    c.stepPhase(1)
    c.replayPhase()
    expect(c.time).toBe(0)
  })
})

describe('bullet time (A-09)', () => {
  it('skala waktu turun ke 0,3x di dalam jendela keputusan', () => {
    const c = new MasterClock({ duration: 4, phases, decisions })
    c.seek(3.5)
    expect(c.snapshot().bulletScale).toBeCloseTo(BULLET_TIME_SCALE, 6)
    expect(c.inDecisionWindow()).toBe(true)
  })

  it('skala waktu normal di luar jendela keputusan', () => {
    const c = new MasterClock({ duration: 4, phases, decisions })
    c.seek(1.0)
    expect(c.snapshot().bulletScale).toBe(1)
    expect(c.inDecisionWindow()).toBe(false)
  })

  it('di-ramp bertahap, bukan tiba-tiba', () => {
    const c = new MasterClock({ duration: 4, phases, decisions })
    c.seek(2.9)
    c.play()
    const observed: number[] = []
    for (let i = 0; i < 12; i++) {
      c.tick(16)
      observed.push(c.snapshot().bulletScale)
    }
    // Harus ada nilai menengah antara 1 dan 0,3 — bukan langsung melompat.
    expect(observed.some((v) => v < 1 && v > BULLET_TIME_SCALE)).toBe(true)
  })

  it('waktu taktik berjalan lebih lambat selama bullet time', () => {
    const plain = new MasterClock({ duration: 10, phases: [], decisions: [] })
    const bullet = new MasterClock({
      duration: 10,
      phases: [],
      decisions: [{ ...decisions[0]!, t: 0.2 }],
    })
    plain.seek(0)
    bullet.seek(0)
    plain.play()
    bullet.play()
    for (let i = 0; i < 40; i++) {
      plain.tick(25)
      bullet.tick(25)
    }
    expect(bullet.time).toBeLessThan(plain.time)
  })

  it('effectiveScale adalah hasil kali kecepatan pengguna dan bullet time', () => {
    const c = new MasterClock({ duration: 4, phases, decisions })
    c.setSpeed(0.5)
    c.seek(3.5)
    expect(c.snapshot().effectiveScale).toBeCloseTo(0.5 * BULLET_TIME_SCALE, 6)
  })
})

describe('Kurangi Gerak (F-30)', () => {
  it('bullet time diganti jeda langsung di momen keputusan', () => {
    const c = new MasterClock({ duration: 4, phases, decisions, reducedMotion: true })
    c.seek(2.9)
    c.play()
    for (let i = 0; i < 40; i++) c.tick(16)
    // Harus berhenti saat mencapai jendela keputusan, bukan melambat.
    expect(c.isPlaying).toBe(false)
    expect(c.snapshot().bulletScale).toBe(1)
    expect(c.time).toBeGreaterThanOrEqual(3.5 - 0.45 - 0.05)
  })

  it('setelah melewati jendela, pemutaran normal kembali', () => {
    const c = new MasterClock({ duration: 4, phases, decisions, reducedMotion: true })
    c.seek(2.9)
    c.play()
    for (let i = 0; i < 40; i++) c.tick(16)
    expect(c.isPlaying).toBe(false)
    // Pengguna menekan putar lagi; jam melanjutkan tanpa melambat.
    c.play()
    const before = c.time
    for (let i = 0; i < 4; i++) c.tick(25)
    expect(c.time - before).toBeCloseTo(0.1, 2)
  })

  it('setReducedMotion bisa dimatikan saat berjalan', () => {
    const c = new MasterClock({ duration: 4, phases, decisions, reducedMotion: true })
    c.setReducedMotion(false)
    c.seek(3.5)
    c.play()
    c.tick(16)
    expect(c.snapshot().bulletScale).toBeLessThan(1)
  })
})

describe('destroy', () => {
  it('melepas semua pelanggan', () => {
    const c = makeClock()
    const spy = vi.fn()
    c.subscribe(spy)
    c.destroy()
    c.seek(2)
    expect(spy).not.toHaveBeenCalled()
  })
})
