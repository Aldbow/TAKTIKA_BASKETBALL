/**
 * Bola — PRD §9: "Bola volt 10 px dengan glow; saat dipegang, mengorbit token
 * pembawa." Dan PRD §10 A-08: masuk = ledakan partikel di ring; gagal = bola
 * memantul.
 *
 * Posisi bola SELALU datang dari getState(t).ball — renderer tidak menghitung
 * lintasan sendiri.
 */

import { lenPx, rimPosition, toPx } from '@/engine'
import { withAlpha } from '../palette'
import { ease, hashSeed, seededRandom, type RenderFrame } from '../types'

export function drawBall(frame: RenderFrame): void {
  const { g, transform: t, palette, quality, state } = frame
  const ball = state.ball

  const c = toPx(t, ball.position)
  // 10 px pada lapangan desktop; membesar sedikit saat bola di udara agar
  // ketinggian terbaca pada tampilan atas.
  const base = Math.max(3.5, Math.min(8, lenPx(t, 0.14)))
  const r = base * (1 + ball.height * 0.45)

  g.save()

  // Bayangan di lantai saat bola di udara — satu-satunya petunjuk ketinggian
  // yang tersedia pada kamera atas.
  if (ball.inAir && ball.height > 0.02) {
    g.globalAlpha = 0.3 * (1 - ball.height * 0.6)
    g.fillStyle = palette.bgVoid
    g.beginPath()
    g.ellipse(c.x, c.y + r * 1.6 * ball.height, r * 0.9, r * 0.45, 0, 0, Math.PI * 2)
    g.fill()
    g.globalAlpha = 1
  }

  // Jejak cahaya mengikuti bola saat di udara.
  if (ball.inAir && ball.flight && quality.particles !== 'none') {
    drawFlightTrail(frame, r)
  }

  if (quality.glow) {
    g.shadowColor = withAlpha(palette.ball, 1)
    g.shadowBlur = r * 2.4
  }

  const grad = g.createRadialGradient(c.x - r * 0.3, c.y - r * 0.3, r * 0.1, c.x, c.y, r)
  grad.addColorStop(0, '#ffffff')
  grad.addColorStop(0.4, palette.ball)
  grad.addColorStop(1, withAlpha(palette.ball, 0.8))
  g.fillStyle = grad
  g.beginPath()
  g.arc(c.x, c.y, r, 0, Math.PI * 2)
  g.fill()
  g.shadowBlur = 0

  // Garis bola: dua busur tipis agar token tidak terlihat seperti titik saja.
  g.strokeStyle = withAlpha(palette.bgVoid, 0.45)
  g.lineWidth = Math.max(0.6, r * 0.16)
  g.beginPath()
  g.arc(c.x, c.y, r * 0.98, -0.4, 2.3)
  g.stroke()

  g.restore()

  // A-08: hasil tembakan.
  if (ball.inAir && ball.flight?.cause === 'shot' && ball.flight.progress > 0.9) {
    if (ball.shotMade) drawMadeBurst(frame)
    else drawMissBounce(frame)
  }
}

/** Jejak bola: beberapa titik memudar di belakang posisi sekarang. */
function drawFlightTrail(frame: RenderFrame, r: number): void {
  const { g, transform: t, palette, state } = frame
  const flight = state.ball.flight
  if (!flight) return

  const steps = frame.quality.particles === 'full' ? 7 : 4
  g.save()
  for (let i = 1; i <= steps; i++) {
    const u = Math.max(0, flight.progress - i * 0.035)
    const p = arcSample(flight.from, flight.to, u, flight.cause === 'shot' ? 0.22 : 0.07)
    const px = toPx(t, p)
    g.globalAlpha = 0.35 * (1 - i / (steps + 1))
    g.fillStyle = palette.ball
    g.beginPath()
    g.arc(px.x, px.y, r * (1 - i / (steps + 2)), 0, Math.PI * 2)
    g.fill()
  }
  g.restore()
}

/** Ledakan partikel di ring saat tembakan masuk. */
function drawMadeBurst(frame: RenderFrame): void {
  const { g, transform: t, palette, quality, state } = frame
  if (quality.particles === 'none') {
    // Kurangi Gerak / tier Hemat: cincin sukses statis, bukan partikel.
    const rim = toPx(t, rimPosition(t.kind))
    g.save()
    g.strokeStyle = withAlpha(palette.success, 0.9)
    g.lineWidth = 3
    g.beginPath()
    g.arc(rim.x, rim.y, lenPx(t, 0.6), 0, Math.PI * 2)
    g.stroke()
    g.restore()
    return
  }

  const flight = state.ball.flight
  if (!flight) return
  const u = ease.clamp01((flight.progress - 0.9) / 0.1)
  const rim = toPx(t, rimPosition(t.kind))

  // PRNG ber-seed dari id event: partikel identik setiap kali frame ini
  // digambar, sehingga geser timeline tidak membuat efek "berkedip acak".
  const rnd = seededRandom(hashSeed('made', state.ball.segment?.eventId ?? 'shot'))
  const count = quality.particles === 'full' ? 18 : 9

  g.save()
  g.globalAlpha = 1 - u
  for (let i = 0; i < count; i++) {
    const angle = rnd() * Math.PI * 2
    const dist = lenPx(t, 0.25 + rnd() * 1.1) * ease.outCubic(u)
    const size = lenPx(t, 0.04 + rnd() * 0.05)
    g.fillStyle = i % 3 === 0 ? palette.success : palette.ball
    g.beginPath()
    g.arc(rim.x + Math.cos(angle) * dist, rim.y + Math.sin(angle) * dist, size, 0, Math.PI * 2)
    g.fill()
  }

  // Cincin sukses mengembang.
  g.globalAlpha = (1 - u) * 0.8
  g.strokeStyle = palette.success
  g.lineWidth = Math.max(1.5, lenPx(t, 0.05))
  g.beginPath()
  g.arc(rim.x, rim.y, lenPx(t, 0.3 + u * 1.3), 0, Math.PI * 2)
  g.stroke()
  g.restore()
}

/** Tembakan gagal: tanda pantul di ring. */
function drawMissBounce(frame: RenderFrame): void {
  const { g, transform: t, palette, state } = frame
  const flight = state.ball.flight
  if (!flight) return
  const u = ease.clamp01((flight.progress - 0.9) / 0.1)
  const rim = toPx(t, rimPosition(t.kind))

  g.save()
  g.globalAlpha = 1 - u
  g.strokeStyle = palette.error
  g.lineWidth = Math.max(1.5, lenPx(t, 0.06))
  // Dua garis pendek menyimpang dari ring = bola memantul keluar.
  for (const sign of [-1, 1]) {
    g.beginPath()
    g.moveTo(rim.x, rim.y)
    g.lineTo(
      rim.x + sign * lenPx(t, 0.7) * ease.outCubic(u),
      rim.y + lenPx(t, 0.55) * ease.outCubic(u),
    )
    g.stroke()
  }
  g.restore()
}

function arcSample(
  from: { x: number; y: number },
  to: { x: number; y: number },
  u: number,
  bowFactor: number,
): { x: number; y: number } {
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
