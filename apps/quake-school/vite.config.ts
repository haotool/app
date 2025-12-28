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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const appVersion = generateVersion();
  const buildTime = new Date().toISOString();
  // Site URL (used by SEO modules)
  void (env.VITE_SITE_URL || 'https://app.haotool.org/quake-school/');

  // 生產/CI 預設 /quake-school/，本地開發使用 /
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
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,avif,webp}'],
          globIgnores: ['**/node_modules/**'],
          ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
          clientsClaim: true,
          skipWaiting: true,
          cleanupOutdatedCaches: true,
          navigationPreload: false,
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
          name: '地震小學堂 | Earthquake Kids Studio',
          short_name: 'QuakeSchool',
          description:
            '互動式地震衛教網頁，學習規模與震度的差異，透過動畫模擬與測驗掌握地震防災知識。',
          theme_color: '#0ea5e9',
          background_color: '#f0f9ff',
          display: 'standalone',
          orientation: 'portrait',
          scope: manifestScope,
          start_url: manifestStartUrl,
          categories: ['education', 'entertainment', 'utilities'],
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
            // Skip manualChunks for SSR build (react is external)
            if (typeof process !== 'undefined' && process.env.SSR === 'true') {
              return undefined;
            }
            if (id.includes('node_modules')) {
              // [fix:2025-12-29] 將 react-router-dom 與 react 合併到同一 chunk
              if (
                id.includes('react') ||
                id.includes('scheduler') ||
                id.includes('react-router-dom') ||
                id.includes('@remix-run')
              ) {
                return 'vendor';
              }
              if (id.includes('framer-motion')) {
                return 'animation';
              }
            }
            return undefined;
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    ssgOptions: {
      script: 'async',
      // [fix:2025-12-29] formatting 設為 'none' 以避免 Hydration Failed errors
      // [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
      formatting: 'none',
      // [SEO:2025-12-29] 優化 Critical CSS 配置以改善渲染阻塞
      beastiesOptions: {
        preload: 'media',
        pruneSource: true,
        inlineThreshold: 0,
        fonts: true,
        preloadFonts: true,
      },
      includedRoutes: () => {
        // [SEO:2025-12-29] 預渲染所有頁面
        return ['/', '/quiz/'];
      },
      // [fix:2025-12-29] 使用 onPageRendered hook 注入 JSON-LD 和 Meta Tags
      // [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
      async onPageRendered(route, renderedHTML) {
        // 動態導入 SEO 配置（避免 ESM/CJS 問題）
        const { getJsonLdForRoute, jsonLdToScriptTags } = await import('./src/seo/jsonld');
        const { getMetaTagsForRoute } = await import('./src/seo/meta-tags');

        // 1. 生成 Meta Tags
        const metaTags = getMetaTagsForRoute(route, buildTime);

        // 2. 生成 JSON-LD Script Tags
        const jsonLd = getJsonLdForRoute(route, buildTime);
        const scriptTags = jsonLdToScriptTags(jsonLd);

        // 3. 將 Meta Tags 和 JSON-LD 一起注入到 </head> 前
        let html = renderedHTML.replace('</head>', `${metaTags}\n${scriptTags}</head>`);

        // [fix:2025-12-29] 移除 framer-motion 的 opacity:0 內聯樣式以修復 NO_FCP 問題
        // 這確保 SSG 渲染時內容立即可見
        html = html.replace(/style="opacity:0[^"]*"/g, 'style=""');
        html = html.replace(/style="[^"]*transform:scale\(0\)[^"]*"/g, 'style=""');

        return html;
      },
    },
  };
});
