import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_INFO, APP_MANIFEST } from '../src/config/app-info.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));

// 用 git commit hash 做 cache-busting（比日期精準：每次 commit 才更新）
// 若 git 不可用（罕見）回退至版本號
function getVersionToken() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return pkg.version;
  }
}
const VERSION_TOKEN = getVersionToken();

const constantsPath = resolve(ROOT, 'src/features/ratewise/constants.ts');
const constantsContent = readFileSync(constantsPath, 'utf-8');
const currencyCount = [...constantsContent.matchAll(/^\s+([A-Z]{3}):\s*\{/gm)].length;

const versioned = (path) => `${path}?v=${VERSION_TOKEN}`;

const manifest = {
  name: APP_INFO.name,
  short_name: APP_MANIFEST.shortName,
  description: `${APP_INFO.name}顯示臺灣銀行牌告實際買賣價（非中間價），支援 ${currencyCount} 種貨幣換算，每 5 分鐘同步，離線可用的 PWA 匯率工具。`,
  theme_color: '#8B5CF6',
  background_color: '#E8ECF4',
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
  `✅ manifest.webmanifest 已由 SSOT 重新生成（${currencyCount} 種貨幣，cache token: ${VERSION_TOKEN}）`,
);
