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
import { createHash } from 'node:crypto';
import dns from 'node:dns';
import { getVersionFromCommitCount as formatVersionFromCommitCount } from './src/utils/version-build-utils';

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

  // PWA manifest 路徑（scope/start_url/id 皆需尾斜線）
  const manifestScope = base.endsWith('/') ? base : `${base}/`;
  const manifestStartUrl = manifestScope; // 與 scope 一致

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
      // 版本號注入 HTML meta 標籤
      {
        name: 'inject-version-meta',
        transformIndexHtml(html) {
          return html
            .replace('<!-- PWA Recovery Bootstrap -->', `<script>${pwaRecoveryBootstrap}</script>`)
            .replace(/__APP_VERSION__/g, appVersion)
            .replace(/__BUILD_TIME__/g, buildTime);
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
        // prompt：新 SW 等待使用者確認後才接管，避免 skipWaiting 版本撕裂導致 "Load failed"
        // UpdatePrompt 元件的 needRefresh 回調在此模式下正確觸發
        registerType: 'prompt',
        injectRegister: 'inline',

        injectManifest: {
          // 含 json 以預快取 React Router data manifest（離線 SPA 導覽必要）
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,avif,webp,json}'],
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
        manifest: {
          name: 'RateWise - 即時匯率轉換器',
          short_name: 'RateWise',
          description:
            'RateWise 提供即時匯率換算服務，參考臺灣銀行牌告匯率，支援 TWD、USD、JPY、EUR、GBP 等 30+ 種貨幣。快速、準確、離線可用的 PWA 匯率工具。',
          theme_color: '#8B5CF6',
          background_color: '#E8ECF4',
          display: 'standalone',
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
      target: 'es2020',
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;

            // React 核心生態系統（基礎依賴）- 包含 scheduler 避免模組分裂
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('scheduler/')) {
              return 'vendor-react';
            }

            // Router（路由系統）
            // 將 react-router、底層 @remix-run/router 與 vite-react-ssg 維持在同一個 chunk，
            // 避免 router runtime 與 SSG runtime 互相跨 chunk 引用造成循環依賴警告。
            if (ROUTER_ECOSYSTEM_PACKAGES.some((pkg) => id.includes(pkg))) {
              return 'vendor-router';
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
          sourcemapFileNames: 'assets/[name]-[hash].js.map',
        },
      },
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // 生產環境移除 console
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug', 'console.info', 'console.warn'],
          passes: 3, // 增加壓縮次數以獲得更好的結果
          dead_code: true,
          unused: true,
        },
        format: {
          comments: false, // 強制移除所有註解
        },
        mangle: {
          safari10: true,
        },
        sourceMap: true,
      },
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
      esbuildOptions: { mainFields: ['module', 'main'] },
    },
    // SSG 預渲染（路徑從 SSOT 導入）
    ssgOptions: {
      script: 'async',
      formatting: 'beautify',
      dirStyle: 'nested',
      concurrency: 10,
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
