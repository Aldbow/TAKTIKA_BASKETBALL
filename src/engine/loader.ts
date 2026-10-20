/**
 * Loader & Validator — PRD §14:
 *   "Memuat JSON taktik dan memvalidasi skema (bagian 13)."
 *
 * Parse memakai Zod dan dijalankan saat konten diterbitkan atau diuji (Studio
 * Konten, test, build) — bukan di perangkat pengguna. Konteks state dan cache
 * kompilasi yang dibutuhkan renderer ada di context.ts.
 */

import { TacticSchema, type Tactic, type TacticInput } from './schema'
import { validateTactic } from './validate'

export { clearCompileCache, getStateContext, invalidateTactic } from './context'

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
 * konten.
 */
export function loadAndValidate(raw: TacticInput | unknown) {
  return validateTactic(raw as TacticInput)
}
