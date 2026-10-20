'use client'

/**
 * Komponen antarmuka dasar — PRD §9 "Komponen antarmuka":
 *
 *   Panel kaca     : blur 20 px, garis tepi 1 px putih 8%, satu sudut terpotong 12 px
 *   Tombol         : bentuk pil dengan garis tepi gradien; glow menguat saat hover
 *                    dan bergerak sedikit mengikuti kursor (efek magnet, maks 6 px)
 *   Lencana posisi : segi enam dengan angka; lencana aktif berdenyut halus
 *   Kartu isyarat  : callout kaca dengan garis penunjuk ke pemain terkait
 *   Ikon           : garis 1,5 px, sudut membulat, satu set konsisten
 */

import Link from 'next/link'
import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/* -------------------------------------------------------------------------- */
/* Panel kaca                                                                 */
/* -------------------------------------------------------------------------- */

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Sudut terpotong miring 12 px (default), atau sudut biasa */
  bevel?: boolean
  children?: ReactNode
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(function GlassPanel(
  { bevel = true, className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx(bevel ? 'glass' : 'glass-flat', className)} {...rest}>
      {children}
    </div>
  )
})

/* -------------------------------------------------------------------------- */
/* Tombol pil dengan efek magnet (A-19)                                       */
/* -------------------------------------------------------------------------- */

export interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  /** Matikan efek magnet (dipakai di dalam daftar panjang) */
  magnet?: boolean
  icon?: ReactNode
}

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(function PillButton(
  { variant = 'primary', size = 'md', magnet = true, icon, className, children, ...rest },
  ref,
) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const localRef = useRef<HTMLButtonElement | null>(null)

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!magnet) return
      const el = localRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
      // PRD §10 A-19: "efek magnet maksimal 6 px".
      setOffset({ x: Math.max(-6, Math.min(6, dx * 6)), y: Math.max(-6, Math.min(6, dy * 6)) })
    },
    [magnet],
  )

  const onLeave = useCallback(() => setOffset({ x: 0, y: 0 }), [])

  const sizes: Record<string, string> = {
    sm: 'h-9 px-3 text-sm gap-1.5',
    md: 'h-11 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2',
  }

  const variants: Record<string, string> = {
    primary:
      'text-[var(--text-inverse)] font-semibold [background:linear-gradient(135deg,var(--team-offense),color-mix(in_srgb,var(--team-offense)_55%,var(--ball)))] hover:shadow-[0_0_24px_color-mix(in_srgb,var(--team-offense)_55%,transparent)]',
    ghost:
      'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)]',
    outline:
      'text-[var(--text-primary)] border border-[var(--glass-border)] bg-[var(--bg-glass)] backdrop-blur hover:border-[color-mix(in_srgb,var(--team-offense)_55%,transparent)] hover:shadow-[0_0_18px_color-mix(in_srgb,var(--team-offense)_28%,transparent)]',
    danger:
      'text-[var(--text-inverse)] font-semibold bg-[var(--state-error)] hover:shadow-[0_0_20px_color-mix(in_srgb,var(--state-error)_50%,transparent)]',
  }

  return (
    <button
      ref={(node) => {
        localRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: 'transform var(--motion-fast) var(--ease-emphasis), box-shadow var(--motion-fast) var(--ease-emphasis), border-color var(--motion-fast)',
      }}
      className={cx(
        'inline-flex touch-target items-center justify-center rounded-full',
        'disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none',
        sizes[size],
        variants[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
})

/* -------------------------------------------------------------------------- */
/* Tautan berbentuk tombol pil                                                */
/* -------------------------------------------------------------------------- */

const LINK_VARIANTS: Record<'primary' | 'outline' | 'ghost', string> = {
  primary:
    'font-semibold text-[var(--text-inverse)] [background:linear-gradient(135deg,var(--team-offense),color-mix(in_srgb,var(--team-offense)_55%,var(--ball)))] hover:shadow-[0_0_24px_color-mix(in_srgb,var(--team-offense)_55%,transparent)]',
  outline:
    'border border-[var(--glass-border)] bg-[var(--bg-glass)] text-[var(--text-primary)] backdrop-blur hover:border-[color-mix(in_srgb,var(--team-offense)_55%,transparent)]',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)] hover:text-[var(--text-primary)]',
}

