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

/** 背景色調八選一（wave-C 三淺調 + wave-D 薄荷/玫瑰 + E7 wave-A 三深檔）。 */
export type CustomBackgroundTone =
  | 'pure'
  | 'warm'
  | 'cool'
  | 'mint'
  | 'rose'
  | 'graphite'
  | 'midnight'
  | 'black';

/** 預設背景色調（zen 現值；舊持久化資料缺省時向後相容）。 */
export const DEFAULT_CUSTOM_BACKGROUND_TONE: CustomBackgroundTone = 'pure';

interface BackgroundToneDefinition {
  background: string;
  /** 淺色調手調 sunken 對；深色調由 background 亮階疊升派生（PM 簡報 3.2），無此欄。 */
  surfaceSunken?: string;
  appearance: 'light' | 'dark';
}

/**
 * 背景色調 SSOT：
 * - 淺色調（wave-C AA 守門選值）：--color-text / --color-text-muted 對 background ≥ 4.5:1，
 *   --color-text 對 surfaceSunken ≥ 4.5:1（比照 zen 現值 slate-100 的既有合約）。
 * - 深色調（E7 wave-A，Toss 式深色校準）：只存 background 選定色，
 *   整套 neutral scale 由 deriveCustomThemeCssVars 亮階疊升派生（AA property 測試守門）。
 */
export const CUSTOM_BACKGROUND_TONES: Record<CustomBackgroundTone, BackgroundToneDefinition> = {
  // 純淨白＝zen 現值（slate-50 / slate-100）。
  pure: { background: '#F8FAFC', surfaceSunken: '#F1F5F9', appearance: 'light' },
  // 暖白（stone 系暖調，muted 對比 4.54:1）。
  warm: { background: '#FDF9F3', surfaceSunken: '#F6F0E4', appearance: 'light' },
  // 冷白（slate/blue 系冷調，muted 對比 4.53:1）。
  cool: { background: '#F5FAFF', surfaceSunken: '#EAF1F8', appearance: 'light' },
  // 薄荷白（green 系清爽調，muted 對比 4.53:1）。
  mint: { background: '#F4FBF7', surfaceSunken: '#E9F4EE', appearance: 'light' },
  // 玫瑰白（rose 系柔和調，muted 對比 4.56:1）。
  rose: { background: '#FDF9FA', surfaceSunken: '#F8EFF1', appearance: 'light' },
  // 石墨（冷灰深底，低飽和藍灰）。
  graphite: { background: '#1E232A', appearance: 'dark' },
  // 深夜（navy 深藍底，slate-900 同值）。
  midnight: { background: '#0F172A', appearance: 'dark' },
  // 純黑（OLED 純黑底，surface 以灰階疊升）。
  black: { background: '#000000', appearance: 'dark' },
};

/** 深色背景調判定（鍵集合 SSOT 派生，供 UI 與 bootstrap 分流）。 */
export function isDarkBackgroundTone(tone: CustomBackgroundTone): boolean {
  return CUSTOM_BACKGROUND_TONES[tone].appearance === 'dark';
}

/** 僅接受背景色調 allowlist 值（持久化驗證；鍵集合與 CUSTOM_BACKGROUND_TONES 同源）。 */
export function isValidBackgroundTone(value: unknown): value is CustomBackgroundTone {
  return typeof value === 'string' && Object.hasOwn(CUSTOM_BACKGROUND_TONES, value);
}

/**
 * 精選色票（韓系 fintech 調性，wave-D 擴充至 20 色、5 欄 × 4 列）。
 * 排列邏輯：藍靛系 → 綠青系 → 暖色系 → 粉紫與中性系。
 * 色票彼此可區辨；文字對比由 deriveCustomThemeCssVars 的 AA clamp 保證（測試守門）。
 */
