import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { seoHtmlPlugin } from './src/seo/vite-seo-plugin';

// 版本 SSOT（§42）：package.json version + short git SHA，經 define 嵌入 bundle。
function resolveAppVersion(): string {
  const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
    version: string;
  };
  let sha = 'nogit';
  try {
    sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    /* 無 git 環境（如 CI 淺層打包）時保留 nogit 標記。 */
  }
  return `v${pkg.version}+${sha}`;
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
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
          globIgnores: ['**/node_modules/**'],
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        manifest: {
          id: manifestScope,
          // 品牌與文案 SSOT：app.config.mjs SITE_CONFIG，禁止在此硬編。
          name: SITE_CONFIG.name,
          short_name: 'StarPuff',
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
