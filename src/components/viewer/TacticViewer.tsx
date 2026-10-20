'use client'

/**
 * Tactic Viewer (S-07) — layar terpenting aplikasi.
 *
 * Tata letak PRD §11:
 *   >= 1280 px  : panel fase kiri 280 px · lapangan tengah · panel POV kanan 320 px · timeline bawah 88 px
 *   768-1279 px : panel fase jadi laci; panel POV tetap kanan
 *   < 768 px    : setengah lapangan atas (~60% tinggi), timeline, lalu lembar bawah bertab
 *
 * Aturan yang ditegakkan: "Lapangan tidak pernah tertutup panel; semua kendali
 * berada di tepi."
 *
 * Pintasan keyboard PRD §11 diimplementasikan lengkap:
 *   Spasi · panah kiri/kanan · Shift+panah · 1-5 · Shift+1-5 · V · L · [ ] · F
 */

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  CATEGORY_TOKEN,
  getPredictionPath,
  t as localize,
  playerLabel,
  type PlayerId,
  type Tactic,
  type Vec2,
} from '@/engine/runtime'
import { CourtCanvas } from '@/renderer2d/CourtCanvas'
import { CourtOverlay } from '@/renderer2d/overlay/CourtOverlay'
import type { CourtTransform } from '@/engine/runtime'
import { effectiveQuality, effectiveReducedMotion, useSettings } from '@/stores/settingsStore'
import { useProgress } from '@/stores/progressStore'
import { useViewer } from '@/stores/viewerStore'
import { FpsProbe, deviceClass } from '@/lib/quality'
import { track } from '@/lib/analytics'
import { GlassPanel, Icon, IconButton, cx } from '@/components/ui'
import { Timeline } from '@/components/timeline/Timeline'
import { PlaybackControls } from './PlaybackControls'
import { PhasePanel } from './PhasePanel'
import { PovPanel } from '@/components/pov/PovPanel'
import { WhatIfPanel } from './WhatIfPanel'
import { LayersMenu } from './LayersMenu'
import { useTacticPlayer } from './useTacticPlayer'

/** Durasi blend saat cabang diganti — PRD §8 F-14: "transisi 400-600 ms". */
const BRANCH_BLEND_MS = 500
/** Durasi transisi kamera POV — PRD §10 token motion.camera. */
const POV_BLEND_MS = 900

export interface TacticViewerProps {
  tactic: Tactic
  /** Waktu & POV awal dari deep link (F-16) */
  initialPhase?: number | null
  initialPov?: PlayerId | null
  /** Mode sematan: tanpa panel, dipakai pelajaran & glosarium */
  embedded?: boolean
}

