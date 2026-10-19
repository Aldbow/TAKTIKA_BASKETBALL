/**
 * Format angka & waktu — PRD §15:
 *   "Bahasa: Bawaan Bahasa Indonesia; format angka Indonesia (koma desimal)"
 *
 * Satu modul kecil ini mencegah "6.75 m" muncul di mana pun. Dalam konteks
 * produk yang mengajarkan ukuran lapangan, titik desimal yang salah bukan
 * masalah kosmetik — ia membuat angka aturan terbaca salah.
 */

const NUM = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })
const NUM1 = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const NUM2 = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Angka umum: 1.234,56 */
export function num(value: number): string {
  return NUM.format(value)
}

/** Jarak dalam meter: "6,75 m" */
export function meters(value: number, decimals: 1 | 2 = 2): string {
  return `${(decimals === 1 ? NUM1 : NUM2).format(value)} m`
}

/** Waktu taktik: "4,8 dtk" */
export function seconds(value: number): string {
  return `${NUM1.format(value)} dtk`
}

/** Waktu jam HUD: "0:04.8" — monospace, dipakai timeline. */
export function clockTime(value: number): string {
  const safe = Math.max(0, value)
  const m = Math.floor(safe / 60)
  const s = safe - m * 60
  const whole = Math.floor(s)
  const tenth = Math.floor((s - whole) * 10)
  return `${m}:${String(whole).padStart(2, '0')},${tenth}`
}

/** Kecepatan pemutaran: "0,25x" */
export function speedLabel(value: number): string {
  return `${NUM.format(value)}x`
}

/** Persentase bulat: "72%" */
export function percent(value: number): string {
  return `${Math.round(value)}%`
}

/** Durasi menit: "4 menit" */
export function minutes(value: number): string {
  return `${num(value)} menit`
}

/** Angka XP dengan pemisah ribuan: "1.240 XP" */
export function xpLabel(value: number): string {
  return `${new Intl.NumberFormat('id-ID').format(Math.round(value))} XP`
}

/** Tanggal pendek Indonesia: "19 Okt 2026" */
export function shortDate(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** Kunci tanggal lokal "YYYY-MM-DD" — dipakai perhitungan streak. */
export function dayKey(value: Date = new Date()): string {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Selisih hari antara dua kunci tanggal. */
export function daysBetween(a: string, b: string): number {
  const pa = Date.parse(`${a}T00:00:00`)
  const pb = Date.parse(`${b}T00:00:00`)
  if (Number.isNaN(pa) || Number.isNaN(pb)) return Number.POSITIVE_INFINITY
  return Math.round((pb - pa) / 86_400_000)
}
