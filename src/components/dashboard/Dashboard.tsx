'use client'

/**
 * S-03 Dashboard — "Titik lanjut belajar".
 *
 * PRD §11 S-03: "Lanjutkan pelajaran, jalur ringkas, taktik pilihan hari ini,
 * streak, rekomendasi per posisi." PRD §12 Alur 5: "Dashboard menampilkan
 * 'Lanjutkan' pada titik terakhir; streak dan target harian tampil di atas;
 * rekomendasi taktik baru berdasarkan posisi favorit dan isyarat yang sering
 * terlewat di kuis."
 */

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { CATEGORY_LABEL, CATEGORY_TOKEN, ROLE_LABEL, t as localize } from '@/engine'
import { getTacticById, recommendedForRole, tacticOfTheDay } from '@/lib/content'
import {
  lessonHref,
  levelProgress,
  nextReadyLessonAfter,
  nextUnfinishedLesson,
} from '@/lib/learning'
import { profileLevelFromXp } from '@/lib/xp'
import { xpLabel } from '@/lib/format'
import { useProgressHydrated } from '@/lib/hydration'
import { useProgress } from '@/stores/progressStore'
import {
  Chip,
  GlassPanel,
  Icon,
  LevelMeter,
  LinkButton,
  ProgressBar,
  SectionLabel,
  Skeleton,
} from '@/components/ui'
import { TacticThumbnail } from '@/components/viewer/TacticThumbnail'

const ROLE_GREETING = { pemain: 'pemain', pelatih: 'coach', penggemar: 'penggemar basket' } as const

const POSITION_NUMBER = { PG: '1', SG: '2', SF: '3', PF: '4', C: '5' } as const

