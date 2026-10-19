/**
 * Skema konten taktik — PRD §13 "Model Data & Skema Konten Taktik".
 *
 * Satu taktik = satu dokumen JSON berbasis waktu. Skema ini dipakai bersama oleh:
 *  - aplikasi (memuat & memvalidasi JSON dari CDN / content/)
 *  - Studio Konten F-27 (validasi sebelum simpan)
 *  - pengujian engine
 *
 * Teks dua bahasa memakai bentuk { id, en }; `en` boleh kosong sampai F-28
 * (PRD §13: "Teks Bahasa Indonesia wajib ada; teks Inggris boleh kosong").
 */

import { z } from 'zod'

/* -------------------------------------------------------------------------- */
/* Primitif                                                                   */
/* -------------------------------------------------------------------------- */

/** Teks dua bahasa. Bahasa Indonesia wajib. */
export const LocalizedTextSchema = z.object({
  id: z.string().min(1, 'Teks Bahasa Indonesia wajib ada'),
  en: z.string().optional(),
})

/** Titik di lapangan dalam meter. */
export const PointSchema = z.tuple([z.number(), z.number()])

/** Posisi awal pemain: koordinat + arah hadap (derajat, 0 = menghadap ring). */
export const SpotSchema = z.object({
  x: z.number(),
  y: z.number(),
  facing: z.number().default(0),
})

export const CourtKindSchema = z.enum(['half', 'full'])

/** Profil kecepatan dunia nyata — PRD §10 "Gerak pemain dan bola". */
export const SpeedProfileSchema = z.enum(['walk', 'jog', 'sprint', 'slide', 'slow'])

export const TeamSchema = z.enum(['offense', 'defense'])

/** Posisi 1-5 klasik — materi modul 1.7. */
export const RoleSchema = z.enum(['PG', 'SG', 'SF', 'PF', 'C'])

/** Kode pemain: O1-O5 menyerang, X1-X5 bertahan (PRD §19 "Kode pemain"). */
export const PlayerIdSchema = z
  .string()
  .regex(/^[OX][1-5]$/, 'ID pemain harus O1-O5 atau X1-X5')

/** Enam kategori taktik — PRD §6. */
export const TacticCategorySchema = z.enum([
  'offense', // A. Sistem menyerang
  'set-play', // B. Set play setengah lapangan
  'vs-zone', // C. Menyerang pertahanan zona
  'defense', // D. Sistem bertahan
  'press', // E. Press dan melawan press
  'special', // F. Situasi khusus
])

export const ReleaseSchema = z.enum(['mvp', 'f2'])
export const StatusSchema = z.enum(['draft', 'review', 'published'])

/* -------------------------------------------------------------------------- */
/* Entitas inti                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Player — PRD §13: "id (O1-O5, X1-X5), tim, peran, posisi awal {x, y, facing}.
 * X terikat pada O yang dijaga lewat `guards`."
 */
export const PlayerSchema = z.object({
  id: PlayerIdSchema,
  team: TeamSchema,
  role: RoleSchema.optional(),
  /** Hanya untuk bek: pemain menyerang yang dijaga. */
  guards: PlayerIdSchema.optional(),
  start: SpotSchema,
  /** Pemain memegang bola di t = 0. Tepat satu pemain per taktik. */
  hasBall: z.boolean().optional(),
})

/**
 * Phase — PRD §13: "Fase tidak boleh tumpang tindih."
 * PRD §6: "biasanya 3-6 fase; tiap fase punya durasi, aksi, dan narasi singkat".
 */
export const PhaseSchema = z.object({
  id: z.string().min(1),
  title: LocalizedTextSchema,
  tStart: z.number().min(0),
  tEnd: z.number().min(0),
  /** Narasi singkat per fase — juga diumumkan lewat aria-live (PRD §15). */
  narration: LocalizedTextSchema.optional(),
  /** Pemain yang jadi fokus fase ini (prinsip "satu layar, satu ide"). */
  focus: z.array(PlayerIdSchema).optional(),
})

/** Jenis event — PRD §13 tabel Entitas inti. */
export const EventTypeSchema = z.enum([
  'move',
  'dribble',
  'pass',
  'screen',
  'cut',
  'handoff',
  'shot',
  'rebound',
  'rotate',
])

/**
 * Event — satuan gerak atomik. `path` dalam meter; `dur` boleh dihilangkan
 * dan akan dihitung dari panjang jalur / profil kecepatan (lihat speed.ts).
 */
