/**
 * Logika belajar — F-05 (Peta Jalur Belajar), F-06 (Pemutar Pelajaran),
 * F-07 (Kuis modul), dan titik mulai onboarding (PRD §12 Alur 1 langkah 4).
 *
 * Soal cek pemahaman disusun dari glosarium, bukan ditulis per pelajaran.
 * Alasannya: setiap pelajaran mencantumkan istilah yang diperkenalkannya
 * (`LessonNode.terms`), dan setiap istilah sudah punya arti singkat yang
 * ditinjau. Soal "apa arti istilah ini" yang dibangun dari data itu tidak
 * pernah bisa bertentangan dengan glosarium.
 *
 * Semua pengacakan deterministik (ber-seed id pelajaran), supaya soal yang sama
 * selalu tampil dengan urutan yang sama — dan bisa diuji.
 */

import {
  ALL_LESSONS,
  ALL_MODULES,
  CURRICULUM,
  type LessonNode,
  type ModuleNode,
} from '@content/curriculum'
import { GLOSSARY, findTerm, type GlossaryTerm } from '@content/glossary'

import type { LessonProgress, OnboardingAnswers } from '@/stores/progressStore'

export type Lesson = LessonNode & { moduleCode: string; level: 1 | 2 | 3 }

export interface CheckQuestion {
  id: string
  /** Kalimat pertanyaan; `*istilah*` ditampilkan miring */
  prompt: string
  options: { id: string; text: string }[]
  answer: string
  /** Penjelasan yang selalu tampil setelah menjawab */
  explain: string
  termId: string
}

/* -------------------------------------------------------------------------- */
/* Tautan                                                                     */
/* -------------------------------------------------------------------------- */

export function lessonHref(lesson: Pick<Lesson, 'id' | 'moduleCode'>): string {
  return `/belajar/${lesson.moduleCode}/${lesson.id}`
}

export function moduleHref(module: Pick<ModuleNode, 'code'>): string {
  return `/belajar/${module.code}`
}

export function levelOfModule(code: string): 1 | 2 | 3 {
  const n = Number(code[0])
  return n === 2 ? 2 : n === 3 ? 3 : 1
}

export function lessonsOfModule(code: string): Lesson[] {
  return ALL_LESSONS.filter((l) => l.moduleCode === code)
}

/* -------------------------------------------------------------------------- */
/* Istilah & soal                                                             */
/* -------------------------------------------------------------------------- */

export function lessonTerms(lesson: Pick<LessonNode, 'terms'>): GlossaryTerm[] {
  return (lesson.terms ?? []).map(findTerm).filter((t): t is GlossaryTerm => Boolean(t))
}

/** Istilah unik yang diperkenalkan semua pelajaran sebuah modul. */
export function moduleTerms(code: string): GlossaryTerm[] {
  const seen = new Set<string>()
  const out: GlossaryTerm[] = []
  for (const l of lessonsOfModule(code)) {
    for (const t of lessonTerms(l)) {
      if (!seen.has(t.id)) {
        seen.add(t.id)
        out.push(t)
      }
    }
  }
  return out
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Urutan acak yang stabil untuk seed yang sama. */
function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let a = hash(seed)
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  return out
}

/** Pengecoh: istilah lain, diutamakan dari level yang sama. */
function distractors(term: GlossaryTerm, seed: string, count: number): GlossaryTerm[] {
  const others = GLOSSARY.filter((t) => t.id !== term.id && !term.related.includes(t.id))
  const sameLevel = seededShuffle(
    others.filter((t) => t.level === term.level),
    seed,
  )
  const rest = seededShuffle(
    others.filter((t) => t.level !== term.level),
    seed,
  )
  return [...sameLevel, ...rest].slice(0, count)
}

/**
 * Satu soal untuk satu istilah. Dua bentuk bergantian supaya kuis tidak terasa
 * seperti mengulang pertanyaan yang sama:
 *   - "arti"    : istilah diberikan, pilih artinya
 *   - "istilah" : arti diberikan, pilih istilahnya
 */
export function termQuestion(
  term: GlossaryTerm,
  seed: string,
  form: 'arti' | 'istilah',
): CheckQuestion {
  const wrong = distractors(term, `${seed}:${term.id}`, 2)
  const explain = `${term.term}${term.padanan ? ` (${term.padanan})` : ''}: ${term.short}`

  if (form === 'arti') {
    const options = seededShuffle(
      [
        { id: term.id, text: term.short },
        ...wrong.map((w) => ({ id: w.id, text: w.short })),
      ],
      `${seed}:${term.id}:o`,
    )
    return {
      id: `${seed}:${term.id}:arti`,
      prompt: `Apa arti *${term.term}*?`,
      options,
      answer: term.id,
      explain,
      termId: term.id,
    }
  }

  const options = seededShuffle(
    [{ id: term.id, text: term.term }, ...wrong.map((w) => ({ id: w.id, text: w.term }))],
    `${seed}:${term.id}:o`,
  )
  return {
    id: `${seed}:${term.id}:istilah`,
    prompt: `Istilah mana yang cocok dengan penjelasan ini? "${term.short}"`,
    options,
    answer: term.id,
    explain,
    termId: term.id,
  }
}

/**
 * 1-3 soal cek pemahaman per pelajaran (PRD §4). Pelajaran tanpa istilah
 * sendiri memakai istilah dari modulnya sebagai pengingat; modul tanpa istilah
 * sama sekali tidak punya soal cek.
 */
