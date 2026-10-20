'use client'

/**
 * S-02 Onboarding — F-01.
 *
 * PRD §8 F-01: "4 langkah: peran (pemain/pelatih/penggemar), posisi favorit,
 * pengalaman, tujuan; membentuk jalur belajar awal."
 * PRD §12 Alur 1 langkah 3: "masing-masing satu ketukan" — memilih kartu
 * langsung maju ke langkah berikutnya, tanpa tombol "Lanjut".
 */

import Link from 'next/link'
import { useState } from 'react'

import { ROLE_LABEL } from '@/engine/runtime'
import { suggestedStart } from '@/lib/learning'
import { useProgress, type OnboardingAnswers } from '@/stores/progressStore'
import { HexMark, Icon, LinkButton, cx } from '@/components/ui'
import { Logomark } from '@/components/nav/AppShell'

type Step = 0 | 1 | 2 | 3 | 4

interface Choice<T extends string> {
  value: T
  title: string
  hint: string
}

const ROLES: Choice<OnboardingAnswers['role']>[] = [
  { value: 'pemain', title: 'Pemain', hint: 'Aku bermain di tim sekolah, klub, atau rutin bermain.' },
  { value: 'pelatih', title: 'Pelatih', hint: 'Aku mengajar taktik ke tim atau ekskul.' },
  { value: 'penggemar', title: 'Penggemar', hint: 'Aku ingin mengerti pertandingan yang kutonton.' },
]

const EXPERIENCE: Choice<OnboardingAnswers['experience']>[] = [
  { value: 'baru', title: 'Baru mengenal basket', hint: 'Mulai dari aturan dan istilah dasar.' },
  { value: 'pemain-rekreasi', title: 'Main untuk rekreasi', hint: 'Sering main 5v5 atau 3x3 bersama teman.' },
  { value: 'kompetisi', title: 'Bermain kompetitif', hint: 'Ikut tim dan kompetisi, sudah kenal set dasar.' },
]

const GOALS: Choice<string>[] = [
  { value: 'paham-aturan', title: 'Mengerti aturan & istilah', hint: 'Tahu kenapa wasit meniup peluit.' },
  { value: 'tugas-posisi', title: 'Paham tugas posisiku', hint: 'Tahu harus ke mana di setiap set tim.' },
  { value: 'iq-basket', title: 'Meningkatkan IQ basket', hint: 'Membaca pertahanan dan memilih umpan yang tepat.' },
  { value: 'mengajar', title: 'Mengajar taktik ke tim', hint: 'Menjelaskan timing tanpa menggambar berulang.' },
]

const POSITIONS: OnboardingAnswers['position'][] = ['PG', 'SG', 'SF', 'PF', 'C']

const STEP_TITLES = [
  'Kamu datang sebagai apa?',
  'Posisi favoritmu?',
  'Seberapa jauh pengalamanmu?',
  'Apa yang ingin kamu capai?',
]

