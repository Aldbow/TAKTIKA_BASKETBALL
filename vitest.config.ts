import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@content': fileURLToPath(new URL('./content', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // PRD §15: Tactic Engine wajib cakupan unit test >= 90%.
      include: ['src/engine/**/*.ts'],
      exclude: ['src/engine/index.ts', 'src/engine/**/*.test.ts'],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 80 },
      reporter: ['text', 'json-summary'],
    },
  },
})
