'use client'

/**
 * S-05 Pemutar Pelajaran — F-06.
 *
 * PRD §8 F-06: "Langkah berurutan: animasi, teks ringkas, soal cek pemahaman."
 * PRD §4: "Setiap pelajaran = animasi utama + teks ringkas + 1-3 soal cek."
 *
 * Langkah disusun dari data yang sudah ada:
 *   1. Konsep    — ringkasan pelajaran + animasi utama (klip istilah pertama)
 *   2. Istilah   — satu langkah per istilah yang diperkenalkan (maks. 3)
 *   3. Cek       — soal dari glosarium (lihat src/lib/learning.ts)
 *   4. Hasil     — XP, pelajaran berikutnya, ajakan daftar setelah 3 pelajaran
 */

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { ModuleNode } from '@content/curriculum'
import type { GlossaryTerm } from '@content/glossary'
import {
  lessonHref,
  lessonQuestions,
  lessonTerms,
  moduleHref,
  moduleTerms,
  nextReadyLessonAfter,
  type Lesson,
} from '@/lib/learning'
import { XP } from '@/lib/xp'
import { xpLabel } from '@/lib/format'
import { useProgress } from '@/stores/progressStore'
import { Chip, GlassPanel, Icon, LinkButton, PillButton, cx } from '@/components/ui'
import { TermClip } from '@/components/glossary/TermClip'
import { QuestionRunner } from './QuestionRunner'

type StepDef =
  | { kind: 'concept' }
  | { kind: 'term'; term: GlossaryTerm }
  | { kind: 'check' }
  | { kind: 'result' }

/** Ajakan daftar muncul setelah pelajaran ke-3 (PRD §8 F-03, §12 Alur 1 langkah 7). */
const SIGNUP_PROMPT_AFTER = 3

