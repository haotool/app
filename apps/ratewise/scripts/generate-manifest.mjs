import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_INFO, APP_MANIFEST } from '../src/config/app-info.ts';
import { UPDATE_FREQUENCY_PHRASE } from '../src/config/data-freshness.ts';
import { STYLE_DEFINITIONS } from '../src/config/themes.ts';

// manifest 為靜態單一色，取預設 zen 主題的主色/背景作 SSOT，避免硬編 hex 漂移
const zenColors = STYLE_DEFINITIONS.zen.colors;

function rgbTripletToHex(rgbTriplet) {
  return `#${rgbTriplet
    .trim()
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));

// 用 semver 版本號做 cache-busting（只在 pnpm changeset:version 後才改變）
// 注意：commit hash 會造成自引用問題（committed 檔案每次 build 都落後一個 commit）
const VERSION_TOKEN = pkg.version;

const constantsPath = resolve(ROOT, 'src/features/ratewise/constants.ts');
const constantsContent = readFileSync(constantsPath, 'utf-8');
const currencyCount = [...constantsContent.matchAll(/^\s+([A-Z]{3}):\s*\{/gm)].length;

const versioned = (path) => `${path}?v=${VERSION_TOKEN}`;

// scope/start_url 以 VITE_SITE_URL 環境變數驅動（與 seo-metadata canonical 同一 SSOT），
// 未設定時回退正式站 APP_INFO.siteUrl；staging 等替代網域部署設定該變數即可，禁止硬編網域。
// 正規化行為對齊 seo-paths.ts 的 normalizeSiteUrl（trim＋補尾斜線）；無法直接 import 複用：
// seo-paths.ts 內部以無副檔名路徑 import './app-info'，Node Type Stripping 不解析副檔名。
function normalizeSiteUrl(value) {
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}
const siteUrl = normalizeSiteUrl(process.env.VITE_SITE_URL || APP_INFO.siteUrl);

const manifest = {
  name: APP_INFO.name,
  short_name: APP_MANIFEST.shortName,
  description: `${APP_INFO.name}顯示臺灣銀行牌告實際買賣價（非中間價），支援 ${currencyCount} 種貨幣換算，${UPDATE_FREQUENCY_PHRASE}，離線可用的 PWA 匯率工具。`,
  theme_color: rgbTripletToHex(zenColors.primary),
  background_color: rgbTripletToHex(zenColors.background),
  display: 'standalone',
  // 絕對 HTTPS scope/start_url：避免獨立 PWA partition + Chrome HTTPS-First 在啟動時以 http 語意解析。
  // id 維持相對（id 變更會被視為新 PWA 身分，破壞既有安裝更新連續性）。
  scope: siteUrl,
  start_url: siteUrl,
  id: '/ratewise/',
  orientation: 'portrait-primary',
  categories: ['finance', 'utilities', 'productivity'],
  icons: [
    {
      src: versioned('icons/haorate-icon-192x192.png'),
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: versioned('icons/haorate-icon-256x256.png'),
      sizes: '256x256',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: versioned('icons/haorate-icon-384x384.png'),
      sizes: '384x384',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: versioned('icons/haorate-icon-512x512.png'),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: versioned('icons/haorate-icon-1024x1024.png'),
      sizes: '1024x1024',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: versioned('icons/haorate-icon-maskable-512x512.png'),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable',
    },
    {
      src: versioned('icons/haorate-icon-maskable-1024x1024.png'),
      sizes: '1024x1024',
      type: 'image/png',
      purpose: 'any maskable',
    },
  ],
  screenshots: APP_MANIFEST.screenshots.map((screenshot) => ({
    src: versioned(screenshot.src),
    sizes: screenshot.sizes,
    type: screenshot.type,
    form_factor: screenshot.formFactor,
    label: screenshot.label,
  })),
};

writeFileSync(
  resolve(ROOT, 'public/manifest.webmanifest'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(
  `✅ manifest.webmanifest 已由 SSOT 重新生成（${currencyCount} 種貨幣，v${VERSION_TOKEN}）`,
);
