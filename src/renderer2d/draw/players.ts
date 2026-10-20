/**
 * Token pemain — PRD §9 tabel "Token pemain dan bola":
 *
 *   Pemain menyerang : lingkaran terisi gradien cyan, diameter 28 px (desktop),
 *                      angka 1-5 di tengah, panah kecil arah gerak
 *   Pemain bertahan  : segi enam bergaris coral, label X1-X5
 *   Pemain terpilih  : inti putih, halo cyan berdenyut 1,6 detik
 *   Pemain redup     : opasitas 35%, tanpa glow
 *
 * Aturan aksesibilitas PRD §9 yang ditegakkan di sini: "Warna tidak pernah
 * menjadi satu-satunya pembeda: tim dibedakan juga oleh BENTUK." Lingkaran vs
 * segi enam tetap terbaca pada penglihatan warna apa pun dan saat dicetak.
 */

import { facingToVector, lenPx, toPx, type CourtTransform, type Vec2 } from '@/engine/runtime'
import type { PlayerState } from '@/engine/runtime'
import { withAlpha } from '../palette'
import { ease, type RenderFrame } from '../types'

/** Diameter token (px). 28 px pada lapangan desktop, menyusut proporsional. */
export function tokenRadius(t: CourtTransform): number {
  // 28 px diameter saat 1 m ~ 36 px (lapangan desktop penuh) -> 0,39 m.
  return Math.max(9, Math.min(20, lenPx(t, 0.39)))
}

/** Opasitas sebuah pemain pada frame ini, memperhitungkan mode fokus POV. */
export function playerAlpha(frame: RenderFrame, p: PlayerState): number {
  const { pov, palette, focusPlayers } = frame

  if (pov.playerId) {
    if (p.id === pov.playerId) return 1
    // A-11: opasitas pemain lain turun ke 35%, di-blend selama transisi kamera.
    return 1 - (1 - palette.dimmed) * pov.blend
  }

  // Tanpa POV, panel fase bisa menyorot sebagian pemain ("satu layar, satu ide").
  if (focusPlayers.length > 0 && !focusPlayers.includes(p.id)) {
    return 0.55
  }
  return 1
}

/**
 * Semua token pemain. Digambar setelah notasi aksi supaya token selalu berada
 * di atas garis — pemain tidak boleh tertutup garisnya sendiri.
 */
export function drawPlayers(frame: RenderFrame): void {
  const { state, layers } = frame

  // Urutan gambar: bek dulu, lalu penyerang, lalu pemain terpilih paling atas.
  const order = [...state.players].sort((a, b) => {
    const rank = (p: PlayerState): number => {
      if (frame.pov.playerId === p.id) return 3
      if (p.hasBall) return 2
      return p.team === 'offense' ? 1 : 0
    }
    return rank(a) - rank(b)
  })

  for (const p of order) {
    if (p.team === 'defense' && !layers.defenders) continue
    drawPlayerToken(frame, p)
  }
}

