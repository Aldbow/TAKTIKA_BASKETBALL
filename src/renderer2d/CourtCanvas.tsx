'use client'

/**
 * Renderer 2D — komponen React tunggal yang menggambar lapangan taktik.
 *
 * Kontrak arsitektur PRD §14 yang dijaga:
 *   "Renderer 2D dan 3D tidak menyimpan posisi sendiri; keduanya menggambar
 *    dari getState(t) milik Tactic Engine."
 *
 * Satu loop requestAnimationFrame per lapangan:
 *   baca clock.t  ->  getState(t)  ->  bus.update(state)  ->  gambar lapisan
 *
 * Lapisan teks yang perlu bisa dibaca pembaca layar TIDAK digambar di canvas;
 * itu tugas CourtOverlay (PRD §14: "lapisan SVG/HTML untuk label ... label tetap
 * bisa dibaca pembaca layar").
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import {
  courtBounds,
  fitCourt,
  toMeters,
  type CourtTransform,
  type MasterClock,
  type PlayerId,
  type StateContext,
  type TacticEventBus,
  type Vec2,
} from '@/engine'
import { getState } from '@/engine'
import { resolvePalette, renderQuality, type Palette, type QualityTier } from './palette'
import {
  DEFAULT_CAMERA,
  type CameraState,
  type LayerFlags,
  type PovState,
  type QuizTarget,
  type RenderFrame,
} from './types'
import { drawCourtLines, drawFloor, drawPaintFill, drawZoneLabels } from './draw/court'
import { drawBackLayers } from './draw/layers'
import { drawNotation } from './draw/notation'
import { drawBall } from './draw/ball'
import { drawPlayers, playerHitRadius } from './draw/players'
import {
  drawAnnotations,
  drawDecisionOverlay,
  drawFrozenFrame,
  drawLaser,
  drawPovOverlay,
  drawQuizTargets,
} from './draw/pov'

export interface CourtCanvasProps {
  /** Konteks engine (dari getStateContext) */
  ctx: StateContext
  /** Jam induk; bila tidak diberikan, lapangan statis pada `t` */
  clock?: MasterClock | null
  /** Waktu tetap bila tidak ada jam (dipakai thumbnail & Studio Konten) */
  t?: number
  layers: LayerFlags
  pov: PovState
  camera?: CameraState
  quality?: QualityTier
  reducedMotion?: boolean
  /** Lewati animasi boot-up (A-01) — dipakai thumbnail & kunjungan ulang */
  skipBootUp?: boolean
  frozen?: boolean
  quizTargets?: QuizTarget[]
  branchBlend?: number
  ghostPaths?: Vec2[][]
  focusPlayers?: PlayerId[]
  highlightedZones?: string[]
  laser?: Vec2 | null
  annotations?: Vec2[][]
  /** Event bus; renderer memanggil update() sekali per frame */
  bus?: TacticEventBus | null
  /** Pemain diketuk — dipakai memilih POV langsung di lapangan (F-13) */
  onPlayerTap?: (id: PlayerId) => void
  /** Titik lapangan diketuk (meter) — dipakai kuis & Studio Konten */
  onCourtTap?: (at: Vec2, pxEvent: { x: number; y: number }) => void
  /** Pointer bergerak di atas lapangan (meter) */
  onCourtPointerMove?: (at: Vec2 | null) => void
  /** Transform terkini — dipakai overlay untuk memposisikan elemen DOM */
  onTransform?: (t: CourtTransform) => void
  /** fps terukur, dilaporkan tiap ~500 ms (F-30 tier otomatis) */
  onFps?: (fps: number) => void
  className?: string
  /** Label aksesibilitas untuk canvas */
  ariaLabel?: string
}

