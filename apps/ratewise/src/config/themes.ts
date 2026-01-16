/**
 * Modern Theme System - ParkKeeper Style
 *
 * @description 現代化主題系統，參考 ParkKeeper 設計風格
 *              4 種風格（Nitro/Kawaii/Zen/Classic）+ 淺深模式
 *
 * @reference ParkKeeper UI Design
 * @created 2026-01-16
 * @version 2.0.0
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * 風格類型 - 4 種可選風格（參考 ParkKeeper）
 */
export type ThemeStyle = 'nitro' | 'kawaii' | 'zen' | 'classic';

/**
 * 模式類型 - 淺色/深色
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * 完整主題配置
 */
export interface ThemeConfig {
  style: ThemeStyle;
  mode: ThemeMode;
}

/**
 * 風格定義
 *
 * @description 語義色彩系統（符合 Design Token 最佳實踐 2026）
 *
 * ## 核心語義色彩
 * - background: 頁面背景
 * - surface: 卡片/面板背景
 * - text: 主要文字
 * - textMuted: 次要文字
 * - primary: 主色（CTA、主要互動）
 * - secondary: 輔色（次要互動、支援元素）
 * - accent: 強調色（高亮、焦點）
 * - border: 邊框/分隔線
 *
 * ## 狀態語義色彩
 * - info: 資訊提示（藍色系）
 * - success: 成功/完成（綠色系）
 * - warning: 警告/注意（黃色系）
 * - error: 錯誤/危險（紅色系）
 *
 * @reference Tailwind CSS Design Tokens [context7:tailwindlabs/tailwindcss.com:2026-01-16]
 * @reference Design Token Best Practices 2026 - Semantic Color System
 */
interface StyleDefinition {
  name: string;
  label: string;
  description: string;
  font: string;
  colors: {
    light: {
      // 核心語義色彩
      background: string;
      surface: string;
      text: string;
      textMuted: string;
      primary: string;
      secondary: string;
      accent: string;
      border: string;
      // 狀態語義色彩
      info: string;
      success: string;
      warning: string;
      error: string;
    };
    dark: {
      // 核心語義色彩
      background: string;
      surface: string;
      text: string;
      textMuted: string;
      primary: string;
      secondary: string;
      accent: string;
      border: string;
      // 狀態語義色彩
      info: string;
      success: string;
      warning: string;
      error: string;
    };
  };
}

// ============================================================================
// Style Definitions（參考 ParkKeeper）
// ============================================================================

/**
 * Nitro 風格 - 深色科技感
 * 特點：深色背景、霓虹藍綠、賽車風格
 * 靈感：賽車儀表板、霓虹燈、科幻 UI
 */
const nitroStyle: StyleDefinition = {
  name: 'nitro',
  label: 'Nitro',
  description: '深色科技感',
  font: 'font-sans',
  colors: {
    light: {
      // 核心色彩 - Nitro 淺色模式仍保持深色調
      background: '15 23 42', // slate-900 (深色為主)
      surface: '30 41 59', // slate-800
      text: '255 255 255',
      textMuted: '148 163 184', // slate-400
      primary: '0 212 255', // cyan - 霓虹藍
      secondary: '99 102 241', // indigo-500 - 電子紫
      accent: '0 255 136', // neon green - 霓虹綠
      border: '51 65 85', // slate-700
      // 狀態色彩 - 霓虹風格
      info: '56 189 248', // sky-400
      success: '52 211 153', // emerald-400
      warning: '251 191 36', // amber-400
      error: '248 113 113', // red-400
    },
    dark: {
      // 核心色彩 - 更深的科技感
      background: '2 6 23', // slate-950
      surface: '15 23 42', // slate-900
      text: '255 255 255',
      textMuted: '100 116 139', // slate-500
      primary: '0 212 255', // cyan
      secondary: '129 140 248', // indigo-400
      accent: '0 255 136', // neon green
      border: '30 41 59', // slate-800
      // 狀態色彩
      info: '56 189 248', // sky-400
      success: '52 211 153', // emerald-400
      warning: '251 191 36', // amber-400
      error: '248 113 113', // red-400
    },
  },
};

