/**
 * Notasi aksi — PRD §9 tabel "Notasi aksi".
 *
 *   "Notasi mengikuti konvensi diagram pelatih yang sudah umum, supaya ilmu dari
 *    TAKTIKA bisa langsung dipakai di papan tulis."
 *
 * | Aksi             | Gaya garis                    | Warna          |
 * | Cut              | solid berpanah                | violet         |
 * | Dribble          | bergelombang berpanah         | cyan           |
 * | Umpan            | putus-putus berpanah          | putih -> cyan  |
 * | Screen           | garis berujung batang T       | amber          |
 * | Dribble handoff  | dua garis + simbol tukar      | cyan + amber   |
 * | Tembakan         | busur menuju ring             | volt           |
 * | Rotasi bertahan  | solid tipis, ujung memudar    | coral          |
 *
 * Gaya garis membawa informasi yang sama dengan warna — itu syarat PRD §9
 * ("aksi dibedakan juga oleh gaya garis"), sekaligus membuat notasi tetap
 * terbaca di Tema Papan Tulis dan saat dicetak hitam-putih.
 */

import {
  buildPath,
  lenPx,
  pathSlice,
  rimPosition,
  toPx,
  type CourtTransform,
  type Vec2,
} from '@/engine'
import type { ActiveEvent } from '@/engine'
import { withAlpha } from '../palette'
import { ease, type RenderFrame } from '../types'

/** Warna notasi per jenis aksi. */
function actionColor(frame: RenderFrame, type: ActiveEvent['type']): string {
  const { palette } = frame
  switch (type) {
    case 'cut':
      return palette.cut
    case 'dribble':
      return palette.offense
    case 'pass':
      return palette.pass
    case 'screen':
      return palette.screen
    case 'handoff':
      return palette.screen
    case 'shot':
      return palette.ball
    case 'rotate':
      return palette.defense
    default:
      return palette.textSecondary
  }
}

function strokeW(t: CourtTransform, scale = 1): number {
  return Math.max(1.5, Math.min(5, t.scale * 0.075 * scale))
}

/**
 * Semua notasi untuk event yang sedang aktif.
 * Digambar SEBELUM token pemain agar garis tidak menutupi angka.
 */
