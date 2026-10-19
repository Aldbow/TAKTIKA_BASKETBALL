/**
 * Uji validator — enam aturan PRD §13 dan kriteria penerimaan F-27:
 *   "Sistem menolak penyimpanan bila ada pemain yang berpindah tanpa jalur,
 *    fase tanpa durasi, atau POV tanpa tugas utama."
 *
 * Setiap aturan diuji dua arah: konten yang benar harus LOLOS, dan konten yang
 * melanggar harus DITOLAK dengan kode temuan yang tepat.
 */

import { describe, expect, it } from 'vitest'

import { MIN_PLAYER_GAP, validateTactic, type IssueCode } from '../validate'
import { MAX_PLAYER_SPEED } from '../speed'
import type { TacticInput } from '../schema'

/** Taktik minimal yang sah: 5 penyerang + 5 bek, satu umpan, satu keputusan. */
function baseTactic(): TacticInput {
  const lens = (id: string) => ({
    playerId: id,
    mission: { id: `Tugas utama ${id}` },
    steps: [{ phaseId: 'p1', text: { id: 'Langkah fase 1' } }],
    cues: [{ id: 'Isyarat' }],
    decisions: [],
    mistakes: [],
    calls: [],
  })

  return {
    id: 'uji',
    slug: 'uji-taktik',
    title: { id: 'Taktik Uji' },
    category: 'set-play',
    level: 2,
    court: 'half',
    duration: 3,
    summary: { id: 'Ringkasan ide inti.' },
    whenToUse: { id: 'Kapan dipakai.' },
    players: [
      { id: 'O1', team: 'offense', role: 'PG', start: { x: 0, y: 8, facing: 0 }, hasBall: true },
      { id: 'O2', team: 'offense', role: 'SG', start: { x: 5.5, y: 4.6, facing: 0 } },
      { id: 'O3', team: 'offense', role: 'SF', start: { x: 6.6, y: 0.5, facing: 0 } },
      { id: 'O4', team: 'offense', role: 'PF', start: { x: -6.6, y: 0.5, facing: 0 } },
      { id: 'O5', team: 'offense', role: 'C', start: { x: -2.4, y: 1.2, facing: 180 } },
      { id: 'X1', team: 'defense', guards: 'O1', start: { x: 0, y: 6.9, facing: 180 } },
      { id: 'X2', team: 'defense', guards: 'O2', start: { x: 4.7, y: 4.2, facing: 180 } },
      { id: 'X3', team: 'defense', guards: 'O3', start: { x: 5.8, y: 1.2, facing: 180 } },
      { id: 'X4', team: 'defense', guards: 'O4', start: { x: -5.4, y: 1.4, facing: 180 } },
      { id: 'X5', team: 'defense', guards: 'O5', start: { x: -2.0, y: 0.6, facing: 180 } },
    ],
    phases: [
      { id: 'p1', title: { id: 'Fase satu' }, tStart: 0, tEnd: 1.5 },
      { id: 'p2', title: { id: 'Fase dua' }, tStart: 1.5, tEnd: 3 },
    ],
    events: [
      {
        id: 'e1',
        t: 0,
        dur: 1.2,
        type: 'dribble',
        actor: 'O1',
        path: [
          [0, 8],
          [1.4, 7.6],
          [2.6, 6.9],
        ],
        speed: 'jog',
      },
      { id: 'e2', t: 1.6, dur: 0.4, type: 'pass', actor: 'O1', target: 'O2' },
    ],
    decisions: [
      {
        id: 'd1',
        t: 1.4,
        owner: 'O1',
        cue: { id: 'Baca bek' },
        options: [
          { id: 'a', label: { id: 'Umpan ke 2' }, correct: true, explain: { id: 'Benar.' } },
          { id: 'b', label: { id: 'Drive' }, correct: false, explain: { id: 'Salah.' } },
        ],
      },
    ],
    branches: [],
    povLenses: [lens('O1'), lens('O2'), lens('O3'), lens('O4'), lens('O5')],
    mistakes: [],
    counters: [],
    scenarios: [],
    related: { prerequisites: [], nextUp: [] },
    terms: [],
  }
}

