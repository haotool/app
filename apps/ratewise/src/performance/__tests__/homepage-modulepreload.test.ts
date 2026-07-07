/**
 * 首屏 bundle 預算守門測試
 *
 * 只有在以下條件下才會執行：
 * 1. RATEWISE_RUN_BUNDLE_BUDGET=1 環境變數設定
 * 2. 或透過 pnpm --filter @app/ratewise test:perf:bundle 執行
 *
 * CI 常規測試 (test:coverage) 不會執行這些測試。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { brotliCompressSync } from 'node:zlib';
import { join } from 'node:path';

const distDir = join(__dirname, '../../../dist');
const distExists = existsSync(join(distDir, 'index.html'));

// 只有明確指定時才執行 bundle 預算測試
// npm_lifecycle_event = 執行的 npm script 名稱（如 test:perf:bundle），pnpm 也適用
// npm_lifecycle_script = 實際 shell 命令（vitest run...），不可靠作為腳本名稱識別
const isExplicitBundleTest =
  process.env['RATEWISE_RUN_BUNDLE_BUDGET'] === '1' ||
  process.env['npm_lifecycle_event'] === 'test:perf:bundle';

/** 走訪 manifest 靜態 import 圖，收集 entry 閉包內全部 chunk 檔名。 */
function collectEntryStaticFiles(): string[] {
  const manifest = JSON.parse(
    readFileSync(join(distDir, '.vite/manifest.json'), 'utf-8'),
  ) as Record<string, { file: string; imports?: string[] }>;
  if (!manifest['index.html']) {
    throw new Error('index.html entry not found in manifest');
  }
  const fileSet = new Set<string>();
  const collectFiles = (key: string) => {
    const chunk = manifest[key];
    if (!chunk) return;
    if (chunk.file) fileSet.add(chunk.file);
    for (const dep of chunk.imports ?? []) {
      if (!fileSet.has(manifest[dep]?.file ?? '')) collectFiles(dep);
    }
  };
  collectFiles('index.html');
  return Array.from(fileSet);
}

// 必須同時滿足：1) dist 存在 2) 明確要求執行
describe.skipIf(!distExists || !isExplicitBundleTest)('homepage modulepreload budget', () => {
  it('keeps motion and dnd out of homepage modulepreload', () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf-8');

    expect(html).not.toContain('vendor-motion');
    expect(html).not.toContain('vendor-dnd');
  });

  it('keeps currency landing copy chunks out of the entry static closure (#647)', () => {
    // 產物層守門：無論 import 形態（相對路徑、alias、間接鏈），
    // 幣別頁文案模組一旦成為 entry 靜態依賴就會在此現形。
    // 精確匹配 chunk basename，避免未來 core 正當拆出（core-HASH.js）誤報；
    // 「inline 進 app chunk」的回歸形態由下方 brotli 預算斷言兜底（+16KB 必爆）。
    const forbidden = /^assets\/(seo-metadata|currency-landing|currency-personas)-[\w-]+\.js$/;
    const files = collectEntryStaticFiles();

    expect(files.filter((file) => forbidden.test(file))).toEqual([]);
  });

  it('keeps homepage initial JS under the current brotli budget', () => {
    const files = collectEntryStaticFiles();
    const brotliBytes = files.reduce((total, file) => {
      const abs = join(distDir, file);
      statSync(abs);
      return total + brotliCompressSync(readFileSync(abs)).length;
    }, 0);

    // 首屏初始 JS brotli 預算（#647 重裁）：
    // 原 135KB 已不現實——vendor-react(52KB)+motion(37KB)+router(22KB)+commons(20KB)+i18n(16KB)
    // 靜態基底即 147KB+。seo-metadata 拆分後實測 251.1KB，預算設 255KB 作為防漂移 ratchet。
    expect(brotliBytes).toBeLessThanOrEqual(255_000);
  });
});
