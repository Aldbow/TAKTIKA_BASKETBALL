/**
 * Jembatan token desain -> renderer canvas.
 *
 * Canvas tidak bisa memakai `var(--team-offense)` langsung, jadi token CSS di
 * src/styles/tokens.css dibaca sekali lalu disimpan. Dengan begitu Tema Papan
 * Tulis dan mode kontras tinggi (F-30) otomatis mengubah warna lapangan tanpa
 * ada nilai heksadesimal yang digandakan di kode renderer.
 */

export interface Palette {
  bgVoid: string
  bgSurface: string
  bgRaised: string
  lineCourt: string
  lineCourtAlpha: number
  hairline: string
  textPrimary: string
  textSecondary: string
  /** Teks di ATAS token berwarna penuh (angka pemain) */
  textInverse: string
  offense: string
  defense: string
  ball: string
  screen: string
  cut: string
  pass: string
  success: string
  error: string
  warn: string
  selected: string
  dimmed: number
  ghost: number
}

/** Nilai aman bila CSS belum termuat (render pertama di server/hidrasi). */
export const FALLBACK_PALETTE: Palette = {
  bgVoid: '#05070d',
  bgSurface: '#0b1020',
  bgRaised: '#111a2e',
  lineCourt: '#3af2ff',
  lineCourtAlpha: 0.7,
  hairline: 'rgba(232,241,255,0.12)',
  textPrimary: '#e8f1ff',
  textSecondary: '#8a9bb8',
  textInverse: '#05070d',
  offense: '#00e5ff',
  defense: '#ff3d7f',
  ball: '#d4ff3a',
  screen: '#ffb020',
  cut: '#a66bff',
  pass: '#e8f1ff',
  success: '#2bffa3',
  error: '#ff4d5e',
  warn: '#ffb020',
  selected: '#ffffff',
  dimmed: 0.35,
  ghost: 0.2,
}

const VAR_MAP: Record<keyof Omit<Palette, 'lineCourtAlpha' | 'dimmed' | 'ghost'>, string> = {
  bgVoid: '--bg-void',
  bgSurface: '--bg-surface',
  bgRaised: '--bg-raised',
  lineCourt: '--line-court',
  hairline: '--line-hairline',
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textInverse: '--text-inverse',
  offense: '--team-offense',
  defense: '--team-defense',
  ball: '--ball',
  screen: '--action-screen',
  cut: '--action-cut',
  pass: '--action-pass',
  success: '--state-success',
  error: '--state-error',
  warn: '--state-warn',
  selected: '--focus-selected',
}

/**
 * Baca token warna aktif dari sebuah elemen. Dipanggil saat komponen dipasang
 * dan setiap kali tema atau mode kontras berubah — bukan setiap frame.
 */
export function resolvePalette(el: Element | null): Palette {
  if (typeof window === 'undefined' || !el) return FALLBACK_PALETTE

  const cs = getComputedStyle(el)
  const read = (name: string, fallback: string): string => {
    const v = cs.getPropertyValue(name).trim()
    return v.length > 0 ? v : fallback
  }
  const readNum = (name: string, fallback: number): number => {
    const v = Number.parseFloat(cs.getPropertyValue(name))
    return Number.isFinite(v) ? v : fallback
  }

  const out = { ...FALLBACK_PALETTE }
  for (const [key, varName] of Object.entries(VAR_MAP) as [keyof Palette, string][]) {
    ;(out as Record<string, unknown>)[key] = read(varName, FALLBACK_PALETTE[key] as string)
  }
  out.lineCourtAlpha = readNum('--line-court-alpha', FALLBACK_PALETTE.lineCourtAlpha)
  out.dimmed = readNum('--opacity-dimmed', FALLBACK_PALETTE.dimmed)
  out.ghost = readNum('--opacity-ghost', FALLBACK_PALETTE.ghost)
  return out
}

