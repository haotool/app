/**
 * PWA 配置模組
 *
 * @description
 * Progressive Web App 配置，包含 Service Worker、Workbox、Runtime Caching 策略
 *
 * @author Linus-style refactoring [2025-11-10]
 * @reference [context7:googlechrome/workbox:2025-11-08]
 * @reference [context7:vite-pwa/vite-plugin-pwa:2025-11-06]
 */

import type { VitePWAOptions } from 'vite-plugin-pwa';

/**
 * 生成 PWA Manifest 配置
 * @param base - Vite base 路徑
 * @param version - 應用版本號
 */
export function generatePWAManifest(base: string, _version: string) {
  const manifestScope = base.endsWith('/') ? base : `${base}/`;
  const manifestStartUrl = manifestScope;

  return {
    name: 'RateWise - 匯率換算器',
    short_name: 'RateWise',
    description: '現代化的即時匯率換算工具，支援單幣別與多幣別轉換',
    theme_color: '#1e40af',
    background_color: '#ffffff',
    display: 'standalone' as const,
    scope: manifestScope,
    start_url: manifestStartUrl,
    id: manifestStartUrl,
    orientation: 'portrait' as const,
    categories: ['finance', 'utilities'],
    lang: 'zh-TW',
    dir: 'ltr' as const,
    icons: [
      {
        src: `${base}pwa-64x64.png`,
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: `${base}pwa-192x192.png`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: `${base}pwa-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${base}maskable-icon-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

/**
 * 生成 PWA 插件配置
 * @param base - Vite base 路徑
 * @param version - 應用版本號
 */
export function generatePWAConfig(base: string, version: string): Partial<VitePWAOptions> {
  return {
    base,
    // [fix:2025-11-06] 臨時使用 autoUpdate 強制清理舊 SW（含 navigationPreload 的版本）
    // 修復完成後可改回 'prompt' 模式
    registerType: 'autoUpdate',
    injectRegister: 'auto',

    manifest: generatePWAManifest(base, version),

    workbox: {
      // [fix:2025-11-06] 包含 HTML 文件到預快取清單
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,avif,webp}'],

      // [fix:2025-11-07] 排除不存在或臨時文件
      globIgnores: [
        '**/og-image-old.png',
        '**/node_modules/**',
        '**/lighthouse-reports/**',
        '**/rates/**/*.json', // 匯率數據不預快取，使用 runtime caching
      ],

      // [fix:2025-11-07] 忽略 URL 參數，提升快取命中率
      ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],

      // [fix:2025-11-06] 強制自動更新（清理舊 SW）
      clientsClaim: true,
      skipWaiting: true,

      // [fix:2025-11-05] 強制清理舊快取
      cleanupOutdatedCaches: true,

      // [fix:2025-11-06] 禁用導航預載入（避免 preloadResponse 警告）
      navigationPreload: false,

      // Runtime Caching 策略
      runtimeCaching: [
        {
          // HTML 文件：Network First 策略
          urlPattern: /\.html$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'html-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24, // 1 天
            },
            networkTimeoutSeconds: 5,
          },
        },
        {
          // 歷史匯率 CDN：Cache First（數據 immutable）
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
          // 歷史匯率 Raw fallback
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
          // 最新匯率：Stale-While-Revalidate
          urlPattern:
            /^https:\/\/cdn\.jsdelivr\.net\/gh\/haotool\/app@data\/public\/rates\/latest\.json$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'latest-rates',
            expiration: {
              maxEntries: 5,
              maxAgeSeconds: 60 * 30, // 30 分鐘
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          // 圖片：Cache First
          urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'image-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
            },
          },
        },
        {
          // 字體：Cache First
          urlPattern: /\.(woff|woff2|ttf|eot|otf)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'font-cache',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 年
            },
          },
        },
        {
          // JS/CSS：Stale-While-Revalidate
          urlPattern: /\.(js|css)$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-resources',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 7 天
            },
          },
        },
      ],
    },
  };
}