export function drawNotation(frame: RenderFrame): void {
  const { state, layers } = frame

  for (const ev of state.activeEvents) {
    switch (ev.type) {
      case 'cut':
      case 'move':
        if (layers.movement) drawCut(frame, ev)
        break
      case 'dribble':
        if (layers.movement) drawDribble(frame, ev)
        break
      case 'rotate':
        if (layers.movement && layers.defenders) drawDefensiveRotation(frame, ev)
        break
      case 'screen':
        if (layers.screens) drawScreen(frame, ev)
        break
      case 'handoff':
        if (layers.screens) drawHandoff(frame, ev)
        break
      case 'pass':
        drawPassLine(frame, ev)
        break
      case 'shot':
        drawShotArc(frame, ev)
        break
      default:
        break
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Cut: garis solid berpanah, menggambar dirinya di depan pemain              */
/* -------------------------------------------------------------------------- */

function drawCut(frame: RenderFrame, ev: ActiveEvent): void {
  const { g, transform: t, quality } = frame
  if (!ev.path || ev.path.length < 2) return

  const lut = buildPath(ev.path)
  const color = actionColor(frame, ev.type)

  // PRD §9: "Garis menggambar dirinya di depan pemain."
  // Ekor jalur yang sudah dilewati tetap tampak, kepala sedikit mendahului.
  const head = Math.min(lut.length, ev.travelled + lut.length * 0.18)
  const pts = pathSlice(lut, 0, head)
  if (pts.length < 2) return

  g.save()
  g.strokeStyle = withAlpha(color, 0.9)
  g.lineWidth = strokeW(t)
  g.lineCap = 'round'
  g.lineJoin = 'round'
  if (quality.glow) {
    g.shadowColor = withAlpha(color, 0.8)
    g.shadowBlur = lenPx(t, 0.18)
  }
  strokePolyline(g, t, pts)
  g.restore()

  drawArrowHead(frame, t, lut, head, color)
  drawEventLabel(frame, ev, lut, color)
}

/* -------------------------------------------------------------------------- */
/* Dribble: garis bergelombang berpanah                                       */
/* -------------------------------------------------------------------------- */

function drawDribble(frame: RenderFrame, ev: ActiveEvent): void {
  const { g, transform: t, quality } = frame
  if (!ev.path || ev.path.length < 2) return

  const lut = buildPath(ev.path)
  const color = actionColor(frame, ev.type)
  const head = Math.min(lut.length, ev.travelled + lut.length * 0.1)
  const pts = pathSlice(lut, 0, head)
  if (pts.length < 2) return

  // Gelombang beriak mengikuti ritme dribble: amplitudo tegak lurus jalur.
  const amp = lenPx(t, 0.22)
  const wavelength = lenPx(t, 0.85)
  const wave: Vec2[] = []
  let travelled = 0
  const px = pts.map((p) => toPx(t, p))

  for (let i = 0; i < px.length; i++) {
    const cur = px[i]!
    if (i > 0) {
      const prev = px[i - 1]!
      travelled += Math.hypot(cur.x - prev.x, cur.y - prev.y)
    }
    // Normal lokal.
    const a = px[Math.max(0, i - 1)]!
    const b = px[Math.min(px.length - 1, i + 1)]!
    const dx = b.x - a.x
    const dy = b.y - a.y
    const m = Math.hypot(dx, dy) || 1
    const nx = -dy / m
    const ny = dx / m
    // Fase gelombang bergeser seiring waktu nyata = riak terlihat bergerak.
    const phase = (travelled / wavelength) * Math.PI * 2 - frame.state.t * 8
    const offset = Math.sin(phase) * amp * (i === 0 || i === px.length - 1 ? 0 : 1)
    wave.push({ x: cur.x + nx * offset, y: cur.y + ny * offset })
  }

  g.save()
  g.strokeStyle = withAlpha(color, 0.88)
  g.lineWidth = strokeW(t, 0.9)
  g.lineCap = 'round'
  g.lineJoin = 'round'
  if (quality.glow) {
    g.shadowColor = withAlpha(color, 0.7)
    g.shadowBlur = lenPx(t, 0.15)
  }
  g.beginPath()
  g.moveTo(wave[0]!.x, wave[0]!.y)
  for (let i = 1; i < wave.length; i++) g.lineTo(wave[i]!.x, wave[i]!.y)
  g.stroke()
  g.restore()

  drawArrowHead(frame, t, lut, head, color)
  drawEventLabel(frame, ev, lut, color)
}

/* -------------------------------------------------------------------------- */
/* Rotasi bertahan: garis solid tipis dengan ujung memudar                    */
/* -------------------------------------------------------------------------- */

function drawDefensiveRotation(frame: RenderFrame, ev: ActiveEvent): void {
  const { g, transform: t } = frame
  if (!ev.path || ev.path.length < 2) return

  const lut = buildPath(ev.path)
  const color = actionColor(frame, ev.type)
  const pts = pathSlice(lut, Math.max(0, ev.travelled - lut.length * 0.5), ev.travelled)
  if (pts.length < 2) return

  const px = pts.map((p) => toPx(t, p))
  g.save()
  g.lineWidth = strokeW(t, 0.55)
  g.lineCap = 'round'

  // Ujung memudar: digambar sebagai segmen beralfa naik.
  for (let i = 1; i < px.length; i++) {
    const u = i / (px.length - 1)
    g.strokeStyle = withAlpha(color, 0.12 + 0.5 * u)
    g.beginPath()
    g.moveTo(px[i - 1]!.x, px[i - 1]!.y)
    g.lineTo(px[i]!.x, px[i]!.y)
    g.stroke()
  }
  g.restore()
}

/* -------------------------------------------------------------------------- */
/* Screen: garis berujung batang T                                            */
/* -------------------------------------------------------------------------- */

function drawScreen(frame: RenderFrame, ev: ActiveEvent): void {
  const { g, transform: t, state, quality } = frame

  const actor = state.byId[ev.actor]
  if (!actor) return
  const color = actionColor(frame, ev.type)

  // Arah batang T: menghadap bek yang di-screen bila diketahui, kalau tidak
  // memakai arah hadap screener.
  const target = ev.target ? state.byId[ev.target] : undefined
  let dx: number
  let dy: number
  if (target) {
    dx = target.position.x - actor.position.x
    dy = target.position.y - actor.position.y
  } else {
    const f = (actor.facing * Math.PI) / 180
    dx = Math.sin(f)
    dy = -Math.cos(f)
  }
  const m = Math.hypot(dx, dy) || 1
  const ux = dx / m
  const uy = dy / m

  const center = toPx(t, actor.position)
  const stem = lenPx(t, 0.5)
  const barHalf = lenPx(t, 0.58)
  const tip = { x: center.x + ux * stem, y: center.y + uy * stem }
  const nx = -uy
  const ny = ux

  // A-06: dua cincin riak amber + batang berdenyut saat kontak.
  const pulse = quality.reducedMotion ? 1 : 0.75 + 0.25 * Math.sin(frame.wallMs / 110)

  g.save()
  g.strokeStyle = withAlpha(color, 0.95)
  g.lineWidth = strokeW(t, 1.25) * pulse
  g.lineCap = 'round'
  if (quality.glow) {
    g.shadowColor = withAlpha(color, 0.9)
    g.shadowBlur = lenPx(t, 0.28)
  }

  // Batang (stem) dari pusat screener ke titik kontak.
  g.beginPath()
  g.moveTo(center.x, center.y)
  g.lineTo(tip.x, tip.y)
  g.stroke()

  // Palang T tegak lurus arah screen — ini simbol pelatih untuk "screen".
  g.beginPath()
  g.moveTo(tip.x + nx * barHalf, tip.y + ny * barHalf)
  g.lineTo(tip.x - nx * barHalf, tip.y - ny * barHalf)
  g.stroke()
  g.restore()

  drawScreenLabel(frame, ev, tip, color)
}

/* -------------------------------------------------------------------------- */
/* Dribble handoff: dua garis bertemu + simbol tukar                          */
/* -------------------------------------------------------------------------- */

function drawHandoff(frame: RenderFrame, ev: ActiveEvent): void {
  const { g, transform: t, state, palette } = frame
  const from = state.byId[ev.actor]
  const to = ev.target ? state.byId[ev.target] : undefined
  if (!from || !to) return

  const a = toPx(t, from.position)
  const b = toPx(t, to.position)
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }

  g.save()
  g.lineWidth = strokeW(t, 0.9)
  g.lineCap = 'round'

  // Dua garis: cyan dari pembawa, amber dari penerima — bertemu di tengah.
  g.strokeStyle = withAlpha(palette.offense, 0.9)
  g.beginPath()
  g.moveTo(a.x, a.y)
  g.lineTo(mid.x, mid.y)
  g.stroke()

  g.strokeStyle = withAlpha(palette.screen, 0.9)
  g.beginPath()
  g.moveTo(b.x, b.y)
  g.lineTo(mid.x, mid.y)
  g.stroke()

  // Simbol tukar: dua panah berlawanan arah.
  const r = lenPx(t, 0.3)
  const dx = (b.x - a.x) / (Math.hypot(b.x - a.x, b.y - a.y) || 1)
  const dy = (b.y - a.y) / (Math.hypot(b.x - a.x, b.y - a.y) || 1)
  const nx = -dy
  const ny = dx
  g.strokeStyle = withAlpha(palette.ball, 0.95)
  g.lineWidth = strokeW(t, 0.7)
  for (const sign of [1, -1]) {
    g.beginPath()
    g.moveTo(mid.x + nx * r * sign - dx * r, mid.y + ny * r * sign - dy * r)
    g.lineTo(mid.x + nx * r * sign + dx * r, mid.y + ny * r * sign + dy * r)
    g.stroke()
  }

  // Kilatan kecil saat bola berpindah tangan.
  const flash = 1 - Math.abs(ev.progress - 0.5) * 2
  if (flash > 0) {
    g.globalAlpha = flash * 0.85
    g.fillStyle = palette.ball
    g.beginPath()
    g.arc(mid.x, mid.y, r * (0.5 + flash), 0, Math.PI * 2)
    g.fill()
  }
  g.restore()
}

/* -------------------------------------------------------------------------- */
/* Umpan: garis putus-putus berpanah                                          */
/* -------------------------------------------------------------------------- */

function drawPassLine(frame: RenderFrame, ev: ActiveEvent): void {
  const { g, transform: t, state, palette, quality } = frame
  const flight = state.ball.flight
  if (!flight) return

  const a = toPx(t, flight.from)
  const b = toPx(t, flight.to)

  g.save()
  // Gradien putih -> cyan sesuai PRD §9.
  const grad = g.createLinearGradient(a.x, a.y, b.x, b.y)
  grad.addColorStop(0, withAlpha(palette.pass, 0.9))
  grad.addColorStop(1, withAlpha(palette.offense, 0.95))
  g.strokeStyle = grad
  g.lineWidth = strokeW(t, 0.85)
  g.lineCap = 'round'
  g.setLineDash([lenPx(t, 0.3), lenPx(t, 0.22)])
  // Garis putus bergerak ke arah penerima — arah umpan terbaca tanpa panah.
  g.lineDashOffset = -frame.wallMs * 0.06
  if (quality.glow) {
    g.shadowColor = withAlpha(palette.offense, 0.7)
    g.shadowBlur = lenPx(t, 0.2)
  }
  g.beginPath()
  g.moveTo(a.x, a.y)
  g.lineTo(b.x, b.y)
  g.stroke()
  g.setLineDash([])

  // Cincin tangkap mengembang di penerima saat bola hampir tiba (A-05).
  if (flight.progress > 0.55) {
    const u = (flight.progress - 0.55) / 0.45
    g.globalAlpha = 1 - u
    g.strokeStyle = withAlpha(palette.ball, 0.9)
    g.lineWidth = strokeW(t, 0.8)
    g.beginPath()
    g.arc(b.x, b.y, lenPx(t, 0.25 + 0.5 * u), 0, Math.PI * 2)
    g.stroke()
  }
  g.restore()

  void ev
}

/* -------------------------------------------------------------------------- */
/* Tembakan: busur menuju ring + cincin target                                */
/* -------------------------------------------------------------------------- */

function drawShotArc(frame: RenderFrame, ev: ActiveEvent): void {
  const { g, transform: t, state, palette, quality } = frame
  const flight = state.ball.flight
  if (!flight) return

  const color = palette.ball
  const samples = 28
  const pts: Vec2[] = []
  // Gambar busur hanya sampai posisi bola sekarang — "busur digambar, bola
  // mengikuti" (PRD §10 A-08).
  const upTo = Math.max(0.02, flight.progress)
  for (let i = 0; i <= samples; i++) {
    const u = (i / samples) * upTo
    pts.push(arcSample(flight.from, flight.to, u, 0.22))
  }

  g.save()
  g.strokeStyle = withAlpha(color, 0.92)
  g.lineWidth = strokeW(t, 0.8)
  g.lineCap = 'round'
  if (quality.glow) {
    g.shadowColor = withAlpha(color, 0.9)
    g.shadowBlur = lenPx(t, 0.3)
  }
  strokePolyline(g, t, pts)

  // Cincin target di ring.
  const rim = toPx(t, rimPosition(t.kind))
  g.globalAlpha = 0.5 + 0.5 * Math.sin(frame.wallMs / 160)
  g.strokeStyle = withAlpha(state.ball.shotMade === false ? palette.error : color, 0.9)
  g.lineWidth = strokeW(t, 0.7)
  g.beginPath()
  g.arc(rim.x, rim.y, lenPx(t, 0.55), 0, Math.PI * 2)
  g.stroke()
  g.restore()

  void ev
}

/** Sampel busur yang sama dengan engine, agar garis dan bola tidak terpisah. */
function arcSample(from: Vec2, to: Vec2, u: number, bowFactor: number): Vec2 {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const d = Math.hypot(dx, dy)
  if (d < 1e-6) return { ...to }
  const nx = -dy / d
  const ny = dx / d
  const sign = (from.x + to.x) / 2 >= 0 ? 1 : -1
  const bow = 4 * u * (1 - u) * Math.min(d * bowFactor, 1.6) * sign
  return { x: from.x + dx * u + nx * bow, y: from.y + dy * u + ny * bow }
}

/* -------------------------------------------------------------------------- */
/* Pembantu                                                                   */
/* -------------------------------------------------------------------------- */

function strokePolyline(
  g: CanvasRenderingContext2D,
  t: CourtTransform,
  pts: readonly Vec2[],
): void {
  if (pts.length < 2) return
  const first = toPx(t, pts[0]!)
  g.beginPath()
  g.moveTo(first.x, first.y)
  for (let i = 1; i < pts.length; i++) {
    const p = toPx(t, pts[i]!)
    g.lineTo(p.x, p.y)
  }
  g.stroke()
}

/** Kepala panah di ujung jalur, menghadap arah gerak. */
function drawArrowHead(
  frame: RenderFrame,
  t: CourtTransform,
  lut: ReturnType<typeof buildPath>,
  atDistance: number,
  color: string,
): void {
  const { g } = frame
  if (lut.length < 0.15) return

  const d = Math.min(lut.length, Math.max(0.05, atDistance))
  const back = Math.max(0, d - 0.25)
  const tipM = samplePoint(lut, d)
  const backM = samplePoint(lut, back)
  const tip = toPx(t, tipM)
  const tail = toPx(t, backM)

  const dx = tip.x - tail.x
  const dy = tip.y - tail.y
  const m = Math.hypot(dx, dy)
  if (m < 1) return
  const ux = dx / m
  const uy = dy / m
  const size = lenPx(t, 0.32)

  g.save()
  g.fillStyle = color
  g.beginPath()
  g.moveTo(tip.x, tip.y)
  g.lineTo(tip.x - ux * size + -uy * size * 0.5, tip.y - uy * size + ux * size * 0.5)
  g.lineTo(tip.x - ux * size - -uy * size * 0.5, tip.y - uy * size - ux * size * 0.5)
  g.closePath()
  g.fill()
  g.restore()
}

function samplePoint(lut: ReturnType<typeof buildPath>, s: number): Vec2 {
  const pts = pathSlice(lut, s, s)
  return pts[0] ?? { x: 0, y: 0 }
}

/** Label aksi kecil di tengah jalur (mis. "Roll ke ring"). */
function drawEventLabel(
  frame: RenderFrame,
  ev: ActiveEvent,
  lut: ReturnType<typeof buildPath>,
  color: string,
): void {
  const { g, transform: t, palette, layers } = frame
  if (!layers.labels || !ev.label || lut.length < 1.2) return
  // Label muncul di paruh awal event lalu memudar agar tidak menumpuk.
  const alpha = 1 - ease.clamp01((ev.progress - 0.45) / 0.35)
  if (alpha <= 0.02) return

  const at = toPx(t, samplePoint(lut, lut.length * 0.55))
  const fontSize = Math.max(9, Math.min(13, t.scale * 0.3))

  g.save()
  g.globalAlpha = alpha * 0.95
  g.font = `600 ${fontSize}px var(--font-mono), monospace`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const text = ev.label.toUpperCase()
  const w = g.measureText(text).width
  const padX = 7
  const h = fontSize + 9
  const x = at.x - w / 2 - padX
  const y = at.y - h / 2 - lenPx(t, 0.45)

  g.fillStyle = withAlpha(palette.bgVoid, 0.8)
  g.fillRect(x, y, w + padX * 2, h)
  g.fillStyle = withAlpha(color, 1)
  g.fillRect(x, y, 2, h)
  g.fillStyle = palette.textPrimary
  g.fillText(text, at.x, y + h / 2)
  g.restore()
}

/** Label HUD "SCREEN" selama 800 ms di titik kontak (A-06). */
function drawScreenLabel(
  frame: RenderFrame,
  ev: ActiveEvent,
  at: Vec2,
  color: string,
): void {
  const { g, transform: t, palette, layers } = frame
  if (!layers.labels) return
  const elapsed = (frame.state.t - ev.tStart) * 1000
  if (elapsed > 800) return
  const alpha = 1 - ease.clamp01((elapsed - 550) / 250)

  const fontSize = Math.max(9, Math.min(12, t.scale * 0.28))
  const text = (ev.label ?? 'SCREEN').toUpperCase()

  g.save()
  g.globalAlpha = alpha
  g.font = `700 ${fontSize}px var(--font-mono), monospace`
  g.textAlign = 'left'
  g.textBaseline = 'middle'
  const w = g.measureText(text).width
  const padX = 7
  const h = fontSize + 8
  const x = at.x + lenPx(t, 0.4)
  const y = at.y - h / 2

  g.fillStyle = withAlpha(palette.bgVoid, 0.85)
  g.fillRect(x, y, w + padX * 2, h)
  g.strokeStyle = withAlpha(color, 0.7)
  g.lineWidth = 1
  g.strokeRect(x, y, w + padX * 2, h)
  g.fillStyle = color
  g.fillText(text, x + padX, y + h / 2)
  g.restore()
}
