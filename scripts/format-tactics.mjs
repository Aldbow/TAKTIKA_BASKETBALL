/**
 * Formatter JSON taktik.
 *
 * Alat bantu konten: menjaga `content/tactics/*.json` tetap bisa dibaca manusia
 * dengan memadatkan array koordinat ke satu baris. Tanpa ini, setiap kali berkas
 * diproses ulang oleh skrip, satu jalur 4 titik menjadi 24 baris dan diff-nya
 * tidak bisa ditinjau.
 *
 * Dipakai juga oleh Studio Konten (F-27) saat mengekspor taktik baru.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(process.cwd(), 'content', 'tactics')

/** Array yang seluruh isinya angka, atau pasangan [x, y], dipadatkan. */
function isCompactable(value) {
  if (!Array.isArray(value)) return false
  if (value.every((v) => typeof v === 'number')) return true
  return (
    value.length > 0 &&
    value.every((v) => Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number'))
  )
}

function fmt(value, indent) {
  const pad = '  '.repeat(indent)
  const padIn = '  '.repeat(indent + 1)

  if (value === null) return 'null'
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value)
  if (typeof value === 'string') return JSON.stringify(value)

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    if (isCompactable(value)) {
      const inner = value
        .map((v) => (Array.isArray(v) ? `[${v.map((n) => JSON.stringify(n)).join(', ')}]` : JSON.stringify(v)))
        .join(', ')
      // Jalur panjang tetap dipecah agar tidak melewati ~100 kolom.
      if (inner.length <= 86) return `[${inner}]`
      const chunks = []
      let line = ''
      for (const part of inner.split(', ')) {
        const next = line ? `${line}, ${part}` : part
        if (next.length > 80) {
          chunks.push(line)
          line = part
        } else {
          line = next
        }
      }
      if (line) chunks.push(line)
      return `[\n${chunks.map((c) => padIn + c).join(',\n')}\n${pad}]`
    }
    return `[\n${value.map((v) => padIn + fmt(v, indent + 1)).join(',\n')}\n${pad}]`
  }

  const entries = Object.entries(value)
  if (entries.length === 0) return '{}'
  // Objek kecil satu baris (mis. { "id": "..." }, { "x": 0, "y": 8.2 }).
  const oneLine = `{ ${entries.map(([k, v]) => `${JSON.stringify(k)}: ${fmt(v, 0)}`).join(', ')} }`
  if (!oneLine.includes('\n') && oneLine.length + pad.length <= 96) return oneLine

  return `{\n${entries
    .map(([k, v]) => `${padIn}${JSON.stringify(k)}: ${fmt(v, indent + 1)}`)
    .join(',\n')}\n${pad}}`
}

let changed = 0
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  const path = join(DIR, file)
  const before = readFileSync(path, 'utf8')
  const after = `${fmt(JSON.parse(before), 0)}\n`
  if (before !== after) {
    writeFileSync(path, after, 'utf8')
    changed++
    console.log(`format: ${file}`)
  }
}
console.log(changed === 0 ? 'Semua berkas taktik sudah terformat.' : `${changed} berkas diformat.`)
