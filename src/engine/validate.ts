/**
 * Validator konten taktik — PRD §13 "Aturan validasi (dijalankan Studio Konten)".
 *
 * Kriteria penerimaan F-27:
 *   "Sistem menolak penyimpanan bila ada pemain yang berpindah tanpa jalur,
 *    fase tanpa durasi, atau POV tanpa tugas utama."
 *
 * Tiap temuan dikembalikan terstruktur (bukan string) supaya Studio Konten bisa
 * menyorot tepat di field yang salah, dan supaya unit test bisa menegaskan
 * aturan satu per satu.
 */

import { HALF_MIDLINE_Y, clamp, courtBounds, dist } from './court'
import { buildPath, pathEnd, pathStart } from './geometry'
import { MAX_PLAYER_SPEED } from './speed'
import { branchKey, resolveEvents } from './branch'
import { compileEvents, isMotionEvent } from './interpolator'
import { buildBallTimeline } from './ball'
import { createStateContext, getState } from './state'
import { TacticSchema, type Tactic, type TacticInput } from './schema'

export type IssueCode =
  | 'schema'
  | 'phase-overlap'
  | 'phase-no-duration'
  | 'phase-outside-duration'
  | 'move-without-path'
  | 'position-discontinuity'
  | 'player-overlap'
  | 'ball-double-possession'
  | 'ball-no-owner'
  | 'pov-missing'
  | 'pov-no-mission'
  | 'pov-incomplete'
  | 'no-decision'
  | 'speed-too-high'
  | 'missing-indonesian'
  | 'out-of-bounds'
  | 'event-past-duration'
  | 'branch-bad-reference'
  | 'scenario-bad-reference'
  | 'decision-no-correct-option'

export interface ValidationIssue {
  code: IssueCode
  severity: 'error' | 'warning'
  /** Pesan Bahasa Indonesia untuk penulis konten */
  message: string
  /** Petunjuk lokasi, mis. "events[3]" atau "povLenses[O2].mission" */
  path?: string
  /** Angka pendukung (jarak, kecepatan, waktu) */
  value?: number
}

export interface ValidationResult {
  ok: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  issues: ValidationIssue[]
  /** Taktik hasil parse bila skema lolos */
  tactic: Tactic | null
}

/** Jarak minimum antar-token (meter) — PRD §13. */
export const MIN_PLAYER_GAP = 0.5
/** Toleransi kontinuitas jalur antar event berurutan (meter). */
export const MAX_PATH_GAP = 0.3
/** Langkah pindai waktu untuk pemeriksaan per-frame (detik). */
const SCAN_STEP = 0.1

/**
 * Validasi penuh. Dipanggil Studio Konten sebelum simpan, dan loader saat
 * memuat JSON di mode pengembangan.
 */
