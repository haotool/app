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
 */
interface StyleDefinition {
  name: string;
  label: string;
  description: string;
  font: string;
  colors: {
    light: {
      background: string;
      surface: string;
      text: string;
      textMuted: string;
      primary: string;
      accent: string;
      border: string;
    };
    dark: {
      background: string;
      surface: string;
      text: string;
      textMuted: string;
      primary: string;
      accent: string;
      border: string;
    };
  };
}

// ============================================================================
// Style Definitions（參考 ParkKeeper）
// ============================================================================

/**
 * Nitro 風格 - 深色科技感
 * 特點：深色背景、霓虹藍綠、賽車風格
 */
const nitroStyle: StyleDefinition = {
  name: 'nitro',
  label: 'Nitro',
  description: '深色科技感',
  font: 'font-sans',
  colors: {
    light: {
      background: '15 23 42', // slate-900 (深色為主)
      surface: '30 41 59', // slate-800
      text: '255 255 255',
      textMuted: '148 163 184', // slate-400
      primary: '0 212 255', // cyan
      accent: '0 255 136', // neon green
      border: '51 65 85', // slate-700
    },
    dark: {
      background: '2 6 23', // slate-950
      surface: '15 23 42', // slate-900
      text: '255 255 255',
      textMuted: '100 116 139', // slate-500
      primary: '0 212 255',
      accent: '0 255 136',
      border: '30 41 59', // slate-800
    },
  },
};

/**
 * Kawaii 風格 - 可愛粉嫩
 * 特點：奶油色背景、粉紅色調、圓潤感
 */
const kawaiiStyle: StyleDefinition = {
  name: 'kawaii',
  label: 'Kawaii',
  description: '可愛粉嫩',
  font: 'font-sans',
  colors: {
    light: {
      background: '255 250 244', // warm cream
      surface: '255 255 255',
      text: '142 124 128', // muted pink-brown
      textMuted: '180 160 165',
      primary: '255 105 180', // hot pink
      accent: '255 182 193', // light pink
      border: '255 228 225', // misty rose
    },
    dark: {
      background: '45 35 40', // dark mauve
      surface: '60 48 55',
      text: '255 235 238',
      textMuted: '180 160 170',
      primary: '255 130 190',
      accent: '255 182 193',
      border: '80 65 75',
    },
  },
};

/**
 * Zen 風格 - 極簡專業（預設）
 * 特點：純淨白底、藍灰色調、科技感
 * 參考：ParkKeeper 預設風格
 */
const zenStyle: StyleDefinition = {
  name: 'zen',
  label: 'Zen',
  description: '極簡專業',
  font: 'font-sans',
  colors: {
    light: {
      background: '248 250 252', // slate-50
      surface: '255 255 255',
      text: '15 23 42', // slate-900
      textMuted: '100 116 139', // slate-500
      primary: '30 41 59', // slate-800
      accent: '59 130 246', // blue-500
      border: '226 232 240', // slate-200
    },
    dark: {
      background: '15 23 42', // slate-900
      surface: '30 41 59', // slate-800
      text: '248 250 252', // slate-50
      textMuted: '148 163 184', // slate-400
      primary: '203 213 225', // slate-300
      accent: '96 165 250', // blue-400
      border: '51 65 85', // slate-700
    },
  },
};

/**
 * Classic 風格 - 復古文學
 * 特點：米白色背景、棕色調、書卷氣
 */
const classicStyle: StyleDefinition = {
  name: 'classic',
  label: 'Classic',
  description: '復古書卷',
  font: 'font-serif',
  colors: {
    light: {
      background: '255 250 251', // warm white
      surface: '255 255 255',
      text: '67 20 7', // dark brown
      textMuted: '120 80 60',
      primary: '139 69 19', // saddle brown
      accent: '180 120 80', // tan
      border: '245 230 220', // linen
    },
    dark: {
      background: '35 25 20', // dark brown
      surface: '50 38 32',
      text: '255 245 240',
      textMuted: '180 160 150',
      primary: '210 160 120',
      accent: '180 120 80',
      border: '70 55 45',
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