function drawPlayerToken(frame: RenderFrame, p: PlayerState): void {
  const { g, transform: t, palette, quality, pov, bootProgress } = frame

  // A-01: pemain muncul dari kolom cahaya berurutan 1->5 dengan jeda 80 ms.
  // Boot-up pemain berjalan di 0,55..1,0 dari progres total.
  const index = Number(p.id.slice(1)) - 1
  const stagger = index * 0.07
  const appear = ease.emphasis(ease.clamp01((bootProgress - 0.55 - stagger) / 0.3))
  if (appear <= 0.001) return

  const alpha = playerAlpha(frame, p) * appear
  const selected = pov.playerId === p.id
  const dimmed = pov.playerId !== null && !selected
  const r = tokenRadius(t)
  const c = toPx(t, p.position)
  const color = p.team === 'offense' ? palette.offense : palette.defense

  g.save()
  g.globalAlpha = alpha

  // Kolom cahaya saat boot-up: pemain "turun" dari atas.
  if (appear < 1) {
    g.save()
    g.globalAlpha = alpha * (1 - appear) * 0.8
    const beam = g.createLinearGradient(c.x, c.y - r * 8, c.x, c.y)
    beam.addColorStop(0, withAlpha(color, 0))
    beam.addColorStop(1, withAlpha(color, 0.7))
    g.fillStyle = beam
    g.fillRect(c.x - r * 0.5, c.y - r * 8, r, r * 8)
    g.restore()
  }

  // Halo pemain terpilih: berdenyut 1,6 detik (PRD §9).
  if (selected && !quality.reducedMotion) {
    const phase = (frame.wallMs % 1600) / 1600
    const pulse = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2)
    g.save()
    g.globalAlpha = alpha * (0.3 + 0.45 * pulse)
    g.fillStyle = withAlpha(palette.offense, 0.5)
    g.beginPath()
    g.arc(c.x, c.y, r * (1.5 + 0.35 * pulse), 0, Math.PI * 2)
    g.fill()
    g.restore()
  } else if (selected) {
    // Kurangi Gerak: halo statis, tanpa denyut.
    g.save()
    g.globalAlpha = alpha * 0.45
    g.fillStyle = withAlpha(palette.offense, 0.5)
    g.beginPath()
    g.arc(c.x, c.y, r * 1.6, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }

  // Glow token — dimatikan untuk pemain redup (PRD §9: "tanpa glow").
  if (quality.glow && !dimmed) {
    g.shadowColor = withAlpha(color, 0.9)
    g.shadowBlur = r * 0.9
  }

  if (p.team === 'offense') {
    // Lingkaran terisi gradien cyan.
    const grad = g.createRadialGradient(
      c.x - r * 0.3,
      c.y - r * 0.35,
      r * 0.15,
      c.x,
      c.y,
      r,
    )
    grad.addColorStop(0, selected ? palette.selected : withAlpha(color, 1))
    grad.addColorStop(0.55, color)
    grad.addColorStop(1, withAlpha(color, 0.72))
    g.fillStyle = grad
    g.beginPath()
    g.arc(c.x, c.y, r, 0, Math.PI * 2)
    g.fill()

    // Inti putih untuk pemain terpilih (PRD §9).
    if (selected) {
      g.shadowBlur = 0
      g.fillStyle = palette.selected
      g.beginPath()
      g.arc(c.x, c.y, r * 0.42, 0, Math.PI * 2)
      g.fill()
    }
  } else {
    // Segi enam BERGARIS (tidak terisi) — bentuk membedakan tim tanpa warna.
    g.strokeStyle = color
    g.lineWidth = Math.max(1.6, r * 0.18)
    hexPath(g, c, r * 1.02)
    g.stroke()
    g.shadowBlur = 0
    // Isi tipis agar token tetap terbaca di atas garis lapangan.
    g.fillStyle = withAlpha(color, 0.16)
    hexPath(g, c, r * 1.02)
    g.fill()
  }

  g.shadowBlur = 0

  // Penanda pemegang bola: cincin volt tipis di luar token.
  if (p.hasBall) {
    g.strokeStyle = withAlpha(palette.ball, 0.95)
    g.lineWidth = Math.max(1.5, r * 0.14)
    g.beginPath()
    g.arc(c.x, c.y, r * 1.3, 0, Math.PI * 2)
    g.stroke()
  }

  // Panah kecil arah gerak (PRD §9). Saat pemain diam, panah beralih
  // menunjukkan arah HADAP — informasi yang dipakai lapisan kerucut pandang
  // dan pelajaran posisi bertahan (modul 2.6).
  if (p.speed > 0.4) {
    drawHeadingArrow(frame, c, r, p.heading, color)
  } else {
    drawHeadingArrow(frame, c, r, facingToVector(p.facing), color, 0.45)
  }

  // Angka / label di tengah token.
  if (frame.layers.labels) {
    g.shadowBlur = 0
    const fontSize = Math.max(9, r * (p.team === 'offense' ? 1.05 : 0.82))
    g.font = `700 ${fontSize}px var(--font-mono), monospace`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    // Angka di atas token menyerang memakai token teks terbalik agar kontras
    // tetap lolos WCAG AA di tema gelap MAUPUN Tema Papan Tulis.
    g.fillStyle = p.team === 'offense' ? palette.textInverse : color
    g.fillText(p.label, c.x, c.y + fontSize * 0.04)
  }

  g.restore()
}

/** Panah arah kecil di tepi token. */
function drawHeadingArrow(
  frame: RenderFrame,
  c: Vec2,
  r: number,
  dir: Vec2,
  color: string,
  alpha = 0.9,
): void {
  const { g } = frame
  const m = Math.hypot(dir.x, dir.y)
  if (m < 1e-6) return
  const ux = dir.x / m
  const uy = dir.y / m

  const tip = { x: c.x + ux * r * 1.85, y: c.y + uy * r * 1.85 }
  const base = { x: c.x + ux * r * 1.2, y: c.y + uy * r * 1.2 }
  const nx = -uy
  const ny = ux
  const half = r * 0.34

  g.save()
  g.globalAlpha *= alpha
  g.fillStyle = color
  g.beginPath()
  g.moveTo(tip.x, tip.y)
  g.lineTo(base.x + nx * half, base.y + ny * half)
  g.lineTo(base.x - nx * half, base.y - ny * half)
  g.closePath()
  g.fill()
  g.restore()
}

/** Jalur segi enam dengan satu titik mengarah ke atas. */
export function hexPath(g: CanvasRenderingContext2D, c: Vec2, r: number): void {
  g.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3
    const x = c.x + Math.cos(a) * r
    const y = c.y + Math.sin(a) * r
    if (i === 0) g.moveTo(x, y)
    else g.lineTo(x, y)
  }
  g.closePath()
}

/**
 * Lingkaran sentuh pemain — dipakai Tactic Viewer untuk mengenali ketukan pada
 * pemain (memilih POV langsung di lapangan, F-13) dan target kuis (F-18).
 * Radius minimum 22 px agar memenuhi target sentuh 44 x 44 px (PRD §15).
 */
export function playerHitRadius(t: CourtTransform): number {
  return Math.max(22, tokenRadius(t) * 1.6)
}
