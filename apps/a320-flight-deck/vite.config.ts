import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { APP_CONFIG, SITE_CONFIG } from './app.config.mjs';

export default defineConfig(({ command, isPreview }) => {
  // 開發伺服器用根路徑；建置與 preview 一律使用正式子路徑（Cloudflare Pages 組裝於 /a320-flight-deck/）
  const base =
    command === 'serve' && !isPreview
      ? APP_CONFIG.basePath.development
      : APP_CONFIG.basePath.production;
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        base,
        // prompt 型（repo 標準）：新版等所有分頁關閉後才接管，避免飛行中版本撕裂
        registerType: 'prompt',
        injectRegister: 'auto',
        devOptions: { enabled: false },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,jpg,txt,xml}'],
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: [
            {
              // B612／Inter／Noto Sans TC：離線時仍保有航電字型
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'a320-fonts',
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        manifest: {
          id: base,
          name: SITE_CONFIG.name,
          short_name: SITE_CONFIG.shortName,
          description: SITE_CONFIG.description,
          theme_color: '#05070a',
          background_color: '#05070a',
          // 全螢幕：手機加入主畫面後隱藏瀏覽器列，擴大駕駛艙視野
          display: 'fullscreen',
          scope: base,
          start_url: base,
          lang: 'zh-TW',
          categories: ['games', 'education', 'entertainment'],
          icons: [
            { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            {
              src: 'icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    server: { port: 3010 },
    preview: { port: 4180 },
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 2500,
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
      testTimeout: 120_000,
    },
  };
});
