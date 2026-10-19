/**
 * Tactic Engine — titik masuk tunggal.
 *
 * PRD §14: "Jantung aplikasi adalah Tactic Engine: paket TypeScript mandiri yang
 * mengubah JSON taktik menjadi 'keadaan lapangan' untuk setiap waktu t.
 * Renderer 2D, renderer 3D, panel POV, dan kuis semuanya membaca keadaan yang
 * sama dari mesin ini."
 *
 * Modul ini TIDAK mengimpor React atau DOM. Itu disengaja: engine bisa diuji
 * sebagai TS murni, dipakai Studio Konten, dan nanti dipakai renderer 3D (F-12)
 * tanpa perubahan.
 */

export * from './court'
export * from './schema'
export * from './geometry'
export * from './speed'
export * from './branch'
export * from './interpolator'
export * from './ball'
export * from './state'
export * from './clock'
export * from './events'
export * from './validate'
export * from './loader'
