import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 最簡配置 - 參考 Context7 官方範例
// 參考 Context7 官方範例: vite-pwa/vite-plugin-pwa/docs/guide/service-worker-precache.md
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: 'RateWise - 即時匯率轉換器',
        short_name: 'RateWise',
        description: '快速、準確的即時匯率轉換工具',
        theme_color: '#8B5CF6',
        background_color: '#E8ECF4',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@app/ratewise': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, '../shared'),
    },
  },
  build: {
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
  },
});
