'use client'

/**
 * Penjawab soal pilihan ganda — dipakai cek pemahaman pelajaran (F-06) dan kuis
 * modul (F-07).
 *
 * Umpan balik A-17: benar = denyut hijau, salah = getar horizontal + penanda
 * jawaban benar. Penjelasan selalu tampil setelah menjawab, benar atau salah.
 */

import { useState } from 'react'

import type { CheckQuestion } from '@/lib/learning'
import { Icon, PillButton, ProgressBar, RichText, cx } from '@/components/ui'

export function QuestionRunner({
  questions,
  onDone,
  finishLabel = 'Selesai',
}: {
  questions: CheckQuestion[]
  /** Dipanggil sekali setelah soal terakhir dijawab */
  onDone: (correct: number) => void
  finishLabel?: string
}) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)

  const q = questions[index]
  if (!q) return null

  const answered = picked !== null
  const isRight = picked === q.answer
  const last = index === questions.length - 1

  const pick = (id: string) => {
    if (answered) return
    setPicked(id)
    if (id === q.answer) setCorrect((c) => c + 1)
  }

  const next = () => {
    if (last) {
      onDone(correct)
      return
    }
    setIndex(index + 1)
    setPicked(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <p className="hud shrink-0 text-xs text-[var(--text-secondary)]">
          Soal {index + 1}/{questions.length}
        </p>
        <ProgressBar
          value={index + (answered ? 1 : 0)}
          max={questions.length}
          label={`Soal ${index + 1} dari ${questions.length}`}
        />
      </div>

      <h2 className="text-lg font-semibold leading-snug text-[var(--text-primary)]">
        <RichText text={q.prompt} />
      </h2>

      <ul className="flex flex-col gap-2" key={q.id}>
        {q.options.map((o) => {
          const chosen = picked === o.id
          const isAnswer = o.id === q.answer
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => pick(o.id)}
                disabled={answered}
                aria-pressed={chosen}
                className={cx(
                  'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm leading-relaxed transition-all duration-fast',
                  !answered &&
                    'border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[color-mix(in_srgb,var(--team-offense)_50%,transparent)]',
                  answered && isAnswer &&
                    'border-[var(--state-success)] bg-[color-mix(in_srgb,var(--state-success)_12%,transparent)] text-[var(--text-primary)]',
                  answered && chosen && !isAnswer &&
                    'animate-shake-x border-[var(--state-error)] bg-[color-mix(in_srgb,var(--state-error)_12%,transparent)] text-[var(--text-primary)]',
                  answered && !chosen && !isAnswer &&
                    'border-[var(--glass-border)] text-[var(--text-secondary)] opacity-60',
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {answered && isAnswer ? (
                    <Icon.Check size={16} className="text-[var(--state-success)]" />
                  ) : answered && chosen ? (
                    <Icon.Close size={16} className="text-[var(--state-error)]" />
                  ) : (
                    <span className="block h-4 w-4 rounded-full border border-[var(--glass-border)]" />
                  )}
                </span>
                <span>{o.text}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {answered && (
        <div
          role="status"
          className="flex animate-rise-in flex-col gap-3 rounded-xl p-3.5"
          style={{
            background: `color-mix(in srgb, ${isRight ? 'var(--state-success)' : 'var(--state-error)'} 10%, transparent)`,
            borderLeft: `2px solid ${isRight ? 'var(--state-success)' : 'var(--state-error)'}`,
          }}
        >
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {isRight ? 'Benar!' : 'Belum tepat.'}
          </p>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{q.explain}</p>
          <PillButton onClick={next} className="self-start" icon={<Icon.ChevronRight size={16} />}>
            {last ? finishLabel : 'Soal berikutnya'}
          </PillButton>
        </div>
      )}
    </div>
  )
}
