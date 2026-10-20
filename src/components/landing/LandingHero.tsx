'use client'

/**
 * S-01 Landing page — PRD §11: "Hero lapangan 3D, demo POV mini, tombol 'Mulai
 * Belajar Gratis'. Animasi khas: A-21 hero terikat gulir."
 *
 * A-21: "Lapangan 3D berputar dan miring mengikuti posisi gulir; satu taktik
 * diputar otomatis." Mode 3D adalah F-12 (fase 2), jadi hero di sini memakai
 * renderer 2D: kemiringan diganti skala & zoom halus yang terikat gulir, dan
 * satu taktik — Spain Pick-and-Roll — diputar otomatis dalam loop.
 *
 * Target PRD §12 Alur 1: pengguna melihat animasi taktik pertama dalam waktu
 * kurang dari 60 detik. Karena itu animasi mulai berjalan TANPA klik apa pun.
 */

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { playerLabel, t as localize } from '@/engine/labels'
import type { PlayerId, Tactic } from '@/engine/runtime'
import { effectiveQuality, effectiveReducedMotion, useSettings } from '@/stores/settingsStore'
import { HexBadge, Icon, Skeleton, cx } from '@/components/ui'
import { Logomark } from '@/components/nav/AppShell'

/**
 * Lapangan hero dimuat terpisah setelah halaman tampil — lihat HeroCourt.tsx.
 * Skeleton A-20 mengisi tempatnya selama memuat, dengan rasio yang sama agar
 * tidak ada pergeseran tata letak (CLS < 0,1, PRD §15).
 */
const HeroCourt = dynamic(() => import('./HeroCourt').then((m) => m.HeroCourt), {
  ssr: false,
  loading: () => <Skeleton className="absolute inset-0 rounded-none" />,
})

export interface LandingHeroProps {
  /** Taktik unggulan yang diputar di hero */
  tactic: Tactic
  /** Jumlah konten untuk bukti sosial yang jujur */
  stats: { tactics: number; lessons: number; terms: number; povLenses: number }
}

