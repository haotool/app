import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_INFO, APP_MANIFEST } from '../src/config/app-info.ts';
import { STYLE_DEFINITIONS } from '../src/config/themes.ts';

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
const zenColors = STYLE_DEFINITIONS.zen.colors;

function rgbTripletToHex(rgbTriplet) {
  return `#${rgbTriplet
    .trim()
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

const manifest = {
  name: APP_INFO.name,
  short_name: APP_MANIFEST.shortName,
  description: `${APP_INFO.name}顯示臺灣銀行牌告實際買賣價（非中間價），支援 ${currencyCount} 種貨幣換算，每 5 分鐘同步，離線可用的 PWA 匯率工具。`,
  theme_color: rgbTripletToHex(zenColors.primary),
  background_color: rgbTripletToHex(zenColors.background),
  display: 'standalone',
  scope: '/ratewise/',
  start_url: '/ratewise/',
  id: '/ratewise/',
  orientation: 'portrait-primary',
  categories: ['finance', 'utilities', 'productivity'],
  icons: [
    {
      src: versioned('icons/ratewise-icon-192x192.png'),
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: versioned('icons/ratewise-icon-256x256.png'),
      sizes: '256x256',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: versioned('icons/ratewise-icon-384x384.png'),
      sizes: '384x384',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: versioned('icons/ratewise-icon-512x512.png'),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: versioned('icons/ratewise-icon-1024x1024.png'),
      sizes: '1024x1024',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: versioned('icons/ratewise-icon-maskable-512x512.png'),
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable',
    },
    {
      src: versioned('icons/ratewise-icon-maskable-1024x1024.png'),
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
