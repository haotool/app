/**
 * Quake-School Vite Configuration
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-29] - Vite React SSG
 * [context7:/vitejs/vite:2025-12-29] - Vite 7.x
 *
 * SEO 最佳實踐配置，基於 ratewise/nihonname 專案
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import dns from 'node:dns';

// [fix:2025-12-03] 確保 localhost 解析一致性（Node.js v17+ DNS 變更）
dns.setDefaultResultOrder('verbatim');

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 自動生成版本號
 */
function readPackageVersion(): string {
  const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
  return packageJson.version;
}

function generateVersion(): string {
  const baseVersion = readPackageVersion();

  if (!process.env.CI && process.env.NODE_ENV !== 'production') {
    try {
      const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
      return `${baseVersion}+sha.${commitHash}`;
    } catch {
      return baseVersion;
    }
  }

  return baseVersion;
}

/**
 * 確保站點 URL 具備尾斜線
 */
const normalizeSiteUrl = (value: string): string => {
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const appVersion = generateVersion();
  const buildTime = new Date().toISOString();
  const siteUrl = normalizeSiteUrl(env.VITE_SITE_URL || 'https://app.haotool.org/quake-school/');

  // 與 ratewise/nihonname 解耦，僅接受 app 專屬變數
  const baseFromEnv = env.VITE_QUAKE_SCHOOL_BASE_PATH ?? process.env['VITE_QUAKE_SCHOOL_BASE_PATH'];
  const base = baseFromEnv ?? (mode === 'production' || process.env['CI'] ? '/quake-school/' : '/');

  const manifestScope = base.endsWith('/') ? base : `${base}/`;
  const manifestStartUrl = manifestScope;

  return {
    base,
    server: {
      port: 3003,
      strictPort: true,
      open: true,
      host: '0.0.0.0',
    },
    preview: {
      port: 4175,
      strictPort: true,
    },
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __BUILD_TIME__: JSON.stringify(buildTime),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    },
    resolve: {
      alias: {
        '@app/quake-school': resolve(__dirname, './src'),
      },
    },
    plugins: [
      react(),
      // 版本號注入
      {
        name: 'inject-version-meta',
        transformIndexHtml(html) {
          return html.replace(/__APP_VERSION__/g, appVersion).replace(/__BUILD_TIME__/g, buildTime);
        },
      },
      // Brotli 壓縮
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false,
      }),
      // Gzip 備用
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
        deleteOriginFile: false,
      }),
      VitePWA({
        base,
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,avif,webp,txt,xml,webmanifest}'],
          globIgnores: ['**/node_modules/**'],
          ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
          clientsClaim: true,
          skipWaiting: true,
          cleanupOutdatedCaches: true,
          navigationPreload: false,
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [
            /^\/api/,
            /\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif)$/,
            /\.(?:js|css|json|woff|woff2)$/,
          ],
          runtimeCaching: [
            {
              urlPattern: /\.html$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'html-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24,
                },
                networkTimeoutSeconds: 5,
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
            {
              urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'font-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
            {
              urlPattern: /\.(?:js|css)$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'static-resources',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
              },
            },
          ],
        },
        manifest: {
          id: manifestStartUrl,
          name: 'Quake-School 地震防災教室',
          short_name: 'Quake-School',
          description: '台灣地震防災教育平台，提供地震知識、防災準備、避難指南等完整資訊。',
          theme_color: '#dc2626',
          background_color: '#fef2f2',
          display: 'standalone',
          orientation: 'portrait',
          scope: manifestScope,
          start_url: manifestStartUrl,
          categories: ['education', 'utilities'],
          lang: 'zh-TW',
          icons: [
            {
              src: 'icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    build: {
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (typeof process !== 'undefined' && process.env.SSR === 'true') {
              return undefined;
            }
            if (id.includes('node_modules')) {
              if (
                id.includes('react') ||
                id.includes('scheduler') ||
                id.includes('react-router-dom') ||
                id.includes('@remix-run')
              ) {
                return 'vendor';
              }
            }
            return undefined;
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    // [context7:/daydreamer-riri/vite-react-ssg:2025-12-29] SSG 配置
    ssgOptions: {
      script: 'async',
      formatting: 'none',
      beastiesOptions: {
        preload: 'media',
        pruneSource: true,
        inlineThreshold: 0,
        fonts: true,
        preloadFonts: true,
      },
      includedRoutes: () => {
        // SEO 預渲染路徑
        return ['/', '/about/', '/faq/', '/guide/'];
      },
      // JSON-LD 和 Meta Tags 在 onPageRendered 中注入
      async onPageRendered(route, renderedHTML) {
        const { getJsonLdForRoute, jsonLdToScriptTags } = await import('./src/seo/jsonld');
        const { getMetaTagsForRoute } = await import('./src/seo/meta-tags');

        const metaTags = getMetaTagsForRoute(route, buildTime);
        const jsonLd = getJsonLdForRoute(route, buildTime);
        const scriptTags = jsonLdToScriptTags(jsonLd);

        return renderedHTML.replace('</head>', `${metaTags}\n${scriptTags}</head>`);
      },
    },
  };
});
