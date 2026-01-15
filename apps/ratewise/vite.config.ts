import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import { imagetools } from 'vite-imagetools';
import csp from 'vite-plugin-csp-guard';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import dns from 'node:dns';

// [fix:2025-11-23] 確保 localhost 解析一致性（Node.js v17+ DNS 變更）
// 參考: [context7:vitejs/vite:2025-11-23] Configure DNS Result Order
dns.setDefaultResultOrder('verbatim');

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

/**
 * 確保站點 URL 具備尾斜線，避免 prerender 時 canonical/hreflang 拼接錯誤
 * 依據: Vite SSG 2025 預渲染最佳實踐（標準化 base URL）
 */
const normalizeSiteUrl = (value: string): string => {
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

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
  // [fix:2025-12-14] 使用專屬環境變數名稱，與 haotool/nihonname 保持一致
  // [fix:2025-12-15] 嚴格驗證環境變數，防止空格或無效值
  // 所有環境（CI、開發、生產）都通過 VITE_RATEWISE_BASE_PATH 控制
  // 未設置時默認 /ratewise/（生產環境默認值）
  const rawEnvValue = env.VITE_RATEWISE_BASE_PATH || process.env['VITE_RATEWISE_BASE_PATH'] || '';
  // 驗證：只接受以 '/' 開頭的有效路徑，否則使用默認值
  const isValidPath = rawEnvValue.startsWith('/') && !rawEnvValue.includes(' ');
  // [fix:2025-12-15] 移除環境特殊處理，統一默認為 /ratewise/
  // 如需根目錄（/）測試或部署，請顯式設置 VITE_RATEWISE_BASE_PATH='/'
  const base = isValidPath ? rawEnvValue : '/ratewise/';

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
    // [fix:2025-11-23] Preview server 配置
    // 參考: [context7:vitejs/vite:2025-11-23] Configure Vite Preview
    // 依賴 dns.setDefaultResultOrder('verbatim') 確保 localhost 解析一致性
    preview: {
      port: 4173,
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
        // [React 19 shim] react-is 對 AsyncMode 的存取在 React 19 移除，提供本地 shim 以避免 SSR/SSG 崩潰
        'react-is': resolve(__dirname, './src/utils/react-is-shim.ts'),
        '@app/ratewise': resolve(__dirname, './src'),
        '@shared': resolve(__dirname, '../shared'),
      },
    },
    plugins: [
      react(),
      // [2025-12-10] Hash-based CSP 防護（Vite SSG 最佳實踐）
      // [fix:2025-12-24] 禁用 meta tag，改用 HTTP header（Nginx 配置）
      // 原因：CSP meta tag 太長會導致 charset 超出前 1024 bytes，Lighthouse 報錯
      // 參考: https://vite-csp.tsotne.co.uk/
      csp({
        algorithm: 'sha256',
        dev: { run: true }, // 開發模式也檢查 CSP 違規
        build: {
          sri: true, // 啟用 Subresource Integrity
        },
        policy: {
          'script-src': ["'self'", 'https://static.cloudflareinsights.com'],
          'style-src': [
            "'self'",
            // SHA-256 hash of empty string for CSS-in-JS libraries (MUI/Emotion)
            "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='",
          ],
          // [fix:2026-01-15] 允許外部 API 請求以載入匯率數據
          // 參考: [context7:/mdn/content:2026-01-15] CSP connect-src directive
          // connect-src 控制 fetch、XMLHttpRequest、WebSocket 等腳本介面的連接
          'connect-src': ["'self'", 'https://raw.githubusercontent.com'],
        },
      }),
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
      // [fix:2025-12-24] CSP meta tag 由 postbuild 腳本移除
      // 原因：vite-plugin-csp-guard 總是在最後注入 CSP meta tag
      // 解決方案：postbuild-mirror-dist.js 會移除 CSP meta 並確保 charset 在前 1024 bytes
      // CSP 由 Nginx HTTP header 提供，符合 2025 最佳實踐
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
        // [fix:2026-01-09] Switch to injectManifest for full Service Worker control
        // Reason: generateSW doesn't support setCatchHandler for proper offline fallback
        // Reference: [context7:vite-pwa/vite-plugin-pwa:2026-01-09]
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        // [fix:2026-01-09] Force inline registration for injectManifest mode
        // Reason: injectRegister:'auto' doesn't inject code in injectManifest mode
        // Reference: [context7:vite-pwa/vite-plugin-pwa:2026-01-09] Inline SW Registration
        injectRegister: 'inline',

        // [fix:2026-01-09] Precache offline.html for instant offline availability
        // This ensures offline.html is available when setCatchHandler needs it
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,avif,webp,txt,xml,webmanifest}'],
          globIgnores: [
            '**/og-image-old.png',
            '**/node_modules/**',
            '**/lighthouse-reports/**',
            '**/rates/**/*.json',
            '**/offline.html', // [fix:2026-01-11] Exclude offline.html to avoid duplicate (manually added in additionalManifestEntries)
          ],
          // Precache offline.html (critical for offline navigation fallback)
          additionalManifestEntries: [{ url: 'offline.html', revision: '2026010901' }],
          // [fix:2026-01-10] 使用 IIFE 格式修復 ServiceWorker script evaluation failed
          // ES 模組格式在某些瀏覽器環境中會導致評估失敗
          // Reference: [context7:/vite-pwa/vite-plugin-pwa:2026-01-10 FAQ rollupFormat]
          rollupFormat: 'iife',
          // [fix:2026-01-11] 修復 Workbox location.href undefined 問題
          // Workbox 內部使用 location.href，但在 SW 中 location 是 undefined
          // 使用 banner 在 SW 開頭注入 polyfill，確保在 Workbox 執行前定義 location
          // Reference: [Vite Issue #12611] [MDN: WorkerGlobalScope.location]
          rollupOptions: {
            output: {
              format: 'iife',
              // 在 SW 檔案開頭注入 location polyfill
              banner: `// [Workbox Polyfill] location 全域變數在 SW 中不存在，需使用 self.location
if (typeof location === 'undefined') {
  globalThis.location = self.location;
}`,
            },
          },
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
              type: 'image/png',
              form_factor: 'narrow',
              label: 'RateWise 首頁 - 即時匯率換算與趨勢圖',
            },
            {
              src: 'screenshots/mobile-converter-active.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
              label: '貨幣轉換 - 輸入金額即時顯示匯率結果',
            },
            {
              src: 'screenshots/mobile-features.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
              label: '常見問題與功能說明',
            },
            {
              src: 'screenshots/desktop-converter.png',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide',
              label: '桌面版 - 完整匯率轉換介面與趨勢圖表',
            },
            {
              src: 'screenshots/desktop-features.png',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide',
              label: '桌面版 - 關於 RateWise 與功能說明',
            },
          ],
        },
      }),
    ],
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
    // [SEO Phase 2B-2: 2025-11-25] SSR Configuration for vite-react-ssg
    // [SSR-fix:2025-11-26] Force bundling of CommonJS modules for ESM compatibility
    // 參考: [Context7:vitejs/vite:2025-11-26] SSR External Configuration
    ssr: {
      // Bundle these CommonJS modules to avoid named export issues in dev mode
      noExternal: [
        'react-helmet-async', // CommonJS module with named exports issue
        'workbox-window', // CommonJS module used in UpdatePrompt
      ],
      resolve: {
        // Use 'module' condition first to prefer ESM when available
        // Fallback to 'node' for CommonJS compatibility
        conditions: ['module', 'node', 'import'],
        externalConditions: ['module', 'node'],
      },
    },
    // [SSR-fix:2025-11-26] Pre-bundle CommonJS dependencies for dev mode
    // 參考: [Context7:vitejs/vite:2025-11-26] Dependency Optimization
    optimizeDeps: {
      // Pre-bundle these modules to ESM format during dev server startup
      include: ['react-helmet-async', 'workbox-window'],
      esbuildOptions: {
        // Prefer ESM over CommonJS when resolving packages
        mainFields: ['module', 'main'],
      },
    },
    // [SEO Phase 2B-2: 2025-11-25] Vite React SSG Configuration
    // 參考: [Context7:daydreamer-riri/vite-react-ssg:2025-11-25]
    // 預渲染策略：渲染首頁、FAQ、About、Guide + 13 個幣別落地頁
    // [SEO Update: 2025-12-02] 同步 routes.tsx 的 getIncludedRoutes 配置
    // [refactor:2025-12-14] 使用集中式 SEO 路徑配置，避免多處維護
    ssgOptions: {
      script: 'async', // 非阻塞腳本載入
      formatting: 'beautify', // 美化 HTML 便於 debug
      dirStyle: 'nested', // 巢狀目錄結構（/faq/index.html）
      concurrency: 10, // 最大並行渲染數
      // 指定預渲染路徑（從 SSOT 導入）
      async includedRoutes(paths) {
        // 從 TypeScript SSOT 動態引入 SEO 路徑配置
        const { getIncludedRoutes } = await import('./src/config/seo-paths');
        const includedPaths = getIncludedRoutes(paths);
        console.log('🔍 Available paths:', paths);
        console.log('✅ Including paths:', includedPaths);
        return includedPaths;
      },
      // 預渲染前處理 HTML
      async onBeforePageRender(route, indexHTML) {
        console.log(`🔄 Pre-rendering: ${route}`);
        return indexHTML;
      },
      // 預渲染完成後處理
      async onFinished(dir) {
        console.log(`🎉 SSG build completed in: ${dir}`);
      },
    },
  };
});
