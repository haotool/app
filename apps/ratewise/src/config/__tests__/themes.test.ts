/**
 * 主題色彩可讀性守門（聚焦 Nitro / Racing / Forest）
 *
 * RW-2：修正 Nitro 深色主題 textMuted（slate-500→slate-300）與 primary
 * （過亮 cyan→深電光），確保次要文字可讀、按鈕白字達 AA-large 對比。
 * 同時鎖定 themes.ts ↔ index.css 不漂移。
 *
 * Plan 014：新增 Racing（黑紅賽車）取代 Ocean、Forest 改白底韓系簡約，
 * 補上兩者的可讀性守門與 STYLE_OPTIONS 順序守門（racing 緊鄰 nitro 之後）。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STYLE_DEFINITIONS, STYLE_OPTIONS } from '../themes';

/** 'R G B' → 相對亮度（WCAG 2.x） */
function relativeLuminance(rgb: string): number {
  const [r, g, b] = rgb.split(/\s+/).map((n) => {
    const c = Number(n) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = '255 255 255';

describe('Nitro 主題可讀性守門', () => {
  const nitro = STYLE_DEFINITIONS.nitro.colors;

  it('primary 上的白字對比 ≥ 3:1（AA-large / 按鈕）', () => {
    expect(contrastRatio(WHITE, nitro.primary)).toBeGreaterThanOrEqual(3);
  });

  it('textMuted 對 background 對比 ≥ 4.5:1（AA 內文）', () => {
    expect(contrastRatio(nitro.textMuted, nitro.background)).toBeGreaterThanOrEqual(4.5);
  });

  it('themes.ts 與 index.css 的 Nitro primary / textMuted 不得漂移', () => {
    const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf-8');
    const block = css.slice(css.indexOf("[data-style='nitro']"));
    const cssVar = (name: string) =>
      new RegExp(`--color-${name}:\\s*([0-9]+\\s+[0-9]+\\s+[0-9]+)`).exec(block)?.[1]?.trim();
    expect(cssVar('primary')).toBe(nitro.primary);
    expect(cssVar('text-muted')).toBe(nitro.textMuted);
  });
});

describe('Racing 主題可讀性守門（黑紅賽車，取代 Ocean）', () => {
  const racing = STYLE_DEFINITIONS.racing.colors;

  it('primaryStrong 上的白字對比 ≥ 4.5:1（AA / 等號按鈕白字）', () => {
    expect(contrastRatio(WHITE, racing.primaryStrong)).toBeGreaterThanOrEqual(4.5);
  });

  it('textMuted 對 background 對比 ≥ 4.5:1（AA 內文）', () => {
    expect(contrastRatio(racing.textMuted, racing.background)).toBeGreaterThanOrEqual(4.5);
  });

  it('error 狀態色與 primary 紅色系區隔（不同色相，避免混淆）', () => {
    expect(racing.error).not.toBe(racing.primary);
    // error（橘）與 surface 對比需可讀
    expect(contrastRatio(racing.error, racing.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it('themes.ts 與 index.css 的 Racing primary / textMuted 不得漂移', () => {
    const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf-8');
    const block = css.slice(css.indexOf("[data-style='racing']"));
    const cssVar = (name: string) =>
      new RegExp(`--color-${name}:\\s*([0-9]+\\s+[0-9]+\\s+[0-9]+)`).exec(block)?.[1]?.trim();
    expect(cssVar('primary')).toBe(racing.primary);
    expect(cssVar('text-muted')).toBe(racing.textMuted);
  });
});

describe('Forest 主題可讀性守門（韓系簡約白底）', () => {
  const forest = STYLE_DEFINITIONS.forest.colors;

  it('background 應為近白色（韓系簡約白底範式，對齊 Zen）', () => {
    const [r, g, b] = forest.background.split(' ').map(Number);
    expect(r).toBeGreaterThanOrEqual(240);
    expect(g).toBeGreaterThanOrEqual(240);
    expect(b).toBeGreaterThanOrEqual(240);
  });

  it('primaryStrong 上的白字對比 ≥ 4.5:1（AA / 等號按鈕白字）', () => {
    expect(contrastRatio(WHITE, forest.primaryStrong)).toBeGreaterThanOrEqual(4.5);
  });

  it('text 對 background 對比 ≥ 4.5:1（AA 內文）', () => {
    expect(contrastRatio(forest.text, forest.background)).toBeGreaterThanOrEqual(4.5);
  });

  it('themes.ts 與 index.css 的 Forest primary / background 不得漂移', () => {
    const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf-8');
    const block = css.slice(css.indexOf("[data-style='forest']"));
    const cssVar = (name: string) =>
      new RegExp(`--color-${name}:\\s*([0-9]+\\s+[0-9]+\\s+[0-9]+)`).exec(block)?.[1]?.trim();
    expect(cssVar('primary')).toBe(forest.primary);
    expect(cssVar('background')).toBe(forest.background);
  });
});

describe('STYLE_OPTIONS 主題選單順序守門', () => {
  it('不再包含 ocean', () => {
    const values: string[] = STYLE_OPTIONS.map((option) => option.value);
    expect(values.includes('ocean')).toBe(false);
  });

  it('包含 racing，且緊鄰 nitro 之後（設定頁排序需求）', () => {
    const nitroIndex = STYLE_OPTIONS.findIndex((option) => option.value === 'nitro');
    const racingIndex = STYLE_OPTIONS.findIndex((option) => option.value === 'racing');
    expect(nitroIndex).toBeGreaterThanOrEqual(0);
    expect(racingIndex).toBe(nitroIndex + 1);
  });
});
