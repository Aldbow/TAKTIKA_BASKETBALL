import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ALL_LESSONS, findLesson, findModule } from '@content/curriculum'
import { LessonPlayer } from '@/components/learn/LessonPlayer'

interface PageProps {
  params: Promise<{ modul: string; pelajaran: string }>
}

export function generateStaticParams() {
  return ALL_LESSONS.map((l) => ({ modul: l.moduleCode, pelajaran: l.id }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pelajaran } = await params
  const lesson = findLesson(pelajaran)
  if (!lesson) return { title: 'Pelajaran tidak ditemukan' }
  return { title: lesson.title, description: lesson.blurb }
}

/** S-05 Pemutar Pelajaran. */
export default async function LessonPage({ params }: PageProps) {
  const { modul, pelajaran } = await params
  const lesson = findLesson(pelajaran)
  const m = findModule(decodeURIComponent(modul))
  // Pelajaran harus benar-benar milik modul di URL — mencegah tautan ganda.
  if (!lesson || !m || lesson.moduleCode !== m.code) notFound()

  return <LessonPlayer lesson={lesson} module={m} />
}
