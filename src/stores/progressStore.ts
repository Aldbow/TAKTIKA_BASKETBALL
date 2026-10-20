'use client'

/**
 * Progres pengguna — F-03, F-07, F-24, F-25, F-26.
 *
 * PRD §13 entitas UserProgress: "userId, item, status, skor, XP, waktu.
 * Disimpan lokal untuk tamu."
 *
 * Seluruh progres melewati satu StorageAdapter (src/lib/storage.ts), jadi
 * beralih dari mode tamu ke akun tersinkron (F-04) tidak menyentuh store ini.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import { zustandStorage } from '@/lib/storage'
import { dayKey, daysBetween } from '@/lib/format'
import { XP, earnedBadges, type BadgeInput } from '@/lib/xp'
import { track } from '@/lib/analytics'

export type ItemStatus = 'locked' | 'available' | 'in-progress' | 'done'

export interface LessonProgress {
  status: Exclude<ItemStatus, 'locked'>
  /** Jumlah soal cek yang dijawab benar */
  correct: number
  total: number
  /** ISO timestamp penyelesaian terakhir */
  at?: string
}

export interface QuizAttempt {
  /** Skor 0-100 */
  score: number
  at: string
}

export interface OnboardingAnswers {
  role: 'pemain' | 'pelatih' | 'penggemar'
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C'
  experience: 'baru' | 'pemain-rekreasi' | 'kompetisi'
  goal: string
}

export interface ProgressState {
  /** Onboarding sudah selesai? (F-01) */
  onboarding: OnboardingAnswers | null

  lessons: Record<string, LessonProgress>
  /** Kuis modul: kode modul -> daftar percobaan (F-07) */
  moduleQuizzes: Record<string, QuizAttempt[]>
  /** Kuis Baca & Bereaksi per taktik (F-18) */
  tacticQuizzes: Record<string, QuizAttempt[]>

  /** Taktik yang pernah ditonton sampai akhir */
  tacticsWatched: string[]
  /** Pasangan "tacticId:playerId" yang POV-nya pernah dibuka */
  povSeen: string[]
  /** Pasangan "tacticId:branchId" yang pernah dicoba */
  branchesSeen: string[]
  /** Skenario kuis yang pernah dijawab benar */
  scenariosCorrect: string[]
  /** Isyarat yang sering terlewat — dipakai rekomendasi (PRD §12 Alur 3 & 5) */
  missedCues: Record<string, number>

  /** Koleksi & favorit (F-24) */
  collection: { id: string; kind: 'tactic' | 'lesson' | 'term'; at: string }[]

  xp: number
  badges: string[]

  /** Streak harian (PRD §11 S-03) */
  streak: number
  bestStreak: number
  lastActiveDay: string | null

  /** Jumlah pelajaran selesai sebelum membuat akun — properti analitik F-03 */
  lessonsBeforeAccount: number
  dismissedSignupPrompt: boolean

  /** Titik terakhir yang dibuka — kartu "Lanjutkan" di dashboard (PRD §12 Alur 5) */
  lastVisited: LastVisited | null

  /* ---- aksi ---- */
  completeOnboarding: (answers: OnboardingAnswers) => void
  startLesson: (lessonId: string, level: number) => void
  completeLesson: (lessonId: string, level: number, correct: number, total: number) => void
  recordModuleQuiz: (moduleCode: string, score: number) => void
  recordTacticQuiz: (tacticId: string, score: number) => void
  markTacticWatched: (tacticId: string) => void
  markPovSeen: (tacticId: string, playerId: string) => void
  markBranchSeen: (tacticId: string, branchId: string) => void
  recordScenario: (scenarioId: string, correct: boolean, cue?: string) => void
  toggleCollection: (id: string, kind: 'tactic' | 'lesson' | 'term') => void
  dismissSignupPrompt: () => void
  setLastVisited: (item: Omit<LastVisited, 'at'>) => void
  /** Catat lencana yang baru didapat (F-25); id yang sudah ada diabaikan. */
  awardBadges: (ids: string[]) => void
  touchStreak: () => void
  resetAll: () => void
}

export interface LastVisited {
  kind: 'lesson' | 'tactic'
  id: string
  title: string
  href: string
  at: string
}

