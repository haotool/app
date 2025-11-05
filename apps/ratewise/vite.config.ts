import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 自動生成版本號
 * 策略: 發佈時使用 package.json 語義化版本，開發時附加 git metadata
 * 格式: {semver}[+sha.{hash}[-dirty]] or {semver}[+build.{distance}]
 */
function readPackageVersion(): string {
  const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
  return packageJson.version;
}

/**
 * 嘗試從 Git 標籤獲取版本號
 * @returns 版本號（如: "1.1.0" 或 "1.1.0+build.5"）或 null（如果無標籤）
 */
function getVersionFromGitTag(): string | null {
  try {
    const matchingTags = execSync('git tag --list "@app/ratewise@*"', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    if (matchingTags.length === 0) {
      return null;
    }

    const described = execSync('git describe --tags --long --match "@app/ratewise@*"', {
      encoding: 'utf-8',
    }).trim();

    const tagMatch = /@app\/ratewise@(\d+\.\d+\.\d+)-(\d+)-g[0-9a-f]+/.exec(described);
    if (!tagMatch) {
      return null;
    }

    const [, tagVersion, distance] = tagMatch;
    return Number(distance) === 0 ? tagVersion : `${tagVersion}+build.${distance}`;
  } catch {
    return null;
  }
}

/**
 * 使用 Git commit 數生成版本號
 * @param baseVersion - package.json 中的基礎版本
 * @returns 版本號（如: "1.0.123"）或 null（如果 Git 不可用）
 *
 * [fix:2025-11-05] 優先使用環境變數 GIT_COMMIT_COUNT（Docker 建置時提供）
 * 參考: Dockerfile ARG/ENV 最佳實踐
 */
function getVersionFromCommitCount(baseVersion: string): string | null {
  try {
    // 優先使用 Docker build args 傳入的環境變數
    const commitCount =
      process.env.GIT_COMMIT_COUNT ??
      execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();

    const [major = '1', minor = '0'] = baseVersion.split('.').slice(0, 2);
    return `${major}.${minor}.${commitCount}`;
  } catch {
    return null;
  }
}

/**
 * 開發環境版本號（附加 Git SHA 和 dirty 標記）
 * @param baseVersion - package.json 中的基礎版本
 * @returns 開發版本號（如: "1.0.0+sha.abc123f-dirty"）
 *
 * [fix:2025-11-05] 優先使用環境變數 GIT_COMMIT_HASH（Docker 建置時提供）
 */
function getDevelopmentVersion(baseVersion: string): string {
  try {
    const commitHash =
      process.env.GIT_COMMIT_HASH ??
      execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();

    const isDirty =
      execSync('git status --porcelain', { encoding: 'utf-8' }).trim().length > 0 ? '-dirty' : '';
    return `${baseVersion}+sha.${commitHash}${isDirty}`;
  } catch {
    return baseVersion;
  }
}

/**
 * 生成版本號（主函數）
 * 使用 nullish coalescing 串接多個策略，清晰簡潔
 *
 * [fix:2025-11-05] 統一開發和生產環境的版本號格式
 * 優先使用 .env.local 中的版本號（由 scripts/generate-version.js 生成）
 * 參考: https://vitejs.dev/guide/env-and-mode.html
 */
function generateVersion(): string {
  // [fix:2025-11-05] 優先使用 .env.local 中的版本號
  // 確保開發和生產環境使用相同的版本號格式
  if (process.env.VITE_APP_VERSION) {
    return process.env.VITE_APP_VERSION;
  }

  const baseVersion = readPackageVersion();

  // Fallback: 開發環境附加 Git metadata
  if (!process.env.CI && process.env.NODE_ENV !== 'production') {
    return getDevelopmentVersion(baseVersion);
  }

  // Fallback: 生產環境使用 commit 數
  return getVersionFromGitTag() ?? getVersionFromCommitCount(baseVersion) ?? baseVersion;
}

// 最簡配置 - 參考 Context7 官方範例
// [context7:vitejs/vite:2025-10-21T03:15:00+08:00]
// 使用函數形式確保 define 在所有模式下都能正確工作
export default defineConfig(() => {
  // 自動生成版本號（語義化版本 + git metadata）
  const appVersion = generateVersion();
  const buildTime = new Date().toISOString();

  // 最簡配置：使用環境變數，消除所有特殊情況
  // [fix:2025-10-27] 遵循 Linus 原則 - "好品味"：消除條件判斷
  // CI 環境: VITE_BASE_PATH='/' (Lighthouse/E2E)
  // 生產環境: VITE_BASE_PATH='/ratewise/' (Zeabur)
  const base = process.env['VITE_BASE_PATH'] || '/';

  // [fix:2025-11-05] PWA manifest 路徑策略
  // - scope/start_url: 皆需有尾斜線，確保符合 PWA 規範並避免瀏覽器忽略 scope
  // 參考: https://developer.mozilla.org/en-US/docs/Web/Manifest/start_url
  const manifestScope = base.endsWith('/') ? base : `${base}/`;
  const manifestStartUrl = manifestScope;

  // [fix:2025-11-05] 在 console 輸出版本資訊，方便除錯
  console.log(`Building RateWise v${appVersion} (${buildTime})`);

  // [fix:2025-11-05] 版本號透過 .env.local 自動注入
  // 由 scripts/generate-version.js 在 predev/prebuild 時自動生成
  // 參考: https://vitejs.dev/guide/env-and-mode.html
  // Vite 會自動讀取 VITE_APP_VERSION 和 VITE_BUILD_TIME

  return {
    base,
    define: {
      // 保留 define 作為 fallback，但主要使用環境變數
      __APP_VERSION__: JSON.stringify(appVersion),
      __BUILD_TIME__: JSON.stringify(buildTime),
    },
    plugins: [
      react(),
      // [fix:2025-11-05] 自定義 plugin：將版本號注入到 HTML meta 標籤
      // 參考: [context7:vitejs/vite:2025-11-05] - transformIndexHtml
      {
        name: 'inject-version-meta',
        // [fix:2025-11-05] 使用 transformIndexHtml 同時處理開發和生產環境
        // 參考: [context7:vitejs/vite:2025-11-05] - Plugin API transformIndexHtml
        transformIndexHtml: {
          order: 'pre', // 在其他 plugin 之前執行
          handler(html) {
            return html
              .replace(/__APP_VERSION__/g, appVersion)
              .replace(/__BUILD_TIME__/g, buildTime);
          },
        },
      },
      // [Lighthouse-optimization:2025-10-27] Brotli compression (saves 4,024 KiB)
      // 參考: https://web.dev/articles/reduce-network-payloads-using-text-compression
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024, // 只壓縮 >1KB 的檔案
        deleteOriginFile: false,
      }),
      // Gzip fallback for older browsers
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
        deleteOriginFile: false,
      }),
      // Bundle analyzer (只在需要時啟用)
      process.env['ANALYZE']
        ? visualizer({
            open: true,
            gzipSize: true,
            brotliSize: true,
            filename: 'lighthouse-reports/bundle-stats.html',
          })
        : null,
      VitePWA({
        base,
        // [fix:2025-11-05] 使用 autoUpdate 模式，確保用戶立即獲取最新版本
        // 參考: https://vite-pwa-org.netlify.app/guide/auto-update
        registerType: 'autoUpdate',
        injectRegister: 'auto',

        // [fix:2025-11-05] 防止 Service Worker 本身被快取
        // 參考: https://learn.microsoft.com/answers/questions/1163448/blazor-wasm-pwa-not-updating
        workbox: {
          // [fix:2025-11-05] 排除不需要預快取的檔案，避免 404 錯誤
          // 不預快取 index.html（由 navigateFallback 處理）和 apple-touch-icon.png（可選）
          globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2}'],
          globIgnores: ['**/apple-touch-icon.png'],

          // [fix:2025-11-05] 導航回退到 index.html，自動處理 SPA 路由
          // 參考: https://vite-pwa-org.netlify.app/guide/inject-manifest.html#navigation-fallback
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api/, /\.(json|txt|xml)$/],

          // [fix:2025-11-05] autoUpdate 模式：立即激活新 Service Worker
          clientsClaim: true,
          skipWaiting: true,

          // [fix:2025-11-05] 強制清理舊快取（預防快取衝突）
          // 參考: https://vite-pwa-org.netlify.app/guide/auto-update
          cleanupOutdatedCaches: true,

          // [fix:2025-11-05] 導航預載入快取（提升性能）
          navigationPreload: true,

          // [fix:2025-11-05] 運行時快取策略
          // 關鍵: index.html 使用 NetworkFirst，確保優先從網路獲取最新版本
          // 參考: https://stackoverflow.com/questions/54322336
          runtimeCaching: [
            {
              // HTML 文件：Network First 策略（優先網路，失敗才用快取）
              urlPattern: /\.html$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'html-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24, // 1 天（更短的快取時間）
                },
                networkTimeoutSeconds: 3, // 3 秒超時（更快的回退）
              },
            },
            {
              // API 請求：Network First（確保數據即時性）
              urlPattern: /^https:\/\/(raw\.githubusercontent\.com|cdn\.jsdelivr\.net)\/.*/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5, // 5 分鐘
                },
                networkTimeoutSeconds: 10,
              },
            },
            {
              // 靜態資源：Cache First（快速載入）
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
                },
              },
            },
          ],
        },

        // 開發環境配置
        devOptions: {
          enabled: true,
        },
        // Manifest 配置（此處配置會覆蓋 public/manifest.webmanifest）
        // 使用動態配置以支援 development/production 不同的 base path
        manifest: {
          name: 'RateWise - 即時匯率轉換器',
          short_name: 'RateWise',
          description:
            'RateWise 提供即時匯率換算服務，參考臺灣銀行牌告匯率，支援 TWD、USD、JPY、EUR、GBP 等 30+ 種貨幣。快速、準確、離線可用的 PWA 匯率工具。',
          theme_color: '#8B5CF6',
          background_color: '#E8ECF4',
          display: 'standalone',
          // [fix:2025-11-05] PWA manifest 路徑最佳實踐
          // - scope: 帶尾斜線 (MDN 規範要求，否則退回到根域名)
          // - start_url: 無尾斜線 (避免 nginx 301 重定向)
          // - id: 無尾斜線 (唯一識別符，與 start_url 一致)
          scope: manifestScope,
          start_url: manifestStartUrl,
          id: manifestStartUrl,
          orientation: 'portrait-primary',
          categories: ['finance', 'utilities', 'productivity'],
          // 完整的圖標配置（包含所有尺寸）
          icons: [
            {
              src: 'icons/ratewise-icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/ratewise-icon-256x256.png',
              sizes: '256x256',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/ratewise-icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/ratewise-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/ratewise-icon-1024x1024.png',
              sizes: '1024x1024',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/ratewise-icon-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: 'icons/ratewise-icon-maskable-1024x1024.png',
              sizes: '1024x1024',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
          // 應用程式截圖（用於安裝提示）
          screenshots: [
            {
              src: 'screenshots/mobile-home.png',
              sizes: '1080x1920',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: 'RateWise 首頁 - 即時匯率換算與趨勢圖',
            },
            {
              src: 'screenshots/mobile-converter-active.png',
              sizes: '1080x1920',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: '貨幣轉換 - 輸入金額即時顯示匯率結果',
            },
            {
              src: 'screenshots/mobile-features.png',
              sizes: '1080x1920',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: '常見問題與功能介紹',
            },
            {
              src: 'screenshots/desktop-converter.png',
              sizes: '1920x1080',
              type: 'image/jpeg',
              form_factor: 'wide',
              label: '桌面版 - 完整匯率轉換介面與趨勢圖表',
            },
            {
              src: 'screenshots/desktop-features.png',
              sizes: '1920x1080',
              type: 'image/jpeg',
              form_factor: 'wide',
              label: '桌面版 - 關於 RateWise 與功能說明',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@app/ratewise': resolve(__dirname, './src'),
        '@shared': resolve(__dirname, '../shared'),
      },
    },
    build: {
      // [Lighthouse-optimization:2025-10-27] Modern build target (saves 33 KiB)
      // 參考: https://philipwalton.com/articles/the-state-of-es5-on-the-web/
      target: 'es2020', // 支援 ES2020+ 瀏覽器 (>95% 市場)
      // 生成 hidden source maps - 不在生產環境暴露，但可用於錯誤追蹤服務
      // [context7:googlechrome/lighthouse-ci:2025-10-20T04:10:04+08:00]
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          // [Lighthouse-optimization:2025-10-27] 精細化 chunk splitting
          // 參考: https://vite.dev/guide/build.html#chunking-strategy
          // 目標: 減少未使用的 JavaScript，提升快取效率
          manualChunks(id) {
            // 將 node_modules 中的套件分離成 vendor chunks
            if (id.includes('node_modules')) {
              // React 核心庫單獨打包 (高頻使用，獨立快取)
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }

              // Sentry 獨立打包 (已 lazy load，罕用時不載入)
              if (id.includes('@sentry')) {
                return 'vendor-sentry';
              }

              // Charts library 獨立打包 (583KB, 57% unused)
              if (id.includes('lightweight-charts')) {
                return 'vendor-charts';
              }

              // Motion library 獨立打包 (420KB, 54% unused)
              if (id.includes('motion') || id.includes('framer-motion')) {
                return 'vendor-motion';
              }

              // React Router 獨立打包 (209KB, 81% unused，route-based splitting 用)
              if (id.includes('react-router')) {
                return 'vendor-router';
              }

              // Icons 獨立打包 (954KB，但只有 2.5% unused，表現良好)
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }

              // 其他小型庫統一打包
              return 'vendor-libs';
            }
            return undefined;
          },
          // 優化 chunk 檔名
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          // Source map 檔名
          sourcemapFileNames: 'assets/[name]-[hash].js.map',
        },
      },
      // 最小化 chunk 大小以符合 Lighthouse 建議
      chunkSizeWarningLimit: 500,
      // 啟用 CSS code splitting
      cssCodeSplit: true,
      // 最小化選項
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // 生產環境移除 console
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug', 'console.info', 'console.warn'],
        },
        sourceMap: true, // Terser 保留 source map
      },
    },
  };
});