export function LandingHero({ tactic, stats }: LandingHeroProps) {
  const settings = useSettings()
  const reducedMotion = effectiveReducedMotion(settings)
  const quality = effectiveQuality(settings)

  const [pov, setPov] = useState<PlayerId | null>(null)
  const [scrollU, setScrollU] = useState(0)
  const heroRef = useRef<HTMLDivElement | null>(null)

  // A-21: hero terikat gulir. Zoom & fokus kamera bergeser halus saat halaman
  // digulir — padanan 2D dari "berputar dan miring".
  useEffect(() => {
    if (reducedMotion) return
    const onScroll = () => {
      const el = heroRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const u = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height)))
      setScrollU(u)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [reducedMotion])

  const lens = pov ? tactic.povLenses.find((l) => l.playerId === pov) : undefined
  const offense = tactic.players.filter((p) => p.team === 'offense')

  return (
    <div className="relative">
      {/* Bilah atas landing */}
      <header className="sticky top-0 z-30 border-b border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-void)_88%,transparent)] backdrop-blur-glass">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 tablet:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Logomark size={26} />
            <span className="font-display text-base font-bold tracking-tight text-[var(--text-primary)]">
              TAKTIKA
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1.5">
            <Link
              href="/taktik"
              className="hidden touch-target items-center rounded-full px-3.5 text-sm text-[var(--text-secondary)] transition-colors duration-fast hover:text-[var(--text-primary)] tablet:inline-flex"
            >
              Perpustakaan
            </Link>
            <Link
              href="/glosarium"
              className="hidden touch-target items-center rounded-full px-3.5 text-sm text-[var(--text-secondary)] transition-colors duration-fast hover:text-[var(--text-primary)] tablet:inline-flex"
            >
              Glosarium
            </Link>
            <Link
              href="/mulai"
              className="inline-flex touch-target items-center rounded-full bg-[var(--team-offense)] px-4 text-sm font-semibold text-[var(--text-inverse)] transition-shadow duration-fast hover:shadow-[0_0_24px_color-mix(in_srgb,var(--team-offense)_55%,transparent)]"
            >
              Mulai gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative mx-auto grid max-w-[1400px] gap-6 px-4 py-8 tablet:px-6 desktop:grid-cols-[minmax(0,460px)_1fr] desktop:items-center desktop:py-14"
      >
        <div className="flex flex-col gap-5">
          <p
            className="hud inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em]"
            style={{
              color: 'var(--ball)',
              background: 'color-mix(in srgb, var(--ball) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--ball) 35%, transparent)',
            }}
          >
            Aturan FIBA · Bahasa Indonesia
          </p>

          <h1 className="font-display text-[2rem] font-bold leading-[1.1] text-balance text-[var(--text-primary)] tablet:text-[2.75rem]">
            Lihat basket seperti pelatih melihatnya.
            <br />
            <span style={{ color: 'var(--team-offense)' }}>
              Lalu rasakan dari mata setiap pemain.
            </span>
          </h1>

          <p className="max-w-[54ch] text-base leading-relaxed text-[var(--text-secondary)]">
            Setiap taktik bisa diputar, diperlambat, dijeda di momen keputusan,
            dan dilihat dari POV lima posisi menyerang maupun lima posisi
            bertahan. Bukan diagram statis, bukan video yang selalu mengikuti
            bola.
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/mulai"
              className="inline-flex h-12 touch-target items-center gap-2 rounded-full px-6 font-semibold text-[var(--text-inverse)] transition-shadow duration-fast hover:shadow-[0_0_28px_color-mix(in_srgb,var(--team-offense)_55%,transparent)]"
              style={{
                background:
                  'linear-gradient(135deg, var(--team-offense), color-mix(in srgb, var(--team-offense) 55%, var(--ball)))',
              }}
            >
              Mulai Belajar Gratis
              <Icon.ChevronRight size={18} />
            </Link>
            <Link
              href={`/taktik/${tactic.slug}`}
              className="inline-flex h-12 touch-target items-center gap-2 rounded-full border border-[var(--glass-border)] px-5 text-sm text-[var(--text-primary)] transition-colors duration-fast hover:border-[color-mix(in_srgb,var(--team-offense)_50%,transparent)]"
            >
              <Icon.Play size={16} />
              Lihat {localize(tactic.title)}
            </Link>
          </div>

          <p className="text-xs text-[var(--text-secondary)]">
            Tanpa daftar. Progres tersimpan di perangkatmu sampai kamu membuat akun.
          </p>

          <dl className="mt-1 grid grid-cols-2 gap-3 tablet:grid-cols-4">
            <Stat label="Taktik" value={stats.tactics} />
            <Stat label="Lensa POV" value={stats.povLenses} />
            <Stat label="Pelajaran" value={stats.lessons} />
            <Stat label="Istilah" value={stats.terms} />
          </dl>
        </div>

        {/* Lapangan hero + demo POV mini */}
        <div className="flex flex-col gap-3">
          <div
            className="relative overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-void)]"
            style={{ aspectRatio: '4 / 3' }}
          >
            <HeroCourt
              tactic={tactic}
              pov={pov}
              scrollU={scrollU}
              reducedMotion={reducedMotion}
              quality={quality}
            />
            <div className="pointer-events-none absolute left-3 top-3">
              <p
                className="hud rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider"
                style={{
                  color: 'var(--text-primary)',
                  background: 'color-mix(in srgb, var(--bg-void) 72%, transparent)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                {localize(tactic.title)}
              </p>
            </div>
          </div>

          {/* Demo POV mini */}
          <div className="flex flex-col gap-2 rounded-2xl border border-[var(--glass-border)] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="hud text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                Coba mode POV
              </span>
              <div className="flex gap-1.5">
                {offense.map((p) => (
                  <HexBadge
                    key={p.id}
                    label={playerLabel(p.id)}
                    team="offense"
                    active={pov === p.id}
                    size={36}
                    title={p.role ?? undefined}
                    onClick={() => setPov(pov === p.id ? null : p.id)}
                  />
                ))}
              </div>
            </div>
            <p
              className={cx(
                'min-h-[2.75rem] text-sm leading-relaxed',
                lens ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
              )}
              aria-live="polite"
            >
              {lens
                ? localize(lens.mission)
                : 'Pilih satu nomor untuk melihat tugas posisi itu di taktik ini.'}
            </p>
          </div>
        </div>
      </section>

      {/* Empat pilar produk — PRD §1 */}
      <section className="mx-auto max-w-[1400px] px-4 pb-10 tablet:px-6">
        <ul className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
          <Pillar
            title="Belajar bertahap"
            body="Tiga level: Fondasi, Konsep, dan Taktik. Terkunci progresif, tapi bisa dilompati."
          />
          <Pillar
            title="Visual yang menjelaskan"
            body="Setiap animasi punya tujuan mengajar. Tidak ada efek yang hanya hiasan."
          />
          <Pillar
            title="POV setiap posisi"
            body="Jalur gerak, tugas, isyarat yang dibaca, dan pilihan keputusan — per posisi."
          />
          <Pillar
            title="Belajar lewat aksi"
            body="Kuis Baca & Bereaksi menjeda permainan dan memintamu memilih umpan yang benar."
          />
        </ul>
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <dt className="hud order-2 text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
        {label}
      </dt>
      <dd
        className="hud order-1 text-xl font-bold tabular-nums"
        style={{ color: 'var(--team-offense)' }}
      >
        {value}
      </dd>
    </div>
  )
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex flex-col gap-1.5 rounded-2xl border border-[var(--glass-border)] p-4">
      <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">{title}</h2>
      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{body}</p>
    </li>
  )
}
