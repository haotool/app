/**
 * 建置選項配置模組
 *
 * @description
 * Rollup build options，包含 chunk splitting、terser 壓縮配置
 *
 * @author Linus-style refactoring [2025-11-10]
 * @reference [context7:vitejs/vite:2025-10-21]
 * @reference [context7:rollup/rollup:2025-10-21]
 */

import type { BuildOptions } from 'vite';

/**
 * 生成建置選項配置
 * @returns Vite BuildOptions
 */
export function generateBuildOptions(): BuildOptions {
  return {
    target: 'es2020',
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
    // [Lighthouse-optimization:2025-10-27] 提升警告門檻
    chunkSizeWarningLimit: 500,
    // CSS code splitting
    cssCodeSplit: true,
    // [Lighthouse-optimization:2025-10-27] Terser 壓縮配置
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
      format: {
        comments: false, // 移除註解
      },
      sourceMap: true, // Terser 保留 source map
    },
  };
}