export function validateTactic(input: TacticInput | Tactic): ValidationResult {
  const issues: ValidationIssue[] = []

  /* ---- 0. Skema Zod ---------------------------------------------------- */
  const parsed = TacticSchema.safeParse(input)
  if (!parsed.success) {
    for (const err of parsed.error.issues) {
      issues.push({
        code: 'schema',
        severity: 'error',
        message: err.message,
        path: err.path.join('.'),
      })
    }
    return finish(issues, null)
  }
  const tactic = parsed.data

  /* ---- 1. Teks Bahasa Indonesia wajib ada ------------------------------ */
  // "Teks Bahasa Indonesia wajib ada; teks Inggris boleh kosong sampai fase 2."
  requireIndonesian(tactic.title.id, 'title', issues)
  requireIndonesian(tactic.summary.id, 'summary', issues)
  requireIndonesian(tactic.whenToUse.id, 'whenToUse', issues)
  tactic.phases.forEach((p, i) => requireIndonesian(p.title.id, `phases[${i}].title`, issues))

  /* ---- 2. Fase: punya durasi dan tidak tumpang tindih ------------------ */
  const sortedPhases = [...tactic.phases].sort((a, b) => a.tStart - b.tStart)
  sortedPhases.forEach((p, i) => {
    if (p.tEnd - p.tStart <= 1e-6) {
      issues.push({
        code: 'phase-no-duration',
        severity: 'error',
        message: `Fase "${p.title.id}" tidak punya durasi (tStart harus lebih kecil dari tEnd).`,
        path: `phases[${i}]`,
      })
    }
    if (p.tEnd > tactic.duration + 1e-6) {
      issues.push({
        code: 'phase-outside-duration',
        severity: 'error',
        message: `Fase "${p.title.id}" berakhir di ${p.tEnd} dtk, melewati durasi taktik ${tactic.duration} dtk.`,
        path: `phases[${i}].tEnd`,
        value: p.tEnd,
      })
    }
    const next = sortedPhases[i + 1]
    if (next && next.tStart < p.tEnd - 1e-6) {
      issues.push({
        code: 'phase-overlap',
        severity: 'error',
        message: `Fase "${p.title.id}" dan "${next.title.id}" tumpang tindih. Fase tidak boleh tumpang tindih.`,
        path: `phases[${i}]`,
      })
    }
  })

  /* ---- 3. Event gerak wajib punya jalur -------------------------------- */
  const MOTION_WITH_PATH = new Set(['move', 'dribble', 'cut', 'rotate', 'rebound'])
  tactic.events.forEach((e, i) => {
    if (MOTION_WITH_PATH.has(e.type) && (e.path?.length ?? 0) < 2) {
      issues.push({
        code: 'move-without-path',
        severity: 'error',
        message: `Event "${e.id}" (${e.type}) memindahkan ${e.actor} tetapi tidak punya jalur. Tidak boleh ada perpindahan tanpa jalur.`,
        path: `events[${i}].path`,
      })
    }
    if (e.t > tactic.duration + 1e-6) {
      issues.push({
        code: 'event-past-duration',
        severity: 'error',
        message: `Event "${e.id}" mulai di ${e.t} dtk, melewati durasi taktik ${tactic.duration} dtk.`,
        path: `events[${i}].t`,
        value: e.t,
      })
    }
    if (!tactic.players.some((p) => p.id === e.actor)) {
      issues.push({
        code: 'branch-bad-reference',
        severity: 'error',
        message: `Event "${e.id}" memakai aktor ${e.actor} yang tidak ada di daftar pemain.`,
        path: `events[${i}].actor`,
      })
    }
  })

  /* ---- 4. Kontinuitas: jalur harus menyambung ke posisi sebelumnya ----- */
  // "Setiap pemain punya posisi terdefinisi di setiap waktu t; tidak boleh ada
  //  perpindahan tanpa event."
  for (const player of tactic.players) {
    const motions = tactic.events
      .filter((e) => e.actor === player.id && isMotionEvent(e))
      .sort((a, b) => a.t - b.t)

    let expected = { x: player.start.x, y: player.start.y }
    motions.forEach((e) => {
      const lut = buildPath(e.path as [number, number][])
      const begin = pathStart(lut)
      const gap = dist(expected, begin)
      if (gap > MAX_PATH_GAP) {
        issues.push({
          code: 'position-discontinuity',
          severity: 'error',
          message: `${player.id} melompat ${gap.toFixed(2)} m tanpa jalur sebelum event "${e.id}". Jalur harus mulai dari posisi terakhirnya.`,
          path: `events[${tactic.events.indexOf(e)}].path[0]`,
          value: gap,
        })
      }
      expected = pathEnd(lut)
    })
  }

  /* ---- 5. Batas lapangan ----------------------------------------------- */
  const bounds = courtBounds(tactic.court)
  const margin = 0.6 // pemain boleh sedikit di luar garis (inbound, sudut)
  const checkPoint = (x: number, y: number, path: string, who: string) => {
    if (
      x < bounds.minX - margin ||
      x > bounds.maxX + margin ||
      y < bounds.minY - margin ||
      y > bounds.maxY + margin
    ) {
      issues.push({
        code: 'out-of-bounds',
        severity: 'warning',
        message: `${who} berada di (${x.toFixed(2)}, ${y.toFixed(2)}), di luar batas lapangan ${tactic.court}.`,
        path,
      })
    }
  }
  tactic.players.forEach((p, i) =>
    checkPoint(p.start.x, p.start.y, `players[${i}].start`, p.id),
  )
  tactic.events.forEach((e, i) =>
    e.path?.forEach((pt, j) =>
      checkPoint(pt[0], pt[1], `events[${i}].path[${j}]`, `Jalur ${e.actor}`),
    ),
  )

  /* ---- 6. POV lenses ---------------------------------------------------- */
  // "Setiap taktik menyerang wajib punya 5 POVLens yang lengkap dan minimal
  //  1 Decision."
  const offensePlayers = tactic.players.filter((p) => p.team === 'offense')
  const isOffensiveTactic = tactic.category !== 'defense'

  if (isOffensiveTactic) {
    for (const p of offensePlayers) {
      const lens = tactic.povLenses.find((l) => l.playerId === p.id)
      if (!lens) {
        issues.push({
          code: 'pov-missing',
          severity: 'error',
          message: `Lensa POV untuk ${p.id} belum ada. Taktik menyerang wajib punya 5 lensa POV.`,
          path: 'povLenses',
        })
        continue
      }
      if (!lens.mission.id.trim()) {
        issues.push({
          code: 'pov-no-mission',
          severity: 'error',
          message: `Lensa POV ${p.id} tidak punya tugas utama. Tugas utama wajib satu kalimat.`,
          path: `povLenses[${p.id}].mission`,
        })
      }
      if (lens.steps.length === 0) {
        issues.push({
          code: 'pov-incomplete',
          severity: 'warning',
          message: `Lensa POV ${p.id} belum punya langkah per fase — checklist panel POV akan kosong.`,
          path: `povLenses[${p.id}].steps`,
        })
      }
      if (lens.cues.length === 0) {
        issues.push({
          code: 'pov-incomplete',
          severity: 'warning',
          message: `Lensa POV ${p.id} belum punya kartu isyarat.`,
          path: `povLenses[${p.id}].cues`,
        })
      }
    }

    if (tactic.decisions.length === 0) {
      issues.push({
        code: 'no-decision',
        severity: 'error',
        message: 'Taktik menyerang wajib punya minimal 1 momen keputusan (Decision).',
        path: 'decisions',
      })
    }
  } else {
    // Taktik bertahan: lensa X1-X5 (PRD §7 "taktik bertahan punya 5 lensa bertahan").
    const defenders = tactic.players.filter((p) => p.team === 'defense')
    for (const p of defenders) {
      if (!tactic.povLenses.some((l) => l.playerId === p.id)) {
        issues.push({
          code: 'pov-missing',
          severity: 'error',
          message: `Lensa POV bertahan untuk ${p.id} belum ada. Taktik bertahan wajib punya 5 lensa X1-X5.`,
          path: 'povLenses',
        })
      }
    }
  }

  tactic.povLenses.forEach((lens) => {
    lens.steps.forEach((s, i) => {
      if (!tactic.phases.some((p) => p.id === s.phaseId)) {
        issues.push({
          code: 'branch-bad-reference',
          severity: 'error',
          message: `Langkah POV ${lens.playerId} merujuk fase "${s.phaseId}" yang tidak ada.`,
          path: `povLenses[${lens.playerId}].steps[${i}].phaseId`,
        })
      }
    })
  })

  /* ---- 7. Keputusan: minimal satu opsi benar --------------------------- */
  tactic.decisions.forEach((d, i) => {
    if (!d.options.some((o) => o.correct)) {
      issues.push({
        code: 'decision-no-correct-option',
        severity: 'warning',
        message: `Keputusan "${d.id}" tidak punya opsi yang ditandai benar — kuis tidak bisa menilai jawaban.`,
        path: `decisions[${i}].options`,
      })
    }
    d.options.forEach((o, j) => {
      if (o.branchId && !tactic.branches.some((b) => b.id === o.branchId)) {
        issues.push({
          code: 'branch-bad-reference',
          severity: 'error',
          message: `Opsi "${o.label.id}" merujuk cabang "${o.branchId}" yang tidak ada.`,
          path: `decisions[${i}].options[${j}].branchId`,
        })
      }
      if (!o.explain.id.trim()) {
        issues.push({
          code: 'missing-indonesian',
          severity: 'error',
          message: `Opsi "${o.label.id}" tidak punya penjelasan. Jawaban salah selalu wajib disertai penjelasan.`,
          path: `decisions[${i}].options[${j}].explain`,
        })
      }
    })
  })

  /* ---- 8. Skenario kuis ------------------------------------------------- */
  tactic.scenarios.forEach((s, i) => {
    if (!tactic.decisions.some((d) => d.id === s.decisionId)) {
      issues.push({
        code: 'scenario-bad-reference',
        severity: 'error',
        message: `Skenario "${s.id}" merujuk keputusan "${s.decisionId}" yang tidak ada.`,
        path: `scenarios[${i}].decisionId`,
      })
    }
    s.setupBranches.forEach((b, j) => {
      if (!tactic.branches.some((x) => x.id === b)) {
        issues.push({
          code: 'scenario-bad-reference',
          severity: 'error',
          message: `Skenario "${s.id}" memakai cabang "${b}" yang tidak ada.`,
          path: `scenarios[${i}].setupBranches[${j}]`,
        })
      }
    })
  })

  /* ---- 9. Cabang -------------------------------------------------------- */
  tactic.branches.forEach((b, i) => {
    b.replaces.forEach((id, j) => {
      if (!tactic.events.some((e) => e.id === id)) {
        issues.push({
          code: 'branch-bad-reference',
          severity: 'warning',
          message: `Cabang "${b.id}" ingin mengganti event "${id}" yang tidak ada.`,
          path: `branches[${i}].replaces[${j}]`,
        })
      }
    })
  })

  /* ---- 10. Kecepatan hasil hitung <= 8 m/s ------------------------------ */
  // Diperiksa pada daftar event dasar DAN setiap kombinasi cabang tunggal,
  // karena cabang bisa memperkenalkan jalur baru yang terlalu cepat.
  const branchSets: string[][] = [[], ...tactic.branches.map((b) => [b.id])]
  const seenSpeedEvents = new Set<string>()

  for (const set of branchSets) {
    const compiled = compileEvents(tactic, resolveEvents(tactic, set), set, branchKey(set))
    for (const ce of compiled.events) {
      if (!ce.motion || !ce.lut || seenSpeedEvents.has(ce.id)) continue
      seenSpeedEvents.add(ce.id)
      const peak = peakSpeed(ce.motion, ce.dur)
      if (peak > MAX_PLAYER_SPEED) {
        issues.push({
          code: 'speed-too-high',
          severity: 'error',
          message: `Event "${ce.id}" membuat ${ce.actor} bergerak ${peak.toFixed(1)} m/s. Batas sanity sprint adalah ${MAX_PLAYER_SPEED} m/s — perpanjang durasi atau perpendek jalur.`,
          path: `events.${ce.id}`,
          value: peak,
        })
      }
    }

    /* ---- 11. Kepemilikan bola ----------------------------------------- */
    const timeline = buildBallTimeline(compiled)
    for (let i = 0; i < timeline.length - 1; i++) {
      const a = timeline[i]
      const b = timeline[i + 1]
      if (!a || !b) continue
      if (b.tStart < a.tEnd - 1e-6) {
        issues.push({
          code: 'ball-double-possession',
          severity: 'error',
          message: `Kepemilikan bola tumpang tindih antara ${a.tStart.toFixed(2)}-${a.tEnd.toFixed(2)} dtk dan ${b.tStart.toFixed(2)}-${b.tEnd.toFixed(2)} dtk. Bola hanya boleh dimiliki satu pemain pada satu waktu.`,
          path: 'events',
          value: a.tEnd,
        })
      }
    }

    /* ---- 12. Tumpang tindih token ------------------------------------- */
    // "Pemain tidak boleh saling tembus: jarak minimum 0,5 m antar-token,
    //  kecuali saat kontak screen."
    const ctx = createStateContext(compiled)
    // Rentang event bersifat setengah terbuka: [t, tEnd). Tepat pada
    // t = duration SEMUA event sudah berakhir, sehingga pengecualian kontak
    // (screen, tembakan) tidak lagi berlaku dan pasangan yang sedang berkontak
    // akan salah dilaporkan. Sampel terakhir diambil sedikit sebelum akhir —
    // konfigurasinya sama, tanpa positif palsu.
    const scanEnd = Math.max(0, tactic.duration - 1e-3)
    for (let t = 0; t <= scanEnd + 1e-9; t += SCAN_STEP) {
      const st = getState(ctx, clamp(t, 0, scanEnd))

      // Pemain yang sedang terlibat KONTAK sah dikecualikan. "Kontak" di sini
      // mencakup empat event yang memang berarti badan bertemu badan: screen,
      // dribble handoff, tembakan yang di-contest, dan rebound/box out.
      const contactActors = new Set<string>()
      for (const ev of st.activeEvents) {
        if (
          ev.type === 'screen' ||
          ev.type === 'handoff' ||
          ev.type === 'shot' ||
          ev.type === 'rebound'
        ) {
          contactActors.add(ev.actor)
          if (ev.target && ev.target !== 'rim') contactActors.add(ev.target)
        }
      }

      for (let i = 0; i < st.players.length; i++) {
        for (let j = i + 1; j < st.players.length; j++) {
          const a = st.players[i]
          const b = st.players[j]
          if (!a || !b) continue
          if (contactActors.has(a.id) || contactActors.has(b.id)) continue
          // Pasangan jaga yang ditugaskan memang HARUS rapat — bek yang menempel
          // lawannya bukan cacat render. Begitu juga bek mana pun terhadap
          // pemegang bola: itu definisi tekanan pada bola (modul 2.6).
          if (a.guards === b.id || b.guards === a.id) continue
          if ((a.team !== b.team) && (a.hasBall || b.hasBall)) continue

          const d = dist(a.position, b.position)
          if (d < MIN_PLAYER_GAP) {
            issues.push({
              code: 'player-overlap',
              severity: 'warning',
              // Pesan tidak menyertakan waktu agar satu pasangan yang tumpang
              // tindih selama 2 detik tidak jadi 20 peringatan terpisah.
              message: `${a.id} dan ${b.id} saling tembus (terdekat ${d.toFixed(2)} m, minimum ${MIN_PLAYER_GAP} m di luar kontak sah). Pertama terjadi pada ${t.toFixed(1)} dtk.`,
              path: `events:${a.id}-${b.id}`,
              value: d,
            })
          }
        }
      }
    }
  }

  /* ---- 13. Bola harus punya pemilik awal -------------------------------- */
  const holders = tactic.players.filter((p) => p.hasBall)
  if (holders.length === 0) {
    issues.push({
      code: 'ball-no-owner',
      severity: 'warning',
      message:
        'Tidak ada pemain yang ditandai hasBall di t = 0. Engine akan menebak pemegang bola dari event pertama.',
      path: 'players',
    })
  } else if (holders.length > 1) {
    issues.push({
      code: 'ball-double-possession',
      severity: 'error',
      message: `${holders.length} pemain ditandai hasBall. Bola hanya boleh dimiliki satu pemain.`,
      path: 'players',
    })
  }

  /* ---- 14. Press / lapangan penuh --------------------------------------- */
  if (tactic.court === 'half') {
    const deepest = Math.max(
      ...tactic.players.map((p) => p.start.y),
      ...tactic.events.flatMap((e) => (e.path ?? []).map((pt) => pt[1])),
    )
    if (deepest > HALF_MIDLINE_Y + 0.5) {
      issues.push({
        code: 'out-of-bounds',
        severity: 'warning',
        message: `Ada posisi di y = ${deepest.toFixed(2)} m, melewati garis tengah. Taktik ini mungkin seharusnya memakai court: "full".`,
        path: 'court',
        value: deepest,
      })
    }
  }

  return finish(issues, tactic)
}

