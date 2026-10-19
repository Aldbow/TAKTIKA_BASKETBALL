/**
 * Lapisan visual — F-11: "Nyala/mati: jalur gerak, jalur umpan, screen, bek,
 * jejak, zona spacing, label, kerucut pandang bek."
 *
 * Animasi yang diwujudkan di sini:
 *   A-04 Jejak gerak    — bayangan jalur 1,2 dtk terakhir memudar
 *   A-14 Spacing        — garis jarak hijau >= 4,5 m, kuning 3-4,5 m, merah < 3 m
 *   A-15 Pandangan bek  — kerucut coral transparan 120 derajat
 *   A-16 Jalur umpan    — berkas cahaya, lebar = tingkat keamanan, merah bila terhalang
 */

import { facingToVector, getTrail, lenPx, toPx, type Vec2 } from '@/engine'
import { withAlpha } from '../palette'
import { ease, type RenderFrame } from '../types'
import { playerAlpha, tokenRadius } from './players'

/** Semua lapisan latar — digambar sebelum notasi dan token. */
export function drawBackLayers(frame: RenderFrame): void {
  if (frame.layers.spacing) drawSpacing(frame)
  if (frame.layers.visionCones && frame.layers.defenders) drawVisionCones(frame)
  if (frame.layers.passLanes) drawPassLanes(frame)
  if (frame.layers.trails && frame.quality.trails) drawTrails(frame)
  if (frame.ghostPaths.length > 0) drawGhostPaths(frame)
}

/* -------------------------------------------------------------------------- */
/* A-14 Spacing                                                               */
/* -------------------------------------------------------------------------- */

/**
 * PRD §5 modul 2.1: "Garis jarak antarpemain berubah merah bila terlalu dekat;
 * area lantai terbuka diarsir bercahaya."
 */
function drawSpacing(frame: RenderFrame): void {
  const { g, transform: t, palette, state, quality } = frame

  // 1. Area lantai terbuka: poligon penyerang diarsir dan berdenyut halus.
  const offense = state.players.filter((p) => p.team === 'offense')
  if (offense.length >= 3) {
    const hull = convexHull(offense.map((p) => p.position))
    if (hull.length >= 3) {
      const pulse = quality.reducedMotion ? 1 : 0.8 + 0.2 * Math.sin(frame.wallMs / 700)
      g.save()
      g.globalAlpha = 0.07 * pulse
      g.fillStyle = palette.offense
      g.beginPath()
      const first = toPx(t, hull[0]!)
      g.moveTo(first.x, first.y)
      for (let i = 1; i < hull.length; i++) {
        const p = toPx(t, hull[i]!)
        g.lineTo(p.x, p.y)
      }
      g.closePath()
      g.fill()
      g.restore()
    }
  }

  // 2. Garis jarak antar penyerang bersebelahan, berwarna sesuai ambang PRD.
  g.save()
  g.lineWidth = Math.max(1.2, lenPx(t, 0.045))
  g.font = `600 ${Math.max(9, Math.min(12, t.scale * 0.26))}px var(--font-mono), monospace`
  g.textAlign = 'center'
  g.textBaseline = 'middle'

  for (const link of state.spacing) {
    const a = state.byId[link.a]
    const b = state.byId[link.b]
    if (!a || !b) continue
    const color =
      link.grade === 'good'
        ? palette.success
        : link.grade === 'tight'
          ? palette.warn
          : palette.error

    const pa = toPx(t, a.position)
    const pb = toPx(t, b.position)

    g.strokeStyle = withAlpha(color, link.grade === 'good' ? 0.4 : 0.8)
    g.setLineDash(link.grade === 'bad' ? [] : [lenPx(t, 0.2), lenPx(t, 0.18)])
    g.beginPath()
    g.moveTo(pa.x, pa.y)
    g.lineTo(pb.x, pb.y)
    g.stroke()
    g.setLineDash([])

    // Angka jarak hanya ditampilkan untuk spacing yang bermasalah — mencegah
    // lapangan penuh angka (prinsip "satu layar, satu ide").
    if (frame.layers.labels && link.grade !== 'good') {
      const mid = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 }
      const text = `${link.distance.toFixed(1).replace('.', ',')} m`
      const w = g.measureText(text).width
      g.fillStyle = withAlpha(palette.bgVoid, 0.85)
      g.fillRect(mid.x - w / 2 - 5, mid.y - 9, w + 10, 18)
      g.fillStyle = color
      g.fillText(text, mid.x, mid.y)
    }
  }
  g.restore()
}

