/**
 * Validasi seluruh konten taktik di content/tactics/.
 *
 * Uji ini adalah gerbang kualitas konten: setiap taktik yang masuk repo harus
 * lolos semua aturan validasi PRD §13. Kalau penulis konten menambah taktik
 * dengan jalur yang melompat atau kecepatan 12 m/s, uji ini gagal di CI.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { validateTactic } from '../validate'
import type { TacticInput } from '../schema'

const TACTICS_DIR = join(process.cwd(), 'content', 'tactics')

function tacticFiles(): string[] {
  return readdirSync(TACTICS_DIR).filter((f) => f.endsWith('.json'))
}

function loadRaw(file: string): TacticInput {
  return JSON.parse(readFileSync(join(TACTICS_DIR, file), 'utf8')) as TacticInput
}

describe('konten taktik', () => {
  const files = tacticFiles()

  it('ada taktik di content/tactics/', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  for (const file of files) {
    describe(file, () => {
      const raw = loadRaw(file)
      const result = validateTactic(raw)

      it('lolos semua aturan validasi PRD §13 tanpa error', () => {
        if (!result.ok) {
          const detail = result.errors
            .map((e) => `  [${e.code}] ${e.path ?? '-'} :: ${e.message}`)
            .join('\n')
          throw new Error(`${file} punya ${result.errors.length} error:\n${detail}`)
        }
        expect(result.ok).toBe(true)
      })

      it('tidak punya peringatan yang mengindikasikan konten rusak', () => {
        // Peringatan tidak memblokir publikasi, tetapi dilaporkan agar terlihat.
        if (result.warnings.length > 0) {
          const detail = result.warnings
            .map((w) => `  [${w.code}] ${w.path ?? '-'} :: ${w.message}`)
            .join('\n')
          console.warn(`${file} punya ${result.warnings.length} peringatan:\n${detail}`)
        }
        // Tumpang tindih token adalah peringatan yang paling sering menandakan
        // koordinat salah, jadi dibatasi ketat.
        const overlaps = result.warnings.filter((w) => w.code === 'player-overlap')
        expect(overlaps.length, overlaps.map((o) => o.message).join('\n')).toBeLessThanOrEqual(0)
      })
    })
  }
})
