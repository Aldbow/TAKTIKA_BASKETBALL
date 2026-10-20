import type { Metadata } from 'next'

import { Dashboard } from '@/components/dashboard/Dashboard'

export const metadata: Metadata = { title: 'Beranda' }

/** S-03 Dashboard. */
export default function DashboardPage() {
  return <Dashboard />
}
