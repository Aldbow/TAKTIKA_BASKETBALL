'use client'

/**
 * Lapisan DOM di atas canvas — PRD §14:
 *   "Renderer 2D: PixiJS (WebGL) + lapisan SVG/HTML untuk label ... label tetap
 *    bisa dibaca pembaca layar."
 *
 * Dan PRD §15 aksesibilitas:
 *   "Alternatif animasi: narasi teks per fase diumumkan lewat aria-live"
 *   "Navigasi: semua fitur bisa dipakai dengan keyboard saja"
 *
 * Karena itu semua teks penting dan semua target yang bisa diketuk ada di sini
 * sebagai elemen DOM nyata — bukan digambar di canvas. Canvas hanya menangani
 * hal yang murni visual.
 */

import { useMemo } from 'react'

import { t as localize, toPx, type CourtTransform, type Vec2 } from '@/engine'
import type { CourtState, Decision, PovLens } from '@/engine'
import type { QuizTarget } from '../types'

export interface CourtOverlayProps {
  transform: CourtTransform | null
  state: CourtState
  /** Lensa POV aktif — sumber kartu isyarat dan panggilan suara */
  lens?: PovLens | null
  /** Tampilkan kartu isyarat di momen keputusan (A-09) */
  showCueCard?: boolean
  quizTargets?: QuizTarget[]
  onQuizAnswer?: (targetId: string) => void
  /** Teks panggilan suara melayang (P1 di tabel PRD §7) */
  showCalls?: boolean
  className?: string
}

export function CourtOverlay({
  transform,
  state,
  lens = null,
  showCueCard = true,
  quizTargets = [],
  onQuizAnswer,
  showCalls = true,
  className,
}: CourtOverlayProps) {
  const phaseText = useMemo(() => {
    if (!state.phase) return ''
    const title = localize(state.phase.title)
    const narration = localize(state.phase.narration)
    return narration ? `${title}. ${narration}` : title
  }, [state.phase])

  return (
    <div
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {/*
        Narasi fase untuk pembaca layar. Ini adalah ALTERNATIF animasi yang
        diminta PRD §15 — pengguna yang tidak bisa melihat lapangan tetap
        mendapatkan urutan kejadian taktik.
      */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {phaseText}
      </div>

      {/* Ringkasan posisi pemain, dibaca saat pengguna meminta detail. */}
      <div className="sr-only" aria-live="off">
        {state.players
          .map(
            (p) =>
              `${p.team === 'offense' ? 'Penyerang' : 'Bek'} ${p.label}${
                p.hasBall ? ' memegang bola' : ''
              }`,
          )
          .join('. ')}
      </div>

      {transform && showCueCard && state.decision && (
        <CueCallout transform={transform} state={state} decision={state.decision} lens={lens} />
      )}

      {transform && showCalls && lens && lens.calls.length > 0 && state.phase && (
        <VoiceCall transform={transform} state={state} lens={lens} />
      )}

      {/*
        Target kuis sebagai TOMBOL NYATA: bisa di-tab, punya nama aksesibel,
        dan memenuhi target sentuh 44 x 44 px (PRD §15).
      */}
      {transform &&
        quizTargets.map((target) => {
          const px = toPx(transform, target.at)
          return (
            <button
              key={target.id}
              type="button"
              onClick={() => onQuizAnswer?.(target.id)}
              aria-label={target.label}
              data-state={target.state}
              style={{
                position: 'absolute',
                left: px.x,
                top: px.y,
                transform: 'translate(-50%, -50%)',
                width: 56,
                height: 56,
                borderRadius: '50%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
            >
              <span className="sr-only">{target.label}</span>
            </button>
          )
        })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Kartu isyarat (A-09)                                                       */
/* -------------------------------------------------------------------------- */

/**
 * PRD §9 "Kartu isyarat: callout kaca dengan garis penunjuk ke pemain yang
 * terkait." PRD §8 F-13: harus tampil dalam 200 ms setelah momen keputusan.
 */
function CueCallout({
  transform,
  state,
  decision,
  lens,
}: {
  transform: CourtTransform
  state: CourtState
  decision: Decision
  lens: PovLens | null
}) {
  const owner = state.byId[decision.owner]
  if (!owner) return null

  const px = toPx(transform, owner.position)
  // Letakkan kartu di sisi lapangan yang lebih luas agar tidak menutupi aksi.
  const toRight = px.x < transform.offsetX + transform.pxWidth / 2
  const offset = 54

  const cue = lens?.cues[0] ? localize(lens.cues[0]) : localize(decision.cue)

  return (
    <div
      style={{
        position: 'absolute',
        left: toRight ? px.x + offset : undefined,
        right: toRight ? undefined : transform.offsetX + transform.pxWidth - px.x + offset,
        top: Math.max(8, px.y - 46),
        maxWidth: 260,
        pointerEvents: 'none',
      }}
      className="animate-rise-in"
    >
      {/* Garis penunjuk ke pemain terkait. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 46,
          [toRight ? 'left' : 'right']: -offset + 6,
          width: offset - 10,
          height: 1,
          background: 'linear-gradient(90deg, transparent, var(--ball))',
        }}
      />
      <div className="glass px-3 py-2.5" style={{ borderColor: 'var(--ball)' }}>
        <p
          className="hud text-xs uppercase tracking-wider"
          style={{ color: 'var(--ball)' }}
        >
          Lihat ini
        </p>
        <p className="mt-1 text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>
          {cue}
        </p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Panggilan suara (PRD §7, P1)                                               */
/* -------------------------------------------------------------------------- */

/**
 * "Panggilan suara: kata yang harus diteriakkan pemain ('Screen kiri!',
 * 'Switch!') muncul sebagai teks melayang."
 *
 * Panggilan dipilih dari fase aktif sehingga pemain melihat kata yang relevan
 * pada saat yang tepat, bukan daftar statis.
 */
function VoiceCall({
  transform,
  state,
  lens,
}: {
  transform: CourtTransform
  state: CourtState
  lens: PovLens
}) {
  const player = state.byId[lens.playerId]
  if (!player) return null

  const index = Math.min(state.phaseIndex, lens.calls.length - 1)
  const call = index >= 0 ? lens.calls[index] : undefined
  if (!call) return null

  const px: Vec2 = toPx(transform, player.position)

  return (
    <div
      key={call}
      className="animate-rise-in"
      style={{
        position: 'absolute',
        left: px.x,
        top: px.y - 62,
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
      }}
    >
      <span
        className="hud inline-block rounded-full px-2.5 py-1 text-xs font-bold"
        style={{
          background: 'color-mix(in srgb, var(--action-screen) 22%, var(--bg-void))',
          color: 'var(--action-screen)',
          border: '1px solid color-mix(in srgb, var(--action-screen) 45%, transparent)',
        }}
      >
        {call}
      </span>
    </div>
  )
}
