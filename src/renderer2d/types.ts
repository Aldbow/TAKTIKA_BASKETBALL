/**
 * Kontrak renderer 2D.
 *
 * Satu `RenderFrame` memuat SEMUA yang dibutuhkan untuk menggambar satu frame.
 * Tidak ada fungsi gambar yang menyimpan state antar frame — konsekuensi
 * langsung dari keputusan arsitektur PRD §14 ("renderer tidak menyimpan posisi
 * sendiri"). Efek yang perlu "ingatan" memakai PRNG ber-seed waktu, bukan
 * variabel modul, sehingga menggeser timeline mereset efek dengan tepat
 * (PRD §10 "Orkestrasi").
 */

import type { CourtTransform, PlayerId, Vec2 } from '@/engine'
import type { CourtState, StateContext } from '@/engine'
import type { Palette, RenderQuality } from './palette'

/** Ke-8 lapisan visual yang bisa dinyalakan/dimatikan — F-11. */
export interface LayerFlags {
  /** Jalur gerak pemain */
  movement: boolean
  /** Jalur umpan (A-16) */
  passLanes: boolean
  /** Notasi screen */
  screens: boolean
  /** Tampilkan pemain bertahan */
  defenders: boolean
  /** Jejak gerak (A-04) */
  trails: boolean
  /** Zona & garis spacing (A-14) */
  spacing: boolean
  /** Label zona, nomor, dan label aksi */
  labels: boolean
  /** Kerucut pandang bek (A-15) */
  visionCones: boolean
}

export const DEFAULT_LAYERS: LayerFlags = {
  movement: true,
  passLanes: false,
  screens: true,
  defenders: true,
  trails: false,
  spacing: false,
  labels: true,
  visionCones: false,
}

/** Metadata lapisan untuk menu "L" di Tactic Viewer. */
export const LAYER_META: {
  key: keyof LayerFlags
  label: string
  hint: string
  /** Animasi PRD yang diwujudkan lapisan ini */
  anim?: string
}[] = [
  { key: 'movement', label: 'Jalur gerak', hint: 'Garis cut, dribble, dan rotasi' },
  {
    key: 'passLanes',
    label: 'Jalur umpan',
    hint: 'Berkas cahaya ke calon penerima; merah bila terhalang',
    anim: 'A-16',
  },
  { key: 'screens', label: 'Screen', hint: 'Notasi batang T di titik screen', anim: 'A-06' },
  { key: 'defenders', label: 'Pemain bertahan', hint: 'Tampilkan X1-X5' },
  { key: 'trails', label: 'Jejak gerak', hint: 'Bayangan 1,2 detik terakhir', anim: 'A-04' },
  {
    key: 'spacing',
    label: 'Zona spacing',
    hint: 'Hijau >= 4,5 m - kuning 3-4,5 m - merah < 3 m',
    anim: 'A-14',
  },
  { key: 'labels', label: 'Label', hint: 'Nomor pemain, nama zona, label aksi' },
  {
    key: 'visionCones',
    label: 'Pandangan bek',
    hint: 'Kerucut 120 derajat mengikuti arah kepala bek',
    anim: 'A-15',
  },
]

/** Mode kamera — PRD §10. Chase/Mata Pemain/Siaran butuh mode 3D (F-12). */
export type CameraMode = 'tactical' | 'broadcast' | 'chase' | 'player-eye' | 'cinematic'

export interface CameraState {
  mode: CameraMode
  /** Kemiringan 0-35 derajat (PRD §7: "bisa dimiringkan sampai 35 derajat") */
  tilt: number
  /** Orbit terbatas +-30 derajat */
  orbit: number
  /** Zoom 1 = memuat lapangan penuh */
  zoom: number
  /** Titik pusat perhatian (meter); null = tengah lapangan */
  focus: Vec2 | null
}

export const DEFAULT_CAMERA: CameraState = {
  mode: 'tactical',
  tilt: 0,
  orbit: 0,
  zoom: 1,
  focus: null,
}

/** Keadaan POV — F-13. */
export interface PovState {
  /** Pemain terpilih, atau null bila tidak ada POV aktif */
  playerId: PlayerId | null
  /** Progres transisi kamera 0..1 (dipakai meredupkan pemain lain) */
  blend: number
}

/** Target yang bisa diketuk di kuis Baca & Bereaksi — F-18. */
export interface QuizTarget {
  id: string
  /** Posisi di lapangan (meter) */
  at: Vec2
  playerId?: PlayerId
  label: string
  state: 'idle' | 'correct' | 'wrong'
}

export interface RenderFrame {
  g: CanvasRenderingContext2D
  transform: CourtTransform
  palette: Palette
  quality: RenderQuality
  /** Keadaan lapangan dari getState(t) — satu-satunya sumber posisi */
  state: CourtState
  /** Konteks engine, untuk kueri tambahan (garis prediksi, jejak) */
  ctx: StateContext
  layers: LayerFlags
  pov: PovState
  camera: CameraState
  /** Waktu nyata (ms) sejak lapangan dipasang — hanya untuk animasi UI */
  wallMs: number
  /** Progres boot-up 0..1 (A-01) */
  bootProgress: number
  /** Lapangan dibekukan karena kuis (F-18) */
  frozen: boolean
  /** Target kuis yang bisa diketuk */
  quizTargets: QuizTarget[]
  /** Cabang yang sedang di-blend setelah ganti coverage (A-13), 0..1 */
  branchBlend: number
  /** Jalur cabang lama yang memudar jadi bayangan (A-13) */
  ghostPaths: Vec2[][]
  /** Pemain yang disorot panel fase (prinsip "satu layar, satu ide") */
  focusPlayers: PlayerId[]
  /** Pointer laser Mode Presentasi (F-21), dalam meter */
  laser: Vec2 | null
  /** Coretan tangan Mode Presentasi (F-21), dalam meter */
  annotations: Vec2[][]
}

/** Satu lapis gambar. Dijalankan berurutan; urutan = urutan tumpukan visual. */
export type DrawPass = (frame: RenderFrame) => void

/* -------------------------------------------------------------------------- */
/* PRNG ber-seed — menjaga efek dekoratif tetap deterministik                 */
/* -------------------------------------------------------------------------- */

/**
 * Hash string -> integer 32-bit. Dipakai menurunkan seed dari (eventId, waktu)
 * sehingga partikel sebuah tembakan selalu sama setiap kali frame itu digambar,
 * tetapi berbeda antar event.
 */
export function hashSeed(...parts: (string | number)[]): number {
  let h = 2166136261
  const s = parts.join('|')
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** PRNG mulberry32 — kecil, cepat, dan cukup baik untuk efek visual. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Easing yang dipakai renderer — padanan token motion PRD §10. */
export const ease = {
  /** cubic-bezier(0.16, 1, 0.3, 1) didekati dengan out-quint */
  emphasis: (u: number): number => 1 - (1 - u) ** 5,
  /** cubic-bezier(0.65, 0, 0.35, 1) didekati dengan in-out-cubic */
  scene: (u: number): number => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2),
  outCubic: (u: number): number => 1 - (1 - u) ** 3,
  inOutSine: (u: number): number => -(Math.cos(Math.PI * u) - 1) / 2,
  clamp01: (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u),
}
