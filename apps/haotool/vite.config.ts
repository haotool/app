import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import dns from 'node:dns';

// 確保 localhost 解析一致性（Node.js v17+ DNS 變更）。
dns.setDefaultResultOrder('verbatim');

const __dirname = dirname(fileURLToPath(import.meta.url));

// root-scope SW 只能處理 haotool 自身路由，避免吞掉同網域子 app（046 §5 防護）。
const HAOTOOL_NAVIGATE_FALLBACK_ALLOWLIST = [
  /^\/$/,
  /^\/tools(?:\/.*)?$/,
  /^\/about(?:\/.*)?$/,
  /^\/contact(?:\/.*)?$/,
];
const SIBLING_APP_DENYLIST = [
  /^\/ratewise(?:\/.*)?$/,
  /^\/nihonname(?:\/.*)?$/,
  /^\/park-keeper(?:\/.*)?$/,
  /^\/quake-school(?:\/.*)?$/,
  /^\/split-meow(?:\/.*)?$/,
];

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

  // haotool 為根站，三環境 base 預設 /（SSOT：app.config.mjs basePath）。
  const base = env['VITE_HAOTOOL_BASE_PATH'] ?? process.env['VITE_HAOTOOL_BASE_PATH'] ?? '/';

  const manifestScope = base.endsWith('/') ? base : `${base}/`;

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
      tailwindcss(),
      react(),
      {
        name: 'inject-version-meta',
        transformIndexHtml(html) {
          return html.replace(/__APP_VERSION__/g, appVersion).replace(/__BUILD_TIME__/g, buildTime);
        },
      },
      VitePWA({
        base,
        // prompt 模式：新 SW 進入 waiting 狀態，防止版本撕裂導致 Load failed（對齊 RateWise 治理）。
        registerType: 'prompt',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,json,ico,png,svg,woff,woff2,avif,webp}'],
          globIgnores: ['**/node_modules/**'],
          ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
          navigateFallbackAllowlist: HAOTOOL_NAVIGATE_FALLBACK_ALLOWLIST,
          navigateFallbackDenylist: SIBLING_APP_DENYLIST,
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
          id: manifestScope,
          name: 'HaoTool 好工具',
          short_name: 'HaoTool',
          description: '免費、開源、不收集個資的台灣網頁工具集。',
          theme_color: '#3182F6',
          background_color: '#F8FAFC',
          display: 'standalone',
          orientation: 'portrait',
          scope: manifestScope,
          start_url: manifestScope,
          categories: ['utilities', 'productivity'],
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
            // SSR build 跳過 manualChunks（react 為 external）。
            if (typeof process !== 'undefined' && process.env['SSR'] === 'true') {
              return undefined;
            }
            if (id.includes('node_modules')) {
              // react-router-dom 與 react 合併同一 chunk，避免 createContext 載入順序問題。
              // 以套件路徑段精確比對：避免 motion/framer-motion（pnpm 路徑含 react peer 字串）
              // 被吞進 vendor，破壞 LazyMotion features 的 async 按需載入。
              const vendorPattern =
                /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(?:react|react-dom|scheduler|react-router-dom|react-router|@remix-run)\//;
              if (vendorPattern.test(id)) {
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
      // defer：確保 vite-react-ssg hydration data 在 React bootstrap 前就緒（park-keeper 先例）。
      script: 'defer',
      // formatting none：避免 Hydration Failed errors。
      formatting: 'none',
      // nested dirStyle：產出 /path/index.html，配合尾斜線 SEO 策略。
      dirStyle: 'nested',
      // 停用 beasties：Tailwind v4 @layer utilities 無法被正確抽取（park-keeper 先例）。
      beastiesOptions: false,
      // 從 SSOT (app.config.mjs) 動態導入路由；/404 額外預渲染供 nginx error_page 使用。
      async includedRoutes() {
        const { SEO_PATHS } = await import('./app.config.mjs');
        const seoRoutes = SEO_PATHS.map((path: string) =>
          path === '/' ? path : path.replace(/\/$/, ''),
        );
        return [...seoRoutes, '/404'];
      },
      // onPageRendered：先清除 index.html 靜態 SEO 標籤再注入 per-route meta + JSON-LD（防重複）。
      async onPageRendered(route, renderedHTML) {
        const { getJsonLdForRoute, jsonLdToScriptTags } = await import('./src/seo/jsonld');
        const { getMetaTagsForRoute } = await import('./src/seo/meta-tags');

        const metaTags = getMetaTagsForRoute(route, buildTime);
        const jsonLd = getJsonLdForRoute(route, buildTime);
        const scriptTags = jsonLdToScriptTags(jsonLd);

        let html = renderedHTML;
        html = html.replace(/<title>[^<]*<\/title>/gi, '');
        html = html.replace(/<meta[^>]*name="description"[^>]*>/gis, '');
        html = html.replace(/<meta[^>]*name="keywords"[^>]*>/gis, '');
        html = html.replace(/<meta[^>]*name="robots"[^>]*>/gis, '');
        html = html.replace(/<meta[^>]*name="author"[^>]*>/gis, '');
        html = html.replace(/<link[^>]*rel="canonical"[^>]*>/gis, '');
        html = html.replace(/<meta[^>]*property="og:[^"]*"[^>]*>/gis, '');
        html = html.replace(/<meta[^>]*name="twitter:[^"]*"[^>]*>/gis, '');
        html = html.replace(/<!-- SEO Meta Tags -->/gi, '');

        return html.replace('</head>', `${metaTags}\n${scriptTags}</head>`);
      },
    },
  };
});
