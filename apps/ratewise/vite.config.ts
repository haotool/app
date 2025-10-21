import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 最簡配置 - 參考 Context7 官方範例
// [context7:vitejs/vite:2025-10-21T03:15:00+08:00]
// 使用函數形式確保 define 在所有模式下都能正確工作
export default defineConfig(() => {
  // 讀取 package.json 版本號
  const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
  const appVersion = packageJson.version;
  const buildTime = new Date().toISOString();

  return {
    base: '/ratewise/',
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __BUILD_TIME__: JSON.stringify(buildTime),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    },
    plugins: [
      react(),
      VitePWA({
        base: '/ratewise/',
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
          // 添加運行時緩存策略
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'jsdelivr-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        manifest: {
          name: 'RateWise - 即時匯率轉換器',
          short_name: 'RateWise',
          description: '快速、準確的即時匯率轉換工具',
          theme_color: '#8B5CF6',
          background_color: '#E8ECF4',
          display: 'standalone',
          // 修正 scope 和 start_url 以適配部署路徑
          scope: '/ratewise/',
          start_url: '/ratewise/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
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
      // 生成 hidden source maps - 不在生產環境暴露，但可用於錯誤追蹤服務
      // [context7:googlechrome/lighthouse-ci:2025-10-20T04:10:04+08:00]
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          // 動態 chunk splitting 以減少未使用的 JavaScript
          manualChunks(id) {
            // 將 node_modules 中的套件分離成 vendor chunks
            if (id.includes('node_modules')) {
              // React 核心庫單獨打包
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              // React Helmet 單獨打包（SEO相關，可延遲載入）
              if (id.includes('react-helmet-async')) {
                return 'vendor-helmet';
              }
              // 其他第三方庫
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
