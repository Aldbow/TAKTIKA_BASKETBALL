'use client'

/**
 * S-08 Kuis Baca & Bereaksi — F-18.
 *
 * PRD §12 Alur 3:
 *   1. Skenario dimulai; animasi berjalan normal sampai titik keputusan.
 *   2. Lapangan membeku; target yang bisa diketuk berkedip; penghitung waktu
 *      5 detik berjalan (bisa dimatikan).
 *   3. Pengguna mengetuk penerima umpan.
 *   4. Jika benar: denyut hijau, animasi melanjutkan opsi tersebut.
 *   5. Jika salah: getar merah, animasi tetap melanjutkan pilihan pengguna dan
 *      memperlihatkan akibatnya, lalu opsi yang benar bisa diputar dengan
 *      isyarat yang terlewat disorot.
 *   6. Setelah semua skenario: skor, XP, dan rekomendasi.
 *
 * Kuis memiliki jam dan konteks engine sendiri (bukan viewerStore): jeda kuis
 * bukan bullet time, dan state Tactic Viewer tidak boleh bocor ke sini.
 */

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { GLOSSARY } from '@content/glossary'
import {
  CATEGORY_TOKEN,
  MasterClock,
  getState,
  getStateContext,
  t as localize,
  type CourtTransform,
  type DecisionOption,
  type Tactic,
} from '@/engine'
import {
  branchesAfterChoice,
  explanationFor,
  outcomeOf,
  resolveScenarios,
} from '@/lib/readReact'
import { track } from '@/lib/analytics'
import { xpLabel } from '@/lib/format'
import { CourtCanvas } from '@/renderer2d/CourtCanvas'
import { CourtOverlay } from '@/renderer2d/overlay/CourtOverlay'
import { DEFAULT_LAYERS, type QuizTarget } from '@/renderer2d/types'
import { effectiveQuality, effectiveReducedMotion, useSettings } from '@/stores/settingsStore'
import { quizImprovement, useProgress } from '@/stores/progressStore'
import { CueCard, Icon, LinkButton, PillButton, ProgressBar, cx } from '@/components/ui'

type Phase = 'intro' | 'playing' | 'frozen' | 'outcome' | 'summary'

interface AnswerRecord {
  scenarioId: string
  correct: boolean
  timedOut: boolean
}

/** PRD §12 Alur 3 langkah 2: "penghitung waktu 5 detik". */
const TIMER_S = 5
/** Jeda singkat sebelum animasi melanjutkan — umpan balik tampil lebih dulu. */
const FEEDBACK_BEAT_MS = 650

