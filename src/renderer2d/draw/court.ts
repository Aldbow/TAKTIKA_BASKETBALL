/**
 * Menggambar lapangan — PRD §9 "Lapangan":
 *   "Lantai: gradien navy dengan pola grid halus berlapis 4% opasitas; paint
 *    diwarnai cyan 6%. Garis: 2 px dengan glow 8 px; garis 3 poin dan lingkaran
 *    digambar ulang saat lapangan muncul (efek boot-up)."
 *
 * A-01 Boot-up lapangan:
 *   "Grid muncul pelan; garis lapangan menggambar diri dari lingkaran tengah ke
 *    luar; paint terisi; pemain muncul dari kolom cahaya berurutan 1->5 dengan
 *    jeda 80 ms. 1,6 dtk (400 ms pada kunjungan ulang)."
 *
 * Geometri lapangan diambil dari src/engine/court.ts — tidak ada angka ukuran
 * yang digandakan di sini.
 */

import {
  FIBA,
  FREE_THROW_Y,
  HALF_ENDLINE_Y,
  HALF_MIDLINE_Y,
  HALF_WIDTH,
  PAINT_HALF_WIDTH,
  THREE_ARC_JOIN_Y,
  THREE_CORNER_X,
  ZONES,
  lenPx,
  toPx,
  type CourtTransform,
  type Vec2,
} from '@/engine'
import { withAlpha } from '../palette'
import { ease, type RenderFrame } from '../types'

/** Lebar garis lapangan (px) pada skala 1; diskalakan sedikit dengan ukuran. */
function lineWidth(t: CourtTransform): number {
  // 2 px pada lapangan berukuran desktop; menebal sedikit di layar besar agar
  // tetap terbaca saat diproyeksikan ke TV (persona P2).
  return Math.max(1.4, Math.min(3.2, t.scale * 0.055))
}

function glowBlur(t: CourtTransform): number {
  return Math.max(4, Math.min(14, t.scale * 0.22))
}

/** Latar lantai: gradien navy + grid halus. */
export function drawFloor(frame: RenderFrame): void {
  const { g, transform: t, palette, bootProgress } = frame
  const x = t.offsetX
  const y = t.offsetY
  const w = t.pxWidth
  const h = t.pxHeight

  // Gradien navy: lebih terang di dekat ring agar mata tertarik ke sana.
  const grad = g.createLinearGradient(x, y, x, y + h)
  grad.addColorStop(0, palette.bgRaised)
  grad.addColorStop(0.55, palette.bgSurface)
  grad.addColorStop(1, palette.bgVoid)
  g.fillStyle = grad
  g.fillRect(x, y, w, h)

  // Grid halus 4% opasitas, muncul lebih dulu saat boot-up.
  const gridAlpha = 0.04 * ease.outCubic(ease.clamp01(bootProgress / 0.35))
  if (gridAlpha > 0.002) {
    const step = lenPx(t, 1) // satu garis per meter
    g.save()
    g.beginPath()
    g.rect(x, y, w, h)
    g.clip()
    g.strokeStyle = withAlpha(palette.lineCourt, gridAlpha)
    g.lineWidth = 1
    g.beginPath()
    for (let gx = x; gx <= x + w + 0.5; gx += step) {
      g.moveTo(Math.round(gx) + 0.5, y)
      g.lineTo(Math.round(gx) + 0.5, y + h)
    }
    for (let gy = y; gy <= y + h + 0.5; gy += step) {
      g.moveTo(x, Math.round(gy) + 0.5)
      g.lineTo(x + w, Math.round(gy) + 0.5)
    }
    g.stroke()
    g.restore()
  }
}

/**
 * Isi paint dengan cyan 6%. Digambar setelah grid, sebelum garis — sesuai
 * urutan boot-up A-01 ("paint terisi").
 */
export function drawPaintFill(frame: RenderFrame): void {
  const { g, transform: t, palette, bootProgress } = frame
  if (t.kind !== 'half') return

  const alpha = 0.06 * ease.outCubic(ease.clamp01((bootProgress - 0.45) / 0.3))
  if (alpha < 0.002) return

  const a = toPx(t, { x: -PAINT_HALF_WIDTH, y: HALF_ENDLINE_Y })
  const b = toPx(t, { x: PAINT_HALF_WIDTH, y: FREE_THROW_Y })
  g.fillStyle = withAlpha(palette.lineCourt, alpha)
  g.fillRect(a.x, a.y, b.x - a.x, b.y - a.y)
}

/**
 * Semua garis lapangan. Boot-up menggambar garis dari lingkaran tengah ke luar
 * dengan cara mengungkap sesuai jarak dari ring: garis dekat ring lebih dulu.
 */
