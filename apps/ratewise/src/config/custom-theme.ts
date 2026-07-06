/**
 * Custom 主題主色演算 SSOT（E2 自訂主題色）
 *
 * @description 由單一使用者主色（#RRGGBB）導出整組 primary 系列 CSS 變數。
 *              底座＝zen 白底韓系骨架（background/surface/text 不變），
 *              演算「主色相關」鍵集合：primary、primaryStrong、legacy 9 鍵、圖表 3 色，
 *              以及 wave-B 跟色鍵（secondary/accent/等號鍵/品牌按鈕/頁面漸層 via）。
 *              演算內建 WCAG AA clamp：極淺/極豔輸入色自動加深 strong 與文字配色至對比達標。
 *
 * @architecture 依 .claude/prds/ratewise-e2-custom-theme-design.md 架構裁決：
 *               custom 不進 STYLE_DEFINITIONS；靜態 fallback 由 index.css
 *               [data-style='custom'] 區塊（zen 完整複製）承擔；
 *               本模組為演算唯一來源，applyTheme 與測試共同消費。
 *
 * @created 2026-07-05
 */

/** 預設自訂主色（品牌藍，與 zen primary 同值）。 */
export const DEFAULT_CUSTOM_PRIMARY = '#3182F6';

/** 背景色調三選一（wave-C）：只切換 background / surface-sunken 淡色對。 */
export type CustomBackgroundTone = 'pure' | 'warm' | 'cool';

/** 預設背景色調（zen 現值；舊持久化資料缺省時向後相容）。 */
export const DEFAULT_CUSTOM_BACKGROUND_TONE: CustomBackgroundTone = 'pure';

/**
 * 背景色調 SSOT（wave-C AA 守門選值）：
 * - background：--color-text（slate-900）與 --color-text-muted（slate-500）對其 ≥ 4.5:1
 * - surfaceSunken：--color-text 對其 ≥ 4.5:1（比照 zen 現值 slate-100 的既有合約）
 */
export const CUSTOM_BACKGROUND_TONES: Record<
  CustomBackgroundTone,
  { background: string; surfaceSunken: string }
> = {
  // 純淨白＝zen 現值（slate-50 / slate-100）。
  pure: { background: '#F8FAFC', surfaceSunken: '#F1F5F9' },
  // 暖白（stone 系暖調，muted 對比 4.54:1）。
  warm: { background: '#FDF9F3', surfaceSunken: '#F6F0E4' },
  // 冷白（slate/blue 系冷調，muted 對比 4.53:1）。
  cool: { background: '#F5FAFF', surfaceSunken: '#EAF1F8' },
};

/** 僅接受三種背景色調值（持久化 allowlist 驗證）。 */
export function isValidBackgroundTone(value: unknown): value is CustomBackgroundTone {
  return value === 'pure' || value === 'warm' || value === 'cool';
}

/**
 * 精選色票（韓系 fintech 調性：Toss 藍系/薄荷/珊瑚/紫羅蘭…）。
 * 色票彼此可區辨；文字對比由 deriveCustomThemeCssVars 的 AA clamp 保證（測試守門）。
 */
export const CUSTOM_PRIMARY_PRESETS = [
  '#3182F6', // Toss 藍
  '#0EA5E9', // 天空藍
  '#14B8A6', // 薄荷
  '#22C55E', // 清新綠
  '#F59E0B', // 琥珀
  '#FF6B6B', // 珊瑚
  '#EC4899', // 櫻花粉
  '#8B5CF6', // 紫羅蘭
  '#6366F1', // 靛藍
  '#64748B', // 石墨
] as const;

/** applyTheme 於 custom 模式寫入 / 切回內建主題時清除的 inline CSS 變數全集。 */
export const CUSTOM_THEME_CSS_VARS = [
  // wave-C：背景色調對（純淨白/暖白/冷白），寫入與清除共用本常數集合。
  '--color-background',
  '--color-surface-sunken',
  '--color-primary',
  '--color-primary-strong',
  // 文字消費面唯一合法 primary 錨點（issue #632）：custom 演算給 AA clamp 值。
  '--color-primary-on-surface',
  '--color-primary-bg',
  '--color-primary-light',
  '--color-primary-hover',
  '--color-primary-active',
  '--color-primary-text-light',
  '--color-primary-ring',
  '--color-primary-dark',
  '--color-primary-darker',
  '--color-primary-text',
  '--color-chart-line',
  '--color-chart-area-top',
  '--color-chart-area-bottom',
  // E2 wave-B（S2）：非演算鍵跟色——等號鍵/輔色/品牌按鈕/頁面漸層不再停留 zen 藍。
  '--color-secondary',
  '--color-accent',
  '--color-calc-equals',
  '--color-calc-equals-hover',
  '--color-calc-equals-active',
  '--color-brand-button-from',
  '--color-brand-button-to',
  '--color-brand-button-hover-from',
  '--color-brand-button-hover-to',
  '--color-brand-text',
  '--color-page-gradient-via',
] as const;

