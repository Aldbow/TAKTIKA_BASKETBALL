/**
 * Lapisan penyimpanan — F-03 (mode tamu) dan F-04 (akun & sinkron).
 *
 * PRD §8:
 *   F-03 Mode tamu    : "Progres tersimpan lokal; ajakan daftar setelah 3 pelajaran"
 *   F-04 Akun & sinkron: "Masuk dengan email atau Google; progres sinkron lintas perangkat"
 *
 * Kedua fitur berbicara lewat SATU antarmuka `StorageAdapter`. Mode tamu
 * memakai localStorage sekarang; adapter Supabase (PRD §14) tinggal mengisi
 * antarmuka yang sama saat kredensial tersedia — UI dan store tidak berubah.
 */

export interface StorageAdapter {
  readonly name: 'local' | 'supabase'
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  /** Semua kunci milik namespace TAKTIKA — dipakai ekspor & hapus akun. */
  keys(): Promise<string[]>
}

const NS = 'taktika:'

/** Mode tamu (F-03). Bekerja penuh tanpa akun dan tanpa jaringan. */
export class LocalStorageAdapter implements StorageAdapter {
  readonly name = 'local' as const

  private available(): boolean {
    if (typeof window === 'undefined') return false
    try {
      const probe = `${NS}__probe`
      window.localStorage.setItem(probe, '1')
      window.localStorage.removeItem(probe)
      return true
    } catch {
      // Safari mode privat / penyimpanan penuh: aplikasi tetap jalan,
      // progres hanya tidak bertahan.
      return false
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.available()) return null
    const raw = window.localStorage.getItem(NS + key)
    if (raw === null) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.available()) return
    try {
      window.localStorage.setItem(NS + key, JSON.stringify(value))
    } catch {
      // Kuota habis: jangan pernah membuat aplikasi gagal karena ini.
    }
  }

  async remove(key: string): Promise<void> {
    if (!this.available()) return
    window.localStorage.removeItem(NS + key)
  }

  async keys(): Promise<string[]> {
    if (!this.available()) return []
    const out: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k?.startsWith(NS)) out.push(k.slice(NS.length))
    }
    return out
  }
}

/**
 * Tempat adapter Supabase (F-04).
 *
 * Belum diimplementasi karena membutuhkan URL proyek dan anon key dari pemilik
 * produk. Begitu kredensial tersedia, kelas ini mengisi antarmuka yang sama dan
 * seluruh aplikasi otomatis tersinkron — tidak ada perubahan di store atau UI.
 *
 * Row Level Security per pengguna (PRD §15 Keamanan) ditegakkan di sisi
 * Supabase, bukan di klien.
 */
export class SupabaseAdapterNotConfigured implements StorageAdapter {
  readonly name = 'supabase' as const
  private readonly reason =
    'Adapter Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan ' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY, lalu implementasikan kelas ini.'

  async get<T>(): Promise<T | null> {
    throw new Error(this.reason)
  }
  async set(): Promise<void> {
    throw new Error(this.reason)
  }
  async remove(): Promise<void> {
    throw new Error(this.reason)
  }
  async keys(): Promise<string[]> {
    throw new Error(this.reason)
  }
}

/** Apakah sinkron akun (F-04) tersedia di build ini? */
export function isCloudSyncConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

let adapter: StorageAdapter | null = null

/** Adapter aktif. Mode tamu selama sinkron akun belum dikonfigurasi. */
export function storage(): StorageAdapter {
  if (!adapter) adapter = new LocalStorageAdapter()
  return adapter
}

/** Dipakai pengujian untuk menyuntikkan adapter palsu. */
export function setStorageAdapter(next: StorageAdapter | null): void {
  adapter = next
}

/* -------------------------------------------------------------------------- */
/* Persist helper untuk Zustand                                               */
/* -------------------------------------------------------------------------- */

/**
 * Penyimpanan Zustand yang memakai StorageAdapter.
 *
 * Catatan: `persist` milik Zustand mengharapkan API sinkron atau Promise;
 * LocalStorageAdapter kita async, jadi dibungkus di sini. Dengan begitu
 * mengganti ke Supabase cukup satu baris.
 */
export const zustandStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await storage().get<unknown>(name)
    return value === null ? null : JSON.stringify(value)
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await storage().set(name, JSON.parse(value))
  },
  removeItem: async (name: string): Promise<void> => {
    await storage().remove(name)
  },
}