function codes(input: TacticInput): IssueCode[] {
  return validateTactic(input).issues.map((i) => i.code)
}

function errorCodes(input: TacticInput): IssueCode[] {
  return validateTactic(input).errors.map((i) => i.code)
}

describe('taktik dasar yang sah', () => {
  it('lolos tanpa error maupun peringatan', () => {
    const result = validateTactic(baseTactic())
    expect(
      result.errors.map((e) => `${e.code}: ${e.message}`),
      'error tak terduga',
    ).toEqual([])
    expect(result.warnings.map((e) => `${e.code}: ${e.message}`)).toEqual([])
    expect(result.ok).toBe(true)
    expect(result.tactic).not.toBeNull()
  })
})

describe('aturan skema Zod', () => {
  it('menolak slug yang memakai huruf besar', () => {
    const t = baseTactic()
    t.slug = 'Taktik Salah'
    expect(errorCodes(t)).toContain('schema')
  })

  it('menolak id pemain di luar pola O1-O5 / X1-X5', () => {
    const t = baseTactic()
    t.players[0]!.id = 'Z9'
    expect(errorCodes(t)).toContain('schema')
  })

  it('menolak tingkat kesulitan di luar 1-5', () => {
    const t = baseTactic()
    t.level = 7
    expect(errorCodes(t)).toContain('schema')
  })

  it('menolak keputusan dengan kurang dari 2 opsi', () => {
    const t = baseTactic()
    t.decisions![0]!.options = [t.decisions![0]!.options[0]!]
    expect(errorCodes(t)).toContain('schema')
  })

  it('mengembalikan tactic null bila skema gagal', () => {
    expect(validateTactic({ id: 'rusak' } as TacticInput).tactic).toBeNull()
  })
})

describe('aturan: teks Bahasa Indonesia wajib ada', () => {
  it('menolak judul kosong', () => {
    const t = baseTactic()
    t.title = { id: '   ' }
    expect(errorCodes(t)).toContain('missing-indonesian')
  })

  it('menolak ringkasan kosong', () => {
    const t = baseTactic()
    t.summary = { id: '' }
    // String kosong juga gagal di skema (min 1), keduanya sah sebagai error.
    expect(validateTactic(t).ok).toBe(false)
  })

  it('menerima teks Inggris yang kosong (boleh sampai fase 2)', () => {
    const t = baseTactic()
    t.title = { id: 'Ada judul Indonesia' }
    expect(validateTactic(t).ok).toBe(true)
  })

  it('menolak opsi keputusan tanpa penjelasan', () => {
    const t = baseTactic()
    t.decisions![0]!.options[1]!.explain = { id: '  ' }
    expect(errorCodes(t)).toContain('missing-indonesian')
  })
})

describe('aturan: fase punya durasi dan tidak tumpang tindih', () => {
  it('menolak fase tanpa durasi (F-27)', () => {
    const t = baseTactic()
    t.phases[1] = { id: 'p2', title: { id: 'Fase dua' }, tStart: 1.5, tEnd: 1.5 }
    expect(errorCodes(t)).toContain('phase-no-duration')
  })

  it('menolak fase yang tumpang tindih', () => {
    const t = baseTactic()
    t.phases[1] = { id: 'p2', title: { id: 'Fase dua' }, tStart: 1.0, tEnd: 3 }
    expect(errorCodes(t)).toContain('phase-overlap')
  })

  it('menolak fase yang melewati durasi taktik', () => {
    const t = baseTactic()
    t.phases[1] = { id: 'p2', title: { id: 'Fase dua' }, tStart: 1.5, tEnd: 9 }
    expect(errorCodes(t)).toContain('phase-outside-duration')
  })
})