export function TacticViewer({
  tactic,
  initialPhase = null,
  initialPov = null,
  embedded = false,
}: TacticViewerProps) {
  /* ---------------------------------------------------------------------- */
  /* Pengaturan & store                                                     */
  /* ---------------------------------------------------------------------- */

  const settings = useSettings()
  const reducedMotion = effectiveReducedMotion(settings)
  const quality = effectiveQuality(settings)
  const setDetectedTier = useSettings((s) => s.setDetectedTier)

  const viewer = useViewer()
  const markTacticWatched = useProgress((s) => s.markTacticWatched)
  const markPovSeen = useProgress((s) => s.markPovSeen)
  const markBranchSeen = useProgress((s) => s.markBranchSeen)
  const toggleCollection = useProgress((s) => s.toggleCollection)
  const setLastVisited = useProgress((s) => s.setLastVisited)
  const inCollection = useProgress((s) =>
    s.collection.some((c) => c.id === tactic.id && c.kind === 'tactic'),
  )

  const accent = CATEGORY_TOKEN[tactic.category]

  /* ---------------------------------------------------------------------- */
  /* Jam & engine                                                           */
  /* ---------------------------------------------------------------------- */

  const player = useTacticPlayer({
    tactic,
    activeBranches: viewer.activeBranches,
    reducedMotion,
    onTacticEnd: () => markTacticWatched(tactic.id),
  })

  const { state, snapshot } = player
  const bulletTime = snapshot.bulletScale < 0.999

  /* ---------------------------------------------------------------------- */
  /* Inisialisasi dari deep link (F-16)                                     */
  /* ---------------------------------------------------------------------- */

  const initialised = useRef(false)
  useEffect(() => {
    if (initialised.current) return
    initialised.current = true

    viewer.openTactic(tactic.id, initialPhase !== null || initialPov ? 'link' : 'library')
    // Kartu "Lanjutkan" di dashboard (PRD §12 Alur 5). Mode sematan bukan
    // kunjungan taktik, jadi tidak dicatat.
    if (!embedded) {
      setLastVisited({
        kind: 'tactic',
        id: tactic.id,
        title: localize(tactic.title),
        href: `/taktik/${tactic.slug}`,
      })
    }
    if (initialPhase !== null) player.jumpToPhase(initialPhase)
    if (initialPov) {
      viewer.selectPov(initialPov, tactic)
      markPovSeen(tactic.id, initialPov)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------------------------------------------------------------------- */
  /* Blend POV (A-11) & blend cabang (A-13)                                 */
  /* ---------------------------------------------------------------------- */

  const setPovBlend = useViewer((s) => s.setPovBlend)
  useEffect(() => {
    if (!viewer.pov) {
      setPovBlend(0)
      return
    }
    if (reducedMotion) {
      // F-30: transisi kamera jadi crossfade — langsung penuh tanpa dolly.
      setPovBlend(1)
      return
    }
    let raf = 0
    const start = performance.now()
    const step = (now: number) => {
      const u = Math.min(1, (now - start) / POV_BLEND_MS)
      setPovBlend(u)
      if (u < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [viewer.pov, reducedMotion, setPovBlend])

  const setBranchBlend = useViewer((s) => s.setBranchBlend)
  const setGhostPaths = useViewer((s) => s.setGhostPaths)
  const branchKeyStr = viewer.activeBranches.join('|')
  useEffect(() => {
    if (reducedMotion) {
      setBranchBlend(1)
      setGhostPaths([])
      return
    }
    let raf = 0
    const start = performance.now()
    const step = (now: number) => {
      const u = Math.min(1, (now - start) / BRANCH_BLEND_MS)
      setBranchBlend(u)
      if (u < 1) raf = requestAnimationFrame(step)
      else setGhostPaths([])
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [branchKeyStr, reducedMotion, setBranchBlend, setGhostPaths])

  /* ---------------------------------------------------------------------- */
  /* Tier kualitas otomatis (F-30)                                          */
  /* ---------------------------------------------------------------------- */

  const probe = useRef(new FpsProbe())
  const onFps = useCallback(
    (fps: number) => {
      const tier = probe.current.push(fps)
      if (tier) {
        setDetectedTier(tier)
        track({
          name: 'quality_tier_assigned',
          tier,
          avg_fps: Math.round(probe.current.median()),
          device_class: deviceClass(),
        })
      }
    },
    [setDetectedTier],
  )

  /* ---------------------------------------------------------------------- */
  /* Aksi                                                                   */
  /* ---------------------------------------------------------------------- */

  const selectPov = useCallback(
    (id: PlayerId | null) => {
      viewer.selectPov(id, tactic)
      if (id) markPovSeen(tactic.id, id)
    },
    [markPovSeen, tactic, viewer],
  )

  /**
   * Mengganti cabang. Sebelum menyetel cabang baru, jalur pemain SEKARANG
   * disimpan sebagai jalur bayangan — itulah "jalur lama memudar jadi bayangan
   * 20%" di A-13.
   */
  const setBranch = useCallback(
    (branchId: string | null, group: string) => {
      if (!reducedMotion) {
        const ghosts: Vec2[][] = state.players
          .filter((p) => p.team === 'offense' || viewer.layers.defenders)
          .map((p) => getPredictionPath(player.ctx, p.id, state.t))
          .filter((path) => path.length > 1)
        setGhostPaths(ghosts)
      }
      viewer.setBranch(tactic, branchId, group)
      if (branchId) markBranchSeen(tactic.id, branchId)
    },
    [markBranchSeen, player.ctx, reducedMotion, setGhostPaths, state, tactic, viewer],
  )

  const toggleFullscreen = useCallback(() => {
    const el = document.documentElement
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen?.()
    viewer.setPresenting(!document.fullscreenElement)
  }, [viewer])

  /* ---------------------------------------------------------------------- */
  /* Pintasan keyboard — PRD §11                                            */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      // Jangan rebut tombol saat pengguna sedang mengetik atau memakai slider.
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (target?.isContentEditable) return
      if (target?.getAttribute('role') === 'slider') return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          player.toggle()
          return
        case 'ArrowLeft':
          e.preventDefault()
          if (e.shiftKey) player.nudge(-1)
          else player.stepPhase(-1)
          return
        case 'ArrowRight':
          e.preventDefault()
          if (e.shiftKey) player.nudge(1)
          else player.stepPhase(1)
          return
        case 'v':
        case 'V':
          e.preventDefault()
          viewer.setMode(viewer.mode === '2d' ? '3d' : '2d')
          return
        case 'l':
        case 'L':
          e.preventDefault()
          viewer.setLayersMenuOpen(!viewer.layersMenuOpen)
          return
        case '[':
          e.preventDefault()
          player.slower()
          return
        case ']':
          e.preventDefault()
          player.faster()
          return
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          return
        default:
          break
      }

      // 1-5 memilih POV menyerang; Shift+1-5 memilih bek X1-X5.
      if (/^[1-5]$/.test(e.key)) {
        e.preventDefault()
        const id = `O${e.key}` as PlayerId
        selectPov(id)
        return
      }
      // Shift+angka menghasilkan simbol pada tata letak keyboard AS.
      const shiftMap: Record<string, string> = {
        '!': '1',
        '@': '2',
        '#': '3',
        $: '4',
        '%': '5',
      }
      if (e.shiftKey && shiftMap[e.key]) {
        e.preventDefault()
        selectPov(`X${shiftMap[e.key]}` as PlayerId)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [player, selectPov, toggleFullscreen, viewer])

  /* ---------------------------------------------------------------------- */
  /* Transform untuk overlay                                                */
  /* ---------------------------------------------------------------------- */

  const [transform, setTransform] = useState<CourtTransform | null>(null)

  const lens = useMemo(
    () => (viewer.pov ? tactic.povLenses.find((l) => l.playerId === viewer.pov) ?? null : null),
    [tactic.povLenses, viewer.pov],
  )

  const focusPlayers = useMemo(
    () => (viewer.pov ? [] : (state.phase?.focus ?? [])),
    [state.phase, viewer.pov],
  )

  /** Lapisan yang tidak masuk akal pada taktik ini. */
  const disabledLayers = useMemo(() => {
    const out: Partial<Record<keyof typeof viewer.layers, string>> = {}
    if (tactic.court === 'full') {
      out.spacing = 'Zona spacing hanya diukur di setengah lapangan.'
    }
    return out
  }, [tactic.court, viewer.layers])

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  const court = (
    <div className="relative min-h-0 flex-1">
      <CourtCanvas
        ctx={player.ctx}
        clock={player.clock}
        bus={player.bus}
        layers={viewer.layers}
        pov={{ playerId: viewer.pov, blend: viewer.povBlend }}
        camera={viewer.camera}
        quality={quality}
        reducedMotion={reducedMotion}
        branchBlend={viewer.branchBlend}
        ghostPaths={viewer.ghostPaths}
        focusPlayers={focusPlayers}
        highlightedZones={viewer.highlightedZones}
        laser={viewer.laser}
        annotations={viewer.annotations}
        onPlayerTap={(id) => selectPov(id)}
        onTransform={setTransform}
        onFps={onFps}
        className="absolute inset-0"
        ariaLabel={`Lapangan taktik ${localize(tactic.title)}, fase ${
          state.phaseIndex + 1
        } dari ${tactic.phases.length}`}
      />
      <CourtOverlay
        transform={transform}
        state={state}
        lens={lens}
        showCueCard={bulletTime || Boolean(state.decision)}
      />
    </div>
  )

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        {court}
        <PlaybackControls
          playing={snapshot.playing}
          speed={snapshot.speed}
          bulletTime={bulletTime}
          onToggle={player.toggle}
          onStepPhase={player.stepPhase}
          onReplayPhase={player.replayPhase}
          onSetSpeed={player.setSpeed}
          compact
        />
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Bilah atas */}
      <header className="flex shrink-0 items-center gap-2 border-b border-[var(--glass-border)] px-3 py-2">
        <Link
          href="/taktik"
          className="flex touch-target items-center gap-1.5 rounded-lg px-2 text-sm text-[var(--text-secondary)] transition-colors duration-fast hover:text-[var(--text-primary)]"
        >
          <Icon.ChevronRight size={16} className="rotate-180" />
          <span className="hidden tablet:inline">Perpustakaan</span>
        </Link>

        <div className="min-w-0 flex-1 desktop:hidden">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {localize(tactic.title)}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <IconButton
            label={inCollection ? 'Hapus dari koleksi' : 'Simpan ke koleksi'}
            active={inCollection}
            size="sm"
            onClick={() => toggleCollection(tactic.id, 'tactic')}
          >
            <Icon.Bookmark size={16} />
          </IconButton>
          <Link
            href={`/taktik/${tactic.slug}/kuis`}
            className={cx(
              'inline-flex touch-target items-center justify-center gap-2 rounded-full px-4 text-sm',
              'border border-[var(--glass-border)] bg-[var(--bg-glass)] text-[var(--text-primary)]',
              'backdrop-blur transition-colors duration-fast hover:border-[color-mix(in_srgb,var(--team-offense)_55%,transparent)]',
            )}
          >
            <Icon.Target size={15} />
            <span className="hidden tablet:inline">Baca &amp; Bereaksi</span>
            <span className="tablet:hidden">Kuis</span>
          </Link>
        </div>
      </header>

      {/* Badan: panel kiri · lapangan · panel kanan */}
      <div className="flex min-h-0 flex-1">
        {/* Panel fase — laci di tablet, kolom tetap di desktop */}
        <PhasePanel
          tactic={tactic}
          activePhaseIndex={state.phaseIndex}
          activeBranches={viewer.activeBranches}
          onJumpToPhase={player.jumpToPhase}
          onPlayBranch={setBranch}
          className="hidden shrink-0 border-r border-[var(--glass-border)] desktop:flex"
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {court}

          {/* Timeline + kendali (bawah 88 px di desktop) */}
          <div className="shrink-0 border-t border-[var(--glass-border)] px-3 pb-2 pt-1">
            <Timeline
              phases={tactic.phases}
              decisions={tactic.decisions}
              duration={tactic.duration}
              t={state.t}
              category={tactic.category}
              activePhaseIndex={state.phaseIndex}
              bulletTime={bulletTime}
              onSeek={(t) => {
                track({
                  name: 'timeline_scrubbed',
                  tactic_id: tactic.id,
                  from_t: Math.round(state.t * 10) / 10,
                  to_t: Math.round(t * 10) / 10,
                })
                player.seek(t)
              }}
              onJumpToPhase={player.jumpToPhase}
            />
            <div className="relative mt-1">
              <PlaybackControls
                playing={snapshot.playing}
                speed={snapshot.speed}
                bulletTime={bulletTime}
                onToggle={player.toggle}
                onStepPhase={player.stepPhase}
                onReplayPhase={player.replayPhase}
                onSetSpeed={player.setSpeed}
                extras={
                  <>
                    <IconButton
                      label="Lapisan visual (L)"
                      active={viewer.layersMenuOpen}
                      size="sm"
                      onClick={() => viewer.setLayersMenuOpen(!viewer.layersMenuOpen)}
                    >
                      <Icon.Layers size={17} />
                    </IconButton>
                    <IconButton
                      label="Mode 3D (V) — belum tersedia"
                      size="sm"
                      disabled
                      title="Mode 3D (F-12) direncanakan untuk fase 2"
                    >
                      <Icon.Cube size={17} />
                    </IconButton>
                    <IconButton label="Layar penuh (F)" size="sm" onClick={toggleFullscreen}>
                      <Icon.Fullscreen size={17} />
                    </IconButton>
                  </>
                }
              />
              {viewer.layersMenuOpen && (
                <LayersMenu
                  layers={viewer.layers}
                  onToggle={viewer.toggleLayer}
                  onClose={() => viewer.setLayersMenuOpen(false)}
                  disabled={disabledLayers}
                />
              )}
            </div>
          </div>
        </div>

        {/* Panel POV + Bagaimana jika (kanan) */}
        <aside
          className="hidden shrink-0 flex-col border-l border-[var(--glass-border)] tablet:flex"
          style={{ width: 'var(--viewer-pov-panel)' }}
        >
          <div className="scrollable min-h-0 flex-1">
            <PovPanel
              tactic={tactic}
              pov={viewer.pov}
              activePhaseIndex={state.phaseIndex}
              activeBranches={viewer.activeBranches}
              inDecision={Boolean(state.decision)}
              onSelectPov={selectPov}
              onPlayBranch={setBranch}
            />
            <div className="border-t border-[var(--glass-border)]">
              <WhatIfPanel
                tactic={tactic}
                activeBranches={viewer.activeBranches}
                onSetBranch={setBranch}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Lembar bawah bertab — mobile */}
      <MobileSheet
        tactic={tactic}
        state={state}
        viewer={viewer}
        onSelectPov={selectPov}
        onPlayBranch={setBranch}
        onJumpToPhase={player.jumpToPhase}
        accent={accent}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Lembar bawah mobile — PRD §11: "lembar bawah bertab: Fase, POV,            */
/* Bagaimana Jika, Kuis"                                                      */
/* -------------------------------------------------------------------------- */

function MobileSheet({
  tactic,
  state,
  viewer,
  onSelectPov,
  onPlayBranch,
  onJumpToPhase,
  accent,
}: {
  tactic: Tactic
  state: ReturnType<typeof useTacticPlayer>['state']
  viewer: ReturnType<typeof useViewer.getState>
  onSelectPov: (id: PlayerId | null) => void
  onPlayBranch: (id: string | null, group: string) => void
  onJumpToPhase: (i: number) => void
  accent: string
}) {
  const [open, setOpen] = useState(false)
  const tabs = [
    { key: 'phases' as const, label: 'Fase' },
    { key: 'pov' as const, label: 'POV' },
    { key: 'whatif' as const, label: 'Bagaimana jika' },
    { key: 'quiz' as const, label: 'Kuis' },
  ]

  return (
    <GlassPanel
      bevel={false}
      className="shrink-0 rounded-none border-x-0 border-b-0 tablet:hidden"
    >
      <div className="flex items-center gap-1 overflow-x-auto px-2 py-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              viewer.setMobileTab(tab.key)
              setOpen(true)
            }}
            aria-expanded={open && viewer.mobileTab === tab.key}
            className={cx(
              'hud shrink-0 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-wide transition-colors duration-fast',
              open && viewer.mobileTab === tab.key
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)]',
            )}
            style={
              open && viewer.mobileTab === tab.key
                ? { background: `color-mix(in srgb, ${accent} 16%, transparent)` }
                : undefined
            }
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Tutup panel' : 'Buka panel'}
          className="ml-auto shrink-0 rounded-full p-2 text-[var(--text-secondary)]"
        >
          <Icon.ChevronDown
            size={16}
            className={cx('transition-transform duration-base', open && 'rotate-180')}
          />
        </button>
      </div>

      {open && (
        <div className="scrollable max-h-[46dvh] border-t border-[var(--glass-border)]">
          {viewer.mobileTab === 'phases' && (
            <PhasePanel
              tactic={tactic}
              activePhaseIndex={state.phaseIndex}
              activeBranches={viewer.activeBranches}
              onJumpToPhase={onJumpToPhase}
              onPlayBranch={onPlayBranch}
            />
          )}
          {viewer.mobileTab === 'pov' && (
            <PovPanel
              tactic={tactic}
              pov={viewer.pov}
              activePhaseIndex={state.phaseIndex}
              activeBranches={viewer.activeBranches}
              inDecision={Boolean(state.decision)}
              onSelectPov={onSelectPov}
              onPlayBranch={onPlayBranch}
            />
          )}
          {viewer.mobileTab === 'whatif' && (
            <WhatIfPanel
              tactic={tactic}
              activeBranches={viewer.activeBranches}
              onSetBranch={onPlayBranch}
            />
          )}
          {viewer.mobileTab === 'quiz' && (
            <div className="flex flex-col gap-3 p-4">
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Kuis Baca &amp; Bereaksi menjeda taktik ini di {tactic.scenarios.length} momen
                keputusan dan memintamu memilih umpan yang benar.
              </p>
              <Link
                href={`/taktik/${tactic.slug}/kuis`}
                className="inline-flex touch-target items-center justify-center gap-2 rounded-full bg-[var(--team-offense)] px-4 text-sm font-semibold text-[var(--text-inverse)]"
              >
                <Icon.Target size={16} />
                Mulai kuis
              </Link>
              <ul className="flex flex-col gap-1.5">
                {tactic.scenarios.map((s, i) => (
                  <li key={s.id} className="flex gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="hud shrink-0" style={{ color: accent }}>
                      {i + 1}
                    </span>
                    {localize(s.prompt)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  )
}

/** Dipakai panel POV mobile untuk menampilkan label pemain. */
export { playerLabel }
