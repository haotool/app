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
              if (id.includes('react-router-dom') || id.includes('@remix-run')) {
                return 'router';
              }
              if (id.includes('react') || id.includes('scheduler')) {
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
      formatting: 'minify',
      crittersOptions: {
        preload: 'swap',
        pruneSource: true,
      },
      includedRoutes: (paths) => {
        return ['/', '/about'];
      },
    },
  };
});
