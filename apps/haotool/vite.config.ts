import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import dns from 'node:dns';

// [fix:2025-12-13] 確保 localhost 解析一致性（Node.js v17+ DNS 變更）
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

  if (!process.env['CI'] && process.env['NODE_ENV'] !== 'production') {
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

  // [fix:2025-12-13] haotool 專案使用根路徑
  // 生產/CI 預設 /，本地開發也使用 /
  const baseFromEnv =
    env['VITE_HAOTOOL_BASE_PATH'] ??
    process.env['VITE_HAOTOOL_BASE_PATH'] ??
    env['VITE_haotool_BASE_PATH'] ??
    process.env['VITE_haotool_BASE_PATH'];
  const base = baseFromEnv ?? '/';

  const manifestScope = base.endsWith('/') ? base : `${base}/`;
  const manifestStartUrl = manifestScope;

  return {
    base,
    server: {
      port: 3003,
      strictPort: false,
      open: true,
      host: '0.0.0.0',
    },
    preview: {
      port: 4175,
      strictPort: false,
    },
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __BUILD_TIME__: JSON.stringify(buildTime),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    },
    resolve: {
      alias: {
        '@app/haotool': resolve(__dirname, './src'),
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
          name: 'haotool.org - Digital Portfolio',
          short_name: 'haotool',
          description:
            'Full-stack developer portfolio showcasing high-performance web applications built with modern technologies.',
          theme_color: '#6366f1',
          background_color: '#050505',
          display: 'standalone',
          orientation: 'portrait',
          scope: manifestScope,
          start_url: manifestStartUrl,
          categories: ['portfolio', 'development', 'technology'],
          lang: 'en',
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
            if (typeof process !== 'undefined' && process.env['SSR'] === 'true') {
              return undefined;
            }
            if (id.includes('node_modules')) {
              // [fix:2025-12-13] 將 react-router-dom 與 react 合併到同一 chunk
              // 避免 createContext 在模組載入時未定義的問題
              // [context7:remix-run/react-router:2025-12-13]
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
    ssgOptions: {
      script: 'async',
      // [fix:2025-12-13] formatting 設為 'none' 以避免 Hydration Failed errors
      // [context7:/daydreamer-riri/vite-react-ssg:2025-12-13]
      formatting: 'none',
      // [fix:2026-01-01] 使用 nested dirStyle 確保產生目錄結構 (/path/index.html)
      // 配合 nginx 尾斜線重定向，避免 SEO 重複內容問題
      // 參考: https://www.clickrank.ai/seo-academy/urls-and-seo/trailing-slash/
      dirStyle: 'nested',
      // [SEO:2025-12-13] 優化 Critical CSS 配置以改善渲染阻塞
      beastiesOptions: {
        preload: 'media',
        pruneSource: true,
        inlineThreshold: 0,
        fonts: true,
        preloadFonts: true,
      },
      // [fix:2026-01-01] 從 SSOT (app.config.mjs) 動態導入路由
      // vite-react-ssg 使用不帶尾斜線的路徑，dirStyle: 'nested' 會產生 /path/index.html
      // 參考: https://github.com/Daydreamer-riri/vite-react-ssg
      async includedRoutes() {
        const { SEO_PATHS } = await import('./app.config.mjs');
        // 將帶尾斜線的 SEO_PATHS 轉換為不帶尾斜線（根路徑除外）
        // 例如: '/about/' -> '/about', '/' -> '/'
        return SEO_PATHS.map((path: string) => (path === '/' ? path : path.replace(/\/$/, '')));
      },
      // [fix:2025-12-13] 使用 onPageRendered hook 注入 JSON-LD 和 Meta Tags
      // [fix:2026-02-12] 移除重複 description 與替換 title，避免 SEO 重複內容
      async onPageRendered(route, renderedHTML) {
        // 動態導入 SEO 配置
        const { getJsonLdForRoute, jsonLdToScriptTags } = await import('./src/seo/jsonld');
        const { getMetaTagsForRoute } = await import('./src/seo/meta-tags');

        // 1. 生成 Meta Tags（包含 <title> 和 <meta name="description">）
        const metaTags = getMetaTagsForRoute(route, buildTime);

        // 2. 生成 JSON-LD Script Tags
        const jsonLd = getJsonLdForRoute(route, buildTime);
        const scriptTags = jsonLdToScriptTags(jsonLd);

        // 3. 移除 index.html 的重複 <meta name="description">（避免 SEO 重複內容）
        let html = renderedHTML.replace(/<meta[^>]*name="description"[^>]*>/gis, '');

        // 4. 移除 index.html 的靜態 <title>（由 metaTags 中的 <title> 替換）
        html = html.replace(/<title>[^<]*<\/title>/gi, '');

        // 5. 將 Meta Tags 和 JSON-LD 一起注入到 </head> 前
        return html.replace('</head>', `${metaTags}\n${scriptTags}</head>`);
      },
    },
  };
});
