import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolveBuildCommitSha } from '../../scripts/lib/build-commit-sha.mjs';
import { seoHtmlPlugin } from './src/seo/vite-seo-plugin';
import { ASSETS } from './src/game/core/assets';

// lazy 資產不進 PWA precache（v21-v30 未接關素材）：避免既有玩家背景更新被迫
// 下載玩不到的內容；離線補償由 starpuff-sprites 的 CacheFirst runtime 快取承接。
// 由 manifest 的 phase 單點派生——接關改回正確 phase 後自動退出排除清單。
const lazyPrecacheIgnores = ASSETS.filter((entry) => entry.phase === 'lazy').map(
  (entry) => `**/assets/${entry.key}-*.webp`,
);

// 版本 SSOT（§42/§99 F-02/§109 F-08）：package.json version + short git SHA，經 define 嵌入。
// SHA 來源鏈收斂於 scripts/lib/build-commit-sha.mjs（跨 app 共用），皆不可得時省略後綴。
function resolveAppVersion(): string {
  const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
    version: string;
  };
  const sha = resolveBuildCommitSha();
  return sha ? `v${pkg.version}+${sha}` : `v${pkg.version}`;
}

export default defineConfig(async ({ mode }) => {
  // basePath SSOT：app.config.mjs（動態 import，鏡像 quake-school includedRoutes 模式）。
  const { APP_CONFIG, SITE_CONFIG } = await import('./app.config.mjs');
  const base =
    mode === 'production' || process.env['CI']
      ? APP_CONFIG.basePath.production
      : APP_CONFIG.basePath.development;
  const manifestScope = base;

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(resolveAppVersion()),
    },
    server: {
      // SP_DEV_PORT：並行 worktree 本地驗證用埠覆寫（預設 3007，CI 不受影響）。
      port: Number(process.env['SP_DEV_PORT'] || 3007),
      strictPort: true,
      host: '0.0.0.0',
    },
    preview: {
      port: 4179,
      strictPort: true,
    },
    plugins: [
      seoHtmlPlugin(),
      VitePWA({
        base,
        // prompt 型（v19 #819 卡 8，repo 標準模式）：autoUpdate 的 skipWaiting 立即
        // 接管會在遊戲中吃掉進行中關卡並有版本撕裂風險；套用時機由 pwaUpdateGate 把關。
        registerType: 'prompt',
        injectRegister: 'auto',
        workbox: {
          // 分階段載入（§115）：延遲載入的立繪仍全數進 precache，離線可玩不打折。
          globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
          globIgnores: ['**/node_modules/**', ...lazyPrecacheIgnores],
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          runtimeCaching: [
            {
              // precache 尚未完成即斷線的補償控制：延遲載入的立繪首次取得就落快取。
              // 只收 Vite 產出的內容雜湊立繪（assets/*.webp）——雜湊 URL 下 CacheFirst 不會
              // 造成版本撕裂；未雜湊的 icons/*.png 一律留給 precache revision 管理，
              // 不讓兩套機制靠路由順序決勝負。
              urlPattern: /\/assets\/[^/]+\.webp$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'starpuff-sprites',
                expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        manifest: {
          id: manifestScope,
          // 品牌與文案 SSOT：app.config.mjs SITE_CONFIG，禁止在此硬編。
          name: SITE_CONFIG.name,
          short_name: SITE_CONFIG.shortName,
          description: SITE_CONFIG.description,
          theme_color: '#BFF3E0',
          background_color: '#FDEFF6',
          display: 'standalone',
          // v4 免轉向（§28）：旋轉殼自適應 portrait/landscape，移除 orientation 鎖。
          scope: manifestScope,
          start_url: manifestScope,
          lang: 'zh-TW',
          categories: ['games', 'entertainment'],
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-192-maskable.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
  };
});
