/**
 * Modern Theme System - 4 Styles × 4 Color Schemes
 *
 * @description 現代化主題系統，支援 4 種風格與 4 種配色切換
 *              採用扁平設計（無漸層）+ 微妙陰影 + 語義化 token
 *
 * @reference
 * - Stripe Design System: https://docs.stripe.com/stripe-apps/style
 * - Linear UI Redesign: https://linear.app/now/how-we-redesigned-the-linear-ui
 * - Vercel Geist: https://vercel.com/design/guidelines
 * - shadcn/ui Theming: https://ui.shadcn.com/docs/theming
 *
 * @created 2026-01-16
 * @version 1.0.0
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * 風格類型 - 4 種可選風格
 */
export type ThemeStyle = 'default' | 'warm' | 'cool' | 'contrast';

/**
 * 配色類型 - 4 種可選配色
 */
export type ColorScheme = 'violet' | 'blue' | 'emerald' | 'rose';

/**
 * 模式類型 - 淺色/深色
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * 完整主題配置
 */
export interface ThemeConfig {
  style: ThemeStyle;
  colorScheme: ColorScheme;
  mode: ThemeMode;
}

/**
 * CSS Variables 格式的色彩值
 * 格式：R G B（用於 Tailwind 的 rgb(var(...) / alpha) 語法）
 */
type RGBValue = string;

/**
 * 語義化色彩系統
 */
interface SemanticColors {
  // 背景色
  background: RGBValue;
  'background-secondary': RGBValue;
  'background-tertiary': RGBValue;

  // 前景色（文字）
  foreground: RGBValue;
  'foreground-secondary': RGBValue;
  'foreground-muted': RGBValue;

  // 邊框與分隔線
  border: RGBValue;
  'border-secondary': RGBValue;

  // 主色（按鈕、連結、強調）
  primary: RGBValue;
  'primary-hover': RGBValue;
  'primary-foreground': RGBValue;

  // 危險色（錯誤、刪除）
  destructive: RGBValue;
  'destructive-hover': RGBValue;
  'destructive-foreground': RGBValue;

  // 成功色
  success: RGBValue;
  'success-foreground': RGBValue;

  // 警告色
  warning: RGBValue;
  'warning-foreground': RGBValue;

  // 卡片背景
  card: RGBValue;
  'card-foreground': RGBValue;

  // 輸入框
  input: RGBValue;
  'input-border': RGBValue;

  // Focus ring
  ring: RGBValue;

  // 側邊欄/導覽
  sidebar: RGBValue;
  'sidebar-foreground': RGBValue;
  'sidebar-active': RGBValue;
}

// ============================================================================
// Color Palettes（扁平設計，無漸層）
// ============================================================================

/**
 * Violet 配色 - 品牌紫色
 * 靈感來源：Stripe, Linear
 */
const violetPalette = {
  light: {
    primary: '124 58 237', // violet-600
    'primary-hover': '109 40 217', // violet-700
    'primary-foreground': '255 255 255',
  },
  dark: {
    primary: '167 139 250', // violet-400
    'primary-hover': '196 181 253', // violet-300
    'primary-foreground': '15 23 42',
  },
};

/**
 * Blue 配色 - 專業藍色
 * 靈感來源：Vercel, Notion
 */
const bluePalette = {
  light: {
    primary: '37 99 235', // blue-600
    'primary-hover': '29 78 216', // blue-700
    'primary-foreground': '255 255 255',
  },
  dark: {
    primary: '96 165 250', // blue-400
    'primary-hover': '147 197 253', // blue-300
    'primary-foreground': '15 23 42',
  },
};

/**
 * Emerald 配色 - 自然綠色
 * 靈感來源：Notion, Figma
 */
const emeraldPalette = {
  light: {
    primary: '16 185 129', // emerald-500
    'primary-hover': '5 150 105', // emerald-600
    'primary-foreground': '255 255 255',
  },
  dark: {
    primary: '52 211 153', // emerald-400
    'primary-hover': '110 231 183', // emerald-300
    'primary-foreground': '15 23 42',
  },
};

/**
 * Rose 配色 - 溫暖玫瑰
 * 靈感來源：Dribbble, Framer
 */
const rosePalette = {
  light: {
    primary: '225 29 72', // rose-600
    'primary-hover': '190 18 60', // rose-700
    'primary-foreground': '255 255 255',
  },
  dark: {
    primary: '251 113 133', // rose-400
    'primary-hover': '253 164 175', // rose-300
    'primary-foreground': '15 23 42',
  },
};

