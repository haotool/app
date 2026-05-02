import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import { imagetools } from 'vite-imagetools';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import dns from 'node:dns';
import { getVersionFromCommitCount as formatVersionFromCommitCount } from './src/utils/version-build-utils';
import { APP_INFO } from './src/config/app-info';

// Node.js v17+ DNS 解析一致性修正
dns.setDefaultResultOrder('verbatim');

const __dirname = dirname(fileURLToPath(import.meta.url));

const ROUTER_ECOSYSTEM_PACKAGES = ['react-router', '@remix-run/router', 'vite-react-ssg'];

/** 計算檔案內容 hash（PWA 預快取版本控制，僅允許 public/ 目錄） */
function getFileRevision(filePath: string): string {
  // 安全性驗證：僅允許 public/ 目錄下的檔案
  if (!filePath.startsWith('public/') || filePath.includes('..')) {
    throw new Error(`Invalid file path: ${filePath}`);
  }

  try {
    const absolutePath = resolve(__dirname, filePath);
    // 確保解析後的路徑仍在專案目錄內
    if (!absolutePath.startsWith(__dirname)) {
      throw new Error(`Path traversal detected: ${filePath}`);
    }
    const content = readFileSync(absolutePath, 'utf-8');
    // 使用 SHA-256 並取前 12 字元（48 位），降低碰撞風險
    return createHash('sha256').update(content).digest('hex').slice(0, 12);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      throw error;
    }
    // fallback: 使用時間戳
    return Date.now().toString(36);
  }
}

/** 讀取 package.json 版本號 */
function readPackageVersion(): string {
  const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
  return packageJson.version;
}

function parseSemver(version: string): [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) {
    return null;
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareSemver(left: string, right: string): number {
  const leftSemver = parseSemver(left);
  const rightSemver = parseSemver(right);

  if (!leftSemver || !rightSemver) {
    return left.localeCompare(right, undefined, { numeric: true });
  }

  for (let index = 0; index < leftSemver.length; index += 1) {
    const delta = leftSemver[index] - rightSemver[index];
    if (delta !== 0) {
      return delta;
    }
  }

  return 0;
}

/** 從 Git 標籤取得版本號（僅附加 build metadata，不覆寫 package.json semver） */
function getVersionFromGitTag(baseVersion: string): string | null {
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

    // package.json 是版本 SSOT；舊 tag 不得覆蓋較新的 semver。
    if (tagVersion !== baseVersion) {
      return null;
    }

    return Number(distance) === 0 ? tagVersion : `${baseVersion}+build.${distance}`;
  } catch {
    return null;
  }
}

/** 使用 Git commit 數生成版本號（附加於 package.json semver） */
export function getVersionFromCommitCount(baseVersion: string): string | null {
  try {
    // 優先使用 Docker build args 傳入的環境變數
    const rawCommitCount =
      process.env.GIT_COMMIT_COUNT ??
      execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
    return formatVersionFromCommitCount(baseVersion, rawCommitCount);
  } catch {
    return null;
  }
}

/** 開發環境版本號（附加 Git SHA + dirty 標記） */
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

/** 生成版本號 - package.json semver 為 SSOT，Git 僅提供 build metadata */
function generateVersion(): string {
  const baseVersion = readPackageVersion();

  // 開發環境：附加 Git metadata
  if (!process.env.CI && process.env.NODE_ENV !== 'production') {
    return getDevelopmentVersion(baseVersion);
  }

  const versionFromGitTag = getVersionFromGitTag(baseVersion);
  if (versionFromGitTag) {
    console.log(`✅ Generated version: ${versionFromGitTag}`);
    return versionFromGitTag;
  }

  const versionFromCommitCount = getVersionFromCommitCount(baseVersion);
  const version =
    versionFromCommitCount && compareSemver(versionFromCommitCount, baseVersion) >= 0
      ? versionFromCommitCount
      : baseVersion;

  // 版本號有效性驗證
  if (!version || version.length < 5) {
    console.warn(
      `⚠️ Generated version is invalid: "${version}", using baseVersion: ${baseVersion}`,
    );
    return baseVersion;
  }

  console.log(`✅ Generated version: ${version}`);
  return version;
}