/**
 * Kawaii 風格 - 可愛粉嫩
 * 特點：奶油色背景、粉紅色調、圓潤感
 * 靈感：日系少女風、馬卡龍色系、甜點店
 */
const kawaiiStyle: StyleDefinition = {
  name: 'kawaii',
  label: 'Kawaii',
  description: '可愛粉嫩',
  font: 'font-sans',
  colors: {
    light: {
      // 核心色彩 - 溫暖粉嫩
      background: '255 250 244', // warm cream
      surface: '255 255 255',
      text: '142 124 128', // muted pink-brown
      textMuted: '180 160 165',
      primary: '255 105 180', // hot pink - 主要粉紅
      secondary: '236 72 153', // pink-500 - 深粉
      accent: '255 182 193', // light pink - 淺粉
      border: '255 228 225', // misty rose
      // 狀態色彩 - 柔和可愛風
      info: '147 197 253', // blue-300 - 天空藍
      success: '134 239 172', // green-300 - 薄荷綠
      warning: '253 224 71', // yellow-300 - 檸檬黃
      error: '252 165 165', // red-300 - 珊瑚紅
    },
    dark: {
      // 核心色彩 - 深色可愛
      background: '45 35 40', // dark mauve
      surface: '60 48 55',
      text: '255 235 238',
      textMuted: '180 160 170',
      primary: '255 130 190', // 亮粉
      secondary: '244 114 182', // pink-400
      accent: '255 182 193', // light pink
      border: '80 65 75',
      // 狀態色彩
      info: '147 197 253', // blue-300
      success: '134 239 172', // green-300
      warning: '253 224 71', // yellow-300
      error: '252 165 165', // red-300
    },
  },
};

/**
 * Zen 風格 - 極簡專業（預設）
 * 特點：純淨白底、藍灰色調、科技感
 * 靈感：Apple Design、Material Design 3、專業金融 App
 * 參考：ParkKeeper 預設風格
 */
const zenStyle: StyleDefinition = {
  name: 'zen',
  label: 'Zen',
  description: '極簡專業',
  font: 'font-sans',
  colors: {
    light: {
      // 核心色彩 - 極簡專業
      background: '248 250 252', // slate-50
      surface: '255 255 255',
      text: '15 23 42', // slate-900
      textMuted: '100 116 139', // slate-500
      primary: '30 41 59', // slate-800 - 深灰主色
      secondary: '71 85 105', // slate-600 - 中灰輔色
      accent: '59 130 246', // blue-500 - 藍色強調
      border: '226 232 240', // slate-200
      // 狀態色彩 - 標準專業
      info: '14 165 233', // sky-500
      success: '34 197 94', // green-500
      warning: '245 158 11', // amber-500
      error: '239 68 68', // red-500
    },
    dark: {
      // 核心色彩 - 深色專業
      background: '15 23 42', // slate-900
      surface: '30 41 59', // slate-800
      text: '248 250 252', // slate-50
      textMuted: '148 163 184', // slate-400
      primary: '203 213 225', // slate-300
      secondary: '148 163 184', // slate-400
      accent: '96 165 250', // blue-400
      border: '51 65 85', // slate-700
      // 狀態色彩
      info: '56 189 248', // sky-400
      success: '74 222 128', // green-400
      warning: '251 191 36', // amber-400
      error: '248 113 113', // red-400
    },
  },
};

/**
 * Classic 風格 - 復古文學
 * 特點：米白色背景、棕色調、書卷氣
 * 靈感：古典圖書館、皮革裝幀、老式打字機
 */
