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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
})
