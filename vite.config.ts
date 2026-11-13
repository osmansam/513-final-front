import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = { '/api': { target: env.API_PROXY_TARGET || 'http://127.0.0.1:8080', changeOrigin: true } }
  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy },
    test: { include: ['src/**/*.test.{ts,tsx}'], environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], restoreMocks: true },
  }
})
