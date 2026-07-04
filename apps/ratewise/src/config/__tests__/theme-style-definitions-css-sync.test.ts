/**
 * STYLE_DEFINITIONS ↔ index.css 值同步守門（Plan 019 防漂移）
 *
 * 背景：主題色有兩個平行來源——`themes.ts` 的 `STYLE_DEFINITIONS`
 * （餵 offline.html / manifest 生成與 JS 端消費）與 `index.css` 的
 * `[data-style]` CSS 變數區塊（UI 與圖表實際渲染）。
 * 兩邊值漂移會造成生成物配色與畫面配色不一致（2026-07 稽核發現 8 筆）。
 *
 * 守門規則：7 主題的 `STYLE_DEFINITIONS[style].colors` 全部 16 鍵
 * （13 語義色 + 3 圖表色），換算 camelCase → kebab-case 後，
 * 必須等於 `index.css` 對應 `[data-style]` 區塊的同名 `--color-*` 值。
 *
 * 分工：`theme-css-var-parity.test.ts` 守 CSS 區塊鍵集合；
 * `theme-consistency.test.ts` 守 JS→CSS 變數格式；本測試守「值」同步。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STYLE_DEFINITIONS } from '../themes';

const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf-8');

/** camelCase → kebab-case（chartAreaTop → chart-area-top） */
function toKebabCase(key: string): string {
  return key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

/** 解析每個 [data-style='X'] 區塊的原始內容（解析方式對齊 theme-css-var-parity.test.ts） */
function parseThemeBlockBodies(source: string): Map<string, string> {
  const blockStarts = [...source.matchAll(/\[data-style='([\w-]+)'\]\s*\{/g)];
  const blocks = new Map<string, string>();
  blockStarts.forEach((match, index) => {
    const name = match[1];
    if (!name || match.index === undefined) return;
    const next = blockStarts[index + 1];
    blocks.set(name, source.slice(match.index, next?.index ?? source.length));
  });
  return blocks;
}

const themeBlockBodies = parseThemeBlockBodies(css);

/** 讀取區塊內 --color-<name> 的 'R G B' 值 */
function readCssVarValue(blockBody: string, varName: string): string | undefined {
  return new RegExp(`${varName}:\\s*([0-9]+ [0-9]+ [0-9]+)\\s*;`).exec(blockBody)?.[1];
}

const cases = Object.entries(STYLE_DEFINITIONS).flatMap(([style, definition]) =>
  Object.entries(definition.colors).map(([key, value]) => ({
    style,
    key,
    value,
    cssVar: `--color-${toKebabCase(key)}`,
  })),
);

describe('STYLE_DEFINITIONS ↔ index.css 值同步（防雙源漂移）', () => {
  it('涵蓋全部 7 主題 × 16 色鍵', () => {
    expect(Object.keys(STYLE_DEFINITIONS)).toHaveLength(7);
    expect(cases).toHaveLength(7 * 16);
  });

  it.each(cases)('$style › $key 必須等於 index.css 的 $cssVar', ({ style, key, value, cssVar }) => {
    const blockBody = themeBlockBodies.get(style);
    expect(blockBody, `index.css 缺少 [data-style='${style}'] 區塊`).toBeDefined();
    const cssValue = readCssVarValue(blockBody ?? '', cssVar);
    expect(cssValue, `[data-style='${style}'] 缺少 ${cssVar} 宣告`).toBeDefined();
    expect(
      value,
      `themes.ts 的 ${style}.${key}（${value}）與 index.css 的 ${cssVar}（${cssValue}）漂移`,
    ).toBe(cssValue);
  });
});