export function drawCourtLines(frame: RenderFrame): void {
  const { g, transform: t, palette, quality, bootProgress } = frame

  g.save()
  g.strokeStyle = withAlpha(palette.lineCourt, palette.lineCourtAlpha)
  g.lineWidth = lineWidth(t)
  g.lineCap = 'round'
  g.lineJoin = 'round'
  if (quality.glow) {
    g.shadowColor = withAlpha(palette.lineCourt, 0.85)
    g.shadowBlur = glowBlur(t)
  }

  // Boot-up: 0 -> tidak ada garis, 1 -> semua garis.
  // Tahap garis berjalan di 0,25..0,9 dari progres total.
  const reveal = ease.emphasis(ease.clamp01((bootProgress - 0.25) / 0.65))

  if (t.kind === 'half') drawHalfCourt(frame, reveal)
  else drawFullCourt(frame, reveal)

  g.restore()
}

/* -------------------------------------------------------------------------- */
/* Setengah lapangan                                                          */
/* -------------------------------------------------------------------------- */

function drawHalfCourt(frame: RenderFrame, reveal: number): void {
  const { g, transform: t } = frame
  if (reveal <= 0.001) return

  // Urutan pengungkapan mengikuti A-01: dari lingkaran dekat ring ke luar.
  // Setiap elemen punya jendela [mulai, selesai] di dalam `reveal`.
  const stage = (from: number, to: number): number =>
    ease.clamp01((reveal - from) / Math.max(1e-6, to - from))

  // 1. Ring dan papan pantul (paling dekat titik asal)
  const rimStage = stage(0, 0.22)
  if (rimStage > 0) drawRim(frame, rimStage)

  // 2. Paint & garis lemparan bebas
  const paintStage = stage(0.12, 0.45)
  if (paintStage > 0) {
    g.save()
    g.globalAlpha *= paintStage
    strokePath(g, [
      toPx(t, { x: -PAINT_HALF_WIDTH, y: HALF_ENDLINE_Y }),
      toPx(t, { x: -PAINT_HALF_WIDTH, y: FREE_THROW_Y }),
      toPx(t, { x: PAINT_HALF_WIDTH, y: FREE_THROW_Y }),
      toPx(t, { x: PAINT_HALF_WIDTH, y: HALF_ENDLINE_Y }),
    ])

    // Lingkaran lemparan bebas: setengah atas solid, setengah bawah putus-putus
    // (konvensi diagram lapangan).
    const c = toPx(t, { x: 0, y: FREE_THROW_Y })
    const r = lenPx(t, FIBA.freeThrowCircleRadius)
    g.beginPath()
    g.arc(c.x, c.y, r, Math.PI, 2 * Math.PI)
    g.stroke()
    g.save()
    g.setLineDash([lenPx(t, 0.22), lenPx(t, 0.22)])
    g.beginPath()
    g.arc(c.x, c.y, r, 0, Math.PI)
    g.stroke()
    g.restore()

    // Area tanpa charge (radius 1,25 m dari pusat ring).
    const rim = toPx(t, { x: 0, y: 0 })
    g.save()
    g.globalAlpha *= 0.7
    g.beginPath()
    g.arc(rim.x, rim.y, lenPx(t, FIBA.noChargeRadius), 0, Math.PI)
    g.stroke()
    g.restore()

    g.restore()
  }

  // 3. Garis 3 poin: dua segmen lurus + busur
  const threeStage = stage(0.3, 0.78)
  if (threeStage > 0) {
    g.save()
    g.globalAlpha *= threeStage
    drawThreePointLine(frame)
    g.restore()
  }

  // 4. Batas lapangan & garis tengah (paling luar, terakhir)
  const boundsStage = stage(0.6, 1)
  if (boundsStage > 0) {
    g.save()
    g.globalAlpha *= boundsStage
    strokePath(
      g,
      [
        toPx(t, { x: -HALF_WIDTH, y: HALF_ENDLINE_Y }),
        toPx(t, { x: HALF_WIDTH, y: HALF_ENDLINE_Y }),
        toPx(t, { x: HALF_WIDTH, y: HALF_MIDLINE_Y }),
        toPx(t, { x: -HALF_WIDTH, y: HALF_MIDLINE_Y }),
      ],
      true,
    )

    // Setengah lingkaran tengah di garis tengah.
    const mid = toPx(t, { x: 0, y: HALF_MIDLINE_Y })
    g.beginPath()
    g.arc(mid.x, mid.y, lenPx(t, FIBA.centerCircleRadius), Math.PI, 2 * Math.PI)
    g.stroke()
    g.restore()
  }
}