/* -------------------------------------------------------------------------- */
/* Pembantu warna                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Tambahkan alfa ke warna apa pun yang dikenali canvas.
 * Menangani #rgb, #rrggbb, rgb(), dan rgba(); format lain dikembalikan apa adanya
 * (lebih baik warna penuh daripada tidak tergambar sama sekali).
 */
export function withAlpha(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha))
  const c = color.trim()

  if (c.startsWith('#')) {
    const hex = c.slice(1)
    let r: number
    let g: number
    let b: number
    if (hex.length === 3) {
      r = Number.parseInt(hex[0]! + hex[0]!, 16)
      g = Number.parseInt(hex[1]! + hex[1]!, 16)
      b = Number.parseInt(hex[2]! + hex[2]!, 16)
    } else if (hex.length === 6 || hex.length === 8) {
      r = Number.parseInt(hex.slice(0, 2), 16)
      g = Number.parseInt(hex.slice(2, 4), 16)
      b = Number.parseInt(hex.slice(4, 6), 16)
    } else {
      return c
    }
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }

  const m = c.match(/^rgba?\(([^)]+)\)$/i)
  if (m) {
    const parts = m[1]!.split(/[,/]/).map((x) => x.trim())
    const [r, g, b] = parts
    if (r && g && b) return `rgba(${r}, ${g}, ${b}, ${a})`
  }

  return c
}

/** Campur dua warna heks; u = 0 memberi a, u = 1 memberi b. */
export function mixColor(a: string, b: string, u: number): string {
  const pa = parseHex(a)
  const pb = parseHex(b)
  if (!pa || !pb) return u < 0.5 ? a : b
  const t = Math.max(0, Math.min(1, u))
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t)
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t)
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

function parseHex(color: string): [number, number, number] | null {
  const c = color.trim()
  if (!c.startsWith('#')) return null
  const hex = c.slice(1)
  if (hex.length === 3) {
    return [
      Number.parseInt(hex[0]! + hex[0]!, 16),
      Number.parseInt(hex[1]! + hex[1]!, 16),
      Number.parseInt(hex[2]! + hex[2]!, 16),
    ]
  }
  if (hex.length >= 6) {
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
    ]
  }
  return null
}

/* -------------------------------------------------------------------------- */
/* Tingkat kualitas — matriks PRD §10                                         */
/* -------------------------------------------------------------------------- */

export type QualityTier = 'high' | 'standard' | 'saver'

export interface RenderQuality {
  tier: QualityTier
  /** Glow & blur: penuh / penuh / hanya glow */
  glow: boolean
  blur: boolean
  /** Partikel: ya / dikurangi / tidak */
  particles: 'full' | 'reduced' | 'none'
  /** Boot-up lapangan: penuh / penuh / versi 400 ms */
  bootUpMs: number
  /** Lapisan jejak & afterimage */
  trails: boolean
  /** Kurangi Gerak aktif (F-30) */
  reducedMotion: boolean
}

/**
 * Turunkan pengaturan render dari tier kualitas + preferensi gerak.
 * Mengikuti tabel "Tingkat kualitas & kurangi gerak" di PRD §10.
 */
export function renderQuality(tier: QualityTier, reducedMotion: boolean): RenderQuality {
  const base: RenderQuality =
    tier === 'high'
      ? {
          tier,
          glow: true,
          blur: true,
          particles: 'full',
          bootUpMs: 1600,
          trails: true,
          reducedMotion,
        }
      : tier === 'standard'
        ? {
            tier,
            glow: true,
            blur: true,
            particles: 'reduced',
            bootUpMs: 1600,
            trails: true,
            reducedMotion,
          }
        : {
            tier,
            glow: true,
            blur: false,
            particles: 'none',
            bootUpMs: 400,
            trails: false,
            reducedMotion,
          }

  if (reducedMotion) {
    // F-30: partikel dinonaktifkan, boot-up jadi fade 200 ms.
    return { ...base, particles: 'none', bootUpMs: 200, trails: false }
  }
  return base
}
