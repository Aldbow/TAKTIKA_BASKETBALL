/**
 * Uji lapisan runtime engine: Event Bus, Loader/cache, pembantu interpolator,
 * profil kecepatan, dan bola.
 *
 * Bagian-bagian ini yang menyambungkan engine ke UI — bus memberi tahu panel POV
 * dan kuis, loader mencegah kompilasi ulang setiap frame, dan garis prediksi
 * adalah inti A-03.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { TacticEventBus, type TacticBusEvent } from '../events'
import {
  clearCompileCache,
  getStateContext,
  invalidateTactic,
  loadAndValidate,
  parseTactic,
} from '../loader'
import {
  facingVectorOf,
  playerMotionAt,
  predictionPath,
  smoothedFacing,
  trailPath,
} from '../interpolator'
import {
  getPredictionPath,
  getTrail,
  getState,
  paintDwellSeconds,
  PAINT_HALF,
  type StateContext,
} from '../state'
import { buildBallTimeline, passLaneClearance, segmentAt } from '../ball'
import {
  MIN_PASS_SEC,
  SHOT_FLIGHT_SEC,
  SPEED_MPS,
  buildMotionProfile,
  dribbleFrequency,
  naturalDuration,
} from '../speed'
import { buildPath } from '../geometry'
import type { Tactic } from '../schema'

let spain: Tactic
let ctx: StateContext

beforeAll(() => {
  clearCompileCache()
  spain = parseTactic(
    JSON.parse(
      readFileSync(join(process.cwd(), 'content', 'tactics', 'set-spain-pnr.json'), 'utf8'),
    ),
  )
  ctx = getStateContext(spain).ctx
})

/* -------------------------------------------------------------------------- */
/* Event Bus                                                                  */
/* -------------------------------------------------------------------------- */

