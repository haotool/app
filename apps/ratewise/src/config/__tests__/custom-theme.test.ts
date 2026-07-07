/**
 * Custom 主題主色演算守門（E2 硬閘門＋E7 wave-A 深色矩陣）
 *
 * 1. AA property 測試：種子化隨機色 + 邊界色 × 全部背景調（淺＋深）→ 文字配對對比全數達標。
 * 2. 非文字圖形色（ring / 圖表線）對各自底色 ≥ 3:1（WCAG 1.4.11）。
 * 3. --color-primary 為 identity 映射（與 index.html bootstrap pre-paint 同構，鎖雙端一致）。
 * 4. 精選色票全部通過同一演算守門且彼此可區辨。
 * 5. E7 wave-A：深色調亮階疊升階序、亮字 ≥7:1/≥4.5:1、lighten/darken 對偶 property 對稱。
 * 6. 淺色調新增鍵輸出 zen 靜態同值（既有淺色使用者視覺零變化合約）。
 *
 * 對比計算為測試內獨立實作（不复用被測模組），避免自我驗證盲點。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CUSTOM_BACKGROUND_TONES,
  CUSTOM_PRIMARY_PRESETS,
  CUSTOM_THEME_CSS_VARS,
  DEFAULT_CUSTOM_BACKGROUND_TONE,
  DEFAULT_CUSTOM_PRIMARY,
  choosePrimaryForeground,
  darkenToContrast,
  deriveCustomThemeCssVars,
  hexToRgbTriple,
  isDarkBackgroundTone,
  isValidBackgroundTone,
  isValidHexColor,
  lightenToContrast,
  rgbToHsl,
  hexToRgb,
  type CustomBackgroundTone,
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

/** 全部背景色調（淺 5＋深 3，鍵集合 SSOT 派生全覆蓋）。 */
const ALL_TONES = Object.keys(CUSTOM_BACKGROUND_TONES) as CustomBackgroundTone[];
const LIGHT_TONES = ALL_TONES.filter((tone) => !isDarkBackgroundTone(tone));
const DARK_TONES = ALL_TONES.filter((tone) => isDarkBackgroundTone(tone));

// zen 底座固定文字色（[data-style='custom'] 靜態區塊值：slate-900 / slate-500）。
const BASE_TEXT = '15 23 42';
const BASE_TEXT_MUTED = '100 116 139';

/**
 * 淺色調新增鍵的 zen 靜態同值合約（獨立宣告，不引用被測模組常數）：
 * E7 擴充 CUSTOM_THEME_CSS_VARS 後，淺色調必須輸出與 [data-style='custom']
 * 靜態區塊完全相同的值，既有淺色使用者視覺零變化。
 */
const EXPECTED_LIGHT_STATIC: Record<string, string> = {
  '--color-surface': '255 255 255',
  '--color-surface-elevated': '248 250 252',
  '--color-text': '15 23 42',
  '--color-text-muted': '100 116 139',
  '--color-border': '226 232 240',
  '--color-neutral-light': '241 245 249',
  '--color-neutral': '226 232 240',
  '--color-neutral-dark': '203 213 225',
  '--color-neutral-darker': '148 163 184',
  '--color-calc-number': '241 245 249',
  '--color-calc-number-text': '51 65 85',
  '--color-calc-number-hover': '226 232 240',
  '--color-calc-number-active': '203 213 225',
  '--color-calc-operator': '219 234 254',
  '--color-calc-operator-text': '37 99 235',
  '--color-calc-operator-hover': '191 219 254',
  '--color-calc-operator-active': '147 197 253',
  '--color-calc-equals-text': '255 255 255',
  '--color-calc-function': '226 232 240',
  '--color-calc-function-text': '51 65 85',
  '--color-calc-function-hover': '241 245 249',
  '--color-calc-function-active': '203 213 225',
  '--color-page-gradient-from': '241 245 249',
  '--color-page-gradient-to': '255 255 255',
  '--color-danger-bg': '254 242 242',
  '--color-danger-light': '254 226 226',
  '--color-danger-active': '252 165 165',
  '--color-success-bg': '240 253 244',
  '--color-success-light': '220 252 231',
  '--color-success-hover': '187 247 208',
  '--color-success-active': '134 239 172',
  '--color-warning-light': '254 243 199',
  '--color-warning-hover': '253 230 138',
  '--color-warning-active': '252 211 77',
  '--color-favorite-light': '254 243 199',
  '--color-highlight-from': '254 252 232',
  '--color-highlight-to': '255 251 235',
  '--color-brand-text-dark': '30 64 175',
  '--color-danger': '239 68 68',
  '--color-danger-text': '239 68 68',
};

