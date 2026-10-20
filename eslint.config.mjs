import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// eslint-config-next 16 sudah berformat flat config, jadi diimpor langsung —
// membungkusnya dengan FlatCompat membuat ESLint gagal ("circular structure").
const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: ['.next/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts'] },
]

export default config
