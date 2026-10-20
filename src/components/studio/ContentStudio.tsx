'use client'

/**
 * Studio Konten (internal) — F-27, versi awal: validator.
 *
 * PRD §8 F-27: "Sistem menolak penyimpanan bila ada pemain yang berpindah tanpa
 * jalur, fase tanpa durasi, atau POV tanpa tugas utama." Aturan itu sudah ada
 * di Tactic Engine (validateTactic); halaman ini menjalankannya pada semua
 * taktik terbit dan pada JSON yang ditempel penulis konten.
 *
 * Editor keyframe visual belum dibangun.
 */

import Link from 'next/link'
import { useState } from 'react'

import { validateTactic, type Tactic, type ValidationIssue } from '@/engine'
import { Chip, Icon, PillButton, SectionLabel, cx } from '@/components/ui'

/** Ringkasan validasi satu taktik — dihitung di server (lihat app/studio/page.tsx). */
export interface StudioRow {
  id: string
  slug: string
  title: string
  status: string
  version: number
  counts: string
  errors: number
  warnings: number
}

export function ContentStudio({ rows }: { rows: StudioRow[] }) {
  const [raw, setRaw] = useState('')
  const [checked, setChecked] = useState<
    { ok: boolean; issues: ValidationIssue[]; parseError?: string } | null
  >(null)

  const check = () => {
    try {
      const parsed: unknown = JSON.parse(raw)
      const r = validateTactic(parsed as Tactic)
      setChecked({ ok: r.ok, issues: r.issues })
    } catch (e) {
      setChecked({ ok: false, issues: [], parseError: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 p-4 tablet:p-6">
      <header className="flex flex-col gap-2">
        <Link href="/dashboard" className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <Icon.ChevronRight size={12} className="rotate-180" /> Kembali ke aplikasi
        </Link>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Studio Konten</h1>
        <p className="max-w-[70ch] text-sm leading-relaxed text-[var(--text-secondary)]">
          Alat internal penulis konten. Validator memakai aturan Tactic Engine yang sama dengan aplikasi:
          jalur tanpa celah, fase tanpa tumpang tindih, bola dimiliki satu pemain, lima lensa POV, dan
          kecepatan pemain maksimal 8 m/s. Editor keyframe visual belum tersedia.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <SectionLabel>Taktik terbit</SectionLabel>
        <div className="overflow-x-auto rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)]">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[var(--glass-border)] text-left text-xs text-[var(--text-secondary)]">
                <th className="px-4 py-2.5 font-medium">Taktik</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Fase · Event · Cabang · POV</th>
                <th className="px-4 py-2.5 font-medium">Validasi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--glass-border)] last:border-b-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/taktik/${r.slug}`} className="font-medium text-[var(--text-primary)] hover:text-[var(--team-offense)]">
                      {r.title}
                    </Link>
                    <p className="hud text-[10px] text-[var(--text-secondary)]">
                      {r.id} · v{r.version}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <Chip>{r.status}</Chip>
                  </td>
                  <td className="hud px-4 py-2.5 text-xs text-[var(--text-secondary)]">{r.counts}</td>
                  <td className="px-4 py-2.5">
                    {r.errors === 0 ? (
                      <Chip color="var(--state-success)">Lolos{r.warnings ? ` · ${r.warnings} peringatan` : ''}</Chip>
                    ) : (
                      <Chip color="var(--state-error)">{r.errors} galat</Chip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>Validasi JSON taktik</SectionLabel>
        <textarea
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value)
            setChecked(null)
          }}
          rows={10}
          spellCheck={false}
          placeholder='Tempel isi berkas content/tactics/*.json di sini, mis. { "id": "set-baru", ... }'
          aria-label="JSON taktik"
          className="hud w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-void)] p-3 text-xs text-[var(--text-primary)] outline-none focus:border-[color-mix(in_srgb,var(--team-offense)_55%,transparent)]"
        />
        <PillButton onClick={check} disabled={raw.trim() === ''} className="self-start">
          Validasi
        </PillButton>

        {checked && (
          <div className="flex flex-col gap-2" role="status">
            {checked.parseError ? (
              <p className="text-sm text-[var(--state-error)]">JSON tidak valid: {checked.parseError}</p>
            ) : checked.ok ? (
              <p className="text-sm text-[var(--state-success)]">
                Lolos validasi{checked.issues.length ? ` dengan ${checked.issues.length} peringatan` : ''}.
              </p>
            ) : (
              <p className="text-sm text-[var(--state-error)]">Ditolak — perbaiki galat di bawah sebelum disimpan.</p>
            )}
            {checked.issues.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {checked.issues.map((issue, i) => (
                  <li
                    key={i}
                    className={cx(
                      'rounded-lg border px-3 py-2 text-xs',
                      issue.severity === 'error'
                        ? 'border-[color-mix(in_srgb,var(--state-error)_45%,transparent)]'
                        : 'border-[color-mix(in_srgb,var(--state-warn)_45%,transparent)]',
                    )}
                  >
                    <span className="hud text-[var(--text-secondary)]">{issue.path ?? issue.code}</span>
                    <p className="text-[var(--text-primary)]">{issue.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
