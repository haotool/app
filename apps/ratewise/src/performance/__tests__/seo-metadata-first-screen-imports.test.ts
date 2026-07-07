/**
 * 首屏 seo-metadata import 守門（#647）。
 * entry 靜態鏈模組不得對 barrel（`config/seo-metadata`）產生 runtime import，
 * 否則會把 currency-landing 與 personas 拉進首屏 chunk；需要 SEO 常數時應
 * 直接 import `config/seo-metadata/core`。
 * 此為快速反饋層（不跑 build 即可抓直接 import）；間接鏈與 alias 繞過由
 * homepage-modulepreload.test.ts 的 manifest 閉包＋brotli 預算斷言兜底。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const srcDir = join(__dirname, '../..');

// 首屏靜態鏈上會出現 runtime import 的模組清單。
const FIRST_SCREEN_MODULES = [
  'routes.tsx',
  'components/SEOHelmet.tsx',
  'components/AppLayout.tsx',
  'components/HomepageSEOSection.tsx',
] as const;

describe('seo-metadata first-screen imports (#647)', () => {
  it.each(FIRST_SCREEN_MODULES)('%s 不得 runtime import seo-metadata barrel', (file) => {
    const source = readFileSync(join(srcDir, file), 'utf-8');
    // 涵蓋相對路徑（./、../）與 workspace alias（@app/ratewise/）兩種形態；
    // `import type` 僅型別、不產生 runtime 依賴，予以豁免。
    const barrelRuntimeImport =
      /import\s+(?!type\b)[^;]*from\s+['"](?:[./]*|@app\/ratewise\/)config\/seo-metadata['"]/;

    expect(source).not.toMatch(barrelRuntimeImport);
  });
});
