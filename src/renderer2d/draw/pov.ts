/**
 * Lapisan POV — F-13 dan animasi A-03 / A-09 / A-11.
 *
 * PRD §7 "Cara kerja":
 *   3. "Jalur pemain terpilih digambar sebagai GARIS PREDIKSI 0,6 detik di depan
 *       gerakannya, sehingga pengguna tahu ke mana harus bergerak."
 *   4. "Di setiap momen keputusan, waktu melambat ke 0,3x dan kartu isyarat
 *       muncul di dekat pemain."
 *
 * Kartu isyarat sendiri dirender sebagai DOM di overlay (bisa dibaca pembaca
 * layar); yang digambar di canvas adalah garis penunjuk ke pemain terkait.
 */

import { getPredictionPath, lenPx, toPx } from '@/engine/runtime'
import { withAlpha } from '../palette'
import { ease, type RenderFrame } from '../types'
import { tokenRadius } from './players'

/** Lapisan POV di atas token: garis prediksi + penanda fokus. */
export function drawPovOverlay(frame: RenderFrame): void {
  if (!frame.pov.playerId) return
  drawPredictionLine(frame)
  drawFocusRing(frame)
}

/**
 * A-03: "Jalur menggambar diri 0,6 dtk di depan pemain, ekornya memudar."
 * Garis ini bukan hiasan — ia menjawab pertanyaan "ke mana saya harus bergerak",
 * yang menjadi alasan utama fitur POV ada.
 */
function drawPredictionLine(frame: RenderFrame): void {
  const { g, transform: t, palette, ctx, state, pov, quality } = frame
  const id = pov.playerId
  if (!id) return

  const path = getPredictionPath(ctx, id, state.t)
  if (path.length < 2) return

  const px = path.map((p) => toPx(t, p))
  const width = Math.max(2, lenPx(t, 0.09))

  g.save()
  g.lineCap = 'round'
  g.lineJoin = 'round'
  if (quality.glow) {
    g.shadowColor = withAlpha(palette.selected, 0.8)
    g.shadowBlur = lenPx(t, 0.25)
  }

  // Ekor memudar: alfa naik dari pangkal (di pemain) ke ujung prediksi,
  // sehingga mata mengikuti arah yang akan datang.
  for (let i = 1; i < px.length; i++) {
    const u = i / (px.length - 1)
    g.strokeStyle = withAlpha(palette.selected, 0.25 + 0.65 * u)
    g.lineWidth = width * (0.6 + 0.6 * u)
    g.beginPath()
    g.moveTo(px[i - 1]!.x, px[i - 1]!.y)
    g.lineTo(px[i]!.x, px[i]!.y)
    g.stroke()
  }

  // Titik tujuan di ujung garis prediksi.
  const tip = px[px.length - 1]!
  const pulse = quality.reducedMotion ? 1 : 0.7 + 0.3 * Math.sin(frame.wallMs / 220)
  g.shadowBlur = 0
  g.fillStyle = withAlpha(palette.selected, 0.9 * pulse)
  g.beginPath()
  g.arc(tip.x, tip.y, Math.max(2.5, lenPx(t, 0.1)) * pulse, 0, Math.PI * 2)
  g.fill()
  g.restore()
}

/** Cincin fokus di sekeliling pemain terpilih, menguat saat transisi kamera. */
function drawFocusRing(frame: RenderFrame): void {
  const { g, transform: t, palette, state, pov } = frame
  const p = pov.playerId ? state.byId[pov.playerId] : undefined
  if (!p) return

  const c = toPx(t, p.position)
  const r = tokenRadius(t)

  g.save()
  g.globalAlpha = 0.35 + 0.45 * pov.blend
  g.strokeStyle = withAlpha(palette.selected, 0.8)
  g.lineWidth = Math.max(1, lenPx(t, 0.035))
  g.setLineDash([lenPx(t, 0.18), lenPx(t, 0.14)])
  g.lineDashOffset = -frame.wallMs * 0.02
  g.beginPath()
  g.arc(c.x, c.y, r * 2.1, 0, Math.PI * 2)
  g.stroke()
  g.restore()
}

