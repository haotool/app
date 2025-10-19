import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 最簡配置 - 參考 Context7 官方範例
// 參考 Context7 官方範例: vite-pwa/vite-plugin-pwa/docs/guide/service-worker-precache.md
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: 'RateWise - 即時匯率轉換器',
        short_name: 'RateWise',
        description: '快速、準確的即時匯率轉換工具',
        theme_color: '#8B5CF6',
        background_color: '#E8ECF4',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
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
    sourcemap: true, // 生成 source maps 以通過 Lighthouse 檢查和便於除錯
    rollupOptions: {
      output: {
        // 動態 chunk splitting 以減少未使用的 JavaScript
        // [context7:googlechrome/lighthouse-ci:2025-10-20T04:10:04+08:00]
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
        },
        // 優化 chunk 檔名
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
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
    },
  },
});
