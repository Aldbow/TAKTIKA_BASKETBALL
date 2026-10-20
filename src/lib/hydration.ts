'use client'

/**
 * Status hidrasi store yang dipersist.
 *
 * StorageAdapter bersifat async (src/lib/storage.ts), jadi progres tamu baru
 * terbaca SETELAH render pertama. Tanpa penanda ini, halaman seperti dashboard
 * akan sekejap menampilkan "belum onboarding" untuk pengguna yang sudah
 * onboarding — atau lebih buruk, mengarahkannya ke /mulai.
 *
 * Render pertama di klien sengaja sama dengan render server (keadaan kosong),
 * sehingga tidak ada hydration mismatch.
 */

import { useSyncExternalStore } from 'react'

import { useProgress } from '@/stores/progressStore'

function subscribe(onChange: () => void): () => void {
  return useProgress.persist.onFinishHydration(onChange)
}

function getSnapshot(): boolean {
  return useProgress.persist.hasHydrated()
}

function getServerSnapshot(): boolean {
  return false
}

const noopSubscribe = () => () => {}

/** `true` di klien setelah hidrasi; `false` saat render server. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}

/** `true` setelah progres tamu selesai dibaca dari penyimpanan. */
export function useProgressHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
