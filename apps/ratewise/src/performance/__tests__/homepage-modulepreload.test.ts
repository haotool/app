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

// 必須同時滿足：1) dist 存在 2) 明確要求執行
describe.skipIf(!distExists || !isExplicitBundleTest)('homepage modulepreload budget', () => {
  it('keeps motion and dnd out of homepage modulepreload', () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf-8');

    expect(html).not.toContain('vendor-motion');
    expect(html).not.toContain('vendor-dnd');
  });

  it('keeps homepage initial JS under the current brotli budget', () => {
    const manifest = JSON.parse(
      readFileSync(join(distDir, '.vite/manifest.json'), 'utf-8'),
    ) as Record<string, { file: string; imports?: string[] }>;
    const entry = manifest['index.html'];
    if (!entry) {
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
    const files = Array.from(fileSet);
    const brotliBytes = files.reduce((total, file) => {
      const abs = join(distDir, file);
      statSync(abs);
      return total + brotliCompressSync(readFileSync(abs)).length;
    }, 0);

    // 135KB brotli budget for initial JS
    expect(brotliBytes).toBeLessThanOrEqual(135_000);
  });
});