/**
 * 深色調下未進覆寫集合的狀態文字（index.css [data-style='custom'] 靜態回落值）：
 * B1 一併鎖住 success/warning 現值防回退（sync 測試同時鎖 css 區塊值）。
 */
const STATIC_SUCCESS_TEXT = '34 197 94'; // green-500（--color-success-text）
const STATIC_WARNING_TEXT = '245 158 11'; // amber-500（--color-warning → warning-text var 回落）

describe.each(LIGHT_TONES.map((tone) => ({ tone })))(
  'custom 主題演算 AA property 守門（淺色調 $tone × 任意輸入色 → 全部文字配對 ≥ 4.5:1）',
  ({ tone }) => {
    const definition = CUSTOM_BACKGROUND_TONES[tone];
    const toneBackground = hexToTriple(definition.background);
    const toneSunken = hexToTriple(definition.surfaceSunken ?? definition.background);

    it('背景調對本身守 AA：text/muted 對 background ≥ 4.5、text 對 surface-sunken ≥ 4.5', () => {
      expect(
        contrast(BASE_TEXT, toneBackground),
        `${tone} text on background`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(BASE_TEXT_MUTED, toneBackground),
        `${tone} muted on background`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(contrast(BASE_TEXT, toneSunken), `${tone} text on sunken`).toBeGreaterThanOrEqual(4.5);
    });

    it.each(allInputs.map((hex) => ({ hex })))('$hex 導出全組變數皆守 AA', ({ hex }) => {
      const vars = deriveCustomThemeCssVars(hex, tone);
      const strong = vars['--color-primary-strong'];
      const hover = vars['--color-primary-hover'];
      const bg = vars['--color-primary-bg'];
      const text = vars['--color-primary-text'];
      const dark = vars['--color-primary-dark'];
      const darker = vars['--color-primary-darker'];
      const onSurface = vars['--color-primary-on-surface'];

      // 背景調對經演算直出（寫入=清除同一常數集合）
      expect(vars['--color-background']).toBe(toneBackground);
      expect(vars['--color-surface-sunken']).toBe(toneSunken);

      // 白字實底（按鈕 / 等號鍵語境）
      expect(contrast(WHITE, strong), `${hex} strong 白字`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(WHITE, hover), `${hex} hover 白字`).toBeGreaterThanOrEqual(4.5);

      // 有色文字對白底、bg tint 與背景調對
      // （primary-text / dark / darker / on-surface 均為文字角色，#632 曝露面守門）
      for (const [name, value] of [
        ['text', text],
        ['dark', dark],
        ['darker', darker],
        ['on-surface', onSurface],
      ] as const) {
        expect(contrast(value, WHITE), `${hex} ${name} on white`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(value, bg), `${hex} ${name} on bg tint`).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(value, toneBackground),
          `${hex} ${name} on ${tone} bg`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(value, toneSunken),
          `${hex} ${name} on ${tone} sunken`,
        ).toBeGreaterThanOrEqual(4.5);
      }

      // 亮度擇色法（白/深二選一）在 strong 底上必達 AA
      const strongHex = `#${strong
        .split(' ')
        .map((n) => Number(n).toString(16).padStart(2, '0'))
        .join('')}`;
      const foreground = hexToTriple(choosePrimaryForeground(strongHex));
      expect(contrast(foreground, strong), `${hex} 擇色文字 on strong`).toBeGreaterThanOrEqual(4.5);

      // 非文字圖形色（focus ring / 圖表線 / accent）對白底與背景調對 ≥ 3:1
      for (const key of ['--color-primary-ring', '--color-chart-line', '--color-accent'] as const) {
        expect(contrast(vars[key], WHITE), `${hex} ${key} on white`).toBeGreaterThanOrEqual(3);
        expect(
          contrast(vars[key], toneBackground),
          `${hex} ${key} on ${tone} bg`,
        ).toBeGreaterThanOrEqual(3);
        expect(
          contrast(vars[key], toneSunken),
          `${hex} ${key} on ${tone} sunken`,
        ).toBeGreaterThanOrEqual(3);
      }

      // S2 跟色鍵：白字表面（等號鍵 / 品牌按鈕）全部 ≥ 4.5:1
      for (const key of [
        '--color-calc-equals',
        '--color-calc-equals-hover',
        '--color-calc-equals-active',
        '--color-brand-button-from',
        '--color-brand-button-to',
        '--color-brand-button-hover-from',
        '--color-brand-button-hover-to',
      ] as const) {
        expect(contrast(WHITE, vars[key]), `${hex} ${key} 白字`).toBeGreaterThanOrEqual(4.5);
      }
      // brand-text 為有色文字：對白底 ≥ 4.5:1
      expect(contrast(vars['--color-brand-text'], WHITE)).toBeGreaterThanOrEqual(4.5);

      // E7 零變化合約：淺色調新增鍵必須輸出 zen 靜態同值
      for (const [key, value] of Object.entries(EXPECTED_LIGHT_STATIC)) {
        expect(vars[key as keyof typeof vars], `${hex} ${key} 淺色調必須維持 zen 靜態值`).toBe(
          value,
        );
      }
    });
  },
);