const colorPalettes: Record<
  ColorScheme,
  { light: Partial<SemanticColors>; dark: Partial<SemanticColors> }
> = {
  violet: violetPalette,
  blue: bluePalette,
  emerald: emeraldPalette,
  rose: rosePalette,
};

// ============================================================================
// Style Definitions（風格定義）
// ============================================================================

/**
 * Default 風格 - 中性現代
 * 特點：純淨白底、微妙灰調、現代感
 */
const defaultStyle: { light: SemanticColors; dark: SemanticColors } = {
  light: {
    background: '255 255 255', // white
    'background-secondary': '249 250 251', // gray-50
    'background-tertiary': '243 244 246', // gray-100
    foreground: '17 24 39', // gray-900
    'foreground-secondary': '75 85 99', // gray-600
    'foreground-muted': '156 163 175', // gray-400
    border: '229 231 235', // gray-200
    'border-secondary': '209 213 219', // gray-300
    primary: '124 58 237',
    'primary-hover': '109 40 217',
    'primary-foreground': '255 255 255',
    destructive: '239 68 68', // red-500
    'destructive-hover': '220 38 38', // red-600
    'destructive-foreground': '255 255 255',
    success: '34 197 94', // green-500
    'success-foreground': '255 255 255',
    warning: '245 158 11', // amber-500
    'warning-foreground': '255 255 255',
    card: '255 255 255',
    'card-foreground': '17 24 39',
    input: '255 255 255',
    'input-border': '209 213 219',
    ring: '124 58 237',
    sidebar: '249 250 251',
    'sidebar-foreground': '75 85 99',
    'sidebar-active': '243 244 246',
  },
  dark: {
    background: '17 24 39', // gray-900
    'background-secondary': '31 41 55', // gray-800
    'background-tertiary': '55 65 81', // gray-700
    foreground: '249 250 251', // gray-50
    'foreground-secondary': '209 213 219', // gray-300
    'foreground-muted': '156 163 175', // gray-400
    border: '55 65 81', // gray-700
    'border-secondary': '75 85 99', // gray-600
    primary: '167 139 250',
    'primary-hover': '196 181 253',
    'primary-foreground': '17 24 39',
    destructive: '248 113 113', // red-400
    'destructive-hover': '252 165 165', // red-300
    'destructive-foreground': '17 24 39',
    success: '74 222 128', // green-400
    'success-foreground': '17 24 39',
    warning: '251 191 36', // amber-400
    'warning-foreground': '17 24 39',
    card: '31 41 55',
    'card-foreground': '249 250 251',
    input: '31 41 55',
    'input-border': '75 85 99',
    ring: '167 139 250',
    sidebar: '17 24 39',
    'sidebar-foreground': '209 213 219',
    'sidebar-active': '31 41 55',
  },
};

/**
 * Warm 風格 - 溫暖舒適
 * 特點：米色調、圓潤感、親和力
 * 靈感：Notion warm mode
 */
const warmStyle: { light: SemanticColors; dark: SemanticColors } = {
  light: {
    background: '255 251 235', // amber-50
    'background-secondary': '254 243 199', // amber-100
    'background-tertiary': '253 230 138', // amber-200
    foreground: '120 53 15', // amber-900
    'foreground-secondary': '146 64 14', // amber-800
    'foreground-muted': '180 83 9', // amber-700
    border: '253 230 138', // amber-200
    'border-secondary': '252 211 77', // amber-300
    primary: '124 58 237',
    'primary-hover': '109 40 217',
    'primary-foreground': '255 255 255',
    destructive: '239 68 68',
    'destructive-hover': '220 38 38',
    'destructive-foreground': '255 255 255',
    success: '34 197 94',
    'success-foreground': '255 255 255',
    warning: '245 158 11',
    'warning-foreground': '255 255 255',
    card: '255 255 255',
    'card-foreground': '120 53 15',
    input: '255 255 255',
    'input-border': '253 230 138',
    ring: '124 58 237',
    sidebar: '254 243 199',
    'sidebar-foreground': '146 64 14',
    'sidebar-active': '253 230 138',
  },
  dark: {
    background: '41 37 36', // stone-800
    'background-secondary': '68 64 60', // stone-700
    'background-tertiary': '87 83 78', // stone-600
    foreground: '250 250 249', // stone-50
    'foreground-secondary': '231 229 228', // stone-200
    'foreground-muted': '168 162 158', // stone-400
    border: '87 83 78', // stone-600
    'border-secondary': '120 113 108', // stone-500
    primary: '167 139 250',
    'primary-hover': '196 181 253',
    'primary-foreground': '41 37 36',
    destructive: '248 113 113',
    'destructive-hover': '252 165 165',
    'destructive-foreground': '41 37 36',
    success: '74 222 128',
    'success-foreground': '41 37 36',
    warning: '251 191 36',
    'warning-foreground': '41 37 36',
    card: '68 64 60',
    'card-foreground': '250 250 249',
    input: '68 64 60',
    'input-border': '120 113 108',
    ring: '167 139 250',
    sidebar: '41 37 36',
    'sidebar-foreground': '231 229 228',
    'sidebar-active': '68 64 60',
  },
};