export function ReadReactQuiz({ tactic }: { tactic: Tactic }) {
  const settings = useSettings()
  const reducedMotion = effectiveReducedMotion(settings)
  const quality = effectiveQuality(settings)
  const timerOn = settings.quizTimer

  const recordScenario = useProgress((s) => s.recordScenario)
  const recordTacticQuiz = useProgress((s) => s.recordTacticQuiz)

  const scenarios = useMemo(() => resolveScenarios(tactic), [tactic])
  const accent = CATEGORY_TOKEN[tactic.category]

  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('intro')
  const [branches, setBranches] = useState<string[]>(scenarios[0]?.setupBranches ?? [])
  const [chosen, setChosen] = useState<DecisionOption | null>(null)
  const [answered, setAnswered] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [showingCorrect, setShowingCorrect] = useState(false)
  const [outcomeDone, setOutcomeDone] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_S)
  const [records, setRecords] = useState<AnswerRecord[]>([])
  const [summary, setSummary] = useState<{ score: number; gained: number } | null>(null)
  const [transform, setTransform] = useState<CourtTransform | null>(null)

  const current = scenarios[index] ?? null

  const ctx = useMemo(() => getStateContext(tactic, branches).ctx, [tactic, branches])
  const clock = useMemo(
    () => new MasterClock({ duration: tactic.duration, phases: tactic.phases, decisions: [] }),
    [tactic],
  )
  useEffect(() => () => clock.destroy(), [clock])

  // Ref untuk dibaca di dalam callback jam (dipanggil di luar siklus React).
  const phaseRef = useRef<Phase>(phase)
  const currentRef = useRef(current)
  const frozenAtRef = useRef(0)
  const xpBeforeRef = useRef(0)
  const beatRef = useRef<number | null>(null)
  // True hanya selama animasi hasil benar-benar berjalan. seek() saat jam
  // berhenti juga memancarkan snapshot `playing: false`; tanpa penanda ini
  // snapshot itu terbaca sebagai "animasi hasil sudah selesai".
  const outcomeRunningRef = useRef(false)
  useEffect(() => {
    currentRef.current = current
  }, [current])
  useEffect(
    () => () => {
      if (beatRef.current !== null) window.clearTimeout(beatRef.current)
    },
    [],
  )

  const goPhase = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  /* ---- Pemantau jam: bekukan di titik jeda, tandai akhir animasi hasil ---- */
  useEffect(() => {
    return clock.subscribe((snap) => {
      const cur = currentRef.current
      if (!cur) return
      if (phaseRef.current === 'playing' && snap.t >= cur.scenario.pauseAt) {
        phaseRef.current = 'frozen'
        clock.pause()
        clock.seek(cur.scenario.pauseAt)
        frozenAtRef.current = performance.now()
        setTimeLeft(TIMER_S)
        setPhase('frozen')
        return
      }
      if (outcomeRunningRef.current && !snap.playing) {
        outcomeRunningRef.current = false
        setOutcomeDone(true)
      }
    })
  }, [clock])

  /** Putar animasi hasil dari waktu jam saat ini sampai akhir taktik. */
  const runOutcome = useCallback(() => {
    outcomeRunningRef.current = true
    clock.play()
  }, [clock])

  /* ---- Mulai satu skenario ---- */
  const startScenario = useCallback(
    (i: number) => {
      const s = scenarios[i]
      if (!s) return
      if (i === 0) xpBeforeRef.current = useProgress.getState().xp
      currentRef.current = s
      setIndex(i)
      setBranches(s.setupBranches)
      setChosen(null)
      setAnswered(false)
      setTimedOut(false)
      setShowingCorrect(false)
      setOutcomeDone(false)
      outcomeRunningRef.current = false
      clock.pause()
      clock.seek(s.playFrom)
      goPhase('playing')
      clock.play()
    },
    [clock, goPhase, scenarios],
  )

  /* ---- Menjawab ---- */
  const answer = useCallback(
    (opt: DecisionOption | null) => {
      const cur = currentRef.current
      if (!cur || phaseRef.current !== 'frozen') return
      // Cegah jawaban ganda selama jeda umpan balik.
      phaseRef.current = 'outcome'

      const correct = opt?.id === cur.answer.id
      const ms = Math.round(performance.now() - frozenAtRef.current)
      setAnswered(true)
      setChosen(opt)
      setTimedOut(opt === null)
      setRecords((r) => [...r, { scenarioId: cur.scenario.id, correct, timedOut: opt === null }])
      recordScenario(
        `${tactic.id}:${cur.scenario.id}`,
        correct,
        correct ? undefined : `${tactic.id}:${cur.decision.id}`,
      )
      track({
        name: 'quiz_answered',
        scenario_id: `${tactic.id}:${cur.scenario.id}`,
        correct,
        time_ms: ms,
      })

      // Kehabisan waktu: langsung perlihatkan opsi yang benar.
      const play = opt ?? cur.answer
      beatRef.current = window.setTimeout(() => {
        beatRef.current = null
        setBranches(branchesAfterChoice(tactic, cur.setupBranches, play))
        setShowingCorrect(opt === null)
        setOutcomeDone(false)
        setPhase('outcome')
        runOutcome()
      }, FEEDBACK_BEAT_MS)
    },
    [recordScenario, runOutcome, tactic],
  )

  /* ---- Penghitung waktu 5 detik ---- */
  const answerRef = useRef(answer)
  useEffect(() => {
    answerRef.current = answer
  }, [answer])

  useEffect(() => {
    if (phase !== 'frozen' || !timerOn || answered) return
    const start = performance.now()
    const id = window.setInterval(() => {
      const left = Math.max(0, TIMER_S - (performance.now() - start) / 1000)
      setTimeLeft(left)
      if (left <= 0) {
        window.clearInterval(id)
        answerRef.current(null)
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [phase, timerOn, answered])

  /* ---- Putar ulang opsi yang benar ---- */
  const replayCorrect = () => {
    if (!current) return
    setBranches(branchesAfterChoice(tactic, current.setupBranches, current.answer))
    setShowingCorrect(true)
    setOutcomeDone(false)
    outcomeRunningRef.current = false
    clock.pause()
    clock.seek(current.scenario.pauseAt)
    goPhase('outcome')
    runOutcome()
  }

  const nextScenario = () => {
    if (index < scenarios.length - 1) {
      startScenario(index + 1)
      return
    }
    clock.pause()
    const correct = records.filter((r) => r.correct).length
    const score = Math.round((correct / scenarios.length) * 100)
    recordTacticQuiz(tactic.id, score)
    setSummary({ score, gained: useProgress.getState().xp - xpBeforeRef.current })
    goPhase('summary')
  }

  const restart = () => {
    setRecords([])
    setSummary(null)
    startScenario(0)
  }

  /* ---- Target ketuk ---- */
  const frozenState = useMemo(
    () => (current ? getState(ctx, current.scenario.pauseAt) : null),
    [ctx, current],
  )

  // Target hanya selama lapangan membeku (termasuk jeda umpan balik sesudah
  // menjawab). Begitu animasi berjalan, posisi target tidak lagi sahih.
  const quizTargets = useMemo<QuizTarget[]>(() => {
    if (!current || !frozenState || phase !== 'frozen') return []
    // Hanya pemain yang dipetakan ke SATU opsi bisa diketuk; sisanya lewat daftar.
    const counts = new Map<string, number>()
    for (const o of current.decision.options) {
      if (o.targetPlayer) counts.set(o.targetPlayer, (counts.get(o.targetPlayer) ?? 0) + 1)
    }
    return current.decision.options
      .filter((o) => o.targetPlayer && counts.get(o.targetPlayer) === 1)
      .map((o) => {
        const p = frozenState.byId[o.targetPlayer as string]
        const state: QuizTarget['state'] = !answered
          ? 'idle'
          : o.id === current.answer.id
            ? 'correct'
            : o.id === chosen?.id
              ? 'wrong'
              : 'idle'
        return {
          id: o.id,
          at: p ? p.position : { x: 0, y: 0 },
          playerId: o.targetPlayer,
          label: localize(o.label),
          state,
        }
      })
  }, [answered, chosen, current, frozenState, phase])

  if (!current) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Kuis belum tersedia</h1>
        <p className="text-sm text-[var(--text-secondary)]">Taktik ini belum punya skenario Baca &amp; Bereaksi.</p>
        <LinkButton href={`/taktik/${tactic.slug}`}>Kembali ke taktik</LinkButton>
      </div>
    )
  }

  const isRight = answered && chosen?.id === current.answer.id
  const outcome = outcomeOf(tactic, showingCorrect ? current.answer : chosen)

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Bilah atas */}
      <header className="flex shrink-0 items-center gap-2 border-b border-[var(--glass-border)] px-3 py-2">
        <Link
          href={`/taktik/${tactic.slug}`}
          className="flex touch-target items-center gap-1.5 rounded-lg px-2 text-sm text-[var(--text-secondary)] transition-colors duration-fast hover:text-[var(--text-primary)]"
        >
          <Icon.ChevronRight size={16} className="rotate-180" />
          <span className="hidden tablet:inline">Kembali ke taktik</span>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="hud text-[10px] uppercase tracking-[0.16em]" style={{ color: accent }}>
            Baca &amp; Bereaksi
          </p>
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{localize(tactic.title)}</p>
        </div>
        <ol className="flex items-center gap-1.5" aria-label="Progres skenario">
          {scenarios.map((s, i) => {
            const r = records[i]
            return (
              <li
                key={s.scenario.id}
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: r
                    ? r.correct
                      ? 'var(--state-success)'
                      : 'var(--state-error)'
                    : i === index && phase !== 'intro' && phase !== 'summary'
                      ? accent
                      : 'color-mix(in srgb, var(--text-primary) 15%, transparent)',
                }}
              >
                <span className="sr-only">
                  Skenario {i + 1}: {r ? (r.correct ? 'benar' : 'salah') : 'belum dijawab'}
                </span>
              </li>
            )
          })}
        </ol>
      </header>

      <div className="flex min-h-0 flex-1 flex-col tablet:flex-row">
        {/* Lapangan */}
        <div className="relative min-h-[42dvh] flex-1">
          <CourtCanvas
            ctx={ctx}
            clock={clock}
            layers={DEFAULT_LAYERS}
            pov={{ playerId: null, blend: 0 }}
            quality={quality}
            reducedMotion={reducedMotion}
            frozen={phase === 'frozen'}
            quizTargets={quizTargets}
            onTransform={setTransform}
            className="absolute inset-0"
            ariaLabel={`Lapangan kuis ${localize(tactic.title)}`}
          />
          {frozenState && (
            <CourtOverlay
              transform={transform}
              state={frozenState}
              showCueCard={false}
              showCalls={false}
              quizTargets={phase === 'frozen' && !answered ? quizTargets : []}
              onQuizAnswer={(id) => answer(current.decision.options.find((o) => o.id === id) ?? null)}
            />
          )}

          {phase === 'frozen' && !answered && timerOn && (
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--bg-void)_75%,transparent)] px-3 py-1.5">
              <Icon.Target size={14} className="text-[var(--ball)]" />
              <span className="hud text-sm text-[var(--text-primary)]" aria-live="off">
                {timeLeft.toFixed(1).replace('.', ',')} dtk
              </span>
            </div>
          )}

          {answered && phase !== 'summary' && (
            <div
              aria-hidden="true"
              className={cx(
                'pointer-events-none absolute inset-0 animate-rise-in',
                !isRight && 'animate-shake-x',
              )}
              style={{
                boxShadow: `inset 0 0 0 3px ${isRight ? 'var(--state-success)' : 'var(--state-error)'}, inset 0 0 60px color-mix(in srgb, ${isRight ? 'var(--state-success)' : 'var(--state-error)'} 30%, transparent)`,
              }}
            />
          )}
        </div>

        {/* Panel */}
        <aside
          className="scrollable flex max-h-[58dvh] shrink-0 flex-col gap-4 border-t border-[var(--glass-border)] p-4 tablet:max-h-none tablet:w-[360px] tablet:border-l tablet:border-t-0"
          aria-live="polite"
        >
          {phase === 'intro' && (
            <div className="flex animate-rise-in flex-col gap-3">
              <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">
                {scenarios.length} skenario keputusan
              </h1>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Animasi berjalan sampai momen keputusan, lalu lapangan membeku. Ketuk pemain yang harus
                menerima bola, atau pilih aksi dari daftar.
                {timerOn ? ` Kamu punya ${TIMER_S} detik untuk setiap keputusan.` : ''}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Penghitung waktu bisa dimatikan di{' '}
                <Link href="/profil#pengaturan" className="text-[var(--team-offense)] underline-offset-2 hover:underline">
                  Profil → Pengaturan
                </Link>
                .
              </p>
              <PillButton size="lg" onClick={() => startScenario(0)} icon={<Icon.Play size={16} />}>
                Mulai kuis
              </PillButton>
            </div>
          )}

          {(phase === 'playing' || phase === 'frozen' || phase === 'outcome') && (
            <div className="flex flex-col gap-3">
              <p className="hud text-xs text-[var(--text-secondary)]">
                Skenario {index + 1} dari {scenarios.length}
              </p>
              <h2 className="text-base font-semibold leading-snug text-[var(--text-primary)]">
                {current.prompt}
              </h2>

              {phase === 'playing' && (
                <p className="text-sm text-[var(--text-secondary)]">Perhatikan lapangan…</p>
              )}

              {phase === 'frozen' && !answered && timerOn && (
                <ProgressBar
                  value={timeLeft}
                  max={TIMER_S}
                  color={timeLeft < 1.5 ? 'var(--state-error)' : 'var(--ball)'}
                  label="Sisa waktu menjawab"
                />
              )}

              {(phase === 'frozen' || answered) && (
                <ul className="flex flex-col gap-2">
                  {current.decision.options.map((o) => {
                    const isAnswer = o.id === current.answer.id
                    const isChosen = chosen?.id === o.id
                    return (
                      <li key={o.id}>
                        <button
                          type="button"
                          disabled={answered}
                          onClick={() => answer(o)}
                          className={cx(
                            'flex w-full items-center gap-2.5 rounded-xl border p-3 text-left text-sm transition-colors duration-fast',
                            !answered &&
                              'border-[var(--glass-border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[color-mix(in_srgb,var(--ball)_55%,transparent)]',
                            answered && isAnswer &&
                              'border-[var(--state-success)] bg-[color-mix(in_srgb,var(--state-success)_12%,transparent)] text-[var(--text-primary)]',
                            answered && isChosen && !isAnswer &&
                              'border-[var(--state-error)] bg-[color-mix(in_srgb,var(--state-error)_12%,transparent)] text-[var(--text-primary)]',
                            answered && !isAnswer && !isChosen &&
                              'border-[var(--glass-border)] text-[var(--text-secondary)] opacity-55',
                          )}
                        >
                          {answered && isAnswer ? (
                            <Icon.Check size={15} className="shrink-0 text-[var(--state-success)]" />
                          ) : answered && isChosen ? (
                            <Icon.Close size={15} className="shrink-0 text-[var(--state-error)]" />
                          ) : (
                            <span className="hud flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] text-[10px]">
                              {o.targetPlayer ? o.targetPlayer.replace(/^O/, '') : '·'}
                            </span>
                          )}
                          {localize(o.label)}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}

              {answered && (
                <div className="flex animate-rise-in flex-col gap-3">
                  <CueCard
                    kicker={timedOut ? 'Waktu habis' : isRight ? 'Benar' : 'Belum tepat'}
                    tone={isRight ? 'success' : 'error'}
                  >
                    {explanationFor(tactic, current, chosen)}
                  </CueCard>
                  {!isRight && (
                    <CueCard kicker="Isyarat yang terlewat" tone="ball">
                      {localize(current.decision.cue)}
                    </CueCard>
                  )}
                  {outcome && outcomeDone && (
                    <p className="hud text-xs text-[var(--text-secondary)]">
                      {showingCorrect ? 'Hasil opsi yang benar' : 'Hasil pilihanmu'}:{' '}
                      <span className="text-[var(--text-primary)]">{outcome}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {!isRight && !showingCorrect && (
                      <PillButton variant="outline" size="sm" onClick={replayCorrect} icon={<Icon.Replay size={14} />}>
                        Putar opsi yang benar
                      </PillButton>
                    )}
                    <PillButton size="sm" onClick={nextScenario} icon={<Icon.ChevronRight size={14} />}>
                      {index < scenarios.length - 1 ? 'Skenario berikutnya' : 'Lihat hasil'}
                    </PillButton>
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === 'summary' && summary && (
            <Summary tactic={tactic} summary={summary} records={records} onRestart={restart} />
          )}
        </aside>
      </div>
    </div>
  )
}

function Summary({
  tactic,
  summary,
  records,
  onRestart,
}: {
  tactic: Tactic
  summary: { score: number; gained: number }
  records: AnswerRecord[]
  onRestart: () => void
}) {
  const improvement = useProgress((s) => quizImprovement(s, tactic.id))
  const correct = records.filter((r) => r.correct).length
  const missed = records.length - correct
  const owner = tactic.decisions[0]?.owner
  const terms = tactic.terms
    .map((id) => GLOSSARY.find((g) => g.id === id))
    .filter((g): g is (typeof GLOSSARY)[number] => Boolean(g))
    .slice(0, 3)

  return (
    <div className="flex animate-rise-in flex-col gap-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="hud text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Skor</p>
        <p
          className="hud animate-count-flash text-4xl font-bold"
          style={{ color: summary.score >= 70 ? 'var(--state-success)' : 'var(--ball)' }}
        >
          {summary.score}%
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          {correct} dari {records.length} keputusan benar
        </p>
        {summary.gained > 0 && (
          <p className="hud text-lg font-bold text-[var(--ball)]">+{xpLabel(summary.gained)}</p>
        )}
        {improvement !== null && (
          <p className="text-xs text-[var(--text-secondary)]">
            Percobaan 1 → 3: {improvement >= 0 ? '+' : ''}
            {improvement} poin
          </p>
        )}
      </div>

      {missed > 0 && (
        <div className="flex flex-col gap-2">
          <p className="hud text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">Pelajari lagi</p>
          {owner && (
            <Link
              href={`/taktik/${tactic.slug}?pov=${owner}`}
              className="rounded-xl border border-[var(--glass-border)] p-3 text-sm text-[var(--text-primary)] transition-colors duration-fast hover:border-[color-mix(in_srgb,var(--team-offense)_45%,transparent)]"
            >
              Tonton taktik dari POV {owner.startsWith('O') ? `posisi ${owner.slice(1)}` : owner} — pemilik
              keputusan
            </Link>
          )}
          {terms.map((t) => (
            <Link
              key={t.id}
              href={`/glosarium#${t.id}`}
              className="rounded-xl border border-[var(--glass-border)] p-3 text-sm text-[var(--text-primary)] transition-colors duration-fast hover:border-[color-mix(in_srgb,var(--team-offense)_45%,transparent)]"
            >
              Istilah: <em>{t.term}</em>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <PillButton onClick={onRestart} icon={<Icon.Replay size={15} />}>
          Ulangi kuis
        </PillButton>
        <LinkButton href="/latihan" variant="outline">
          Latihan lain
        </LinkButton>
      </div>
    </div>
  )
}
