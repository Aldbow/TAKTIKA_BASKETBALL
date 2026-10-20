'use client'

/**
 * Area Latihan — pusat kuis: Baca & Bereaksi per taktik (F-18) dan kuis modul
 * (F-07). Tantangan Posisi (F-19) dan Susun Fase (F-20) adalah P1.
 */

import Link from 'next/link'

import { ALL_MODULES } from '@content/curriculum'
import { CATEGORY_TOKEN, t as localize, type Tactic } from '@/engine/runtime'
import { MODULE_PASS_SCORE, moduleQuiz } from '@/lib/learning'
import { useProgress } from '@/stores/progressStore'
import { Chip, Icon, LevelMeter, SectionLabel } from '@/components/ui'

const QUIZ_MODULES = ALL_MODULES.filter((m) => moduleQuiz(m.code) !== null)

export function PracticeHub({ tactics }: { tactics: Tactic[] }) {
  const tacticQuizzes = useProgress((s) => s.tacticQuizzes)
  const moduleQuizzes = useProgress((s) => s.moduleQuizzes)
  const scenariosCorrect = useProgress((s) => s.scenariosCorrect)

  const totalScenarios = tactics.reduce((n, t) => n + t.scenarios.length, 0)

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 p-4 tablet:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Latihan</h1>
        <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--text-secondary)]">
          Uji keputusanmu. Baca &amp; Bereaksi membekukan lapangan di momen keputusan dan memintamu
          memilih umpan; kuis modul mengulang istilah setiap modul.
        </p>
        <p className="hud text-xs text-[var(--text-secondary)]">
          {scenariosCorrect.length}/{totalScenarios} skenario sudah pernah dijawab benar
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <SectionLabel>Baca &amp; Bereaksi</SectionLabel>
        <ul className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
          {tactics.map((t) => {
            const attempts = tacticQuizzes[t.id] ?? []
            const best = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null
            const last = attempts.at(-1)?.score ?? null
            return (
              <li key={t.id}>
                <Link
                  href={`/taktik/${t.slug}/kuis`}
                  className="group flex h-full flex-col gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-4 transition-colors duration-fast hover:border-[color-mix(in_srgb,var(--ball)_45%,transparent)]"
                >
                  <div className="flex items-center gap-2">
                    <LevelMeter level={t.level} color={CATEGORY_TOKEN[t.category]} />
                    <span className="font-display font-bold text-[var(--text-primary)]">{localize(t.title)}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {t.scenarios.length} skenario · {attempts.length}× dicoba
                  </p>
                  <div className="mt-auto flex items-center gap-2">
                    {best !== null ? (
                      <>
                        <Chip color={best >= 70 ? 'var(--state-success)' : 'var(--ball)'}>Terbaik {best}%</Chip>
                        {last !== null && last !== best && <Chip>Terakhir {last}%</Chip>}
                      </>
                    ) : (
                      <Chip>Belum dicoba</Chip>
                    )}
                    <Icon.ChevronRight
                      size={15}
                      className="ml-auto text-[var(--text-secondary)] transition-transform duration-fast group-hover:translate-x-0.5"
                    />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>Kuis modul</SectionLabel>
        <ul className="grid gap-2 tablet:grid-cols-2 desktop:grid-cols-3">
          {QUIZ_MODULES.map((m) => {
            const attempts = moduleQuizzes[m.code] ?? []
            const best = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null
            return (
              <li key={m.code}>
                <Link
                  href={`/belajar/${m.code}/kuis`}
                  className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3 transition-colors duration-fast hover:border-[color-mix(in_srgb,var(--team-offense)_45%,transparent)]"
                >
                  <span className="hud w-8 shrink-0 text-xs text-[var(--team-offense)]">{m.code}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-primary)]">{m.title}</span>
                  {best !== null ? (
                    <Chip color={best >= MODULE_PASS_SCORE ? 'var(--state-success)' : 'var(--ball)'}>{best}%</Chip>
                  ) : (
                    <Icon.ChevronRight size={14} className="text-[var(--text-secondary)]" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-dashed border-[var(--glass-border)] p-5">
        <SectionLabel>Segera</SectionLabel>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          <span className="text-[var(--text-primary)]">Tantangan Posisi</span> — &ldquo;kamu adalah nomor
          2&rdquo;: gerakkan pemain sepanjang taktik, dinilai dari jalur dan timing.{' '}
          <span className="text-[var(--text-primary)]">Susun Fase</span> — urutkan kembali fase taktik yang
          diacak. Keduanya direncanakan untuk fase 2.
        </p>
      </section>
    </div>
  )
}