/** Dedupe pesan identik lalu pisahkan error dan warning. */
function finish(issues: ValidationIssue[], tactic: Tactic | null): ValidationResult {
  const seen = new Set<string>()
  const unique: ValidationIssue[] = []
  for (const i of issues) {
    // Kunci dedupe memakai kode + lokasi, BUKAN pesan: pemeriksaan per-frame
    // menghasilkan pesan yang berbeda tiap langkah waktu untuk masalah yang
    // sama. Lokasi sudah cukup spesifik (mis. "events:O5-X1", "events[3].path").
    const key = i.path ? `${i.code}|${i.path}` : `${i.code}|${i.message}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(i)
  }
  const errors = unique.filter((i) => i.severity === 'error')
  const warnings = unique.filter((i) => i.severity === 'warning')
  return { ok: errors.length === 0, errors, warnings, issues: unique, tactic }
}

function requireIndonesian(value: string, path: string, issues: ValidationIssue[]): void {
  if (!value || !value.trim()) {
    issues.push({
      code: 'missing-indonesian',
      severity: 'error',
      message: `Teks Bahasa Indonesia di "${path}" wajib diisi.`,
      path,
    })
  }
}

/** Kecepatan puncak sebuah profil gerak, dipindai rapat. */
function peakSpeed(motion: { speedAt(dt: number): number }, dur: number, steps = 60): number {
  let peak = 0
  for (let i = 0; i <= steps; i++) {
    peak = Math.max(peak, motion.speedAt((dur * i) / steps))
  }
  return peak
}