export function CourtCanvas({
  ctx,
  clock = null,
  t: fixedT = 0,
  layers,
  pov,
  camera = DEFAULT_CAMERA,
  quality = 'high',
  reducedMotion = false,
  skipBootUp = false,
  frozen = false,
  quizTargets = [],
  branchBlend = 1,
  ghostPaths = [],
  focusPlayers = [],
  highlightedZones = [],
  laser = null,
  annotations = [],
  bus = null,
  onPlayerTap,
  onCourtTap,
  onCourtPointerMove,
  onTransform,
  onFps,
  className,
  ariaLabel,
}: CourtCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const paletteRef = useRef<Palette>(resolvePalette(null))
  const transformRef = useRef<CourtTransform | null>(null)
  const mountedAtRef = useRef<number>(0)

  const renderQ = useMemo(() => renderQuality(quality, reducedMotion), [quality, reducedMotion])

  // Props yang berubah sering disimpan di ref agar loop rAF tidak perlu
  // dibangun ulang setiap render — itu akan menyebabkan patah-patah.
  const propsRef = useRef({
    ctx,
    clock,
    fixedT,
    layers,
    pov,
    camera,
    renderQ,
    skipBootUp,
    frozen,
    quizTargets,
    branchBlend,
    ghostPaths,
    focusPlayers,
    highlightedZones,
    laser,
    annotations,
    bus,
    onFps,
    onTransform,
  })
  // Diperbarui setelah commit (sebelum frame berikutnya digambar), bukan saat
  // render — render bisa dijalankan React tanpa pernah di-commit.
  useLayoutEffect(() => {
    propsRef.current = {
      ctx,
      clock,
      fixedT,
      layers,
      pov,
      camera,
      renderQ,
      skipBootUp,
      frozen,
      quizTargets,
      branchBlend,
      ghostPaths,
      focusPlayers,
      highlightedZones,
      laser,
      annotations,
      bus,
      onFps,
      onTransform,
    }
  })

  /* ---------------------------------------------------------------------- */
  /* Ukuran & devicePixelRatio                                              */
  /* ---------------------------------------------------------------------- */

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const measure = () => {
      const rect = el.getBoundingClientRect()
      setSize({ w: Math.max(1, Math.round(rect.width)), h: Math.max(1, Math.round(rect.height)) })
    }
    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* ---------------------------------------------------------------------- */
  /* Palet: dibaca saat dipasang & saat tema / kontras berubah               */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const read = () => {
      paletteRef.current = resolvePalette(wrapRef.current ?? document.documentElement)
    }
    read()

    // Tema dan kontras disimpan sebagai atribut di <html>; pantau perubahannya.
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-contrast'],
    })
    return () => mo.disconnect()
  }, [])

  /* ---------------------------------------------------------------------- */
  /* Loop render                                                            */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size.w <= 1 || size.h <= 1) return

    const g = canvas.getContext('2d', { alpha: false })
    if (!g) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
    canvas.width = Math.round(size.w * dpr)
    canvas.height = Math.round(size.h * dpr)
    canvas.style.width = `${size.w}px`
    canvas.style.height = `${size.h}px`

    mountedAtRef.current = performance.now()

    let raf = 0
    let fpsFrames = 0
    let fpsSince = performance.now()

    const render = (now: number) => {
      const p = propsRef.current
      const wallMs = now - mountedAtRef.current

      g.setTransform(dpr, 0, 0, dpr, 0, 0)

      const palette = paletteRef.current
      // Latar luar lapangan.
      g.fillStyle = palette.bgVoid
      g.fillRect(0, 0, size.w, size.h)

      // Transform lapangan: padding memberi ruang untuk glow di tepi.
      const pad = Math.max(8, Math.min(28, Math.min(size.w, size.h) * 0.035))
      const base = fitCourt(p.ctx.compiled.court, size.w, size.h, pad)
      // Zoom & fokus kamera Taktis (orbit/tilt butuh 3D, F-12).
      const transform = applyCameraZoom(base, p.camera, size.w, size.h)
      // Beri tahu overlay hanya saat transform BERUBAH — memanggil setState
      // setiap frame akan membuat React merender ulang 60x per detik.
      if (!sameTransform(transformRef.current, transform)) {
        p.onTransform?.(transform)
      }
      transformRef.current = transform

      // Waktu taktik: dari jam induk bila ada, kalau tidak dari prop tetap.
      const tactT = p.clock ? p.clock.time : p.fixedT
      const state = getState(p.ctx, tactT)
      p.bus?.update(state)

      // Progres boot-up A-01.
      const bootMs = p.skipBootUp ? 0 : p.renderQ.bootUpMs
      const bootProgress = bootMs <= 0 ? 1 : Math.min(1, wallMs / bootMs)

      const frame: RenderFrame = {
        g,
        transform,
        palette,
        quality: p.renderQ,
        state,
        ctx: p.ctx,
        layers: p.layers,
        pov: p.pov,
        camera: p.camera,
        wallMs,
        bootProgress,
        frozen: p.frozen,
        quizTargets: p.quizTargets,
        branchBlend: p.branchBlend,
        ghostPaths: p.ghostPaths,
        focusPlayers: p.focusPlayers,
        laser: p.laser,
        annotations: p.annotations,
      }

      // Urutan tumpukan visual. Urutan ini adalah keputusan desain:
      // lantai -> lapisan analitik -> notasi -> token -> overlay keputusan.
      // Token pemain SELALU di atas garis supaya posisi tidak pernah tertutup
      // (PRD §11: "Lapangan tidak pernah tertutup panel").
      drawFloor(frame)
      drawPaintFill(frame)
      drawCourtLines(frame)
      drawZoneLabels(frame, p.highlightedZones)
      drawBackLayers(frame)
      drawNotation(frame)
      drawPlayers(frame)
      drawBall(frame)
      drawPovOverlay(frame)
      drawDecisionOverlay(frame)
      drawQuizTargets(frame)
      drawAnnotations(frame)
      drawLaser(frame)
      drawFrozenFrame(frame)

      // Pemantau fps — masukan untuk pemilihan tier kualitas otomatis (F-30)
      // dan metrik `quality_tier_assigned` (PRD §16).
      fpsFrames++
      if (now - fpsSince >= 500) {
        p.onFps?.((fpsFrames * 1000) / (now - fpsSince))
        fpsFrames = 0
        fpsSince = now
      }

      raf = requestAnimationFrame(render)
    }

    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [size.w, size.h])

  /* ---------------------------------------------------------------------- */
  /* Interaksi pointer                                                      */
  /* ---------------------------------------------------------------------- */

  const pointerToMeters = useCallback((e: React.PointerEvent | React.MouseEvent): Vec2 | null => {
    const canvas = canvasRef.current
    const transform = transformRef.current
    if (!canvas || !transform) return null
    const rect = canvas.getBoundingClientRect()
    return toMeters(transform, { x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const at = pointerToMeters(e)
      const transform = transformRef.current
      if (!at || !transform) return

      // Cari pemain terdekat dalam radius sentuh (>= 44 px, PRD §15).
      if (onPlayerTap) {
        const state = getState(ctx, clock ? clock.time : fixedT)
        const hitR = playerHitRadius(transform) / transform.scale
        let best: { id: PlayerId; d: number } | null = null
        for (const pl of state.players) {
          if (pl.team === 'defense' && !layers.defenders) continue
          const d = Math.hypot(pl.position.x - at.x, pl.position.y - at.y)
          if (d <= hitR && (!best || d < best.d)) best = { id: pl.id, d }
        }
        if (best) {
          onPlayerTap(best.id)
          return
        }
      }

      const canvas = canvasRef.current
      const rect = canvas?.getBoundingClientRect()
      onCourtTap?.(at, {
        x: e.clientX - (rect?.left ?? 0),
        y: e.clientY - (rect?.top ?? 0),
      })
    },
    [clock, ctx, fixedT, layers.defenders, onCourtTap, onPlayerTap, pointerToMeters],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!onCourtPointerMove) return
      onCourtPointerMove(pointerToMeters(e))
    },
    [onCourtPointerMove, pointerToMeters],
  )

  const handlePointerLeave = useCallback(() => {
    onCourtPointerMove?.(null)
  }, [onCourtPointerMove])

  return (
    // Tanpa `position` inline: pemanggil memosisikan wrapper lewat className
    // (mis. "absolute inset-0"). Inline `position: relative` dulu menimpa kelas
    // itu, sehingga tinggi wrapper jatuh ke tinggi bawaan canvas (150 px).
    <div ref={wrapRef} className={className} style={{ minHeight: 0 }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        role="img"
        aria-label={ariaLabel ?? 'Lapangan taktik'}
        style={{ display: 'block', touchAction: 'manipulation' }}
      />
    </div>
  )
}

