'use client'

/**
 * S-06 Perpustakaan Taktik — F-09.
 *
 * PRD §11 S-06: "Grid kartu, filter kategori/tingkat/posisi, pencarian.
 * Thumbnail animasi berputar saat hover; A-02 saat dibuka."
 *
 * A-02 (morph kartu ke lapangan) diwujudkan lewat View Transitions API:
 * `view-transition-name` yang sama pada thumbnail kartu dan lapangan tujuan
 * membuat browser menganimasikan transformasinya. Di browser tanpa dukungan,
 * navigasi tetap berjalan normal — animasi adalah peningkatan, bukan syarat.
 */

import Link from 'next/link'
import { useMemo, useState } from 'react'

import {
  CATEGORY_LABEL,
  CATEGORY_TOKEN,
  t as localize,
  type Tactic,
  type TacticCategory,
} from '@/engine/runtime'
import { FILTER_CATEGORIES, FILTER_LEVELS, FILTER_POSITIONS, search } from '@/lib/search'
import { useProgress } from '@/stores/progressStore'
import { Chip, Icon, LevelMeter, cx } from '@/components/ui'
import { TacticThumbnail } from '@/components/viewer/TacticThumbnail'

export function TacticLibrary({ tactics }: { tactics: Tactic[] }) {
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<TacticCategory[]>([])
  const [levels, setLevels] = useState<number[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [hovered, setHovered] = useState<string | null>(null)

  const collection = useProgress((s) => s.collection)
  const watched = useProgress((s) => s.tacticsWatched)

  const results = useMemo(() => {
    const matched = search(query, { kinds: ['tactic'], categories, levels, positions }, 50)
    const order = new Map(matched.map((r, i) => [r.id, i]))
    return tactics
      .filter((t) => order.has(t.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  }, [categories, levels, positions, query, tactics])

  const activeFilters = categories.length + levels.length + positions.length

  const toggle = <T,>(list: T[], value: T, set: (next: T[]) => void) => {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  }

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-4 tablet:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Perpustakaan Taktik
        </h1>
        <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--text-secondary)]">
          Setiap taktik punya formasi awal, fase, pohon cabang, counter bertahan,
          kesalahan umum, lima lensa POV, dan kuis Baca &amp; Bereaksi.
        </p>
      </header>

      {/* Pencarian & filter */}
      <section className="flex flex-col gap-3">
        <label className="flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--text-primary)_4%,transparent)] px-3 tablet:max-w-md">
          <Icon.Search size={17} className="shrink-0 text-[var(--text-secondary)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama taktik, istilah, atau ide inti…"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
            aria-label="Cari taktik"
          />
        </label>

        <div className="flex flex-col gap-2">
          <FilterRow label="Kategori">
            {FILTER_CATEGORIES.map((c) => (
              <FilterChip
                key={c.value}
                active={categories.includes(c.value)}
                color={CATEGORY_TOKEN[c.value]}
                onClick={() => toggle(categories, c.value, setCategories)}
              >
                {c.label}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Tingkat">
            {FILTER_LEVELS.map((l) => (
              <FilterChip
                key={l}
                active={levels.includes(l)}
                onClick={() => toggle(levels, l, setLevels)}
              >
                {l}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Posisi">
            {FILTER_POSITIONS.map((p) => (
              <FilterChip
                key={p.value}
                active={positions.includes(p.value)}
                onClick={() => toggle(positions, p.value, setPositions)}
              >
                {p.label}
              </FilterChip>
            ))}
          </FilterRow>
        </div>

        <div className="flex items-center gap-3" aria-live="polite">
          <p className="hud text-xs text-[var(--text-secondary)]">
            {results.length} dari {tactics.length} taktik
          </p>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() => {
                setCategories([])
                setLevels([])
                setPositions([])
              }}
              className="text-xs font-medium text-[var(--team-offense)] transition-opacity duration-fast hover:opacity-80"
            >
              Hapus {activeFilters} filter
            </button>
          )}
        </div>
      </section>

      {/* Grid kartu */}
      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--glass-border)] p-8 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Tidak ada taktik yang cocok. Coba hapus beberapa filter.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3 wide:grid-cols-4">
          {results.map((tactic) => (
            <li key={tactic.id}>
              <TacticCard
                tactic={tactic}
                hovered={hovered === tactic.id}
                onHoverChange={(v) => setHovered(v ? tactic.id : null)}
                saved={collection.some((c) => c.id === tactic.id && c.kind === 'tactic')}
                watched={watched.includes(tactic.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="hud mt-1.5 w-16 shrink-0 text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function FilterChip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean
  color?: string
  onClick: () => void
  children: React.ReactNode
}) {
  const c = color ?? 'var(--team-offense)'
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        'hud rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-wide transition-all duration-fast',
        active
          ? 'text-[var(--text-primary)]'
          : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
      )}
      style={
        active
          ? {
              borderColor: `color-mix(in srgb, ${c} 60%, transparent)`,
              background: `color-mix(in srgb, ${c} 16%, transparent)`,
            }
          : undefined
      }
    >
      {children}
    </button>
  )
}

function TacticCard({
  tactic,
  hovered,
  onHoverChange,
  saved,
  watched,
}: {
  tactic: Tactic
  hovered: boolean
  onHoverChange: (hovered: boolean) => void
  saved: boolean
  watched: boolean
}) {
  const accent = CATEGORY_TOKEN[tactic.category]

  return (
    <Link
      href={`/taktik/${tactic.slug}`}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onFocus={() => onHoverChange(true)}
      onBlur={() => onHoverChange(false)}
      className={cx(
        'group flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-base ease-emphasis',
        'border-[var(--glass-border)] bg-[var(--bg-surface)]',
        'hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--team-offense)_45%,transparent)]',
      )}
      style={{ boxShadow: hovered ? `0 10px 30px -12px ${accent}` : undefined }}
    >
      {/* Thumbnail animasi — A-02 memakai nama transisi ini sebagai elemen bersama */}
      <div
        className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--bg-void)]"
        style={{ viewTransitionName: `tactic-${tactic.slug}` } as React.CSSProperties}
      >
        <TacticThumbnail tactic={tactic} active={hovered} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--bg-surface)] to-transparent" />
        {watched && (
          <span
            className="hud absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase"
            style={{
              color: 'var(--state-success)',
              background: 'color-mix(in srgb, var(--bg-void) 75%, transparent)',
            }}
          >
            <Icon.Check size={11} /> Ditonton
          </span>
        )}
        {saved && (
          <span
            className="absolute left-2 top-2 rounded-full p-1"
            style={{ background: 'color-mix(in srgb, var(--bg-void) 75%, transparent)' }}
          >
            <Icon.Bookmark size={13} className="text-[var(--ball)]" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip color={accent}>{CATEGORY_LABEL[tactic.category]}</Chip>
          <LevelMeter level={tactic.level} color={accent} />
          {tactic.court === 'full' && <Chip>Lapangan penuh</Chip>}
        </div>

        <h2 className="font-display text-base font-bold leading-tight text-[var(--text-primary)]">
          {localize(tactic.title)}
        </h2>
        <p className="line-clamp-3 text-xs leading-relaxed text-[var(--text-secondary)]">
          {localize(tactic.summary)}
        </p>

        <div className="mt-auto flex items-center gap-3 pt-1">
          <span className="hud text-[10px] text-[var(--text-secondary)]">
            {tactic.phases.length} fase
          </span>
          <span className="hud text-[10px] text-[var(--text-secondary)]">
            {tactic.povLenses.length} lensa POV
          </span>
          <span className="hud text-[10px] text-[var(--text-secondary)]">
            {tactic.branches.length} cabang
          </span>
          <Icon.ChevronRight
            size={15}
            className="ml-auto text-[var(--text-secondary)] transition-transform duration-fast group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </Link>
  )
}