/**
 * Cool 風格 - 冷靜專業
 * 特點：藍灰調、科技感、專業
 * 靈感：Linear, Vercel
 */
const coolStyle: { light: SemanticColors; dark: SemanticColors } = {
  light: {
    background: '248 250 252', // slate-50
    'background-secondary': '241 245 249', // slate-100
    'background-tertiary': '226 232 240', // slate-200
    foreground: '15 23 42', // slate-900
    'foreground-secondary': '71 85 105', // slate-600
    'foreground-muted': '100 116 139', // slate-500
    border: '226 232 240', // slate-200
    'border-secondary': '203 213 225', // slate-300
    primary: '124 58 237',
    'primary-hover': '109 40 217',
    'primary-foreground': '255 255 255',
    destructive: '239 68 68',
    'destructive-hover': '220 38 38',
    'destructive-foreground': '255 255 255',
    success: '34 197 94',
    'success-foreground': '255 255 255',
    warning: '245 158 11',
    'warning-foreground': '255 255 255',
    card: '255 255 255',
    'card-foreground': '15 23 42',
    input: '255 255 255',
    'input-border': '203 213 225',
    ring: '124 58 237',
    sidebar: '241 245 249',
    'sidebar-foreground': '71 85 105',
    'sidebar-active': '226 232 240',
  },
  dark: {
    background: '2 6 23', // slate-950
    'background-secondary': '15 23 42', // slate-900
    'background-tertiary': '30 41 59', // slate-800
    foreground: '248 250 252', // slate-50
    'foreground-secondary': '203 213 225', // slate-300
    'foreground-muted': '100 116 139', // slate-500
    border: '30 41 59', // slate-800
    'border-secondary': '51 65 85', // slate-700
    primary: '167 139 250',
    'primary-hover': '196 181 253',
    'primary-foreground': '2 6 23',
    destructive: '248 113 113',
    'destructive-hover': '252 165 165',
    'destructive-foreground': '2 6 23',
    success: '74 222 128',
    'success-foreground': '2 6 23',
    warning: '251 191 36',
    'warning-foreground': '2 6 23',
    card: '15 23 42',
    'card-foreground': '248 250 252',
    input: '15 23 42',
    'input-border': '51 65 85',
    ring: '167 139 250',
    sidebar: '2 6 23',
    'sidebar-foreground': '203 213 225',
    'sidebar-active': '15 23 42',
  },
};

/**
 * Contrast 風格 - 高對比無障礙
 * 特點：純黑白、WCAG AAA、最高可讀性
 * 靈感：Apple accessibility mode
 */
const contrastStyle: { light: SemanticColors; dark: SemanticColors } = {
  light: {
    background: '255 255 255', // white
    'background-secondary': '245 245 245', // neutral-100
    'background-tertiary': '229 229 229', // neutral-200
    foreground: '0 0 0', // black
    'foreground-secondary': '38 38 38', // neutral-800
    'foreground-muted': '82 82 82', // neutral-600
    border: '163 163 163', // neutral-400
    'border-secondary': '115 115 115', // neutral-500
    primary: '0 0 0',
    'primary-hover': '38 38 38',
    'primary-foreground': '255 255 255',
    destructive: '185 28 28', // red-700
    'destructive-hover': '153 27 27', // red-800
    'destructive-foreground': '255 255 255',
    success: '21 128 61', // green-700
    'success-foreground': '255 255 255',
    warning: '180 83 9', // amber-700
    'warning-foreground': '255 255 255',
    card: '255 255 255',
    'card-foreground': '0 0 0',
    input: '255 255 255',
    'input-border': '115 115 115',
    ring: '0 0 0',
    sidebar: '245 245 245',
    'sidebar-foreground': '38 38 38',
    'sidebar-active': '229 229 229',
  },
  dark: {
    background: '0 0 0', // black
    'background-secondary': '23 23 23', // neutral-900
    'background-tertiary': '38 38 38', // neutral-800
    foreground: '255 255 255', // white
    'foreground-secondary': '229 229 229', // neutral-200
    'foreground-muted': '163 163 163', // neutral-400
    border: '82 82 82', // neutral-600
    'border-secondary': '115 115 115', // neutral-500
    primary: '255 255 255',
    'primary-hover': '229 229 229',
    'primary-foreground': '0 0 0',
    destructive: '252 165 165', // red-300
    'destructive-hover': '254 202 202', // red-200
    'destructive-foreground': '0 0 0',
    success: '134 239 172', // green-300
    'success-foreground': '0 0 0',
    warning: '252 211 77', // amber-300
    'warning-foreground': '0 0 0',
    card: '23 23 23',
    'card-foreground': '255 255 255',
    input: '23 23 23',
    'input-border': '115 115 115',
    ring: '255 255 255',
    sidebar: '0 0 0',
    'sidebar-foreground': '229 229 229',
    'sidebar-active': '23 23 23',
  },
};