describe('TacticEventBus', () => {
  function collect(from: number, to: number, step = 0.05): TacticBusEvent[] {
    const bus = new TacticEventBus()
    const seen: TacticBusEvent[] = []
    bus.onAny((e) => seen.push(e))
    const dir = to >= from ? 1 : -1
    for (let t = from; dir > 0 ? t <= to : t >= to; t += step * dir) {
      bus.update(getState(ctx, Math.max(0, Math.min(spain.duration, t))))
    }
    return seen
  }

  it('frame pertama tidak memancarkan apa pun (belum ada pembanding)', () => {
    const bus = new TacticEventBus()
    const spy = vi.fn()
    bus.onAny(spy)
    bus.update(getState(ctx, 0))
    expect(spy).not.toHaveBeenCalled()
  })

  it('memancarkan phasechange saat melewati batas fase (A-10)', () => {
    const events = collect(1.8, 2.2)
    const change = events.find((e) => e.name === 'phasechange')
    expect(change).toBeDefined()
    expect(change?.previousPhase?.id).toBe('p1')
    expect(change?.phase?.id).toBe('p2')
    expect(change?.direction).toBe(1)
  })

  it('memancarkan decisionenter dan decisionexit (A-09)', () => {
    const names = collect(4.0, 6.3).map((e) => e.name)
    expect(names).toContain('decisionenter')
    expect(names).toContain('decisionexit')
  })

  it('memancarkan event screen dengan label yang bisa dipakai HUD', () => {
    const screen = collect(1.9, 2.2).find((e) => e.name === 'screen')
    expect(screen).toBeDefined()
    expect(screen?.actor).toBe('O5')
    expect(screen?.label).toBe('Ball screen')
  })

  it('memancarkan event pass dan shot', () => {
    const names = collect(5.0, 6.3).map((e) => e.name)
    expect(names).toContain('pass')
    const shot = collect(5.8, 6.3).find((e) => e.name === 'shot')
    expect(shot).toBeDefined()
    expect(shot?.actor).toBe('O2')
  })

  it('memancarkan tacticend sekali di akhir', () => {
    const ends = collect(7.0, 7.2).filter((e) => e.name === 'tacticend')
    expect(ends).toHaveLength(1)
  })

  it('geser mundur tetap memancarkan event dengan direction -1', () => {
    const events = collect(2.2, 1.8, 0.05)
    const change = events.find((e) => e.name === 'phasechange')
    expect(change?.direction).toBe(-1)
    expect(change?.phase?.id).toBe('p1')
  })

  it('memancarkan seek saat waktu melompat jauh', () => {
    const bus = new TacticEventBus()
    const seen: TacticBusEvent[] = []
    bus.onAny((e) => seen.push(e))
    bus.update(getState(ctx, 0))
    bus.update(getState(ctx, 5))
    expect(seen.some((e) => e.name === 'seek')).toBe(true)
  })

  it('pendengar bernama hanya menerima event jenisnya', () => {
    const bus = new TacticEventBus()
    const onPhase = vi.fn()
    const onShot = vi.fn()
    bus.on('phasechange', onPhase)
    bus.on('shot', onShot)
    bus.update(getState(ctx, 1.8))
    bus.update(getState(ctx, 2.2))
    expect(onPhase).toHaveBeenCalledTimes(1)
    expect(onShot).not.toHaveBeenCalled()
  })

  it('berhenti berlangganan menghentikan pengiriman', () => {
    const bus = new TacticEventBus()
    const spy = vi.fn()
    const off = bus.on('phasechange', spy)
    off()
    bus.update(getState(ctx, 1.8))
    bus.update(getState(ctx, 2.2))
    expect(spy).not.toHaveBeenCalled()
  })

  it('berhenti berlangganan onAny menghentikan pengiriman', () => {
    const bus = new TacticEventBus()
    const spy = vi.fn()
    const off = bus.onAny(spy)
    off()
    bus.update(getState(ctx, 1.8))
    bus.update(getState(ctx, 2.2))
    expect(spy).not.toHaveBeenCalled()
  })

  it('reset melupakan frame sebelumnya — dipakai saat cabang berganti', () => {
    const bus = new TacticEventBus()
    const spy = vi.fn()
    bus.onAny(spy)
    bus.update(getState(ctx, 1.8))
    bus.reset()
    bus.update(getState(ctx, 2.2))
    expect(spy).not.toHaveBeenCalled()
  })

  it('tidak memancarkan event untuk jenis gerak biasa (move/dribble/rotate)', () => {
    const names = collect(0, 1.0).map((e) => e.name)
    expect(names).not.toContain('move')
    expect(names).not.toContain('dribble')
  })
})

/* -------------------------------------------------------------------------- */
/* Loader & cache                                                             */
/* -------------------------------------------------------------------------- */

