import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { APP_CONFIG } from './app.config.mjs';

const _require = createRequire(import.meta.url);
const { version: appVersion } = _require('./package.json') as { version: string };
const buildTime = new Date().toISOString();

// [fix] Vite 8 dev server plugin container does not invoke resolveId hooks that use the new
// @rolldown/pluginutils filter syntax. vite-plugin-pwa only strips the filter when
// devOptions.enabled=true, so virtual:pwa-register/* never resolves in dev mode.
// Solution: intercept with a traditional (no-filter) resolveId hook BEFORE vite-plugin-pwa.
function pwaVirtualDevFix(mode: string): Plugin | false {
  if (mode === 'production') return false;
  const stubs: Record<string, string> = {
    '\0virtual:pwa-register': _require.resolve('vite-plugin-pwa/dist/client/dev/register.js'),
    '\0virtual:pwa-register/react': _require.resolve('vite-plugin-pwa/dist/client/dev/react.js'),
    '\0virtual:pwa-register/vue': _require.resolve('vite-plugin-pwa/dist/client/dev/vue.js'),
    '\0virtual:pwa-register/svelte': _require.resolve('vite-plugin-pwa/dist/client/dev/svelte.js'),
    '\0virtual:pwa-register/solid': _require.resolve('vite-plugin-pwa/dist/client/dev/solid.js'),
    '\0virtual:pwa-register/preact': _require.resolve('vite-plugin-pwa/dist/client/dev/preact.js'),
  };
  return {
    name: 'pwa-virtual-dev-fix',
    enforce: 'pre',
    resolveId(id) {
      if (id.startsWith('virtual:pwa-register')) return '\0' + id;
    },
    load(id) {
      const stubPath = stubs[id];
      if (stubPath) return readFileSync(stubPath, 'utf-8');
    },
  };
}

export default defineConfig(({ mode }) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const base =
    mode === 'production'
      ? APP_CONFIG.basePath.production
      : process.env['CI']
        ? APP_CONFIG.basePath.ci
        : APP_CONFIG.basePath.development;
  const manifestScope = base.endsWith('/') ? base : `${base}/`;
  return {
    plugins: [
      pwaVirtualDevFix(mode),
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
          globPatterns: [
            '**/*.js',
            '**/*.css',
            '**/*.html',
            '**/*.png',
            '**/*.svg',
            '**/*.webmanifest',
          ],
          globIgnores: ['**/node_modules/**', '**/sitemap.xml', '**/robots.txt', '**/llms.txt'],
        },
        manifest: {
          id: manifestScope,
          name: 'Split Meow',
          short_name: 'SplitMeow',
          description: 'A cute and minimal bill splitting app',
          theme_color: '#fbf9f7',
          background_color: '#fbf9f7',
          display: 'standalone',
          scope: manifestScope,
          start_url: manifestScope,
          orientation: 'portrait',
          categories: ['finance', 'utilities'],
          lang: 'zh-TW',
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
              src: 'icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'icons/icon-512.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
      }),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __BUILD_TIME__: JSON.stringify(buildTime),
    },
    resolve: {
      alias: {
        '@app/split-meow': resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      exclude: ['virtual:pwa-register', 'virtual:pwa-register/react'],
    },
    base,
  };
});