describe.each(DARK_TONES.map((tone) => ({ tone })))(
  'custom 主題深色派生 AA property 守門（E7 wave-A：深色調 $tone × 任意輸入色）',
  ({ tone }) => {
    const toneBackground = hexToTriple(CUSTOM_BACKGROUND_TONES[tone].background);

    it.each(allInputs.map((hex) => ({ hex })))('$hex 深色派生全組變數皆守 AA', ({ hex }) => {
      const vars = deriveCustomThemeCssVars(hex, tone);

      // background 直出選定色
      expect(vars['--color-background']).toBe(toneBackground);

      // 亮階疊升階序（elevation = 變亮）：background < sunken < surface < elevated
      const lum = (key: keyof typeof vars) => relativeLuminance(vars[key]);
      expect(lum('--color-surface-sunken'), `${hex} sunken > background`).toBeGreaterThan(
        lum('--color-background'),
      );
      expect(lum('--color-surface'), `${hex} surface > sunken`).toBeGreaterThan(
        lum('--color-surface-sunken'),
      );
      expect(lum('--color-surface-elevated'), `${hex} elevated > surface`).toBeGreaterThan(
        lum('--color-surface'),
      );
      // border 為亮 hairline：必須亮於 background
      expect(lum('--color-border'), `${hex} border > background`).toBeGreaterThan(
        lum('--color-background'),
      );

      // 亮字：text 對 background ≥ 7:1、text-muted ≥ 4.5:1；對最亮底（elevated）亦達標
      for (const base of [
        '--color-background',
        '--color-surface',
        '--color-surface-elevated',
      ] as const) {
        expect(
          contrast(vars['--color-text'], vars[base]),
          `${hex} text on ${base}`,
        ).toBeGreaterThanOrEqual(7);
        expect(
          contrast(vars['--color-text-muted'], vars[base]),
          `${hex} muted on ${base}`,
        ).toBeGreaterThanOrEqual(4.5);
      }

      // 白字實底合約不變：strong / hover / 等號鍵 / 品牌按鈕
      for (const key of [
        '--color-primary-strong',
        '--color-primary-hover',
        '--color-calc-equals',
        '--color-calc-equals-hover',
        '--color-calc-equals-active',
        '--color-brand-button-from',
        '--color-brand-button-to',
        '--color-brand-button-hover-from',
        '--color-brand-button-hover-to',
      ] as const) {
        expect(contrast(WHITE, vars[key]), `${hex} ${key} 白字`).toBeGreaterThanOrEqual(4.5);
      }

      // 有色文字（lightenToContrast 亮向 clamp）：對深底全部表面與主色深 tint ≥ 4.5:1
      for (const textKey of [
        '--color-primary-text',
        '--color-primary-dark',
        '--color-primary-darker',
        '--color-primary-on-surface',
        '--color-brand-text',
      ] as const) {
        for (const base of [
          '--color-background',
          '--color-surface',
          '--color-surface-elevated',
          '--color-primary-bg',
          '--color-primary-light',
        ] as const) {
          expect(
            contrast(vars[textKey], vars[base]),
            `${hex} ${textKey} on ${base}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }

      // 非文字圖形色：對深底全部表面 ≥ 3:1（WCAG 1.4.11）
      for (const key of ['--color-primary-ring', '--color-chart-line', '--color-accent'] as const) {
        for (const base of [
          '--color-background',
          '--color-surface',
          '--color-surface-elevated',
        ] as const) {
          expect(
            contrast(vars[key], vars[base]),
            `${hex} ${key} on ${base}`,
          ).toBeGreaterThanOrEqual(3);
        }
      }

      // 計算機鍵盤：各鍵面文字對自身鍵底 ≥ 4.5:1
      for (const [textKey, baseKey] of [
        ['--color-calc-number-text', '--color-calc-number'],
        ['--color-calc-operator-text', '--color-calc-operator'],
        ['--color-calc-function-text', '--color-calc-function'],
        ['--color-calc-equals-text', '--color-calc-equals'],
      ] as const) {
        expect(
          contrast(vars[textKey], vars[baseKey]),
          `${hex} ${textKey} on ${baseKey}`,
        ).toBeGreaterThanOrEqual(4.5);
      }

      // B1：狀態文字對深色底（surface/elevated/自身暗 tint bg）AA。
      // danger/danger-text 為派生覆寫（red-400 起點亮向 clamp）；
      // success/warning 文字為靜態回落值，一併鎖住現值防回退。
      const statusBases = ['--color-surface', '--color-surface-elevated'] as const;
      for (const key of ['--color-danger', '--color-danger-text'] as const) {
        for (const base of [...statusBases, '--color-danger-bg'] as const) {
          expect(
            contrast(vars[key], vars[base]),
            `${hex} ${key} on ${base}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
      for (const base of [...statusBases, '--color-success-bg'] as const) {
        expect(
          contrast(STATIC_SUCCESS_TEXT, vars[base]),
          `${hex} success-text on ${base}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
      for (const base of [...statusBases, '--color-warning-light'] as const) {
        expect(
          contrast(STATIC_WARNING_TEXT, vars[base]),
          `${hex} warning-text on ${base}`,
        ).toBeGreaterThanOrEqual(4.5);
      }

      // 深色調 brand-text-dark 反轉為亮字：對 background ≥ 4.5:1
      expect(
        contrast(vars['--color-brand-text-dark'], vars['--color-background']),
      ).toBeGreaterThanOrEqual(4.5);
    });
  },
);

describe('lightenToContrast / darkenToContrast 對偶 property 對稱（E7 wave-A）', () => {
  const targets = [3, 4.5, 7];
  const darkBases = DARK_TONES.map((tone) => hexToRgb(CUSTOM_BACKGROUND_TONES[tone].background));
  const lightBases = [hexToRgb('#FFFFFF'), hexToRgb('#F8FAFC'), hexToRgb('#F1F5F9')];

  function tripleOf(rgb: { r: number; g: number; b: number }): string {
    return `${rgb.r} ${rgb.g} ${rgb.b}`;
  }

  it.each(allInputs.map((hex) => ({ hex })))(
    '$hex：lighten 對深底 / darken 對淺底，任一目標對比皆有解且達標',
    ({ hex }) => {
      const hsl = rgbToHsl(hexToRgb(hex));
      for (const target of targets) {
        for (const base of darkBases) {
          const lightened = lightenToContrast(hsl, hsl.l, base, target);
          expect(
            contrast(tripleOf(lightened), tripleOf(base)),
            `${hex} lighten vs dark base target ${target}`,
          ).toBeGreaterThanOrEqual(target);
        }
        for (const base of lightBases) {
          const darkened = darkenToContrast(hsl, hsl.l, base, target);
          expect(
            contrast(tripleOf(darkened), tripleOf(base)),
            `${hex} darken vs light base target ${target}`,
          ).toBeGreaterThanOrEqual(target);
        }
      }
    },
  );

  it('對偶方向正確：lighten 不降明度、darken 不升明度（HSL L 單調性）', () => {
    for (const hex of boundaryHexColors) {
      const hsl = rgbToHsl(hexToRgb(hex));
      const lightened = lightenToContrast(hsl, hsl.l, hexToRgb('#000000'), 7);
      const darkened = darkenToContrast(hsl, hsl.l, hexToRgb('#FFFFFF'), 7);
      expect(rgbToHsl(lightened).l).toBeGreaterThanOrEqual(rgbToHsl(darkened).l - 1e-9);
      expect(relativeLuminance(tripleOf(lightened))).toBeGreaterThanOrEqual(
        relativeLuminance(tripleOf(darkened)) - 1e-9,
      );
    }
  });
});

describe('custom 主題演算行為合約', () => {
  it('--color-primary 為 identity 映射（與 bootstrap pre-paint 同構）', () => {
    for (const hex of allInputs) {
      expect(deriveCustomThemeCssVars(hex)['--color-primary']).toBe(hexToRgbTriple(hex));
      expect(hexToRgbTriple(hex)).toBe(hexToTriple(hex));
    }
    // 深色調下 primary 同為 identity（選色即所得，clamp 只作用於文字/表面鍵）
    for (const tone of DARK_TONES) {
      expect(deriveCustomThemeCssVars('#FF6B6B', tone)['--color-primary']).toBe('255 107 107');
    }
  });

  it('演算為純函式：同輸入同輸出且涵蓋 CUSTOM_THEME_CSS_VARS 全鍵（memoize 快取一致）', () => {
    for (const tone of ALL_TONES) {
      const first = deriveCustomThemeCssVars('#FF6B6B', tone);
      const second = deriveCustomThemeCssVars('#FF6B6B', tone);
      expect(second).toEqual(first);
      expect(Object.keys(first).sort()).toEqual([...CUSTOM_THEME_CSS_VARS].sort());
    }
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

  it('精選色票 16–24 個（wave-D 擴充）、格式合法且彼此可區辨', () => {
    expect(CUSTOM_PRIMARY_PRESETS.length).toBeGreaterThanOrEqual(16);
    expect(CUSTOM_PRIMARY_PRESETS.length).toBeLessThanOrEqual(24);
    CUSTOM_PRIMARY_PRESETS.forEach((preset) => expect(isValidHexColor(preset)).toBe(true));
    expect(new Set(CUSTOM_PRIMARY_PRESETS).size).toBe(CUSTOM_PRIMARY_PRESETS.length);
  });

  it('背景色調缺省＝純淨白（zen 現值，向後相容合約）', () => {
    expect(DEFAULT_CUSTOM_BACKGROUND_TONE).toBe('pure');
    expect(CUSTOM_BACKGROUND_TONES.pure.background).toBe('#F8FAFC');
    expect(CUSTOM_BACKGROUND_TONES.pure.surfaceSunken).toBe('#F1F5F9');
    const withDefault = deriveCustomThemeCssVars('#FF6B6B');
    const explicit = deriveCustomThemeCssVars('#FF6B6B', 'pure');
    expect(withDefault).toEqual(explicit);
  });

  it('isValidBackgroundTone 僅接受 allowlist 值（淺 5＋深 3，鍵集合 SSOT 同源）', () => {
    for (const tone of ALL_TONES) {
      expect(isValidBackgroundTone(tone), tone).toBe(true);
    }
    expect(isValidBackgroundTone('dark')).toBe(false);
    expect(isValidBackgroundTone('toString')).toBe(false);
    expect(isValidBackgroundTone('constructor')).toBe(false);
    expect(isValidBackgroundTone('')).toBe(false);
    expect(isValidBackgroundTone(null)).toBe(false);
    expect(isValidBackgroundTone(1)).toBe(false);
  });

  it('深色調鍵集合＝石墨/深夜/純黑（Toss 式深色校準選定色）', () => {
    expect(DARK_TONES.sort()).toEqual(['black', 'graphite', 'midnight']);
    expect(CUSTOM_BACKGROUND_TONES.graphite.background).toBe('#1E232A');
    expect(CUSTOM_BACKGROUND_TONES.midnight.background).toBe('#0F172A');
    expect(CUSTOM_BACKGROUND_TONES.black.background).toBe('#000000');
    for (const tone of ['graphite', 'midnight', 'black'] as const) {
      expect(isDarkBackgroundTone(tone)).toBe(true);
    }
    for (const tone of LIGHT_TONES) {
      expect(isDarkBackgroundTone(tone)).toBe(false);
    }
  });

  it('全部背景調 background 彼此可區辨且格式合法', () => {
    const values = ALL_TONES.map((tone) => CUSTOM_BACKGROUND_TONES[tone].background);
    values.forEach((hex) => expect(isValidHexColor(hex)).toBe(true));
    expect(new Set(values).size).toBe(values.length);
    // 淺色調沿用手調 sunken 對；深色調由演算亮階疊升（不設靜態 sunken）
    for (const tone of LIGHT_TONES) {
      expect(CUSTOM_BACKGROUND_TONES[tone].surfaceSunken).toBeDefined();
    }
    for (const tone of DARK_TONES) {
      expect(CUSTOM_BACKGROUND_TONES[tone].surfaceSunken).toBeUndefined();
    }
  });
});

describe('零變化期望表 ↔ index.css custom 靜態區塊同步（三份手工副本防漂移）', () => {
  // 三份副本鏈：index.css [data-style='custom'] 區塊 ↔ 本測試期望表 ↔ derive 淺色輸出
  //（後兩者由上方「淺色調必須維持 zen 靜態值」斷言鎖定）。本 describe 補 css ↔ 期望表這段，
  // 手法比照 theme-style-definitions-css-sync.test.ts：parse 區塊值直接比對。
  const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf-8');
  const blockStarts = [...css.matchAll(/\[data-style='([\w-]+)'\]\s*\{/g)];
  const customStart = blockStarts.find((match) => match[1] === 'custom');
  const customIndex = blockStarts.indexOf(customStart!);
  const customBlock = css.slice(
    customStart?.index ?? 0,
    blockStarts[customIndex + 1]?.index ?? css.length,
  );

  function cssVarValue(name: string): string | undefined {
    return new RegExp(`${name}:\\s*([0-9]+ [0-9]+ [0-9]+)\\s*;`).exec(customBlock)?.[1];
  }

  it('custom 靜態區塊存在且可解析', () => {
    expect(customStart).toBeDefined();
    expect(customBlock.length).toBeGreaterThan(100);
  });

  it.each(Object.entries(EXPECTED_LIGHT_STATIC).map(([key, value]) => ({ key, value })))(
    '$key：css 靜態值必須等於期望表（$value）',
    ({ key, value }) => {
      expect(cssVarValue(key), `${key} 在 [data-style='custom'] 區塊缺失或非數值三元組`).toBe(
        value,
      );
    },
  );

  it('pure 背景調對必須等於 css 靜態區塊的 background / surface-sunken', () => {
    expect(cssVarValue('--color-background')).toBe(
      hexToTriple(CUSTOM_BACKGROUND_TONES.pure.background),
    );
    expect(cssVarValue('--color-surface-sunken')).toBe(
      hexToTriple(CUSTOM_BACKGROUND_TONES.pure.surfaceSunken ?? ''),
    );
  });

  it('深色 success/warning 靜態回落值必須等於 css 區塊現值（B1 鎖定基礎）', () => {
    expect(cssVarValue('--color-success-text')).toBe(STATIC_SUCCESS_TEXT);
    expect(cssVarValue('--color-warning')).toBe(STATIC_WARNING_TEXT);
  });
});
