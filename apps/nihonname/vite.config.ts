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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const appVersion = generateVersion();
  const buildTime = new Date().toISOString();
  const siteUrl = env.VITE_SITE_URL || 'https://app.haotool.org/nihonname/';

  // [fix:2025-12-07] 與 ratewise 解耦，僅接受 app 專屬變數
  // 生產/CI 預設 /nihonname/，本地開發使用 /
  const baseFromEnv = env.VITE_NIHONNAME_BASE_PATH ?? process.env['VITE_NIHONNAME_BASE_PATH'];
  const base = baseFromEnv ?? (mode === 'production' || process.env['CI'] ? '/nihonname/' : '/');

  const manifestScope = base.endsWith('/') ? base : `${base}/`;
  const manifestStartUrl = manifestScope;

  return {
    base,
    server: {
      port: 3002,
      strictPort: true,
      open: true,
      host: '0.0.0.0',
    },
    preview: {
      port: 4174,
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
        '@app/nihonname': resolve(__dirname, './src'),
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
          name: 'NihonName 皇民化改姓生成器',
          short_name: 'NihonName',
          description:
            '1940年代台灣皇民化運動日式姓名生成器。輸入你的姓氏，探索歷史上的改姓對照與趣味諧音名。',
          theme_color: '#7f1d1d',
          background_color: '#f5f5f4',
          display: 'standalone',
          orientation: 'portrait',
          scope: manifestScope,
          start_url: manifestStartUrl,
          categories: ['entertainment', 'education', 'utilities'],
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
              // [fix:2025-12-06] 將 react-router-dom 與 react 合併到同一 chunk
              // 避免 createContext 在模組載入時未定義的問題
              // [context7:remix-run/react-router:2025-12-06]
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
      // [fix:2025-12-06] formatting 設為 'none' 以避免 Hydration Failed errors
      // [context7:/daydreamer-riri/vite-react-ssg:2025-12-06]
      formatting: 'none',
      // [SEO:2025-12-06] 優化 Critical CSS 配置以改善渲染阻塞
      // 參考: context7:/daydreamer-riri/vite-react-ssg
      beastiesOptions: {
        preload: 'media', // 使用 media 策略避免阻塞
        pruneSource: true, // 移除已內聯的 CSS
        inlineThreshold: 0, // 內聯所有 Critical CSS
        fonts: true, // 內聯字體
        preloadFonts: true, // 預載字體
      },
      includedRoutes: () => {
        // [SEO:2025-12-04] 新增歷史專區頁面
        // [SEO:2025-12-05] 新增 FAQ 頁面
        return [
          '/',
          '/about',
          '/guide',
          '/faq',
          '/history',
          '/history/kominka',
          '/history/shimonoseki',
          '/history/san-francisco',
        ];
      },
      // [fix:2025-12-06] 使用 onPageRendered hook 注入 JSON-LD 和 Meta Tags
      // 根據 vite-react-ssg 官方最佳實踐，<Head> 組件中的 <script> 標籤和 meta tags
      // 不會在 SSG build 時正確渲染，必須使用此 hook 手動注入
      // [context7:/daydreamer-riri/vite-react-ssg:2025-12-06]
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
        return renderedHTML.replace('</head>', `${metaTags}\n${scriptTags}</head>`);
      },
    },
  };
});
