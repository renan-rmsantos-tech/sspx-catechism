import { proto } from '@compozy/proto/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// A galeria de protótipos compila com este arquivo no modo `proto-render`; o
// PWA (service worker e manifest) só serve ao app de verdade.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === 'proto-render'
      ? []
      : [
          VitePWA({
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'service-worker.ts',
            registerType: 'autoUpdate',
            injectManifest: {
              globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
            },
            manifest: {
              name: 'Catequese',
              short_name: 'Catequese',
              description: 'Chamada offline e gestão da catequese',
              theme_color: '#f6f9fb',
              background_color: '#f6f9fb',
              display: 'standalone',
              scope: '/',
              start_url: '/dashboard',
              icons: [
                {
                  src: '/pwa-192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
                {
                  src: '/pwa-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any',
                },
                {
                  src: '/pwa-maskable-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
              shortcuts: [
                { name: 'Fazer chamada', url: '/dashboard' },
                { name: 'Inscrição', url: '/inscricao' },
              ],
            },
          }),
        ]),
    proto(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
}))
