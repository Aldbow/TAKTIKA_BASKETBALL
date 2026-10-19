'use client'

/**
 * Shell navigasi — PRD §11 "Navigasi":
 *   Desktop : rel navigasi kiri berisi ikon dan label, bisa diciutkan
 *   Mobile  : bilah tab bawah dengan 5 tab (Beranda, Belajar, Taktik, Latihan, Profil)
 *
 * Area Pelatih muncul di menu hanya bila pengguna memilih peran pelatih di
 * onboarding (PRD §11: "Area Pelatih muncul di menu bila pengguna memilih peran
 * pelatih").
 *
 * Landing page (S-01), Mode Presentasi (S-11), dan Studio (S-12) memakai layar
 * penuh tanpa rel navigasi.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'

import { Icon, cx } from '@/components/ui'
import { useProgress } from '@/stores/progressStore'
import { GlobalSearch } from './GlobalSearch'

interface NavItem {
  href: string
  label: string
  icon: (props: { size?: number; className?: string }) => ReactNode
  /** Cocok juga untuk sub-rute */
  match: (path: string) => boolean
}

const MAIN_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Beranda', icon: Icon.Home, match: (p) => p === '/dashboard' },
  { href: '/belajar', label: 'Belajar', icon: Icon.Learn, match: (p) => p.startsWith('/belajar') },
  { href: '/taktik', label: 'Taktik', icon: Icon.Court, match: (p) => p.startsWith('/taktik') },
  { href: '/latihan', label: 'Latihan', icon: Icon.Target, match: (p) => p.startsWith('/latihan') },
  { href: '/profil', label: 'Profil', icon: Icon.Profile, match: (p) => p.startsWith('/profil') },
]

const COACH_NAV: NavItem = {
  href: '/pelatih',
  label: 'Pelatih',
  icon: Icon.Coach,
  match: (p) => p.startsWith('/pelatih'),
}

/** Rute yang memakai layar penuh tanpa rel navigasi. */
function isImmersive(path: string): boolean {
  return (
    path === '/' ||
    path === '/mulai' ||
    path.startsWith('/studio') ||
    // Tactic Viewer memakai tata letaknya sendiri yang mengisi layar.
    /^\/taktik\/[^/]+/.test(path)
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/'
  const [railOpen, setRailOpen] = useState(true)
  const role = useProgress((s) => s.onboarding?.role)

  const items = role === 'pelatih' ? [...MAIN_NAV, COACH_NAV] : MAIN_NAV
  const immersive = isImmersive(pathname)

  if (immersive) {
    return (
      <main id="konten" className="min-h-dvh">
        {children}
      </main>
    )
  }

  return (
    <div className="flex min-h-dvh">
      {/* Rel navigasi desktop */}
      <nav
        aria-label="Navigasi utama"
        className={cx(
          'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-[var(--glass-border)]',
          'bg-[var(--bg-surface)] px-3 py-4 transition-all duration-base ease-emphasis tablet:flex',
        )}
        style={{ width: railOpen ? 'var(--nav-rail)' : 'var(--nav-rail-collapsed)' }}
      >
        <div className="mb-6 flex items-center gap-2 px-1">
          <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="TAKTIKA, beranda">
            <Logomark />
            {railOpen && (
              <span className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)]">
                TAKTIKA
              </span>
            )}
          </Link>
        </div>

        <div className="mb-4 px-0.5">
          <GlobalSearch compact={!railOpen} />
        </div>

        <ul className="flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const active = item.match(pathname)
            const ItemIcon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'flex touch-target items-center gap-3 rounded-xl px-3 transition-colors',
                    'duration-fast ease-emphasis',
                    active
                      ? 'bg-[color-mix(in_srgb,var(--team-offense)_14%,transparent)] text-[var(--team-offense)]'
                      : 'text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] hover:text-[var(--text-primary)]',
                    !railOpen && 'justify-center px-0',
                  )}
                  title={railOpen ? undefined : item.label}
                >
                  <ItemIcon size={20} />
                  {railOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-2 flex flex-col gap-1">
          <Link
            href="/glosarium"
            className={cx(
              'flex touch-target items-center gap-3 rounded-xl px-3 text-sm text-[var(--text-secondary)]',
              'transition-colors duration-fast hover:text-[var(--text-primary)]',
              !railOpen && 'justify-center px-0',
            )}
            title={railOpen ? undefined : 'Glosarium'}
          >
            <Icon.Search size={20} />
            {railOpen && <span>Glosarium</span>}
          </Link>
          <button
            type="button"
            onClick={() => setRailOpen((v) => !v)}
            aria-label={railOpen ? 'Ciutkan navigasi' : 'Lebarkan navigasi'}
            className={cx(
              'flex touch-target items-center gap-3 rounded-xl px-3 text-sm text-[var(--text-secondary)]',
              'transition-colors duration-fast hover:text-[var(--text-primary)]',
              !railOpen && 'justify-center px-0',
            )}
          >
            <Icon.ChevronRight
              size={20}
              className={cx('transition-transform duration-base', railOpen && 'rotate-180')}
            />
            {railOpen && <span>Ciutkan</span>}
          </button>
        </div>
      </nav>

      {/* Konten */}
      <main
        id="konten"
        className="min-w-0 flex-1 pb-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] tablet:pb-0"
      >
        {children}
      </main>

      {/* Bilah tab bawah mobile */}
      <nav
        aria-label="Navigasi utama"
        className={cx(
          'fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--glass-border)]',
          'bg-[color-mix(in_srgb,var(--bg-surface)_94%,transparent)] backdrop-blur-glass tablet:hidden',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {MAIN_NAV.map((item) => {
          const active = item.match(pathname)
          const ItemIcon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2',
                'transition-colors duration-fast',
                active ? 'text-[var(--team-offense)]' : 'text-[var(--text-secondary)]',
              )}
              style={{ minHeight: 'var(--tabbar-height)' }}
            >
              <ItemIcon size={22} />
              <span className="text-[11px] font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

/** Logomark: segi enam dengan garis lapangan — motif yang sama dengan lencana posisi. */
export function Logomark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="taktika-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--team-offense)" />
          <stop offset="1" stopColor="var(--ball)" />
        </linearGradient>
      </defs>
      <path
        d="M16 1.5 29 9v14L16 30.5 3 23V9L16 1.5Z"
        fill="none"
        stroke="url(#taktika-logo)"
        strokeWidth="1.6"
      />
      <path d="M16 6v20" stroke="var(--team-offense)" strokeWidth="1.2" opacity="0.55" />
      <circle cx="16" cy="16" r="4.2" fill="none" stroke="var(--ball)" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="1.5" fill="var(--ball)" />
    </svg>
  )
}
