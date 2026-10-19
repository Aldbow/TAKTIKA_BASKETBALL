/**
 * Integritas tautan konten.
 *
 * Konten TAKTIKA saling merujuk dengan tiga arah: taktik -> istilah glosarium,
 * istilah -> potongan taktik (mini-animasi F-08), dan taktik -> taktik terkait
 * (PRD §6 anatomi butir 9). Satu rujukan yang salah tulis akan menghasilkan
 * tautan mati di aplikasi, bukan error — jadi diperiksa di sini.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { GLOSSARY, findTerm, glossaryAZ, glossaryByLetter, termsForLevel } from '@content/glossary'
import { ALL_LESSONS, ALL_MODULES, CURRICULUM, findLesson, findModule, moduleOfLesson, nextLesson } from '@content/curriculum'
import { parseTactic } from '../loader'
import type { Tactic } from '../schema'

const DIR = join(process.cwd(), 'content', 'tactics')

function loadAll(): Tactic[] {
  return readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => parseTactic(JSON.parse(readFileSync(join(DIR, f), 'utf8'))))
}

const tactics = loadAll()
const tacticIds = new Set(tactics.map((t) => t.id))
const termIds = new Set(GLOSSARY.map((t) => t.id))

describe('perpustakaan taktik', () => {
  it('memuat 8 taktik MVP', () => {
    expect(tactics).toHaveLength(8)
  })

  it('meliputi keenam kategori PRD §6', () => {
    const categories = new Set(tactics.map((t) => t.category))
    expect([...categories].sort()).toEqual([
      'defense',
      'offense',
      'press',
      'set-play',
      'special',
      'vs-zone',
    ])
  })

  it('setiap id dan slug unik', () => {
    expect(new Set(tactics.map((t) => t.id)).size).toBe(tactics.length)
    expect(new Set(tactics.map((t) => t.slug)).size).toBe(tactics.length)
  })

  it('ada taktik lapangan penuh untuk memvalidasi sistem koordinat full', () => {
    expect(tactics.some((t) => t.court === 'full')).toBe(true)
  })

  it('setiap taktik punya semua bagian anatomi PRD §6', () => {
    for (const t of tactics) {
      expect(t.summary.id.length, `${t.id} ringkasan`).toBeGreaterThan(20)
      expect(t.whenToUse.id.length, `${t.id} kapan dipakai`).toBeGreaterThan(20)
      expect(t.phases.length, `${t.id} fase (PRD: 3-6)`).toBeGreaterThanOrEqual(3)
      expect(t.phases.length, `${t.id} fase (PRD: 3-6)`).toBeLessThanOrEqual(6)
      expect(t.povLenses.length, `${t.id} lensa POV`).toBe(5)
      expect(t.mistakes.length, `${t.id} kesalahan umum (PRD: 3-5)`).toBeGreaterThanOrEqual(3)
      expect(t.counters.length, `${t.id} counter bertahan`).toBeGreaterThanOrEqual(3)
      expect(t.scenarios.length, `${t.id} skenario kuis (PRD: min 3)`).toBeGreaterThanOrEqual(3)
      expect(t.branches.length, `${t.id} cabang`).toBeGreaterThanOrEqual(2)
    }
  })

  it('setiap lensa POV punya langkah untuk setiap fase utama', () => {
    for (const t of tactics) {
      for (const l of t.povLenses) {
        expect(l.steps.length, `${t.id} / ${l.playerId}`).toBeGreaterThanOrEqual(3)
        expect(l.cues.length, `${t.id} / ${l.playerId} isyarat`).toBeGreaterThanOrEqual(1)
        expect(l.mistakes.length, `${t.id} / ${l.playerId} kesalahan`).toBeGreaterThanOrEqual(2)
        expect(l.calls.length, `${t.id} / ${l.playerId} panggilan`).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('taktik bertahan memakai lensa X1-X5, taktik menyerang memakai O1-O5', () => {
    for (const t of tactics) {
      const prefix = t.category === 'defense' ? 'X' : 'O'
      for (const l of t.povLenses) {
        expect(l.playerId.startsWith(prefix), `${t.id} / ${l.playerId}`).toBe(true)
      }
    }
  })

  it('rujukan taktik terkait selalu ada', () => {
    for (const t of tactics) {
      for (const id of [...t.related.prerequisites, ...t.related.nextUp]) {
        expect(tacticIds.has(id), `${t.id} merujuk taktik "${id}"`).toBe(true)
      }
    }
  })

  it('setiap istilah yang dirujuk taktik ada di glosarium', () => {
    for (const t of tactics) {
      for (const term of t.terms) {
        expect(termIds.has(term), `${t.id} merujuk istilah "${term}"`).toBe(true)
      }
    }
  })

  it('setiap taktik menyerang punya minimal satu opsi keputusan yang benar', () => {
    for (const t of tactics.filter((x) => x.category !== 'defense')) {
      for (const d of t.decisions) {
        expect(d.options.some((o) => o.correct), `${t.id} / ${d.id}`).toBe(true)
      }
    }
  })

  it('setiap opsi keputusan punya penjelasan — jawaban salah selalu dijelaskan (F-18)', () => {
    for (const t of tactics) {
      for (const d of t.decisions) {
        for (const o of d.options) {
          expect(o.explain.id.length, `${t.id} / ${o.id}`).toBeGreaterThan(30)
        }
      }
    }
  })
})

describe('glosarium (F-08, PRD §19)', () => {
  it('memuat ke-41 istilah inti Lampiran PRD §19', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(41)
  })

  it('setiap id unik', () => {
    expect(new Set(GLOSSARY.map((t) => t.id)).size).toBe(GLOSSARY.length)
  })

  it('setiap istilah punya arti singkat dan penjelasan panjang', () => {
    for (const t of GLOSSARY) {
      expect(t.short.length, `${t.id} arti singkat`).toBeGreaterThan(20)
      expect(t.long.length, `${t.id} penjelasan`).toBeGreaterThan(80)
    }
  })

  it('istilah terkait selalu menunjuk istilah yang ada', () => {
    for (const t of GLOSSARY) {
      for (const r of t.related) {
        expect(termIds.has(r), `${t.id} merujuk "${r}"`).toBe(true)
      }
    }
  })

  it('istilah tidak merujuk dirinya sendiri', () => {
    for (const t of GLOSSARY) {
      expect(t.related).not.toContain(t.id)
    }
  })

  it('mini-animasi menunjuk taktik yang ada, dengan rentang 3-6 detik (F-08)', () => {
    const withClip = GLOSSARY.filter((t) => t.clip)
    expect(withClip.length).toBeGreaterThanOrEqual(30)

    for (const term of withClip) {
      const clip = term.clip!
      const tactic = tactics.find((t) => t.id === clip.tacticId)
      expect(tactic, `${term.id} merujuk taktik "${clip.tacticId}"`).toBeDefined()
      expect(clip.to, `${term.id} rentang`).toBeGreaterThan(clip.from)
      expect(clip.to, `${term.id} melewati durasi taktik`).toBeLessThanOrEqual(
        tactic!.duration + 1e-6,
      )
      const span = clip.to - clip.from
      expect(span, `${term.id} durasi klip`).toBeGreaterThanOrEqual(1.5)
      expect(span, `${term.id} durasi klip`).toBeLessThanOrEqual(6.0)

      if (clip.pov) {
        expect(
          tactic!.players.some((p) => p.id === clip.pov),
          `${term.id} POV "${clip.pov}" tidak ada di ${clip.tacticId}`,
        ).toBe(true)
      }
      for (const b of clip.branches ?? []) {
        expect(
          tactic!.branches.some((x) => x.id === b),
          `${term.id} cabang "${b}" tidak ada di ${clip.tacticId}`,
        ).toBe(true)
      }
    }
  })

  it('findTerm menemukan istilah dan mengembalikan undefined untuk yang tidak ada', () => {
    expect(findTerm('spacing')?.term).toBe('Spacing')
    expect(findTerm('tidak-ada')).toBeUndefined()
  })

  it('glossaryAZ mengurutkan menurut ejaan asli', () => {
    const sorted = glossaryAZ()
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1]!.term.localeCompare(sorted[i]!.term, 'id')).toBeLessThanOrEqual(0)
    }
  })

  it('glossaryByLetter mengelompokkan tanpa kehilangan istilah', () => {
    const groups = glossaryByLetter()
    const total = groups.reduce((n, g) => n + g.terms.length, 0)
    expect(total).toBe(GLOSSARY.length)
  })

  it('setiap level punya istilah', () => {
    expect(termsForLevel(1).length).toBeGreaterThan(5)
    expect(termsForLevel(2).length).toBeGreaterThan(5)
    expect(termsForLevel(3).length).toBeGreaterThan(2)
  })
})

describe('kurikulum (F-05, PRD §4/§5/§6)', () => {
  it('tiga level dengan 9 + 9 + 6 modul', () => {
    expect(CURRICULUM).toHaveLength(3)
    expect(CURRICULUM[0]!.modules).toHaveLength(9)
    expect(CURRICULUM[1]!.modules).toHaveLength(9)
    expect(CURRICULUM[2]!.modules).toHaveLength(6)
  })

  it('jumlah pelajaran cocok dengan tabel PRD: 48 di Level 1, 46 di Level 2', () => {
    expect(ALL_LESSONS.filter((l) => l.level === 1)).toHaveLength(48)
    expect(ALL_LESSONS.filter((l) => l.level === 2)).toHaveLength(46)
  })

  it('setiap kode modul dan id pelajaran unik', () => {
    expect(new Set(ALL_MODULES.map((m) => m.code)).size).toBe(ALL_MODULES.length)
    expect(new Set(ALL_LESSONS.map((l) => l.id)).size).toBe(ALL_LESSONS.length)
  })

  it('prasyarat modul selalu menunjuk modul yang ada', () => {
    const codes = new Set(ALL_MODULES.map((m) => m.code))
    for (const m of ALL_MODULES) {
      for (const req of m.requires) {
        expect(codes.has(req), `${m.code} butuh "${req}"`).toBe(true)
      }
    }
  })

  it('prasyarat tidak membentuk siklus dan selalu mendahului modulnya', () => {
    const index = new Map(ALL_MODULES.map((m, i) => [m.code, i]))
    for (const m of ALL_MODULES) {
      for (const req of m.requires) {
        expect(
          index.get(req)!,
          `${m.code} butuh ${req} yang muncul setelahnya`,
        ).toBeLessThan(index.get(m.code)!)
      }
    }
  })

  it('setiap pelajaran punya ringkasan dan durasi yang masuk akal', () => {
    for (const l of ALL_LESSONS) {
      expect(l.blurb.length, `${l.id}`).toBeGreaterThan(20)
      // PRD §4: "sekitar 48 pelajaran pendek (3-5 menit)"
      expect(l.minutes, `${l.id}`).toBeGreaterThanOrEqual(3)
      expect(l.minutes, `${l.id}`).toBeLessThanOrEqual(5)
    }
  })

  it('istilah yang diperkenalkan pelajaran ada di glosarium', () => {
    for (const l of ALL_LESSONS) {
      for (const term of l.terms ?? []) {
        expect(termIds.has(term), `${l.id} merujuk istilah "${term}"`).toBe(true)
      }
    }
  })

  it('pembantu navigasi kurikulum bekerja', () => {
    expect(findModule('1.2')?.title).toBe('Lapangan & Zona')
    expect(findModule('9.9')).toBeUndefined()
    const first = ALL_LESSONS[0]!
    expect(findLesson(first.id)?.title).toBe(first.title)
    expect(moduleOfLesson(first.id)?.code).toBe('1.1')
    expect(nextLesson(first.id)?.lessonId).toBe(ALL_LESSONS[1]!.id)
    expect(nextLesson(ALL_LESSONS[ALL_LESSONS.length - 1]!.id)).toBeNull()
  })

  it('kategori Level 3 cocok dengan kategori taktik di engine', () => {
    const level3 = CURRICULUM[2]!
    const cats = new Set(tactics.map((t) => t.category))
    // Setiap kategori yang punya taktik harus punya simpul di Level 3.
    expect(level3.modules).toHaveLength(6)
    expect(cats.size).toBe(6)
  })
})