describe('loader', () => {
  it('parseTactic melempar pada JSON yang tidak valid', () => {
    expect(() => parseTactic({ id: 'x' })).toThrow(/tidak valid/)
  })

  it('parseTactic menerapkan nilai bawaan skema', () => {
    const t = parseTactic({
      id: 'minimal',
      slug: 'minimal',
      title: { id: 'Minimal' },
      category: 'special',
      level: 1,
      duration: 1,
      summary: { id: 'Ringkas' },
      whenToUse: { id: 'Kapan' },
      players: [
        { id: 'O1', team: 'offense', start: { x: 0, y: 5 } },
        { id: 'X1', team: 'defense', start: { x: 0, y: 4 } },
      ],
      phases: [{ id: 'p1', title: { id: 'Fase' }, tStart: 0, tEnd: 1 }],
    })
    expect(t.court).toBe('half')
    expect(t.events).toEqual([])
    expect(t.release).toBe('mvp')
    expect(t.status).toBe('draft')
    expect(t.version).toBe(1)
    expect(t.players[0]?.start.facing).toBe(0)
  })

  it('getStateContext mengembalikan objek yang sama untuk kombinasi cabang sama', () => {
    clearCompileCache()
    const a = getStateContext(spain, [])
    const b = getStateContext(spain, [])
    expect(a.ctx).toBe(b.ctx)
  })

  it('kombinasi cabang berbeda memberi konteks berbeda', () => {
    const a = getStateContext(spain, [])
    const b = getStateContext(spain, ['b-cov-switch'])
    expect(a.ctx).not.toBe(b.ctx)
  })

  it('urutan id cabang tidak memengaruhi cache', () => {
    const a = getStateContext(spain, ['b-cov-switch', 'b-lob'])
    const b = getStateContext(spain, ['b-lob', 'b-cov-switch'])
    expect(a.ctx).toBe(b.ctx)
  })

  it('menormalkan cabang yang bertentangan dalam satu grup', () => {
    const r = getStateContext(spain, ['b-cov-switch', 'b-cov-blitz'])
    expect(r.activeBranchIds).toEqual(['b-cov-blitz'])
  })

  it('invalidateTactic membuang entri cache taktik itu', () => {
    const before = getStateContext(spain, []).ctx
    invalidateTactic(spain.id)
    expect(getStateContext(spain, []).ctx).not.toBe(before)
  })

  it('cache tidak tumbuh tanpa batas', () => {
    clearCompileCache()
    // Lebih banyak daripada CACHE_LIMIT (48): entri tertua dibuang, tidak error.
    for (let i = 0; i < 60; i++) {
      getStateContext({ ...spain, version: i + 1 }, [])
    }
    expect(getStateContext(spain, []).ctx).toBeDefined()
  })

  it('loadAndValidate mengembalikan hasil validasi lengkap', () => {
    const r = loadAndValidate(JSON.parse(JSON.stringify(spain)))
    expect(r.ok).toBe(true)
    expect(r.tactic?.id).toBe(spain.id)
  })
})

/* -------------------------------------------------------------------------- */
/* Garis prediksi (A-03) & jejak (A-04)                                       */
/* -------------------------------------------------------------------------- */

describe('garis prediksi A-03', () => {
  it('mulai dari posisi pemain saat ini', () => {
    const t = 1.0
    const path = predictionPath(ctx.compiled, 'O5', t, 0.6)
    const now = playerMotionAt(ctx.compiled, 'O5', t).position
    expect(path[0]?.x).toBeCloseTo(now.x, 6)
    expect(path[0]?.y).toBeCloseTo(now.y, 6)
  })

  it('berakhir di posisi 0,6 detik ke depan (PRD §7)', () => {
    const t = 1.0
    const path = predictionPath(ctx.compiled, 'O5', t, 0.6)
    const future = playerMotionAt(ctx.compiled, 'O5', t + 0.6).position
    const last = path[path.length - 1]!
    expect(last.x).toBeCloseTo(future.x, 2)
    expect(last.y).toBeCloseTo(future.y, 2)
  })

  it('pemain yang diam tidak menghasilkan garis prediksi panjang', () => {
    // O3 di sudut tidak bergerak sama sekali.
    expect(predictionPath(ctx.compiled, 'O3', 2.0, 0.6).length).toBeLessThanOrEqual(1)
  })

  it('tidak melewati durasi taktik', () => {
    const path = predictionPath(ctx.compiled, 'O5', spain.duration - 0.1, 0.6)
    expect(path.length).toBeGreaterThanOrEqual(1)
  })

  it('getPredictionPath di state.ts memakai lookahead 0,6 detik', () => {
    expect(getPredictionPath(ctx, 'O5', 1.0)).toEqual(
      predictionPath(ctx.compiled, 'O5', 1.0, 0.6),
    )
  })
})

describe('jejak gerak A-04', () => {
  it('menutupi jendela 1,2 detik terakhir', () => {
    const trail = trailPath(ctx.compiled, 'O5', 1.5, 1.2)
    const past = playerMotionAt(ctx.compiled, 'O5', 0.3).position
    expect(trail[0]?.x).toBeCloseTo(past.x, 2)
  })

  it('kosong di awal taktik', () => {
    expect(trailPath(ctx.compiled, 'O5', 0, 1.2)).toHaveLength(0)
  })

  it('berakhir di posisi sekarang', () => {
    const trail = trailPath(ctx.compiled, 'O5', 1.5, 1.2)
    const now = playerMotionAt(ctx.compiled, 'O5', 1.5).position
    expect(trail[trail.length - 1]?.x).toBeCloseTo(now.x, 6)
  })

  it('getTrail di state.ts memakai jendela 1,2 detik', () => {
    expect(getTrail(ctx, 'O5', 1.5)).toEqual(trailPath(ctx.compiled, 'O5', 1.5, 1.2))
  })
})

