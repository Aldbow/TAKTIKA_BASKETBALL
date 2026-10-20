/**
 * Tactic Engine — titik masuk untuk kode klien.
 *
 * Sama dengan `@/engine` tetapi TANPA Zod: tidak ada skema, parse, maupun
 * validator. Tipe skema tetap tersedia (hanya tipe, hilang saat build).
 * Komponen yang berjalan di browser mengimpor dari sini supaya JS awal
 * halaman tetap dalam anggaran PRD §15 (landing <= 200 KB gzip).
 *
 * Validasi (`validateTactic`, `parseTactic`, `TacticSchema`) tetap di
 * `@/engine` untuk Studio Konten, test, dan kode server.
 */

export * from './court'
export * from './labels'
export type * from './schema'
export * from './geometry'
export * from './speed'
export * from './branch'
export * from './interpolator'
export * from './ball'
export * from './state'
export * from './clock'
export * from './events'
export * from './context'
