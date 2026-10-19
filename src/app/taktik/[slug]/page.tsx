import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CATEGORY_LABEL, t as localize } from '@/engine'
import { allTacticSlugs, getTacticBySlug } from '@/lib/content'
import { TacticViewer } from '@/components/viewer/TacticViewer'

/**
 * S-07 Tactic Viewer.
 *
 * Halaman dirender di server untuk SEO (PRD §15: "Halaman pelajaran dan
 * glosarium dirender di server, metadata lengkap"), lalu Tactic Viewer
 * mengambil alih sebagai komponen klien.
 *
 * Deep link F-16: "Tautan ke taktik pada fase dan POV tertentu."
 *   /taktik/spain-pick-and-roll?fase=3&pov=O2
 */

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ fase?: string; pov?: string }>
}

export function generateStaticParams() {
  return allTacticSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tactic = getTacticBySlug(slug)
  if (!tactic) return { title: 'Taktik tidak ditemukan' }

  const title = localize(tactic.title)
  const description = `${localize(tactic.summary)} ${localize(tactic.whenToUse)}`

  return {
    title,
    description,
    openGraph: {
      title: `${title} · TAKTIKA`,
      description,
      type: 'article',
    },
    other: {
      'taktika:kategori': CATEGORY_LABEL[tactic.category],
      'taktika:tingkat': String(tactic.level),
    },
  }
}

export default async function TacticPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { fase, pov } = await searchParams

  const tactic = getTacticBySlug(slug)
  if (!tactic) notFound()

  // Parameter deep link divalidasi di server: fase di luar rentang atau POV yang
  // tidak ada diabaikan, bukan membuat viewer gagal.
  const phaseIndex = fase ? Number.parseInt(fase, 10) - 1 : null
  const initialPhase =
    phaseIndex !== null && Number.isInteger(phaseIndex) && phaseIndex >= 0 && phaseIndex < tactic.phases.length
      ? phaseIndex
      : null

  const initialPov =
    pov && tactic.povLenses.some((l) => l.playerId === pov) ? pov : null

  return (
    <>
      {/*
        Ringkasan taktik dalam HTML yang dirender server. Ini yang dibaca mesin
        pencari dan pembaca layar sebelum canvas siap — animasi tidak boleh jadi
        satu-satunya cara memahami halaman (PRD §15).
      */}
      <div className="sr-only">
        <h1>{localize(tactic.title)}</h1>
        <p>{localize(tactic.summary)}</p>
        <p>{localize(tactic.whenToUse)}</p>
        <h2>Fase</h2>
        <ol>
          {tactic.phases.map((p) => (
            <li key={p.id}>
              <strong>{localize(p.title)}</strong>
              {p.narration ? ` — ${localize(p.narration)}` : ''}
            </li>
          ))}
        </ol>
        <h2>Tugas per posisi</h2>
        <ul>
          {tactic.povLenses.map((l) => (
            <li key={l.playerId}>
              {l.playerId}: {localize(l.mission)}
            </li>
          ))}
        </ul>
        <h2>Kesalahan umum</h2>
        <ul>
          {tactic.mistakes.map((m) => (
            <li key={m.id}>
              {localize(m.title)} — {localize(m.why)}
            </li>
          ))}
        </ul>
      </div>

      <TacticViewer tactic={tactic} initialPhase={initialPhase} initialPov={initialPov} />
    </>
  )
}
