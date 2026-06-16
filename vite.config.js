import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, existsSync } from 'fs'
import { resolve } from 'path'

// Copies all brand-assets to dist/ root after each production build
const copyBrandAssets = {
  name: 'copy-brand-assets',
  apply: 'build',
  closeBundle() {
    const src = resolve('assets/brand-assets')
    const dest = resolve('dist')
    if (existsSync(src)) {
      cpSync(src, dest, { recursive: true, force: true })
    }
  },
}

export default defineConfig({
  plugins: [react(), copyBrandAssets],
  server: {
    watch: {
      ignored: ['**/design-ref/**', '**/design_handoff_taskmaster_redesign/**'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-dnd':      ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-icons':    ['@phosphor-icons/react'],
          'vendor-dayjs':    ['dayjs'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
})
