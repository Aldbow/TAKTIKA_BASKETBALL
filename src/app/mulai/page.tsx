import type { Metadata } from 'next'

import { Onboarding } from '@/components/onboarding/Onboarding'

export const metadata: Metadata = {
  title: 'Mulai',
  description: 'Empat pertanyaan singkat untuk menyusun jalur belajar basketmu.',
}

/** S-02 Onboarding. */
export default function OnboardingPage() {
  return <Onboarding />
}
