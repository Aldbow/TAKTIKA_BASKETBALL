import type { Metadata } from 'next'

import { TACTICS } from '@/lib/content'
import { PracticeHub } from '@/components/practice/PracticeHub'

export const metadata: Metadata = {
  title: 'Latihan',
  description: 'Kuis Baca & Bereaksi per taktik dan kuis istilah per modul.',
}

export default function PracticePage() {
  return <PracticeHub tactics={TACTICS} />
}