function drawThreePointLine(frame: RenderFrame): void {
  const { g, transform: t } = frame

  // Segmen lurus di kedua sudut, dari garis akhir sampai titik temu busur.
  for (const sign of [-1, 1]) {
    const a = toPx(t, { x: sign * THREE_CORNER_X, y: HALF_ENDLINE_Y })
    const b = toPx(t, { x: sign * THREE_CORNER_X, y: THREE_ARC_JOIN_Y })
    g.beginPath()
    g.moveTo(a.x, a.y)
    g.lineTo(b.x, b.y)
    g.stroke()
  }

  // Busur 6,75 m dari pusat ring, antara kedua titik temu.
  //
  // Sudut dihitung di RUANG PIKSEL: pada setengah lapangan, y meter yang
  // bertambah (menjauhi ring, ke garis tengah) berarti y piksel bertambah
  // (ke bawah layar). Jadi titik temu busur berada pada sudut
  // atan2(+join, +-corner), dan busur harus disapu MELEWATI sudut 90 derajat
  // (lurus ke bawah = menjauhi ring) — bukan melewati 270 derajat, yang akan
  // menggambar busur di belakang papan pantul.
  const rim = toPx(t, { x: 0, y: 0 })
  const r = lenPx(t, FIBA.threePointRadius)
  const rightJoin = Math.atan2(THREE_ARC_JOIN_Y, THREE_CORNER_X)
  const leftJoin = Math.atan2(THREE_ARC_JOIN_Y, -THREE_CORNER_X)
  g.beginPath()
  g.arc(rim.x, rim.y, r, rightJoin, leftJoin)
  g.stroke()
}

function drawRim(frame: RenderFrame, alpha: number): void {
  const { g, transform: t, palette } = frame
  g.save()
  g.globalAlpha *= alpha

  // Papan pantul.
  const bbY = HALF_ENDLINE_Y + (FIBA.rimFromEndline - FIBA.backboardFromEndline)
  const bbA = toPx(t, { x: -FIBA.backboardWidth / 2, y: bbY })
  const bbB = toPx(t, { x: FIBA.backboardWidth / 2, y: bbY })
  g.lineWidth = lineWidth(t) * 1.6
  g.beginPath()
  g.moveTo(bbA.x, bbA.y)
  g.lineTo(bbB.x, bbB.y)
  g.stroke()

  // Ring: lingkaran volt agar langsung terbaca sebagai sasaran.
  const rim = toPx(t, { x: 0, y: 0 })
  g.strokeStyle = withAlpha(palette.ball, 0.9)
  g.lineWidth = lineWidth(t) * 1.2
  g.beginPath()
  g.arc(rim.x, rim.y, lenPx(t, FIBA.rimRadius), 0, Math.PI * 2)
  g.stroke()

  // Leher ring ke papan.
  g.beginPath()
  g.moveTo(rim.x, rim.y - lenPx(t, FIBA.rimRadius))
  g.lineTo(rim.x, bbA.y)
  g.stroke()

  g.restore()
}

/* -------------------------------------------------------------------------- */
/* Lapangan penuh (transisi & press)                                          */
/* -------------------------------------------------------------------------- */

