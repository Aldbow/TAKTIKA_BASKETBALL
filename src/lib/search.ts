/**
 * Pencarian global — F-09: "Cari taktik, istilah, pelajaran; filter kategori,
 * tingkat, posisi."
 *
 * Indeks dibangun di klien dari konten yang sudah di-bundel. Untuk volume MVP
 * (8 taktik + 44 istilah + 94 pelajaran) pemindaian linear berjalan di bawah
 * satu milidetik, jadi tidak perlu pustaka pencarian — dan bundel tetap kecil,
 * yang langsung melayani anggaran JS PRD §15.
 */

import { CATEGORY_LABEL, type TacticCategory } from '@/engine'
import { ALL_LESSONS } from '@content/curriculum'
import { GLOSSARY } from '@content/glossary'
import { TACTICS } from './content'

export type ResultKind = 'tactic' | 'term' | 'lesson'

export interface SearchResult {
  kind: ResultKind
  id: string
  title: string
  subtitle: string
  href: string
  /** Skor relevansi; makin besar makin atas */
  score: number
  category?: TacticCategory
  level?: number
  /** Nomor posisi yang punya lensa POV (taktik) */
  positions?: string[]
}

export interface SearchFilters {
  kinds?: ResultKind[]
  categories?: TacticCategory[]
  /** Tingkat kesulitan taktik 1-5, atau level kurikulum 1-3 */
  levels?: number[]
  /** Nomor posisi "1".."5" */
  positions?: string[]
}

/**
 * Normalisasi teks untuk pencocokan: huruf kecil, tanpa diakritik, tanpa tanda
 * baca. "Pick-and-Roll" dan "pick and roll" harus cocok dengan kueri yang sama.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

interface IndexEntry extends Omit<SearchResult, 'score'> {
  haystack: string
  /** Kata-kata judul, dipakai memberi bobot pada kecocokan judul */
  titleWords: string
}

let index: IndexEntry[] | null = null

function buildIndex(): IndexEntry[] {
  const entries: IndexEntry[] = []

  for (const t of TACTICS) {
    const positions = t.povLenses.map((l) => l.playerId.slice(-1))
    entries.push({
      kind: 'tactic',
      id: t.id,
      title: t.title.id,
      subtitle: `${CATEGORY_LABEL[t.category]} · tingkat ${t.level}`,
      href: `/taktik/${t.slug}`,
      category: t.category,
      level: t.level,
      positions,
      titleWords: normalize(t.title.id),
      haystack: normalize(
        [
          t.title.id,
          t.title.en ?? '',
          t.summary.id,
          t.whenToUse.id,
          t.origin?.id ?? '',
          CATEGORY_LABEL[t.category],
          ...t.terms,
          ...t.phases.map((p) => p.title.id),
          ...t.povLenses.map((l) => l.mission.id),
        ].join(' '),
      ),
    })
  }

  for (const term of GLOSSARY) {
    entries.push({
      kind: 'term',
      id: term.id,
      title: term.term,
      subtitle: term.padanan ? `${term.padanan} · Level ${term.level}` : `Level ${term.level}`,
      href: `/glosarium#${term.id}`,
      level: term.level,
      titleWords: normalize(`${term.term} ${term.padanan ?? ''}`),
      haystack: normalize([term.term, term.padanan ?? '', term.short, term.long].join(' ')),
    })
  }

  for (const lesson of ALL_LESSONS) {
    entries.push({
      kind: 'lesson',
      id: lesson.id,
      title: lesson.title,
      subtitle: `Modul ${lesson.moduleCode} · Level ${lesson.level}`,
      href: `/belajar/${lesson.moduleCode}/${lesson.id}`,
      level: lesson.level,
      titleWords: normalize(lesson.title),
      haystack: normalize(`${lesson.title} ${lesson.blurb}`),
    })
  }

  return entries
}

function getIndex(): IndexEntry[] {
  if (!index) index = buildIndex()
  return index
}

/**
 * Cari dengan kueri + filter.
 *
 * Skor: kecocokan di awal judul paling tinggi, lalu judul, lalu isi. Setiap
 * kata kueri harus cocok (AND), supaya "spain roll" tidak mengembalikan semua
 * taktik yang memuat kata "roll".
 */
export function search(query: string, filters: SearchFilters = {}, limit = 30): SearchResult[] {
  const q = normalize(query)
  const words = q.length > 0 ? q.split(' ') : []

  const out: SearchResult[] = []

  for (const e of getIndex()) {
    if (filters.kinds && !filters.kinds.includes(e.kind)) continue
    if (filters.categories && filters.categories.length > 0) {
      if (!e.category || !filters.categories.includes(e.category)) continue
    }
    if (filters.levels && filters.levels.length > 0) {
      if (e.level === undefined || !filters.levels.includes(e.level)) continue
    }
    if (filters.positions && filters.positions.length > 0) {
      if (!e.positions || !filters.positions.some((p) => e.positions!.includes(p))) continue
    }

    if (words.length === 0) {
      out.push({ ...entryToResult(e), score: 1 })
      continue
    }

    let score = 0
    let allMatched = true
    for (const w of words) {
      if (e.titleWords.startsWith(w)) score += 12
      else if (e.titleWords.includes(w)) score += 7
      else if (e.haystack.includes(w)) score += 2
      else {
        allMatched = false
        break
      }
    }
    if (!allMatched) continue

    // Taktik diutamakan tipis di atas pelajaran pada skor yang sama: pengguna
    // yang mencari nama taktik hampir selalu ingin halaman taktiknya.
    if (e.kind === 'tactic') score += 1
    out.push({ ...entryToResult(e), score })
  }

  return out
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'id'))
    .slice(0, limit)
}

function entryToResult(e: IndexEntry): Omit<SearchResult, 'score'> {
  const { haystack: _h, titleWords: _t, ...rest } = e
  void _h
  void _t
  return rest
}

/** Buang indeks — dipakai pengujian dan Studio Konten setelah konten berubah. */
export function invalidateSearchIndex(): void {
  index = null
}

/** Opsi filter untuk UI perpustakaan. */
export const FILTER_CATEGORIES: { value: TacticCategory; label: string }[] = (
  ['offense', 'set-play', 'vs-zone', 'defense', 'press', 'special'] as TacticCategory[]
).map((value) => ({ value, label: CATEGORY_LABEL[value] }))

export const FILTER_LEVELS = [1, 2, 3, 4, 5]

export const FILTER_POSITIONS = [
  { value: '1', label: '1 · PG' },
  { value: '2', label: '2 · SG' },
  { value: '3', label: '3 · SF' },
  { value: '4', label: '4 · PF' },
  { value: '5', label: '5 · C' },
]
