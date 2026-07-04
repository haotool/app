/**
 * 主題 CSS 變數全鍵 parity 守門
 *
 * 背景：`index.css` 的 `:root, [data-style='zen']` 是全站預設，
 * 任何主題缺鍵都會靜默 fallback 到 zen 淺色值，
 * 深色主題（nitro/racing）下形成「深底淺卡」級視覺 bug（Plan 018）。
 *
 * 守門規則：
 * 1. 全部 `[data-style]` 區塊的 `--color-*` 鍵集合必須完全相等（缺失/多餘皆列出）。
 * 2. 聯集鍵數不得低於下限，且 legacy primary 9 鍵必須存在（防止刪光變數讓 parity 通過）。
 * 3. `:root, [data-style='zen']` 組合選擇器不可被拆掉（zen = 預設的合約）。
 *
 * 分工：本測試守 CSS 區塊鍵集合；`theme-consistency.test.ts` 守 JS→CSS 變數格式。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** 全鍵聯集下限（Step 2 落地後實際鍵數；刪鍵需同步下修並附計畫依據） */
const MIN_UNION_KEY_COUNT = 120;

/** legacy primary 系列 SSOT 鍵集合（9 鍵，Plan 013 守門對象） */
const REQUIRED_PRIMARY_KEYS = [
  '--color-primary-bg',
  '--color-primary-light',
  '--color-primary-hover',
  '--color-primary-active',
  '--color-primary-text-light',
  '--color-primary-ring',
  '--color-primary-dark',
  '--color-primary-darker',
  '--color-primary-text',
] as const;

const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf-8');

/** 解析每個 [data-style='X'] 區塊內宣告的 --color-* 鍵集合 */
function parseThemeBlocks(source: string): Map<string, Set<string>> {
  const blockStarts = [...source.matchAll(/\[data-style='([\w-]+)'\]\s*\{/g)];
  const blocks = new Map<string, Set<string>>();
  blockStarts.forEach((match, index) => {
    const name = match[1];
    if (!name || match.index === undefined) return;
    const start = match.index;
    const next = blockStarts[index + 1];
    const end = next?.index ?? source.length;
    const body = source.slice(start, end);
    const keys = new Set(
      [...body.matchAll(/(--color-[\w-]+)\s*:/g)].map((m) => m[1]).filter((k): k is string => !!k),
    );
    blocks.set(name, keys);
  });
  return blocks;
}

const themeBlocks = parseThemeBlocks(css);
const unionKeys = new Set([...themeBlocks.values()].flatMap((keys) => [...keys]));

describe('主題 CSS 變數 parity（全鍵合約）', () => {
  it('index.css 至少包含 6 個 [data-style] 主題區塊', () => {
    expect(themeBlocks.size).toBeGreaterThanOrEqual(6);
  });

  it(':root 與 [data-style=zen] 必須維持組合選擇器（zen = 全站預設合約）', () => {
    expect(css).toMatch(/:root,\n\s*\[data-style='zen'\]\s*\{/);
  });

  it(`聯集鍵數不得低於 ${MIN_UNION_KEY_COUNT}（防止刪光變數讓 parity 通過）`, () => {
    expect(unionKeys.size).toBeGreaterThanOrEqual(MIN_UNION_KEY_COUNT);
  });

  it.each(REQUIRED_PRIMARY_KEYS.map((key) => ({ key })))(
    '聯集必須包含 legacy primary 鍵 $key',
    ({ key }) => {
      expect(unionKeys.has(key), `聯集缺少 ${key}（legacy primary 系列 9 鍵必須齊備）`).toBe(true);
    },
  );

  describe.each([...themeBlocks.keys()].map((theme) => ({ theme })))(
    '[data-style=$theme]',
    ({ theme }) => {
      it('鍵集合必須與全主題聯集完全相等', () => {
        const keys = themeBlocks.get(theme);
        expect(keys, `主題 ${theme} 區塊解析失敗`).toBeDefined();
        const missing = [...unionKeys].filter((key) => !keys?.has(key)).sort();
        expect(
          missing,
          `主題 ${theme} 缺少 ${missing.length} 鍵（缺鍵會 fallback 到 zen 淺色值）：${missing.join(', ')}`,
        ).toEqual([]);
      });
    },
  );
});