/* -------------------------------------------------------------------------- */
/* A-09 Momen keputusan                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A-09: "Kecepatan turun 1,0x ke 0,3x dalam 250 ms; VINYET 20%; bek tak relevan
 * diredupkan; opsi umpan tampil sebagai berkas cahaya."
 *
 * Vinyet dan berkas opsi digambar PALING ATAS supaya momen keputusan benar-benar
 * mengubah suasana layar.
 */
export function drawDecisionOverlay(frame: RenderFrame): void {
  const { g, transform: t, palette, state, quality } = frame
  const decision = state.decision
  if (!decision) return

  // Seberapa dalam kita berada di jendela keputusan (0 di tepi, 1 di puncak).
  const depth = ease.clamp01(1 - Math.abs(state.t - decision.t) / 0.9)
  if (depth <= 0.01) return

  // 1. Vinyet 20% — mempersempit perhatian ke pusat keputusan.
  const owner = state.byId[decision.owner]
  const center = owner ? toPx(t, owner.position) : { x: t.offsetX + t.pxWidth / 2, y: t.offsetY + t.pxHeight / 2 }
  const maxR = Math.hypot(t.pxWidth, t.pxHeight) * 0.75

  g.save()
  const vig = g.createRadialGradient(center.x, center.y, maxR * 0.25, center.x, center.y, maxR)
  vig.addColorStop(0, withAlpha(palette.bgVoid, 0))
  vig.addColorStop(1, withAlpha(palette.bgVoid, 0.2 * depth))
  g.fillStyle = vig
  g.fillRect(t.offsetX, t.offsetY, t.pxWidth, t.pxHeight)
  g.restore()

  // 2. Opsi umpan sebagai berkas cahaya dari pemilik keputusan ke targetnya.
  if (!owner) return
  const from = toPx(t, owner.position)

  g.save()
  for (const opt of decision.options) {
    const targetId = opt.targetPlayer
    const target = targetId ? state.byId[targetId] : undefined
    const to = target
      ? toPx(t, target.position)
      : opt.targetSpot
        ? toPx(t, { x: opt.targetSpot.x, y: opt.targetSpot.y })
        : null
    if (!to) continue

    const dx = to.x - from.x
    const dy = to.y - from.y
    const m = Math.hypot(dx, dy) || 1
    const w = lenPx(t, 0.3) * depth
    const nx = (-dy / m) * w
    const ny = (dx / m) * w

    const grad = g.createLinearGradient(from.x, from.y, to.x, to.y)
    grad.addColorStop(0, withAlpha(palette.ball, 0.05 * depth))
    grad.addColorStop(1, withAlpha(palette.ball, 0.38 * depth))
    g.fillStyle = grad
    g.beginPath()
    g.moveTo(from.x + nx * 0.3, from.y + ny * 0.3)
    g.lineTo(to.x + nx, to.y + ny)
    g.lineTo(to.x - nx, to.y - ny)
    g.lineTo(from.x - nx * 0.3, from.y - ny * 0.3)
    g.closePath()
    g.fill()

    // Cincin target di ujung berkas.
    const pulse = quality.reducedMotion ? 1 : 0.75 + 0.25 * Math.sin(frame.wallMs / 260)
    g.strokeStyle = withAlpha(palette.ball, 0.7 * depth * pulse)
    g.lineWidth = Math.max(1.4, lenPx(t, 0.045))
    g.beginPath()
    g.arc(to.x, to.y, tokenRadius(t) * 1.9, 0, Math.PI * 2)
    g.stroke()
  }
  g.restore()
}

/* -------------------------------------------------------------------------- */
/* F-18 Target kuis & F-21 Mode Presentasi                                    */
/* -------------------------------------------------------------------------- */

/**
 * F-18: "ketika animasi mencapai titik jeda, maka lapangan membeku dan target
 * yang bisa diketuk BERKEDIP HALUS."
 *
 * Target itu juga ada sebagai tombol DOM di overlay (agar bisa di-tab dan dibaca
 * pembaca layar); yang digambar di sini adalah penanda visualnya.
 */
