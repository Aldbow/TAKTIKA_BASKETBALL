/**
 * Alat diagnostik (bukan uji perilaku): mencetak jarak terdekat antar pasangan
 * pemain beserta posisi dan waktunya, untuk setiap kombinasi cabang.
 *
 * Dipakai saat menulis konten taktik: peringatan "saling tembus" hanya memberi
 * tahu ADA masalah; alat ini memberi tahu DI MANA dan KAPAN, sehingga koordinat
 * bisa diperbaiki tanpa menghitung spline dengan tangan.
 *
 * Aktifkan dengan: DIAGNOSE=set-spain-pnr npx vitest run diagnose
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'vitest'

import { branchKey, resolveEvents } from '../branch'
import { compileEvents } from '../interpolator'
import { createStateContext, getState } from '../state'
import { parseTactic } from '../loader'
import { dist } from '../court'

const target = process.env.DIAGNOSE

describe.skipIf(!target)('diagnosa jarak pemain', () => {
  it(`mencetak pasangan terdekat untuk ${target}`, () => {
    const raw = JSON.parse(
      readFileSync(join(process.cwd(), 'content', 'tactics', `${target}.json`), 'utf8'),
    )
    const tactic = parseTactic(raw)

    const sets: string[][] = [[], ...tactic.branches.map((b) => [b.id])]

    for (const set of sets) {
      const compiled = compileEvents(tactic, resolveEvents(tactic, set), set, branchKey(set))
      const ctx = createStateContext(compiled)

      type Closest = { d: number; t: number; a: string; b: string; pa: string; pb: string }
      const closest = new Map<string, Closest>()

      for (let t = 0; t <= tactic.duration + 1e-9; t += 0.05) {
        const st = getState(ctx, Math.min(t, tactic.duration))
        const contact = new Set<string>()
        for (const ev of st.activeEvents) {
          if (['screen', 'handoff', 'shot', 'rebound'].includes(ev.type)) {
            contact.add(ev.actor)
            if (ev.target && ev.target !== 'rim') contact.add(ev.target)
          }
        }
        for (let i = 0; i < st.players.length; i++) {
          for (let j = i + 1; j < st.players.length; j++) {
            const a = st.players[i]!
            const b = st.players[j]!
            if (contact.has(a.id) || contact.has(b.id)) continue
            if (a.guards === b.id || b.guards === a.id) continue
            if (a.team !== b.team && (a.hasBall || b.hasBall)) continue
            const d = dist(a.position, b.position)
            const key = `${a.id}-${b.id}`
            const prev = closest.get(key)
            if (!prev || d < prev.d) {
              closest.set(key, {
                d,
                t,
                a: a.id,
                b: b.id,
                pa: `(${a.position.x.toFixed(2)}, ${a.position.y.toFixed(2)})`,
                pb: `(${b.position.x.toFixed(2)}, ${b.position.y.toFixed(2)})`,
              })
            }
          }
        }
      }

      const bad = [...closest.values()].filter((c) => c.d < 0.7).sort((x, y) => x.d - y.d)
      if (bad.length === 0) continue
      console.log(`\n--- cabang: ${set.length ? set.join('+') : '(dasar)'} ---`)
      for (const c of bad) {
        console.log(
          `  ${c.d.toFixed(2)} m @ ${c.t.toFixed(2)} dtk  ${c.a} ${c.pa}  <->  ${c.b} ${c.pb}`,
        )
      }
    }
  })
})