/**
 * Terapkan zoom & fokus kamera Taktis pada transform dasar.
 * Kemiringan (tilt) dan orbit memerlukan proyeksi 3D (F-12) dan diabaikan di
 * renderer 2D — properti tetap ada agar API kamera sama antara 2D dan 3D.
 */
function applyCameraZoom(
  base: CourtTransform,
  camera: CameraState,
  boxW: number,
  boxH: number,
): CourtTransform {
  if (camera.zoom <= 1.001 && !camera.focus) return base

  const zoom = Math.max(1, Math.min(2.5, camera.zoom))
  const scale = base.scale * zoom
  const pxWidth = base.pxWidth * zoom
  const pxHeight = base.pxHeight * zoom

  // Titik fokus tetap berada di tengah kotak tampilan.
  let offsetX = base.offsetX - (pxWidth - base.pxWidth) / 2
  let offsetY = base.offsetY - (pxHeight - base.pxHeight) / 2

  if (camera.focus) {
    const b = courtBounds(base.kind)
    const focusPx = {
      x: (camera.focus.x - b.minX) * scale,
      y: (camera.focus.y - b.minY) * scale,
    }
    offsetX = boxW / 2 - focusPx.x
    offsetY = boxH / 2 - focusPx.y
    // Jangan biarkan tepi lapangan lepas dari layar.
    offsetX = Math.min(base.offsetX, Math.max(boxW - base.offsetX - pxWidth, offsetX))
    offsetY = Math.min(base.offsetY, Math.max(boxH - base.offsetY - pxHeight, offsetY))
  }

  return { ...base, scale, offsetX, offsetY, pxWidth, pxHeight }
}

/** Apakah dua transform identik? Dipakai menekan pemberitahuan berulang. */
function sameTransform(a: CourtTransform | null, b: CourtTransform): boolean {
  return (
    a !== null &&
    a.kind === b.kind &&
    a.scale === b.scale &&
    a.offsetX === b.offsetX &&
    a.offsetY === b.offsetY
  )
}
