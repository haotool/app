/**
 * Modern Theme System - 6 Styles SSOT Architecture
 *
 * @description 現代化主題系統 - 單一真實來源（SSOT）
 *              6 種風格（僅淺色模式）
 *
 * @styles
 * - Zen: 極簡專業 - violet/indigo 產品基準（預設）
 * - Nitro: 深色科技感 - 賽車儀表板、霓虹燈
 * - Kawaii: 可愛粉嫩 - 日系少女風、馬卡龍色系
 * - Classic: 復古書卷 - 古典圖書館、皮革裝幀
 * - Ocean: 海洋深邃 - 深海藍綠、專業金融
 * - Forest: 自然森林 - 環保綠意、有機質感
 *
 * @reference
 * - Context7: Tailwind CSS Theme Configuration [/tailwindlabs/tailwindcss.com]
 * - Design Token Best Practices 2026 - Semantic Color System
 *
 * @created 2026-01-16
 * @updated 2026-01-17 - 移除深色模式，簡化為單一色彩配置
 * @version 4.0.0
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * 風格類型 - 6 種可選風格
 */
export type ThemeStyle = 'zen' | 'nitro' | 'kawaii' | 'classic' | 'ocean' | 'forest';

/**
 * 完整主題配置
 */
export interface ThemeConfig {
  style: ThemeStyle;
}

/**
 * 語義化色彩 Token
 *
 * @description 符合 Design Token 最佳實踐 2026
 *
 * ## 核心語義色彩（8 個）
 * - background: 頁面背景
 * - surface: 卡片/面板背景
 * - text: 主要文字
 * - textMuted: 次要文字
 * - primary: 主色（CTA、主要互動）
 * - secondary: 輔色（次要互動、支援元素）
 * - accent: 強調色（高亮、焦點）
 * - border: 邊框/分隔線
 *
 * ## 狀態語義色彩（4 個）
 * - info: 資訊提示（藍色系）
 * - success: 成功/完成/上漲（綠色系）
 * - warning: 警告/注意（黃色系）
 * - error: 錯誤/危險/下跌（紅色系）
 *
 * ## 圖表專用色彩（3 個）- SSOT
 * - chartLine: 趨勢線顏色
 * - chartAreaTop: 面積圖頂部漸變
 * - chartAreaBottom: 面積圖底部漸變
 */
interface SemanticColors {
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
  // 圖表專用色彩
  chartLine: string;
  chartAreaTop: string;
  chartAreaBottom: string;
}

/**
 * 風格定義
 */
interface StyleDefinition {
  name: string;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  font: string;
  colors: SemanticColors;
}

export interface StyleOption {
  value: ThemeStyle;
  label: string;
  labelEn: string;
  description: string;
  previewBg: string;
  previewText: string;
  previewAccent: string;
}

// ============================================================================
// Style Definitions - 6 種風格
// ============================================================================

/**
 * Zen 風格 - 極簡專業（預設）
 * 特點：純淨白底、violet/indigo 品牌層次、資訊優先
 * 靈感：成熟金融工具、安靜的產品介面
 */
const zenStyle: StyleDefinition = {
  name: 'zen',
  label: 'Zen',
  labelEn: 'Zen',
  description: '極簡專業',
  descriptionEn: 'Minimal Pro',
  font: 'font-sans',
  colors: {
    // 核心色彩
    background: '248 250 252', // slate-50
    surface: '255 255 255',
    text: '15 23 42', // slate-900
    textMuted: '100 116 139', // slate-500
    primary: '124 58 237', // violet-600
    secondary: '99 102 241', // indigo-500
    accent: '139 92 246', // violet-500
    border: '226 232 240', // slate-200
    // 狀態色彩
    info: '14 165 233', // sky-500
    success: '34 197 94', // green-500
    warning: '245 158 11', // amber-500
    error: '239 68 68', // red-500
    // 圖表色彩 - violet/blue 主支現代語言
    chartLine: '139 92 246', // violet-500
    chartAreaTop: '139 92 246', // violet-500
    chartAreaBottom: '59 130 246', // blue-500
  },
};

/**
 * Nitro 風格 - 深色科技感
 * 特點：深色背景、霓虹藍綠、賽車風格
 * 靈感：賽車儀表板、霓虹燈、科幻 UI
 */
