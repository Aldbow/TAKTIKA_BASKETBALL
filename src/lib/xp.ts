/**
 * XP & lencana — F-25: "XP per aktivitas, lencana per level dan per posisi
 * (misalnya 'Master POV Center')."
 *
 * Aturannya sengaja sederhana dan dapat dijelaskan: pengguna harus bisa menebak
 * berapa XP yang didapat sebelum melakukan aksinya. Sistem poin yang tidak bisa
 * diprediksi berhenti terasa seperti hadiah.
 */

import { ROLE_LABEL, type Role } from '@/engine'

export const XP = {
  lessonComplete: 20,
  lessonCheckCorrect: 5,
  moduleQuizPassed: 50,
  tacticWatchedFull: 15,
  povOpened: 10,
  branchExplored: 8,
  quizScenarioCorrect: 12,
  quizCompleted: 40,
  collectionSaved: 3,
  streakDay: 10,
} as const

/** XP yang dibutuhkan untuk mencapai sebuah tingkat profil. */
export function xpForProfileLevel(level: number): number {
  // Pertumbuhan kuadratik ringan: 0, 150, 400, 750, 1200, ...
  return Math.round(50 * level * (level + 1))
}

export function profileLevelFromXp(xp: number): { level: number; into: number; need: number } {
  let level = 0
  while (xpForProfileLevel(level + 1) <= xp) level++
  const base = xpForProfileLevel(level)
  const next = xpForProfileLevel(level + 1)
  return { level, into: xp - base, need: next - base }
}

/* -------------------------------------------------------------------------- */
/* Lencana                                                                    */
/* -------------------------------------------------------------------------- */

export type BadgeKind = 'level' | 'position' | 'skill' | 'streak'

export interface BadgeDef {
  id: string
  kind: BadgeKind
  title: string
  /** Satu kalimat: apa yang harus dilakukan untuk mendapatkannya */
  requirement: string
  emoji: string
}

/** Lencana per posisi — "Master POV Center" dan empat saudaranya (F-25). */
function povBadge(role: Role, number: string): BadgeDef {
  return {
    id: `pov-master-${role.toLowerCase()}`,
    kind: 'position',
    title: `Master POV ${ROLE_LABEL[role]}`,
    requirement: `Buka lensa POV posisi ${number} di 5 taktik berbeda.`,
    emoji: '🎯',
  }
}

export const BADGES: BadgeDef[] = [
  {
    id: 'first-lesson',
    kind: 'level',
    title: 'Langkah Pertama',
    requirement: 'Selesaikan satu pelajaran.',
    emoji: '👟',
  },
  {
    id: 'level-1-complete',
    kind: 'level',
    title: 'Fondasi Kokoh',
    requirement: 'Selesaikan semua pelajaran Level 1 yang tersedia.',
    emoji: '🧱',
  },
  {
    id: 'level-2-complete',
    kind: 'level',
    title: 'Pembaca Permainan',
    requirement: 'Selesaikan semua pelajaran Level 2 yang tersedia.',
    emoji: '🧠',
  },
  {
    id: 'module-perfect',
    kind: 'skill',
    title: 'Nilai Sempurna',
    requirement: 'Dapatkan 100% pada satu kuis modul.',
    emoji: '💯',
  },
  {
    id: 'tactic-explorer',
    kind: 'skill',
    title: 'Penjelajah Taktik',
    requirement: 'Tonton 5 taktik sampai selesai.',
    emoji: '🗺️',
  },
  {
    id: 'branch-scientist',
    kind: 'skill',
    title: 'Ilmuwan Cabang',
    requirement: 'Coba 10 cabang "Bagaimana jika" yang berbeda.',
    emoji: '🔬',
  },
  {
    id: 'read-and-react',
    kind: 'skill',
    title: 'Baca & Bereaksi',
    requirement: 'Jawab benar 10 skenario kuis.',
    emoji: '⚡',
  },
  {
    id: 'coverage-expert',
    kind: 'skill',
    title: 'Ahli Coverage',
    requirement: 'Lihat keenam coverage pick-and-roll di Spread Pick-and-Roll.',
    emoji: '🛡️',
  },
  {
    id: 'defense-minded',
    kind: 'skill',
    title: 'Berpikir Bertahan',
    requirement: 'Buka kelima lensa X1-X5 pada satu taktik bertahan.',
    emoji: '🧤',
  },
  povBadge('PG', '1'),
  povBadge('SG', '2'),
  povBadge('SF', '3'),
  povBadge('PF', '4'),
  povBadge('C', '5'),
  {
    id: 'streak-3',
    kind: 'streak',
    title: 'Tiga Hari Berturut',
    requirement: 'Belajar tiga hari berturut-turut.',
    emoji: '🔥',
  },
  {
    id: 'streak-7',
    kind: 'streak',
    title: 'Satu Minggu Penuh',
    requirement: 'Belajar tujuh hari berturut-turut.',
    emoji: '🏅',
  },
]

export function findBadge(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id)
}

/* -------------------------------------------------------------------------- */
/* Evaluasi lencana                                                           */
/* -------------------------------------------------------------------------- */

/** Potret progres yang dibutuhkan untuk mengevaluasi lencana. */
export interface BadgeInput {
  lessonsCompleted: number
  level1Done: boolean
  level2Done: boolean
  perfectQuiz: boolean
  tacticsWatchedFull: number
  branchesExplored: number
  quizCorrect: number
  /** Jumlah taktik berbeda tempat POV posisi ini dibuka */
  povByNumber: Record<string, number>
  coveragesSeen: number
  defenseLensesSeen: number
  streak: number
}

/** Semua lencana yang sudah layak didapat dari potret progres. */
export function earnedBadges(p: BadgeInput): string[] {
  const out: string[] = []
  if (p.lessonsCompleted >= 1) out.push('first-lesson')
  if (p.level1Done) out.push('level-1-complete')
  if (p.level2Done) out.push('level-2-complete')
  if (p.perfectQuiz) out.push('module-perfect')
  if (p.tacticsWatchedFull >= 5) out.push('tactic-explorer')
  if (p.branchesExplored >= 10) out.push('branch-scientist')
  if (p.quizCorrect >= 10) out.push('read-and-react')
  if (p.coveragesSeen >= 6) out.push('coverage-expert')
  if (p.defenseLensesSeen >= 5) out.push('defense-minded')
  if (p.streak >= 3) out.push('streak-3')
  if (p.streak >= 7) out.push('streak-7')

  const roleByNumber: Record<string, Role> = { '1': 'PG', '2': 'SG', '3': 'SF', '4': 'PF', '5': 'C' }
  for (const [number, role] of Object.entries(roleByNumber)) {
    if ((p.povByNumber[number] ?? 0) >= 5) out.push(`pov-master-${role.toLowerCase()}`)
  }
  return out
}
