import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(async ({ mode }) => {
  // basePath SSOT：app.config.mjs（動態 import，鏡像 quake-school includedRoutes 模式）。
  const { APP_CONFIG } = await import('./app.config.mjs');
  const base =
    mode === 'production' || process.env['CI']
      ? APP_CONFIG.basePath.production
      : APP_CONFIG.basePath.development;
  const manifestScope = base;

  return {
    base,
    server: {
      port: 3007,
      strictPort: true,
      host: '0.0.0.0',
    },
    preview: {
      port: 4179,
      strictPort: true,
    },
    plugins: [
      VitePWA({
        base,
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
          globIgnores: ['**/node_modules/**'],
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        manifest: {
          id: manifestScope,
          name: '星噗噗 StarPuff',
          short_name: 'StarPuff',
          description: '吸入果凍怪、化為星彈、擊敗果凍王的 Q 彈動作小遊戲。',
          theme_color: '#BFF3E0',
          background_color: '#FDEFF6',
          display: 'standalone',
          orientation: 'portrait',
          scope: manifestScope,
          start_url: manifestScope,
          lang: 'zh-TW',
          categories: ['games', 'entertainment'],
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-192-maskable.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
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
  };
});
