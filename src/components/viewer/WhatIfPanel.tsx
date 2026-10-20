'use client'

/**
 * Panel "Bagaimana jika" — F-14.
 *
 * Kriteria penerimaan F-14 (PRD §8):
 *   "Diberikan PnR sedang diputar, ketika pengguna mengganti coverage dari Drop
 *    ke Switch, maka pemain bergerak dari posisi saat ini ke jalur cabang baru
 *    dalam transisi 400-600 ms, tanpa kembali ke awal."
 *   "Label coverage aktif dan counter serangan yang disarankan langsung
 *    diperbarui di panel."
 *
 * Komponen ini hanya menyetel cabang aktif; engine (branch.ts) yang menjaga
 * waktu tidak tersentuh, dan TacticViewer yang menganimasikan blend-nya.
 *
 * Catatan konten: coverage bawaan sebuah taktik (biasanya drop) adalah keadaan
 * DASAR tanpa cabang aktif. Karena itu pilihan pertama di grup coverage selalu
 * "bawaan" yang menonaktifkan grup — bukan cabang duplikat.
 */

import { t as localize, type Branch, type Tactic } from '@/engine/runtime'
import { Icon, SectionLabel, cx } from '@/components/ui'

const GROUP_META: Record<
  string,
  { title: string; hint: string; baseLabel: string; baseHint: string; color: string }
> = {
  coverage: {
    title: 'Coverage pertahanan',
    hint: 'Ganti cara lawan bertahan. Animasi bercabang dari posisi saat ini — taktik tidak dimulai ulang.',
    baseLabel: 'Drop (bawaan)',
    baseHint: 'Bek big mundur ke paint setinggi garis lemparan bebas.',
    color: 'var(--team-defense)',
  },
  outcome: {
    title: 'Pilihan akhir',
    hint: 'Lihat akibat dari setiap keputusan di momen read.',
    baseLabel: 'Pilihan bawaan',
    baseHint: 'Jalur yang dipilih taktik ini secara bawaan.',
    color: 'var(--ball)',
  },
  mistake: {
    title: 'Peragaan kesalahan',
    hint: 'Putar versi salahnya untuk melihat akibat yang sebenarnya.',
    baseLabel: 'Eksekusi benar',
    baseHint: 'Jalankan taktik seperti seharusnya.',
    color: 'var(--state-error)',
  },
}

export interface WhatIfPanelProps {
  tactic: Tactic
  activeBranches: readonly string[]
  onSetBranch: (branchId: string | null, group: string) => void
  className?: string
}