const EMPTY = {
  onboarding: null,
  lessons: {},
  moduleQuizzes: {},
  tacticQuizzes: {},
  tacticsWatched: [],
  povSeen: [],
  branchesSeen: [],
  scenariosCorrect: [],
  missedCues: {},
  collection: [],
  xp: 0,
  badges: [],
  streak: 0,
  bestStreak: 0,
  lastActiveDay: null,
  lessonsBeforeAccount: 0,
  dismissedSignupPrompt: false,
  lastVisited: null,
}

/** Tambahkan nilai unik ke array tanpa menduplikasi. */
function addUnique(list: string[], value: string): string[] {
  return list.includes(value) ? list : [...list, value]
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...EMPTY,

      completeOnboarding: (answers) => {
        set({ onboarding: answers })
        track({
          name: 'onboarding_completed',
          role: answers.role,
          position: answers.position,
          experience: answers.experience,
          goal: answers.goal,
        })
      },

      startLesson: (lessonId, level) => {
        const cur = get().lessons[lessonId]
        if (cur?.status !== 'done') {
          set((s) => ({
            lessons: {
              ...s.lessons,
              [lessonId]: { status: 'in-progress', correct: 0, total: 0, ...cur },
            },
          }))
        }
        track({ name: 'lesson_started', lesson_id: lessonId, level })
        get().touchStreak()
      },

      completeLesson: (lessonId, level, correct, total) => {
        const already = get().lessons[lessonId]?.status === 'done'
        const gained = already
          ? 0
          : XP.lessonComplete + correct * XP.lessonCheckCorrect

        set((s) => ({
          lessons: {
            ...s.lessons,
            [lessonId]: { status: 'done', correct, total, at: new Date().toISOString() },
          },
          xp: s.xp + gained,
          lessonsBeforeAccount: s.lessonsBeforeAccount + (already ? 0 : 1),
        }))
        track({ name: 'lesson_completed', lesson_id: lessonId, level, duration_s: 0 })
        get().touchStreak()
      },

      recordModuleQuiz: (moduleCode, score) => {
        const attempts = get().moduleQuizzes[moduleCode] ?? []
        // Lencana dan XP hanya untuk lulus pertama (>= 80%, F-07).
        const passedBefore = attempts.some((a) => a.score >= 80)
        set((s) => ({
          moduleQuizzes: {
            ...s.moduleQuizzes,
            [moduleCode]: [...attempts, { score, at: new Date().toISOString() }],
          },
          xp: s.xp + (!passedBefore && score >= 80 ? XP.moduleQuizPassed : 0),
        }))
        track({ name: 'quiz_completed', quiz_id: `module:${moduleCode}`, score })
      },

      recordTacticQuiz: (tacticId, score) => {
        const attempts = get().tacticQuizzes[tacticId] ?? []
        set((s) => ({
          tacticQuizzes: {
            ...s.tacticQuizzes,
            [tacticId]: [...attempts, { score, at: new Date().toISOString() }],
          },
          xp: s.xp + XP.quizCompleted,
        }))
        track({ name: 'quiz_completed', quiz_id: `tactic:${tacticId}`, score })
        get().touchStreak()
      },

      markTacticWatched: (tacticId) => {
        if (get().tacticsWatched.includes(tacticId)) return
        set((s) => ({
          tacticsWatched: addUnique(s.tacticsWatched, tacticId),
          xp: s.xp + XP.tacticWatchedFull,
        }))
      },

      markPovSeen: (tacticId, playerId) => {
        const key = `${tacticId}:${playerId}`
        if (get().povSeen.includes(key)) return
        set((s) => ({ povSeen: addUnique(s.povSeen, key), xp: s.xp + XP.povOpened }))
      },

      markBranchSeen: (tacticId, branchId) => {
        const key = `${tacticId}:${branchId}`
        if (get().branchesSeen.includes(key)) return
        set((s) => ({
          branchesSeen: addUnique(s.branchesSeen, key),
          xp: s.xp + XP.branchExplored,
        }))
      },

      recordScenario: (scenarioId, correct, cue) => {
        if (correct) {
          if (!get().scenariosCorrect.includes(scenarioId)) {
            set((s) => ({
              scenariosCorrect: addUnique(s.scenariosCorrect, scenarioId),
              xp: s.xp + XP.quizScenarioCorrect,
            }))
          }
        } else if (cue) {
          // Isyarat yang terlewat dicatat agar rekomendasi pelajaran bisa
          // menunjuk ke konsep yang benar (PRD §12 Alur 3 langkah 6).
          set((s) => ({ missedCues: { ...s.missedCues, [cue]: (s.missedCues[cue] ?? 0) + 1 } }))
        }
      },

      toggleCollection: (id, kind) => {
        const exists = get().collection.some((c) => c.id === id && c.kind === kind)
        if (exists) {
          set((s) => ({ collection: s.collection.filter((c) => !(c.id === id && c.kind === kind)) }))
          return
        }
        set((s) => ({
          collection: [...s.collection, { id, kind, at: new Date().toISOString() }],
          xp: s.xp + XP.collectionSaved,
        }))
        track({ name: 'collection_saved', item_id: id, kind })
      },

      dismissSignupPrompt: () => set({ dismissedSignupPrompt: true }),

      setLastVisited: (item) => set({ lastVisited: { ...item, at: new Date().toISOString() } }),

      awardBadges: (ids) => {
        const fresh = ids.filter((id) => !get().badges.includes(id))
        if (fresh.length === 0) return
        set((s) => ({ badges: [...s.badges, ...fresh] }))
      },

      touchStreak: () => {
        const today = dayKey()
        const last = get().lastActiveDay
        if (last === today) return

        const gap = last ? daysBetween(last, today) : Number.POSITIVE_INFINITY
        const streak = gap === 1 ? get().streak + 1 : 1
        set((s) => ({
          streak,
          bestStreak: Math.max(s.bestStreak, streak),
          lastActiveDay: today,
          xp: s.xp + XP.streakDay,
        }))
      },

      resetAll: () => set({ ...EMPTY }),
    }),
    {
      name: 'progress',
      storage: createJSONStorage(() => zustandStorage),
      version: 1,
    },
  ),
)

