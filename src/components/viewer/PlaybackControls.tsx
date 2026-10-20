'use client'

/**
 * Kendali pemutaran — F-10: "putar, jeda, maju/mundur per fase, geser timeline,
 * kecepatan 0,25x-2x, ulang fase."
 *
 * Setiap tombol punya pintasan keyboard yang ditampilkan di tooltip-nya, supaya
 * pengguna menemukan pintasan tanpa membaca dokumentasi (PRD §11 tabel pintasan).
 */

import { SPEED_STEPS, type PlaybackSpeed } from '@/engine/runtime'
import { speedLabel } from '@/lib/format'
import { Icon, IconButton, cx } from '@/components/ui'

export interface PlaybackControlsProps {
  playing: boolean
  speed: PlaybackSpeed
  bulletTime: boolean
  onToggle: () => void
  onStepPhase: (dir: 1 | -1) => void
  onReplayPhase: () => void
  onSetSpeed: (speed: PlaybackSpeed) => void
  /** Kontrol tambahan di kanan (lapisan, 3D, layar penuh) */
  extras?: React.ReactNode
  compact?: boolean
  className?: string
}

export function PlaybackControls({
  playing,
  speed,
  bulletTime,
  onToggle,
  onStepPhase,
  onReplayPhase,
  onSetSpeed,
  extras,
  compact = false,
  className,
}: PlaybackControlsProps) {
  return (
    <div className={cx('flex items-center gap-2', className)}>
      <IconButton
        label={playing ? 'Jeda (Spasi)' : 'Putar (Spasi)'}
        onClick={onToggle}
        size={compact ? 'md' : 'lg'}
        className="border-[color-mix(in_srgb,var(--team-offense)_45%,transparent)] bg-[color-mix(in_srgb,var(--team-offense)_16%,transparent)] text-[var(--team-offense)]"
      >
        {playing ? <Icon.Pause size={compact ? 18 : 22} /> : <Icon.Play size={compact ? 18 : 22} />}
      </IconButton>

      <IconButton label="Fase sebelumnya (panah kiri)" onClick={() => onStepPhase(-1)} size="md">
        <Icon.PrevPhase size={18} />
      </IconButton>

      <IconButton label="Fase berikutnya (panah kanan)" onClick={() => onStepPhase(1)} size="md">
        <Icon.NextPhase size={18} />
      </IconButton>

      <IconButton label="Ulang fase ini" onClick={onReplayPhase} size="md">
        <Icon.Replay size={18} />
      </IconButton>

      {/* Pemilih kecepatan */}
      <div
        className="ml-1 flex items-center gap-1 rounded-full border border-[var(--glass-border)] p-0.5"
        role="radiogroup"
        aria-label="Kecepatan pemutaran"
      >
        {!compact && (
          <Icon.Speed size={15} className="ml-1.5 shrink-0 text-[var(--text-secondary)]" />
        )}
        {SPEED_STEPS.filter((s) => (compact ? [0.25, 0.5, 1, 2].includes(s) : true)).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={speed === s}
            onClick={() => onSetSpeed(s)}
            title={
              s === 0.25
                ? 'Kecepatan 0,25x — gunakan [ dan ] untuk mengubah'
                : `Kecepatan ${speedLabel(s)}`
            }
            className={cx(
              'hud rounded-full px-2 py-1 text-[11px] tabular-nums transition-colors duration-fast',
              speed === s
                ? 'bg-[color-mix(in_srgb,var(--team-offense)_20%,transparent)] text-[var(--team-offense)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {speedLabel(s)}
          </button>
        ))}
      </div>

      {/* Penanda bullet time — menjelaskan mengapa animasi tiba-tiba melambat */}
      <span
        aria-live="polite"
        className={cx(
          'hud hidden shrink-0 rounded-full px-2 py-1 text-[10px] uppercase tracking-wider transition-opacity duration-base tablet:block',
          bulletTime ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        style={{
          color: 'var(--ball)',
          background: 'color-mix(in srgb, var(--ball) 14%, transparent)',
          border: '1px solid color-mix(in srgb, var(--ball) 40%, transparent)',
        }}
      >
        {bulletTime ? 'Momen keputusan · 0,3x' : ''}
      </span>

      {extras && <div className="ml-auto flex items-center gap-2">{extras}</div>}
    </div>
  )
}
