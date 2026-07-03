/**
 * 主題 CSS 變數 parity 守門（舊版 primary 系列）
 *
 * 背景：`text-primary-dark` / `hover:text-primary-darker` 等 Tailwind class
 * 對應的 legacy primary 變數過去只在部分 `[data-style]` 區塊定義，
 * 缺失主題（kawaii / classic / ocean / forest）會 fallback 到 `:root`
 * 的品牌藍，導致多幣別頁費率切換鈕顏色不符主題。
 *
 * 守門規則：每個 `[data-style]` 區塊必須定義完整 9 鍵 primary 系列；
 * 未來新增主題若漏定義，本測試會列出主題名與缺失鍵。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** legacy primary 系列 SSOT 鍵集合（9 鍵） */
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
    const end = next?.index !== undefined ? next.index : source.length;
    const body = source.slice(start, end);
    const keys = new Set(
      [...body.matchAll(/(--color-[\w-]+)\s*:/g)].map((m) => m[1]).filter((k): k is string => !!k),
    );
    blocks.set(name, keys);
  });
  return blocks;
}

const themeBlocks = parseThemeBlocks(css);

describe('主題 CSS 變數 parity（legacy primary 系列）', () => {
  it('index.css 至少包含 6 個 [data-style] 主題區塊', () => {
    expect(themeBlocks.size).toBeGreaterThanOrEqual(6);
  });

  it('守門鍵清單必須涵蓋 primary-dark / primary-darker（防止清單被掏空）', () => {
    expect(REQUIRED_PRIMARY_KEYS).toContain('--color-primary-dark');
    expect(REQUIRED_PRIMARY_KEYS).toContain('--color-primary-darker');
  });

  describe.each([...themeBlocks.keys()].map((theme) => ({ theme })))(
    '[data-style=$theme]',
    ({ theme }) => {
      it.each(REQUIRED_PRIMARY_KEYS.map((key) => ({ key })))('定義 $key', ({ key }) => {
        const keys = themeBlocks.get(theme);
        expect(keys, `主題 ${theme} 區塊解析失敗`).toBeDefined();
        expect(
          keys?.has(key),
          `主題 ${theme} 缺少 ${key}（legacy primary 系列 9 鍵必須齊備）`,
        ).toBe(true);
      });
    },
  );
});