export function Dashboard() {
  const hydrated = useProgressHydrated()
  const onboarding = useProgress((s) => s.onboarding)
  const xp = useProgress((s) => s.xp)
  const streak = useProgress((s) => s.streak)
  const bestStreak = useProgress((s) => s.bestStreak)
  const lessons = useProgress((s) => s.lessons)
  const lastVisited = useProgress((s) => s.lastVisited)
  const missedCues = useProgress((s) => s.missedCues)
  const lessonsBeforeAccount = useProgress((s) => s.lessonsBeforeAccount)
  const dismissedSignup = useProgress((s) => s.dismissedSignupPrompt)
  const dismissSignup = useProgress((s) => s.dismissSignupPrompt)

  const [todayHover, setTodayHover] = useState(false)
  const today = useMemo(() => tacticOfTheDay(), [])

  if (!hydrated) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 p-4 tablet:p-6">
        <Skeleton className="h-28" />
        <div className="grid gap-4 desktop:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  const prof = profileLevelFromXp(xp)
  const nextLesson = nextUnfinishedLesson(
    lessons,
    onboarding && onboarding.experience !== 'baru' ? 2 : 1,
  )
  // Pelajaran terakhir yang sudah selesai tidak perlu "dilanjutkan" — maju ke
  // pelajaran siap berikutnya.
  const lastDone = lastVisited?.kind === 'lesson' && lessons[lastVisited.id]?.status === 'done'
  const afterLast = lastDone && lastVisited ? nextReadyLessonAfter(lastVisited.id) : null
  const lessonItem = (l: NonNullable<typeof nextLesson>) => ({
    kind: 'lesson' as const,
    id: l.id,
    title: l.title,
    href: lessonHref(l),
  })
  const continueItem = afterLast
    ? lessonItem(afterLast)
    : lastVisited && !lastDone
      ? lastVisited
      : nextLesson
        ? lessonItem(nextLesson)
        : null

  const recommended = onboarding ? recommendedForRole(onboarding.position).slice(0, 3) : []
  const povNumber = onboarding ? POSITION_NUMBER[onboarding.position] : null

  const weakCues = Object.entries(missedCues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, count]) => {
      const tactic = getTacticById(key.split(':')[0] ?? '')
      return tactic ? { tactic, count } : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 p-4 tablet:p-6">
      {/* Sapaan + streak + XP */}
      <GlassPanel className="flex flex-col gap-4 p-5 tablet:flex-row tablet:items-center">
        <div className="flex-1">
          <p className="hud text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Beranda</p>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            {onboarding ? `Halo, ${ROLE_GREETING[onboarding.role]}!` : 'Selamat datang di TAKTIKA'}
          </h1>
          {onboarding ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Posisi favorit: {ROLE_LABEL[onboarding.position]} ({povNumber})
            </p>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              Jawab 4 pertanyaan singkat agar jalur belajar menyesuaikan dirimu.
            </p>
          )}
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <Icon.Flame size={22} className={streak > 0 ? 'text-[var(--action-screen)]' : 'text-[var(--text-secondary)]'} />
            <div>
              <p className="hud text-lg font-bold leading-none text-[var(--text-primary)]">{streak} hari</p>
              <p className="text-[11px] text-[var(--text-secondary)]">streak · terbaik {bestStreak}</p>
            </div>
          </div>
          <div className="w-40">
            <div className="flex items-baseline justify-between">
              <p className="hud text-sm font-bold text-[var(--ball)]">{xpLabel(xp)}</p>
              <p className="hud text-[11px] text-[var(--text-secondary)]">Tingkat {prof.level}</p>
            </div>
            <ProgressBar
              value={prof.into}
              max={prof.need}
              color="var(--ball)"
              label={`${prof.into} dari ${prof.need} XP menuju tingkat berikutnya`}
              className="mt-1"
            />
          </div>
        </div>
      </GlassPanel>

      {!onboarding && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--team-offense)_40%,transparent)] bg-[color-mix(in_srgb,var(--team-offense)_8%,transparent)] p-5 tablet:flex-row tablet:items-center">
          <p className="flex-1 text-sm leading-relaxed text-[var(--text-primary)]">
            Belum memilih peran dan posisi. Onboarding hanya 4 ketukan dan menentukan titik mulai yang pas.
          </p>
          <LinkButton href="/mulai" icon={<Icon.ChevronRight size={15} />}>
            Mulai onboarding
          </LinkButton>
        </div>
      )}

      <div className="grid gap-4 desktop:grid-cols-3">
        {/* Lanjutkan */}
        <section className="flex flex-col gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-5">
          <SectionLabel>Lanjutkan</SectionLabel>
          {continueItem ? (
            <>
              <span className="self-start">
                <Chip color={continueItem.kind === 'tactic' ? 'var(--cat-set-play)' : 'var(--state-success)'}>
                  {continueItem.kind === 'tactic' ? 'Taktik' : 'Pelajaran'}
                </Chip>
              </span>
              <p className="font-display text-lg font-bold leading-tight text-[var(--text-primary)]">
                {continueItem.title}
              </p>
              <LinkButton href={continueItem.href} className="mt-auto self-start" icon={<Icon.Play size={15} />}>
                Lanjutkan
              </LinkButton>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--text-secondary)]">Semua pelajaran yang tersedia sudah selesai.</p>
              <LinkButton href="/taktik" className="mt-auto self-start">
                Jelajahi taktik
              </LinkButton>
            </>
          )}
        </section>

        {/* Jalur ringkas */}
        <section className="flex flex-col gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-5">
          <SectionLabel right={<Link href="/belajar" className="text-xs text-[var(--team-offense)] hover:opacity-80">Peta lengkap</Link>}>
            Jalur belajar
          </SectionLabel>
          {([1, 2] as const).map((lv) => {
            const p = levelProgress(lessons, lv)
            return (
              <div key={lv} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Level {lv} · {lv === 1 ? 'Fondasi' : 'Konsep'}
                  </p>
                  <p className="hud text-[11px] text-[var(--text-secondary)]">
                    {p.done}/{p.ready}
                  </p>
                </div>
                <ProgressBar
                  value={p.done}
                  max={p.ready}
                  color={lv === 1 ? 'var(--state-success)' : 'var(--team-offense)'}
                  label={`Level ${lv}: ${p.done} dari ${p.ready} pelajaran selesai`}
                />
              </div>
            )
          })}
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-[var(--text-primary)]">Level 3 · Taktik</p>
            <Link href="/taktik" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              Perpustakaan Taktik →
            </Link>
          </div>
        </section>

        {/* Taktik hari ini */}
        <section
          className="flex flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)]"
          onMouseEnter={() => setTodayHover(true)}
          onMouseLeave={() => setTodayHover(false)}
        >
          <div className="relative aspect-[16/9] w-full bg-[var(--bg-void)]">
            <TacticThumbnail tactic={today} active={todayHover} className="absolute inset-0" />
          </div>
          <div className="flex flex-1 flex-col gap-2 p-4">
            <SectionLabel>Taktik pilihan hari ini</SectionLabel>
            <div className="flex items-center gap-2">
              <Chip color={CATEGORY_TOKEN[today.category]}>{CATEGORY_LABEL[today.category]}</Chip>
              <LevelMeter level={today.level} color={CATEGORY_TOKEN[today.category]} />
            </div>
            <p className="font-display text-base font-bold text-[var(--text-primary)]">{localize(today.title)}</p>
            <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
              {localize(today.summary)}
            </p>
            <LinkButton href={`/taktik/${today.slug}`} size="sm" className="mt-auto self-start" icon={<Icon.Play size={14} />}>
              Tonton
            </LinkButton>
          </div>
        </section>
      </div>

      {/* Rekomendasi per posisi */}
      {recommended.length > 0 && povNumber && onboarding && (
        <section className="flex flex-col gap-3">
          <SectionLabel>Untuk posisi {povNumber} — {ROLE_LABEL[onboarding.position]}</SectionLabel>
          <ul className="grid gap-3 tablet:grid-cols-3">
            {recommended.map((t) => {
              const lens = t.povLenses.find((l) => l.playerId.endsWith(povNumber))
              return (
                <li key={t.id}>
                  <Link
                    href={`/taktik/${t.slug}${lens ? `?pov=${lens.playerId}` : ''}`}
                    className="flex h-full flex-col gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-4 transition-colors duration-fast hover:border-[color-mix(in_srgb,var(--team-offense)_45%,transparent)]"
                  >
                    <div className="flex items-center gap-2">
                      <LevelMeter level={t.level} color={CATEGORY_TOKEN[t.category]} />
                      <span className="font-display font-bold text-[var(--text-primary)]">{localize(t.title)}</span>
                    </div>
                    {lens && (
                      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                        <span className="text-[var(--team-offense)]">Tugasmu:</span> {localize(lens.mission)}
                      </p>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Isyarat yang sering terlewat */}
      {weakCues.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionLabel>Isyarat yang sering terlewat</SectionLabel>
          <ul className="grid gap-3 tablet:grid-cols-3">
            {weakCues.map(({ tactic, count }) => (
              <li key={tactic.id}>
                <Link
                  href={`/taktik/${tactic.slug}/kuis`}
                  className="flex h-full flex-col gap-1.5 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-4 transition-colors duration-fast hover:border-[color-mix(in_srgb,var(--state-error)_45%,transparent)]"
                >
                  <span className="font-display font-bold text-[var(--text-primary)]">{localize(tactic.title)}</span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Terlewat {count}× · ulangi Baca &amp; Bereaksi
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!dismissedSignup && lessonsBeforeAccount >= 3 && (
        <div className="glass-flat flex flex-col gap-2 p-4" style={{ borderLeft: '2px solid var(--ball)' }}>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Simpan progresmu</p>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Progres mode tamu hanya ada di perangkat ini. Sinkron akun (email/Google) belum aktif di versi
            ini.
          </p>
          <button
            type="button"
            onClick={dismissSignup}
            className="self-start text-xs font-medium text-[var(--team-offense)] hover:opacity-80"
          >
            Mengerti
          </button>
        </div>
      )}
    </div>
  )
}
