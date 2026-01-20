/**
 * Modern Theme System - 6 Styles SSOT Architecture
 *
 * @description 現代化主題系統 - 單一真實來源（SSOT）
 *              6 種風格（僅淺色模式）
 *
 * @styles
 * - Zen: 極簡專業 - Apple/Material Design 風格（預設）
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

// ============================================================================
// Style Definitions - 6 種風格
// ============================================================================

/**
 * Zen 風格 - 極簡專業（預設）
 * 特點：純淨白底、藍灰色調、科技感
 * 靈感：Apple Design、Material Design 3、專業金融 App
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
    primary: '99 102 241', // indigo-500 - 專業紫藍
    secondary: '71 85 105', // slate-600
    accent: '59 130 246', // blue-500
    border: '226 232 240', // slate-200
    // 狀態色彩
    info: '14 165 233', // sky-500
    success: '34 197 94', // green-500
    warning: '245 158 11', // amber-500
    error: '239 68 68', // red-500
    // 圖表色彩 - 專業藍紫
    chartLine: '99 102 241', // indigo-500
    chartAreaTop: '99 102 241', // indigo-500 (40% opacity in CSS)
    chartAreaBottom: '59 130 246', // blue-500 (10% opacity in CSS)
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
    textMuted: '100 116 139', // slate-500
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
    chartLine: '0 212 255',
    chartAreaTop: '0 212 255',
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
    text: '142 124 128', // muted pink-brown
    textMuted: '180 160 165',
    primary: '255 105 180', // hot pink
    secondary: '236 72 153', // pink-500
    accent: '255 182 193', // light pink
    border: '255 228 225', // misty rose
    // 狀態色彩 - 柔和可愛風
    info: '147 197 253', // blue-300 - 天空藍
    success: '134 239 172', // green-300 - 薄荷綠
    warning: '253 224 71', // yellow-300 - 檸檬黃
    error: '252 165 165', // red-300 - 珊瑚紅
    // 圖表色彩 - 粉紅漸變
    chartLine: '255 105 180', // hot pink
    chartAreaTop: '255 105 180',
    chartAreaBottom: '255 182 193', // light pink
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
    chartLine: '139 69 19', // saddle brown
    chartAreaTop: '180 120 80', // tan
    chartAreaBottom: '245 230 220', // linen
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
    secondary: '20 184 166', // teal-500 - 青綠
    accent: '2 132 199', // sky-600 - 天空藍
    border: '186 230 253', // sky-200
    // 狀態色彩 - 海洋風格
    info: '14 165 233', // sky-500
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
    primary: '34 197 94', // green-500 - 翠綠
    secondary: '132 204 22', // lime-500 - 青檸
    accent: '22 163 74', // green-600 - 森林綠
    border: '187 247 208', // green-200
    // 狀態色彩 - 自然風格
    info: '59 130 246', // blue-500
    success: '34 197 94', // green-500
    warning: '234 179 8', // yellow-500
    error: '239 68 68', // red-500
    // 圖表色彩 - 森林綠
    chartLine: '34 197 94', // green-500
    chartAreaTop: '34 197 94',
    chartAreaBottom: '132 204 22', // lime-500
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
export const STYLE_OPTIONS: {
  value: ThemeStyle;
  label: string;
  labelEn: string;
  description: string;
  previewBg: string;
  previewText: string;
  previewAccent: string;
}[] = [
  {
    value: 'zen',
    label: 'Zen',
    labelEn: 'Zen',
    description: '極簡專業',
    previewBg: 'rgb(248, 250, 252)',
    previewText: 'rgb(15, 23, 42)',
    previewAccent: 'rgb(99, 102, 241)',
  },
  {
    value: 'nitro',
    label: 'Nitro',
    labelEn: 'Nitro',
    description: '深色科技感',
    previewBg: 'rgb(2, 6, 23)',
    previewText: 'rgb(255, 255, 255)',
    previewAccent: 'rgb(0, 212, 255)',
  },
  {
    value: 'kawaii',
    label: 'Kawaii',
    labelEn: 'Kawaii',
    description: '可愛粉嫩',
    previewBg: 'rgb(255, 250, 244)',
    previewText: 'rgb(142, 124, 128)',
    previewAccent: 'rgb(255, 105, 180)',
  },
  {
    value: 'classic',
    label: 'Classic',
    labelEn: 'Classic',
    description: '復古書卷',
    previewBg: 'rgb(255, 250, 251)',
    previewText: 'rgb(67, 20, 7)',
    previewAccent: 'rgb(139, 69, 19)',
  },
  {
    value: 'ocean',
    label: 'Ocean',
    labelEn: 'Ocean',
    description: '海洋深邃',
    previewBg: 'rgb(240, 249, 255)',
    previewText: 'rgb(7, 89, 133)',
    previewAccent: 'rgb(6, 182, 212)',
  },
  {
    value: 'forest',
    label: 'Forest',
    labelEn: 'Forest',
    description: '自然森林',
    previewBg: 'rgb(240, 253, 244)',
    previewText: 'rgb(20, 83, 45)',
    previewAccent: 'rgb(34, 197, 94)',
  },
];

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
 * 將空格分隔的 RGB 值轉換為逗號分隔格式
 * CSS Variables 使用空格分隔（如 "99 102 241"）以支援 Tailwind 的 rgb(var(--color) / <alpha>) 語法
 * 但 Canvas API (lightweight-charts) 需要標準 rgba(r, g, b, a) 格式（逗號分隔）
 *
 * @param spaceDelimited - 空格分隔的 RGB 值，如 "99 102 241"
 * @returns 逗號分隔的 RGB 值，如 "99, 102, 241"
 *
 * @reference [fix:2026-01-17] lightweight-charts addColorStop SyntaxError 修復
 */