export function WhatIfPanel({
  tactic,
  activeBranches,
  onSetBranch,
  className,
}: WhatIfPanelProps) {
  // Kelompokkan cabang menurut grupnya, dengan urutan yang stabil.
  const groups = new Map<string, Branch[]>()
  for (const b of tactic.branches) {
    const key = b.group ?? 'outcome'
    const list = groups.get(key)
    if (list) list.push(b)
    else groups.set(key, [b])
  }
  const ordered = ['coverage', 'outcome', 'mistake'].filter((g) => groups.has(g))
  for (const key of groups.keys()) {
    if (!ordered.includes(key)) ordered.push(key)
  }

  // Counter yang disarankan untuk cabang aktif — ditampilkan langsung (F-14).
  const activeCounters = activeBranches
    .map((id) => tactic.branches.find((b) => b.id === id))
    .filter((b): b is Branch => Boolean(b?.counter))

  return (
    <div className={cx('scrollable flex flex-col gap-5 p-4', className)}>
      <header className="flex flex-col gap-1">
        <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
          Bagaimana jika?
        </h2>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          Ganti respon pertahanan atau pilihan akhir. Animasi bercabang dari
          frame saat ini, bukan dari awal.
        </p>
      </header>

      {ordered.map((group) => {
        const meta = GROUP_META[group] ?? {
          title: group,
          hint: '',
          baseLabel: 'Bawaan',
          baseHint: '',
          color: 'var(--team-offense)',
        }
        const branches = groups.get(group) ?? []
        const active = branches.find((b) => activeBranches.includes(b.id)) ?? null

        return (
          <section key={group} className="flex flex-col gap-2">
            <SectionLabel>{meta.title}</SectionLabel>
            <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">{meta.hint}</p>

            <div role="radiogroup" aria-label={meta.title} className="flex flex-col gap-1.5">
              {/* Opsi "bawaan" = tidak ada cabang aktif di grup ini */}
              <BranchOption
                label={meta.baseLabel}
                hint={meta.baseHint}
                color={meta.color}
                active={active === null}
                onSelect={() => onSetBranch(null, group)}
              />
              {branches.map((b) => (
                <BranchOption
                  key={b.id}
                  label={localize(b.label)}
                  hint={b.counter ? localize(b.counter) : undefined}
                  outcome={b.outcome}
                  color={meta.color}
                  active={active?.id === b.id}
                  onSelect={() => onSetBranch(b.id, group)}
                />
              ))}
            </div>
          </section>
        )
      })}

      {/* Counter serangan yang disarankan — diperbarui langsung */}
      {activeCounters.length > 0 && (
        <section className="flex flex-col gap-2" aria-live="polite">
          <SectionLabel>Counter yang disarankan</SectionLabel>
          {activeCounters.map((b) => (
            <div
              key={b.id}
              className="rounded-xl p-3"
              style={{
                background: 'color-mix(in srgb, var(--team-offense) 9%, transparent)',
                border: '1px solid color-mix(in srgb, var(--team-offense) 35%, transparent)',
              }}
            >
              <p className="hud text-[10px] uppercase tracking-wider text-[var(--team-offense)]">
                Melawan {localize(b.label)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--text-primary)]">
                {localize(b.counter!)}
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

const OUTCOME_LABEL: Record<string, { text: string; color: string }> = {
  score: { text: 'Mencetak angka', color: 'var(--state-success)' },
  'good-look': { text: 'Peluang bagus', color: 'var(--state-success)' },
  contested: { text: 'Di-contest', color: 'var(--state-warn)' },
  turnover: { text: 'Kehilangan bola', color: 'var(--state-error)' },
  reset: { text: 'Serangan di-reset', color: 'var(--text-secondary)' },
}

function BranchOption({
  label,
  hint,
  outcome,
  color,
  active,
  onSelect,
}: {
  label: string
  hint?: string
  outcome?: string
  color: string
  active: boolean
  onSelect: () => void
}) {
  const outcomeMeta = outcome ? OUTCOME_LABEL[outcome] : undefined

  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cx(
        'w-full rounded-xl border p-2.5 text-left transition-all duration-fast ease-emphasis',
        active
          ? 'shadow-[0_0_16px_color-mix(in_srgb,var(--team-offense)_18%,transparent)]'
          : 'border-[var(--glass-border)] hover:border-[color-mix(in_srgb,var(--text-primary)_18%,transparent)]',
      )}
      style={
        active
          ? {
              borderColor: `color-mix(in srgb, ${color} 60%, transparent)`,
              background: `color-mix(in srgb, ${color} 10%, transparent)`,
            }
          : undefined
      }
    >
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-fast"
          style={{ borderColor: active ? color : 'var(--glass-border)' }}
        >
          {active && (
            <span
              className="block rounded-full"
              style={{ width: 8, height: 8, background: color }}
            />
          )}
        </span>
        <span
          className={cx(
            'min-w-0 flex-1 text-sm',
            active ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-primary)]',
          )}
        >
          {label}
        </span>
        {outcomeMeta && (
          <span
            className="hud shrink-0 rounded px-1.5 py-0.5 text-[9px] uppercase"
            style={{
              color: outcomeMeta.color,
              background: `color-mix(in srgb, ${outcomeMeta.color} 14%, transparent)`,
            }}
          >
            {outcomeMeta.text}
          </span>
        )}
        {active && <Icon.Play size={12} style={{ color }} />}
      </span>
      {hint && (
        <span className="mt-1 block pl-6 text-[11px] leading-relaxed text-[var(--text-secondary)]">
          {hint}
        </span>
      )}
    </button>
  )
}
