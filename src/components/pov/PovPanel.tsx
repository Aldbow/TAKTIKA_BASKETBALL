'use client'

/**
 * Panel POV (kanan, 320 px di desktop) — F-13, fitur pembeda utama produk.
 *
 * PRD §7 tabel "Komponen lensa POV", semua komponen P0 ada di sini:
 *   Panel tugas     : tugas utama (1 kalimat) + CHECKLIST LANGKAH PER FASE YANG
 *                     TERCENTANG OTOMATIS saat fase berjalan
 *   Kartu isyarat   : "Lihat ini" — apa yang harus dibaca
 *   Pohon keputusan : jika-maka per isyarat; tiap cabang bisa diputar
 *
 * Lencana posisi di atas panel adalah cara utama memilih POV (PRD §7 cara kerja
 * butir 1: "Pengguna mengetuk lencana posisi (1-5 atau X1-X5)").
 */

import {
  ROLE_LABEL,
  t as localize,
  playerLabel,
  type PlayerId,
  type PovLens,
  type Tactic,
} from '@/engine'
import { CueCard, HexBadge, Icon, SectionLabel, cx } from '@/components/ui'

export interface PovPanelProps {
  tactic: Tactic
  /** POV terpilih, atau null */
  pov: PlayerId | null
  /** Indeks fase aktif — menentukan langkah mana yang tercentang */
  activePhaseIndex: number
  activeBranches: readonly string[]
  /** Momen keputusan sedang aktif — kartu isyarat ditonjolkan */
  inDecision: boolean
  onSelectPov: (id: PlayerId | null) => void
  onPlayBranch: (branchId: string, group: string) => void
  className?: string
}