export function Onboarding() {
  const completeOnboarding = useProgress((s) => s.completeOnboarding)
  const [step, setStep] = useState<Step>(0)
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({})

  const choose = <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    if (step < 3) {
      setStep((step + 1) as Step)
      return
    }
    const full = next as OnboardingAnswers
    completeOnboarding(full)
    setStep(4)
  }

  const done = step === 4
  const suggestion = done ? suggestedStart(answers as OnboardingAnswers) : null

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="grid-floor pointer-events-none absolute inset-0" aria-hidden="true" />

      <header className="relative flex items-center gap-3 px-4 py-4 tablet:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="TAKTIKA, halaman awal">
          <Logomark />
          <span className="font-display text-lg font-bold text-[var(--text-primary)]">TAKTIKA</span>
        </Link>
        {!done && (
          <Link
            href="/dashboard"
            className="ml-auto text-sm text-[var(--text-secondary)] transition-colors duration-fast hover:text-[var(--text-primary)]"
          >
            Lewati
          </Link>
        )}
      </header>

      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 pb-10">
        {/* Indikator langkah */}
        <ol className="flex items-center gap-2" aria-label="Langkah onboarding">
          {STEP_TITLES.map((title, i) => (
            <li
              key={title}
              aria-current={i === step ? 'step' : undefined}
              className="h-1.5 flex-1 rounded-full transition-colors duration-base"
              style={{
                background:
                  i < step || done
                    ? 'var(--team-offense)'
                    : i === step
                      ? 'color-mix(in srgb, var(--team-offense) 50%, transparent)'
                      : 'color-mix(in srgb, var(--text-primary) 12%, transparent)',
              }}
            >
              <span className="sr-only">{title}</span>
            </li>
          ))}
        </ol>

        {!done && (
          <div key={step} className="flex animate-slide-label flex-col gap-5">
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as Step)}
                  className="flex touch-target items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  aria-label="Langkah sebelumnya"
                >
                  <Icon.ChevronRight size={18} className="rotate-180" />
                </button>
              )}
              <div>
                <p className="hud text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                  Langkah {step + 1} dari 4
                </p>
                <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                  {STEP_TITLES[step]}
                </h1>
              </div>
            </div>

            {step === 0 && (
              <ChoiceList
                choices={ROLES}
                selected={answers.role}
                onChoose={(v) => choose('role', v)}
              />
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 gap-2.5 xs:grid-cols-2 tablet:grid-cols-5">
                {POSITIONS.map((p, i) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => choose('position', p)}
                    aria-pressed={answers.position === p}
                    className={cx(
                      'flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-base ease-emphasis',
                      answers.position === p
                        ? 'border-[color-mix(in_srgb,var(--team-offense)_60%,transparent)] bg-[color-mix(in_srgb,var(--team-offense)_12%,transparent)]'
                        : 'border-[var(--glass-border)] bg-[var(--bg-surface)] hover:border-[color-mix(in_srgb,var(--team-offense)_40%,transparent)]',
                    )}
                  >
                    <HexMark label={String(i + 1)} active={answers.position === p} />
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{ROLE_LABEL[p]}</span>
                    <span className="hud text-[10px] text-[var(--text-secondary)]">{p}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <ChoiceList
                choices={EXPERIENCE}
                selected={answers.experience}
                onChoose={(v) => choose('experience', v)}
              />
            )}

            {step === 3 && (
              <ChoiceList choices={GOALS} selected={answers.goal} onChoose={(v) => choose('goal', v)} />
            )}
          </div>
        )}

        {done && suggestion && (
          <div className="flex animate-rise-in flex-col gap-5">
            <div>
              <p className="hud text-xs uppercase tracking-[0.16em] text-[var(--state-success)]">
                Jalur belajarmu siap
              </p>
              <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                Titik mulai yang kami sarankan
              </h1>
            </div>
            <div className="glass flex flex-col gap-3 p-5">
              <p className="font-display text-lg font-bold text-[var(--text-primary)]">{suggestion.title}</p>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{suggestion.reason}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <LinkButton href={suggestion.href} size="lg" icon={<Icon.Play size={16} />}>
                  {suggestion.cta}
                </LinkButton>
                <LinkButton href="/dashboard" variant="outline" size="lg">
                  Ke Beranda
                </LinkButton>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              Progres tersimpan di perangkat ini dalam mode tamu. Jawaban bisa diubah kapan saja dari
              halaman Profil.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function ChoiceList<T extends string>({
  choices,
  selected,
  onChoose,
}: {
  choices: Choice<T>[]
  selected: T | undefined
  onChoose: (value: T) => void
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {choices.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChoose(c.value)}
          aria-pressed={selected === c.value}
          className={cx(
            'group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-base ease-emphasis',
            selected === c.value
              ? 'border-[color-mix(in_srgb,var(--team-offense)_60%,transparent)] bg-[color-mix(in_srgb,var(--team-offense)_12%,transparent)] shadow-[0_0_24px_-10px_var(--team-offense)]'
              : 'border-[var(--glass-border)] bg-[var(--bg-surface)] hover:border-[color-mix(in_srgb,var(--team-offense)_40%,transparent)]',
          )}
        >
          <span className="flex-1">
            <span className="block text-base font-semibold text-[var(--text-primary)]">{c.title}</span>
            <span className="block text-sm text-[var(--text-secondary)]">{c.hint}</span>
          </span>
          <Icon.ChevronRight
            size={18}
            className="shrink-0 text-[var(--text-secondary)] transition-transform duration-fast group-hover:translate-x-0.5"
          />
        </button>
      ))}
    </div>
  )
}