export function LinkButton({
  href,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
}: {
  href: string
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  className?: string
  children: ReactNode
}) {
  const sizes = { sm: 'h-9 px-3 text-sm gap-1.5', md: 'h-11 px-4 text-sm gap-2', lg: 'h-12 px-6 text-base gap-2' }
  return (
    <Link
      href={href}
      className={cx(
        'inline-flex touch-target items-center justify-center rounded-full transition-[box-shadow,border-color,color,background] duration-fast ease-emphasis',
        sizes[size],
        LINK_VARIANTS[variant],
        className,
      )}
    >
      {icon}
      {children}
    </Link>
  )
}

/* -------------------------------------------------------------------------- */
/* Batang progres                                                             */
/* -------------------------------------------------------------------------- */

export function ProgressBar({
  value,
  max,
  color = 'var(--team-offense)',
  label,
  className,
}: {
  value: number
  max: number
  color?: string
  /** Label pembaca layar, mis. "3 dari 9 pelajaran selesai" */
  label: string
  className?: string
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cx(
        'h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)]',
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-slow ease-emphasis"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }}
      />
    </div>
  )
}

/** Teks dengan `*istilah*` ditampilkan miring — konvensi istilah asing PRD §4. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('*') && p.endsWith('*') && p.length > 2 ? (
          <em key={i} className="text-[var(--text-primary)]">
            {p.slice(1, -1)}
          </em>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

/** Sakelar aksesibel (role="switch") untuk pengaturan. */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  hint?: string
  disabled?: boolean
}) {
  return (
    <label
      className={cx(
        'flex touch-target cursor-pointer items-center justify-between gap-4 py-2',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className="flex flex-col">
        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
        {hint && <span className="text-xs leading-snug text-[var(--text-secondary)]">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-fast',
          checked
            ? 'border-[color-mix(in_srgb,var(--team-offense)_60%,transparent)] bg-[color-mix(in_srgb,var(--team-offense)_30%,transparent)]'
            : 'border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)]',
        )}
      >
        <span
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-[left,background] duration-fast ease-emphasis"
          style={{
            left: checked ? 'calc(100% - 1.375rem)' : '0.125rem',
            background: checked ? 'var(--team-offense)' : 'var(--text-secondary)',
          }}
        />
      </button>
    </label>
  )
}

/* -------------------------------------------------------------------------- */
/* Tombol ikon (kontrol pemutar)                                              */
/* -------------------------------------------------------------------------- */

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, active = false, size = 'md', className, children, ...rest },
  ref,
) {
  const dim = size === 'sm' ? 'h-9 w-9' : size === 'lg' ? 'h-14 w-14' : 'h-11 w-11'
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={rest['aria-pressed'] ?? (active || undefined)}
      className={cx(
        'inline-flex items-center justify-center rounded-full border transition-colors',
        'duration-fast ease-emphasis disabled:cursor-not-allowed disabled:opacity-40',
        dim,
        active
          ? 'border-[color-mix(in_srgb,var(--team-offense)_60%,transparent)] bg-[color-mix(in_srgb,var(--team-offense)_18%,transparent)] text-[var(--team-offense)]'
          : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[color-mix(in_srgb,var(--team-offense)_40%,transparent)] hover:text-[var(--text-primary)]',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})

/* -------------------------------------------------------------------------- */
/* Lencana posisi segi enam                                                   */
/* -------------------------------------------------------------------------- */

export interface HexBadgeProps {
  /** "1".."5" atau "X1".."X5" */
  label: string
  team: 'offense' | 'defense'
  active?: boolean
  disabled?: boolean
  size?: number
  onClick?: () => void
  /** Nama lengkap untuk pembaca layar, mis. "Point Guard" */
  title?: string
}

export function HexBadge({
  label,
  team,
  active = false,
  disabled = false,
  size = 44,
  onClick,
  title,
}: HexBadgeProps) {
  const color = team === 'offense' ? 'var(--team-offense)' : 'var(--team-defense)'
  const interactive = Boolean(onClick) && !disabled

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={interactive ? active : undefined}
      aria-label={title ? `${label} — ${title}` : label}
      title={title ?? label}
      className={cx(
        'relative inline-flex shrink-0 items-center justify-center transition-all',
        'duration-fast ease-emphasis',
        interactive && 'cursor-pointer',
        disabled && 'cursor-not-allowed opacity-40',
        active && 'animate-pulse-halo',
      )}
      style={{
        width: size,
        height: size,
        // Segi enam: bentuk membedakan lencana posisi dari tombol biasa.
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        background: active
          ? `color-mix(in srgb, ${color} 30%, var(--bg-void))`
          : 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
        boxShadow: active ? `inset 0 0 0 2px ${color}, 0 0 18px color-mix(in srgb, ${color} 45%, transparent)` : `inset 0 0 0 1px var(--glass-border)`,
        color: active ? color : 'var(--text-secondary)',
      }}
    >
      <span className="hud text-sm font-bold">{label}</span>
    </button>
  )
}

/**
 * Segi enam dekoratif (bukan tombol) — dipakai di dalam elemen interaktif lain,
 * tempat HexBadge (sebuah <button>) tidak boleh bersarang.
 */
export function HexMark({
  label,
  team = 'offense',
  active = false,
  size = 44,
}: {
  label: string
  team?: 'offense' | 'defense'
  active?: boolean
  size?: number
}) {
  const color = team === 'offense' ? 'var(--team-offense)' : 'var(--team-defense)'
  return (
    <span
      aria-hidden="true"
      className={cx('relative inline-flex shrink-0 items-center justify-center', active && 'animate-pulse-halo')}
      style={{
        width: size,
        height: size,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        background: active
          ? `color-mix(in srgb, ${color} 30%, var(--bg-void))`
          : 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
        boxShadow: active ? `inset 0 0 0 2px ${color}` : 'inset 0 0 0 1px var(--glass-border)',
        color: active ? color : 'var(--text-secondary)',
      }}
    >
      <span className="hud text-sm font-bold">{label}</span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Kartu isyarat (dipakai di panel, bukan di atas lapangan)                   */
/* -------------------------------------------------------------------------- */

export function CueCard({
  kicker,
  children,
  tone = 'ball',
}: {
  kicker: string
  children: ReactNode
  tone?: 'ball' | 'success' | 'error' | 'screen' | 'cut'
}) {
  const tones: Record<string, string> = {
    ball: 'var(--ball)',
    success: 'var(--state-success)',
    error: 'var(--state-error)',
    screen: 'var(--action-screen)',
    cut: 'var(--action-cut)',
  }
  const color = tones[tone] ?? tones.ball

  return (
    <div
      className="glass-flat px-3 py-2.5"
      style={{ borderLeft: `2px solid ${color}`, borderRadius: '4px 14px 14px 4px' }}
    >
      <p className="hud text-xs uppercase tracking-wider" style={{ color }}>
        {kicker}
      </p>
      <div className="mt-1 text-sm leading-snug text-[var(--text-primary)]">{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Lencana kecil (kategori, tingkat, rilis)                                   */
/* -------------------------------------------------------------------------- */

export function Chip({
  children,
  color,
  outline = true,
}: {
  children: ReactNode
  color?: string
  outline?: boolean
}) {
  const c = color ?? 'var(--text-secondary)'
  return (
    <span
      className="hud inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs uppercase tracking-wide"
      style={{
        color: c,
        background: `color-mix(in srgb, ${c} 12%, transparent)`,
        border: outline ? `1px solid color-mix(in srgb, ${c} 35%, transparent)` : 'none',
      }}
    >
      {children}
    </span>
  )
}

/** Indikator tingkat kesulitan 1-5 sebagai lima batang. */
export function LevelMeter({ level, color }: { level: number; color?: string }) {
  const c = color ?? 'var(--team-offense)'
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`Tingkat kesulitan ${level} dari 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: i <= level ? 12 : 7,
            borderRadius: 2,
            background: i <= level ? c : 'color-mix(in srgb, var(--text-secondary) 30%, transparent)',
            transition: 'all var(--motion-fast)',
          }}
        />
      ))}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Judul bagian                                                               */
/* -------------------------------------------------------------------------- */

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="hud text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
        {children}
      </h3>
      {right}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Skeleton memuat (A-20)                                                     */
/* -------------------------------------------------------------------------- */

/** A-20: "Skeleton dengan kilau scanline bergerak." */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        'relative overflow-hidden rounded-lg',
        'bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)]',
        className,
      )}
    >
      <div
        className="absolute inset-x-0 h-1/3 animate-scanline"
        style={{
          background:
            'linear-gradient(180deg, transparent, color-mix(in srgb, var(--line-court) 14%, transparent), transparent)',
        }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Ikon — garis 1,5 px, sudut membulat (PRD §9)                               */
/* -------------------------------------------------------------------------- */

type IconProps = { size?: number; className?: string; style?: React.CSSProperties }

function svgProps(size: number, style?: React.CSSProperties) {
  return {
    style,
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
}

export const Icon = {
  Play: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" stroke="none" />
    </svg>
  ),
  Pause: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="M8 4.5h3.2v15H8zM12.8 4.5H16v15h-3.2z" fill="currentColor" stroke="none" />
    </svg>
  ),
  PrevPhase: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="M18 5.5v13L8.5 12 18 5.5Z" fill="currentColor" stroke="none" />
      <path d="M6 5v14" />
    </svg>
  ),
  NextPhase: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="M6 5.5v13L15.5 12 6 5.5Z" fill="currentColor" stroke="none" />
      <path d="M18 5v14" />
    </svg>
  ),
  Replay: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3 4v4.2h4.2" />
    </svg>
  ),
  Layers: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
      <path d="M3 12.5 12 17l9-4.5" />
      <path d="M3 17 12 21.5 21 17" />
    </svg>
  ),
  Cube: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="M12 2.8 20 7v10l-8 4.2L4 17V7l8-4.2Z" />
      <path d="M4 7l8 4.3L20 7M12 11.3v10" />
    </svg>
  ),
  Fullscreen: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  ),
  Search: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  ),
  Home: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  ),
  Learn: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="M3 6.5 12 3l9 3.5L12 10 3 6.5Z" />
      <path d="M7 9v5c0 1.7 2.2 3 5 3s5-1.3 5-3V9" />
      <path d="M21 7v6" />
    </svg>
  ),
  Court: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
      <path d="M12 4.5v15" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M3 9h3v6H3M21 9h-3v6h3" />
    </svg>
  ),
  Target: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  ),
  Profile: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c1.4-3.6 4.1-5.4 7.5-5.4s6.1 1.8 7.5 5.4" />
    </svg>
  ),
  Coach: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
      <path d="M12 16.5V21M8 21h8" />
      <circle cx="9" cy="9" r="1.4" />
      <path d="m11 11 3-3 3 4" />
    </svg>
  ),
  Studio: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="M4 20 15.5 8.5a2.1 2.1 0 1 1 3 3L7 23H4v-3Z" transform="translate(0 -3)" />
      <path d="M13.5 7.5 16.5 10.5" />
    </svg>
  ),
  Branch: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <circle cx="6" cy="5.5" r="2.2" />
      <circle cx="18" cy="5.5" r="2.2" />
      <circle cx="6" cy="18.5" r="2.2" />
      <path d="M6 7.7v8.6M8.2 5.5h3.3c2.5 0 4.3 1.6 4.3 4.3v0" />
    </svg>
  ),
  Check: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="m4.5 12.5 4.8 4.8L19.5 7" />
    </svg>
  ),
  Lock: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <rect x="4.5" y="10" width="15" height="10" rx="2" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  ),
  Close: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ),
  ChevronRight: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  ),
  ChevronDown: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="m5 9 7 7 7-7" />
    </svg>
  ),
  Bookmark: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="M6 4h12v17l-6-4.2L6 21V4Z" />
    </svg>
  ),
  Flame: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="M12 3c3.2 3.4 5.5 5.9 5.5 9a5.5 5.5 0 1 1-11 0c0-1.6.7-3 2-4.4" />
      <path d="M12 20a2.6 2.6 0 0 0 2.6-2.6c0-1.4-1-2.5-2.6-4.2-1.6 1.7-2.6 2.8-2.6 4.2A2.6 2.6 0 0 0 12 20Z" />
    </svg>
  ),
  Settings: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M4.3 7.6l2 1.2M17.7 15.2l2 1.2M4.3 16.4l2-1.2M17.7 8.8l2-1.2" />
    </svg>
  ),
  Speed: ({ size = 20, className, style }: IconProps) => (
    <svg {...svgProps(size, style)} className={className}>
      <path d="M4 17a8.5 8.5 0 1 1 16 0" />
      <path d="m12 12 4-3" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    </svg>
  ),
}
