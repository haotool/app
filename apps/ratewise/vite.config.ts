import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import { imagetools } from 'vite-imagetools';
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
 * [fix:2025-11-06] 加強健壯性：確保生產環境總能生成有效版本
 */
function generateVersion(): string {
  const baseVersion = readPackageVersion();

  // 開發環境：附加 Git metadata
  if (!process.env.CI && process.env.NODE_ENV !== 'production') {
    return getDevelopmentVersion(baseVersion);
  }

  // 生產環境：優先使用 Git 標籤，次之 commit 數，最後 fallback 到 package.json
  const version = getVersionFromGitTag() ?? getVersionFromCommitCount(baseVersion) ?? baseVersion;

  // [fix:2025-11-06] 確保版本號完整且有效
  if (!version || version.length < 5) {
    console.warn(
      `⚠️ Generated version is invalid: "${version}", using baseVersion: ${baseVersion}`,
    );
    return baseVersion;
  }

  console.log(`✅ Generated version: ${version}`);
  return version;
}

// 最簡配置 - 參考 Context7 官方範例
// [context7:vitejs/vite:2025-10-21T03:15:00+08:00]
// 使用函數形式確保 define 在所有模式下都能正確工作
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // 自動生成版本號（語義化版本 + git metadata）
  const appVersion = generateVersion();
  const buildTime = new Date().toISOString();

  // 最簡配置：使用環境變數，消除所有特殊情況
  // [fix:2025-10-27] 遵循 Linus 原則 - "好品味"：消除條件判斷
  // CI 環境: VITE_BASE_PATH='/' (Lighthouse/E2E)
  // 生產環境: VITE_BASE_PATH='/ratewise/' (Zeabur)
  const baseFromEnv = env.VITE_BASE_PATH || process.env['VITE_BASE_PATH'];
  // CI 預設使用根路徑避免 /ratewise/ 404
  const base =
    baseFromEnv ?? (process.env['CI'] ? '/' : mode === 'production' ? '/ratewise/' : '/');

  // [fix:2025-11-06] PWA manifest 路徑策略（符合 PWA 最佳實踐）
  // - scope: 必須有尾斜線 (MDN 規範：定義應用範圍)
  // - start_url: 必須有尾斜線（必須在 scope 範圍內）
  // - id: 與 start_url 一致（PWA 唯一識別符）
  // 參考: https://web.dev/add-manifest/#start_url
  const manifestScope = base.endsWith('/') ? base : `${base}/`;
  const manifestStartUrl = manifestScope; // 與 scope 一致

  return {
    base,
    server: {
      port: 3001,
      strictPort: true,
      open: true,
    },
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __BUILD_TIME__: JSON.stringify(buildTime),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    },
    plugins: [
      react(),
      // [fix:2025-11-07] 圖片優化 plugin - 自動生成多尺寸和現代格式
      // 參考: https://github.com/JonasKruckenberg/imagetools
      imagetools({
        defaultDirectives: (url) => {
          // 只處理 public/optimized 目錄的圖片
          if (url.searchParams.has('imagetools')) {
            return new URLSearchParams({
              format: 'avif;webp;png',
              quality: '80',
            });
          }
          return new URLSearchParams();
        },
      }),
      // [fix:2025-11-05] 自定義 plugin：將版本號注入到 HTML meta 標籤
      {
        name: 'inject-version-meta',
        transformIndexHtml(html) {
          return html.replace(/__APP_VERSION__/g, appVersion).replace(/__BUILD_TIME__/g, buildTime);
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
        // [fix:2025-11-06] 臨時使用 autoUpdate 強制清理舊 SW（含 navigationPreload 的版本）
        // 修復完成後可改回 'prompt' 模式
        // 參考: https://vite-pwa-org.netlify.app/guide/auto-update
        registerType: 'autoUpdate',
        injectRegister: 'auto',

        // [fix:2025-11-05] 防止 Service Worker 本身被快取
        // 參考: https://learn.microsoft.com/answers/questions/1163448/blazor-wasm-pwa-not-updating
        workbox: {
          // [fix:2025-11-06] 包含 HTML 文件到預快取清單
          // Service Worker 需要知道 index.html 的位置才能處理 SPA 路由
          // [Phase3-optimization:2025-11-07] 包含 AVIF/WebP 優化圖片
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,avif,webp}'],

          // [fix:2025-11-07] 排除不存在或臨時文件，避免 404 錯誤
          // 排除匯率數據（由 runtimeCaching 處理）
          globIgnores: [
            '**/og-image-old.png',
            '**/node_modules/**',
            '**/lighthouse-reports/**',
            '**/rates/**/*.json', // 匯率數據不預快取，使用 runtime caching
          ],

          // [fix:2025-11-07] 忽略 URL 參數，提升快取命中率
          // 參考: https://developer.chrome.com/docs/workbox/modules/workbox-routing/#how-to-register-a-navigation-route
          ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],

          // [fix:2025-11-06] 強制自動更新（清理舊 SW）
          clientsClaim: true,
          skipWaiting: true,

          // [fix:2025-11-05] 強制清理舊快取（預防快取衝突）
          // 參考: https://vite-pwa-org.netlify.app/guide/auto-update
          cleanupOutdatedCaches: true,

          // [fix:2025-11-06] 禁用導航預載入（避免 preloadResponse 警告）
          // generateSW 模式無法正確處理 navigationPreload，會產生警告
          // 參考: https://developer.chrome.com/docs/workbox/modules/workbox-navigation-preload/
          navigationPreload: false,

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
                  maxAgeSeconds: 60 * 60 * 24, // 1 天（確保更新即時推送）
                },
                networkTimeoutSeconds: 5, // 5 秒超時後使用快取
              },
            },
            {
              // 歷史匯率：CDN 來源採用 CacheFirst，數據 immutable
              // 參考: context7:googlechrome/workbox:2025-11-08
              urlPattern:
                /^https:\/\/cdn\.jsdelivr\.net\/gh\/haotool\/app@data\/public\/rates\/history\/.*\.json$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'history-rates-cdn',
                expiration: {
                  maxEntries: 180,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 年
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // 歷史匯率 Raw fallback：同樣 CacheFirst，避免重複請求
              urlPattern:
                /^https:\/\/raw\.githubusercontent\.com\/haotool\/app\/data\/public\/rates\/history\/.*\.json$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'history-rates-raw',
                expiration: {
                  maxEntries: 180,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // 最新匯率：Stale-While-Revalidate，確保快速顯示並背景更新
              // 參考: web.dev/stale-while-revalidate & context7:googlechrome/workbox
              urlPattern:
                /^https:\/\/raw\.githubusercontent\.com\/haotool\/app\/data\/public\/rates\/latest\.json$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'latest-rate-cache',
                expiration: {
                  maxEntries: 1,
                  maxAgeSeconds: 60 * 5, // 5 分鐘
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // [fix:2025-11-07] 圖片資源：Cache First + AVIF/WebP 支援
              // 參考: https://developer.chrome.com/docs/workbox/caching-strategies-overview
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 150, // 增加快取容量以支援優化後的多格式圖片
                  maxAgeSeconds: 60 * 60 * 24 * 90, // 90 天（圖片很少變動）
                },
                cacheableResponse: {
                  statuses: [0, 200], // 快取成功的響應
                },
              },
            },
            {
              // [fix:2025-11-07] 字型資源：Cache First（字型永久快取）
              // 參考: https://web.dev/articles/font-best-practices
              urlPattern: /\.(?:woff|woff2|ttf|eot|otf)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'font-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 年
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // [fix:2025-11-07] JS/CSS 資源：Stale While Revalidate（平衡即時性與速度）
              // 參考: https://developer.chrome.com/docs/workbox/caching-strategies-overview
              urlPattern: /\.(?:js|css)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-resources',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
                },
              },
            },
          ],
        },

        // [fix:2025-11-06] 開發環境配置
        // 生產環境必須禁用，否則會觸發 CSP 錯誤（HMR 嘗試連接 :8080）
        devOptions: {
          enabled: false, // 生產環境必須為 false
          type: 'module',
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
          // [fix:2025-11-06] PWA manifest 路徑最佳實踐
          // scope, start_url, id 都使用 trailing slash（符合 PWA 規範）
          // 參考: https://web.dev/add-manifest/
          scope: manifestScope, // /ratewise/
          start_url: manifestStartUrl, // /ratewise/
          id: manifestStartUrl, // /ratewise/
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
      // [fix:2025-11-07] 優化最小化選項 - 移除更多未使用程式碼
      // 參考: https://web.dev/articles/reduce-javascript-payloads-with-code-splitting
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // 生產環境移除 console
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug', 'console.info', 'console.warn'],
          // [fix:2025-11-07] 激進優化選項
          passes: 2, // 多次壓縮以獲得更好效果
          dead_code: true, // 移除死程式碼
          unused: true, // 移除未使用的變數和函數
        },
        mangle: {
          safari10: true, // Safari 10 相容性
        },
        sourceMap: true, // Terser 保留 source map
      },
    },
  };
});
