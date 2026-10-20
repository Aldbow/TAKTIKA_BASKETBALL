'use client'

/**
 * S-10 Profil & Progres — F-24 (koleksi), F-25 (XP & lencana), F-30 (pengaturan).
 *
 * Grafik radar penguasaan (F-26) adalah P1; di sini statistik ditampilkan
 * sebagai angka yang bisa diverifikasi.
 */

import Link from 'next/link'
import { useState } from 'react'

import { findLesson } from '@content/curriculum'
import { findTerm } from '@content/glossary'
import { ROLE_LABEL, t as localize } from '@/engine'
import { getTacticById } from '@/lib/content'
import { lessonHref } from '@/lib/learning'
import { BADGES, profileLevelFromXp } from '@/lib/xp'
import { shortDate, xpLabel } from '@/lib/format'
import { isCloudSyncConfigured } from '@/lib/storage'
import { useProgressHydrated } from '@/lib/hydration'
import { useProgress } from '@/stores/progressStore'
import { useSettings, type QualityPreference } from '@/stores/settingsStore'
import {
  GlassPanel,
  Icon,
  IconButton,
  LinkButton,
  PillButton,
  ProgressBar,
  SectionLabel,
  Skeleton,
  Toggle,
  cx,
} from '@/components/ui'

export function Profile() {
  const hydrated = useProgressHydrated()
  const p = useProgress()

  if (!hydrated) {
    return (
      <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-4 p-4 tablet:p-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  const prof = profileLevelFromXp(p.xp)
  const lessonsDone = Object.values(p.lessons).filter((l) => l.status === 'done').length

  const stats = [
    { label: 'Pelajaran selesai', value: lessonsDone },
    { label: 'Taktik ditonton penuh', value: p.tacticsWatched.length },
    { label: 'Lensa POV dibuka', value: p.povSeen.length },
    { label: 'Cabang dicoba', value: p.branchesSeen.length },
    { label: 'Skenario benar', value: p.scenariosCorrect.length },
    { label: 'Streak terbaik', value: `${p.bestStreak} hari` },
  ]

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6 p-4 tablet:p-6">
      <GlassPanel className="flex flex-col gap-4 p-5 tablet:flex-row tablet:items-center">
        <div className="flex-1">
          <p className="hud text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Profil · mode tamu</p>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Tingkat {prof.level}</h1>
          {p.onboarding ? (
            <p className="text-sm text-[var(--text-secondary)]">
              {p.onboarding.role[0]?.toUpperCase()}
              {p.onboarding.role.slice(1)} · {ROLE_LABEL[p.onboarding.position]}{' '}
              <Link href="/mulai" className="text-[var(--team-offense)] hover:opacity-80">
                (ubah)
              </Link>
            </p>
          ) : (
            <Link href="/mulai" className="text-sm text-[var(--team-offense)] hover:opacity-80">
              Lengkapi onboarding →
            </Link>
          )}
        </div>
        <div className="w-full tablet:w-64">
          <div className="flex items-baseline justify-between">
            <p className="hud text-lg font-bold text-[var(--ball)]">{xpLabel(p.xp)}</p>
            <p className="hud text-[11px] text-[var(--text-secondary)]">
              {prof.need - prof.into} XP lagi
            </p>
          </div>
          <ProgressBar value={prof.into} max={prof.need} color="var(--ball)" label="Progres tingkat profil" className="mt-1" />
        </div>
      </GlassPanel>

      <section className="flex flex-col gap-3">
        <SectionLabel>Statistik</SectionLabel>
        <ul className="grid grid-cols-2 gap-3 tablet:grid-cols-3">
          {stats.map((s) => (
            <li key={s.label} className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-4">
              <p className="hud text-2xl font-bold text-[var(--text-primary)]">{s.value}</p>
              <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel right={<span className="hud text-xs text-[var(--text-secondary)]">{p.badges.length}/{BADGES.length}</span>}>
          Lencana
        </SectionLabel>
        <ul className="grid grid-cols-2 gap-3 tablet:grid-cols-4">
          {BADGES.map((b) => {
            const earned = p.badges.includes(b.id)
            return (
              <li
                key={b.id}
                className={cx(
                  'flex flex-col gap-1.5 rounded-2xl border p-4',
                  earned
                    ? 'border-[color-mix(in_srgb,var(--ball)_45%,transparent)] bg-[color-mix(in_srgb,var(--ball)_7%,transparent)]'
                    : 'border-[var(--glass-border)] bg-[var(--bg-surface)]',
                )}
              >
                <span className={cx('text-2xl', !earned && 'opacity-30 grayscale')} aria-hidden="true">
                  {b.emoji}
                </span>
                <p className={cx('text-sm font-semibold', earned ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]')}>
                  {b.title}
                </p>
                <p className="text-[11px] leading-snug text-[var(--text-secondary)]">{b.requirement}</p>
                <span className="sr-only">{earned ? 'Sudah didapat' : 'Belum didapat'}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <Collection />

      <Settings />

      <AccountSection />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function Collection() {
  const collection = useProgress((s) => s.collection)
  const toggleCollection = useProgress((s) => s.toggleCollection)

  const items = [...collection]
    .reverse()
    .map((c) => {
      if (c.kind === 'tactic') {
        const t = getTacticById(c.id)
        return t ? { ...c, title: localize(t.title), href: `/taktik/${t.slug}`, type: 'Taktik' } : null
      }
      if (c.kind === 'lesson') {
        const l = findLesson(c.id)
        return l ? { ...c, title: l.title, href: lessonHref(l), type: 'Pelajaran' } : null
      }
      const term = findTerm(c.id)
      return term ? { ...c, title: term.term, href: `/glosarium#${term.id}`, type: 'Istilah' } : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  return (
    <section className="flex flex-col gap-3" aria-labelledby="koleksi">
      <SectionLabel>
        <span id="koleksi">Koleksi</span>
      </SectionLabel>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--glass-border)] p-5 text-sm text-[var(--text-secondary)]">
          Belum ada yang disimpan. Tekan ikon penanda di Tactic Viewer atau di kartu glosarium.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={`${item.kind}:${item.id}`}
              className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-3"
            >
              <span className="hud w-20 shrink-0 text-[10px] uppercase text-[var(--text-secondary)]">{item.type}</span>
              <Link href={item.href} className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)] hover:text-[var(--team-offense)]">
                {item.title}
              </Link>
              <span className="hud hidden text-[11px] text-[var(--text-secondary)] tablet:inline">{shortDate(item.at)}</span>
              <IconButton label={`Hapus ${item.title} dari koleksi`} size="sm" onClick={() => toggleCollection(item.id, item.kind)}>
                <Icon.Close size={14} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* -------------------------------------------------------------------------- */

const QUALITY_OPTIONS: { value: QualityPreference; label: string; hint: string }[] = [
  { value: 'auto', label: 'Otomatis', hint: 'Dipilih dari uji frame rate 2 detik pertama' },
  { value: 'high', label: 'Tinggi', hint: 'Glow, blur, dan partikel penuh' },
  { value: 'standard', label: 'Standar', hint: 'Partikel dikurangi' },
  { value: 'saver', label: 'Hemat', hint: 'Untuk HP kelas bawah' },
]

/** F-30 Pengaturan aksesibilitas. */
function Settings() {
  const s = useSettings()

  return (
    <section id="pengaturan" className="flex scroll-mt-4 flex-col gap-3">
      <SectionLabel>Pengaturan</SectionLabel>
      <div className="flex flex-col divide-y divide-[var(--glass-border)] rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] px-4">
        <div className="flex flex-col gap-2 py-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">Tema</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tema">
            {(
              [
                ['arena', 'Arena Holografis', 'Gelap, untuk layar'],
                ['whiteboard', 'Papan Tulis', 'Terang, untuk proyektor di ruangan terang'],
              ] as const
            ).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={s.theme === value}
                onClick={() => s.setTheme(value)}
                className={cx(
                  'flex flex-col rounded-xl border px-3 py-2 text-left transition-colors duration-fast',
                  s.theme === value
                    ? 'border-[color-mix(in_srgb,var(--team-offense)_60%,transparent)] bg-[color-mix(in_srgb,var(--team-offense)_12%,transparent)]'
                    : 'border-[var(--glass-border)] hover:border-[color-mix(in_srgb,var(--team-offense)_40%,transparent)]',
                )}
              >
                <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
                <span className="text-[11px] text-[var(--text-secondary)]">{hint}</span>
              </button>
            ))}
          </div>
        </div>

        <Toggle
          label="Kontras tinggi"
          hint="Teks pendukung dan garis tepi lebih tegas"
          checked={s.highContrast}
          onChange={() => s.toggleHighContrast()}
        />
        <Toggle
          label="Kurangi gerak"
          hint={
            s.osReducedMotion
              ? 'Aktif mengikuti pengaturan sistem operasimu'
              : 'Transisi kamera jadi crossfade, bullet time diganti jeda, partikel mati'
          }
          checked={s.osReducedMotion || s.reducedMotionPref}
          disabled={s.osReducedMotion}
          onChange={(v) => s.setReducedMotion(v)}
        />

        <div className="flex flex-col gap-2 py-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">Kualitas grafis</p>
          <div className="grid grid-cols-2 gap-2 tablet:grid-cols-4" role="radiogroup" aria-label="Kualitas grafis">
            {QUALITY_OPTIONS.map((q) => (
              <button
                key={q.value}
                type="button"
                role="radio"
                aria-checked={s.quality === q.value}
                onClick={() => s.setQuality(q.value)}
                className={cx(
                  'flex flex-col rounded-xl border px-3 py-2 text-left transition-colors duration-fast',
                  s.quality === q.value
                    ? 'border-[color-mix(in_srgb,var(--team-offense)_60%,transparent)] bg-[color-mix(in_srgb,var(--team-offense)_12%,transparent)]'
                    : 'border-[var(--glass-border)] hover:border-[color-mix(in_srgb,var(--team-offense)_40%,transparent)]',
                )}
              >
                <span className="text-sm font-medium text-[var(--text-primary)]">{q.label}</span>
                <span className="text-[11px] leading-snug text-[var(--text-secondary)]">{q.hint}</span>
              </button>
            ))}
          </div>
          {s.quality === 'auto' && s.detectedTier && (
            <p className="hud text-[11px] text-[var(--text-secondary)]">Terdeteksi di perangkat ini: {s.detectedTier}</p>
          )}
        </div>

        <Toggle
          label="Penghitung waktu kuis"
          hint="5 detik untuk setiap keputusan Baca & Bereaksi"
          checked={s.quizTimer}
          onChange={(v) => s.setQuizTimer(v)}
        />
        <Toggle label="Suara antarmuka" hint="Detak halus saat menekan tombol" checked={s.soundUi} onChange={(v) => s.setSound('soundUi', v)} />
        <Toggle label="Suara lapangan" hint="Decit sepatu dan swish" checked={s.soundCourt} onChange={(v) => s.setSound('soundCourt', v)} />
        <Toggle label="Narasi suara" hint="Fase 3 — belum tersedia" checked={s.soundNarration} disabled onChange={(v) => s.setSound('soundNarration', v)} />
        <div className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Bahasa</p>
            <p className="text-xs text-[var(--text-secondary)]">Bahasa Inggris direncanakan untuk fase 2</p>
          </div>
          <span className="hud text-sm text-[var(--text-primary)]">Indonesia</span>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

function AccountSection() {
  const resetAll = useProgress((s) => s.resetAll)
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)
  const cloud = isCloudSyncConfigured()

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel>Akun</SectionLabel>
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-4">
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {cloud
            ? 'Sinkron akun dikonfigurasi, tetapi alur masuk belum diaktifkan.'
            : 'Kamu memakai mode tamu: progres tersimpan di browser ini saja. Masuk dengan email atau Google (sinkron lintas perangkat) belum aktif di versi ini.'}
        </p>

        {done ? (
          <p className="text-sm text-[var(--state-success)]" role="status">
            Progres sudah dihapus.
          </p>
        ) : confirming ? (
          <div className="flex flex-col gap-2 rounded-xl border border-[color-mix(in_srgb,var(--state-error)_45%,transparent)] p-3">
            <p className="text-sm text-[var(--text-primary)]">
              Hapus semua XP, lencana, koleksi, dan progres pelajaran di perangkat ini? Ini tidak bisa
              dibatalkan.
            </p>
            <div className="flex flex-wrap gap-2">
              <PillButton
                variant="danger"
                size="sm"
                onClick={() => {
                  resetAll()
                  setConfirming(false)
                  setDone(true)
                }}
              >
                Ya, hapus progres
              </PillButton>
              <PillButton variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                Batal
              </PillButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/mulai" variant="outline" size="sm">
              Ulangi onboarding
            </LinkButton>
            <PillButton variant="ghost" size="sm" onClick={() => setConfirming(true)}>
              Hapus progres…
            </PillButton>
          </div>
        )}
      </div>
    </section>
  )
}
