/**
 * Label & pembantu teks — tanpa Zod.
 *
 * Dipisah dari schema.ts supaya kode klien yang hanya butuh label (hampir
 * semua komponen) tidak ikut mengunduh Zod dan definisi skema. Skema hanya
 * dipakai saat konten diterbitkan dan divalidasi (Studio Konten, test, build) —
 * PRD §14: "Konten statis: JSON taktik diterbitkan ke CDN".
 */

import type { LocalizedText, PlayerId, Role, TacticCategory } from './schema'

/** Pilih teks sesuai bahasa, jatuh kembali ke Bahasa Indonesia. */
export function t(text: LocalizedText | undefined, lang: 'id' | 'en' = 'id'): string {
  if (!text) return ''
  if (lang === 'en' && text.en) return text.en
  return text.id
}

export const CATEGORY_LABEL: Record<TacticCategory, string> = {
  offense: 'Sistem menyerang',
  'set-play': 'Set play',
  'vs-zone': 'Melawan zona',
  defense: 'Sistem bertahan',
  press: 'Press & press break',
  special: 'Situasi khusus',
}

/** Warna kategori — merujuk token CSS di src/styles/tokens.css. */
export const CATEGORY_TOKEN: Record<TacticCategory, string> = {
  offense: 'var(--cat-offense)',
  'set-play': 'var(--cat-set-play)',
  'vs-zone': 'var(--cat-vs-zone)',
  defense: 'var(--cat-defense)',
  press: 'var(--cat-press)',
  special: 'var(--cat-special)',
}

export const ROLE_LABEL: Record<Role, string> = {
  PG: 'Point Guard',
  SG: 'Shooting Guard',
  SF: 'Small Forward',
  PF: 'Power Forward',
  C: 'Center',
}

/** Nomor punggung dari ID pemain: "O3" -> 3, "X5" -> 5. */
export function playerNumber(id: PlayerId): number {
  return Number(id.slice(1))
}

/** Label tampil: O3 -> "3", X5 -> "X5" (konvensi diagram pelatih). */
export function playerLabel(id: PlayerId): string {
  return id.startsWith('O') ? id.slice(1) : id
}

export function isDefender(id: PlayerId): boolean {
  return id.startsWith('X')
}

/** Pasangan jaga menurut konvensi nomor: O3 <-> X3. */
export function counterpartId(id: PlayerId): PlayerId {
  return (id.startsWith('O') ? 'X' : 'O') + id.slice(1)
}
