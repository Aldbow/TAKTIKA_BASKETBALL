'use client'

/**
 * Menu lapisan — F-11: "Nyala/mati: jalur gerak, jalur umpan, screen, bek,
 * jejak, zona spacing, label, kerucut pandang bek."
 *
 * Dibuka dengan tombol L (PRD §11 pintasan keyboard). Setiap lapisan menyebut
 * ID animasi PRD yang diwujudkannya, supaya penulis konten dan QA bisa
 * mencocokkan apa yang terlihat dengan spesifikasinya.
 */

import { useEffect, useRef } from 'react'

import { LAYER_META, type LayerFlags } from '@/renderer2d/types'
import { Icon, cx } from '@/components/ui'

export interface LayersMenuProps {
  layers: LayerFlags
  onToggle: (key: keyof LayerFlags) => void
  onClose: () => void
  /** Lapisan yang tidak tersedia pada taktik ini, dengan alasannya */
  disabled?: Partial<Record<keyof LayerFlags, string>>
}

export function LayersMenu({ layers, onToggle, onClose, disabled = {} }: LayersMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  // Fokus masuk ke menu saat dibuka, dan Escape menutupnya — pola dialog
  // sederhana yang tetap bisa dipakai keyboard saja (PRD §15).
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button, input')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    // Ditunda satu frame agar klik yang MEMBUKA menu tidak langsung menutupnya.
    const id = requestAnimationFrame(() => document.addEventListener('mousedown', onDown))
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener('mousedown', onDown)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Lapisan visual"
      className="glass-flat animate-rise-in absolute bottom-full right-0 z-50 mb-2 w-[280px] p-2 shadow-glass"
    >
      <div className="flex items-center justify-between px-2 py-1">
        <h3 className="hud text-xs uppercase tracking-wider text-[var(--text-secondary)]">
          Lapisan visual
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup menu lapisan"
          className="rounded p-1 text-[var(--text-secondary)] transition-colors duration-fast hover:text-[var(--text-primary)]"
        >
          <Icon.Close size={14} />
        </button>
      </div>

      <ul className="flex flex-col">
        {LAYER_META.map(({ key, label, hint, anim }) => {
          const reason = disabled[key]
          const checked = layers[key]
          return (
            <li key={key}>
              <label
                className={cx(
                  'flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 transition-colors duration-fast',
                  reason
                    ? 'cursor-not-allowed opacity-45'
                    : 'hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)]',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={Boolean(reason)}
                  onChange={() => onToggle(key)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--team-offense)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm text-[var(--text-primary)]">{label}</span>
                    {anim && (
                      <span className="hud text-[9px] text-[var(--text-secondary)] opacity-60">
                        {anim}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-[var(--text-secondary)]">
                    {reason ?? hint}
                  </span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
