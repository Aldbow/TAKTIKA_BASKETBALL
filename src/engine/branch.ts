/**
 * Branch Resolver — PRD §14 komponen Tactic Engine:
 *   "Mengganti event saat pengguna memilih cabang 'bagaimana jika'."
 *
 * Dipakai tiga fitur:
 *  - F-14 Cabang "Bagaimana jika" (pemilih coverage)
 *  - F-18 Baca & Bereaksi (memutar konsekuensi dari opsi yang dipilih pengguna)
 *  - Kesalahan umum & counter bertahan (PRD §6 anatomi butir 5 & 6)
 *
 * Syarat penting F-14: mengganti cabang TIDAK boleh mereset waktu. Karena itu
 * resolver ini murni bekerja di tingkat daftar event — jam induk tidak disentuh.
 */

import type { Branch, Tactic, TacticEvent } from './schema'

/** Satu grup pemicu, mis. "coverage" dengan pilihan drop/switch/blitz. */
export interface BranchGroup {
  /** Nama grup; cabang tanpa grup dikumpulkan di grup '' */
  name: string
  branches: Branch[]
}

/** Kumpulkan cabang menurut grup — dipakai UI pemilih coverage (F-14). */
export function branchGroups(tactic: Tactic): BranchGroup[] {
  const map = new Map<string, Branch[]>()
  for (const b of tactic.branches) {
    const key = b.group ?? ''
    const list = map.get(key)
    if (list) list.push(b)
    else map.set(key, [b])
  }
  return [...map.entries()].map(([name, branches]) => ({ name, branches }))
}

export function findBranch(tactic: Tactic, id: string): Branch | undefined {
  return tactic.branches.find((b) => b.id === id)
}

/**
 * Pastikan hanya satu cabang aktif per grup. Memilih cabang baru dalam grup
 * yang sama menggantikan pilihan sebelumnya (perilaku pemilih coverage).
 */
export function normalizeActiveBranches(tactic: Tactic, ids: readonly string[]): string[] {
  const seenGroups = new Set<string>()
  const out: string[] = []
  // Iterasi dari belakang: pilihan terbaru menang dalam satu grup.
  for (let i = ids.length - 1; i >= 0; i--) {
    const id = ids[i] as string
    const branch = findBranch(tactic, id)
    if (!branch) continue
    const group = branch.group ?? `__solo:${branch.id}`
    if (seenGroups.has(group)) continue
    seenGroups.add(group)
    out.unshift(id)
  }
  return out
}

/**
 * Hasilkan daftar event efektif untuk sekumpulan cabang aktif.
 *
 * Aturan penggantian untuk setiap cabang aktif, diterapkan berurutan menurut
 * `fromT`:
 *  1. Event dasar yang id-nya tercantum di `branch.replaces` dibuang.
 *  2. Event dasar dengan `t >= fromT` yang aktornya muncul di event cabang
 *     dibuang — jadi cabang coverage hanya memengaruhi pemain yang terlibat,
 *     bukan penembak di sudut yang tetap berdiri.
 *  3. Event cabang ditambahkan.
 *
 * Hasilnya diurutkan menurut waktu agar interpolator bisa memakai pencarian
 * berurutan yang murah.
 */
export function resolveEvents(
  tactic: Tactic,
  activeBranchIds: readonly string[] = [],
): TacticEvent[] {
  const active = activeBranchIds
    .map((id) => findBranch(tactic, id))
    .filter((b): b is Branch => Boolean(b))
    .sort((a, b) => a.fromT - b.fromT)

  if (active.length === 0) {
    return [...tactic.events].sort(sortByTime)
  }

  let events = [...tactic.events]

  for (const branch of active) {
    const replaced = new Set(branch.replaces)
    const branchActors = new Set(branch.events.map((e) => e.actor))

    events = events.filter((e) => {
      if (replaced.has(e.id)) return false
      if (e.t >= branch.fromT - 1e-9 && branchActors.has(e.actor)) return false
      return true
    })

    events.push(...branch.events)
  }

  return events.sort(sortByTime)
}

function sortByTime(a: TacticEvent, b: TacticEvent): number {
  if (a.t !== b.t) return a.t - b.t
  // Pada waktu yang sama: gerak lebih dulu, lalu umpan/tembakan, agar bola
  // selalu berangkat dari posisi pemain yang sudah diperbarui.
  return eventOrder(a) - eventOrder(b)
}

function eventOrder(e: TacticEvent): number {
  switch (e.type) {
    case 'move':
    case 'cut':
    case 'rotate':
      return 0
    case 'screen':
      return 1
    case 'dribble':
      return 2
    case 'handoff':
      return 3
    case 'pass':
      return 4
    case 'shot':
      return 5
    case 'rebound':
      return 6
    default:
      return 7
  }
}

/**
 * Kunci cache stabil untuk satu set cabang aktif. Dipakai loader agar taktik
 * yang sudah dikompilasi untuk kombinasi cabang tertentu tidak dikompilasi ulang
 * setiap frame.
 */
export function branchKey(activeBranchIds: readonly string[]): string {
  return [...activeBranchIds].sort().join('|')
}

/**
 * Counter serangan yang disarankan untuk cabang aktif — langsung ditampilkan di
 * panel saat coverage diganti (kriteria penerimaan F-14).
 */
export function activeCounters(
  tactic: Tactic,
  activeBranchIds: readonly string[],
): { branchId: string; label: string; counter: string }[] {
  const out: { branchId: string; label: string; counter: string }[] = []
  for (const id of activeBranchIds) {
    const b = findBranch(tactic, id)
    if (b?.counter) out.push({ branchId: b.id, label: b.label.id, counter: b.counter.id })
  }
  return out
}
