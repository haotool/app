import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import dns from 'node:dns';

// [fix:2025-12-29] 確保 localhost 解析一致性（Node.js v17+ DNS 變更）
// 參考: [context7:vitejs/vite:2025-12-29]
dns.setDefaultResultOrder('verbatim');

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 自動生成版本號
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
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
 * 依據: 2025 SEO 最佳實踐
 */
const normalizeSiteUrl = (value: string): string => {
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

// [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const appVersion = generateVersion();
  const buildTime = new Date().toISOString();
  const siteUrl = normalizeSiteUrl(env.VITE_SITE_URL || 'https://app.haotool.org/quake-school/');

  // 環境變數控制 base path
  const baseFromEnv = env.VITE_QUAKESCHOOL_BASE_PATH ?? process.env['VITE_QUAKESCHOOL_BASE_PATH'];
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
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,avif,webp}'],
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
          ],
        },
        manifest: {
          id: manifestStartUrl,
          name: '地震知識小學堂',
          short_name: 'QuakeSchool',
          description:
            '互動式地震衛教網頁應用程式。透過分級教學、互動模擬和測驗，幫助您了解地震科學知識。',
          theme_color: '#0ea5e9',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          scope: manifestScope,
          start_url: manifestStartUrl,
          categories: ['education', 'utilities'],
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
              if (id.includes('motion') || id.includes('framer-motion')) {
                return 'vendor-motion';
              }
            }
            return undefined;
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    // [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
    ssgOptions: {
      script: 'async',
      formatting: 'none',
      dirStyle: 'nested',
      concurrency: 10,
      beastiesOptions: {
        preload: 'media',
        pruneSource: true,
        inlineThreshold: 0,
        fonts: true,
        preloadFonts: true,
      },
      includedRoutes: () => {
        // 預渲染路徑
        return ['/', '/lessons', '/quiz', '/about'];
      },
      // 預渲染後處理 HTML - 注入 SEO
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
