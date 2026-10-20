import type { Metadata } from 'next'

import { Profile } from '@/components/profile/Profile'

export const metadata: Metadata = { title: 'Profil' }

/** S-10 Profil & Progres. */
export default function ProfilePage() {
  return <Profile />
}
