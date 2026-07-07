/**
 * SSG locale 靜態守門（issue 624，比照 design-system-guards 模式）
 *
 * 無參數 toLocaleString/toLocaleDateString/toLocaleTimeString 依執行環境 locale 輸出：
 * SSG build（zh-TW）與非 zh-TW 瀏覽器 client 端結果不一致（1,234 vs 1.234），
 * 觸發 hydration mismatch（React #418 家族）。全站產品源碼一律要求顯式 locale，
 * 與 currencyFormatter/timeFormatter 既有 'zh-TW' 慣例收斂為 SSOT。
 *
 * 「突變驗證」以刻意注入違規的 fixture 確認規則確實會咬人，防守門靜默失效。
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC_ROOT = join(__dirname, '..');

/** 遞迴收集 src 下的產品源碼（排除測試與 generated，與 design-system-guards 一致）。 */
function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      if (entry === '__tests__' || entry === 'generated' || entry === 'node_modules') continue;
      files.push(...collectSourceFiles(fullPath));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue;
    if (/\.(test|spec)\.(ts|tsx)$/.test(entry)) continue;
    files.push(fullPath);
  }
  return files;
}

interface Violation {
  file: string;
  match: string;
}

/** 無 locale 的 toLocale* 呼叫：空參數或以 undefined 作為 locale。 */
const LOCALE_LESS_TOLOCALE = /\.toLocale(?:String|DateString|TimeString)\(\s*(?:\)|undefined)/g;

function findLocaleLessCalls(content: string, file: string): Violation[] {
  const violations: Violation[] = [];
  for (const match of content.matchAll(LOCALE_LESS_TOLOCALE)) {
    violations.push({ file, match: match[0] });
  }
  return violations;
}

const sourceFiles = collectSourceFiles(SRC_ROOT);

describe('SSG locale 守門：源碼掃描', () => {
  it('掃描範圍健全（至少涵蓋百檔源碼）', () => {
    expect(sourceFiles.length).toBeGreaterThan(100);
  });

  it('全站產品源碼禁止無 locale 的 toLocaleString/DateString/TimeString', () => {
    const violations = sourceFiles.flatMap((file) =>
      findLocaleLessCalls(readFileSync(file, 'utf8'), relative(SRC_ROOT, file)),
    );
    expect(violations).toEqual([]);
  });
});

describe('SSG locale 守門：突變驗證', () => {
  it('無參數 toLocaleString 會被抓到', () => {
    expect(findLocaleLessCalls('const s = value.toLocaleString();', 'fixture.ts')).toHaveLength(1);
  });

  it('undefined locale 會被抓到', () => {
    expect(
      findLocaleLessCalls(
        "const s = date.toLocaleDateString(undefined, { month: 'long' });",
        'fixture.ts',
      ),
    ).toHaveLength(1);
  });

  it('無參數 toLocaleTimeString 會被抓到', () => {
    expect(findLocaleLessCalls('const s = date.toLocaleTimeString( );', 'fixture.ts')).toHaveLength(
      1,
    );
  });

  it('顯式 locale 呼叫放行', () => {
    expect(
      findLocaleLessCalls(
        "const s = value.toLocaleString('zh-TW'); const t = date.toLocaleDateString('zh-TW', { month: 'long' });",
        'fixture.ts',
      ),
    ).toEqual([]);
  });
});
