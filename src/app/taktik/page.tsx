import type { Metadata } from 'next'

import { TACTICS } from '@/lib/content'
import { TacticLibrary } from '@/components/library/TacticLibrary'

export const metadata: Metadata = {
  title: 'Perpustakaan Taktik',
  description:
    'Jelajahi taktik basket dari enam kategori: sistem menyerang, set play, melawan zona, sistem bertahan, press, dan situasi khusus. Setiap taktik punya lima lensa POV.',
}

/** S-06 Perpustakaan Taktik. */
export default function TacticLibraryPage() {
  return <TacticLibrary tactics={TACTICS} />
}
