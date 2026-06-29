/**
 * 主題色彩可讀性守門（聚焦 Nitro）
 *
 * RW-2：修正 Nitro 深色主題 textMuted（slate-500→slate-300）與 primary
 * （過亮 cyan→深電光），確保次要文字可讀、按鈕白字達 AA-large 對比。
 * 同時鎖定 themes.ts ↔ index.css 不漂移。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STYLE_DEFINITIONS } from '../themes';

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