export function drawQuizTargets(frame: RenderFrame): void {
  const { g, transform: t, palette, quizTargets, quality } = frame
  if (quizTargets.length === 0) return

  const blink = quality.reducedMotion ? 1 : 0.6 + 0.4 * Math.sin(frame.wallMs / 420)

  g.save()
  for (const target of quizTargets) {
    const c = toPx(t, target.at)
    const r = Math.max(24, tokenRadius(t) * 2)

    const color =
      target.state === 'correct'
        ? palette.success
        : target.state === 'wrong'
          ? palette.error
          : palette.ball

    const strength = target.state === 'idle' ? blink : 1

    g.globalAlpha = 0.18 * strength
    g.fillStyle = color
    g.beginPath()
    g.arc(c.x, c.y, r, 0, Math.PI * 2)
    g.fill()

    g.globalAlpha = 0.9 * strength
    g.strokeStyle = color
    g.lineWidth = Math.max(2, lenPx(t, 0.06))
    g.setLineDash(target.state === 'idle' ? [lenPx(t, 0.3), lenPx(t, 0.2)] : [])
    g.lineDashOffset = -frame.wallMs * 0.03
    g.beginPath()
    g.arc(c.x, c.y, r, 0, Math.PI * 2)
    g.stroke()
    g.setLineDash([])
  }
  g.restore()
}

/** Pointer laser Mode Presentasi (F-21). */
export function drawLaser(frame: RenderFrame): void {
  const { g, transform: t, palette, laser } = frame
  if (!laser) return
  const c = toPx(t, laser)
  const r = Math.max(6, lenPx(t, 0.2))

  g.save()
  g.shadowColor = palette.error
  g.shadowBlur = r * 3
  g.fillStyle = palette.error
  g.beginPath()
  g.arc(c.x, c.y, r * 0.45, 0, Math.PI * 2)
  g.fill()
  g.shadowBlur = 0
  g.globalAlpha = 0.3
  g.beginPath()
  g.arc(c.x, c.y, r, 0, Math.PI * 2)
  g.fill()
  g.restore()
}

/** Coretan tangan Mode Presentasi (F-21). */
export function drawAnnotations(frame: RenderFrame): void {
  const { g, transform: t, palette, annotations } = frame
  if (annotations.length === 0) return

  g.save()
  g.strokeStyle = withAlpha(palette.warn, 0.95)
  g.lineWidth = Math.max(2.5, lenPx(t, 0.08))
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.shadowColor = withAlpha(palette.warn, 0.7)
  g.shadowBlur = lenPx(t, 0.2)

  for (const stroke of annotations) {
    if (stroke.length < 2) {
      if (stroke.length === 1) {
        const p = toPx(t, stroke[0]!)
        g.beginPath()
        g.arc(p.x, p.y, g.lineWidth / 2, 0, Math.PI * 2)
        g.fillStyle = withAlpha(palette.warn, 0.95)
        g.fill()
      }
      continue
    }
    const first = toPx(t, stroke[0]!)
    g.beginPath()
    g.moveTo(first.x, first.y)
    for (let i = 1; i < stroke.length; i++) {
      const p = toPx(t, stroke[i]!)
      g.lineTo(p.x, p.y)
    }
    g.stroke()
  }
  g.restore()
}

/** Lapisan "beku" saat kuis menjeda lapangan — bingkai tipis volt. */
export function drawFrozenFrame(frame: RenderFrame): void {
  const { g, transform: t, palette, frozen, quality } = frame
  if (!frozen) return
  const pulse = quality.reducedMotion ? 1 : 0.5 + 0.5 * Math.sin(frame.wallMs / 500)

  g.save()
  g.globalAlpha = 0.25 + 0.3 * pulse
  g.strokeStyle = palette.ball
  g.lineWidth = 3
  g.strokeRect(t.offsetX + 1.5, t.offsetY + 1.5, t.pxWidth - 3, t.pxHeight - 3)
  g.restore()
}
