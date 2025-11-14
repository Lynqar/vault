import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/vault/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Password Vault',
        short_name: 'SecureVault',
        description: 'A secure, offline-first password manager with advanced encryption',
        theme_color: '#1e1b4b',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/vault/',
        start_url: '/vault/',
        icons: [
          {
            src: 'vite.svg',
            sizes: '32x32',
            type: 'image/svg+xml'
          }
        ],
        categories: ['productivity', 'utilities', 'security']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
