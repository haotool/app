import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { APP_CONFIG } from './app.config.mjs';

export default defineConfig(({ mode }) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const base =
    mode === 'production'
      ? APP_CONFIG.basePath.production
      : process.env['CI']
        ? APP_CONFIG.basePath.ci
        : APP_CONFIG.basePath.development;
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        base,
        registerType: 'prompt',
        injectRegister: 'auto',
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        injectManifest: {
          globPatterns: ['**/*.js', '**/*.css', '**/*.html', '**/*.svg', '**/*.webmanifest'],
          globIgnores: ['**/node_modules/**', '**/sitemap.xml', '**/robots.txt', '**/llms.txt'],
        },
        manifest: {
          name: 'Split Meow',
          short_name: 'SplitMeow',
          description: 'A cute and minimal bill splitting app',
          theme_color: '#fbf9f7',
          background_color: '#fbf9f7',
          display: 'standalone',
          scope: base,
          start_url: base,
          lang: 'zh-TW',
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
    resolve: {
      alias: {
        '@app/split-meow': resolve(__dirname, './src'),
      },
    },
    base,
  };
});