function drawFullCourt(frame: RenderFrame, reveal: number): void {
  const { g, transform: t, palette } = frame
  if (reveal <= 0.001) return

  const halfLen = FIBA.length / 2
  g.save()
  g.globalAlpha *= reveal

  // Batas lapangan.
  strokePath(
    g,
    [
      toPx(t, { x: -halfLen, y: -HALF_WIDTH }),
      toPx(t, { x: halfLen, y: -HALF_WIDTH }),
      toPx(t, { x: halfLen, y: HALF_WIDTH }),
      toPx(t, { x: -halfLen, y: HALF_WIDTH }),
    ],
    true,
  )

  // Garis tengah + lingkaran tengah.
  const a = toPx(t, { x: 0, y: -HALF_WIDTH })
  const b = toPx(t, { x: 0, y: HALF_WIDTH })
  g.beginPath()
  g.moveTo(a.x, a.y)
  g.lineTo(b.x, b.y)
  g.stroke()
  const c = toPx(t, { x: 0, y: 0 })
  g.beginPath()
  g.arc(c.x, c.y, lenPx(t, FIBA.centerCircleRadius), 0, Math.PI * 2)
  g.stroke()

  // Dua setengah lapangan dicerminkan di sumbu x.
  for (const side of [-1, 1] as const) {
    const rimX = side * (halfLen - FIBA.rimFromEndline)

    // Paint: dari garis akhir sampai garis lemparan bebas.
    const endX = side * halfLen
    const ftX = side * (halfLen - FIBA.freeThrowFromEndline)
    strokePath(g, [
      toPx(t, { x: endX, y: -PAINT_HALF_WIDTH }),
      toPx(t, { x: ftX, y: -PAINT_HALF_WIDTH }),
      toPx(t, { x: ftX, y: PAINT_HALF_WIDTH }),
      toPx(t, { x: endX, y: PAINT_HALF_WIDTH }),
    ])

    // Lingkaran lemparan bebas.
    const ftc = toPx(t, { x: ftX, y: 0 })
    g.beginPath()
    g.arc(ftc.x, ftc.y, lenPx(t, FIBA.freeThrowCircleRadius), 0, Math.PI * 2)
    g.stroke()

    // Garis 3 poin: dua segmen lurus sejajar garis samping + busur.
    // Di lapangan penuh, arah "menjauhi ring" adalah sumbu x, jadi titik temu
    // busur bergeser dari ring ke arah tengah lapangan sebesar THREE_ARC_JOIN_Y.
    const joinX = rimX - side * THREE_ARC_JOIN_Y
    for (const edge of [-1, 1] as const) {
      const p1 = toPx(t, { x: endX, y: edge * THREE_CORNER_X })
      const p2 = toPx(t, { x: joinX, y: edge * THREE_CORNER_X })
      g.beginPath()
      g.moveTo(p1.x, p1.y)
      g.lineTo(p2.x, p2.y)
      g.stroke()
    }

    // Busur disapu melewati arah "menjauhi ring" (-side pada sumbu x).
    const rimPx = toPx(t, { x: rimX, y: 0 })
    const r = lenPx(t, FIBA.threePointRadius)
    const dxAway = -side * THREE_ARC_JOIN_Y
    const upper = Math.atan2(-THREE_CORNER_X, dxAway)
    const lower = Math.atan2(THREE_CORNER_X, dxAway)
    g.beginPath()
    // side > 0: arah menjauhi ring = -x (sudut pi). Sapuan dari tepi bawah ke
    // tepi atas melewati pi.
    // side < 0: arah menjauhi ring = +x (sudut 0). Sapuan dari tepi atas ke
    // tepi bawah melewati 0.
    if (side > 0) g.arc(rimPx.x, rimPx.y, r, lower, upper)
    else g.arc(rimPx.x, rimPx.y, r, upper, lower)
    g.stroke()

    // Ring.
    g.save()
    g.strokeStyle = withAlpha(palette.ball, 0.9)
    g.beginPath()
    g.arc(rimPx.x, rimPx.y, lenPx(t, FIBA.rimRadius), 0, Math.PI * 2)
    g.stroke()
    g.restore()
  }

  g.restore()
}

/* -------------------------------------------------------------------------- */
/* Label zona                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Label zona — PRD §9: "muncul saat disentuh atau saat narasi menyebut zona itu."
 * Zona yang disorot diteruskan dari UI (hover peta zona, atau narasi pelajaran).
 */
export function drawZoneLabels(
  frame: RenderFrame,
  highlighted: readonly string[],
): void {
  const { g, transform: t, palette, layers } = frame
  if (!layers.labels || t.kind !== 'half' || highlighted.length === 0) return

  const set = new Set(highlighted)
  g.save()
  g.font = `600 ${Math.max(10, Math.min(14, t.scale * 0.34))}px var(--font-mono), monospace`
  g.textAlign = 'center'
  g.textBaseline = 'middle'

  for (const z of ZONES) {
    if (!set.has(z.id)) continue
    const p = toPx(t, z.center)

    // Cincin zona.
    g.strokeStyle = withAlpha(palette.lineCourt, 0.5)
    g.lineWidth = 1.5
    g.setLineDash([4, 4])
    g.beginPath()
    g.arc(p.x, p.y, lenPx(t, z.radius), 0, Math.PI * 2)
    g.stroke()
    g.setLineDash([])

    // Label berlatar agar tetap terbaca di atas garis lapangan.
    const text = z.label.toUpperCase()
    const metrics = g.measureText(text)
    const padX = 8
    const boxH = 20
    g.fillStyle = withAlpha(palette.bgVoid, 0.82)
    g.fillRect(p.x - metrics.width / 2 - padX, p.y - boxH / 2, metrics.width + padX * 2, boxH)
    g.strokeStyle = withAlpha(palette.lineCourt, 0.35)
    g.lineWidth = 1
    g.strokeRect(p.x - metrics.width / 2 - padX, p.y - boxH / 2, metrics.width + padX * 2, boxH)
    g.fillStyle = palette.textPrimary
    g.fillText(text, p.x, p.y + 0.5)
  }
  g.restore()
}

/* -------------------------------------------------------------------------- */
/* Pembantu                                                                   */
/* -------------------------------------------------------------------------- */

function strokePath(
  g: CanvasRenderingContext2D,
  pts: readonly Vec2[],
  close = false,
): void {
  if (pts.length < 2) return
  g.beginPath()
  g.moveTo(pts[0]!.x, pts[0]!.y)
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i]!.x, pts[i]!.y)
  if (close) g.closePath()
  g.stroke()
}
