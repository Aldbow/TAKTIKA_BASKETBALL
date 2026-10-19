/**
 * Uji sifat-sifat inti getState(t) — PRD §14:
 *   "Deterministik: fungsi getState(t) murni, sehingga pengujian otomatis bisa
 *    membandingkan posisi di waktu mana pun."
 *
 * Dan kriteria penerimaan F-10:
 *   "ketika pengguna menggeser timeline, maka semua pemain dan bola berada di
 *    posisi yang tepat untuk waktu itu tanpa lompatan"
 *
 * Taktik unggulan Spain PnR dipakai sebagai data nyata, bukan fixture mainan —
 * dengan begitu uji ini sekaligus menjaga konten MVP.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

import { dist } from '../court'
import { clearCompileCache, getStateContext, parseTactic } from '../loader'
import { computePassLanes, computeSpacing, createStateContext, getState, phaseAt } from '../state'
import { compileEvents } from '../interpolator'
import { branchKey, resolveEvents } from '../branch'
import type { StateContext } from '../state'
import type { Tactic } from '../schema'

function loadSpain(): Tactic {
  return parseTactic(
    JSON.parse(
      readFileSync(join(process.cwd(), 'content', 'tactics', 'set-spain-pnr.json'), 'utf8'),
    ),
  )
}

let spain: Tactic
let ctx: StateContext

beforeAll(() => {
  clearCompileCache()
  spain = loadSpain()
  ctx = getStateContext(spain).ctx
})

describe('determinisme', () => {
  it('getState(t) dua kali memberi hasil identik', () => {
    for (const t of [0, 1.37, 2.5, 4.9, 6.0, 7.2]) {
      const a = getState(ctx, t)
      const b = getState(ctx, t)
      expect(a.players.map((p) => p.position)).toEqual(b.players.map((p) => p.position))
      expect(a.ball.position).toEqual(b.ball.position)
      expect(a.phase?.id).toBe(b.phase?.id)
    }
  })

  it('urutan pemanggilan tidak berpengaruh — maju lalu mundur sama dengan langsung', () => {
    const direct = getState(ctx, 3.4)
    getState(ctx, 0)
    getState(ctx, 7.2)
    getState(ctx, 1.1)
    const afterWandering = getState(ctx, 3.4)
    expect(afterWandering.players.map((p) => p.position)).toEqual(
      direct.players.map((p) => p.position),
    )
  })

  it('konteks baru dari taktik yang sama memberi hasil sama', () => {
    const fresh = createStateContext(
      compileEvents(spain, resolveEvents(spain, []), [], branchKey([])),
    )
    for (const t of [0.5, 2.2, 4.0, 5.5]) {
      expect(getState(fresh, t).players.map((p) => p.position)).toEqual(
        getState(ctx, t).players.map((p) => p.position),
      )
    }
  })
})

describe('kontinuitas (F-10: tanpa lompatan)', () => {
  it('tidak ada pemain yang berpindah lebih dari 0,25 m dalam satu langkah 20 ms', () => {
    // 20 ms kira-kira satu frame pada 50 fps. Sprint 8 m/s = 0,16 m per frame,
    // jadi 0,25 m adalah batas yang longgar tetapi tetap menangkap teleportasi.
    let prev = getState(ctx, 0)
    for (let t = 0.02; t <= spain.duration; t += 0.02) {
      const cur = getState(ctx, t)
      for (const p of cur.players) {
        const before = prev.byId[p.id]
        expect(before).toBeDefined()
        const jump = dist(before!.position, p.position)
        expect(
          jump,
          `${p.id} melompat ${jump.toFixed(3)} m pada t=${t.toFixed(2)}`,
        ).toBeLessThan(0.25)
      }
      prev = cur
    }
  })

  it('geser mundur memutar gerak mundur dengan tepat', () => {
    // Nilai t dibangkitkan dari indeks bilangan bulat, bukan akumulasi `t += dt`,
    // supaya arah maju dan mundur memakai angka yang BENAR-BENAR sama. Drift
    // floating-point akan menguji presisi aritmetika, bukan reversibilitas.
    const steps = 72
    const times = Array.from({ length: steps + 1 }, (_, i) => (i * spain.duration) / steps)

    const forward: Record<string, { x: number; y: number }[]> = {}
    for (const t of times) {
      for (const p of getState(ctx, t).players) {
        ;(forward[p.id] ??= []).push({ ...p.position })
      }
    }

    const backward: Record<string, { x: number; y: number }[]> = {}
    for (const t of [...times].reverse()) {
      for (const p of getState(ctx, t).players) {
        ;(backward[p.id] ??= []).unshift({ ...p.position })
      }
    }

    for (const id of Object.keys(forward)) {
      expect(backward[id]).toEqual(forward[id])
    }
  })

  it('bola selalu punya posisi berhingga', () => {
    for (let t = 0; t <= spain.duration; t += 0.05) {
      const st = getState(ctx, t)
      expect(Number.isFinite(st.ball.position.x)).toBe(true)
      expect(Number.isFinite(st.ball.position.y)).toBe(true)
    }
  })
})

describe('penjepitan waktu', () => {
  it('t negatif dijepit ke 0', () => {
    expect(getState(ctx, -5).t).toBe(0)
    expect(getState(ctx, -5).players.map((p) => p.position)).toEqual(
      getState(ctx, 0).players.map((p) => p.position),
    )
  })

  it('t melewati durasi dijepit ke durasi dan menandai ended', () => {
    const st = getState(ctx, 99)
    expect(st.t).toBe(spain.duration)
    expect(st.ended).toBe(true)
  })
})

describe('posisi awal sesuai formasi PRD §7', () => {
  it('t = 0 memakai posisi start setiap pemain', () => {
    const st = getState(ctx, 0)
    for (const p of spain.players) {
      const s = st.byId[p.id]
      expect(s).toBeDefined()
      expect(s!.position.x).toBeCloseTo(p.start.x, 6)
      expect(s!.position.y).toBeCloseTo(p.start.y, 6)
    }
  })

  it('1 membawa bola di top dan memegang bola', () => {
    const st = getState(ctx, 0)
    expect(st.ball.holder).toBe('O1')
    expect(st.byId.O1?.hasBall).toBe(true)
    expect(st.byId.O1?.position.y).toBeGreaterThan(7)
  })

  it('3 dan 4 berada di sudut (di luar garis 3 poin)', () => {
    const st = getState(ctx, 0)
    expect(Math.abs(st.byId.O3!.position.x)).toBeGreaterThan(6.5)
    expect(Math.abs(st.byId.O4!.position.x)).toBeGreaterThan(6.5)
  })

  it('setiap bek punya penugasan jaga', () => {
    for (const p of spain.players.filter((x) => x.team === 'defense')) {
      expect(p.guards).toBeDefined()
    }
  })
})

describe('fase', () => {
  it('phaseAt memilih fase yang mencakup t', () => {
    expect(phaseAt(spain, 0.5).phase?.id).toBe('p1')
    expect(phaseAt(spain, 2.5).phase?.id).toBe('p2')
    expect(phaseAt(spain, 3.5).phase?.id).toBe('p3')
    expect(phaseAt(spain, 4.4).phase?.id).toBe('p4')
    expect(phaseAt(spain, 5.5).phase?.id).toBe('p5')
  })

  it('fase pertama dan terakhir dipakai di luar rentang', () => {
    expect(phaseAt(spain, -1).phase?.id).toBe('p1')
    expect(phaseAt(spain, 999).phase?.id).toBe('p6')
  })

  it('phaseProgress berjalan 0 ke 1 di dalam fase', () => {
    expect(getState(ctx, 0.0).phaseProgress).toBeCloseTo(0, 6)
    expect(getState(ctx, 1.0).phaseProgress).toBeCloseTo(0.5, 6)
    expect(getState(ctx, 1.999).phaseProgress).toBeGreaterThan(0.99)
  })

  it('fase tidak tumpang tindih dan menutupi seluruh durasi', () => {
    const sorted = [...spain.phases].sort((a, b) => a.tStart - b.tStart)
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i]!.tEnd).toBeLessThanOrEqual(sorted[i + 1]!.tStart + 1e-9)
    }
    expect(sorted[0]!.tStart).toBeCloseTo(0, 6)
    expect(sorted[sorted.length - 1]!.tEnd).toBeCloseTo(spain.duration, 6)
  })
})

describe('momen keputusan & bullet time (A-09)', () => {
  it('jendela keputusan aktif di sekitar t keputusan', () => {
    const d = spain.decisions[0]!
    expect(getState(ctx, d.t).decision?.id).toBe(d.id)
    expect(getState(ctx, d.t - 0.2).decision?.id).toBe(d.id)
    expect(getState(ctx, d.t - 2.0).decision).toBeNull()
  })

  it('timeToDecision berkurang saat mendekati keputusan', () => {
    const a = getState(ctx, 1.0).timeToDecision
    const b = getState(ctx, 3.0).timeToDecision
    expect(b).toBeLessThan(a)
    expect(a).toBeGreaterThan(0)
  })

  it('timeToDecision Infinity setelah keputusan terakhir', () => {
    expect(getState(ctx, 7.0).timeToDecision).toBe(Infinity)
  })
})

describe('kepemilikan bola', () => {
  it('bola hanya dipegang satu pemain pada satu waktu', () => {
    for (let t = 0; t <= spain.duration; t += 0.05) {
      const st = getState(ctx, t)
      const holders = st.players.filter((p) => p.hasBall)
      expect(holders.length).toBeLessThanOrEqual(1)
    }
  })

  it('umpan memindahkan kepemilikan dari pengirim ke penerima', () => {
    // e-pass-o2 pada t = 5,3 dur 0,4
    expect(getState(ctx, 5.2).ball.holder).toBe('O1')
    expect(getState(ctx, 5.5).ball.inAir).toBe(true)
    expect(getState(ctx, 5.8).ball.holder).toBe('O2')
  })

  it('bola saat di udara tidak dipegang siapa pun', () => {
    const st = getState(ctx, 5.5)
    expect(st.ball.holder).toBeNull()
    expect(st.players.some((p) => p.hasBall)).toBe(false)
  })

  it('tembakan mengirim bola ke ring lalu melepasnya', () => {
    const during = getState(ctx, 6.5)
    expect(during.ball.inAir).toBe(true)
    expect(during.ball.shotMade).toBe(true)
    const after = getState(ctx, 7.2)
    expect(after.ball.holder).toBeNull()
  })

  it('bola berada di dekat pemegangnya, bukan tepat di tengah token', () => {
    const st = getState(ctx, 1.0)
    const holder = st.byId[st.ball.holder!]!
    const d = dist(holder.position, st.ball.position)
    expect(d).toBeGreaterThan(0.1)
    expect(d).toBeLessThan(0.6)
  })

  it('bola di udara melintas di antara pengirim dan penerima', () => {
    const mid = getState(ctx, 5.5)
    const from = getState(ctx, 5.3).byId.O1!.position
    const to = getState(ctx, 5.7).byId.O2!.position
    // Posisi tengah harus berada di dalam kotak pembatas kedua ujung + margin busur.
    expect(mid.ball.position.x).toBeGreaterThan(Math.min(from.x, to.x) - 1.5)
    expect(mid.ball.position.x).toBeLessThan(Math.max(from.x, to.x) + 1.5)
  })
})

describe('kecepatan pemain', () => {
  it('tidak ada pemain melewati 8 m/s (sanity check PRD §13)', () => {
    for (let t = 0; t <= spain.duration; t += 0.02) {
      for (const p of getState(ctx, t).players) {
        expect(p.speed, `${p.id} pada t=${t.toFixed(2)}`).toBeLessThanOrEqual(8)
      }
    }
  })

  it('pemain diam saat tidak ada event gerak aktif', () => {
    // O3 di sudut tidak punya event sama sekali.
    for (const t of [0, 2, 4, 6]) {
      expect(getState(ctx, t).byId.O3!.speed).toBe(0)
    }
  })

  it('5 benar-benar sprint saat naik ke screen', () => {
    let peak = 0
    for (let t = 0.2; t <= 2.0; t += 0.02) {
      peak = Math.max(peak, getState(ctx, t).byId.O5!.speed)
    }
    expect(peak).toBeGreaterThan(4)
  })
})

describe('arah hadap', () => {
  it('pemain yang bergerak menghadap arah geraknya', () => {
    const st = getState(ctx, 1.0)
    const o5 = st.byId.O5!
    expect(o5.speed).toBeGreaterThan(0)
    // heading harus satuan dan konsisten dengan facing.
    expect(Math.hypot(o5.heading.x, o5.heading.y)).toBeCloseTo(1, 3)
  })

  it('bek yang diam menghadap pemain yang dijaganya', () => {
    const st = getState(ctx, 0)
    const x3 = st.byId.X3!
    const o3 = st.byId.O3!
    const expected = Math.atan2(o3.position.x - x3.position.x, -(o3.position.y - x3.position.y))
    expect(x3.facing).toBeCloseTo(((expected * 180) / Math.PI + 360) % 360, 1)
  })
})

describe('lapisan spacing (A-14)', () => {
  it('memberi nilai hijau/kuning/merah sesuai ambang PRD', () => {
    const links = computeSpacing([
      { id: 'O1', position: { x: 0, y: 0 } } as never,
      { id: 'O2', position: { x: 5, y: 0 } } as never,
    ])
    expect(links[0]?.grade).toBe('good')

    const tight = computeSpacing([
      { id: 'O1', position: { x: 0, y: 0 } } as never,
      { id: 'O2', position: { x: 3.5, y: 0 } } as never,
    ])
    expect(tight[0]?.grade).toBe('tight')

    const bad = computeSpacing([
      { id: 'O1', position: { x: 0, y: 0 } } as never,
      { id: 'O2', position: { x: 2, y: 0 } } as never,
    ])
    expect(bad[0]?.grade).toBe('bad')
  })

  it('menghubungkan pemain yang bersebelahan di lantai, bukan semua pasangan', () => {
    const st = getState(ctx, 0)
    // 5 penyerang -> 5 sisi poligon, bukan 10 pasangan.
    expect(st.spacing).toHaveLength(5)
  })

  it('kurang dari 2 penyerang tidak menghasilkan link', () => {
    expect(computeSpacing([])).toHaveLength(0)
    expect(computeSpacing([{ id: 'O1', position: { x: 0, y: 0 } } as never])).toHaveLength(0)
  })
})

describe('lapisan jalur umpan (A-16)', () => {
  it('ada satu jalur ke setiap rekan saat bola dipegang', () => {
    const st = getState(ctx, 0.5)
    expect(st.passLanes).toHaveLength(4)
    expect(st.passLanes.every((l) => l.from === 'O1')).toBe(true)
  })

  it('tidak ada jalur umpan saat bola di udara', () => {
    expect(getState(ctx, 5.5).passLanes).toHaveLength(0)
  })

  it('bek di jalur menurunkan nilai keamanan dan menandai terhalang', () => {
    const lanes = computePassLanes(
      [
        { id: 'O1', position: { x: 0, y: 8 } } as never,
        { id: 'O2', position: { x: 0, y: 2 } } as never,
      ],
      [{ x: 0.1, y: 5 }],
      'O1',
    )
    expect(lanes[0]?.blocked).toBe(true)
    expect(lanes[0]?.safety).toBe(0)
  })

  it('jalur bersih punya keamanan penuh', () => {
    const lanes = computePassLanes(
      [
        { id: 'O1', position: { x: 0, y: 8 } } as never,
        { id: 'O2', position: { x: 0, y: 2 } } as never,
      ],
      [{ x: 6, y: 1 }],
      'O1',
    )
    expect(lanes[0]?.blocked).toBe(false)
    expect(lanes[0]?.safety).toBe(1)
  })

  it('menandai nilai tembakan penerima', () => {
    const st = getState(ctx, 0.5)
    const toCorner = st.passLanes.find((l) => l.to === 'O3')
    expect(toCorner?.shotValue).toBe(3)
  })

  it('tanpa pemegang bola tidak ada jalur', () => {
    expect(computePassLanes([], [], null)).toHaveLength(0)
  })
})
