'use client'

/**
 * Kuis modul — F-07: "Kuis 5 soal per modul; lencana saat lulus >= 80%."
 */

import Link from 'next/link'
import { useState } from 'react'

import type { ModuleNode } from '@content/curriculum'
import { MODULE_PASS_SCORE, moduleHref, type CheckQuestion } from '@/lib/learning'
import { XP } from '@/lib/xp'
import { bestModuleScore, useProgress } from '@/stores/progressStore'
import { GlassPanel, Icon, LinkButton, PillButton } from '@/components/ui'
import { QuestionRunner } from './QuestionRunner'

export function ModuleQuiz({
  module: m,
  questions,
}: {
  module: ModuleNode
  questions: CheckQuestion[]
}) {
  const recordModuleQuiz = useProgress((s) => s.recordModuleQuiz)
  const best = useProgress((s) => bestModuleScore(s, m.code))
  const [attempt, setAttempt] = useState(0)
  const [score, setScore] = useState<number | null>(null)
  const [passedBefore, setPassedBefore] = useState(false)

  const done = (correct: number) => {
    const s = Math.round((correct / questions.length) * 100)
    setPassedBefore((best ?? 0) >= MODULE_PASS_SCORE)
    recordModuleQuiz(m.code, s)
    setScore(s)
  }

  const passed = score !== null && score >= MODULE_PASS_SCORE

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 tablet:p-6">
      <nav aria-label="Remah roti" className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
        <Link href={moduleHref(m)} className="hover:text-[var(--text-primary)]">
          Modul {m.code} · {m.title}
        </Link>
        <Icon.ChevronRight size={12} />
        <span className="text-[var(--text-primary)]">Kuis modul</span>
      </nav>

      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Kuis modul {m.code}</h1>

      {score === null ? (
        <QuestionRunner
          key={attempt}
          questions={questions}
          onDone={done}
          finishLabel="Lihat nilai"
        />
      ) : (
        <GlassPanel className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="hud text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Nilai</p>
          <p
            className="hud animate-count-flash text-4xl font-bold"
            style={{ color: passed ? 'var(--state-success)' : 'var(--ball)' }}
          >
            {score}%
          </p>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {passed
              ? passedBefore
                ? 'Lulus lagi. XP kelulusan hanya diberikan pada kelulusan pertama.'
                : `Lulus! +${XP.moduleQuizPassed} XP kelulusan modul.`
              : `Butuh ${MODULE_PASS_SCORE}% untuk lulus. Ulangi pelajaran modul ini, lalu coba lagi.`}
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <PillButton
              variant="outline"
              onClick={() => {
                setScore(null)
                setAttempt((a) => a + 1)
              }}
              icon={<Icon.Replay size={15} />}
            >
              Ulangi kuis
            </PillButton>
            <LinkButton href={moduleHref(m)}>Kembali ke modul</LinkButton>
          </div>
        </GlassPanel>
      )}
    </div>
  )
}
