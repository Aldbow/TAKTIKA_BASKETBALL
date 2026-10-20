import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ALL_MODULES, findModule } from '@content/curriculum'
import { moduleQuiz } from '@/lib/learning'
import { ModuleQuiz } from '@/components/learn/ModuleQuiz'

interface PageProps {
  params: Promise<{ modul: string }>
}

export function generateStaticParams() {
  return ALL_MODULES.filter((m) => moduleQuiz(m.code)).map((m) => ({ modul: m.code }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { modul } = await params
  const m = findModule(decodeURIComponent(modul))
  return { title: m ? `Kuis modul ${m.code}` : 'Kuis tidak ditemukan' }
}

/** Kuis modul (F-07). */
export default async function ModuleQuizPage({ params }: PageProps) {
  const { modul } = await params
  const m = findModule(decodeURIComponent(modul))
  const questions = m ? moduleQuiz(m.code) : null
  if (!m || !questions) notFound()

  return <ModuleQuiz module={m} questions={questions} />
}
