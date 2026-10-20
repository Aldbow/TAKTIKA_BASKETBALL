/**
 * Penyusun skenario kuis Baca & Bereaksi — F-18.
 *
 * Menggabungkan skenario dari JSON taktik dengan kunci jawaban di
 * content/quizzes/read-react.ts menjadi satu bentuk yang siap diputar.
 */

import { SCENARIO_KEYS } from '@content/quizzes/read-react'

import {
  normalizeActiveBranches,
  t as localize,
  type Branch,
  type Decision,
  type DecisionOption,
  type Scenario,
  type Tactic,
} from '@/engine/runtime'

export interface ResolvedScenario {
  scenario: Scenario
  decision: Decision
  prompt: string
  answer: DecisionOption
  /** Cabang yang membentuk situasi sebelum lapangan membeku */
  setupBranches: string[]
  /** Detik mulai pemutaran: beberapa detik sebelum jeda, untuk konteks */
  playFrom: number
}

/** Berapa detik sebelum titik jeda animasi mulai diputar. */
const LEAD_IN = 3.5

export function resolveScenarios(tactic: Tactic): ResolvedScenario[] {
  const keys = SCENARIO_KEYS[tactic.id] ?? {}
  const out: ResolvedScenario[] = []

  for (const scenario of tactic.scenarios) {
    const decision = tactic.decisions.find((d) => d.id === scenario.decisionId)
    if (!decision) continue
    const key = keys[scenario.id]
    const answer =
      (key && decision.options.find((o) => o.id === key.answer)) ??
      decision.options.find((o) => o.correct) ??
      decision.options[0]
    if (!answer) continue

    out.push({
      scenario,
      decision,
      prompt: key?.prompt ?? localize(scenario.prompt),
      answer,
      setupBranches: normalizeActiveBranches(tactic, scenario.setupBranches),
      playFrom: Math.max(0, scenario.pauseAt - LEAD_IN),
    })
  }
  return out
}

/**
 * Penjelasan yang ditampilkan setelah menjawab. Kriteria penerimaan F-18:
 * "jawaban salah selalu disertai penjelasan isyarat yang terlewat".
 */
export function explanationFor(
  tactic: Tactic,
  resolved: ResolvedScenario,
  chosen: DecisionOption | null,
): string {
  const key = SCENARIO_KEYS[tactic.id]?.[resolved.scenario.id]
  if (key?.explain) return key.explain
  if (chosen && chosen.id !== resolved.answer.id) return localize(chosen.explain)
  return localize(resolved.answer.explain)
}

/**
 * Cabang yang diputar setelah pengguna memilih opsi: cabang situasi tetap,
 * kecuali yang segrup dengan cabang hasil pilihan (satu cabang aktif per grup).
 */
export function branchesAfterChoice(
  tactic: Tactic,
  setup: readonly string[],
  option: DecisionOption | null,
): string[] {
  if (!option?.branchId) return [...setup]
  const chosen = tactic.branches.find((b) => b.id === option.branchId)
  const group = chosen?.group ?? ''
  const kept = setup.filter((id) => {
    const b = tactic.branches.find((x) => x.id === id)
    return (b?.group ?? '') !== group
  })
  return normalizeActiveBranches(tactic, [...kept, option.branchId])
}

/** Label hasil akhir cabang — dipakai untuk "memperlihatkan akibatnya". */
export const OUTCOME_LABEL: Record<NonNullable<Branch['outcome']>, string> = {
  score: 'Mencetak angka',
  'good-look': 'Tembakan terbuka',
  contested: 'Tembakan dijaga ketat',
  turnover: 'Bola hilang',
  reset: 'Serangan diatur ulang',
}

export function outcomeOf(tactic: Tactic, option: DecisionOption | null): string | null {
  if (!option?.branchId) return null
  const b = tactic.branches.find((x) => x.id === option.branchId)
  return b?.outcome ? OUTCOME_LABEL[b.outcome] : null
}