function toCommaSeparatedRgb(spaceDelimited: string): string {
  return spaceDelimited.split(' ').join(', ');
}

/**
 * 獲取當前主題的圖表顏色（供 MiniTrendChart 使用）
 *
 * @description SSOT - 從 CSS Variables 獲取圖表配色
 *
 * [fix:2026-01-20] 高級金融 App 風格優化
 * - 線條透明度保持 100%（清晰可見）
 * - 頂部漸層透明度降至 25%（微光效果）
 * - 底部漸層透明度降至 0%（完全透明）
 * - 參考：Bloomberg、Robinhood、Revolut 等專業金融 App
 *
 * @returns 圖表顏色配置，格式為標準 rgba(r, g, b, a) 以相容 Canvas/lightweight-charts
 */
export function getChartColors(): {
  lineColor: string;
  topColor: string;
  bottomColor: string;
} {
  if (typeof window === 'undefined') {
    // SSR fallback - 使用 Zen 預設值（高級金融風格）
    return {
      lineColor: 'rgb(99, 102, 241)',
      topColor: 'rgba(99, 102, 241, 0.25)',
      bottomColor: 'rgba(59, 130, 246, 0)',
    };
  }

  const root = document.documentElement;
  const style = getComputedStyle(root);

  // CSS Variables 儲存空格分隔格式（Tailwind 相容）
  const line = style.getPropertyValue('--color-chart-line').trim() || '99 102 241';
  const top = style.getPropertyValue('--color-chart-area-top').trim() || '99 102 241';
  const bottom = style.getPropertyValue('--color-chart-area-bottom').trim() || '59 130 246';

  // 轉換為逗號分隔格式（Canvas/lightweight-charts 相容）
  // [fix:2026-01-20] 高級金融 App 風格：微光漸層（25% -> 0%）
  return {
    lineColor: `rgb(${toCommaSeparatedRgb(line)})`,
    topColor: `rgba(${toCommaSeparatedRgb(top)}, 0.25)`,
    bottomColor: `rgba(${toCommaSeparatedRgb(bottom)}, 0)`,
  };
}
