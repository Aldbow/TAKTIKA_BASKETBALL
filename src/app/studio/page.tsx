import type { Metadata } from 'next'

import { t as localize, validateTactic } from '@/engine'
import { TACTICS } from '@/lib/content'
import { ContentStudio, type StudioRow } from '@/components/studio/ContentStudio'

export const metadata: Metadata = {
  title: 'Studio Konten',
  robots: { index: false, follow: false },
}

/**
 * Studio Konten (F-27, internal). Validasi penuh semua taktik dijalankan di
 * server saat build — pemindaian per 0,1 detik untuk setiap kombinasi cabang
 * terlalu berat untuk dijalankan di HP saat halaman dibuka.
 */
export default function StudioPage() {
  const rows: StudioRow[] = TACTICS.map((t) => {
    const r = validateTactic(t)
    return {
      id: t.id,
      slug: t.slug,
      title: localize(t.title),
      status: t.status,
      version: t.version,
      counts: `${t.phases.length} · ${t.events.length} · ${t.branches.length} · ${t.povLenses.length}`,
      errors: r.errors.length,
      warnings: r.warnings.length,
    }
  })
  return <ContentStudio rows={rows} />
}
