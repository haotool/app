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
  PRIMARY_GATE_GRAPHIC_MIN_CONTRAST,
  PRIMARY_GATE_WARN_CONTRAST,
  backgroundToneValueHex,
  choosePrimaryForeground,
  continuousToneHexAtPosition,
  darkenToContrast,
  deriveCustomThemeCssVars,
  evaluatePrimaryContrastGate,
  hexToRgbTriple,
  isDarkBackgroundTone,
  isDarkBackgroundToneValue,
  isValidBackgroundTone,
  isValidBackgroundToneValue,
  isValidHexColor,
  lightenToContrast,
  normalizeContinuousToneHex,
  rgbToHsl,
  hexToRgb,
  sanitizeHexInput,
  sliderPositionForToneValue,
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

  it('精選色票 8–12 格（E7 wave-C 收斂，QA-I #6）、格式合法且彼此可區辨', () => {
    expect(CUSTOM_PRIMARY_PRESETS.length).toBeGreaterThanOrEqual(8);
    expect(CUSTOM_PRIMARY_PRESETS.length).toBeLessThanOrEqual(12);
    CUSTOM_PRIMARY_PRESETS.forEach((preset) => expect(isValidHexColor(preset)).toBe(true));
    expect(new Set(CUSTOM_PRIMARY_PRESETS).size).toBe(CUSTOM_PRIMARY_PRESETS.length);
  });

  it('精選色票飽和度校準：任一預設背景調下皆不觸發近白/近黑 gate（QA-I #6 排除近白票）', () => {
    for (const preset of CUSTOM_PRIMARY_PRESETS) {
      for (const tone of ALL_TONES) {
        expect(
          evaluatePrimaryContrastGate(preset, tone).isLowContrast,
          `${preset} on ${tone} 不應觸發 gate`,
        ).toBe(false);
      }
    }
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

describe('連續 tone 亮度滑桿 property 守門（E7 wave-C：任意 L 值 AA 不破）', () => {
  // 滑桿全域抽樣（0＝最深、1＝最淺；含深/淺域邊界與死域跳點兩側）。
  const SLIDER_POSITIONS = [0, 0.1, 0.25, 0.4, 0.499, 0.5, 0.6, 0.75, 0.9, 1] as const;
  // 色相/飽和度來源：全部 preset tone background＋高飽和/灰階邊界色。
  const HUE_SOURCES = [
    ...ALL_TONES.map((tone) => CUSTOM_BACKGROUND_TONES[tone].background),
    '#FF0000',
    '#FFFF00',
    '#00FFFF',
    '#808080',
  ];

  /** 深色 hex tone 的 AA 斷言（比照 preset 深色調合約子集）。 */
  function assertDarkToneAA(hex: string, toneHex: string): void {
    const vars = deriveCustomThemeCssVars(hex, toneHex);
    expect(vars['--color-background']).toBe(hexToTriple(toneHex));
    for (const base of [
      '--color-background',
      '--color-surface',
      '--color-surface-elevated',
    ] as const) {
      expect(
        contrast(vars['--color-text'], vars[base]),
        `${hex}|${toneHex} text on ${base}`,
      ).toBeGreaterThanOrEqual(7);
      expect(
        contrast(vars['--color-text-muted'], vars[base]),
        `${hex}|${toneHex} muted on ${base}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
    for (const key of ['--color-primary-strong', '--color-primary-hover'] as const) {
      expect(contrast(WHITE, vars[key]), `${hex}|${toneHex} ${key} 白字`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
    for (const textKey of ['--color-primary-text', '--color-primary-on-surface'] as const) {
      for (const base of [
        '--color-background',
        '--color-surface',
        '--color-surface-elevated',
        '--color-primary-bg',
        '--color-primary-light',
      ] as const) {
        expect(
          contrast(vars[textKey], vars[base]),
          `${hex}|${toneHex} ${textKey} on ${base}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
    for (const key of ['--color-primary-ring', '--color-chart-line'] as const) {
      for (const base of ['--color-background', '--color-surface-elevated'] as const) {
        expect(
          contrast(vars[key], vars[base]),
          `${hex}|${toneHex} ${key} on ${base}`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  }

  /** 淺色 hex tone 的 AA 斷言（比照 preset 淺色調合約子集；text/muted 為 zen 靜態值）。 */
  function assertLightToneAA(hex: string, toneHex: string): void {
    const vars = deriveCustomThemeCssVars(hex, toneHex);
    const toneBackground = vars['--color-background'];
    const toneSunken = vars['--color-surface-sunken'];
    expect(toneBackground).toBe(hexToTriple(toneHex));
    expect(
      contrast(BASE_TEXT_MUTED, toneBackground),
      `${hex}|${toneHex} muted on background`,
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(BASE_TEXT, toneSunken),
      `${hex}|${toneHex} text on sunken`,
    ).toBeGreaterThanOrEqual(4.5);
    for (const key of ['--color-primary-strong', '--color-primary-hover'] as const) {
      expect(contrast(WHITE, vars[key]), `${hex}|${toneHex} ${key} 白字`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
    for (const textKey of ['--color-primary-text', '--color-primary-on-surface'] as const) {
      for (const base of [WHITE, vars['--color-primary-bg'], toneBackground, toneSunken]) {
        expect(
          contrast(vars[textKey], base),
          `${hex}|${toneHex} ${textKey} AA`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
    for (const key of ['--color-primary-ring', '--color-chart-line'] as const) {
      for (const base of [WHITE, toneBackground, toneSunken]) {
        expect(contrast(vars[key], base), `${hex}|${toneHex} ${key} 圖形`).toBeGreaterThanOrEqual(
          3,
        );
      }
    }
  }

  it.each(HUE_SOURCES.map((source) => ({ source })))(
    '色相源 $source：滑桿全位置輸出合法 hex、normalize 冪等、深/淺分域正確',
    ({ source }) => {
      for (const position of SLIDER_POSITIONS) {
        const toneHex = continuousToneHexAtPosition(position, source);
        expect(isValidHexColor(toneHex), `${source}@${position}`).toBe(true);
        // normalize 冪等：滑桿輸出已在可解域內。
        expect(normalizeContinuousToneHex(toneHex)).toBe(toneHex);
        // 前半段深域、後半段淺域（死域不對外曝露）。
        expect(isDarkBackgroundToneValue(toneHex), `${source}@${position} 分域`).toBe(
          position < 0.5,
        );
      }
    },
  );

  it.each(allInputs.map((hex) => ({ hex })))(
    '$hex × 滑桿連續 L 抽樣：任意位置派生全組變數皆守 AA',
    ({ hex }) => {
      for (const position of SLIDER_POSITIONS) {
        const toneHex = continuousToneHexAtPosition(
          position,
          CUSTOM_BACKGROUND_TONES.pure.background,
        );
        if (position < 0.5) {
          assertDarkToneAA(hex, toneHex);
        } else {
          assertLightToneAA(hex, toneHex);
        }
      }
    },
  );

  it('任意 hex 正規化後（含 WCAG 死域中間灰）派生皆守 AA（總函式保證）', () => {
    for (const raw of ['#888888', '#5A6472', '#B0B6BF', '#404040', '#C81E1E', ...allInputs]) {
      const normalized = normalizeContinuousToneHex(raw);
      expect(isValidHexColor(normalized), raw).toBe(true);
      expect(normalizeContinuousToneHex(normalized), `${raw} 冪等`).toBe(normalized);
      if (isDarkBackgroundToneValue(normalized)) {
        assertDarkToneAA(DEFAULT_CUSTOM_PRIMARY, normalized);
      } else {
        assertLightToneAA(DEFAULT_CUSTOM_PRIMARY, normalized);
      }
    }
  });

  it('滑桿位置反映射（sliderPositionForToneValue）：值域 [0,1] 且與正映射近似互逆', () => {
    for (const tone of ALL_TONES) {
      const position = sliderPositionForToneValue(tone);
      expect(position).toBeGreaterThanOrEqual(0);
      expect(position).toBeLessThanOrEqual(1);
      expect(position < 0.5, `${tone} 深/淺半場`).toBe(isDarkBackgroundTone(tone));
    }
    for (const position of SLIDER_POSITIONS) {
      const toneHex = continuousToneHexAtPosition(
        position,
        CUSTOM_BACKGROUND_TONES.pure.background,
      );
      // 容差 0.12：近白域 hex 捨入使 HSL 飽和度不穩定，反映射僅需落點鄰近（thumb 定位用）。
      expect(
        Math.abs(sliderPositionForToneValue(toneHex) - position),
        `round-trip @${position}`,
      ).toBeLessThanOrEqual(0.12);
    }
  });

  it('域邊界歸屬（review 修正）：深 tone 反映射 ≤0.49，UI 整數往返分域不變（原地觸碰零跳變）', () => {
    // 深域上緣構造值：中間灰死域 hex 經 normalize 夾至深域上緣（未 clamp 前反映射會落 0.5）。
    const darkUpperEdge = normalizeContinuousToneHex('#3A424D');
    expect(isDarkBackgroundToneValue(darkUpperEdge)).toBe(true);
    const darkValues = [
      ...DARK_TONES,
      '#10141A',
      darkUpperEdge,
      continuousToneHexAtPosition(0.49, CUSTOM_BACKGROUND_TONES.pure.background),
    ];
    for (const tone of darkValues) {
      const position = sliderPositionForToneValue(tone);
      expect(position, `${tone} 深 tone 反映射須在深域內側`).toBeLessThanOrEqual(0.49);
      // UI 整數化（thumb 值 = round(pos*100)）後重新正映射仍為深色。
      const uiPosition = Math.round(position * 100) / 100;
      expect(
        isDarkBackgroundToneValue(
          continuousToneHexAtPosition(uiPosition, backgroundToneValueHex(tone)),
        ),
        `${tone} UI 往返仍為深色`,
      ).toBe(true);
    }
    // 淺 tone：0.5 即淺域起點，UI 往返仍為淺色（歸屬明確、無鏡像跳變）。
    for (const tone of LIGHT_TONES) {
      const position = sliderPositionForToneValue(tone);
      expect(position).toBeGreaterThanOrEqual(0.5);
      const uiPosition = Math.round(position * 100) / 100;
      expect(
        isDarkBackgroundToneValue(
          continuousToneHexAtPosition(uiPosition, backgroundToneValueHex(tone)),
        ),
        `${tone} UI 往返仍為淺色`,
      ).toBe(false);
    }
  });

  it('backgroundToneValueHex：enum 直出 SSOT、hex 先正規化、無效值回退 pure', () => {
    for (const tone of ALL_TONES) {
      expect(backgroundToneValueHex(tone)).toBe(CUSTOM_BACKGROUND_TONES[tone].background);
    }
    expect(backgroundToneValueHex('#0F172A')).toBe(normalizeContinuousToneHex('#0F172A'));
    expect(backgroundToneValueHex('not-a-tone')).toBe(CUSTOM_BACKGROUND_TONES.pure.background);
  });

  it('isValidBackgroundToneValue：enum | #RRGGBB 皆合法；其餘拒絕（persist schema 擴充合約）', () => {
    for (const tone of ALL_TONES) {
      expect(isValidBackgroundToneValue(tone), tone).toBe(true);
    }
    expect(isValidBackgroundToneValue('#1E232A')).toBe(true);
    expect(isValidBackgroundToneValue('#f8fafc')).toBe(true);
    expect(isValidBackgroundToneValue('dark')).toBe(false);
    expect(isValidBackgroundToneValue('#FFF')).toBe(false);
    expect(isValidBackgroundToneValue(null)).toBe(false);
    expect(isValidBackgroundToneValue(1)).toBe(false);
  });

  it('derive 對 hex tone 與 enum tone 共用同一快取簽章格式（大小寫不敏感）', () => {
    const lower = deriveCustomThemeCssVars('#FF6B6B', '#1e232a');
    const upper = deriveCustomThemeCssVars('#FF6B6B', '#1E232A');
    expect(upper).toEqual(lower);
    // enum 派生規則零改動：graphite enum 與其 background hex 的深色派生完全一致。
    expect(deriveCustomThemeCssVars('#FF6B6B', '#1E232A')).toEqual(
      deriveCustomThemeCssVars('#FF6B6B', 'graphite'),
    );
  });
});

describe('近白/近黑主色 gate property 守門（E7 wave-B，QA-I #2＋#670 S3）', () => {
  it('warn 門檻（2:1）必須嚴格高於圖形面最低要求（1.5:1）——違規輸入必被 gate 攔截', () => {
    expect(PRIMARY_GATE_WARN_CONTRAST).toBe(2);
    expect(PRIMARY_GATE_GRAPHIC_MIN_CONTRAST).toBe(1.5);
    expect(PRIMARY_GATE_WARN_CONTRAST).toBeGreaterThan(PRIMARY_GATE_GRAPHIC_MIN_CONTRAST);
  });

  describe.each(ALL_TONES.map((tone) => ({ tone })))('背景調 $tone × 任意輸入色', ({ tone }) => {
    const toneBackground = hexToTriple(CUSTOM_BACKGROUND_TONES[tone].background);
    const isDark = isDarkBackgroundTone(tone);

    it.each(allInputs.map((hex) => ({ hex })))(
      '$hex：ratio 正確、警告態 ⇔ 建議色存在、建議色達標且方向鏡像',
      ({ hex }) => {
        const gate = evaluatePrimaryContrastGate(hex, tone);

        // ratio 與獨立對比實作一致。
        expect(gate.ratio).toBeCloseTo(contrast(hexToTriple(hex), toneBackground), 6);

        // gate 通過 ⇒ raw primary 圖形面對 background 必 ≥ 1.5:1（warn 門檻 2 > 1.5）。
        if (!gate.isLowContrast) {
          expect(gate.suggestedPrimary).toBeNull();
          expect(gate.ratio).toBeGreaterThanOrEqual(PRIMARY_GATE_GRAPHIC_MIN_CONTRAST);
          return;
        }

        // 警告態：對比 < 2 且必附一鍵採用建議色。
        expect(gate.ratio).toBeLessThan(PRIMARY_GATE_WARN_CONTRAST);
        expect(gate.suggestedPrimary).not.toBeNull();
        const suggested = gate.suggestedPrimary ?? '';
        expect(isValidHexColor(suggested)).toBe(true);

        // 建議色為最近達標色：對當前背景調 ≥ 2:1（圖形面 1.5:1 隨之滿足）。
        expect(
          contrast(hexToTriple(suggested), toneBackground),
          `${hex} 建議色 ${suggested} on ${tone}`,
        ).toBeGreaterThanOrEqual(PRIMARY_GATE_WARN_CONTRAST);

        // 方向鏡像：淺調 darken（近白 gate）、深調 lighten（近黑 gate，#670 S3）。
        // 容差 1e-3：hex ↔ HSL 往返捨入誤差。
        const inputLum = relativeLuminance(hexToTriple(hex));
        const suggestedLum = relativeLuminance(hexToTriple(suggested));
        if (isDark) {
          expect(suggestedLum, `${hex} 深調建議色應更亮`).toBeGreaterThanOrEqual(inputLum - 1e-3);
        } else {
          expect(suggestedLum, `${hex} 淺調建議色應更深`).toBeLessThanOrEqual(inputLum + 1e-3);
        }
      },
    );
  });

  it('代表案例：近白 #F8FAFC × 純淨白警告、近黑 #0A0A0A × 深夜警告（鏡像機制）', () => {
    const nearWhite = evaluatePrimaryContrastGate('#F8FAFC', 'pure');
    expect(nearWhite.isLowContrast).toBe(true);
    expect(nearWhite.suggestedPrimary).not.toBeNull();

    const nearBlack = evaluatePrimaryContrastGate('#0A0A0A', 'midnight');
    expect(nearBlack.isLowContrast).toBe(true);
    expect(nearBlack.suggestedPrimary).not.toBeNull();

    // 品牌藍在預設背景調不觸發警告（不硬擋、不誤報）。
    expect(evaluatePrimaryContrastGate(DEFAULT_CUSTOM_PRIMARY, 'pure').isLowContrast).toBe(false);
    // 近白主色在深色調反而通過（gate 依「當前背景調」評估）。
    expect(evaluatePrimaryContrastGate('#F8FAFC', 'midnight').isLowContrast).toBe(false);
  });

  it('無效輸入回退預設自訂主色（與 derive 行為一致）', () => {
    expect(evaluatePrimaryContrastGate('not-a-color', 'pure')).toEqual(
      evaluatePrimaryContrastGate(DEFAULT_CUSTOM_PRIMARY, 'pure'),
    );
  });
});

describe('sanitizeHexInput 清洗（E7 wave-B，QA-I #4）', () => {
  it('去 #、空白與非 hex 字元，統一大寫並截 6 碼', () => {
    expect(sanitizeHexInput('F8FAFC')).toBe('F8FAFC');
    expect(sanitizeHexInput('#3182f6 ')).toBe('3182F6');
    expect(sanitizeHexInput('  #3182F6')).toBe('3182F6');
    expect(sanitizeHexInput('#3182F6AB')).toBe('3182F6');
    expect(sanitizeHexInput('rgb(49,130,246)')).toBe('B49130');
    expect(sanitizeHexInput('xyz')).toBe('');
    expect(sanitizeHexInput('')).toBe('');
  });

  it('清洗滿 6 碼即為合法 #RRGGBB（與 isValidHexColor 合約閉環）', () => {
    for (const dirty of ['f8fafc', '#F8FAFC', ' #f8FaFc ', 'F8FAFCFF']) {
      const cleaned = sanitizeHexInput(dirty);
      expect(cleaned).toHaveLength(6);
      expect(isValidHexColor(`#${cleaned}`)).toBe(true);
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