describe('aturan: tidak ada perpindahan tanpa jalur', () => {
  it('menolak event gerak tanpa jalur (F-27)', () => {
    const t = baseTactic()
    delete t.events![0]!.path
    expect(errorCodes(t)).toContain('move-without-path')
  })

  it('menolak jalur yang hanya punya satu titik', () => {
    const t = baseTactic()
    t.events![0]!.path = [[0, 8]]
    expect(errorCodes(t)).toContain('move-without-path')
  })

  it('menolak jalur yang tidak menyambung ke posisi terakhir pemain', () => {
    const t = baseTactic()
    t.events![0]!.path = [
      [5, 5],
      [6, 5],
    ]
    expect(errorCodes(t)).toContain('position-discontinuity')
  })

  it('menolak event gerak kedua yang tidak menyambung dari event pertama', () => {
    const t = baseTactic()
    t.events!.push({
      id: 'e3',
      t: 1.3,
      dur: 0.5,
      type: 'cut',
      actor: 'O1',
      path: [
        [-6, 2],
        [-6, 1],
      ],
    })
    expect(errorCodes(t)).toContain('position-discontinuity')
  })

  it('menerima rangkaian event yang menyambung', () => {
    const t = baseTactic()
    t.duration = 4
    t.phases[1] = { id: 'p2', title: { id: 'Fase dua' }, tStart: 1.5, tEnd: 4 }
    t.events!.push({
      id: 'e3',
      t: 2.2,
      dur: 0.6,
      type: 'dribble',
      actor: 'O1',
      path: [
        [2.6, 6.9],
        [3.4, 6.2],
      ],
    })
    expect(errorCodes(t)).not.toContain('position-discontinuity')
  })

  it('menolak aktor yang tidak ada di daftar pemain', () => {
    const t = baseTactic()
    t.events![1]!.actor = 'O1'
    t.events!.push({ id: 'e9', t: 2, dur: 0.3, type: 'pass', actor: 'X9' as never })
    expect(validateTactic(t).ok).toBe(false)
  })

  it('menolak event yang mulai setelah durasi taktik', () => {
    const t = baseTactic()
    t.events!.push({ id: 'e9', t: 99, dur: 0.3, type: 'pass', actor: 'O1', target: 'O2' })
    expect(errorCodes(t)).toContain('event-past-duration')
  })
})

describe('aturan: jarak minimum antar-token 0,5 m', () => {
  it('ambang minimum sesuai PRD', () => {
    expect(MIN_PLAYER_GAP).toBe(0.5)
  })

  it('memperingatkan dua penyerang yang saling tembus', () => {
    const t = baseTactic()
    t.players[1]!.start = { x: 0.2, y: 8.1, facing: 0 }
    expect(codes(t)).toContain('player-overlap')
  })

  it('mengecualikan pasangan yang terlibat kontak screen', () => {
    const t = baseTactic()
    // O5 naik ke titik screen lebih dulu, lalu MENAHAN screen sampai akhir
    // taktik. Selama event screen aktif, berdiri menempel X1 adalah kontak sah.
    t.events!.push(
      {
        id: 'e-o5-up',
        t: 0.2,
        dur: 1.4,
        type: 'move',
        actor: 'O5',
        path: [
          [-2.4, 1.2],
          [-1.0, 4.0],
          [0.3, 6.3],
        ],
        speed: 'sprint',
      },
      {
        id: 'e-screen',
        t: 1.7,
        dur: 1.3,
        type: 'screen',
        actor: 'O5',
        target: 'X1',
        path: [
          [0.3, 6.3],
          [0.1, 6.85],
        ],
      },
    )
    const result = validateTactic(t)
    expect(result.errors.map((e) => e.message)).toEqual([])
    const overlaps = result.warnings.filter((w) => w.code === 'player-overlap')
    expect(overlaps.map((o) => o.message)).toEqual([])
  })

  it('mengecualikan bek terhadap pemain yang dijaganya', () => {
    const t = baseTactic()
    // X3 menempel sangat rapat pada O3 — penjagaan ketat, bukan cacat render.
    t.players[7]!.start = { x: 6.75, y: 0.6, facing: 180 }
    const overlaps = validateTactic(t).warnings.filter((w) => w.code === 'player-overlap')
    expect(overlaps).toHaveLength(0)
  })

  it('mengecualikan bek mana pun terhadap pemegang bola', () => {
    const t = baseTactic()
    // X2 menekan pembawa bola dari dekat.
    t.players[6]!.start = { x: 0.3, y: 8.1, facing: 180 }
    const overlaps = validateTactic(t).warnings.filter((w) => w.code === 'player-overlap')
    expect(overlaps).toHaveLength(0)
  })
})

