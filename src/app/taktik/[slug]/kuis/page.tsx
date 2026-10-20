import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { t as localize } from '@/engine'
import { allTacticSlugs, getTacticBySlug } from '@/lib/content'
import { ReadReactQuiz } from '@/components/quiz/ReadReactQuiz'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return allTacticSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tactic = getTacticBySlug(slug)
  if (!tactic) return { title: 'Kuis tidak ditemukan' }
  return {
    title: `Baca & Bereaksi · ${localize(tactic.title)}`,
    description: `Kuis keputusan: lapangan membeku di momen penting ${localize(tactic.title)} dan kamu memilih umpan yang benar.`,
  }
}

/** S-08 Baca & Bereaksi. */
export default async function ReadReactPage({ params }: PageProps) {
  const { slug } = await params
  const tactic = getTacticBySlug(slug)
  if (!tactic) notFound()
  return <ReadReactQuiz tactic={tactic} />
}