const styleDefinitions: Record<ThemeStyle, { light: SemanticColors; dark: SemanticColors }> = {
  default: defaultStyle,
  warm: warmStyle,
  cool: coolStyle,
  contrast: contrastStyle,
};

// ============================================================================
// Theme Generator
// ============================================================================

/**
 * 生成完整的主題 CSS Variables
 *
 * @param config - 主題配置
 * @returns CSS Variables 物件
 */
export function generateThemeVariables(config: ThemeConfig): Record<string, string> {
  const { style, colorScheme, mode } = config;
  const resolvedMode = mode === 'auto' ? 'light' : mode;

  // 獲取基礎風格
  const baseColors = styleDefinitions[style][resolvedMode];

  // 獲取配色覆蓋
  const colorOverrides = colorPalettes[colorScheme][resolvedMode];

  // 合併（配色覆蓋基礎）
  const mergedColors: SemanticColors = {
    ...baseColors,
    ...colorOverrides,
  };

  // 轉換為 CSS Variables 格式
  const variables: Record<string, string> = {};
  for (const [key, value] of Object.entries(mergedColors)) {
    variables[`--color-${key}`] = value as string;
  }

  return variables;
}

/**
 * 將主題變數應用到 DOM
 *
 * @param config - 主題配置
 */
export function applyTheme(config: ThemeConfig): void {
  if (typeof window === 'undefined') return;

  const variables = generateThemeVariables(config);
  const root = document.documentElement;

  // 設定 CSS Variables
  for (const [key, value] of Object.entries(variables)) {
    root.style.setProperty(key, value);
  }

  // 設定 data attributes
  root.dataset['style'] = config.style;
  root.dataset['colorScheme'] = config.colorScheme;
  root.dataset['mode'] =
    config.mode === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : config.mode;
}

// ============================================================================
// Default Export & Constants
// ============================================================================

/**
 * 預設主題配置
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  style: 'cool',
  colorScheme: 'violet',
  mode: 'light',
};

/**
 * 風格選項（供 UI 選擇器使用）
 */
export const STYLE_OPTIONS: {
  value: ThemeStyle;
  label: string;
  description: string;
}[] = [
  { value: 'default', label: '現代中性', description: '純淨白底、現代感' },
  { value: 'warm', label: '溫暖舒適', description: '米色調、親和力' },
  { value: 'cool', label: '冷靜專業', description: '藍灰調、科技感' },
  { value: 'contrast', label: '高對比', description: '純黑白、最高可讀性' },
];

/**
 * 配色選項（供 UI 選擇器使用）
 */
export const COLOR_SCHEME_OPTIONS: {
  value: ColorScheme;
  label: string;
  color: string;
}[] = [
  { value: 'violet', label: '品牌紫', color: '#7c3aed' },
  { value: 'blue', label: '專業藍', color: '#2563eb' },
  { value: 'emerald', label: '自然綠', color: '#10b981' },
  { value: 'rose', label: '溫暖玫瑰', color: '#e11d48' },
];

/**
 * 模式選項
 */
export const MODE_OPTIONS: {
  value: ThemeMode;
  label: string;
  icon: string;
}[] = [
  { value: 'light', label: '淺色', icon: '☀️' },
  { value: 'dark', label: '深色', icon: '🌙' },
  { value: 'auto', label: '跟隨系統', icon: '💻' },
];