describe('aturan: kepemilikan bola', () => {
  it('menolak dua pemain yang sama-sama ditandai hasBall', () => {
    const t = baseTactic()
    t.players[1]!.hasBall = true
    expect(errorCodes(t)).toContain('ball-double-possession')
  })

  it('memperingatkan bila tidak ada pemegang bola awal', () => {
    const t = baseTactic()
    delete t.players[0]!.hasBall
    expect(codes(t)).toContain('ball-no-owner')
  })
})

describe('aturan: 5 lensa POV + minimal 1 keputusan', () => {
  it('menolak lensa POV yang hilang', () => {
    const t = baseTactic()
    t.povLenses = t.povLenses!.slice(0, 4)
    expect(errorCodes(t)).toContain('pov-missing')
  })

  it('menolak lensa POV tanpa tugas utama (F-27)', () => {
    const t = baseTactic()
    t.povLenses![2]!.mission = { id: '   ' }
    expect(errorCodes(t)).toContain('pov-no-mission')
  })

  it('menolak taktik menyerang tanpa keputusan', () => {
    const t = baseTactic()
    t.decisions = []
    expect(errorCodes(t)).toContain('no-decision')
  })

  it('memperingatkan lensa POV tanpa langkah per fase', () => {
    const t = baseTactic()
    t.povLenses![0]!.steps = []
    expect(codes(t)).toContain('pov-incomplete')
  })

  it('memperingatkan lensa POV tanpa kartu isyarat', () => {
    const t = baseTactic()
    t.povLenses![0]!.cues = []
    expect(codes(t)).toContain('pov-incomplete')
  })

  it('menolak langkah POV yang merujuk fase tidak ada', () => {
    const t = baseTactic()
    t.povLenses![0]!.steps = [{ phaseId: 'hantu', text: { id: 'x' } }]
    expect(errorCodes(t)).toContain('branch-bad-reference')
  })

  it('taktik bertahan wajib punya lensa X1-X5, bukan O1-O5', () => {
    const t = baseTactic()
    t.category = 'defense'
    t.povLenses = []
    const found = errorCodes(t)
    expect(found).toContain('pov-missing')
    // Taktik bertahan tidak diwajibkan punya keputusan.
    expect(found).not.toContain('no-decision')
  })
})

describe('aturan: kecepatan tidak melewati 8 m/s', () => {
  it('batas sanity sesuai PRD §13', () => {
    expect(MAX_PLAYER_SPEED).toBe(8)
  })

  it('menolak jalur yang terlalu panjang untuk durasinya', () => {
    const t = baseTactic()
    t.events![0] = {
      id: 'e1',
      t: 0,
      dur: 0.5,
      type: 'cut',
      actor: 'O1',
      path: [
        [0, 8],
        [0, 1],
      ],
    }
    expect(errorCodes(t)).toContain('speed-too-high')
  })

  it('menerima sprint yang masuk akal', () => {
    const t = baseTactic()
    t.events![0] = {
      id: 'e1',
      t: 0,
      dur: 1.4,
      type: 'cut',
      actor: 'O1',
      path: [
        [0, 8],
        [0, 2.5],
      ],
    }
    expect(errorCodes(t)).not.toContain('speed-too-high')
  })

  it('memeriksa kecepatan di dalam cabang juga', () => {
    const t = baseTactic()
    t.branches = [
      {
        id: 'b1',
        label: { id: 'Cabang cepat' },
        fromT: 1,
        replaces: [],
        events: [
          {
            id: 'bx',
            t: 1,
            dur: 0.3,
            type: 'cut',
            actor: 'O3',
            path: [
              [6.6, 0.5],
              [-6.6, 0.5],
            ],
          },
        ],
      },
    ]
    expect(errorCodes(t)).toContain('speed-too-high')
  })
})