export type CustomThemeCssVar = (typeof CUSTOM_THEME_CSS_VARS)[number];

/** 導出結果：CSS 變數名 → 'R G B' 空格分隔三元組（Tailwind rgb(var()) 相容格式）。 */
export type CustomThemeCssVarMap = Record<CustomThemeCssVar, string>;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** 僅接受 #RRGGBB 六碼 hex（與 bootstrap allowlist 驗證一致）。 */
export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value);
}

export function hexToRgb(hex: string): Rgb {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const channel = (value: number) => value.toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

/** 'R G B' 空格分隔三元組（index.css 變數值格式）。 */
export function rgbToTriple({ r, g, b }: Rgb): string {
  return `${r} ${g} ${b}`;
}

/** hex → 'R G B'（bootstrap pre-paint 與 applyTheme 對 --color-primary 的共同映射）。 */
export function hexToRgbTriple(hex: string): string {
  return rgbToTriple(hexToRgb(hex));
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) {
    return { h: 0, s: 0, l };
  }
  const delta = max - min;
  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let h: number;
  if (max === rn) {
    h = ((gn - bn) / delta + (gn < bn ? 6 : 0)) / 6;
  } else if (max === gn) {
    h = ((bn - rn) / delta + 2) / 6;
  } else {
    h = ((rn - gn) / delta + 4) / 6;
  }
  return { h: h * 360, s, l };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hn = (((h % 360) + 360) % 360) / 360;
  if (s === 0) {
    const grey = Math.round(l * 255);
    return { r: grey, g: grey, b: grey };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hueToChannel = (t: number): number => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };
  return {
    r: Math.round(hueToChannel(hn + 1 / 3) * 255),
    g: Math.round(hueToChannel(hn) * 255),
    b: Math.round(hueToChannel(hn - 1 / 3) * 255),
  };
}

/** WCAG 2.x 相對亮度。 */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const [rl, gl, bl] = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (rl ?? 0) * 0.2126 + (gl ?? 0) * 0.7152 + (bl ?? 0) * 0.0722;
}

/** WCAG 2.x 對比值。 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const DARK_FOREGROUND: Rgb = { r: 2, g: 6, b: 23 }; // slate-950（offline 生成器同值）

/**
 * 亮度擇色法（與 scripts/generate-offline-html.mjs 的 choosePrimaryForeground 同法）：
 * 白/深自動二選一，回傳對比較高者。
 */
export function choosePrimaryForeground(backgroundHex: string): '#FFFFFF' | '#020617' {
  const background = hexToRgb(backgroundHex);
  return contrastRatio(WHITE, background) >= contrastRatio(DARK_FOREGROUND, background)
    ? '#FFFFFF'
    : '#020617';
}

/** 以固定色相/飽和度取指定明度的色階。 */
function shadeAt(hsl: Hsl, lightness: number): Rgb {
  return hslToRgb({ h: hsl.h, s: hsl.s, l: lightness });
}

/**
 * AA clamp：自 startLightness 起逐步降低明度，直到與 against 的對比 ≥ target。
 * 明度趨近 0（黑）時對白/近白背景對比必達 21/4.5 以上，故在全 hex 色域必有解。
 */
function darkenToContrast(hsl: Hsl, startLightness: number, against: Rgb, target: number): Rgb {
  let lightness = startLightness;
  let color = shadeAt(hsl, lightness);
  while (contrastRatio(color, against) < target && lightness > 0) {
    lightness = Math.max(0, lightness - 0.01);
    color = shadeAt(hsl, lightness);
  }
  return color;
}

/**
 * 由使用者主色（＋背景色調）導出整組 custom 主題 CSS 變數。
 *
 * 導出規則（zen 階差對應 + AA clamp）：
 * - primary：使用者原色（選色即所得；bootstrap pre-paint 同值）
 * - bg/light/active/text-light：固定明度階（0.97/0.93/0.78/0.68）＋使用者色相/飽和度
 * - ring/chart 三色：非文字圖形色，clamp 至對白底對比 ≥ 3:1（WCAG 1.4.11）
 * - hover：zen 階差（primary 與 strong 明度中點），clamp 至白字對比 ≥ 4.5:1
 * - strong：主色加深至白字對比 ≥ 4.5:1（AA 硬規格）
 * - on-surface：文字消費面的 primary 錨點（#632 合約），與 text 同 clamp（對最深底色 ≥ 4.5:1）
 * - text/dark/darker：有色文字，clamp 至對最深底色（含背景調對）對比 ≥ 4.5:1，並維持遞深階序
 * - background/surface-sunken：由背景色調三選一（CUSTOM_BACKGROUND_TONES SSOT）直出
 */