export function LessonPlayer({ lesson, module: m }: { lesson: Lesson; module: ModuleNode }) {
  const startLesson = useProgress((s) => s.startLesson)
  const completeLesson = useProgress((s) => s.completeLesson)
  const setLastVisited = useProgress((s) => s.setLastVisited)
  const alreadyDone = useProgress((s) => s.lessons[lesson.id]?.status === 'done')

  const terms = useMemo(() => lessonTerms(lesson).slice(0, 3), [lesson])
  const questions = useMemo(() => lessonQuestions(lesson), [lesson])

  // Animasi utama: klip istilah pelajaran, atau istilah lain di modul yang sama.
  const mainClip = useMemo(() => {
    const own = terms.find((t) => t.clip)
    if (own) return own
    return moduleTerms(lesson.moduleCode).find((t) => t.clip) ?? null
  }, [terms, lesson.moduleCode])

  const steps = useMemo<StepDef[]>(
    () => [
      { kind: 'concept' },
      ...terms.map((term) => ({ kind: 'term' as const, term })),
      ...(questions.length > 0 ? [{ kind: 'check' as const }] : []),
      { kind: 'result' },
    ],
    [terms, questions.length],
  )

  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<{ correct: number; gained: number } | null>(null)
  const step = steps[index] ?? steps[0]!

  const started = useRef(false)
  useEffect(() => {
    if (started.current || lesson.status !== 'ready') return
    started.current = true
    startLesson(lesson.id, lesson.level)
    setLastVisited({ kind: 'lesson', id: lesson.id, title: lesson.title, href: lessonHref(lesson) })
  }, [lesson, setLastVisited, startLesson])

  const finish = (correct: number) => {
    const before = useProgress.getState().xp
    completeLesson(lesson.id, lesson.level, correct, questions.length)
    const gained = useProgress.getState().xp - before
    setResult({ correct, gained })
    setIndex(steps.length - 1)
  }

  const next = nextReadyLessonAfter(lesson.id)

  if (lesson.status === 'soon') {
    return (
      <Shell lesson={lesson} module={m}>
        <GlassPanel className="flex flex-col gap-3 p-6">
          <span className="self-start">
            <Chip>Segera hadir</Chip>
          </span>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">{lesson.title}</h1>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{lesson.blurb}</p>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Isi pelajaran ini sedang diproduksi bersama pelatih peninjau. Sementara itu, lanjutkan ke
            pelajaran lain yang sudah tersedia.
          </p>
          <div className="flex flex-wrap gap-2">
            {next && (
              <LinkButton href={lessonHref(next)} icon={<Icon.Play size={15} />}>
                {next.title}
              </LinkButton>
            )}
            <LinkButton href={moduleHref(m)} variant="outline">
              Kembali ke modul
            </LinkButton>
          </div>
        </GlassPanel>
      </Shell>
    )
  }

  return (
    <Shell lesson={lesson} module={m}>
      {/* Indikator langkah */}
      <ol className="flex items-center gap-1.5" aria-label="Langkah pelajaran">
        {steps.map((s, i) => (
          <li
            key={i}
            aria-current={i === index ? 'step' : undefined}
            className="h-1 flex-1 rounded-full transition-colors duration-base"
            style={{
              background:
                i < index
                  ? 'var(--team-offense)'
                  : i === index
                    ? 'color-mix(in srgb, var(--team-offense) 55%, transparent)'
                    : 'color-mix(in srgb, var(--text-primary) 12%, transparent)',
            }}
          >
            <span className="sr-only">
              {s.kind === 'concept'
                ? 'Konsep'
                : s.kind === 'term'
                  ? `Istilah ${s.term.term}`
                  : s.kind === 'check'
                    ? 'Cek pemahaman'
                    : 'Hasil'}
            </span>
          </li>
        ))}
      </ol>

      <div key={index} className="animate-slide-label">
        {step.kind === 'concept' && (
          <div className="grid gap-5 desktop:grid-cols-[1.1fr_1fr]">
            <div className="order-2 flex flex-col gap-3 desktop:order-1">
              <p className="hud text-xs text-[var(--team-offense)]">
                Modul {m.code} · {lesson.minutes} menit
              </p>
              <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">{lesson.title}</h1>
              <p className="text-base leading-relaxed text-[var(--text-primary)]">{lesson.blurb}</p>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                <span className="text-[var(--text-primary)]">Yang divisualkan di modul ini:</span>{' '}
                {m.keyVisual}
              </p>
              {terms.length > 0 && (
                <p className="text-sm text-[var(--text-secondary)]">
                  Istilah baru:{' '}
                  {terms.map((t, i) => (
                    <span key={t.id}>
                      <em className="text-[var(--text-primary)]">{t.term}</em>
                      {i < terms.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              )}
            </div>
            <div className="order-1 desktop:order-2">
              {mainClip?.clip ? (
                <TermClip clip={mainClip.clip} label={mainClip.term} />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-[var(--glass-border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                  Animasi khusus pelajaran ini sedang diproduksi.
                </div>
              )}
            </div>
          </div>
        )}

        {step.kind === 'term' && (
          <div className="grid gap-5 desktop:grid-cols-[1.1fr_1fr]">
            <div className="order-2 flex flex-col gap-3 desktop:order-1">
              <p className="hud text-xs text-[var(--team-offense)]">Istilah</p>
              <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                <em className="not-italic">{step.term.term}</em>
              </h2>
              {step.term.padanan && (
                <p className="text-sm italic text-[var(--text-secondary)]">{step.term.padanan}</p>
              )}
              <p className="text-base leading-relaxed text-[var(--text-primary)]">{step.term.short}</p>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{step.term.long}</p>
              <Link
                href={`/glosarium#${step.term.id}`}
                className="inline-flex items-center gap-1 self-start text-xs font-medium text-[var(--team-offense)] hover:opacity-80"
              >
                Lihat di glosarium <Icon.ChevronRight size={13} />
              </Link>
            </div>
            <div className="order-1 desktop:order-2">
              {step.term.clip ? (
                <TermClip clip={step.term.clip} label={step.term.term} />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-[var(--glass-border)] p-6 text-center text-sm text-[var(--text-secondary)]">
                  Mini-animasi istilah ini sedang diproduksi.
                </div>
              )}
            </div>
          </div>
        )}

        {step.kind === 'check' && (
          <div className="mx-auto w-full max-w-2xl">
            <p className="hud mb-3 text-xs text-[var(--team-offense)]">Cek pemahaman</p>
            <QuestionRunner questions={questions} onDone={finish} finishLabel="Selesaikan pelajaran" />
          </div>
        )}

        {step.kind === 'result' && (
          <ResultPanel
            lesson={lesson}
            module={m}
            result={result}
            alreadyDone={alreadyDone && !result}
            questionCount={questions.length}
            nextLesson={next}
          />
        )}
      </div>

      {/* Navigasi langkah — langkah cek dan hasil punya tombolnya sendiri */}
      {(step.kind === 'concept' || step.kind === 'term') && (
        <div className="flex items-center gap-2 border-t border-[var(--glass-border)] pt-4">
          <PillButton
            variant="ghost"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            Sebelumnya
          </PillButton>
          <div className="ml-auto">
            {steps[index + 1]?.kind === 'result' ? (
              <PillButton onClick={() => finish(0)} icon={<Icon.Check size={16} />}>
                Selesaikan pelajaran
              </PillButton>
            ) : (
              <PillButton onClick={() => setIndex((i) => i + 1)} icon={<Icon.ChevronRight size={16} />}>
                {steps[index + 1]?.kind === 'check' ? 'Cek pemahaman' : 'Lanjut'}
              </PillButton>
            )}
          </div>
        </div>
      )}
    </Shell>
  )
}

function Shell({
  lesson,
  module: m,
  children,
}: {
  lesson: Lesson
  module: ModuleNode
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 p-4 tablet:p-6">
      <nav aria-label="Remah roti" className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-secondary)]">
        <Link href="/belajar" className="hover:text-[var(--text-primary)]">
          Peta Jalur Belajar
        </Link>
        <Icon.ChevronRight size={12} />
        <Link href={moduleHref(m)} className="hover:text-[var(--text-primary)]">
          Modul {m.code} · {m.title}
        </Link>
        <Icon.ChevronRight size={12} />
        <span className="text-[var(--text-primary)]">{lesson.title}</span>
      </nav>
      {children}
    </div>
  )
}

function ResultPanel({
  lesson,
  module: m,
  result,
  alreadyDone,
  questionCount,
  nextLesson,
}: {
  lesson: Lesson
  module: ModuleNode
  result: { correct: number; gained: number } | null
  alreadyDone: boolean
  questionCount: number
  nextLesson: Lesson | null
}) {
  const lessonsBeforeAccount = useProgress((s) => s.lessonsBeforeAccount)
  const dismissed = useProgress((s) => s.dismissedSignupPrompt)
  const dismiss = useProgress((s) => s.dismissSignupPrompt)
  const showSignup = !dismissed && lessonsBeforeAccount >= SIGNUP_PROMPT_AFTER

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <GlassPanel className="flex flex-col items-center gap-3 p-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--state-success)_18%,transparent)] text-[var(--state-success)]">
          <Icon.Check size={28} />
        </span>
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Pelajaran selesai</h2>
        <p className="text-sm text-[var(--text-secondary)]">{lesson.title}</p>
        {result && questionCount > 0 && (
          <p className="hud text-sm text-[var(--text-primary)]">
            Cek pemahaman: {result.correct}/{questionCount} benar
          </p>
        )}
        {result && result.gained > 0 ? (
          <p className="hud animate-count-flash text-2xl font-bold text-[var(--ball)]">
            +{xpLabel(result.gained)}
          </p>
        ) : (
          (alreadyDone || (result && result.gained === 0)) && (
            <p className="text-xs text-[var(--text-secondary)]">
              Pelajaran ini sudah pernah kamu selesaikan, jadi XP tidak dihitung ulang. (Baru:{' '}
              {xpLabel(XP.lessonComplete)} + {XP.lessonCheckCorrect} per jawaban benar.)
            </p>
          )
        )}
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {nextLesson ? (
            <LinkButton href={lessonHref(nextLesson)} icon={<Icon.Play size={15} />}>
              Berikutnya: {nextLesson.title}
            </LinkButton>
          ) : (
            <LinkButton href="/taktik" icon={<Icon.Court size={15} />}>
              Lanjut ke Perpustakaan Taktik
            </LinkButton>
          )}
          <LinkButton href={moduleHref(m)} variant="outline">
            Kembali ke modul
          </LinkButton>
        </div>
      </GlassPanel>

      {showSignup && (
        <div
          className={cx('glass-flat flex flex-col gap-2 p-4')}
          style={{ borderLeft: '2px solid var(--ball)' }}
        >
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Kamu sudah menyelesaikan {lessonsBeforeAccount} pelajaran
          </p>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Progresmu tersimpan di perangkat ini. Membuat akun akan menyinkronkannya ke perangkat lain —
            fitur akun (email/Google) belum aktif di versi ini, jadi untuk sekarang jangan hapus data
            browser agar progres tidak hilang.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="self-start text-xs font-medium text-[var(--team-offense)] hover:opacity-80"
          >
            Mengerti, jangan tampilkan lagi
          </button>
        </div>
      )}
    </div>
  )
}