describe('pembantu arah hadap', () => {
  it('smoothedFacing bergerak menuju target', () => {
    const next = smoothedFacing(0, 90, 0.5)
    expect(next).toBeCloseTo(45, 6)
  })

  it('smoothedFacing memilih jalur terpendek', () => {
    expect(smoothedFacing(350, 10, 1)).toBeCloseTo(10, 6)
  })

  it('facingVectorOf mengembalikan vektor satuan', () => {
    const v = facingVectorOf(37)
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1, 9)
  })
})

describe('playerMotionAt pada kasus batas', () => {
  it('pemain tanpa event sama sekali tetap di posisi awal', () => {
    const m = playerMotionAt(ctx.compiled, 'O3', 3.0)
    const start = spain.players.find((p) => p.id === 'O3')!.start
    expect(m.position.x).toBeCloseTo(start.x, 6)
    expect(m.activeEvent).toBeNull()
    expect(m.speed).toBe(0)
  })

  it('id pemain yang tidak dikenal mengembalikan titik asal, bukan crash', () => {
    const m = playerMotionAt(ctx.compiled, 'O9', 1.0)
    expect(m.position).toEqual({ x: 0, y: 0 })
  })

  it('sebelum event gerak pertama, pemain memakai titik awal jalur itu', () => {
    // e-o2-tuck mulai pada t = 0,6; sebelum itu O2 harus berada di awal jalurnya.
    const m = playerMotionAt(ctx.compiled, 'O2', 0.3)
    expect(m.position.x).toBeCloseTo(0.2, 6)
    expect(m.position.y).toBeCloseTo(4.6, 6)
  })

  it('setelah event terakhir, pemain DITAHAN di titik akhir (bukan kembali ke awal)', () => {
    const m = playerMotionAt(ctx.compiled, 'O5', spain.duration)
    expect(m.position.y).toBeLessThan(2.5)
    expect(m.speed).toBe(0)
  })
})

/* -------------------------------------------------------------------------- */
/* Bola                                                                      */
/* -------------------------------------------------------------------------- */

describe('garis waktu bola', () => {
  it('menutupi seluruh durasi tanpa celah', () => {
    const timeline = buildBallTimeline(ctx.compiled)
    expect(timeline[0]?.tStart).toBeCloseTo(0, 6)
    expect(timeline[timeline.length - 1]?.tEnd).toBeCloseTo(spain.duration, 6)
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i]!.tStart).toBeCloseTo(timeline[i - 1]!.tEnd, 6)
    }
  })

  it('segmentAt menemukan ruas yang mencakup t', () => {
    const timeline = buildBallTimeline(ctx.compiled)
    expect(segmentAt(timeline, 0.5)?.kind).toBe('held')
    expect(segmentAt(timeline, 5.5)?.kind).toBe('air')
  })

  it('segmentAt mengembalikan null untuk garis waktu kosong', () => {
    expect(segmentAt([], 1)).toBeNull()
  })

  it('bola menjadi lepas setelah tembakan', () => {
    const timeline = buildBallTimeline(ctx.compiled)
    expect(timeline.some((s) => s.kind === 'loose')).toBe(true)
  })

  it('frekuensi dribble naik seiring kecepatan (PRD §10)', () => {
    expect(dribbleFrequency(0)).toBeCloseTo(2, 6)
    expect(dribbleFrequency(6.5)).toBeGreaterThan(dribbleFrequency(1.5))
  })

  it('bola berpindah sisi tangan mengikuti arah gerak', () => {
    // Saat pembawa bergerak, bola berada tegak lurus arah geraknya.
    const st = getState(ctx, 0.8)
    const holder = st.byId[st.ball.holder!]!
    const toBall = {
      x: st.ball.position.x - holder.position.x,
      y: st.ball.position.y - holder.position.y,
    }
    const dot = toBall.x * holder.heading.x + toBall.y * holder.heading.y
    expect(Math.abs(dot)).toBeLessThan(0.15)
  })

  it('passLaneClearance mengukur jarak bek terdekat ke jalur', () => {
    const d = passLaneClearance({ x: 0, y: 0 }, { x: 10, y: 0 }, [{ x: 5, y: 2 }])
    expect(d).toBeCloseTo(2, 6)
  })

  it('passLaneClearance menangani jalur sepanjang nol', () => {
    const d = passLaneClearance({ x: 1, y: 1 }, { x: 1, y: 1 }, [{ x: 4, y: 1 }])
    expect(d).toBeCloseTo(3, 6)
  })

  it('passLaneClearance tanpa bek mengembalikan nilai sangat besar', () => {
    expect(passLaneClearance({ x: 0, y: 0 }, { x: 5, y: 0 }, [])).toBeGreaterThan(50)
  })

  it('bek di belakang penerima tidak dianggap menghalangi jalur', () => {
    const d = passLaneClearance({ x: 0, y: 0 }, { x: 5, y: 0 }, [{ x: 9, y: 0 }])
    expect(d).toBeCloseTo(4, 6)
  })
})