/* -------------------------------------------------------------------------- */
/* A-15 Kerucut pandang bek                                                   */
/* -------------------------------------------------------------------------- */

/**
 * "Kerucut coral transparan 120 derajat berputar mengikuti arah kepala bek."
 * Lapisan ini yang membuat materi modul 2.6 (segitiga ball-you-man) terlihat:
 * bek yang kerucutnya tidak memuat bola berarti kehilangan penglihatan bola.
 */
function drawVisionCones(frame: RenderFrame): void {
  const { g, transform: t, palette, state } = frame
  const radius = lenPx(t, 4.2)
  const halfAngle = (120 / 2) * (Math.PI / 180)

  g.save()
  for (const p of state.players) {
    if (p.team !== 'defense') continue
    const alpha = playerAlpha(frame, p)
    if (alpha < 0.05) continue

    const c = toPx(t, p.position)
    const dir = facingToVector(p.facing)
    // Sudut di ruang piksel sama dengan sudut vektor arah karena transform
    // tidak membalik sumbu.
    const mid = Math.atan2(dir.y, dir.x)

    const grad = g.createRadialGradient(c.x, c.y, lenPx(t, 0.3), c.x, c.y, radius)
    grad.addColorStop(0, withAlpha(palette.defense, 0.26 * alpha))
    grad.addColorStop(1, withAlpha(palette.defense, 0))
    g.fillStyle = grad
    g.beginPath()
    g.moveTo(c.x, c.y)
    g.arc(c.x, c.y, radius, mid - halfAngle, mid + halfAngle)
    g.closePath()
    g.fill()

    // Tepi kerucut tipis supaya batas pandangan jelas.
    g.strokeStyle = withAlpha(palette.defense, 0.3 * alpha)
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(c.x, c.y)
    g.lineTo(c.x + Math.cos(mid - halfAngle) * radius, c.y + Math.sin(mid - halfAngle) * radius)
    g.moveTo(c.x, c.y)
    g.lineTo(c.x + Math.cos(mid + halfAngle) * radius, c.y + Math.sin(mid + halfAngle) * radius)
    g.stroke()
  }
  g.restore()
}

/* -------------------------------------------------------------------------- */
/* A-16 Jalur umpan                                                           */
/* -------------------------------------------------------------------------- */

/**
 * "Berkas cahaya dari pembawa bola ke calon penerima; lebar berkas = tingkat
 * keamanan; berkas merah bila terhalang bek."
 */
function drawPassLanes(frame: RenderFrame): void {
  const { g, transform: t, palette, state } = frame
  if (state.passLanes.length === 0) return

  g.save()
  for (const lane of state.passLanes) {
    const a = toPx(t, lane.fromPos)
    const b = toPx(t, lane.toPos)
    const color = lane.blocked ? palette.error : palette.offense

    // Lebar berkas: aman = lebar, terhalang = sempit.
    const width = lenPx(t, 0.1 + lane.safety * 0.42)
    const dx = b.x - a.x
    const dy = b.y - a.y
    const m = Math.hypot(dx, dy) || 1
    const nx = (-dy / m) * width
    const ny = (dx / m) * width

    const grad = g.createLinearGradient(a.x, a.y, b.x, b.y)
    grad.addColorStop(0, withAlpha(color, 0.03))
    grad.addColorStop(0.35, withAlpha(color, lane.blocked ? 0.3 : 0.22))
    grad.addColorStop(1, withAlpha(color, lane.blocked ? 0.1 : 0.32))
    g.fillStyle = grad

    // Berkas menyempit ke arah penerima: bentuk corong menunjukkan arah.
    g.beginPath()
    g.moveTo(a.x + nx * 0.45, a.y + ny * 0.45)
    g.lineTo(b.x + nx, b.y + ny)
    g.lineTo(b.x - nx, b.y - ny)
    g.lineTo(a.x - nx * 0.45, a.y - ny * 0.45)
    g.closePath()
    g.fill()

    // Penembak 3 poin yang punya jalur aman mendapat cincin volt kecil —
    // inilah "extra pass" yang diajarkan modul 2.9.
    if (!lane.blocked && lane.shotValue === 3 && lane.safety > 0.6) {
      g.strokeStyle = withAlpha(palette.ball, 0.55)
      g.lineWidth = 1.5
      g.beginPath()
      g.arc(b.x, b.y, tokenRadius(t) * 1.75, 0, Math.PI * 2)
      g.stroke()
    }
  }
  g.restore()
}