export function lessonQuestions(lesson: Lesson): CheckQuestion[] {
  let terms = lessonTerms(lesson)
  if (terms.length === 0) terms = seededShuffle(moduleTerms(lesson.moduleCode), lesson.id)
  return terms
    .slice(0, 3)
    .map((t, i) => termQuestion(t, lesson.id, i % 2 === 0 ? 'arti' : 'istilah'))
}

/** Kuis modul 5 soal (F-07). `null` bila modul belum punya istilah. */
export function moduleQuiz(code: string): CheckQuestion[] | null {
  const terms = moduleTerms(code)
  if (terms.length === 0) return null
  const picked = seededShuffle(terms, `quiz:${code}`)
  const out: CheckQuestion[] = []
  // Bila istilah kurang dari 5, istilah yang sama ditanyakan dalam bentuk lain.
  for (let i = 0; out.length < 5 && i < picked.length * 2; i++) {
    const term = picked[i % picked.length] as GlossaryTerm
    const form = i < picked.length ? 'arti' : 'istilah'
    out.push(termQuestion(term, `quiz:${code}`, form))
  }
  return out
}

/** Ambang lulus kuis modul — PRD §8 F-07: "lencana saat lulus >= 80%". */
export const MODULE_PASS_SCORE = 80

/* -------------------------------------------------------------------------- */
/* Progres                                                                    */
/* -------------------------------------------------------------------------- */

export interface LevelProgress {
  level: 1 | 2 | 3
  total: number
  ready: number
  done: number
}

export function levelProgress(
  lessons: Record<string, LessonProgress>,
  level: 1 | 2 | 3,
): LevelProgress {
  const inLevel = ALL_LESSONS.filter((l) => l.level === level)
  const ready = inLevel.filter((l) => l.status === 'ready')
  return {
    level,
    total: inLevel.length,
    ready: ready.length,
    done: ready.filter((l) => lessons[l.id]?.status === 'done').length,
  }
}

/** Semua pelajaran SIAP di level ini sudah selesai (dasar lencana level). */
export function isLevelDone(lessons: Record<string, LessonProgress>, level: 1 | 2): boolean {
  const p = levelProgress(lessons, level)
  return p.ready > 0 && p.done === p.ready
}

export function moduleProgress(
  lessons: Record<string, LessonProgress>,
  code: string,
): { total: number; ready: number; done: number } {
  const list = lessonsOfModule(code)
  const ready = list.filter((l) => l.status === 'ready')
  return {
    total: list.length,
    ready: ready.length,
    done: ready.filter((l) => lessons[l.id]?.status === 'done').length,
  }
}

/** Pelajaran siap pertama di sebuah level. */
export function firstReadyLesson(level: 1 | 2): Lesson | null {
  return ALL_LESSONS.find((l) => l.level === level && l.status === 'ready') ?? null
}

/** Pelajaran siap berikutnya yang belum selesai, mulai dari level tertentu. */
export function nextUnfinishedLesson(
  lessons: Record<string, LessonProgress>,
  fromLevel: 1 | 2 = 1,
): Lesson | null {
  const ordered = [
    ...ALL_LESSONS.filter((l) => l.level >= fromLevel),
    ...ALL_LESSONS.filter((l) => l.level < fromLevel),
  ]
  return (
    ordered.find((l) => l.status === 'ready' && lessons[l.id]?.status !== 'done') ?? null
  )
}

/** Pelajaran siap berikutnya setelah `lessonId`, melewati yang "segera". */
export function nextReadyLessonAfter(lessonId: string): Lesson | null {
  const i = ALL_LESSONS.findIndex((l) => l.id === lessonId)
  if (i < 0) return null
  return ALL_LESSONS.slice(i + 1).find((l) => l.status === 'ready') ?? null
}

/* -------------------------------------------------------------------------- */
/* Titik mulai onboarding (PRD §12 Alur 1 langkah 4)                          */
/* -------------------------------------------------------------------------- */

export interface StartSuggestion {
  title: string
  reason: string
  href: string
  cta: string
}

/**
 * "Sistem menyarankan titik mulai (misalnya Level 1 untuk penggemar baru, tes
 * penempatan untuk pemain)." Tes penempatan (F-02) adalah P1, jadi pemain
 * berpengalaman diarahkan langsung ke Level 2 — sesuai titik mulai persona P1
 * dan P4 di PRD §3.
 */
export function suggestedStart(answers: OnboardingAnswers): StartSuggestion {
  if (answers.role === 'pelatih') {
    return {
      title: 'Perpustakaan Taktik',
      reason:
        'Pelatih biasanya mulai dari taktik yang akan diajarkan. Buka satu taktik, tekan F untuk layar penuh, lalu 1-5 untuk menunjukkan tugas tiap posisi.',
      href: '/taktik',
      cta: 'Buka Perpustakaan Taktik',
    }
  }

  const level2 = answers.experience !== 'baru'
  const lesson = firstReadyLesson(level2 ? 2 : 1)
  if (!lesson) {
    return {
      title: 'Perpustakaan Taktik',
      reason: 'Mulai dari taktik pertama.',
      href: '/taktik',
      cta: 'Buka Perpustakaan Taktik',
    }
  }

  return {
    title: `Level ${lesson.level} · ${lesson.title}`,
    reason: level2
      ? 'Kamu sudah pernah bermain, jadi kita lewati aturan dasar dan mulai dari spacing dan gerakan tim di Level 2. Level 1 tetap terbuka kapan saja.'
      : 'Kita mulai dari dasar: tujuan permainan, lapangan, dan aturan waktu. Setiap pelajaran 3-5 menit.',
    href: lessonHref(lesson),
    cta: 'Mulai pelajaran pertama',
  }
}

export { CURRICULUM, ALL_LESSONS, ALL_MODULES }
