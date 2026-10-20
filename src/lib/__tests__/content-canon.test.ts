import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { TacticSchema, validateTactic } from '@/engine'
import { TACTICS } from '@/lib/content'

/**
 * lib/content.ts memakai JSON taktik apa adanya di browser (tanpa parse Zod).
 * Itu hanya aman bila setiap berkas sudah berbentuk kanonik — sama persis
 * dengan hasil parse skema, termasuk semua nilai default.
 */
const DIR = join(process.cwd(), 'content', 'tactics')
const FILES = readdirSync(DIR).filter((f) => f.endsWith('.json'))

describe('JSON taktik kanonik', () => {
  it.each(FILES)('%s identik dengan hasil TacticSchema.parse', (file) => {
    const raw: unknown = JSON.parse(readFileSync(join(DIR, file), 'utf8'))
    expect(TacticSchema.parse(raw)).toStrictEqual(raw)
  })

  it.each(FILES)('%s lolos validasi penuh tanpa galat', (file) => {
    const raw: unknown = JSON.parse(readFileSync(join(DIR, file), 'utf8'))
    expect(validateTactic(raw as never).errors).toEqual([])
  })

  it('setiap berkas di content/tactics terdaftar di lib/content', () => {
    expect(TACTICS).toHaveLength(FILES.length)
  })
})
