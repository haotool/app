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
 * 背景調值域（E7 wave-C 亮度滑桿）：preset enum 或滑桿產生的 #RRGGBB。
 * `string & {}` 保留 enum 字面量自動補全，同時允許 hex 進 persist schema
 *（舊 enum 持久化資料與 FOUC 快取簽章原樣有效，向後相容零破壞）。
 */
export type CustomBackgroundToneValue = CustomBackgroundTone | (string & {});

/** 背景調值驗證：enum allowlist 或 #RRGGBB 六碼 hex（persist schema 向後相容擴充）。 */
export function isValidBackgroundToneValue(value: unknown): value is CustomBackgroundToneValue {
  return isValidBackgroundTone(value) || isValidHexColor(value);
}

/**
 * 精選色票（E7 wave-C 收斂，QA-I #6）：21 色與色域盤重疊造成選擇焦慮，
 * 收斂為 10 格精選（5 欄 × 2 列）＋「自訂…」進 react-colorful。
 * 分區（設計簡報 3.1）：品牌藍系 → 活力系 → 中性系；韓系飽和度校準——
 * 全部色票對任一預設背景調 ≥ 2:1（不觸發近白/近黑 gate，測試守門）。
 */
export const CUSTOM_PRIMARY_PRESETS = [
  '#3182F6', // Toss 藍（品牌藍系）
  '#0EA5E9', // 天空藍（品牌藍系）
  '#6366F1', // 靛藍（品牌藍系）
  '#8B5CF6', // 紫羅蘭（品牌藍系）
  '#0D9488', // 青瓷（活力系）
  '#16A34A', // 森林綠（活力系）
  '#D97706', // 琥珀（活力系）
  '#FF6B6B', // 珊瑚（活力系）
  '#EC4899', // 櫻花粉（活力系）
  '#64748B', // 石墨（中性系）
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
  // #641：text-warning-text 活化後，深色調需亮 amber 覆寫（淺色調輸出靜態同值）。
  '--color-warning-text',
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
// v2（#641）：淺色靜態 muted 文字加深（sunken AA）＋ warning-text 進覆寫集合。
export const CUSTOM_THEME_DERIVE_VERSION = 2;

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

/**
 * HEX 欄位輸入清洗（E7 wave-B，QA-I #4）：
 * 去除 #、空白與非 hex 字元，統一大寫並截斷至 6 碼。
 * 貼上「F8FAFC」「#3182f6 」等髒輸入經本函式後可直接組回 #RRGGBB。
 */
export function sanitizeHexInput(raw: string): string {
  return raw
    .replace(/[^0-9a-fA-F]/g, '')
    .toUpperCase()
    .slice(0, 6);
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
  '--color-text-muted': '94 110 132',
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
  '--color-warning-text': '146 64 14',
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
  '--color-warning-text': '251 191 36',
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

  // 亮字：對最亮 neutral 底 clamp。低飽和 preset 深檔恆為 elevated（輸出零變化）；
  // 連續 tone（E7 wave-C）允許高飽和 background，其相對亮度可能反超去飽和 elevated，
  // 故取兩者較亮者為錨，保證對 background/surface/elevated 全面達標。
  const brightestNeutral =
    relativeLuminance(bgRgb) > relativeLuminance(elevated) ? bgRgb : elevated;
  const text = lightenToContrast(neutralHsl, 0.82, brightestNeutral, 7);
  const textMuted = lightenToContrast(neutralHsl, 0.6, brightestNeutral, 4.5);

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

  // 有色文字/圖形錨點取「neutral 最亮底與 primary tint」中最亮者（與淺色調鏡像對稱）。
  const textAnchor = [brightestNeutral, bg, light].reduce((lightest, candidate) =>
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
  const dangerAnchor = [brightestNeutral, DARK_DANGER_BG].reduce((lightest, candidate) =>
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
 * 連續 tone（E7 wave-C）：backgroundTone 可為 #RRGGBB——先正規化夾進可解域，
 * 再依外觀走同一深/淺派生分支（preset enum 派生規則零改動，快取簽章相容）。
 */
export function deriveCustomThemeCssVars(
  primaryHex: string,
  backgroundTone: CustomBackgroundToneValue = DEFAULT_CUSTOM_BACKGROUND_TONE,
): CustomThemeCssVarMap {
  const hex = isValidHexColor(primaryHex) ? primaryHex : DEFAULT_CUSTOM_PRIMARY;
  const toneValue = isValidBackgroundToneValue(backgroundTone)
    ? backgroundTone
    : DEFAULT_CUSTOM_BACKGROUND_TONE;
  const cacheKey = `${hex.toUpperCase()}|${toneValue.toUpperCase()}`;
  const cached = deriveCache.get(cacheKey);
  if (cached) return cached;

  const base = hexToRgb(hex);
  const hsl = rgbToHsl(base);
  let derived: CustomThemeCssVarMap;
  if (isValidBackgroundTone(toneValue)) {
    const tone = CUSTOM_BACKGROUND_TONES[toneValue];
    derived =
      tone.appearance === 'dark'
        ? deriveDarkThemeCssVars(base, hsl, tone.background)
        : deriveLightThemeCssVars(base, hsl, {
            background: tone.background,
            surfaceSunken: tone.surfaceSunken ?? tone.background,
          });
  } else {
    const backgroundHex = normalizeContinuousToneHex(toneValue);
    if (isDarkBackgroundToneValue(toneValue)) {
      derived = deriveDarkThemeCssVars(base, hsl, backgroundHex);
    } else {
      // 連續淺 tone 的 sunken 對：同色相/飽和度、明度 -0.03（比照 preset 對手調階差）。
      const bgHsl = rgbToHsl(hexToRgb(backgroundHex));
      const sunken = shadeAt(bgHsl, Math.max(0, bgHsl.l - 0.03));
      derived = deriveLightThemeCssVars(base, hsl, {
        background: backgroundHex,
        surfaceSunken: rgbToHex(sunken),
      });
    }
  }

  if (deriveCache.size >= DERIVE_CACHE_LIMIT) {
    const oldest = deriveCache.keys().next().value;
    if (oldest !== undefined) deriveCache.delete(oldest);
  }
  deriveCache.set(cacheKey, derived);
  return derived;
}

// ============================================================================
// 連續 tone（E7 wave-C 亮度滑桿）：任意 background hex 的正規化與滑桿映射
// ============================================================================

/** 深/淺分類門檻（相對亮度）：滑桿雙域映射與 hex tone 外觀判定共用。 */
const CONTINUOUS_TONE_DARK_LUMINANCE_THRESHOLD = 0.3;

/** 深域可解判定：background 與 elevated（L+0.09、飽和度夾 0.22）皆夠暗，亮字 7:1 必有解。 */
function isDarkToneSolvable(hsl: Hsl, lightness: number): boolean {
  const background = shadeAt(hsl, lightness);
  const neutral: Hsl = { h: hsl.h, s: Math.min(hsl.s, 0.22), l: lightness };
  const elevated = shadeAt(neutral, Math.min(1, lightness + 0.09));
  return Math.max(relativeLuminance(background), relativeLuminance(elevated)) <= 0.09;
}

/** zen 靜態 --color-text-muted（#641 加深後值）：淺域可解判定的綁定約束。 */
const LIGHT_STATIC_MUTED: Rgb = { r: 94, g: 110, b: 132 };

/** 淺域可解判定：zen 靜態 muted 文字對 background ≥ 4.5（淺色派生的最嚴文字對）。 */
function isLightToneSolvable(hsl: Hsl, lightness: number): boolean {
  return contrastRatio(LIGHT_STATIC_MUTED, shadeAt(hsl, lightness)) >= 4.5;
}

/**
 * 任意 background hex 正規化（總函式保證）：保留色相/飽和度、僅調明度，
 * 夾進「暗字/亮字必有 AA 解」的可解域。中間灰區為 WCAG 死域
 *（暗字與亮字皆無 4.5:1 解），依相對亮度就近夾至深域上緣或淺域下緣。
 * 每步以 hex 往返後的實際值重新判定可解性，保證輸出冪等（捨入誤差防護）。
 */
export function normalizeContinuousToneHex(hex: string): string {
  let candidate = hex.toUpperCase();
  for (let step = 0; step < 200; step++) {
    const rgb = hexToRgb(candidate);
    const hsl = rgbToHsl(rgb);
    const isDark = relativeLuminance(rgb) < CONTINUOUS_TONE_DARK_LUMINANCE_THRESHOLD;
    if (isDark ? isDarkToneSolvable(hsl, hsl.l) : isLightToneSolvable(hsl, hsl.l)) {
      return candidate;
    }
    const nextLightness = isDark ? Math.max(0, hsl.l - 0.01) : Math.min(1, hsl.l + 0.01);
    const next = rgbToHex(shadeAt(hsl, nextLightness));
    if (next === candidate) return candidate;
    candidate = next;
  }
  return candidate;
}

/** 背景調值 → 有效 background hex（enum 直出 SSOT；hex 先正規化；無效回退 pure）。 */
export function backgroundToneValueHex(value: CustomBackgroundToneValue): string {
  if (isValidBackgroundTone(value)) return CUSTOM_BACKGROUND_TONES[value].background;
  if (isValidHexColor(value)) return normalizeContinuousToneHex(value);
  return CUSTOM_BACKGROUND_TONES[DEFAULT_CUSTOM_BACKGROUND_TONE].background;
}

/** 背景調值外觀判定（enum 走 SSOT 欄位；hex 依正規化後相對亮度）。 */
export function isDarkBackgroundToneValue(value: CustomBackgroundToneValue): boolean {
  if (isValidBackgroundTone(value)) return isDarkBackgroundTone(value);
  if (!isValidHexColor(value)) return false;
  return (
    relativeLuminance(hexToRgb(normalizeContinuousToneHex(value))) <
    CONTINUOUS_TONE_DARK_LUMINANCE_THRESHOLD
  );
}

/** 深域滑桿明度下限（近黑仍可辨層次）。 */
const SLIDER_DARK_MIN_L = 0.02;
/** 淺域滑桿明度上限（保留與純白的可辨差）。 */
const SLIDER_LIGHT_MAX_L = 0.99;
/**
 * 深域反映射位置上限（review 修正）：0.5 為淺域起點（continuousToneHexAtPosition
 * 以 position < 0.5 判深域），深 tone 反映射若落在 0.5，thumb 值 50 一經觸碰即映射
 * 淺域造成深→淺跳變。夾至 0.49（UI 整數 49）保證原地觸碰/微調仍在深域。
 */
const SLIDER_DARK_MAX_POSITION = 0.49;

/** 指定色相/飽和度下的深域明度上限（自分類門檻向下搜到可解為止）。 */
function darkDomainMaxL(hsl: Hsl): number {
  let lightness = 0.3;
  while (!isDarkToneSolvable(hsl, lightness) && lightness > SLIDER_DARK_MIN_L) {
    lightness = Math.max(SLIDER_DARK_MIN_L, lightness - 0.005);
  }
  return lightness;
}

/** 指定色相/飽和度下的淺域明度下限（自中段向上搜到可解為止）。 */
function lightDomainMinL(hsl: Hsl): number {
  let lightness = 0.7;
  while (!isLightToneSolvable(hsl, lightness) && lightness < SLIDER_LIGHT_MAX_L) {
    lightness = Math.min(SLIDER_LIGHT_MAX_L, lightness + 0.005);
  }
  return lightness;
}

/**
 * 亮度滑桿位置 → background hex（E7 wave-C）：
 * position ∈ [0, 1]，0＝最深、1＝最淺；色相/飽和度取自 hueSourceHex（當前背景調），
 * 前半段映射深域、後半段映射淺域，中間 WCAG 死域不對外曝露——任意位置 AA 必有解。
 */
export function continuousToneHexAtPosition(position: number, hueSourceHex: string): string {
  const clamped = Math.min(1, Math.max(0, position));
  const source = isValidHexColor(hueSourceHex)
    ? hueSourceHex
    : CUSTOM_BACKGROUND_TONES[DEFAULT_CUSTOM_BACKGROUND_TONE].background;
  const hsl = rgbToHsl(hexToRgb(source));
  const lightness =
    clamped < 0.5
      ? SLIDER_DARK_MIN_L + (clamped / 0.5) * (darkDomainMaxL(hsl) - SLIDER_DARK_MIN_L)
      : (() => {
          const minL = lightDomainMinL(hsl);
          return minL + ((clamped - 0.5) / 0.5) * (SLIDER_LIGHT_MAX_L - minL);
        })();
  return normalizeContinuousToneHex(rgbToHex(shadeAt(hsl, lightness)));
}

/**
 * 背景調值 → 滑桿位置（continuousToneHexAtPosition 的反映射，供 thumb 定位）。
 * 域邊界歸屬（review 修正）：深 tone 夾至 ≤0.49（深域內側）、淺 tone 夾至 ≥0.5
 *（0.5 即淺域起點），UI 整數往返分域不變——原地觸碰滑桿零跳變。
 */
export function sliderPositionForToneValue(value: CustomBackgroundToneValue): number {
  const hex = backgroundToneValueHex(value);
  const hsl = rgbToHsl(hexToRgb(hex));
  if (isDarkBackgroundToneValue(value)) {
    const maxL = darkDomainMaxL(hsl);
    if (maxL <= SLIDER_DARK_MIN_L) return 0;
    return Math.min(
      SLIDER_DARK_MAX_POSITION,
      Math.max(0, ((hsl.l - SLIDER_DARK_MIN_L) / (maxL - SLIDER_DARK_MIN_L)) * 0.5),
    );
  }
  const minL = lightDomainMinL(hsl);
  if (minL >= SLIDER_LIGHT_MAX_L) return 1;
  return Math.min(1, Math.max(0.5, 0.5 + ((hsl.l - minL) / (SLIDER_LIGHT_MAX_L - minL)) * 0.5));
}

// ============================================================================
// 近白/近黑主色 gate（E7 wave-B，QA-I #2＋#670 S3）
// ============================================================================

/**
 * gate 警告門檻：raw primary 對當前背景調 background 的對比 < 2:1 即警告（不硬擋）。
 * 門檻高於圖形面最低要求（1.5:1），保證任何低於 1.5:1 的違規輸入必被 gate 攔截提示。
 */
export const PRIMARY_GATE_WARN_CONTRAST = 2;

/** raw primary 圖形面（wordmark、tint、focus ring 基色）對 background 的最低對比要求。 */
export const PRIMARY_GATE_GRAPHIC_MIN_CONTRAST = 1.5;

export interface PrimaryContrastGate {
  /** raw primary 對當前背景調 background 的對比值。 */
  ratio: number;
  /** 對比 < PRIMARY_GATE_WARN_CONTRAST 時為 true（近白 × 淺調／近黑 × 深調鏡像同機制）。 */
  isLowContrast: boolean;
  /** 一鍵採用的最近達標色（淺調 darkenToContrast／深調 lightenToContrast）；未警告時為 null。 */
  suggestedPrimary: string | null;
}

/**
 * 選色輸入層 gate：評估主色對「當前背景調」的圖形面對比。
 * 不修改派生輸出（--color-primary 維持 identity 映射合約），只提供警告與建議色；
 * 建議色以 clamp 對偶函式產生（保留色相/飽和度、僅調明度的最近達標色）。
 * E7 wave-C：backgroundTone 支援連續 tone hex（與 derive 同一 normalize 入口）。
 */
export function evaluatePrimaryContrastGate(
  primaryHex: string,
  backgroundTone: CustomBackgroundToneValue = DEFAULT_CUSTOM_BACKGROUND_TONE,
): PrimaryContrastGate {
  const hex = isValidHexColor(primaryHex) ? primaryHex : DEFAULT_CUSTOM_PRIMARY;
  const background = hexToRgb(backgroundToneValueHex(backgroundTone));
  const primary = hexToRgb(hex);
  const ratio = contrastRatio(primary, background);
  if (ratio >= PRIMARY_GATE_WARN_CONTRAST) {
    return { ratio, isLowContrast: false, suggestedPrimary: null };
  }
  const hsl = rgbToHsl(primary);
  const suggested = isDarkBackgroundToneValue(backgroundTone)
    ? lightenToContrast(hsl, hsl.l, background, PRIMARY_GATE_WARN_CONTRAST)
    : darkenToContrast(hsl, hsl.l, background, PRIMARY_GATE_WARN_CONTRAST);
  return { ratio, isLowContrast: true, suggestedPrimary: rgbToHex(suggested) };
}
