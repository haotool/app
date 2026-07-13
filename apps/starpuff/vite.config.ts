import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const base = mode === 'production' || process.env['CI'] ? '/starpuff/' : '/';
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
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          globIgnores: ['**/node_modules/**'],
          cleanupOutdatedCaches: true,
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
              src: 'icons/icon-192.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],
  };
});