describe('aturan: batas lapangan', () => {
  it('memperingatkan posisi awal di luar lapangan', () => {
    const t = baseTactic()
    t.players[2]!.start = { x: 14, y: 0.5, facing: 0 }
    expect(codes(t)).toContain('out-of-bounds')
  })

  it('memperingatkan titik jalur di luar lapangan', () => {
    const t = baseTactic()
    t.events![0]!.path = [
      [0, 8],
      [0, 20],
    ]
    expect(codes(t)).toContain('out-of-bounds')
  })

  it('menyarankan court full bila ada posisi melewati garis tengah', () => {
    const t = baseTactic()
    t.players[3]!.start = { x: -6.6, y: 13.5, facing: 0 }
    const issues = validateTactic(t).warnings
    expect(issues.some((i) => i.code === 'out-of-bounds' && i.path === 'court')).toBe(true)
  })
})

describe('aturan: rujukan cabang, keputusan, dan skenario', () => {
  it('menolak opsi yang merujuk cabang tidak ada', () => {
    const t = baseTactic()
    t.decisions![0]!.options[0]!.branchId = 'hantu'
    expect(errorCodes(t)).toContain('branch-bad-reference')
  })

  it('memperingatkan keputusan tanpa opsi benar', () => {
    const t = baseTactic()
    for (const o of t.decisions![0]!.options) o.correct = false
    expect(codes(t)).toContain('decision-no-correct-option')
  })

  it('menolak skenario yang merujuk keputusan tidak ada', () => {
    const t = baseTactic()
    t.scenarios = [
      {
        id: 's1',
        prompt: { id: 'Soal' },
        pauseAt: 1.4,
        setupBranches: [],
        answerType: 'tap-player',
        decisionId: 'hantu',
      },
    ]
    expect(errorCodes(t)).toContain('scenario-bad-reference')
  })

  it('menolak skenario yang memakai cabang tidak ada', () => {
    const t = baseTactic()
    t.scenarios = [
      {
        id: 's1',
        prompt: { id: 'Soal' },
        pauseAt: 1.4,
        setupBranches: ['hantu'],
        answerType: 'tap-player',
        decisionId: 'd1',
      },
    ]
    expect(errorCodes(t)).toContain('scenario-bad-reference')
  })

  it('memperingatkan cabang yang mengganti event tidak ada', () => {
    const t = baseTactic()
    t.branches = [
      { id: 'b1', label: { id: 'X' }, fromT: 1, replaces: ['hantu'], events: [] },
    ]
    expect(codes(t)).toContain('branch-bad-reference')
  })
})

describe('bentuk hasil validasi', () => {
  it('memisahkan error dan warning', () => {
    const t = baseTactic()
    t.povLenses![0]!.steps = []
    const r = validateTactic(t)
    expect(r.ok).toBe(true)
    expect(r.errors).toHaveLength(0)
    expect(r.warnings.length).toBeGreaterThan(0)
  })

  it('menghilangkan temuan kembar', () => {
    const t = baseTactic()
    t.povLenses![0]!.steps = []
    t.povLenses![0]!.cues = []
    const r = validateTactic(t)
    const keys = r.issues.map((i) => `${i.code}|${i.path}|${i.message}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('setiap temuan menyertakan pesan Bahasa Indonesia yang bisa dibaca penulis', () => {
    const t = baseTactic()
    delete t.events![0]!.path
    for (const i of validateTactic(t).issues) {
      expect(i.message.length).toBeGreaterThan(15)
    }
  })
})
