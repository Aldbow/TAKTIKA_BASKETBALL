import { ALL_LESSONS } from '@content/curriculum'
import { GLOSSARY } from '@content/glossary'
import { TACTICS, getTacticById } from '@/lib/content'
import { LandingHero } from '@/components/landing/LandingHero'

/**
 * S-01 Landing page.
 *
 * Taktik unggulan di hero adalah Spain Pick-and-Roll — sesuai PRD §12 Alur 1
 * langkah 1: "hero lapangan 3D memutar demo Spain PnR singkat."
 */
export default function HomePage() {
  const featured = getTacticById('set-spain-pnr') ?? (TACTICS[0] as (typeof TACTICS)[number])

  const stats = {
    tactics: TACTICS.length,
    lessons: ALL_LESSONS.length,
    terms: GLOSSARY.length,
    povLenses: TACTICS.reduce((n, t) => n + t.povLenses.length, 0),
  }

  return <LandingHero tactic={featured} stats={stats} />
}
