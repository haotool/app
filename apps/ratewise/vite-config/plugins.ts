/**
 * Vite 插件配置模組
 *
 * @description
 * 所有 Vite 插件的組合配置
 *
 * @author Linus-style refactoring [2025-11-10]
 * @reference [context7:vitejs/vite:2025-10-21]
 */

import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import { imagetools } from 'vite-imagetools';
import type { PluginOption } from 'vite';
import { generatePWAConfig } from './pwa-config.js';

/**
 * 自定義 plugin：將版本號注入到 HTML meta 標籤
 */
function injectVersionMeta(appVersion: string, buildTime: string): PluginOption {
  return {
    name: 'inject-version-meta',
    transformIndexHtml(html) {
      return html.replace(/__APP_VERSION__/g, appVersion).replace(/__BUILD_TIME__/g, buildTime);
    },
  };
}

/**
 * 圖片優化 plugin 配置
 * @reference https://github.com/JonasKruckenberg/imagetools
 */
function getImagetoolsPlugin(): PluginOption {
  // @ts-expect-error - imagetools plugin type incompatibility with Vite 7
  return imagetools({
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
  });
}

/**
 * 壓縮 plugins（Brotli + Gzip）
 * @reference https://web.dev/articles/reduce-network-payloads-using-text-compression
 */
function getCompressionPlugins(): PluginOption[] {
  return [
    // Brotli compression (saves 4,024 KiB)
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
  ];
}

/**
 * Bundle analyzer plugin（條件啟用）
 */
function getVisualizerPlugin(): PluginOption | null {
  if (!process.env['ANALYZE']) {
    return null;
  }
  return visualizer({
    open: true,
    gzipSize: true,
    brotliSize: true,
    filename: 'lighthouse-reports/bundle-stats.html',
  });
}

/**
 * 生成所有 Vite plugins
 * @param base - Vite base 路徑
 * @param appVersion - 應用版本號
 * @param buildTime - 建置時間
 */
export function generatePlugins(
  base: string,
  appVersion: string,
  buildTime: string,
): PluginOption[] {
  return [
    react(),
    getImagetoolsPlugin(),
    injectVersionMeta(appVersion, buildTime),
    ...getCompressionPlugins(),
    getVisualizerPlugin(),
    VitePWA(generatePWAConfig(base, appVersion)),
  ].filter((plugin): plugin is PluginOption => plugin !== null);
}