const nitroStyle: StyleDefinition = {
  name: 'nitro',
  label: 'Nitro',
  labelEn: 'Nitro',
  description: '深色科技感',
  descriptionEn: 'Tech Dark',
  font: 'font-sans',
  colors: {
    // 深色科技感（固定為深色調）
    background: '2 6 23', // slate-950
    surface: '15 23 42', // slate-900
    text: '255 255 255',
    textMuted: '203 213 225', // slate-300
    primary: '0 212 255', // cyan
    secondary: '129 140 248', // indigo-400
    accent: '0 255 136', // neon green
    border: '30 41 59', // slate-800
    // 狀態色彩
    info: '56 189 248',
    success: '52 211 153',
    warning: '251 191 36',
    error: '248 113 113',
    // 圖表色彩 - 霓虹藍綠
    chartLine: '103 232 249', // cyan-300
    chartAreaTop: '103 232 249', // cyan-300
    chartAreaBottom: '0 255 136',
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
  labelEn: 'Kawaii',
  description: '可愛粉嫩',
  descriptionEn: 'Cute Pink',
  font: 'font-sans',
  colors: {
    // 溫暖粉嫩
    background: '255 250 244', // warm cream
    surface: '255 255 255',
    text: '92 45 60', // accessible deep rose
    textMuted: '102 65 76',
    primary: '190 24 93', // pink-700
    secondary: '190 24 93', // pink-700
    accent: '255 182 193', // light pink
    border: '255 228 225', // misty rose
    // 狀態色彩 - 柔和可愛風
    info: '147 197 253', // blue-300 - 天空藍
    success: '134 239 172', // green-300 - 薄荷綠
    warning: '253 224 71', // yellow-300 - 檸檬黃
    error: '252 165 165', // red-300 - 珊瑚紅
    // 圖表色彩 - 粉紅漸變
    chartLine: '236 72 153', // pink-500
    chartAreaTop: '236 72 153', // pink-500
    chartAreaBottom: '244 114 182', // pink-400
  },
};

/**
 * Classic 風格 - 復古書卷
 * 特點：米白色背景、棕色調、書卷氣
 * 靈感：古典圖書館、皮革裝幀、老式打字機
 */
const classicStyle: StyleDefinition = {
  name: 'classic',
  label: 'Classic',
  labelEn: 'Classic',
  description: '復古書卷',
  descriptionEn: 'Vintage',
  font: 'font-serif',
  colors: {
    // 溫暖復古
    background: '255 250 251', // warm white - 象牙白
    surface: '255 255 255',
    text: '67 20 7', // dark brown
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
    // 圖表色彩 - 復古棕
    chartLine: '180 83 9', // amber-700
    chartAreaTop: '180 83 9', // amber-700
    chartAreaBottom: '217 119 6', // amber-600
  },
};

/**
 * Ocean 風格 - 海洋深邃
 * 特點：深海藍綠、專業金融感、沉穩大氣
 * 靈感：深海、專業投資平台、Bloomberg Terminal
 */
const oceanStyle: StyleDefinition = {
  name: 'ocean',
  label: 'Ocean',
  labelEn: 'Ocean',
  description: '海洋深邃',
  descriptionEn: 'Deep Ocean',
  font: 'font-sans',
  colors: {
    // 淺海藍
    background: '240 249 255', // sky-50 - 淺藍
    surface: '255 255 255',
    text: '7 89 133', // cyan-800 - 深海藍
    textMuted: '22 78 99', // cyan-900 lightened
    primary: '6 182 212', // cyan-500 - 海水藍
    secondary: '14 165 233', // sky-500 - 青藍
    accent: '20 184 166', // teal-500 - 海水綠
    border: '186 230 253', // sky-200
    // 狀態色彩 - 海洋風格
    info: '56 189 248', // sky-400
    success: '20 184 166', // teal-500
    warning: '245 158 11', // amber-500
    error: '239 68 68', // red-500
    // 圖表色彩 - 海洋藍綠
    chartLine: '6 182 212', // cyan-500
    chartAreaTop: '6 182 212',
    chartAreaBottom: '20 184 166', // teal-500
  },
};

/**
 * Forest 風格 - 自然森林
 * 特點：環保綠意、有機質感、自然療癒
 * 靈感：森林、有機產品、永續設計
 */
const forestStyle: StyleDefinition = {
  name: 'forest',
  label: 'Forest',
  labelEn: 'Forest',
  description: '自然森林',
  descriptionEn: 'Natural Green',
  font: 'font-sans',
  colors: {
    // 清新綠意
    background: '240 253 244', // green-50 - 薄荷綠
    surface: '255 255 255',
    text: '20 83 45', // green-800 - 深綠
    textMuted: '22 101 52', // green-700
    primary: '5 150 105', // emerald-600 - 森林主色
    secondary: '22 163 74', // green-600 - 次要綠
    accent: '101 163 13', // lime-600 - 青檸點綴
    border: '187 247 208', // green-200
    // 狀態色彩 - 自然風格
    info: '59 130 246', // blue-500
    success: '34 197 94', // green-500
    warning: '234 179 8', // yellow-500
    error: '239 68 68', // red-500
    // 圖表色彩 - 森林綠
    chartLine: '5 150 105', // emerald-600
    chartAreaTop: '5 150 105', // emerald-600
    chartAreaBottom: '34 197 94', // green-500
  },
};

// ============================================================================
// Exports
// ============================================================================

/**
 * 所有風格定義
 */
export const STYLE_DEFINITIONS: Record<ThemeStyle, StyleDefinition> = {
  zen: zenStyle,
  nitro: nitroStyle,
  kawaii: kawaiiStyle,
  classic: classicStyle,
  ocean: oceanStyle,
  forest: forestStyle,
};

/**
 * 風格選項（供 UI 選擇器使用）
 */
function toCommaSeparatedRgb(spaceDelimited: string): string {
  return spaceDelimited.split(' ').join(', ');
}

function toRgbColor(spaceDelimited: string): string {
  return `rgb(${toCommaSeparatedRgb(spaceDelimited)})`;
}

function buildStyleOption(value: ThemeStyle, definition: StyleDefinition): StyleOption {
  return {
    value,
    label: definition.label,
    labelEn: definition.labelEn,
    description: definition.description,
    previewBg: toRgbColor(definition.colors.background),
    previewText: toRgbColor(definition.colors.text),
    previewAccent: toRgbColor(definition.colors.primary),
  };
}

export const STYLE_OPTIONS: StyleOption[] = (
  Object.entries(STYLE_DEFINITIONS) as [ThemeStyle, StyleDefinition][]
).map(([value, definition]) => buildStyleOption(value, definition));

// ============================================================================
// Theme Application
// ============================================================================

/**
 * 將主題變數應用到 DOM
 *
 * @description 使用 data attributes 來控制主題
 * @param config - 主題配置
 */
export function applyTheme(config: ThemeConfig): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // 設定 data attribute（CSS 選擇器會根據這些值切換變數）
  root.dataset['style'] = config.style;

  // 移除深色模式相關屬性
  delete root.dataset['mode'];
  root.classList.remove('dark');

  // 設定字體（Classic 使用 serif）
  const fontFamily = STYLE_DEFINITIONS[config.style].font;
  if (fontFamily === 'font-serif') {
    root.classList.add('font-serif');
    root.classList.remove('font-sans');
  } else {
    root.classList.add('font-sans');
    root.classList.remove('font-serif');
  }
}

