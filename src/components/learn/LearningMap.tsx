'use client'

/**
 * S-04 Peta Jalur Belajar — F-05.
 *
 * PRD §8 F-05: "Grafik simpul 3 level dengan status terkunci, terbuka, sedang,
 * selesai." PRD §11 S-04: "Jalur menyala saat simpul selesai."
 *
 * Pelajaran berstatus "segera" tampil sebagai simpul terkunci yang jelas
 * keterangannya — bukan tautan mati. Prasyarat modul ditampilkan sebagai saran,
 * tidak mengunci: tes penempatan (F-02) yang akan membuka lompatan resmi belum
 * ada, dan mengunci konten tanpa jalan pintas membuat pemain berpengalaman
 * terjebak di Level 1.
 */

import Link from 'next/link'

import type { ModuleNode } from '@content/curriculum'
import {
  CURRICULUM,
  lessonHref,
  levelProgress,
  moduleHref,
  moduleProgress,
  nextUnfinishedLesson,
} from '@/lib/learning'
import { useProgressHydrated } from '@/lib/hydration'
import { bestModuleScore, useProgress } from '@/stores/progressStore'
import { Chip, Icon, LinkButton, ProgressBar, cx } from '@/components/ui'

const LEVEL_COLOR: Record<1 | 2 | 3, string> = {
  1: 'var(--state-success)',
  2: 'var(--team-offense)',
  3: 'var(--action-cut)',
}

