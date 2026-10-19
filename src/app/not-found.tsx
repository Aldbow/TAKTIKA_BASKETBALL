import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="hud text-sm uppercase tracking-[0.2em] text-[var(--text-secondary)]">
        404
      </p>
      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
        Halaman ini tidak ada
      </h1>
      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
        Tautan mungkin salah, atau taktik yang kamu cari belum terbit. Coba mulai
        dari Perpustakaan Taktik.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link
          href="/taktik"
          className="inline-flex touch-target items-center rounded-full bg-[var(--team-offense)] px-5 text-sm font-semibold text-[var(--text-inverse)]"
        >
          Perpustakaan Taktik
        </Link>
        <Link
          href="/belajar"
          className="inline-flex touch-target items-center rounded-full border border-[var(--glass-border)] px-5 text-sm text-[var(--text-primary)]"
        >
          Peta Jalur Belajar
        </Link>
      </div>
    </div>
  )
}
