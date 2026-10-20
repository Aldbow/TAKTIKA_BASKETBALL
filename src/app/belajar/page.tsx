import type { Metadata } from 'next'

import { LearningMap } from '@/components/learn/LearningMap'

export const metadata: Metadata = {
  title: 'Peta Jalur Belajar',
  description:
    'Kurikulum basket tiga level: Fondasi Dasar, Konsep Menengah, dan Taktik Lanjutan — dari aturan FIBA sampai set play profesional.',
}

/** S-04 Peta Jalur Belajar. */
export default function LearnPage() {
  return <LearningMap />
}