/* -------------------------------------------------------------------------- */
/* Selektor turunan                                                           */
/* -------------------------------------------------------------------------- */

export function lessonStatus(s: ProgressState, lessonId: string): Exclude<ItemStatus, 'locked'> {
  return s.lessons[lessonId]?.status ?? 'available'
}

export function isInCollection(
  s: ProgressState,
  id: string,
  kind: 'tactic' | 'lesson' | 'term',
): boolean {
  return s.collection.some((c) => c.id === id && c.kind === kind)
}

/** Nilai terbaik sebuah kuis modul, atau null bila belum pernah dicoba. */
export function bestModuleScore(s: ProgressState, moduleCode: string): number | null {
  const attempts = s.moduleQuizzes[moduleCode]
  if (!attempts || attempts.length === 0) return null
  return Math.max(...attempts.map((a) => a.score))
}

/**
 * Kenaikan skor kuis dari percobaan pertama ke ketiga — metrik Pembelajaran
 * utama PRD §16 ("Kenaikan skor kuis", target >= 25 poin persentase).
 */
export function quizImprovement(s: ProgressState, tacticId: string): number | null {
  const attempts = s.tacticQuizzes[tacticId]
  if (!attempts || attempts.length < 3) return null
  return (attempts[2] as QuizAttempt).score - (attempts[0] as QuizAttempt).score
}

/** Susun masukan evaluasi lencana dari progres. */
export function badgeInput(
  s: ProgressState,
  opts: { level1Done: boolean; level2Done: boolean },
): BadgeInput {
  const povByNumber: Record<string, number> = {}
  for (const key of s.povSeen) {
    const number = key.slice(-1)
    povByNumber[number] = (povByNumber[number] ?? 0) + 1
  }

  const coveragesSeen = new Set(
    s.branchesSeen.filter((k) => k.includes(':b-cov-')).map((k) => k.split(':')[1]),
  ).size

  const defenseLensesSeen = s.povSeen.filter((k) => k.includes(':X')).length

  return {
    lessonsCompleted: Object.values(s.lessons).filter((l) => l.status === 'done').length,
    level1Done: opts.level1Done,
    level2Done: opts.level2Done,
    perfectQuiz: Object.values(s.moduleQuizzes).some((a) => a.some((x) => x.score >= 100)),
    tacticsWatchedFull: s.tacticsWatched.length,
    branchesExplored: s.branchesSeen.length,
    quizCorrect: s.scenariosCorrect.length,
    povByNumber,
    coveragesSeen,
    defenseLensesSeen,
    streak: s.streak,
  }
}

/** Lencana yang layak didapat tetapi belum tercatat. */
export function newlyEarnedBadges(
  s: ProgressState,
  opts: { level1Done: boolean; level2Done: boolean },
): string[] {
  return earnedBadges(badgeInput(s, opts)).filter((b) => !s.badges.includes(b))
}
