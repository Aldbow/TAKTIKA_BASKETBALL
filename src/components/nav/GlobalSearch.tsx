'use client'

/**
 * Pencarian global — F-09: "Cari taktik, istilah, pelajaran; filter kategori,
 * tingkat, posisi."
 *
 * Dapat dioperasikan penuh dengan keyboard (PRD §15): `/` membuka, panah
 * memilih, Enter membuka, Escape menutup. Daftar hasil memakai pola combobox
 * ARIA sehingga pembaca layar mengumumkan jumlah hasil dan item aktif.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Icon, cx } from '@/components/ui'
import type { SearchResult } from '@/lib/search'

/**
 * Indeks pencarian memuat SEMUA taktik (beserta parse skemanya), glosarium,
 * dan kurikulum. Komponen ini ada di shell setiap halaman, jadi indeks dimuat
 * baru saat pengguna fokus ke kolom pencarian — bukan di muatan awal halaman
 * (PRD §15: JS awal landing <= 200 KB gzip).
 */
type SearchFn = typeof import('@/lib/search').search

const KIND_LABEL: Record<SearchResult['kind'], string> = {
  tactic: 'Taktik',
  term: 'Istilah',
  lesson: 'Pelajaran',
}

const KIND_COLOR: Record<SearchResult['kind'], string> = {
  tactic: 'var(--team-offense)',
  term: 'var(--action-cut)',
  lesson: 'var(--state-success)',
}

export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [searchFn, setSearchFn] = useState<SearchFn | null>(null)
  const loadingRef = useRef(false)

  const loadIndex = useCallback(() => {
    if (loadingRef.current) return
    loadingRef.current = true
    void import('@/lib/search').then((m) => setSearchFn(() => m.search))
  }, [])

  const results = useMemo(
    () => (!searchFn || query.trim().length === 0 ? [] : searchFn(query, {}, 8)),
    [query, searchFn],
  )

  // Pintasan global "/" untuk membuka pencarian.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      // Jangan rebut "/" saat pengguna sedang mengetik di tempat lain.
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (target?.isContentEditable) return
      e.preventDefault()
      loadIndex()
      setOpen(true)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loadIndex])

  // Tutup saat klik di luar.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const go = useCallback(
    (result: SearchResult) => {
      setOpen(false)
      setQuery('')
      router.push(result.href)
    },
    [router],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min(results.length - 1, i + 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => Math.max(0, i - 1))
        return
      }
      if (e.key === 'Enter') {
        const pick = results[active]
        if (pick) {
          e.preventDefault()
          go(pick)
        }
      }
    },
    [active, go, results],
  )

  if (compact) {
    return (
      <Link
        href="/taktik"
        aria-label="Cari taktik, istilah, atau pelajaran"
        title="Cari"
        className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-colors duration-fast hover:text-[var(--text-primary)]"
      >
        <Icon.Search size={20} />
      </Link>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={cx(
          'flex items-center gap-2 rounded-xl border px-2.5 transition-colors duration-fast',
          open
            ? 'border-[color-mix(in_srgb,var(--team-offense)_55%,transparent)] bg-[var(--bg-raised)]'
            : 'border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--text-primary)_4%,transparent)]',
        )}
        style={{ height: 40 }}
      >
        <Icon.Search size={16} className="shrink-0 text-[var(--text-secondary)]" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="hasil-pencarian"
          aria-autocomplete="list"
          aria-activedescendant={results[active] ? `hasil-${active}` : undefined}
          placeholder="Cari taktik, istilah…"
          value={query}
          onChange={(e) => {
            loadIndex()
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => {
            loadIndex()
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
        />
        {query.length === 0 && (
          <kbd className="hud hidden shrink-0 rounded border border-[var(--glass-border)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] desktop:block">
            /
          </kbd>
        )}
      </div>

      {open && query.trim().length > 0 && (
        <div
          className="glass-flat absolute left-0 right-0 top-[46px] z-50 overflow-hidden p-1 shadow-glass"
          style={{ minWidth: 260 }}
        >
          <p aria-live="polite" className="sr-only">
            {results.length} hasil untuk {query}
          </p>

          {!searchFn ? (
            <p className="px-3 py-3 text-sm text-[var(--text-secondary)]">Memuat indeks…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-[var(--text-secondary)]">
              Tidak ada hasil untuk “{query}”.
            </p>
          ) : (
            <ul id="hasil-pencarian" role="listbox" className="flex flex-col">
              {results.map((r, i) => (
                <li key={`${r.kind}-${r.id}`} role="option" aria-selected={i === active} id={`hasil-${i}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cx(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left',
                      i === active
                        ? 'bg-[color-mix(in_srgb,var(--team-offense)_14%,transparent)]'
                        : 'hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)]',
                    )}
                  >
                    <span
                      className="hud shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase"
                      style={{
                        color: KIND_COLOR[r.kind],
                        background: `color-mix(in srgb, ${KIND_COLOR[r.kind]} 14%, transparent)`,
                      }}
                    >
                      {KIND_LABEL[r.kind]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-[var(--text-primary)]">
                        {r.title}
                      </span>
                      <span className="block truncate text-xs text-[var(--text-secondary)]">
                        {r.subtitle}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
