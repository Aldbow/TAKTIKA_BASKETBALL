/**
 * Akses konten taktik.
 *
 * PRD §14 keputusan arsitektur: "Konten statis: JSON taktik diterbitkan ke CDN;
 * database hanya untuk data pengguna."
 *
 * Di build ini JSON di-bundel pada waktu build (import statis), sehingga:
 *  - halaman taktik dan glosarium bisa dirender di server untuk SEO (PRD §15)
 *  - memuat taktik dari cache < 300 ms terpenuhi dengan sendirinya
 *  - menambah taktik = menambah satu berkas JSON + satu baris di sini
 *
 * Saat jumlah taktik tumbuh melewati puluhan, baris impor di bawah diganti
 * dengan fetch ke CDN tanpa mengubah API modul ini.
 */

import type { Tactic, TacticCategory } from '@/engine/runtime'

import setSpainPnr from '@content/tactics/set-spain-pnr.json'
import offSpreadPnr from '@content/tactics/off-spread-pnr.json'
import off5OutMotion from '@content/tactics/off-5-out-motion.json'
import setHorns from '@content/tactics/set-horns.json'
import zoneVs23 from '@content/tactics/zone-vs-2-3.json'
import defZone23 from '@content/tactics/def-zone-2-3.json'
import pressBreak from '@content/tactics/press-break.json'
import specialBlobBox from '@content/tactics/special-blob-box.json'

const RAW = [
  setSpainPnr,
  offSpreadPnr,
  off5OutMotion,
  setHorns,
  zoneVs23,
  defZone23,
  pressBreak,
  specialBlobBox,
] as const

/**
 * Semua taktik.
 *
 * JSON taktik disimpan dalam bentuk KANONIK — identik dengan hasil
 * `TacticSchema.parse` (semua default sudah terisi). Itu dijaga oleh test
 * src/lib/__tests__/content-canon.test.ts, sehingga parse Zod tidak perlu
 * dijalankan di perangkat pengguna: tidak mengunduh Zod, dan tidak membayar
 * parse 8 taktik setiap kali halaman dimuat.
 */
export const TACTICS: Tactic[] = RAW as unknown as Tactic[]

const BY_ID = new Map(TACTICS.map((t) => [t.id, t]))
const BY_SLUG = new Map(TACTICS.map((t) => [t.slug, t]))

export function getTacticById(id: string): Tactic | undefined {
  return BY_ID.get(id)
}

export function getTacticBySlug(slug: string): Tactic | undefined {
  return BY_SLUG.get(slug)
}

export function tacticsByCategory(category: TacticCategory): Tactic[] {
  return TACTICS.filter((t) => t.category === category)
}

/** Semua slug — dipakai generateStaticParams Next.js. */
export function allTacticSlugs(): string[] {
  return TACTICS.map((t) => t.slug)
}

/**
 * Taktik yang direkomendasikan untuk sebuah posisi favorit.
 * Dipakai dashboard (PRD §11 S-03: "rekomendasi per posisi") dan onboarding.
 */
export function recommendedForRole(role: string): Tactic[] {
  // Taktik yang punya lensa POV untuk nomor posisi itu, diurutkan dari tingkat
  // termudah supaya pengguna baru tidak langsung menerima taktik tingkat 5.
  const number = { PG: '1', SG: '2', SF: '3', PF: '4', C: '5' }[role] ?? '1'
  return TACTICS.filter((t) =>
    t.povLenses.some((l) => l.playerId.endsWith(number)),
  ).sort((a, b) => a.level - b.level)
}

/**
 * Taktik pilihan hari ini — deterministik dari tanggal, bukan acak, agar semua
 * pengguna melihat taktik yang sama dan hasilnya bisa diuji.
 */
export function tacticOfTheDay(date = new Date()): Tactic {
  const day = Math.floor(date.getTime() / 86_400_000)
  return TACTICS[day % TACTICS.length] as Tactic
}

/** Jumlah taktik per kategori — dipakai filter perpustakaan. */
export function categoryCounts(): Record<TacticCategory, number> {
  const out = {
    offense: 0,
    'set-play': 0,
    'vs-zone': 0,
    defense: 0,
    press: 0,
    special: 0,
  } as Record<TacticCategory, number>
  for (const t of TACTICS) out[t.category]++
  return out
}