/* -------------------------------------------------------------------------- */
/* A-04 Jejak gerak                                                           */
/* -------------------------------------------------------------------------- */

function drawTrails(frame: RenderFrame): void {
  const { g, transform: t, palette, state, ctx, layers } = frame

  g.save()
  for (const p of state.players) {
    if (p.team === 'defense' && !layers.defenders) continue
    const alpha = playerAlpha(frame, p)
    if (alpha < 0.05) continue

    const trail = getTrail(ctx, p.id, state.t)
    if (trail.length < 2) continue

    const color = p.team === 'offense' ? palette.offense : palette.defense
    const r = tokenRadius(t)

    // Bayangan memudar: titik yang lebih lama lebih transparan dan lebih kecil.
    for (let i = 0; i < trail.length - 1; i++) {
      const u = i / (trail.length - 1)
      const px = toPx(t, trail[i]!)
      g.globalAlpha = alpha * 0.26 * u
      g.fillStyle = color
      g.beginPath()
      g.arc(px.x, px.y, r * (0.3 + 0.5 * u), 0, Math.PI * 2)
      g.fill()
    }
  }
  g.restore()
}

/* -------------------------------------------------------------------------- */
/* A-13 Jalur cabang lama sebagai bayangan                                    */
/* -------------------------------------------------------------------------- */

/**
 * PRD §10 A-13: "jalur lama memudar jadi bayangan 20%; jalur baru menggambar
 * diri." Jalur lama diteruskan dari Tactic Viewer saat coverage diganti.
 */
function drawGhostPaths(frame: RenderFrame): void {
  const { g, transform: t, palette, ghostPaths, branchBlend } = frame
  const alpha = palette.ghost * (1 - ease.outCubic(branchBlend))
  if (alpha <= 0.01) return

  g.save()
  g.globalAlpha = alpha
  g.strokeStyle = palette.textSecondary
  g.lineWidth = Math.max(1, lenPx(t, 0.05))
  g.setLineDash([lenPx(t, 0.25), lenPx(t, 0.25)])
  for (const path of ghostPaths) {
    if (path.length < 2) continue
    const first = toPx(t, path[0]!)
    g.beginPath()
    g.moveTo(first.x, first.y)
    for (let i = 1; i < path.length; i++) {
      const p = toPx(t, path[i]!)
      g.lineTo(p.x, p.y)
    }
    g.stroke()
  }
  g.restore()
}

/* -------------------------------------------------------------------------- */
/* Pembantu geometri                                                          */
/* -------------------------------------------------------------------------- */

/** Convex hull (monotone chain) — membentuk "area lantai terbuka" spacing. */
export function convexHull(points: readonly Vec2[]): Vec2[] {
  if (points.length < 3) return [...points]
  const pts = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x))

  const cross = (o: Vec2, a: Vec2, b: Vec2): number =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)

  const lower: Vec2[] = []
  for (const p of pts) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0
    ) {
      lower.pop()
    }
    lower.push(p)
  }

  const upper: Vec2[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0
    ) {
      upper.pop()
    }
    upper.push(p)
  }

  lower.pop()
  upper.pop()
  return [...lower, ...upper]
}