export const EventSchema = z.object({
  id: z.string().min(1),
  t: z.number().min(0),
  dur: z.number().positive().optional(),
  type: EventTypeSchema,
  actor: PlayerIdSchema,
  /** Penerima umpan, bek yang di-screen, atau 'rim' untuk tembakan. */
  target: z.union([PlayerIdSchema, z.literal('rim')]).optional(),
  path: z.array(PointSchema).optional(),
  speed: SpeedProfileSchema.optional(),
  label: z.string().optional(),
  /** Tembakan: apakah masuk. Dipakai A-08 (partikel vs pantul). */
  made: z.boolean().optional(),
  /** Menandai eksekusi yang salah — dipakai animasi "benar vs salah" (PRD §4). */
  wrong: z.boolean().optional(),
})

/**
 * Decision — memicu bullet time A-09.
 * PRD §13: "id, t, pemilik, isyarat, opsi [label, benar/salah, branchId, penjelasan]".
 */
export const DecisionOptionSchema = z.object({
  id: z.string().min(1),
  label: LocalizedTextSchema,
  /** Cabang yang diputar bila opsi ini dipilih. */
  branchId: z.string().optional(),
  /** Benar dalam kondisi default taktik ini. */
  correct: z.boolean().default(false),
  /** Kondisi yang membuat opsi ini benar, mis. "X5 terhambat". */
  correctWhen: z.string().optional(),
  /** Penjelasan yang SELALU tampil saat salah (kriteria penerimaan F-18). */
  explain: LocalizedTextSchema,
  /** Posisi target ketuk di lapangan; default = posisi pemain target. */
  targetPlayer: PlayerIdSchema.optional(),
  targetSpot: SpotSchema.partial({ facing: true }).optional(),
})

export const DecisionSchema = z.object({
  id: z.string().min(1),
  t: z.number().min(0),
  owner: PlayerIdSchema,
  /** Isyarat yang harus dibaca — inti kartu isyarat. */
  cue: LocalizedTextSchema,
  options: z.array(DecisionOptionSchema).min(2, 'Keputusan butuh minimal 2 opsi'),
})

/**
 * Branch — fitur F-14 "Bagaimana jika".
 * PRD §13: "id, dariT, pemicu (misalnya coverage = switch), event pengganti".
 */
export const BranchSchema = z.object({
  id: z.string().min(1),
  label: LocalizedTextSchema,
  /** Event dasar sejak waktu ini diganti oleh `events` di bawah. */
  fromT: z.number().min(0),
  /** Pemicu bergaya kunci-nilai, mis. { coverage: "switch" }. */
  trigger: z.record(z.string(), z.string()).optional(),
  /** Kelompok pemicu — satu cabang aktif per grup (mis. grup "coverage"). */
  group: z.string().optional(),
  /**
   * Event dasar yang digantikan. Bila kosong, event dasar milik pemain yang
   * muncul di `events` dan berada pada t >= fromT yang digantikan. Ini mencegah
   * sebuah cabang coverage ikut menghapus aksi penembak di sudut yang tidak
   * terpengaruh.
   */
  replaces: z.array(z.string()).default([]),
  events: z.array(EventSchema),
  /** Counter serangan yang disarankan — ditampilkan di panel (F-14). */
  counter: LocalizedTextSchema.optional(),
  /** Hasil akhir cabang ini, dipakai kuis untuk menampilkan akibat. */
  outcome: z.enum(['score', 'good-look', 'turnover', 'contested', 'reset']).optional(),
})

/**
 * POVLens — lensa per posisi, fitur pembeda utama (PRD §7).
 * PRD §13: "Wajib ada untuk 5 pemain menyerang."
 */
export const PovStepSchema = z.object({
  phaseId: z.string().min(1),
  text: LocalizedTextSchema,
})

export const PovDecisionSchema = z.object({
  /** Isyarat: "jika bek melakukan X..." */
  ifCue: LocalizedTextSchema,
  /** Respon: "...maka lakukan Y" */
  thenDo: LocalizedTextSchema,
  /** Cabang yang bisa diputar untuk melihat percabangan ini. */
  branchId: z.string().optional(),
})

export const PovLensSchema = z.object({
  playerId: PlayerIdSchema,
  /** Tugas utama, WAJIB satu kalimat (PRD §7 tabel Komponen lensa POV). */
  mission: LocalizedTextSchema,
  /** Checklist langkah per fase, tercentang otomatis saat fase berjalan. */
  steps: z.array(PovStepSchema).default([]),
  /** Kartu isyarat "lihat ini". */
  cues: z.array(LocalizedTextSchema).default([]),
  /** Pohon keputusan jika-maka. */
  decisions: z.array(PovDecisionSchema).default([]),
  /** Kesalahan umum khusus posisi ini. */
  mistakes: z.array(LocalizedTextSchema).default([]),
  /** Panggilan suara yang harus diteriakkan, mis. "Screen kiri!". */
  calls: z.array(z.string()).default([]),
})

/** Kesalahan umum tingkat taktik — PRD §6 anatomi butir 6 (3-5 kesalahan). */
export const MistakeSchema = z.object({
  id: z.string().min(1),
  title: LocalizedTextSchema,
  why: LocalizedTextSchema,
  /** Cabang yang memperagakan eksekusi salah ini. */
  branchId: z.string().optional(),
})

