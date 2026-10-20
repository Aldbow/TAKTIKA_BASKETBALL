import type { Metadata } from 'next'

import { TACTICS } from '@/lib/content'
import { CoachArea } from '@/components/coach/CoachArea'

export const metadata: Metadata = { title: 'Area Pelatih' }

export default function CoachPage() {
  return <CoachArea tactics={TACTICS} />
}
