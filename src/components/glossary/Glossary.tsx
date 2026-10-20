'use client'

/**
 * S-09 Glosarium — F-08.
 *
 * PRD §11: "Daftar A-Z, pencarian, kartu istilah dengan mini-animasi.
 * Animasi khas: kartu membalik ke animasi."
 *
 * Mini-animasi hanya dipasang saat kartu dibuka. Memasang 45 canvas sekaligus
 * berarti 45 loop render — anggaran frame halaman langsung habis.
 */

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { GLOSSARY, glossaryByLetter, type GlossaryTerm } from '@content/glossary'
import { getTacticById } from '@/lib/content'
import { useProgress } from '@/stores/progressStore'
import { Chip, Icon, IconButton, cx } from '@/components/ui'
import { TermClip } from './TermClip'

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

const LEVEL_COLOR: Record<1 | 2 | 3, string> = {
  1: 'var(--state-success)',
  2: 'var(--team-offense)',
  3: 'var(--action-cut)',
}

export function Glossary() {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<0 | 1 | 2 | 3>(0)
  const [open, setOpen] = useState<string | null>(null)

  // Tautan /glosarium#istilah (dari pencarian global & taktik) membuka kartunya.
  useEffect(() => {
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      if (!id || !GLOSSARY.some((t) => t.id === id)) return
      setQuery('')
      setLevel(0)
      setOpen(id)
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
      )
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])

  const groups = useMemo(() => {
    const q = normalize(query.trim())
    return glossaryByLetter()
      .map((g) => ({
        letter: g.letter,
        terms: g.terms.filter(
          (t) =>
            (level === 0 || t.level === level) &&
            (q === '' ||
              normalize(`${t.term} ${t.padanan ?? ''} ${t.short} ${t.long}`).includes(q)),
        ),
      }))
      .filter((g) => g.terms.length > 0)
  }, [query, level])

  const count = groups.reduce((n, g) => n + g.terms.length, 0)

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 p-4 tablet:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Glosarium</h1>
        <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--text-secondary)]">
          Istilah asli, penjelasan lokal. Buka kartu untuk melihat mini-animasinya — setiap
          animasi adalah potongan dari taktik sungguhan di perpustakaan.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <label className="flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--text-primary)_4%,transparent)] px-3 tablet:max-w-md">
          <Icon.Search size={17} className="shrink-0 text-[var(--text-secondary)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari istilah atau artinya…"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
            aria-label="Cari istilah"
          />
        </label>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter level">
          {([0, 1, 2, 3] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={level === l}
              onClick={() => setLevel(l)}
              className={cx(
                'hud rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-wide transition-colors duration-fast',
                level === l
                  ? 'border-[color-mix(in_srgb,var(--team-offense)_60%,transparent)] bg-[color-mix(in_srgb,var(--team-offense)_16%,transparent)] text-[var(--text-primary)]'
                  : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
            >
              {l === 0 ? 'Semua' : `Level ${l}`}
            </button>
          ))}
          <p className="hud ml-2 text-xs text-[var(--text-secondary)]" aria-live="polite">
            {count} dari {GLOSSARY.length} istilah
          </p>
        </div>

        {/* Indeks A-Z */}
        <nav aria-label="Indeks huruf" className="flex flex-wrap gap-1">
          {groups.map((g) => (
            <a
              key={g.letter}
              href={`#huruf-${g.letter}`}
              className="hud flex h-8 w-8 items-center justify-center rounded-lg text-xs text-[var(--text-secondary)] transition-colors duration-fast hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)] hover:text-[var(--text-primary)]"
            >
              {g.letter}
            </a>
          ))}
        </nav>
      </section>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--glass-border)] p-8 text-center">
          <p className="text-sm text-[var(--text-secondary)]">Tidak ada istilah yang cocok.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <section key={g.letter} aria-labelledby={`huruf-${g.letter}`}>
              <h2
                id={`huruf-${g.letter}`}
                className="hud mb-2 scroll-mt-4 text-sm text-[var(--team-offense)]"
              >
                {g.letter}
              </h2>
              <ul className="grid gap-3 tablet:grid-cols-2">
                {g.terms.map((term) => (
                  <li key={term.id}>
                    <TermCard
                      term={term}
                      open={open === term.id}
                      onToggle={() => setOpen((cur) => (cur === term.id ? null : term.id))}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function TermCard({
  term,
  open,
  onToggle,
}: {
  term: GlossaryTerm
  open: boolean
  onToggle: () => void
}) {
  const saved = useProgress((s) =>
    s.collection.some((c) => c.id === term.id && c.kind === 'term'),
  )
  const toggleCollection = useProgress((s) => s.toggleCollection)
  const related = term.related
    .map((id) => GLOSSARY.find((t) => t.id === id))
    .filter((t): t is GlossaryTerm => Boolean(t))

  return (
    <article
      id={term.id}
      className={cx(
        'scroll-mt-4 rounded-2xl border bg-[var(--bg-surface)] p-4 transition-[border-color,box-shadow] duration-base',
        open
          ? 'border-[color-mix(in_srgb,var(--team-offense)_45%,transparent)] shadow-[0_10px_30px_-18px_var(--team-offense)]'
          : 'border-[var(--glass-border)]',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
              <em className="not-italic">{term.term}</em>
            </h3>
            <Chip color={LEVEL_COLOR[term.level]}>Level {term.level}</Chip>
          </div>
          {term.padanan && (
            <p className="text-xs italic text-[var(--text-secondary)]">{term.padanan}</p>
          )}
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-primary)]">{term.short}</p>
        </div>
        <IconButton
          label={saved ? 'Hapus dari koleksi' : 'Simpan ke koleksi'}
          active={saved}
          size="sm"
          onClick={() => toggleCollection(term.id, 'term')}
        >
          <Icon.Bookmark size={15} />
        </IconButton>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--team-offense)] transition-opacity duration-fast hover:opacity-80"
      >
        {open ? 'Tutup' : term.clip ? 'Lihat animasi & penjelasan' : 'Lihat penjelasan'}
        <Icon.ChevronDown
          size={14}
          className={cx('transition-transform duration-base', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="mt-3 flex animate-rise-in flex-col gap-3">
          {term.clip && <TermClip clip={term.clip} label={term.term} />}
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{term.long}</p>
          {term.clip && (
            <Link
              href={`/taktik/${tacticSlug(term.clip.tacticId)}${term.clip.pov ? `?pov=${term.clip.pov}` : ''}`}
              className="inline-flex items-center gap-1 self-start text-xs font-medium text-[var(--text-primary)] underline decoration-[var(--glass-border)] underline-offset-4 hover:decoration-[var(--team-offense)]"
            >
              Buka taktik lengkapnya <Icon.ChevronRight size={13} />
            </Link>
          )}
          {related.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="hud text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                Terkait
              </span>
              {related.map((r) => (
                <a
                  key={r.id}
                  href={`#${r.id}`}
                  className="rounded-full border border-[var(--glass-border)] px-2.5 py-1 text-xs text-[var(--text-primary)] transition-colors duration-fast hover:border-[color-mix(in_srgb,var(--team-offense)_50%,transparent)]"
                >
                  {r.term}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function tacticSlug(id: string): string {
  return getTacticById(id)?.slug ?? ''
}
