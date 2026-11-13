import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['integration/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
})
