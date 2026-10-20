import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ALL_MODULES, LEVEL_3_CATEGORIES, findModule } from '@content/curriculum'
import { tacticsByCategory } from '@/lib/content'
import { ModuleView } from '@/components/learn/ModuleView'

interface PageProps {
  params: Promise<{ modul: string }>
}

export function generateStaticParams() {
  return ALL_MODULES.map((m) => ({ modul: m.code }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { modul } = await params
  const m = findModule(decodeURIComponent(modul))
  if (!m) return { title: 'Modul tidak ditemukan' }
  return { title: `Modul ${m.code} · ${m.title}`, description: m.keyVisual }
}

export default async function ModulePage({ params }: PageProps) {
  const { modul } = await params
  const m = findModule(decodeURIComponent(modul))
  if (!m) notFound()

  const category = LEVEL_3_CATEGORIES.find((c) => c.code === m.code)?.category
  const tactics = category ? tacticsByCategory(category) : []

  return <ModuleView module={m} tactics={tactics} />
}
