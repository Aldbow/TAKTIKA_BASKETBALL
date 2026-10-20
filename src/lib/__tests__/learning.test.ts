import { describe, expect, it } from 'vitest'

import { ALL_LESSONS, ALL_MODULES } from '@content/curriculum'
import { SCENARIO_KEYS } from '@content/quizzes/read-react'
import { TACTICS, getTacticById } from '@/lib/content'
import {
  isLevelDone,
  lessonQuestions,
  levelProgress,
  moduleQuiz,
  nextReadyLessonAfter,
  suggestedStart,
} from '@/lib/learning'
import { branchesAfterChoice, resolveScenarios } from '@/lib/readReact'
import type { LessonProgress } from '@/stores/progressStore'

describe('soal cek pemahaman (F-06)', () => {
  const ready = ALL_LESSONS.filter((l) => l.status === 'ready')

  it('maksimal 3 soal per pelajaran, dengan jawaban yang ada di opsinya', () => {
    for (const lesson of ready) {
      const qs = lessonQuestions(lesson)
      expect(qs.length).toBeLessThanOrEqual(3)
      for (const q of qs) {
        expect(q.options.map((o) => o.id)).toContain(q.answer)
        // Tidak ada opsi kembar.
        expect(new Set(q.options.map((o) => o.text)).size).toBe(q.options.length)
      }
    }
  })

  it('deterministik: soal yang sama untuk pelajaran yang sama', () => {
    const lesson = ready.find((l) => (l.terms ?? []).length > 0)!
    expect(lessonQuestions(lesson)).toEqual(lessonQuestions(lesson))
  })
})

describe('kuis modul (F-07)', () => {
  it('5 soal untuk setiap modul yang punya istilah', () => {
    for (const m of ALL_MODULES) {
      const quiz = moduleQuiz(m.code)
      if (!quiz) continue
      expect(quiz.length).toBeGreaterThan(0)
      expect(quiz.length).toBeLessThanOrEqual(5)
      expect(new Set(quiz.map((q) => q.id)).size).toBe(quiz.length)
    }
  })
})

describe('progres level', () => {
  it('level selesai hanya bila semua pelajaran siap selesai', () => {
    const lessons: Record<string, LessonProgress> = {}
    expect(isLevelDone(lessons, 1)).toBe(false)
    for (const l of ALL_LESSONS.filter((x) => x.level === 1 && x.status === 'ready')) {
      lessons[l.id] = { status: 'done', correct: 0, total: 0 }
    }
    expect(isLevelDone(lessons, 1)).toBe(true)
    const p = levelProgress(lessons, 1)
    expect(p.done).toBe(p.ready)
  })

  it('pelajaran berikutnya melewati yang berstatus "segera"', () => {
    for (const l of ALL_LESSONS) {
      const next = nextReadyLessonAfter(l.id)
      if (next) expect(next.status).toBe('ready')
    }
  })
})

describe('titik mulai onboarding (PRD §12 Alur 1)', () => {
  it('penggemar baru mulai di Level 1, pemain berpengalaman di Level 2, pelatih di perpustakaan', () => {
    expect(
      suggestedStart({ role: 'penggemar', position: 'PG', experience: 'baru', goal: 'x' }).href,
    ).toMatch(/^\/belajar\/1\./)
    expect(
      suggestedStart({ role: 'pemain', position: 'SG', experience: 'kompetisi', goal: 'x' }).href,
    ).toMatch(/^\/belajar\/2\./)
    expect(
      suggestedStart({ role: 'pelatih', position: 'C', experience: 'kompetisi', goal: 'x' }).href,
    ).toBe('/taktik')
  })
})

describe('kunci Baca & Bereaksi (F-18)', () => {
  it('setiap kunci merujuk taktik, skenario, dan opsi yang ada', () => {
    for (const [tacticId, keys] of Object.entries(SCENARIO_KEYS)) {
      const tactic = getTacticById(tacticId)
      expect(tactic, tacticId).toBeDefined()
      for (const [scenarioId, key] of Object.entries(keys)) {
        const s = tactic!.scenarios.find((x) => x.id === scenarioId)
        expect(s, `${tacticId}:${scenarioId}`).toBeDefined()
        const d = tactic!.decisions.find((x) => x.id === s!.decisionId)!
        expect(d.options.map((o) => o.id), `${tacticId}:${scenarioId}`).toContain(key.answer)
      }
    }
  })

  it('setiap taktik punya minimal 3 skenario yang bisa dimainkan', () => {
    for (const t of TACTICS) {
      const resolved = resolveScenarios(t)
      expect(resolved.length, t.id).toBeGreaterThanOrEqual(3)
      for (const r of resolved) {
        expect(r.playFrom).toBeLessThan(r.scenario.pauseAt)
        expect(r.scenario.pauseAt).toBeLessThanOrEqual(t.duration)
      }
    }
  })

  it('cabang pilihan menggantikan cabang segrup dari situasi awal', () => {
    const spain = getTacticById('set-spain-pnr')!
    const s2 = resolveScenarios(spain).find((r) => r.scenario.id === 's2')!
    const pop = s2.decision.options.find((o) => o.id === 'o-pop')!
    const after = branchesAfterChoice(spain, s2.setupBranches, pop)
    expect(after).toContain('b-pass-pop')
    expect(after).not.toContain('b-kick-corner')
  })
})