export function deriveCustomThemeCssVars(
  primaryHex: string,
  backgroundTone: CustomBackgroundTone = DEFAULT_CUSTOM_BACKGROUND_TONE,
): CustomThemeCssVarMap {
  const hex = isValidHexColor(primaryHex) ? primaryHex : DEFAULT_CUSTOM_PRIMARY;
  const base = hexToRgb(hex);
  const hsl = rgbToHsl(base);
  const tone = CUSTOM_BACKGROUND_TONES[backgroundTone];

  const bg = shadeAt(hsl, 0.97);
  const light = shadeAt(hsl, 0.93);
  const active = shadeAt(hsl, 0.78);
  const textLight = shadeAt(hsl, 0.68);

  // wave-C：有色文字/圖形錨點取「primary bg tint 與背景調對」中最深者，
  // 保證任一背景調下文字（4.5:1）與圖形（3:1）皆守門。
  const toneBackground = hexToRgb(tone.background);
  const toneSunken = hexToRgb(tone.surfaceSunken);
  const textAnchor = [bg, toneBackground, toneSunken].reduce((darkest, candidate) =>
    relativeLuminance(candidate) < relativeLuminance(darkest) ? candidate : darkest,
  );

  // 非文字圖形色（focus ring / 圖表線）：對最深底色至少 3:1。
  const vivid = darkenToContrast(hsl, hsl.l, textAnchor, 3);

  // 白字實底：strong 為 AA 錨點；hover 取 primary 與 strong 明度中點後再 clamp。
  const strong = darkenToContrast(hsl, Math.min(hsl.l, 0.482), WHITE, 4.5);
  const strongL = rgbToHsl(strong).l;
  const hover = darkenToContrast(hsl, Math.min(hsl.l, (hsl.l + strongL) / 2), WHITE, 4.5);

  // 有色文字：對最深底色（bg tint / 背景調 background / surface-sunken）達 AA，
  // 同時涵蓋白底與 light 底（皆較 textAnchor 淺）。
  const text = darkenToContrast(hsl, hsl.l, textAnchor, 4.5);
  const dark = darkenToContrast(hsl, Math.min(hsl.l, 0.404), textAnchor, 4.5);
  const darker = darkenToContrast(hsl, Math.min(hsl.l, 0.33), textAnchor, 5.5);

  return {
    '--color-background': hexToRgbTriple(tone.background),
    '--color-surface-sunken': hexToRgbTriple(tone.surfaceSunken),
    '--color-primary': rgbToTriple(base),
    '--color-primary-strong': rgbToTriple(strong),
    '--color-primary-on-surface': rgbToTriple(text),
    '--color-primary-bg': rgbToTriple(bg),
    '--color-primary-light': rgbToTriple(light),
    '--color-primary-hover': rgbToTriple(hover),
    '--color-primary-active': rgbToTriple(active),
    '--color-primary-text-light': rgbToTriple(textLight),
    '--color-primary-ring': rgbToTriple(vivid),
    '--color-primary-dark': rgbToTriple(dark),
    '--color-primary-darker': rgbToTriple(darker),
    '--color-primary-text': rgbToTriple(text),
    '--color-chart-line': rgbToTriple(vivid),
    '--color-chart-area-top': rgbToTriple(vivid),
    '--color-chart-area-bottom': rgbToTriple(vivid),
    // S2 跟色：輔色/圖形色沿用非文字 vivid（≥3:1），白字表面沿用 AA 錨點階序。
    '--color-secondary': rgbToTriple(dark),
    '--color-accent': rgbToTriple(vivid),
    '--color-calc-equals': rgbToTriple(strong),
    '--color-calc-equals-hover': rgbToTriple(dark),
    '--color-calc-equals-active': rgbToTriple(darker),
    '--color-brand-button-from': rgbToTriple(strong),
    '--color-brand-button-to': rgbToTriple(strong),
    '--color-brand-button-hover-from': rgbToTriple(dark),
    '--color-brand-button-hover-to': rgbToTriple(dark),
    '--color-brand-text': rgbToTriple(text),
    '--color-page-gradient-via': rgbToTriple(light),
  };
}
