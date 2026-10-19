/**
 * Loader & Validator — PRD §14:
 *   "Memuat JSON taktik dan memvalidasi skema (bagian 13)."
 *
 * Tanggung jawab tambahan: CACHE. Mengompilasi jalur (membangun LUT panjang
 * busur untuk setiap event) tidak boleh terjadi setiap frame. Loader menyimpan
 * hasil kompilasi per kombinasi (taktik, cabang aktif) sehingga mengganti
 * coverage di F-14 hanya membayar sekali.
 */

import { branchKey, normalizeActiveBranches, resolveEvents } from './branch'
import { type CompiledTactic, compileEvents } from './interpolator'
import { type StateContext, createStateContext } from './state'
import { TacticSchema, type Tactic, type TacticInput } from './schema'
import { validateTactic } from './validate'

/** Cache kompilasi global — kuncinya `${tacticId}@${version}#${branchKey}`. */
const compileCache = new Map<string, { compiled: CompiledTactic; ctx: StateContext }>()

/** Batas cache sederhana: cukup untuk beberapa taktik x beberapa cabang. */
const CACHE_LIMIT = 48

function cacheKey(tactic: Tactic, key: string): string {
  return `${tactic.id}@${tactic.version}#${key}`
}

/**
 * Parse JSON taktik. Melempar bila skema tidak valid — memuat konten rusak
 * lebih buruk daripada gagal keras di awal.
 */
export function parseTactic(raw: unknown): Tactic {
  const result = TacticSchema.safeParse(raw)
  if (!result.success) {
    const detail = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    throw new Error(`JSON taktik tidak valid: ${detail}`)
  }
  return result.data
}

/**
 * Parse + validasi penuh. Dipakai Studio Konten (F-27) dan skrip pemeriksa
 * konten; aplikasi runtime cukup memakai parseTactic agar tetap cepat.
 */
export function loadAndValidate(raw: TacticInput | unknown) {
  return validateTactic(raw as TacticInput)
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