export function LearningMap() {
  const lessons = useProgress((s) => s.lessons)
  const experience = useProgress((s) => s.onboarding?.experience)
  const hydrated = useProgressHydrated()
  // Sama dengan titik mulai onboarding: pemain berpengalaman mulai di Level 2.
  const next = nextUnfinishedLesson(lessons, experience && experience !== 'baru' ? 2 : 1)

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 p-4 tablet:p-6">
      <header className="flex flex-col gap-3 tablet:flex-row tablet:items-end tablet:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Peta Jalur Belajar
          </h1>
          <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--text-secondary)]">
            Tiga level dari aturan dasar sampai taktik profesional. Setiap pelajaran 3-5 menit:
            animasi, teks ringkas, lalu soal cek pemahaman.
          </p>
        </div>
        {hydrated && next && (
          <LinkButton href={lessonHref(next)} icon={<Icon.Play size={15} />}>
            Lanjutkan: {next.title}
          </LinkButton>
        )}
      </header>

      {CURRICULUM.map((level) => {
        const p = levelProgress(lessons, level.level)
        const color = LEVEL_COLOR[level.level]
        return (
          <section
            key={level.level}
            aria-labelledby={`level-${level.level}`}
            className="flex flex-col gap-4"
          >
            <div className="glass flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Chip color={color}>Level {level.level}</Chip>
                <span className="hud text-xs text-[var(--text-secondary)]">{level.subtitle}</span>
              </div>
              <h2
                id={`level-${level.level}`}
                className="font-display text-xl font-bold text-[var(--text-primary)]"
              >
                {level.title}
              </h2>
              <p className="max-w-[70ch] text-sm leading-relaxed text-[var(--text-secondary)]">
                {level.intro}
              </p>
              {level.level !== 3 && (
                <div className="flex items-center gap-3">
                  <ProgressBar
                    value={p.done}
                    max={p.ready}
                    color={color}
                    label={`${p.done} dari ${p.ready} pelajaran siap sudah selesai`}
                  />
                  <span className="hud shrink-0 text-xs text-[var(--text-secondary)]">
                    {p.done}/{p.ready} selesai · {p.total - p.ready} segera
                  </span>
                </div>
              )}
            </div>

            <ol className="relative flex flex-col gap-3 pl-6">
              {level.modules.map((m, i) => (
                <ModuleNodeCard
                  key={m.code}
                  module={m}
                  color={color}
                  isLast={i === level.modules.length - 1}
                />
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}

function ModuleNodeCard({
  module: m,
  color,
  isLast,
}: {
  module: ModuleNode
  color: string
  isLast: boolean
}) {
  const lessons = useProgress((s) => s.lessons)
  const best = useProgress((s) => bestModuleScore(s, m.code))
  const p = moduleProgress(lessons, m.code)
  const isTacticCategory = m.lessons.length === 0
  const complete = p.ready > 0 && p.done === p.ready
  const started = p.done > 0

  return (
    <li className="relative">
      {/* Garis penghubung: menyala bila modul selesai */}
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute -left-[17px] top-6 h-[calc(100%+0.75rem)] w-0.5 transition-colors duration-slow"
          style={{
            background: complete ? color : 'color-mix(in srgb, var(--text-primary) 12%, transparent)',
            boxShadow: complete ? `0 0 8px ${color}` : undefined,
          }}
        />
      )}
      {/* Simpul */}
      <span
        aria-hidden="true"
        className="absolute -left-[23px] top-4 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 transition-colors duration-slow"
        style={{
          borderColor: complete || started ? color : 'var(--glass-border)',
          background: complete ? color : 'var(--bg-void)',
        }}
      />

      <Link
        href={moduleHref(m)}
        className="group flex flex-col gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-4 transition-all duration-base ease-emphasis hover:border-[color-mix(in_srgb,var(--team-offense)_45%,transparent)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="hud text-xs" style={{ color }}>
            {m.code}
          </span>
          <h3 className="font-display text-base font-bold text-[var(--text-primary)]">{m.title}</h3>
          {complete && <Chip color="var(--state-success)">Selesai</Chip>}
          {best !== null && <Chip color="var(--ball)">Kuis {best}%</Chip>}
          <Icon.ChevronRight
            size={16}
            className="ml-auto text-[var(--text-secondary)] transition-transform duration-fast group-hover:translate-x-0.5"
          />
        </div>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{m.keyVisual}</p>

        {isTacticCategory ? (
          <p className="hud text-[11px] text-[var(--text-secondary)]">Buka kategori di Perpustakaan Taktik</p>
        ) : (
          <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="Pelajaran">
            {m.lessons.map((l) => {
              const status = l.status === 'soon' ? 'soon' : (lessons[l.id]?.status ?? 'available')
              return (
                <li
                  key={l.id}
                  title={`${l.title}${status === 'soon' ? ' (segera)' : ''}`}
                  className={cx(
                    'flex h-6 min-w-6 items-center justify-center rounded-full px-1.5',
                    status === 'soon' && 'opacity-40',
                  )}
                  style={{
                    background:
                      status === 'done'
                        ? `color-mix(in srgb, ${color} 30%, transparent)`
                        : 'color-mix(in srgb, var(--text-primary) 7%, transparent)',
                    color: status === 'done' ? color : 'var(--text-secondary)',
                  }}
                >
                  {status === 'done' ? (
                    <Icon.Check size={12} />
                  ) : status === 'soon' ? (
                    <Icon.Lock size={11} />
                  ) : status === 'in-progress' ? (
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]" />
                  )}
                  <span className="sr-only">
                    {l.title} —{' '}
                    {status === 'done'
                      ? 'selesai'
                      : status === 'soon'
                        ? 'segera hadir'
                        : status === 'in-progress'
                          ? 'sedang dipelajari'
                          : 'terbuka'}
                  </span>
                </li>
              )
            })}
            <li className="hud ml-1 self-center text-[11px] text-[var(--text-secondary)]">
              {p.done}/{p.ready} selesai
              {p.total > p.ready ? ` · ${p.total - p.ready} segera` : ''}
            </li>
          </ul>
        )}
        {m.requires.length > 0 && (
          <p className="hud text-[10px] text-[var(--text-secondary)]">
            Disarankan setelah modul {m.requires.join(', ')}
          </p>
        )}
      </Link>
    </li>
  )
}
