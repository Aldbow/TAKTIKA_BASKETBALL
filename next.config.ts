import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Tanpa ini Turbopack mencari lockfile ke atas dan menemukan package-lock.json
  // di direktori home, lalu memakai home sebagai root proyek.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  // PRD §15: JSON taktik diterbitkan sebagai aset statis yang di-cache agresif.
  async headers() {
    return [
      {
        source: '/taktik-data/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

export default nextConfig