/** 確保 URL 尾斜線（SSG 預渲染需求） */
const normalizeSiteUrl = (value: string): string => {
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

// Vite 設定（函數形式以支援多環境）
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // 自動生成版本號（語義化版本 + git metadata）
  const appVersion = generateVersion();
  const buildTime = new Date().toISOString();
  const pwaRecoveryBootstrap = readFileSync(
    resolve(__dirname, 'src/bootstrap/pwa-recovery-bootstrap.js'),
    'utf-8',
  ).trim();

  // Base path：透過 VITE_RATEWISE_BASE_PATH 控制，預設 /ratewise/
  const rawEnvValue = process.env['VITE_RATEWISE_BASE_PATH'] || env.VITE_RATEWISE_BASE_PATH || '';
  const isValidPath = rawEnvValue.startsWith('/') && !rawEnvValue.includes(' ');
  const base = isValidPath ? rawEnvValue : '/ratewise/';

  // eslint-disable-next-line no-console
  console.log(`[vite.config.ts] Base path: ${base} (raw: "${rawEnvValue}", valid: ${isValidPath})`);

  return {
    base,
    server: {
      port: 3001,
      strictPort: true,
      open: true,
    },
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
      // 確保 react 與 jsx-runtime 使用單一實例，避免 CJS factory 被 rolldown
      // 置入不同 chunk（vendor-motion / vendor-dnd）造成初始 LCP 阻塞。
      dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
      alias: {
        // React 19 shim: react-is AsyncMode 相容性
        'react-is': resolve(__dirname, './src/utils/react-is-shim.ts'),
        'react-helmet-async': resolve(__dirname, './src/utils/react-helmet-async-shim.tsx'),
        '@app/ratewise': resolve(__dirname, './src'),
        '@shared': resolve(__dirname, '../shared'),
      },
    },
    plugins: [
      react(),
      // 圖片優化（自動生成 avif/webp/png 多格式）
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
      // 版本號、品牌與 base path 佔位符注入 HTML
      // __BASE_PATH__ 由此處以 vite config 的 base（SSOT: VITE_RATEWISE_BASE_PATH）替換，
      // 支援 production（/ratewise/）與 CI E2E/Lighthouse（/）雙部署情境。
      {
        name: 'inject-version-meta',
        transformIndexHtml(html) {
          return html
            .replace('<!-- PWA Recovery Bootstrap -->', `<script>${pwaRecoveryBootstrap}</script>`)
            .replace(/__APP_VERSION__/g, appVersion)
            .replace(/__BUILD_TIME__/g, buildTime)
            .replace(/__BRAND_FULL__/g, APP_INFO.name)
            .replace(/__BRAND_SHORT__/g, APP_INFO.shortName)
            .replace(/__BASE_PATH__/g, base);
        },
      },
      // Brotli 壓縮
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
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        // prompt：讓新 SW 完成安裝後先進入 waiting，再由 client 端於安全時機啟用。
        // 這可避免舊 HTML 與新 precache chunk 發生版本撕裂，造成冷啟動黑屏。
        registerType: 'prompt',
        injectRegister: 'inline',

        injectManifest: {
          // 避免 brace expansion 相依異常導致 glob 全數失效，明確列出副檔名。
          // 含 json 以預快取 React Router data manifest（離線 SPA 導覽必要）。
          globPatterns: [
            '**/*.js',
            '**/*.css',
            '**/*.html',
            '**/*.ico',
            '**/*.png',
            '**/*.svg',
            '**/*.avif',
            '**/*.webp',
            '**/*.json',
          ],
          globIgnores: [
            '**/og-image-old.png',
            '**/node_modules/**',
            '**/lighthouse-reports/**',
            '**/rates/**/*.json',
            '**/offline.html',
            '**/sitemap.xml',
            '**/robots.txt',
            '**/llms.txt',
            '**/manifest.webmanifest',
          ],
          additionalManifestEntries: [
            { url: 'offline.html', revision: getFileRevision('public/offline.html') },
          ],
          rollupFormat: 'iife',
          // SW 中 location 全域變數 polyfill（Workbox 相容性）
          rollupOptions: {
            output: {
              format: 'iife',
              banner: `if (typeof location === 'undefined') { globalThis.location = self.location; }`,
            },
          },
        },

        devOptions: { enabled: false, type: 'module' },
        // manifest.webmanifest 由 prebuild 的 generate-manifest.mjs 作為唯一 SSOT 產出。
        // 避免 vite-plugin-pwa 再生成第二份 manifest，造成品牌名稱與描述被舊設定覆蓋。
        // injectRegister 亦停用 plugin 的 <link rel="manifest"> 注入；index.html 手動維持該連結。
        manifest: false,
      }),
    ],
    build: {
      target: 'es2020',
      sourcemap: 'hidden',
      rolldownOptions: {
        output: {
          minify: {
            compress: {
              dropConsole: true,
              dropDebugger: true,
              unused: true,
            },
            mangle: {
              keepNames: {
                class: true,
                function: true,
              },
            },
            codegen: {
              removeWhitespace: true,
            },
          },
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;

            // jsx-runtime CJS factory 必須在 vendor-commons（初始 bundle），
            // 避免 rolldown 將 factory 置入 vendor-motion（首個使用者），
            // 導致 app chunk 靜態依賴 vendor-motion 拖慢首次 LCP。
            if (
              id.includes('/node_modules/react/jsx-runtime') ||
              id.includes('/node_modules/react/cjs/react-jsx-runtime')
            ) {
              return 'vendor-commons';
            }

            // react-dom 主命名空間 CJS factory 必須在 vendor-commons，
            // 避免 rolldown 將 factory 置入 vendor-dnd（@hello-pangea/dnd 首個匯入），
            // 導致 vendor-router-runtime 靜態依賴 vendor-dnd 拖慢首次 LCP。
            if (
              id.includes('/node_modules/react-dom/') &&
              !id.includes('react-dom-client') &&
              !id.includes('/react-dom/client.')
            ) {
              return 'vendor-commons';
            }

            // Observability（錯誤追蹤）
            if (id.includes('@sentry/core')) {
              return 'vendor-sentry-core';
            }
            if (id.includes('@sentry/browser') || id.includes('@sentry-internal/browser-utils')) {
              return 'vendor-sentry-browser';
            }
            if (id.includes('@sentry/react')) {
              return 'vendor-sentry-react';
            }
            if (
              id.includes('@sentry-internal/replay') ||
              id.includes('@sentry-internal/feedback') ||
              id.includes('@sentry-internal/replay-canvas')
            ) {
              return 'vendor-sentry-replay';
            }

            // i18n（語系偵測與翻譯 runtime）
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n';
            }

            // Interaction / state / icons（中型互動依賴）
            if (id.includes('@hello-pangea/dnd')) {
              return 'vendor-dnd';
            }
            if (id.includes('zustand') || id.includes('use-sync-external-store')) {
              return 'vendor-state';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }

            // React 核心生態系統（基礎依賴）- 精確比對套件路徑，避免 lucide-react / @sentry/react 誤分。
            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }

            // Router（路由系統）
            // 將 react-router、底層 @remix-run/router 與 vite-react-ssg 維持在同一個 chunk，
            // 避免 router runtime 與 SSG runtime 互相跨 chunk 引用造成循環依賴警告。
            if (ROUTER_ECOSYSTEM_PACKAGES.some((pkg) => id.includes(pkg))) {
              return 'vendor-router-runtime';
            }

            // Charts（重量級視覺化庫）
            if (id.includes('lightweight-charts')) {
              return 'vendor-charts';
            }

            // Animation（重量級動畫庫）
            if (id.includes('motion') || id.includes('framer-motion')) {
              return 'vendor-motion';
            }

            // 其他 vendor 依賴統一打包
            return 'vendor-commons';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true,
      minify: 'oxc',
    },
    // SSR 設定 - CommonJS 模組打包（ESM 相容）
    ssr: {
      noExternal: ['workbox-window'],
      resolve: {
        conditions: ['module', 'node', 'import'],
        externalConditions: ['module', 'node'],
      },
    },
    // 依賴預打包（CommonJS → ESM）
    optimizeDeps: {
      include: ['workbox-window'],
      rolldownOptions: {
        resolve: {
          mainFields: ['module', 'main'],
        },
      },
    },
    // SSG 預渲染（路徑從 SSOT 導入）
    ssgOptions: {
      script: 'async',
      formatting: 'beautify',
      dirStyle: 'nested',
      // vite-react-ssg + Beasties may read freshly rendered nested amount pages during
      // writeout. Serial rendering avoids intermittent ENOENT on CI/pre-push.
      concurrency: 1,
      async includedRoutes(paths) {
        // 從 TypeScript SSOT 動態引入 SEO 路徑配置
        const { PRERENDER_PATHS, SEO_PATHS, LEGAL_SSG_PATHS, APP_ONLY_PRERENDER_PATHS } =
          await import('./src/config/seo-paths');

        console.log('🔍 Available paths from routes:', paths.slice(0, 5));
        console.log(
          `✅ Total prerender paths: ${PRERENDER_PATHS.length} (SEO: ${SEO_PATHS.length}, Legal: ${LEGAL_SSG_PATHS.length}, AppOnly: ${APP_ONLY_PRERENDER_PATHS.length})`,
        );

        return PRERENDER_PATHS;
      },
      // 預渲染前處理 HTML：金額路由注入換算結果
      async onBeforePageRender(route, indexHTML) {
        // 檢查是否為金額路由（例如：/usd-twd/500/）
        const amountRouteMatch = route.match(/\/([a-z]{3})-([a-z]{3})\/(\d+(?:\.\d+)?)\/$/i);
        if (amountRouteMatch) {
          console.log(`✏️ Pre-rendering amount route: ${route}`);
        }
        if (!amountRouteMatch) return indexHTML;

        const [, fromCode, toCode, amountStr] = amountRouteMatch;
        const amount = parseFloat(amountStr);

        // 讀取預生成的匯率數據
        let rates: Record<string, any> = {};
        try {
          const ratesPath = resolve(__dirname, 'public/rates.json');
          const ratesJson = readFileSync(ratesPath, 'utf-8');
          rates = JSON.parse(ratesJson);
        } catch (error) {
          console.warn(`⚠️ 無法讀取 rates.json：${error}`);
          return indexHTML;
        }

        // 判断方向：twd-xxx 为反向（出国），xxx-twd 为正向（进口）
        const isTwdToForeign = fromCode.toUpperCase() === 'TWD';
        // 始终获取外币的 cashSell（rates 中存储的是外币对 TWD 的价格）
        const targetCode = isTwdToForeign ? toCode.toUpperCase() : fromCode.toUpperCase();
        const cashSell = rates.details?.[targetCode]?.cash?.sell;

        if (!cashSell || cashSell <= 0) {
          console.warn(`⚠️ 無效匯率：${targetCode} cashSell=${cashSell}`);
          return indexHTML;
        }

        // 計算換算結果
        const result = isTwdToForeign
          ? Math.round((amount / cashSell) * 100) / 100
          : Math.round(amount * cashSell);

        // 在 </head> 前注入轉換結果為 window 變數（供 JS 讀取）
        const injectionScript = `<script type="application/json" id="ssg-amount-result">{"amount":${amount},"result":${result},"fromCode":"${fromCode.toUpperCase()}","toCode":"${toCode.toUpperCase()}","cashSell":${cashSell}}</script>`;
        const modifiedHtml = indexHTML.replace('</head>', `${injectionScript}</head>`);
        console.log(`✅ Injected amount data: ${fromCode}-${toCode} ${amount} → ${result}`);

        return modifiedHtml;
      },
      // 預渲染完成後處理
      async onFinished(dir) {
        console.log(`🎉 SSG build completed in: ${dir}`);
      },
    },
  };
});
