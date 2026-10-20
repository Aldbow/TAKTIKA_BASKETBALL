'use client'

/**
 * Halaman modul — daftar pelajaran sebuah modul beserta kuis modulnya (F-07).
 * Modul Level 3 adalah kategori Perpustakaan Taktik, jadi isinya kartu taktik.
 */

import Link from 'next/link'

import type { ModuleNode } from '@content/curriculum'
import { CATEGORY_TOKEN, t as localize, type Tactic } from '@/engine/runtime'
import {
  MODULE_PASS_SCORE,
  lessonHref,
  lessonsOfModule,
  levelOfModule,
  moduleProgress,
  moduleQuiz,
} from '@/lib/learning'
import { bestModuleScore, useProgress } from '@/stores/progressStore'
import { Chip, Icon, LevelMeter, LinkButton, ProgressBar, cx } from '@/components/ui'

export function ModuleView({ module: m, tactics }: { module: ModuleNode; tactics: Tactic[] }) {
  const lessons = useProgress((s) => s.lessons)
  const best = useProgress((s) => bestModuleScore(s, m.code))
  const level = levelOfModule(m.code)
  const list = lessonsOfModule(m.code)
  const p = moduleProgress(lessons, m.code)
  const quiz = moduleQuiz(m.code)

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-5 p-4 tablet:p-6">
      <nav aria-label="Remah roti" className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
        <Link href="/belajar" className="hover:text-[var(--text-primary)]">
          Peta Jalur Belajar
        </Link>
        <Icon.ChevronRight size={12} />
        <span>Level {level}</span>
      </nav>

      <header className="flex flex-col gap-2">
        <p className="hud text-xs text-[var(--team-offense)]">Modul {m.code}</p>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">{m.title}</h1>
        <p className="max-w-[65ch] text-sm leading-relaxed text-[var(--text-secondary)]">
          <span className="text-[var(--text-primary)]">Visualisasi kunci:</span> {m.keyVisual}
        </p>
        {m.requires.length > 0 && (
          <p className="hud text-[11px] text-[var(--text-secondary)]">
            Disarankan setelah modul {m.requires.join(', ')}
          </p>
        )}
      </header>

      {level === 3 ? (
        <section className="flex flex-col gap-3">
          <h2 className="hud text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            Taktik di kategori ini
          </h2>
          {tactics.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--glass-border)] p-6 text-sm text-[var(--text-secondary)]">
              Taktik untuk kategori ini sedang diproduksi.
            </p>
          ) : (
            <ul className="grid gap-3 tablet:grid-cols-2">
              {tactics.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/taktik/${t.slug}`}
                    className="flex h-full flex-col gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-4 transition-colors duration-fast hover:border-[color-mix(in_srgb,var(--team-offense)_45%,transparent)]"
                  >
                    <div className="flex items-center gap-2">
                      <LevelMeter level={t.level} color={CATEGORY_TOKEN[t.category]} />
                      <span className="font-display font-bold text-[var(--text-primary)]">
                        {localize(t.title)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                      {localize(t.summary)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <LinkButton href="/taktik" variant="outline" className="self-start">
            Buka Perpustakaan Taktik
          </LinkButton>
        </section>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <ProgressBar value={p.done} max={p.ready} label={`${p.done} dari ${p.ready} pelajaran selesai`} />
            <span className="hud shrink-0 text-xs text-[var(--text-secondary)]">
              {p.done}/{p.ready} selesai
            </span>
          </div>

          <ol className="flex flex-col gap-2">
            {list.map((l, i) => {
              const soon = l.status === 'soon'
              const status = lessons[l.id]?.status
              const body = (
                <>
                  <span
                    className={cx(
                      'hud flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs',
                      status === 'done'
                        ? 'bg-[color-mix(in_srgb,var(--state-success)_20%,transparent)] text-[var(--state-success)]'
                        : 'bg-[color-mix(in_srgb,var(--text-primary)_7%,transparent)] text-[var(--text-secondary)]',
                    )}
                  >
                    {status === 'done' ? <Icon.Check size={14} /> : soon ? <Icon.Lock size={13} /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[var(--text-primary)]">{l.title}</span>
                    <span className="block text-xs leading-relaxed text-[var(--text-secondary)]">{l.blurb}</span>
                  </span>
                  <span className="hud shrink-0 text-[11px] text-[var(--text-secondary)]">
                    {soon ? 'Segera' : status === 'in-progress' ? 'Sedang' : `${l.minutes} mnt`}
                  </span>
                </>
              )
              return (
                <li key={l.id}>
                  {soon ? (
                    <div
                      className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--glass-border)] p-3 opacity-60"
                      aria-disabled="true"
                    >
                      {body}
                    </div>
                  ) : (
                    <Link
                      href={lessonHref(l)}
                      className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3 transition-colors duration-fast hover:border-[color-mix(in_srgb,var(--team-offense)_45%,transparent)]"
                    >
                      {body}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>

          <section className="glass flex flex-col gap-2 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Kuis modul</h2>
              {best !== null && (
                <Chip color={best >= MODULE_PASS_SCORE ? 'var(--state-success)' : 'var(--ball)'}>
                  Terbaik {best}%
                </Chip>
              )}
            </div>
            {quiz ? (
              <>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {quiz.length} soal dari istilah modul ini. Lulus dengan nilai {MODULE_PASS_SCORE}% atau
                  lebih untuk mendapat XP kelulusan.
                </p>
                <LinkButton href={`/belajar/${m.code}/kuis`} className="self-start" icon={<Icon.Target size={15} />}>
                  {best === null ? 'Mulai kuis' : 'Ulangi kuis'}
                </LinkButton>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Kuis modul ini segera hadir bersama isi pelajarannya.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