/**
 * 預設主題配置
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  style: 'zen',
};

/**
 * 獲取風格的顏色
 */
export function getStyleColors(style: ThemeStyle): SemanticColors {
  return STYLE_DEFINITIONS[style].colors;
}

/**
 * 獲取當前主題的圖表顏色（供 MiniTrendChart 使用）
 *
 * SSOT - 從 CSS Variables 獲取圖表配色。
 * 採用高級金融 App 風格：線條 100% 透明度、頂部 25%、底部 0%
 *
 * @returns 圖表顏色配置，格式為標準 rgba(r, g, b, a) 以相容 Canvas/lightweight-charts
 */
export function getChartColors(): {
  lineColor: string;
  topColor: string;
  bottomColor: string;
} {
  const fallbackColors = getStyleColors(DEFAULT_THEME_CONFIG.style);

  if (typeof window === 'undefined') {
    // SSR fallback - 使用預設風格的圖表色彩
    return {
      lineColor: toRgbColor(fallbackColors.chartLine),
      topColor: `rgba(${toCommaSeparatedRgb(fallbackColors.chartAreaTop)}, 0.25)`,
      bottomColor: `rgba(${toCommaSeparatedRgb(fallbackColors.chartAreaBottom)}, 0)`,
    };
  }

  const root = document.documentElement;
  const style = getComputedStyle(root);

  // CSS Variables 儲存空格分隔格式（Tailwind 相容）
  const line = style.getPropertyValue('--color-chart-line').trim() || fallbackColors.chartLine;
  const top =
    style.getPropertyValue('--color-chart-area-top').trim() || fallbackColors.chartAreaTop;
  const bottom =
    style.getPropertyValue('--color-chart-area-bottom').trim() || fallbackColors.chartAreaBottom;

  // Convert to comma-separated format for Canvas/lightweight-charts
  return {
    lineColor: toRgbColor(line),
    topColor: `rgba(${toCommaSeparatedRgb(top)}, 0.25)`,
    bottomColor: `rgba(${toCommaSeparatedRgb(bottom)}, 0)`,
  };
}

// ============================================================================
// Seasonal Colors - 季節性主題顏色
// ============================================================================

