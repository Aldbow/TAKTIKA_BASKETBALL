import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google'

import '@/styles/globals.css'
import { AppShell } from '@/components/nav/AppShell'
import { SettingsEffects } from '@/components/nav/SettingsEffects'
import { BadgeWatcher } from '@/components/nav/BadgeWatcher'
import { PerfHud } from '@/components/nav/PerfHud'

/**
 * Tipografi PRD §9:
 *   Display & judul : Space Grotesk (Bold 600-700, tracking -1%)
 *   Teks isi        : Plus Jakarta Sans (Regular 400, Medium 500)
 *   Angka HUD       : JetBrains Mono (timer, shot clock, koordinat, skor)
 *
 * Ketiganya berlisensi terbuka — menjawab risiko R6 PRD §18 ("Masalah lisensi
 * font, pustaka, aset 3D, atau nama tim").
 */
const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'TAKTIKA — Laboratorium Taktik Basket',
    template: '%s · TAKTIKA',
  },
  description:
    'Belajar basket dari aturan dasar sampai taktik profesional. Setiap taktik divisualkan di lapangan holografis interaktif dan bisa dilihat dari sudut pandang setiap posisi.',
  applicationName: 'TAKTIKA',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'TAKTIKA', statusBarStyle: 'black-translucent' },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'TAKTIKA',
    title: 'TAKTIKA — Laboratorium Taktik Basket',
    description:
      'Lapangan taktik animasi dengan mode POV per posisi, cabang "bagaimana jika", dan kuis Baca & Bereaksi.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // PRD §15: teks tetap terbaca saat diperbesar 200% — jadi zoom tidak dibatasi.
  maximumScale: 5,
  themeColor: '#05070d',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning hanya berlaku untuk atribut <html> itu sendiri:
    // SettingsEffects menyetel data-theme/data-contrast di sini, dan ekstensi
    // browser kerap menyisipkan atribut (mis. cvd="1") sebelum React hidrasi.
    <html
      lang="id"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Lompat ke konten — syarat navigasi keyboard saja (PRD §15). */}
        <a
          href="#konten"
          className="sr-only-focusable fixed left-4 top-4 z-50 rounded-full bg-[var(--team-offense)] px-4 py-2 text-sm font-semibold text-[var(--text-inverse)]"
        >
          Lompat ke konten
        </a>
        <SettingsEffects />
        <AppShell>{children}</AppShell>
        <BadgeWatcher />
        <PerfHud />
      </body>
    </html>
  )
}