/** Counter bertahan — PRD §6 anatomi butir 5. */
export const CounterSchema = z.object({
  id: z.string().min(1),
  /** Cara lawan menghentikan taktik ini. */
  defense: LocalizedTextSchema,
  /** Respon serangan. */
  response: LocalizedTextSchema,
  branchId: z.string().optional(),
})

/** Skenario kuis Baca & Bereaksi — F-18 (minimal 3 per taktik). */
export const ScenarioSchema = z.object({
  id: z.string().min(1),
  prompt: LocalizedTextSchema,
  /** Waktu lapangan membeku. */
  pauseAt: z.number().min(0),
  /** Cabang yang dijalankan sebagai prasyarat situasi, mis. coverage tertentu. */
  setupBranches: z.array(z.string()).default([]),
  answerType: z.enum(['tap-player', 'tap-spot', 'drag-player']).default('tap-player'),
  /** Mengacu ke Decision pada taktik. */
  decisionId: z.string().min(1),
})

/* -------------------------------------------------------------------------- */
/* Dokumen taktik                                                             */
/* -------------------------------------------------------------------------- */

export const TacticSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug hanya huruf kecil, angka, dan tanda hubung'),
  title: LocalizedTextSchema,
  category: TacticCategorySchema,
  /** Tingkat kesulitan 1 (mudah) - 5 (sangat kompleks) — PRD §6. */
  level: z.number().int().min(1).max(5),
  court: CourtKindSchema.default('half'),
  /** Durasi total taktik dalam detik. */
  duration: z.number().positive(),

  /** PRD §6 anatomi butir 1: satu kalimat ide inti + kapan dipakai. */
  summary: LocalizedTextSchema,
  whenToUse: LocalizedTextSchema,
  /** PRD §6 anatomi butir 10 (opsional): asal-usul sejarah 1-2 kalimat. */
  origin: LocalizedTextSchema.optional(),

  players: z.array(PlayerSchema).min(2),
  phases: z.array(PhaseSchema).min(1),
  events: z.array(EventSchema).default([]),
  decisions: z.array(DecisionSchema).default([]),
  branches: z.array(BranchSchema).default([]),
  povLenses: z.array(PovLensSchema).default([]),
  mistakes: z.array(MistakeSchema).default([]),
  counters: z.array(CounterSchema).default([]),
  scenarios: z.array(ScenarioSchema).default([]),

  /** PRD §6 anatomi butir 9: prasyarat dan lanjutan. */
  related: z
    .object({
      prerequisites: z.array(z.string()).default([]),
      nextUp: z.array(z.string()).default([]),
    })
    .default({ prerequisites: [], nextUp: [] }),

  /** Istilah glosarium yang muncul di taktik ini. */
  terms: z.array(z.string()).default([]),

  release: ReleaseSchema.default('mvp'),
  status: StatusSchema.default('draft'),
  version: z.number().int().min(1).default(1),
})

/* -------------------------------------------------------------------------- */
/* Tipe TypeScript turunan                                                    */
/* -------------------------------------------------------------------------- */

export type LocalizedText = z.infer<typeof LocalizedTextSchema>
export type Spot = z.infer<typeof SpotSchema>
export type SpeedProfile = z.infer<typeof SpeedProfileSchema>
export type Team = z.infer<typeof TeamSchema>
export type Role = z.infer<typeof RoleSchema>
export type PlayerId = string
export type TacticCategory = z.infer<typeof TacticCategorySchema>
export type Release = z.infer<typeof ReleaseSchema>
export type TacticStatus = z.infer<typeof StatusSchema>
export type Player = z.infer<typeof PlayerSchema>
export type Phase = z.infer<typeof PhaseSchema>
export type EventType = z.infer<typeof EventTypeSchema>
export type TacticEvent = z.infer<typeof EventSchema>
export type DecisionOption = z.infer<typeof DecisionOptionSchema>
export type Decision = z.infer<typeof DecisionSchema>
export type Branch = z.infer<typeof BranchSchema>
export type PovStep = z.infer<typeof PovStepSchema>
export type PovDecision = z.infer<typeof PovDecisionSchema>
export type PovLens = z.infer<typeof PovLensSchema>
export type Mistake = z.infer<typeof MistakeSchema>
export type Counter = z.infer<typeof CounterSchema>
export type Scenario = z.infer<typeof ScenarioSchema>
export type Tactic = z.infer<typeof TacticSchema>

/** Bentuk masukan sebelum default Zod diterapkan (dipakai Studio Konten). */
export type TacticInput = z.input<typeof TacticSchema>

/* -------------------------------------------------------------------------- */
/* Pembantu label                                                             */
/* -------------------------------------------------------------------------- */

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
