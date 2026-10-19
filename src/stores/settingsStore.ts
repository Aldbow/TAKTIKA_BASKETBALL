'use client'

/**
 * Pengaturan aksesibilitas & kualitas — F-30:
 *   "Kurangi gerak, kontras tinggi, kualitas grafis (Otomatis/Tinggi/Hemat), suara"
 *
 * Kriteria penerimaan F-30 yang ditegakkan di sini: "Ketika sistem operasi
 * meminta gerak dikurangi, maka transisi kamera menjadi crossfade, bullet time
 * dimatikan, dan efek partikel dinonaktifkan SECARA OTOMATIS." Jadi nilai
 * efektif `reducedMotion` adalah gabungan preferensi OS dan sakelar aplikasi —
 * pengguna bisa menyalakannya sendiri, tetapi tidak bisa diam-diam kehilangan
 * preferensi OS-nya.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import { zustandStorage } from '@/lib/storage'
import type { QualityTier } from '@/renderer2d/palette'

export type ThemeName = 'arena' | 'whiteboard'
export type QualityPreference = 'auto' | QualityTier

export interface SettingsState {
  theme: ThemeName
  highContrast: boolean
  /** Sakelar dalam aplikasi; nilai efektif digabung dengan preferensi OS. */
  reducedMotionPref: boolean
  /** Preferensi OS, diisi oleh pemantau media query (bukan dipersist). */
  osReducedMotion: boolean
  quality: QualityPreference
  /** Tier hasil uji fps otomatis (bukan dipersist — diukur ulang tiap sesi). */
  detectedTier: QualityTier | null
  soundUi: boolean
  soundCourt: boolean
  soundNarration: boolean
  /** Penghitung waktu 5 detik di kuis bisa dimatikan (PRD §12 Alur 3). */
  quizTimer: boolean
  language: 'id' | 'en'

  setTheme: (theme: ThemeName) => void
  toggleHighContrast: () => void
  setReducedMotion: (value: boolean) => void
  setOsReducedMotion: (value: boolean) => void
  setQuality: (value: QualityPreference) => void
  setDetectedTier: (tier: QualityTier) => void
  setSound: (key: 'soundUi' | 'soundCourt' | 'soundNarration', value: boolean) => void
  setQuizTimer: (value: boolean) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'arena',
      highContrast: false,
      reducedMotionPref: false,
      osReducedMotion: false,
      quality: 'auto',
      detectedTier: null,
      // PRD §10: "Suara (opsional, MATI SECARA BAWAAN)."
      soundUi: false,
      soundCourt: false,
      soundNarration: false,
      quizTimer: true,
      language: 'id',

      setTheme: (theme) => set({ theme }),
      toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
      setReducedMotion: (value) => set({ reducedMotionPref: value }),
      setOsReducedMotion: (value) => set({ osReducedMotion: value }),
      setQuality: (value) => set({ quality: value }),
      setDetectedTier: (tier) => set({ detectedTier: tier }),
      setSound: (key, value) => set({ [key]: value } as Partial<SettingsState>),
      setQuizTimer: (value) => set({ quizTimer: value }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => zustandStorage),
      // Preferensi OS dan tier hasil deteksi tidak dipersist: keduanya harus
      // diukur ulang di setiap perangkat dan setiap sesi.
      partialize: (s) => ({
        theme: s.theme,
        highContrast: s.highContrast,
        reducedMotionPref: s.reducedMotionPref,
        quality: s.quality,
        soundUi: s.soundUi,
        soundCourt: s.soundCourt,
        soundNarration: s.soundNarration,
        quizTimer: s.quizTimer,
        language: s.language,
      }),
    },
  ),
)

/* -------------------------------------------------------------------------- */
/* Nilai turunan                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Kurangi Gerak yang efektif. Preferensi OS SELALU menang bila menyala — itu
 * inti kriteria penerimaan F-30.
 */
export function effectiveReducedMotion(s: SettingsState): boolean {
  return s.osReducedMotion || s.reducedMotionPref
}

/** Tier kualitas yang dipakai renderer. */
export function effectiveQuality(s: SettingsState): QualityTier {
  if (s.quality !== 'auto') return s.quality
  return s.detectedTier ?? 'high'
}
