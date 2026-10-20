'use client'

/**
 * State Tactic Viewer — F-10, F-11, F-13, F-14.
 *
 * Catatan arsitektur penting: store ini TIDAK menyimpan waktu taktik. Waktu
 * hanya ada di MasterClock (src/engine/clock.ts). Menyimpannya di store React
 * berarti satu setState per frame, yang langsung melanggar target 60 fps
 * PRD §15. Komponen yang butuh waktu berlangganan jam, bukan store.
 */

import { create } from 'zustand'

import { normalizeActiveBranches, type PlayerId, type Tactic, type Vec2 } from '@/engine/runtime'
import { DEFAULT_CAMERA, DEFAULT_LAYERS, type CameraState, type LayerFlags } from '@/renderer2d/types'
import { track } from '@/lib/analytics'

export type ViewMode = '2d' | '3d'

/** Dari mana taktik dibuka — properti event `tactic_opened` (PRD §16). */
export type TacticSource =
  | 'library'
  | 'search'
  | 'link'
  | 'lesson'
  | 'dashboard'
  | 'glossary'

export interface ViewerState {
  tacticId: string | null
  layers: LayerFlags
  camera: CameraState
  mode: ViewMode
  /** POV terpilih, atau null */
  pov: PlayerId | null
  /** Progres blend fokus POV 0..1 — dianimasikan di komponen, bukan per frame */
  povBlend: number
  activeBranches: string[]
  /** Jalur cabang lama yang memudar jadi bayangan (A-13) */
  ghostPaths: Vec2[][]
  /** Progres blend cabang 0..1 */
  branchBlend: number
  /** Mode Presentasi Pelatih aktif (F-21) */
  presenting: boolean
  laser: Vec2 | null
  annotations: Vec2[][]
  /** Panel mana yang terbuka di lembar bawah mobile */
  mobileTab: 'phases' | 'pov' | 'whatif' | 'quiz'
  layersMenuOpen: boolean
  /** Zona yang disorot (hover peta zona / narasi pelajaran) */
  highlightedZones: string[]

  openTactic: (tacticId: string, source: TacticSource) => void
  toggleLayer: (key: keyof LayerFlags) => void
  setLayers: (layers: Partial<LayerFlags>) => void
  setCamera: (camera: Partial<CameraState>) => void
  setMode: (mode: ViewMode) => void
  selectPov: (playerId: PlayerId | null, tactic: Tactic | null) => void
  setPovBlend: (value: number) => void
  setBranch: (tactic: Tactic, branchId: string | null, group: string) => void
  clearBranches: () => void
  setGhostPaths: (paths: Vec2[][]) => void
  setBranchBlend: (value: number) => void
  setPresenting: (value: boolean) => void
  setLaser: (at: Vec2 | null) => void
  addAnnotationPoint: (at: Vec2, newStroke: boolean) => void
  clearAnnotations: () => void
  setMobileTab: (tab: ViewerState['mobileTab']) => void
  setLayersMenuOpen: (open: boolean) => void
  setHighlightedZones: (zones: string[]) => void
  reset: () => void
}

const INITIAL = {
  tacticId: null,
  layers: DEFAULT_LAYERS,
  camera: DEFAULT_CAMERA,
  mode: '2d' as ViewMode,
  pov: null,
  povBlend: 0,
  activeBranches: [] as string[],
  ghostPaths: [] as Vec2[][],
  branchBlend: 1,
  presenting: false,
  laser: null,
  annotations: [] as Vec2[][],
  mobileTab: 'phases' as const,
  layersMenuOpen: false,
  highlightedZones: [] as string[],
}

export const useViewer = create<ViewerState>()((set, get) => ({
  ...INITIAL,

  openTactic: (tacticId, source) => {
    // Membuka taktik baru mengembalikan semua lapisan & cabang ke bawaan: state
    // dari taktik sebelumnya hampir selalu salah untuk taktik berikutnya.
    set({ ...INITIAL, tacticId })
    track({ name: 'tactic_opened', tactic_id: tacticId, source })
  },

  toggleLayer: (key) => {
    const next = !get().layers[key]
    set((s) => ({ layers: { ...s.layers, [key]: next } }))
    track({ name: 'layer_toggled', layer: key, enabled: next })
  },

  setLayers: (layers) => set((s) => ({ layers: { ...s.layers, ...layers } })),

  setCamera: (camera) => set((s) => ({ camera: { ...s.camera, ...camera } })),

  setMode: (mode) => {
    const from = get().mode
    if (from === mode) return
    set({ mode })
    track({ name: 'view_mode_changed', from, to: mode })
  },

  selectPov: (playerId, tactic) => {
    const prev = get().pov
    if (prev === playerId) {
      // Mengetuk lencana yang sama menutup mode POV.
      set({ pov: null, povBlend: 0 })
      return
    }
    // povBlend dimulai dari 0 agar transisi A-11 terlihat; komponen
    // menganimasikannya ke 1 selama motion.camera (900 ms).
    set({ pov: playerId, povBlend: 0 })
    if (playerId && tactic) {
      track({
        name: 'pov_selected',
        tactic_id: tactic.id,
        player_id: playerId,
        camera: get().camera.mode,
      })
    }
  },

  setPovBlend: (value) => set({ povBlend: Math.max(0, Math.min(1, value)) }),

  setBranch: (tactic, branchId, group) => {
    const current = get().activeBranches
    // Buang pilihan lain di grup yang sama, lalu tambahkan pilihan baru.
    const others = current.filter((id) => {
      const b = tactic.branches.find((x) => x.id === id)
      return (b?.group ?? '') !== group
    })
    const next = normalizeActiveBranches(tactic, branchId ? [...others, branchId] : others)
    set({ activeBranches: next, branchBlend: 0 })
    track({
      name: 'branch_selected',
      tactic_id: tactic.id,
      decision_id: null,
      branch: branchId ?? `clear:${group}`,
    })
  },

  clearBranches: () => set({ activeBranches: [], branchBlend: 1, ghostPaths: [] }),

  setGhostPaths: (paths) => set({ ghostPaths: paths }),

  setBranchBlend: (value) => set({ branchBlend: Math.max(0, Math.min(1, value)) }),

  setPresenting: (value) =>
    set(value ? { presenting: true } : { presenting: false, laser: null }),

  setLaser: (at) => set({ laser: at }),

  addAnnotationPoint: (at, newStroke) =>
    set((s) => {
      if (newStroke || s.annotations.length === 0) return { annotations: [...s.annotations, [at]] }
      const copy = s.annotations.map((stroke, i) =>
        i === s.annotations.length - 1 ? [...stroke, at] : stroke,
      )
      return { annotations: copy }
    }),

  clearAnnotations: () => set({ annotations: [] }),

  setMobileTab: (mobileTab) => set({ mobileTab }),

  setLayersMenuOpen: (layersMenuOpen) => set({ layersMenuOpen }),

  setHighlightedZones: (highlightedZones) => set({ highlightedZones }),

  reset: () => set({ ...INITIAL }),
}))

/* -------------------------------------------------------------------------- */
/* Pembantu                                                                   */
/* -------------------------------------------------------------------------- */

/** Cabang aktif di sebuah grup, atau null. */
export function activeBranchInGroup(
  tactic: Tactic,
  activeBranches: readonly string[],
  group: string,
): string | null {
  for (const id of activeBranches) {
    const b = tactic.branches.find((x) => x.id === id)
    if ((b?.group ?? '') === group) return id
  }
  return null
}