export function PovPanel({
  tactic,
  pov,
  activePhaseIndex,
  activeBranches,
  inDecision,
  onSelectPov,
  onPlayBranch,
  className,
}: PovPanelProps) {
  const offense = tactic.players.filter((p) => p.team === 'offense')
  const defense = tactic.players.filter((p) => p.team === 'defense')
  const lens = pov ? tactic.povLenses.find((l) => l.playerId === pov) : undefined
  const lensesById = new Set(tactic.povLenses.map((l) => l.playerId))

  return (
    <div className={cx('scrollable flex flex-col gap-4 p-4', className)}>
      {/* Pemilih lencana posisi */}
      <section className="flex flex-col gap-2.5">
        <SectionLabel
          right={
            pov ? (
              <button
                type="button"
                onClick={() => onSelectPov(null)}
                className="text-xs font-medium text-[var(--text-secondary)] transition-colors duration-fast hover:text-[var(--text-primary)]"
              >
                Keluar POV
              </button>
            ) : undefined
          }
        >
          Mode POV
        </SectionLabel>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="hud w-14 shrink-0 text-[10px] uppercase text-[var(--text-secondary)]">
              Serang
            </span>
            <div className="flex flex-wrap gap-1.5">
              {offense.map((p) => (
                <HexBadge
                  key={p.id}
                  label={playerLabel(p.id)}
                  team="offense"
                  active={pov === p.id}
                  disabled={!lensesById.has(p.id)}
                  size={40}
                  title={p.role ? ROLE_LABEL[p.role] : undefined}
                  onClick={() => onSelectPov(p.id)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="hud w-14 shrink-0 text-[10px] uppercase text-[var(--text-secondary)]">
              Bertahan
            </span>
            <div className="flex flex-wrap gap-1.5">
              {defense.map((p) => (
                <HexBadge
                  key={p.id}
                  label={playerLabel(p.id)}
                  team="defense"
                  active={pov === p.id}
                  disabled={!lensesById.has(p.id)}
                  size={40}
                  title={
                    lensesById.has(p.id)
                      ? p.guards
                        ? `Menjaga ${playerLabel(p.guards)}`
                        : 'Bek zona'
                      : 'Lensa POV bertahan belum tersedia untuk taktik ini'
                  }
                  onClick={() => onSelectPov(p.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="hud text-[10px] leading-relaxed text-[var(--text-secondary)]">
          Tekan 1–5 untuk POV menyerang, Shift+1–5 untuk bek X1–X5.
        </p>
      </section>

      {!lens ? (
        <EmptyPovState tactic={tactic} />
      ) : (
        <LensDetail
          lens={lens}
          tactic={tactic}
          activePhaseIndex={activePhaseIndex}
          activeBranches={activeBranches}
          inDecision={inDecision}
          onPlayBranch={onPlayBranch}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function EmptyPovState({ tactic }: { tactic: Tactic }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[var(--glass-border)] p-4">
      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
        Pilih satu posisi di atas untuk melihat taktik ini dari matanya: tugas
        utama, langkah per fase, isyarat yang dibaca, dan keputusan yang harus
        diambil.
      </p>
      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
        {tactic.category === 'defense'
          ? 'Taktik bertahan punya lima lensa X1–X5.'
          : `Tersedia ${tactic.povLenses.length} lensa posisi menyerang.`}
      </p>
    </div>
  )
}

function LensDetail({
  lens,
  tactic,
  activePhaseIndex,
  activeBranches,
  inDecision,
  onPlayBranch,
}: {
  lens: PovLens
  tactic: Tactic
  activePhaseIndex: number
  activeBranches: readonly string[]
  inDecision: boolean
  onPlayBranch: (branchId: string, group: string) => void
}) {
  const player = tactic.players.find((p) => p.id === lens.playerId)
  const isDefender = lens.playerId.startsWith('X')
  const accent = isDefender ? 'var(--team-defense)' : 'var(--team-offense)'

  // Indeks fase setiap langkah — dipakai menentukan status tercentang.
  const phaseIndexOf = (phaseId: string): number =>
    tactic.phases.findIndex((p) => p.id === phaseId)

  return (
    <>
      {/* Panel tugas */}
      <section className="flex flex-col gap-2">
        <SectionLabel>Tugas utama</SectionLabel>
        <div
          className="rounded-xl p-3"
          style={{
            background: `color-mix(in srgb, ${accent} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
          }}
        >
          <p className="flex items-center gap-2">
            <HexBadge
              label={playerLabel(lens.playerId)}
              team={isDefender ? 'defense' : 'offense'}
              active
              size={34}
            />
            <span className="hud text-xs uppercase tracking-wider" style={{ color: accent }}>
              {player?.role ? ROLE_LABEL[player.role] : isDefender ? 'Bek' : 'Penyerang'}
            </span>
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--text-primary)]">
            {localize(lens.mission)}
          </p>
        </div>
      </section>

      {/* Checklist langkah per fase — tercentang otomatis */}
      {lens.steps.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionLabel>Langkah per fase</SectionLabel>
          <ol className="flex flex-col gap-1">
            {lens.steps.map((step, i) => {
              const idx = phaseIndexOf(step.phaseId)
              const done = idx >= 0 && idx < activePhaseIndex
              const current = idx === activePhaseIndex
              return (
                <li
                  key={`${step.phaseId}-${i}`}
                  className={cx(
                    'flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors duration-base',
                    current && 'bg-[color-mix(in_srgb,var(--text-primary)_7%,transparent)]',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-base"
                    style={{
                      borderColor: done || current ? accent : 'var(--glass-border)',
                      background: done ? accent : 'transparent',
                    }}
                  >
                    {done && <Icon.Check size={11} className="text-[var(--text-inverse)]" />}
                  </span>
                  <span
                    className={cx(
                      'text-xs leading-relaxed',
                      current
                        ? 'font-medium text-[var(--text-primary)]'
                        : done
                          ? 'text-[var(--text-secondary)]'
                          : 'text-[var(--text-secondary)] opacity-70',
                    )}
                  >
                    {localize(step.text)}
                  </span>
                  <span className="sr-only">
                    {done ? '(selesai)' : current ? '(fase sekarang)' : '(belum)'}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* Kartu isyarat */}
      {lens.cues.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionLabel>Isyarat yang dibaca</SectionLabel>
          <div className={cx('flex flex-col gap-2', inDecision && 'animate-rise-in')}>
            {lens.cues.map((cue, i) => (
              <CueCard key={i} kicker="Lihat ini" tone="ball">
                {localize(cue)}
              </CueCard>
            ))}
          </div>
        </section>
      )}

      {/* Pohon keputusan jika-maka */}
      {lens.decisions.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionLabel>Pohon keputusan</SectionLabel>
          <ul className="flex flex-col gap-1.5">
            {lens.decisions.map((d, i) => {
              const playing = d.branchId ? activeBranches.includes(d.branchId) : false
              return (
                <li
                  key={i}
                  className="rounded-xl border p-2.5 transition-colors duration-fast"
                  style={{
                    borderColor: playing
                      ? `color-mix(in srgb, ${accent} 55%, transparent)`
                      : 'var(--glass-border)',
                    background: playing
                      ? `color-mix(in srgb, ${accent} 8%, transparent)`
                      : undefined,
                  }}
                >
                  <p className="text-xs leading-relaxed">
                    <span className="hud mr-1.5 text-[10px] uppercase text-[var(--text-secondary)]">
                      Jika
                    </span>
                    <span className="text-[var(--text-primary)]">{localize(d.ifCue)}</span>
                  </p>
                  <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed">
                    <Icon.ChevronRight size={13} className="mt-0.5 shrink-0" style={{ color: accent }} />
                    <span className="font-medium text-[var(--text-primary)]">
                      {localize(d.thenDo)}
                    </span>
                  </p>
                  {d.branchId && (
                    <button
                      type="button"
                      onClick={() => {
                        const branch = tactic.branches.find((b) => b.id === d.branchId)
                        onPlayBranch(d.branchId as string, branch?.group ?? '')
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium transition-colors duration-fast"
                      style={{ color: playing ? accent : 'var(--text-secondary)' }}
                    >
                      <Icon.Branch size={12} />
                      {playing ? 'Sedang diputar' : 'Putar cabang ini'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Panggilan suara */}
      {lens.calls.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionLabel>Panggilan suara</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {lens.calls.map((call) => (
              <span
                key={call}
                className="hud rounded-full px-2.5 py-1 text-xs font-bold"
                style={{
                  color: 'var(--action-screen)',
                  background: 'color-mix(in srgb, var(--action-screen) 14%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--action-screen) 40%, transparent)',
                }}
              >
                {call}
              </span>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
            Kata-kata ini harus diteriakkan, bukan dipikirkan. Pertahanan yang
            diam hampir selalu terlambat satu umpan.
          </p>
        </section>
      )}

      {/* Kesalahan umum khusus posisi */}
      {lens.mistakes.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionLabel>Kesalahan umum posisi ini</SectionLabel>
          <ul className="flex flex-col gap-1">
            {lens.mistakes.map((m, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs leading-relaxed text-[var(--text-secondary)]"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 block shrink-0 rounded-full"
                  style={{ width: 5, height: 5, background: 'var(--state-error)' }}
                />
                {localize(m)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
