/**
 * Uji Branch Resolver — kriteria penerimaan F-14 (PRD §8):
 *   "Diberikan PnR sedang diputar, ketika pengguna mengganti coverage dari Drop
 *    ke Switch, maka pemain bergerak dari posisi saat ini ke jalur cabang baru
 *    dalam transisi 400-600 ms, TANPA KEMBALI KE AWAL."
 *
 * Syarat "tanpa kembali ke awal" diuji di dua tingkat:
 *  1. resolveEvents tidak menyentuh waktu sama sekali
 *  2. posisi pemain pada waktu yang sama sebelum fromT tetap identik antar cabang
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

import {
  activeCounters,
  branchGroups,
  branchKey,
  findBranch,
  normalizeActiveBranches,
  resolveEvents,
} from '../branch'
import { dist } from '../court'
import { getStateContext, parseTactic } from '../loader'
import { getState } from '../state'
import type { Tactic } from '../schema'

let spain: Tactic

beforeAll(() => {
  spain = parseTactic(
    JSON.parse(
      readFileSync(join(process.cwd(), 'content', 'tactics', 'set-spain-pnr.json'), 'utf8'),
    ),
  )
})

describe('resolveEvents', () => {
  it('tanpa cabang aktif mengembalikan event dasar, urut menurut waktu', () => {
    const events = resolveEvents(spain, [])
    expect(events).toHaveLength(spain.events.length)
    for (let i = 1; i < events.length; i++) {
      expect(events[i]!.t).toBeGreaterThanOrEqual(events[i - 1]!.t)
    }
  })

  it('cabang menambahkan event penggantinya', () => {
    const base = resolveEvents(spain, [])
    const switched = resolveEvents(spain, ['b-cov-switch'])
    const ids = new Set(switched.map((e) => e.id))
    for (const e of findBranch(spain, 'b-cov-switch')!.events) {
      expect(ids.has(e.id)).toBe(true)
    }
    expect(switched).not.toEqual(base)
  })

  it('cabang membuang event dasar yang tercantum di replaces', () => {
    const branch = findBranch(spain, 'b-lob')!
    const events = resolveEvents(spain, ['b-lob'])
    for (const id of branch.replaces) {
      expect(events.some((e) => e.id === id)).toBe(false)
    }
  })

  it('cabang hanya memengaruhi pemain yang terlibat — penembak sudut tetap diam', () => {
    // Inilah alasan penggantian berbasis aktor: coverage tidak boleh menghapus
    // aksi pemain yang tak terkait.
    const events = resolveEvents(spain, ['b-cov-switch'])
    // O3 tidak punya event di taktik ini; yang penting O4 (sudut lemah) tidak
    // kehilangan kemampuan untuk tetap berada di posisinya.
    const o4Events = events.filter((e) => e.actor === 'O4')
    const baseO4 = spain.events.filter((e) => e.actor === 'O4')
    expect(o4Events).toHaveLength(baseO4.length)
  })

  it('cabang membuang event dasar aktor yang sama pada t >= fromT', () => {
    const branch = findBranch(spain, 'b-cov-blitz')!
    const events = resolveEvents(spain, ['b-cov-blitz'])
    const branchActors = new Set(branch.events.map((e) => e.actor))
    for (const e of spain.events) {
      if (e.t >= branch.fromT && branchActors.has(e.actor)) {
        expect(
          events.some((x) => x.id === e.id),
          `event dasar ${e.id} seharusnya tergantikan`,
        ).toBe(false)
      }
    }
  })

  it('cabang yang tidak dikenal diabaikan dengan aman', () => {
    expect(resolveEvents(spain, ['tidak-ada'])).toHaveLength(spain.events.length)
  })
})

describe('grup cabang (pemilih coverage F-14)', () => {
  it('mengelompokkan cabang menurut grupnya', () => {
    const groups = branchGroups(spain)
    const names = groups.map((g) => g.name)
    expect(names).toContain('coverage')
    expect(names).toContain('outcome')
    expect(names).toContain('mistake')
  })

  it('hanya satu cabang aktif per grup — pilihan terbaru menang', () => {
    const normalized = normalizeActiveBranches(spain, ['b-cov-switch', 'b-cov-blitz'])
    expect(normalized).toEqual(['b-cov-blitz'])
  })

  it('cabang dari grup berbeda bisa aktif bersamaan', () => {
    const normalized = normalizeActiveBranches(spain, ['b-cov-switch', 'b-lob'])
    expect(normalized).toHaveLength(2)
  })

  it('cabang tanpa grup diperlakukan mandiri', () => {
    const tactic: Tactic = {
      ...spain,
      branches: [
        { ...findBranch(spain, 'b-lob')!, id: 'x1', group: undefined },
        { ...findBranch(spain, 'b-pullup')!, id: 'x2', group: undefined },
      ],
    }
    expect(normalizeActiveBranches(tactic, ['x1', 'x2'])).toHaveLength(2)
  })

  it('menyaring id yang tidak dikenal', () => {
    expect(normalizeActiveBranches(spain, ['hantu'])).toHaveLength(0)
  })
})

describe('branchKey', () => {
  it('stabil terhadap urutan masukan', () => {
    expect(branchKey(['b', 'a'])).toBe(branchKey(['a', 'b']))
  })

  it('kombinasi berbeda memberi kunci berbeda', () => {
    expect(branchKey(['a'])).not.toBe(branchKey(['a', 'b']))
  })
})

describe('counter yang disarankan (panel F-14)', () => {
  it('mengembalikan counter untuk cabang aktif', () => {
    const counters = activeCounters(spain, ['b-cov-blitz'])
    expect(counters).toHaveLength(1)
    expect(counters[0]?.counter).toMatch(/short roll|4 lawan 3/i)
  })

  it('cabang tanpa counter tidak muncul', () => {
    expect(activeCounters(spain, ['tidak-ada'])).toHaveLength(0)
  })
})

describe('kontinuitas cabang (F-14: tidak kembali ke awal)', () => {
  it('posisi sebelum fromT identik antara cabang dan dasar', () => {
    const base = getStateContext(spain, []).ctx
    const switched = getStateContext(spain, ['b-cov-switch']).ctx
    const fromT = findBranch(spain, 'b-cov-switch')!.fromT

    for (let t = 0; t < fromT - 0.05; t += 0.1) {
      const a = getState(base, t)
      const b = getState(switched, t)
      for (const p of a.players) {
        const other = b.byId[p.id]!
        expect(
          dist(p.position, other.position),
          `${p.id} berbeda pada t=${t.toFixed(2)} padahal sebelum fromT`,
        ).toBeLessThan(1e-9)
      }
    }
  })

  it('tiap cabang tetap kontinu — tanpa lompatan di dalam cabangnya sendiri', () => {
    for (const branch of spain.branches) {
      const ctx = getStateContext(spain, [branch.id]).ctx
      let prev = getState(ctx, 0)
      for (let t = 0.02; t <= spain.duration; t += 0.02) {
        const cur = getState(ctx, t)
        for (const p of cur.players) {
          const jump = dist(prev.byId[p.id]!.position, p.position)
          expect(
            jump,
            `cabang ${branch.id}: ${p.id} melompat ${jump.toFixed(3)} m pada t=${t.toFixed(2)}`,
          ).toBeLessThan(0.25)
        }
        prev = cur
      }
    }
  })

  it('posisi tepat di fromT berbeda tidak lebih dari satu langkah gerak', () => {
    // Saat coverage diganti di tengah pemutaran, UI mem-blend 400-600 ms.
    // Engine sendiri harus menghasilkan titik awal yang dekat, bukan teleportasi.
    const base = getStateContext(spain, []).ctx
    const branch = findBranch(spain, 'b-cov-switch')!
    const switched = getStateContext(spain, [branch.id]).ctx
    const a = getState(base, branch.fromT)
    const b = getState(switched, branch.fromT)
    for (const p of a.players) {
      expect(dist(p.position, b.byId[p.id]!.position)).toBeLessThan(0.3)
    }
  })

  it('setiap cabang menghasilkan kepemilikan bola yang sah', () => {
    for (const branch of spain.branches) {
      const ctx = getStateContext(spain, [branch.id]).ctx
      for (let t = 0; t <= spain.duration; t += 0.05) {
        const st = getState(ctx, t)
        expect(st.players.filter((p) => p.hasBall).length).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('hasil cabang dipakai kuis (F-18)', () => {
  it('setiap cabang outcome punya label hasil', () => {
    const outcomes = spain.branches.filter((b) => b.group === 'outcome')
    expect(outcomes.length).toBeGreaterThanOrEqual(4)
    for (const b of outcomes) {
      expect(b.outcome).toBeDefined()
    }
  })

  it('setiap opsi keputusan merujuk cabang yang ada', () => {
    for (const d of spain.decisions) {
      for (const o of d.options) {
        if (o.branchId) expect(findBranch(spain, o.branchId)).toBeDefined()
      }
    }
  })

  it('cabang kesalahan ditandai dengan event wrong', () => {
    const mistakes = spain.branches.filter((b) => b.group === 'mistake')
    expect(mistakes.length).toBeGreaterThanOrEqual(3)
    for (const b of mistakes) {
      expect(b.events.some((e) => e.wrong)).toBe(true)
    }
  })
})