/**
 * 季節性顏色配置介面
 *
 * @description 用於聖誕節、冬季等季節性裝飾組件
 *              支援 6 種風格的主題感知顏色
 *
 * @created 2026-01-24
 */
export interface SeasonalColors {
  /** 星星顏色 */
  star: string;
  starStroke: string;
  starGlow: string;
  /** 樹冠顏色 */
  tree: string;
  treeDark: string;
  treeStroke: string;
  /** 樹幹顏色 */
  trunk: string;
  trunkDark: string;
  trunkStroke: string;
  /** 裝飾球顏色 */
  ornamentRed: string;
  ornamentRedStroke: string;
  ornamentGold: string;
  ornamentGoldStroke: string;
  ornamentBlue: string;
  ornamentBlueStroke: string;
  /** 積雪顏色 */
  snow: string;
  snowShadow: string;
  /** 底座顏色 */
  base: string;
  baseStroke: string;
}

/**
 * 獲取當前主題的季節性顏色（供 Easter Egg 組件使用）
 *
 * SSOT - 從 CSS Variables 獲取季節性配色
 * 用於 ChristmasTree、MiniChristmasTree 等組件
 *
 * @returns 季節性顏色配置，格式為標準 rgb(r, g, b)
 */
export function getSeasonalColors(): SeasonalColors {
  // SSR fallback - 使用 Zen 預設值
  const defaultColors: SeasonalColors = {
    star: '#fbbf24',
    starStroke: '#f59e0b',
    starGlow: '#fef08a',
    tree: '#22c55e',
    treeDark: '#166534',
    treeStroke: '#14532d',
    trunk: '#92400e',
    trunkDark: '#78350f',
    trunkStroke: '#451a03',
    ornamentRed: '#ef4444',
    ornamentRedStroke: '#dc2626',
    ornamentGold: '#fbbf24',
    ornamentGoldStroke: '#f59e0b',
    ornamentBlue: '#3b82f6',
    ornamentBlueStroke: '#2563eb',
    snow: '#ffffff',
    snowShadow: '#f8fafc',
    base: '#dc2626',
    baseStroke: '#b91c1c',
  };

  if (typeof window === 'undefined') {
    return defaultColors;
  }

  const root = document.documentElement;
  const style = getComputedStyle(root);

  /**
   * 將 CSS 變數值轉換為 rgb() 格式
   * @param varName CSS 變數名稱
   * @param fallback 預設值（hex 格式）
   */
  const getColor = (varName: string, fallback: string): string => {
    const value = style.getPropertyValue(varName).trim();
    if (!value) return fallback;
    return `rgb(${toCommaSeparatedRgb(value)})`;
  };

  return {
    // 星星
    star: getColor('--color-seasonal-star', defaultColors.star),
    starStroke: getColor('--color-seasonal-star-stroke', defaultColors.starStroke),
    starGlow: getColor('--color-seasonal-star-glow', defaultColors.starGlow),
    // 樹冠
    tree: getColor('--color-seasonal-tree', defaultColors.tree),
    treeDark: getColor('--color-seasonal-tree-dark', defaultColors.treeDark),
    treeStroke: getColor('--color-seasonal-tree-stroke', defaultColors.treeStroke),
    // 樹幹
    trunk: getColor('--color-seasonal-trunk', defaultColors.trunk),
    trunkDark: getColor('--color-seasonal-trunk-dark', defaultColors.trunkDark),
    trunkStroke: getColor('--color-seasonal-trunk-stroke', defaultColors.trunkStroke),
    // 裝飾球
    ornamentRed: getColor('--color-seasonal-ornament-red', defaultColors.ornamentRed),
    ornamentRedStroke: getColor(
      '--color-seasonal-ornament-red-stroke',
      defaultColors.ornamentRedStroke,
    ),
    ornamentGold: getColor('--color-seasonal-ornament-gold', defaultColors.ornamentGold),
    ornamentGoldStroke: getColor(
      '--color-seasonal-ornament-gold-stroke',
      defaultColors.ornamentGoldStroke,
    ),
    ornamentBlue: getColor('--color-seasonal-ornament-blue', defaultColors.ornamentBlue),
    ornamentBlueStroke: getColor(
      '--color-seasonal-ornament-blue-stroke',
      defaultColors.ornamentBlueStroke,
    ),
    // 積雪
    snow: getColor('--color-seasonal-snow', defaultColors.snow),
    snowShadow: getColor('--color-seasonal-snow-shadow', defaultColors.snowShadow),
    // 底座
    base: getColor('--color-seasonal-base', defaultColors.base),
    baseStroke: getColor('--color-seasonal-base-stroke', defaultColors.baseStroke),
  };
}
