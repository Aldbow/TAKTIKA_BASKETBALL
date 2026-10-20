import { describe, expect, it } from 'vitest'

import { FrameStats, verdict } from '@/lib/perf'

function feed(stats: FrameStats, dtMs: number, frames: number) {
  for (let i = 0; i < frames; i++) stats.push(dtMs)
}

describe('FrameStats', () => {
  it('60 Hz stabil -> median & p95 sekitar 60 fps', () => {
    const s = new FrameStats()
    feed(s, 1000 / 60, 900)
    const sum = s.summary()
    expect(Math.round(sum.medianFps)).toBe(60)
    expect(Math.round(sum.lowFps)).toBe(60)
    expect(sum.slowPct).toBe(0)
    expect(verdict(sum)).toBe('lolos')
  })

  it('patahan sesekali menurunkan p95, bukan median', () => {
    const s = new FrameStats()
    feed(s, 1000 / 60, 850)
    feed(s, 50, 100) // ~10% frame di 20 fps
    const sum = s.summary()
    expect(Math.round(sum.medianFps)).toBe(60)
    expect(sum.lowFps).toBeLessThan(45)
    expect(verdict(sum)).toBe('batas')
  })

  it('median di bawah 45 fps -> gagal', () => {
    const s = new FrameStats()
    feed(s, 30, 600)
    expect(verdict(s.summary())).toBe('gagal')
  })

  it('selang > 1 detik (tab tersembunyi) diabaikan', () => {
    const s = new FrameStats()
    s.push(5000)
    s.push(-3)
    expect(s.count).toBe(0)
  })

  it('kurang dari 10 detik data belum diputus', () => {
    const s = new FrameStats()
    feed(s, 1000 / 60, 120)
    expect(verdict(s.summary())).toBe('kurang-data')
  })
})
