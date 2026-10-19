/**
 * Analitik — ke-15 event PRD §16 "Event analitik".
 *
 * Antarmuka tipis dengan sengaja: di pengembangan event dicetak ke console, di
 * produksi disambungkan ke PostHog (PRD §14). Nama dan properti event dikunci
 * oleh tipe di bawah, sehingga nama event tidak bisa salah tulis di satu tempat
 * dan membuat funnel di dashboard menjadi kosong.
 */

export type AnalyticsEvent =
  | { name: 'onboarding_completed'; role: string; position: string; experience: string; goal: string }
  | { name: 'lesson_started'; lesson_id: string; level: number }
  | { name: 'lesson_completed'; lesson_id: string; level: number; duration_s: number }
  | { name: 'tactic_opened'; tactic_id: string; source: 'library' | 'search' | 'link' | 'lesson' | 'dashboard' | 'glossary' }
  | { name: 'tactic_played_full'; tactic_id: string; speed: number; mode: '2d' | '3d' }
  | { name: 'timeline_scrubbed'; tactic_id: string; from_t: number; to_t: number }
  | { name: 'pov_selected'; tactic_id: string; player_id: string; camera: string }
  | { name: 'branch_selected'; tactic_id: string; decision_id: string | null; branch: string }
  | { name: 'layer_toggled'; layer: string; enabled: boolean }
  | { name: 'view_mode_changed'; from: '2d' | '3d'; to: '2d' | '3d' }
  | { name: 'quiz_answered'; scenario_id: string; correct: boolean; time_ms: number }
  | { name: 'quiz_completed'; quiz_id: string; score: number }
  | { name: 'collection_saved'; item_id: string; kind: 'tactic' | 'lesson' | 'term' }
  | { name: 'account_created'; lessons_before: number }
  | { name: 'quality_tier_assigned'; tier: string; avg_fps: number; device_class: string }
  | { name: 'share_link_created'; tactic_id: string; phase: number | null; pov: string | null }

type Sink = (event: AnalyticsEvent) => void

const sinks: Sink[] = []

/**
 * Pasang penerima event. Di produksi, satu pemanggilan dari komponen root
 * cukup untuk menyambungkan PostHog:
 *   addAnalyticsSink((e) => posthog.capture(e.name, e))
 */
export function addAnalyticsSink(sink: Sink): () => void {
  sinks.push(sink)
  return () => {
    const i = sinks.indexOf(sink)
    if (i >= 0) sinks.splice(i, 1)
  }
}

/** Kirim satu event. Tidak pernah melempar — analitik tidak boleh merusak UI. */
export function track(event: AnalyticsEvent): void {
  for (const sink of sinks) {
    try {
      sink(event)
    } catch {
      // Sengaja diabaikan.
    }
  }
  if (process.env.NODE_ENV === 'development') {
    const { name, ...props } = event
    // eslint-disable-next-line no-console
    console.debug(`[analitik] ${name}`, props)
  }
}

/** Daftar nama event — dipakai halaman pengembang & uji kelengkapan. */
export const ANALYTICS_EVENT_NAMES = [
  'onboarding_completed',
  'lesson_started',
  'lesson_completed',
  'tactic_opened',
  'tactic_played_full',
  'timeline_scrubbed',
  'pov_selected',
  'branch_selected',
  'layer_toggled',
  'view_mode_changed',
  'quiz_answered',
  'quiz_completed',
  'collection_saved',
  'account_created',
  'quality_tier_assigned',
  'share_link_created',
] as const
