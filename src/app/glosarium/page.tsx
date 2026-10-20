import type { Metadata } from 'next'

import { Glossary } from '@/components/glossary/Glossary'

export const metadata: Metadata = {
  title: 'Glosarium',
  description:
    'Istilah basket dari pick-and-roll sampai X-out, masing-masing dengan arti singkat, penjelasan, dan mini-animasi dari taktik sungguhan.',
}

/**
 * S-09 Glosarium. Komponen klien tetap dirender di server, jadi seluruh daftar
 * istilah ada di HTML awal (PRD §15 SEO).
 */
export default function GlossaryPage() {
  return <Glossary />
}