const classicStyle: StyleDefinition = {
  name: 'classic',
  label: 'Classic',
  description: '復古書卷',
  font: 'font-serif',
  colors: {
    light: {
      // 核心色彩 - 溫暖復古
      background: '255 250 251', // warm white - 象牙白
      surface: '255 255 255',
      text: '67 20 7', // dark brown - 深棕
      textMuted: '120 80 60', // 中棕
      primary: '139 69 19', // saddle brown - 馬鞍棕
      secondary: '161 98 7', // amber-700 - 琥珀
      accent: '180 120 80', // tan - 棕褐
      border: '245 230 220', // linen - 亞麻
      // 狀態色彩 - 復古調性
      info: '59 130 246', // blue-500 - 墨水藍
      success: '22 163 74', // green-600 - 橄欖綠
      warning: '180 83 9', // amber-700 - 琥珀警告
      error: '185 28 28', // red-700 - 磚紅
    },
    dark: {
      // 核心色彩 - 深色復古
      background: '35 25 20', // dark brown - 深棕
      surface: '50 38 32', // 咖啡色
      text: '255 245 240', // 米白
      textMuted: '180 160 150', // 淺棕
      primary: '210 160 120', // 淺棕主色
      secondary: '217 119 6', // amber-600
      accent: '180 120 80', // tan
      border: '70 55 45', // 深邊框
      // 狀態色彩
      info: '96 165 250', // blue-400
      success: '74 222 128', // green-400
      warning: '245 158 11', // amber-500
      error: '248 113 113', // red-400
    },
  },
};

/**
 * 所有風格定義
 */
export const STYLE_DEFINITIONS: Record<ThemeStyle, StyleDefinition> = {
  nitro: nitroStyle,
  kawaii: kawaiiStyle,
  zen: zenStyle,
  classic: classicStyle,
};

/**
 * 風格選項（供 UI 選擇器使用）
 */
export const STYLE_OPTIONS: {
  value: ThemeStyle;
  label: string;
  description: string;
  previewBg: string;
  previewText: string;
  previewAccent: string;
}[] = [
  {
    value: 'nitro',
    label: 'Nitro',
    description: '深色科技感',
    previewBg: 'rgb(2, 6, 23)',
    previewText: 'rgb(255, 255, 255)',
    previewAccent: 'rgb(0, 212, 255)',
  },
  {
    value: 'kawaii',
    label: 'Kawaii',
    description: '可愛粉嫩',
    previewBg: 'rgb(255, 250, 244)',
    previewText: 'rgb(142, 124, 128)',
    previewAccent: 'rgb(255, 105, 180)',
  },
  {
    value: 'zen',
    label: 'Zen',
    description: '極簡專業',
    previewBg: 'rgb(248, 250, 252)',
    previewText: 'rgb(15, 23, 42)',
    previewAccent: 'rgb(44, 62, 80)',
  },
  {
    value: 'classic',
    label: 'Classic',
    description: '復古書卷',
    previewBg: 'rgb(255, 250, 251)',
    previewText: 'rgb(67, 20, 7)',
    previewAccent: 'rgb(139, 69, 19)',
  },
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

// ============================================================================
// Theme Application
// ============================================================================

/**
 * 將主題變數應用到 DOM
 *
 * @description 使用 data attributes 和 CSS class 來控制主題
 * @param config - 主題配置
 */
export function applyTheme(config: ThemeConfig): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // 計算實際模式
  const resolvedMode =
    config.mode === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : config.mode;

  // 設定 data attributes（CSS 選擇器會根據這些值切換變數）
  root.dataset['style'] = config.style;
  root.dataset['mode'] = resolvedMode;

  // 設定 dark class（Tailwind darkMode 兼容）
  if (resolvedMode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * 預設主題配置
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  style: 'zen',
  mode: 'light',
};

/**
 * 獲取風格的顏色
 */
export function getStyleColors(
  style: ThemeStyle,
  mode: 'light' | 'dark',
): StyleDefinition['colors']['light'] {
  return STYLE_DEFINITIONS[style].colors[mode];
}
