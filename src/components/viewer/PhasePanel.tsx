'use client'

/**
 * Panel fase (kiri, 280 px di desktop) — PRD §11 tata letak Tactic Viewer.
 *
 * Menampilkan ringkasan taktik, daftar fase dengan narasinya, kesalahan umum,
 * dan counter bertahan — butir 1, 3, 5, dan 6 dari anatomi halaman taktik
 * PRD §6. Mengetuk kesalahan atau counter memutar cabang peraganya, sehingga
 * teks tidak pernah berdiri sendiri tanpa animasi.
 */

import { CATEGORY_LABEL, CATEGORY_TOKEN, t as localize, type Tactic } from '@/engine'
import { seconds } from '@/lib/format'
import { Chip, Icon, LevelMeter, SectionLabel, cx } from '@/components/ui'

export interface PhasePanelProps {
  tactic: Tactic
  activePhaseIndex: number
  /** Cabang yang sedang aktif — untuk menandai kesalahan/counter yang diputar */
  activeBranches: readonly string[]
  onJumpToPhase: (index: number) => void
  onPlayBranch: (branchId: string, group: string) => void
  className?: string
}

export function PhasePanel({
  tactic,
  activePhaseIndex,
  activeBranches,
  onJumpToPhase,
  onPlayBranch,
  className,
}: PhasePanelProps) {
  const accent = CATEGORY_TOKEN[tactic.category]

  return (
    <div className={cx('scrollable flex flex-col gap-5 p-4', className)}>
      {/* 1. Ringkasan */}
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Chip color={accent}>{CATEGORY_LABEL[tactic.category]}</Chip>
          <LevelMeter level={tactic.level} color={accent} />
          <span className="hud text-[11px] text-[var(--text-secondary)]">
            Tingkat {tactic.level}/5
          </span>
        </div>
        <h1 className="font-display text-xl font-bold leading-tight text-[var(--text-primary)]">
          {localize(tactic.title)}
        </h1>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {localize(tactic.summary)}
        </p>
        <p className="text-sm leading-relaxed">
          <span className="hud text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
            Kapan dipakai
          </span>
          <br />
          <span className="text-[var(--text-primary)]">{localize(tactic.whenToUse)}</span>
        </p>
      </header>

      {/* 3. Fase */}
      <section className="flex flex-col gap-2">
        <SectionLabel>Fase ({tactic.phases.length})</SectionLabel>
        <ol className="flex flex-col gap-1.5">
          {tactic.phases.map((p, i) => {
            const active = i === activePhaseIndex
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onJumpToPhase(i)}
                  aria-current={active ? 'step' : undefined}
                  className={cx(
                    'w-full rounded-xl border p-2.5 text-left transition-colors duration-fast',
                    active
                      ? 'bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)]'
                      : 'border-transparent hover:bg-[color-mix(in_srgb,var(--text-primary)_4%,transparent)]',
                  )}
                  style={
                    active
                      ? { borderColor: `color-mix(in srgb, ${accent} 45%, transparent)` }
                      : undefined
                  }
                >
                  <span className="flex items-baseline gap-2">
                    <span
                      className="hud shrink-0 text-xs font-bold"
                      style={{ color: active ? accent : 'var(--text-secondary)' }}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--text-primary)]">
                      {localize(p.title)}
                    </span>
                    <span className="hud shrink-0 text-[10px] tabular-nums text-[var(--text-secondary)]">
                      {seconds(p.tEnd - p.tStart)}
                    </span>
                  </span>
                  {p.narration && (
                    <span
                      className={cx(
                        'mt-1 block text-xs leading-relaxed',
                        active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
                      )}
                    >
                      {localize(p.narration)}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      </section>

      {/* 6. Kesalahan umum */}
      {tactic.mistakes.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionLabel>Kesalahan umum</SectionLabel>
          <ul className="flex flex-col gap-1.5">
            {tactic.mistakes.map((m) => {
              const playing = m.branchId ? activeBranches.includes(m.branchId) : false
              return (
                <li
                  key={m.id}
                  className="rounded-xl border border-[var(--glass-border)] p-2.5"
                  style={
                    playing
                      ? {
                          borderColor: 'color-mix(in srgb, var(--state-error) 55%, transparent)',
                          background: 'color-mix(in srgb, var(--state-error) 8%, transparent)',
                        }
                      : undefined
                  }
                >
                  <p className="flex items-start gap-1.5 text-sm font-medium text-[var(--text-primary)]">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 block shrink-0 rounded-full"
                      style={{ width: 6, height: 6, background: 'var(--state-error)' }}
                    />
                    {localize(m.title)}
                  </p>
                  <p className="mt-1 pl-[13px] text-xs leading-relaxed text-[var(--text-secondary)]">
                    {localize(m.why)}
                  </p>
                  {m.branchId && (
                    <button
                      type="button"
                      onClick={() => onPlayBranch(m.branchId as string, 'mistake')}
                      className="mt-1.5 ml-[13px] inline-flex items-center gap-1 text-xs font-medium transition-colors duration-fast"
                      style={{ color: playing ? 'var(--state-error)' : 'var(--text-secondary)' }}
                    >
                      <Icon.Play size={12} />
                      {playing ? 'Sedang diputar' : 'Lihat animasi salahnya'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* 5. Counter bertahan */}
      {tactic.counters.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionLabel>Counter bertahan</SectionLabel>
          <ul className="flex flex-col gap-2">
            {tactic.counters.map((c) => {
              const playing = c.branchId ? activeBranches.includes(c.branchId) : false
              return (
                <li key={c.id} className="rounded-xl border border-[var(--glass-border)] p-2.5">
                  <p className="text-xs leading-relaxed">
                    <span
                      className="hud mr-1.5 text-[10px] uppercase"
                      style={{ color: 'var(--team-defense)' }}
                    >
                      Lawan
                    </span>
                    <span className="text-[var(--text-primary)]">{localize(c.defense)}</span>
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed">
                    <span
                      className="hud mr-1.5 text-[10px] uppercase"
                      style={{ color: 'var(--team-offense)' }}
                    >
                      Respon
                    </span>
                    <span className="text-[var(--text-primary)]">{localize(c.response)}</span>
                  </p>
                  {c.branchId && (
                    <button
                      type="button"
                      onClick={() => onPlayBranch(c.branchId as string, 'coverage')}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium transition-colors duration-fast"
                      style={{ color: playing ? 'var(--team-offense)' : 'var(--text-secondary)' }}
                    >
                      <Icon.Play size={12} />
                      {playing ? 'Sedang diputar' : 'Putar counter ini'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* 10. Asal-usul */}
      {tactic.origin && (
        <section className="flex flex-col gap-2">
          <SectionLabel>Asal-usul</SectionLabel>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {localize(tactic.origin)}
          </p>
        </section>
      )}
    </div>
  )
}