export const CUSTOM_PRIMARY_PRESETS = [
  '#3182F6', // Toss 藍
  '#0EA5E9', // 天空藍
  '#2563EB', // 皇家藍
  '#6366F1', // 靛藍
  '#0891B2', // 青瓷
  '#14B8A6', // 薄荷
  '#10B981', // 翡翠
  '#22C55E', // 清新綠
  '#84CC16', // 萊姆
  '#059669', // 松綠
  '#F59E0B', // 琥珀
  '#F97316', // 柑橘
  '#EF4444', // 緋紅
  '#FF6B6B', // 珊瑚
  '#D946EF', // 蘭紫
  '#EC4899', // 櫻花粉
  '#F43F5E', // 玫瑰紅
  '#8B5CF6', // 紫羅蘭
  '#78716C', // 暖石
  '#64748B', // 石墨
] as const;

/** applyTheme 於 custom 模式寫入 / 切回內建主題時清除的 inline CSS 變數全集。 */
export const CUSTOM_THEME_CSS_VARS = [
  // wave-C：背景色調對（純淨白/暖白/冷白），寫入與清除共用本常數集合。
  '--color-background',
  '--color-surface-sunken',
  // E7 wave-A：深色調整套 neutral scale 覆寫（淺色調輸出 zen 靜態同值，視覺零變化）。
  '--color-surface',
  '--color-surface-elevated',
  '--color-text',
  '--color-text-muted',
  '--color-border',
  '--color-neutral-light',
  '--color-neutral',
  '--color-neutral-dark',
  '--color-neutral-darker',
  '--color-calc-number',
  '--color-calc-number-text',
  '--color-calc-number-hover',
  '--color-calc-number-active',
  '--color-calc-operator',
  '--color-calc-operator-text',
  '--color-calc-operator-hover',
  '--color-calc-operator-active',
  '--color-calc-equals-text',
  '--color-calc-function',
  '--color-calc-function-text',
  '--color-calc-function-hover',
  '--color-calc-function-active',
  '--color-page-gradient-from',
  '--color-page-gradient-to',
  '--color-danger',
  '--color-danger-text',
  '--color-danger-bg',
  '--color-danger-light',
  '--color-danger-active',
  '--color-success-bg',
  '--color-success-light',
  '--color-success-hover',
  '--color-success-active',
  '--color-warning-light',
  '--color-warning-hover',
  '--color-warning-active',
  '--color-favorite-light',
  '--color-highlight-from',
  '--color-highlight-to',
  '--color-brand-text-dark',
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

/**
 * 派生演算版本戳（#619 pre-paint 快取簽章欄位）：
 * deriveCustomThemeCssVars 演算規則改版時必須 bump，
 * bootstrap 讀到舊版本快取即整包棄用，消除升級後首幀舊色。
 */
export const CUSTOM_THEME_DERIVE_VERSION = 1;

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
// B1 深色 danger 文字派生素材：red-400（nitro 深色慣例色）與 danger 暗 tint bg（red-950）。
const RED_400: Rgb = { r: 248, g: 113, b: 113 };
const RED_400_HSL: Hsl = rgbToHsl(RED_400);
const DARK_DANGER_BG: Rgb = { r: 69, g: 10, b: 10 };

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
export function darkenToContrast(
  hsl: Hsl,
  startLightness: number,
  against: Rgb,
  target: number,
): Rgb {
  let lightness = startLightness;
  let color = shadeAt(hsl, lightness);
  while (contrastRatio(color, against) < target && lightness > 0) {
    lightness = Math.max(0, lightness - 0.01);
    color = shadeAt(hsl, lightness);
  }
  return color;
}

/**
 * darkenToContrast 對偶函式（E7 wave-A）：自 startLightness 起逐步提高明度，
 * 直到與 against 的對比 ≥ target。明度趨近 1（白）時對深底對比必達上限，深底必有解。
 */
export function lightenToContrast(
  hsl: Hsl,
  startLightness: number,
  against: Rgb,
  target: number,
): Rgb {
  let lightness = startLightness;
  let color = shadeAt(hsl, lightness);
  while (contrastRatio(color, against) < target && lightness < 1) {
    lightness = Math.min(1, lightness + 0.01);
    color = shadeAt(hsl, lightness);
  }
  return color;
}

/** 淺色調下新增鍵的 zen 靜態同值（[data-style='custom'] 區塊現值；寫入＝視覺零變化）。 */
const LIGHT_STATIC_VARS = {
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
} as const;

/** 深色調狀態色暗 tint（紅/綠/琥珀固定色相，比照 nitro 深色慣例，與 tone/primary 無關）。 */
const DARK_STATUS_VARS = {
  '--color-danger-bg': '69 10 10',
  '--color-danger-light': '127 29 29',
  '--color-danger-active': '252 165 165',
  '--color-success-bg': '2 44 34',
  '--color-success-light': '6 78 59',
  '--color-success-hover': '6 95 70',
  '--color-success-active': '4 120 87',
  '--color-warning-light': '69 26 3',
  '--color-warning-hover': '120 53 15',
  '--color-warning-active': '146 64 14',
  '--color-favorite-light': '66 32 6',
  '--color-highlight-from': '66 32 6',
  '--color-highlight-to': '69 26 3',
  '--color-brand-text-dark': '255 255 255',
} as const;

/** 淺色調派生（wave-C/D 既有規則原封不動；新增鍵輸出 zen 靜態同值）。 */
function deriveLightThemeCssVars(
  base: Rgb,
  hsl: Hsl,
  tone: { background: string; surfaceSunken: string },
): CustomThemeCssVarMap {
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
    ...LIGHT_STATIC_VARS,
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

/**
 * 深色調派生（E7 wave-A，PM 簡報 3.2 規則表）：
 * - neutral scale 由 background 亮階疊升：background < sunken < surface < elevated < border
 * - text/text-muted：亮字，對最亮底（elevated）≥ 7:1 / ≥ 4.5:1（隱含對 background 亦達標）
 * - 有色文字（text/on-surface/dark/darker）：lightenToContrast 亮向 clamp，對比遞增階序
 * - strong/hover：白字實底合約不變（≥ 4.5:1）；深底下品牌色本身達標即直接採用（不強制壓深）
 * - 圖形色（ring/chart/accent）：對最亮底 ≥ 3:1（WCAG 1.4.11）
 */
function deriveDarkThemeCssVars(base: Rgb, hsl: Hsl, backgroundHex: string): CustomThemeCssVarMap {
  const bgRgb = hexToRgb(backgroundHex);
  const bgHsl = rgbToHsl(bgRgb);
  // 低飽和中性色相：保留背景色相、壓飽和度，純黑（s=0）自然沿用灰階。
  const neutralHsl: Hsl = { h: bgHsl.h, s: Math.min(bgHsl.s, 0.22), l: bgHsl.l };
  const L = bgHsl.l;
  const neutralAt = (offset: number) => shadeAt(neutralHsl, Math.min(1, L + offset));

  // 亮階疊升（elevation = 變亮）。
  const sunken = neutralAt(0.03);
  const surface = neutralAt(0.055);
  const elevated = neutralAt(0.09);
  const border = neutralAt(0.14);
  const neutralLight = neutralAt(0.07);
  const neutral = neutralAt(0.11);
  const neutralDark = neutralAt(0.16);
  const neutralDarker = neutralAt(0.24);

  // 亮字：對最亮底（elevated）clamp，隱含對 background/surface 更高對比。
  const text = lightenToContrast(neutralHsl, 0.82, elevated, 7);
  const textMuted = lightenToContrast(neutralHsl, 0.6, elevated, 4.5);

  // 主色深 tint（chip / 淺強調底的深色對應）：HSL 明度階對高原生亮度色相（黃/青）
  // 不保證夠深，須以相對亮度上限再 clamp，確保亮向文字 clamp 必有解。
  const darkTintAt = (startOffset: number, maxLuminance: number): Rgb => {
    let lightness = Math.min(1, L + startOffset);
    let color = shadeAt(hsl, lightness);
    while (relativeLuminance(color) > maxLuminance && lightness > 0) {
      lightness = Math.max(0, lightness - 0.01);
      color = shadeAt(hsl, lightness);
    }
    return color;
  };
  const bg = darkTintAt(0.1, 0.045);
  const light = darkTintAt(0.15, 0.07);
  const active = darkTintAt(0.22, 0.12);

  // 有色文字/圖形錨點取「neutral elevated 與 primary tint」中最亮者（與淺色調鏡像對稱）。
  const textAnchor = [elevated, bg, light].reduce((lightest, candidate) =>
    relativeLuminance(candidate) > relativeLuminance(lightest) ? candidate : lightest,
  );

  const vivid = lightenToContrast(hsl, hsl.l, textAnchor, 3);
  const text2 = lightenToContrast(hsl, Math.max(hsl.l, 0.5), textAnchor, 4.5);
  const dark = lightenToContrast(hsl, Math.max(hsl.l, 0.55), textAnchor, 5.5);
  const darker = lightenToContrast(hsl, Math.max(hsl.l, 0.6), textAnchor, 7);
  const textLight = lightenToContrast(hsl, Math.max(hsl.l, 0.6), textAnchor, 4.5);

  // 白字實底：深底驗證後可用品牌色（品牌色白字已達 AA 即不再強制壓深）。
  const strong = darkenToContrast(hsl, hsl.l, WHITE, 4.5);
  const strongL = rgbToHsl(strong).l;
  const hover = darkenToContrast(hsl, Math.min(hsl.l, (hsl.l + strongL) / 2), WHITE, 4.5);

  // B1：深色調 danger 文字（跌幅/錯誤訊息等 text-danger 消費點）——
  // red-400（nitro 深色慣例色）起點亮向 clamp，對最亮消費底（elevated 或 danger 暗 tint）≥ 4.5:1；
  // midnight/純黑直接落在 red-400，graphite 等較亮深底自動再提亮。
  const dangerAnchor = [elevated, DARK_DANGER_BG].reduce((lightest, candidate) =>
    relativeLuminance(candidate) > relativeLuminance(lightest) ? candidate : lightest,
  );
  const dangerText = lightenToContrast(RED_400_HSL, RED_400_HSL.l, dangerAnchor, 4.5);

  // 計算機鍵：數字/功能走 neutral 疊升、運算符走主色深 tint＋亮向主色字。
  const operator = darkTintAt(0.12, 0.055);
  const operatorHover = darkTintAt(0.16, 0.08);
  const operatorActive = darkTintAt(0.2, 0.1);
  const operatorText = lightenToContrast(hsl, Math.max(hsl.l, 0.6), operator, 4.5);

  return {
    ...DARK_STATUS_VARS,
    '--color-danger': rgbToTriple(dangerText),
    '--color-danger-text': rgbToTriple(dangerText),
    '--color-background': rgbToTriple(bgRgb),
    '--color-surface-sunken': rgbToTriple(sunken),
    '--color-surface': rgbToTriple(surface),
    '--color-surface-elevated': rgbToTriple(elevated),
    '--color-text': rgbToTriple(text),
    '--color-text-muted': rgbToTriple(textMuted),
    '--color-border': rgbToTriple(border),
    '--color-neutral-light': rgbToTriple(neutralLight),
    '--color-neutral': rgbToTriple(neutral),
    '--color-neutral-dark': rgbToTriple(neutralDark),
    '--color-neutral-darker': rgbToTriple(neutralDarker),
    '--color-primary': rgbToTriple(base),
    '--color-primary-strong': rgbToTriple(strong),
    '--color-primary-on-surface': rgbToTriple(text2),
    '--color-primary-bg': rgbToTriple(bg),
    '--color-primary-light': rgbToTriple(light),
    '--color-primary-hover': rgbToTriple(hover),
    '--color-primary-active': rgbToTriple(active),
    '--color-primary-text-light': rgbToTriple(textLight),
    '--color-primary-ring': rgbToTriple(vivid),
    '--color-primary-dark': rgbToTriple(dark),
    '--color-primary-darker': rgbToTriple(darker),
    '--color-primary-text': rgbToTriple(text2),
    '--color-chart-line': rgbToTriple(vivid),
    '--color-chart-area-top': rgbToTriple(vivid),
    '--color-chart-area-bottom': rgbToTriple(vivid),
    '--color-secondary': rgbToTriple(dark),
    '--color-accent': rgbToTriple(vivid),
    '--color-calc-equals': rgbToTriple(strong),
    '--color-calc-equals-text': '255 255 255',
    '--color-calc-equals-hover': rgbToTriple(hover),
    '--color-calc-equals-active': rgbToTriple(strong),
    '--color-calc-number': rgbToTriple(neutral),
    '--color-calc-number-text': rgbToTriple(text),
    '--color-calc-number-hover': rgbToTriple(neutralDark),
    '--color-calc-number-active': rgbToTriple(neutralLight),
    '--color-calc-operator': rgbToTriple(operator),
    '--color-calc-operator-text': rgbToTriple(operatorText),
    '--color-calc-operator-hover': rgbToTriple(operatorHover),
    '--color-calc-operator-active': rgbToTriple(operatorActive),
    '--color-calc-function': rgbToTriple(neutralDark),
    '--color-calc-function-text': rgbToTriple(text),
    '--color-calc-function-hover': rgbToTriple(neutralDarker),
    '--color-calc-function-active': rgbToTriple(neutral),
    '--color-brand-button-from': rgbToTriple(strong),
    '--color-brand-button-to': rgbToTriple(strong),
    '--color-brand-button-hover-from': rgbToTriple(hover),
    '--color-brand-button-hover-to': rgbToTriple(hover),
    '--color-brand-text': rgbToTriple(text2),
    '--color-page-gradient-from': rgbToTriple(sunken),
    '--color-page-gradient-via': rgbToTriple(bg),
    '--color-page-gradient-to': rgbToTriple(surface),
  };
}

/** 派生 memoize（選色拖動高頻執行；純函式，同輸入同輸出）。 */
const deriveCache = new Map<string, CustomThemeCssVarMap>();
const DERIVE_CACHE_LIMIT = 64;

/**
 * 由使用者主色（＋背景色調）導出整組 custom 主題 CSS 變數（單一派生入口 SSOT）。
 *
 * 淺色調規則（zen 階差對應 + AA clamp）：
 * - primary：使用者原色（選色即所得；bootstrap pre-paint 同值）
 * - bg/light/active/text-light：固定明度階（0.97/0.93/0.78/0.68）＋使用者色相/飽和度
 * - ring/chart 三色：非文字圖形色，clamp 至對白底對比 ≥ 3:1（WCAG 1.4.11）
 * - hover：zen 階差（primary 與 strong 明度中點），clamp 至白字對比 ≥ 4.5:1
 * - strong：主色加深至白字對比 ≥ 4.5:1（AA 硬規格）
 * - on-surface：文字消費面的 primary 錨點（#632 合約），與 text 同 clamp（對最深底色 ≥ 4.5:1）
 * - text/dark/darker：有色文字，clamp 至對最深底色（含背景調對）對比 ≥ 4.5:1，並維持遞深階序
 * - background/surface-sunken：由背景色調（CUSTOM_BACKGROUND_TONES SSOT）直出
 *
 * 深色調規則（E7 wave-A）見 deriveDarkThemeCssVars。
 */
export function deriveCustomThemeCssVars(
  primaryHex: string,
  backgroundTone: CustomBackgroundTone = DEFAULT_CUSTOM_BACKGROUND_TONE,
): CustomThemeCssVarMap {
  const hex = isValidHexColor(primaryHex) ? primaryHex : DEFAULT_CUSTOM_PRIMARY;
  const cacheKey = `${hex.toUpperCase()}|${backgroundTone}`;
  const cached = deriveCache.get(cacheKey);
  if (cached) return cached;

  const base = hexToRgb(hex);
  const hsl = rgbToHsl(base);
  const tone = CUSTOM_BACKGROUND_TONES[backgroundTone];
  const derived =
    tone.appearance === 'dark'
      ? deriveDarkThemeCssVars(base, hsl, tone.background)
      : deriveLightThemeCssVars(base, hsl, {
          background: tone.background,
          surfaceSunken: tone.surfaceSunken ?? tone.background,
        });

  if (deriveCache.size >= DERIVE_CACHE_LIMIT) {
    const oldest = deriveCache.keys().next().value;
    if (oldest !== undefined) deriveCache.delete(oldest);
  }
  deriveCache.set(cacheKey, derived);
  return derived;
}
