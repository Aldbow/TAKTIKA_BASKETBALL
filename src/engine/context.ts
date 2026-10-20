/**
 * Konteks state + cache kompilasi — tanpa Zod.
 *
 * Mengompilasi jalur (membangun LUT panjang busur untuk setiap event) tidak
 * boleh terjadi setiap frame. Cache disimpan per kombinasi (taktik, cabang
 * aktif) sehingga mengganti coverage di F-14 hanya membayar sekali.
 *
 * Dipisah dari loader.ts (yang mem-parse JSON dengan Zod) karena renderer di
 * perangkat pengguna hanya butuh bagian ini.
 */

import { branchKey, normalizeActiveBranches, resolveEvents } from './branch'
import { type CompiledTactic, compileEvents } from './interpolator'
import type { Tactic } from './schema'
import { type StateContext, createStateContext } from './state'

/** Cache kompilasi global — kuncinya `${tacticId}@${version}#${branchKey}`. */
const compileCache = new Map<string, { compiled: CompiledTactic; ctx: StateContext }>()

/** Batas cache sederhana: cukup untuk beberapa taktik x beberapa cabang. */
const CACHE_LIMIT = 48

function cacheKey(tactic: Tactic, key: string): string {
  return `${tactic.id}@${tactic.version}#${key}`
}

/**
 * Ambil konteks state untuk sebuah taktik dengan sekumpulan cabang aktif.
 * Hasilnya di-cache; pemanggilan berikutnya dengan kombinasi sama gratis.
 */
export function getStateContext(
  tactic: Tactic,
  activeBranchIds: readonly string[] = [],
): { compiled: CompiledTactic; ctx: StateContext; activeBranchIds: string[] } {
  const normalized = normalizeActiveBranches(tactic, activeBranchIds)
  const key = branchKey(normalized)
  const full = cacheKey(tactic, key)

  const hit = compileCache.get(full)
  if (hit) {
    return { compiled: hit.compiled, ctx: hit.ctx, activeBranchIds: normalized }
  }

  const compiled = compileEvents(tactic, resolveEvents(tactic, normalized), normalized, key)
  const ctx = createStateContext(compiled)

  if (compileCache.size >= CACHE_LIMIT) {
    // Buang entri tertua (Map menjaga urutan sisipan).
    const oldest = compileCache.keys().next()
    if (!oldest.done) compileCache.delete(oldest.value)
  }
  compileCache.set(full, { compiled, ctx })

  return { compiled, ctx, activeBranchIds: normalized }
}

/** Buang cache satu taktik — dipakai Studio Konten setiap kali konten diedit. */
export function invalidateTactic(tacticId: string): void {
  for (const key of [...compileCache.keys()]) {
    if (key.startsWith(`${tacticId}@`)) compileCache.delete(key)
  }
}

export function clearCompileCache(): void {
  compileCache.clear()
}
