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
 * 策略: 使用 git commit count 確保每次提交後版本自動遞增
 * 格式: 1.0.{commit_count}
 */
function generateVersion(): string {
  try {
    // 獲取 git commit 總數
    const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
    return `1.0.${commitCount}`;
  } catch {
    // Git 不可用時，使用 package.json 的版本號
    const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
    return packageJson.version;
  }
}

// 最簡配置 - 參考 Context7 官方範例
// [context7:vitejs/vite:2025-10-21T03:15:00+08:00]
// 使用函數形式確保 define 在所有模式下都能正確工作
export default defineConfig(() => {
  // 自動生成版本號（基於 git commit count）
  const appVersion = generateVersion();
  const buildTime = new Date().toISOString();

  // 最簡配置：使用環境變數，消除所有特殊情況
  // [fix:2025-10-27] 遵循 Linus 原則 - "好品味"：消除條件判斷
  // CI 環境: VITE_BASE_PATH='/' (Lighthouse/E2E)
  // 生產環境: VITE_BASE_PATH='/ratewise/' (Zeabur)
  const base = process.env['VITE_BASE_PATH'] || '/';

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __BUILD_TIME__: JSON.stringify(buildTime),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    },
    plugins: [
      react(),
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
        // 使用 prompt 模式以支援自定義更新 UI
        registerType: 'prompt',
        injectRegister: null, // 手動註冊
        // 開發環境配置 - 修復 MIME type 錯誤
        // [context7:vite-pwa-org.netlify.app:2025-10-21T18:00:00+08:00]
        devOptions: {
          enabled: true, // 開發模式下啟用 mock SW
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          // 使用 prompt 模式時，不自動 skipWaiting
          clientsClaim: false,
          skipWaiting: false,
          // 運行時緩存策略
          // 注意：匯率數據改用 GitHub raw (無 CDN 快取)，確保數據即時性
          // jsdelivr CDN 快取可達 12-24 小時，不適合即時匯率數據
          runtimeCaching: [],
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
          // scope 和 start_url 根據 mode 動態設定
          scope: base,
          start_url: base,
          id: base,
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
