import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BUILD_DATE = new Date().toISOString().split('T')[0].replace(/-/g, '');

const constantsPath = resolve(ROOT, 'src/features/ratewise/constants.ts');
const constantsContent = readFileSync(constantsPath, 'utf-8');
const currencyCount = [...constantsContent.matchAll(/^\s+([A-Z]{3}):\s*\{/gm)].length;

const versioned = (path) => `${path}?v=${BUILD_DATE}`;

const manifest = {
  name: 'RateWise - 即時匯率轉換器',
  short_name: 'RateWise',
  description: `RateWise 提供即時匯率換算服務，參考臺灣銀行牌告匯率，支援 ${currencyCount} 種貨幣。快速、準確、離線可用的 PWA 匯率工具。`,
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
  screenshots: [
    {
      src: versioned('screenshots/mobile-home.png'),
      sizes: '1080x1920',
      type: 'image/png',
      form_factor: 'narrow',
      label: 'RateWise 首頁 - 即時匯率換算與趨勢圖',
    },
    {
      src: versioned('screenshots/mobile-converter-active.png'),
      sizes: '1080x1920',
      type: 'image/png',
      form_factor: 'narrow',
      label: '貨幣轉換 - 輸入金額即時顯示匯率結果',
    },
    {
      src: versioned('screenshots/mobile-features.png'),
      sizes: '1080x1920',
      type: 'image/png',
      form_factor: 'narrow',
      label: '常見問題與功能介紹',
    },
    {
      src: versioned('screenshots/desktop-converter.png'),
      sizes: '1920x1080',
      type: 'image/png',
      form_factor: 'wide',
      label: '桌面版 - 完整匯率轉換介面與趨勢圖表',
    },
    {
      src: versioned('screenshots/desktop-features.png'),
      sizes: '1920x1080',
      type: 'image/png',
      form_factor: 'wide',
      label: '桌面版 - 關於 RateWise 與功能說明',
    },
  ],
};

writeFileSync(
  resolve(ROOT, 'public/manifest.webmanifest'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(`✅ manifest.webmanifest 已由 SSOT 重新生成（${currencyCount} 種貨幣）`);
