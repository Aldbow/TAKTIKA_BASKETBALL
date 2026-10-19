'use client'

/**
 * Menerapkan pengaturan ke dokumen — F-30.
 *
 * Komponen ini tidak merender apa pun. Tugasnya menyambungkan tiga hal:
 *  1. preferensi `prefers-reduced-motion` milik OS -> store (kriteria F-30)
 *  2. tema & kontras tinggi -> atribut di <html>, yang membuat token CSS
 *     (src/styles/tokens.css) dan palet renderer ikut berubah
 *  3. theme-color bilah browser -> warna latar tema aktif
 */

import { useEffect } from 'react'

import { useSettings } from '@/stores/settingsStore'

export function SettingsEffects() {
  const theme = useSettings((s) => s.theme)
  const highContrast = useSettings((s) => s.highContrast)
  const reducedMotionPref = useSettings((s) => s.reducedMotionPref)
  const osReducedMotion = useSettings((s) => s.osReducedMotion)
  const setOsReducedMotion = useSettings((s) => s.setOsReducedMotion)

  // 1. Pantau preferensi gerak OS.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setOsReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setOsReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [setOsReducedMotion])

  // 2. Terapkan tema, kontras, dan kurangi gerak ke <html>.
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'whiteboard') root.setAttribute('data-theme', 'whiteboard')
    else root.removeAttribute('data-theme')

    if (highContrast) root.setAttribute('data-contrast', 'high')
    else root.removeAttribute('data-contrast')

    // Preferensi OS selalu menang bila menyala (kriteria penerimaan F-30).
    const reduced = osReducedMotion || reducedMotionPref
    if (reduced) root.setAttribute('data-reduced-motion', 'true')
    else root.removeAttribute('data-reduced-motion')

    root.style.colorScheme = theme === 'whiteboard' ? 'light' : 'dark'

    // 3. Warna bilah browser mengikuti tema.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', theme === 'whiteboard' ? '#f4f6fb' : '#05070d')
    }
  }, [theme, highContrast, reducedMotionPref, osReducedMotion])

  return null
}
