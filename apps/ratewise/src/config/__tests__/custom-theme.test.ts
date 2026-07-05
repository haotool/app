/**
 * Custom 主題主色演算守門（E2 硬閘門）
 *
 * 1. AA property 測試：種子化隨機色 + 邊界色 → 全部文字配對對比 ≥ 4.5:1（WCAG AA）。
 * 2. 非文字圖形色（ring / 圖表線）對白底 ≥ 3:1（WCAG 1.4.11）。
 * 3. --color-primary 為 identity 映射（與 index.html bootstrap pre-paint 同構，鎖雙端一致）。
 * 4. 精選色票全部通過同一演算守門且彼此可區辨。
 *
 * 對比計算為測試內獨立實作（不复用被測模組），避免自我驗證盲點。
 */
import { describe, expect, it } from 'vitest';
import {
  CUSTOM_PRIMARY_PRESETS,
  CUSTOM_THEME_CSS_VARS,
  DEFAULT_CUSTOM_PRIMARY,
  choosePrimaryForeground,
  deriveCustomThemeCssVars,
  hexToRgbTriple,
  isValidHexColor,
} from '../custom-theme';

/** 'R G B' → 相對亮度（WCAG 2.x，獨立實作） */
function relativeLuminance(triple: string): number {
  const [r, g, b] = triple.split(/\s+/).map((n) => {
    const c = Number(n) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = '255 255 255';

function hexToTriple(hex: string): string {
  return `${parseInt(hex.slice(1, 3), 16)} ${parseInt(hex.slice(3, 5), 16)} ${parseInt(hex.slice(5, 7), 16)}`;
}

/** mulberry32 種子化 PRNG：可重現的 property-based 隨機色。 */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20260705);
const randomHexColors = Array.from({ length: 300 }, () => {
  const channel = () =>
    Math.floor(random() * 256)
      .toString(16)
      .padStart(2, '0');
  return `#${channel()}${channel()}${channel()}`.toUpperCase();
});

/** 邊界色：極淺 / 極豔 / 灰階 / 純色端點。 */
const boundaryHexColors = [
  '#FFFFFF',
  '#000000',
  '#FFFF00',
  '#00FF00',
  '#00FFFF',
  '#FF00FF',
  '#FF0000',
  '#0000FF',
  '#808080',
  '#F8FAFC',
  '#FFFEF0',
  '#010101',
];

const allInputs = [...boundaryHexColors, ...randomHexColors, ...CUSTOM_PRIMARY_PRESETS];

describe('custom 主題演算 AA property 守門（任意輸入色 → 全部文字配對 ≥ 4.5:1）', () => {
  it.each(allInputs.map((hex) => ({ hex })))('$hex 導出全組變數皆守 AA', ({ hex }) => {
    const vars = deriveCustomThemeCssVars(hex);
    const strong = vars['--color-primary-strong'];
    const hover = vars['--color-primary-hover'];
    const bg = vars['--color-primary-bg'];
    const text = vars['--color-primary-text'];
    const dark = vars['--color-primary-dark'];
    const darker = vars['--color-primary-darker'];

    // 白字實底（按鈕 / 等號鍵語境）
    expect(contrast(WHITE, strong), `${hex} strong 白字`).toBeGreaterThanOrEqual(4.5);
    expect(contrast(WHITE, hover), `${hex} hover 白字`).toBeGreaterThanOrEqual(4.5);

    // 有色文字對白底與 bg tint（primary-text / dark / darker 均為文字角色）
    for (const [name, value] of [
      ['text', text],
      ['dark', dark],
      ['darker', darker],
    ] as const) {
      expect(contrast(value, WHITE), `${hex} ${name} on white`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(value, bg), `${hex} ${name} on bg tint`).toBeGreaterThanOrEqual(4.5);
    }

    // 亮度擇色法（白/深二選一）在 strong 底上必達 AA
    const strongHex = `#${strong
      .split(' ')
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('')}`;
    const foreground = hexToTriple(choosePrimaryForeground(strongHex));
    expect(contrast(foreground, strong), `${hex} 擇色文字 on strong`).toBeGreaterThanOrEqual(4.5);

    // 非文字圖形色（focus ring / 圖表線）對白底 ≥ 3:1
    expect(contrast(vars['--color-primary-ring'], WHITE)).toBeGreaterThanOrEqual(3);
    expect(contrast(vars['--color-chart-line'], WHITE)).toBeGreaterThanOrEqual(3);
  });
});

describe('custom 主題演算行為合約', () => {
  it('--color-primary 為 identity 映射（與 bootstrap pre-paint 同構）', () => {
    for (const hex of allInputs) {
      expect(deriveCustomThemeCssVars(hex)['--color-primary']).toBe(hexToRgbTriple(hex));
      expect(hexToRgbTriple(hex)).toBe(hexToTriple(hex));
    }
  });

  it('演算為純函式：同輸入同輸出且涵蓋全部 14 鍵', () => {
    const first = deriveCustomThemeCssVars('#FF6B6B');
    const second = deriveCustomThemeCssVars('#FF6B6B');
    expect(second).toEqual(first);
    expect(Object.keys(first).sort()).toEqual([...CUSTOM_THEME_CSS_VARS].sort());
  });

  it('無效輸入回退預設自訂主色', () => {
    const fallback = deriveCustomThemeCssVars(DEFAULT_CUSTOM_PRIMARY);
    expect(deriveCustomThemeCssVars('not-a-color')).toEqual(fallback);
    expect(deriveCustomThemeCssVars('#FFF')).toEqual(fallback);
  });

  it('isValidHexColor 僅接受 #RRGGBB 六碼', () => {
    expect(isValidHexColor('#3182F6')).toBe(true);
    expect(isValidHexColor('#3182f6')).toBe(true);
    expect(isValidHexColor('#FFF')).toBe(false);
    expect(isValidHexColor('3182F6')).toBe(false);
    expect(isValidHexColor('#3182F61')).toBe(false);
    expect(isValidHexColor(null)).toBe(false);
    expect(isValidHexColor(123)).toBe(false);
  });

  it('精選色票 8–12 個、格式合法且彼此可區辨', () => {
    expect(CUSTOM_PRIMARY_PRESETS.length).toBeGreaterThanOrEqual(8);
    expect(CUSTOM_PRIMARY_PRESETS.length).toBeLessThanOrEqual(12);
    CUSTOM_PRIMARY_PRESETS.forEach((preset) => expect(isValidHexColor(preset)).toBe(true));
    expect(new Set(CUSTOM_PRIMARY_PRESETS).size).toBe(CUSTOM_PRIMARY_PRESETS.length);
  });
});