/* -------------------------------------------------------------------------- */
/* Profil kecepatan                                                          */
/* -------------------------------------------------------------------------- */

describe('profil kecepatan (PRD §10)', () => {
  it('nilai m/s sesuai rentang dunia nyata di PRD', () => {
    expect(SPEED_MPS.walk).toBe(1.5)
    expect(SPEED_MPS.jog).toBeGreaterThanOrEqual(3)
    expect(SPEED_MPS.jog).toBeLessThanOrEqual(4)
    expect(SPEED_MPS.sprint).toBeGreaterThanOrEqual(6)
    expect(SPEED_MPS.sprint).toBeLessThanOrEqual(7)
    expect(SPEED_MPS.slide).toBeGreaterThanOrEqual(2.5)
    expect(SPEED_MPS.slide).toBeLessThanOrEqual(3.5)
  })

  it('umpan minimal 250 ms dan tembakan sekitar 1 detik', () => {
    expect(MIN_PASS_SEC).toBe(0.25)
    expect(SHOT_FLIGHT_SEC).toBe(1.0)
  })

  it('naturalDuration = panjang / kecepatan', () => {
    const lut = buildPath([[0, 0], [7, 0]])
    expect(naturalDuration(lut, 'jog')).toBeCloseTo(7 / SPEED_MPS.jog, 6)
  })

  it('naturalDuration menambahkan jeda tanam kaki di tikungan', () => {
    const straight = buildPath([[0, 0], [3, 0], [6, 0]])
    const vcut = buildPath([[0, 6], [0, 3], [3, 6]])
    const withPlant = naturalDuration(vcut, 'sprint')
    const withoutPlant = naturalDuration(vcut, 'sprint', false)
    expect(withPlant).toBeGreaterThan(withoutPlant)
    expect(naturalDuration(straight, 'sprint')).toBeCloseTo(
      naturalDuration(straight, 'sprint', false),
      6,
    )
  })

  it('jalur sepanjang nol tetap punya durasi minimum', () => {
    expect(naturalDuration(buildPath([[1, 1]]), 'jog')).toBeGreaterThan(0)
  })

  it('profil gerak mulai di 0 m dan berakhir di panjang jalur', () => {
    const lut = buildPath([[0, 0], [5, 0]])
    const m = buildMotionProfile(lut, 1.5)
    expect(m.distanceAt(0)).toBe(0)
    expect(m.distanceAt(1.5)).toBeCloseTo(lut.length, 6)
    expect(m.distanceAt(99)).toBeCloseTo(lut.length, 6)
    expect(m.distanceAt(-1)).toBe(0)
  })

  it('jarak naik monoton terhadap waktu', () => {
    const lut = buildPath([[0, 8], [2, 6], [1, 3], [3, 1]])
    const m = buildMotionProfile(lut, 2)
    let prev = -1
    for (let i = 0; i <= 200; i++) {
      const d = m.distanceAt((2 * i) / 200)
      expect(d).toBeGreaterThanOrEqual(prev - 1e-9)
      prev = d
    }
  })

  it('kecepatan nol di awal dan akhir (akselerasi & deselerasi)', () => {
    const m = buildMotionProfile(buildPath([[0, 0], [5, 0]]), 1.5)
    expect(m.speedAt(0)).toBe(0)
    expect(m.speedAt(1.5)).toBe(0)
    expect(m.speedAt(0.75)).toBeGreaterThan(0)
  })

  it('ada segmen jelajah berkecepatan tetap', () => {
    const m = buildMotionProfile(buildPath([[0, 0], [10, 0]]), 2)
    const mid = [0.8, 1.0, 1.2].map((t) => m.speedAt(t))
    expect(Math.max(...mid) - Math.min(...mid)).toBeLessThan(0.01)
  })

  it('jeda tanam kaki membuat kecepatan nol di tengah jalur (PRD §10)', () => {
    const vcut = buildPath([[0, 6], [0, 3], [3, 6]])
    const m = buildMotionProfile(vcut, naturalDuration(vcut, 'sprint'), { footPlant: true })
    let zeroInside = false
    for (let i = 1; i < 100; i++) {
      const t = (m.duration * i) / 100
      if (m.speedAt(t) < 1e-9 && m.distanceAt(t) > 0.1 && m.distanceAt(t) < m.length - 0.1) {
        zeroInside = true
        break
      }
    }
    expect(zeroInside).toBe(true)
  })

  it('footPlant: false menjaga gerak tanpa jeda di tengah', () => {
    const vcut = buildPath([[0, 6], [0, 3], [3, 6]])
    const m = buildMotionProfile(vcut, 2, { footPlant: false })
    for (let i = 1; i < 100; i++) {
      const t = (2 * i) / 100
      const d = m.distanceAt(t)
      if (d > 0.3 && d < m.length - 0.3) expect(m.speedAt(t)).toBeGreaterThan(0)
    }
  })

  it('jalur diam memberi profil nol tanpa pembagian oleh nol', () => {
    const m = buildMotionProfile(buildPath([[2, 2]]), 1)
    expect(m.length).toBe(0)
    expect(m.distanceAt(0.5)).toBe(0)
    expect(m.speedAt(0.5)).toBe(0)
    expect(m.cruiseSpeed).toBe(0)
  })

  it('durasi nol tidak menghasilkan NaN', () => {
    const m = buildMotionProfile(buildPath([[0, 0], [1, 0]]), 0)
    expect(Number.isFinite(m.distanceAt(0.1))).toBe(true)
  })

  it('kecepatan jelajah efektif lebih tinggi daripada rata-rata (karena ada ramp)', () => {
    const lut = buildPath([[0, 0], [10, 0]])
    const m = buildMotionProfile(lut, 2)
    expect(m.cruiseSpeed).toBeGreaterThan(lut.length / 2)
  })
})

/* -------------------------------------------------------------------------- */
/* Aturan 3 detik                                                            */
/* -------------------------------------------------------------------------- */

describe('paintDwellSeconds (materi modul 1.4)', () => {
  it('nol untuk pemain di luar paint', () => {
    expect(paintDwellSeconds(ctx, 'O3', 2.0)).toBe(0)
  })

  it('menghitung lama pemain berada di paint', () => {
    // O5 berakhir di dalam paint setelah roll.
    const dwell = paintDwellSeconds(ctx, 'O5', spain.duration)
    expect(dwell).toBeGreaterThan(0)
  })

  it('mengekspor setengah lebar paint untuk dipakai UI', () => {
    expect(PAINT_HALF).toBeCloseTo(2.45, 6)
  })
})
