'use client'

/**
 * Area Pelatih — muncul di menu bila peran onboarding = pelatih (PRD §11).
 *
 * Yang sudah bisa dipakai sekarang:
 *   - Tactic Viewer layar penuh + pintasan keyboard (dasar Mode Presentasi F-21)
 *   - Pembuat deep link ke fase & POV tertentu (F-16) untuk dikirim ke grup tim
 *     (PRD §12 Alur 4 langkah 5)
 * Playbook Builder (F-22) dan Playbook tim (F-23) adalah fase 3.
 */

import { useMemo, useState } from 'react'

import { playerLabel, t as localize, type Tactic } from '@/engine'
import { track } from '@/lib/analytics'
import { Icon, LinkButton, PillButton, SectionLabel } from '@/components/ui'

const SHORTCUTS: [string, string][] = [
  ['F', 'Layar penuh'],
  ['Spasi', 'Putar / jeda'],
  ['← / →', 'Fase sebelumnya / berikutnya'],
  ['Shift + ← / →', 'Geser 1 detik'],
  ['1–5', 'POV posisi menyerang'],
  ['Shift + 1–5', 'POV bek X1–X5'],
  ['[ dan ]', 'Turunkan / naikkan kecepatan'],
  ['L', 'Menu lapisan visual'],
]

export function CoachArea({ tactics }: { tactics: Tactic[] }) {
  const [tacticId, setTacticId] = useState(tactics[0]?.id ?? '')
  const tactic = tactics.find((t) => t.id === tacticId) ?? tactics[0]
  const [phase, setPhase] = useState(0)
  const [pov, setPov] = useState('')
  const [copied, setCopied] = useState(false)

  const path = useMemo(() => {
    if (!tactic) return ''
    const q = new URLSearchParams()
    if (phase > 0) q.set('fase', String(phase))
    if (pov) q.set('pov', pov)
    const qs = q.toString()
    return `/taktik/${tactic.slug}${qs ? `?${qs}` : ''}`
  }, [phase, pov, tactic])

  if (!tactic) return null

  const copy = async () => {
    const url = `${window.location.origin}${path}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
    track({
      name: 'share_link_created',
      tactic_id: tactic.id,
      phase: phase > 0 ? phase : null,
      pov: pov || null,
    })
  }

  const selectClass =
    'w-full rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)]'

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6 p-4 tablet:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Area Pelatih</h1>
        <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--text-secondary)]">
          Jelaskan taktik di depan tim tanpa menggambar ulang: buka taktik di laptop yang tersambung ke
          proyektor, tekan F, lalu tunjukkan tugas tiap posisi dengan tombol 1–5.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <SectionLabel>Tautan ke fase &amp; POV tertentu</SectionLabel>
        <div className="grid gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] p-4 tablet:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-[var(--text-secondary)]">Taktik</span>
            <select
              className={selectClass}
              value={tactic.id}
              onChange={(e) => {
                setTacticId(e.target.value)
                setPhase(0)
                setPov('')
              }}
            >
              {tactics.map((t) => (
                <option key={t.id} value={t.id}>
                  {localize(t.title)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-[var(--text-secondary)]">Mulai di fase</span>
            <select className={selectClass} value={phase} onChange={(e) => setPhase(Number(e.target.value))}>
              <option value={0}>Dari awal</option>
              {tactic.phases.map((p, i) => (
                <option key={p.id} value={i + 1}>
                  {i + 1}. {localize(p.title)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-[var(--text-secondary)]">POV</span>
            <select className={selectClass} value={pov} onChange={(e) => setPov(e.target.value)}>
              <option value="">Tanpa POV (kamera taktis)</option>
              {tactic.povLenses.map((l) => (
                <option key={l.playerId} value={l.playerId}>
                  Posisi {playerLabel(l.playerId)} — {localize(l.mission).slice(0, 48)}
                  {localize(l.mission).length > 48 ? '…' : ''}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-2 tablet:col-span-3">
            <code className="hud block overflow-x-auto rounded-lg bg-[var(--bg-void)] px-3 py-2 text-xs text-[var(--team-offense)]">
              {path}
            </code>
            <div className="flex flex-wrap gap-2">
              <PillButton size="sm" onClick={copy} icon={<Icon.Check size={14} />}>
                {copied ? 'Tersalin' : 'Salin tautan'}
              </PillButton>
              <LinkButton href={path} variant="outline" size="sm" icon={<Icon.Play size={14} />}>
                Buka
              </LinkButton>
            </div>
            <span className="sr-only" role="status">
              {copied ? 'Tautan tersalin ke papan klip' : ''}
            </span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>Pintasan saat presentasi</SectionLabel>
        <div className="overflow-x-auto rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)]">
          <table className="w-full text-sm">
            <tbody>
              {SHORTCUTS.map(([key, action]) => (
                <tr key={key} className="border-b border-[var(--glass-border)] last:border-b-0">
                  <td className="w-40 px-4 py-2.5">
                    <kbd className="hud rounded-md border border-[var(--glass-border)] px-2 py-0.5 text-xs text-[var(--text-primary)]">
                      {key}
                    </kbd>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text-secondary)]">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Ruangan terang? Ganti ke tema Papan Tulis di Profil → Pengaturan.
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-dashed border-[var(--glass-border)] p-5">
        <SectionLabel>Segera</SectionLabel>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          Laser pointer dan coretan tangan di Mode Presentasi (fase 2), Playbook Builder untuk membuat
          taktik sendiri, dan playbook tim dengan tautan baca-saja (fase 3).
        </p>
      </section>
    </div>
  )
}
