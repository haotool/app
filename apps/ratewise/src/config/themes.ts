/**
 * Modern Theme System - 7 Styles SSOT Architecture
 *
 * @description 現代化主題系統 - 單一真實來源（SSOT）
 *              7 種風格（Nitro、Racing 為深色，其餘淺色）
 *
 * @styles
 * - Zen: 極簡專業 - 品牌藍 #3182F6（預設）
 * - Violet: 經典紫 - 原 Zen 預設紫色保留
 * - Nitro: 深色科技感 - 賽車儀表板、霓虹燈
 * - Racing: 黑紅賽車 - F1 賽道紅、純黑底、機能科技感
 * - Kawaii: 可愛粉嫩 - 日系少女風、馬卡龍色系
 * - Classic: 復古書卷 - 古典圖書館、皮革裝幀
 * - Forest: 韓系簡約 - 白底柔和翠綠、有機質感
 *
 * @reference
 * - Context7: Tailwind CSS Theme Configuration [/tailwindlabs/tailwindcss.com]
 * - Design Token Best Practices 2026 - Semantic Color System
 *
 * @created 2026-01-16
 * @updated 2026-07-04 - Plan 014：Forest 改白底韓系簡約，Ocean 移除並以 Racing 黑紅賽車取代
 * @version 5.0.0
 */

// 附 .ts 副檔名：themes.ts 亦被 prebuild node 腳本（type stripping）直接載入，需明確副檔名。
import {
  CUSTOM_THEME_CSS_VARS,
  DEFAULT_CUSTOM_BACKGROUND_TONE,
  DEFAULT_CUSTOM_PRIMARY,
  deriveCustomThemeCssVars,
  hexToRgbTriple,
  isValidBackgroundTone,
  isValidHexColor,
  type CustomBackgroundTone,
} from './custom-theme.ts';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * 內建風格類型 - 7 種靜態定義風格（STYLE_DEFINITIONS 的鍵集合）
 */
export type BuiltinThemeStyle =
  | 'zen'
  | 'violet'
  | 'nitro'
  | 'racing'
  | 'kawaii'
  | 'classic'
  | 'forest';

/**
 * 風格類型 - 內建 7 風格 + custom（runtime 演算，不進 STYLE_DEFINITIONS）
 */
export type ThemeStyle = BuiltinThemeStyle | 'custom';

/**
 * 完整主題配置
 */
export interface ThemeConfig {
  style: ThemeStyle;
  /** style === 'custom' 時的使用者主色（#RRGGBB）；切回內建主題時保留以便再次啟用。 */
  customPrimary?: string;
  /** style === 'custom' 時的背景色調；舊持久化資料缺省時視為 'pure'（向後相容）。 */
  customBackgroundTone?: CustomBackgroundTone;
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
  /** 主色深階：白字實底與淺底強調文字的 AA 對比用（多數主題與 primary 同值）。 */
  primaryStrong: string;
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
// Style Definitions - 7 種風格
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
    primary: '49 130 246', // #3182F6 - 品牌藍（與 index.css 渲染值同步）
    primaryStrong: '27 100 218', // #1B64DA - Deep 600（白字 AA 對比）
    secondary: '99 102 241', // indigo-500 - 靛藍輔色（與 index.css 渲染值同步）
    accent: '59 130 246', // blue-500
    border: '226 232 240', // slate-200
    // 狀態色彩
    info: '14 165 233', // sky-500
    success: '34 197 94', // green-500
    warning: '245 158 11', // amber-500
    error: '239 68 68', // red-500
    // 圖表色彩 - 品牌藍
    chartLine: '59 130 246', // blue-500（與 index.css 同步）
    chartAreaTop: '59 130 246', // blue-500 (40% opacity in CSS)
    chartAreaBottom: '59 130 246', // blue-500 (10% opacity in CSS)
  },
};

/**
 * Violet 風格 - 經典紫
 * 特點：純淨白底、紫羅蘭主色；2026-07 品牌藍改版前的原始預設配色保留
 */
const violetStyle: StyleDefinition = {
  name: 'violet',
  label: 'Violet',
  labelEn: 'Violet',
  description: '經典紫',
  descriptionEn: 'Classic Violet',
  font: 'font-sans',
  colors: {
    // 核心色彩（原 Zen 預設）
    background: '248 250 252', // slate-50
    surface: '255 255 255',
    text: '15 23 42', // slate-900
    textMuted: '100 116 139', // slate-500
    primary: '124 58 237', // violet-600 - 經典紫主色
    primaryStrong: '124 58 237', // 同 primary（白字對比已達 AA）
    secondary: '99 102 241', // indigo-500 - 靛藍輔色（與 index.css 渲染值同步）
    accent: '139 92 246', // violet-500（與 index.css 渲染值同步）
    border: '226 232 240', // slate-200
    // 狀態色彩
    info: '14 165 233', // sky-500
    success: '34 197 94', // green-500
    warning: '245 158 11', // amber-500
    error: '239 68 68', // red-500
    // 圖表色彩 - 經典紫
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
    textMuted: '203 213 225', // slate-300（修正 slate-500 在深底對比過低、次要文字看不清）
    primary: '0 150 230', // 霓虹藍（深電光，圖形/大字維持 3:1；品牌色不動）
    primaryStrong: '0 113 173', // 同色相加深（#609 白字表面錨點，白字 5.30:1 AA）
    secondary: '129 140 248', // indigo-400
    accent: '0 255 136', // neon green
    border: '30 41 59', // slate-800
    // 狀態色彩
    info: '56 189 248',
    success: '52 211 153',
    warning: '251 191 36',
    error: '248 113 113',
    // 圖表色彩 - 霓虹藍綠（與 index.css 同步，修 TS↔CSS drift）
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
    text: '107 74 82', // deep pink-brown（對 background 7.42:1，AA）
    textMuted: '126 92 100', // 對 background 5.62:1，AA
    primary: '255 105 180', // hot pink
    primaryStrong: '219 39 119', // pink-600（白字 AA 對比）
    secondary: '236 72 153', // pink-500
    accent: '255 182 193', // light pink
    border: '255 228 225', // misty rose
    // 狀態色彩 - 柔和可愛風
    info: '147 197 253', // blue-300 - 天空藍
    success: '134 239 172', // green-300 - 薄荷綠
    warning: '253 224 71', // yellow-300 - 檸檬黃
    error: '252 165 165', // red-300 - 珊瑚紅
    // 圖表色彩 - 粉紅漸變（與 index.css 渲染值同步）
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
    primaryStrong: '139 69 19', // 同 primary（白字對比已達 AA）
    secondary: '161 98 7', // amber-700 - 琥珀
    accent: '180 120 80', // tan - 棕褐
    border: '245 230 220', // linen - 亞麻
    // 狀態色彩 - 復古調性
    info: '59 130 246', // blue-500 - 墨水藍
    success: '22 163 74', // green-600 - 橄欖綠
    warning: '180 83 9', // amber-700 - 琥珀警告
    error: '185 28 28', // red-700 - 磚紅
    // 圖表色彩 - 琥珀漸變（與 index.css 渲染值同步）
    chartLine: '180 83 9', // amber-700
    chartAreaTop: '180 83 9', // amber-700
    chartAreaBottom: '217 119 6', // amber-600
  },
};

/**
 * Racing 風格 - 黑紅賽車
 * 特點：純黑底、賽道紅、機能科技感
 * 靈感：F1 賽車儀表板、Pit Wall HUD、賽道旗幟
 */
const racingStyle: StyleDefinition = {
  name: 'racing',
  label: 'Racing',
  labelEn: 'Racing',
  description: '黑紅賽車',
  descriptionEn: 'Racing',
  font: 'font-sans',
  colors: {
    // 純黑賽道感（固定為深色調，結構比照 Nitro）
    background: '10 10 10', // near-black
    surface: '23 23 23', // neutral-900
    text: '250 250 250',
    textMuted: '163 163 163', // neutral-400
    primary: '239 68 68', // red-500 - 賽道紅
    primaryStrong: '220 38 38', // red-600（白字 AA 對比 4.83:1）
    secondary: '129 140 248', // indigo-400
    accent: '248 113 113', // red-400
    border: '38 38 38', // neutral-800
    // 狀態色彩（error 與 primary 紅色系區隔，改用 orange）
    info: '56 189 248',
    success: '52 211 153',
    warning: '251 191 36',
    error: '251 146 60', // orange-400（與 surface 對比 7.92:1，避免與 primary 紅混淆）
    // 圖表色彩 - 賽道紅
    chartLine: '239 68 68', // red-500
    chartAreaTop: '239 68 68',
    chartAreaBottom: '248 113 113', // red-400
  },
};

/**
 * Forest 風格 - 韓系簡約
 * 特點：白底韓系簡約、柔和翠綠、有機質感
 * 靈感：韓系極簡設計、Zen 白底範式、自然療癒綠意
 */
const forestStyle: StyleDefinition = {
  name: 'forest',
  label: 'Forest',
  labelEn: 'Forest',
  description: '韓系簡約',
  descriptionEn: 'Korean Minimal',
  font: 'font-sans',
  colors: {
    // 白底韓系簡約（範式對齊 Zen，底色全面改白/近白）
    background: '250 250 249', // stone-50 - 微暖白
    surface: '255 255 255',
    text: '28 25 23', // stone-900
    textMuted: '120 113 108', // stone-500
    primary: '5 150 105', // emerald-600 - 柔和翠綠（韓系簡約降飽和）
    primaryStrong: '4 120 87', // emerald-700（白字 AA 對比 5.49:1）
    secondary: '132 204 22', // lime-500 - 青檸
    accent: '22 163 74', // green-600 - 森林綠
    border: '231 229 228', // stone-200
    // 狀態色彩 - 自然風格
    info: '59 130 246', // blue-500
    success: '34 197 94', // green-500
    warning: '234 179 8', // yellow-500
    error: '239 68 68', // red-500
    // 圖表色彩 - 森林綠
    chartLine: '5 150 105', // emerald-600
    chartAreaTop: '5 150 105',
    chartAreaBottom: '132 204 22', // lime-500
  },
};

// ============================================================================
// Exports
// ============================================================================

/**
 * 所有內建風格定義（custom 為 runtime 演算，刻意不進本表以維持 7×16 靜態同步合約）
 */
export const STYLE_DEFINITIONS: Record<BuiltinThemeStyle, StyleDefinition> = {
  zen: zenStyle,
  violet: violetStyle,
  nitro: nitroStyle,
  racing: racingStyle,
  kawaii: kawaiiStyle,
  classic: classicStyle,
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
    previewAccent: 'rgb(49, 130, 246)',
  },
  {
    value: 'violet',
    label: 'Violet',
    labelEn: 'Violet',
    description: '經典紫',
    previewBg: 'rgb(248, 250, 252)',
    previewText: 'rgb(15, 23, 42)',
    previewAccent: 'rgb(124, 58, 237)',
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
    value: 'racing',
    label: 'Racing',
    labelEn: 'Racing',
    description: '黑紅賽車',
    previewBg: 'rgb(10, 10, 10)',
    previewText: 'rgb(250, 250, 250)',
    previewAccent: 'rgb(239, 68, 68)',
  },
  {
    value: 'kawaii',
    label: 'Kawaii',
    labelEn: 'Kawaii',
    description: '可愛粉嫩',
    previewBg: 'rgb(255, 250, 244)',
    previewText: 'rgb(107, 74, 82)',
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
    value: 'forest',
    label: 'Forest',
    labelEn: 'Forest',
    description: '韓系簡約',
    previewBg: 'rgb(250, 250, 249)',
    previewText: 'rgb(28, 25, 23)',
    previewAccent: 'rgb(5, 150, 105)',
  },
];

// ============================================================================
// Theme Application
// ============================================================================

/** zen primary 的 hex 值（theme-color meta 的內建主題預設）。 */
const ZEN_THEME_COLOR = `#${STYLE_DEFINITIONS.zen.colors.primary
  .split(' ')
  .map((channel) => Number.parseInt(channel, 10).toString(16).padStart(2, '0'))
  .join('')
  .toUpperCase()}`;

/** 更新 theme-color meta（PWA 狀態列跟隨 custom 主色，切回內建主題還原品牌藍）。 */
function updateThemeColorMeta(hex: string): void {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex);
}

/**
 * custom 覆寫層：style === 'custom' 時由主色演算導出整組變數寫至 documentElement；
 * 切回內建主題時清除全部 inline 覆寫（靜態 [data-style] 區塊接手）。
 */
function applyCustomThemeOverrides(root: HTMLElement, config: ThemeConfig): void {
  if (config.style !== 'custom') {
    CUSTOM_THEME_CSS_VARS.forEach((cssVar) => root.style.removeProperty(cssVar));
    updateThemeColorMeta(ZEN_THEME_COLOR);
    return;
  }

  const primaryHex = isValidHexColor(config.customPrimary)
    ? config.customPrimary
    : DEFAULT_CUSTOM_PRIMARY;
  const backgroundTone = isValidBackgroundTone(config.customBackgroundTone)
    ? config.customBackgroundTone
    : DEFAULT_CUSTOM_BACKGROUND_TONE;
  const derived = deriveCustomThemeCssVars(primaryHex, backgroundTone);
  CUSTOM_THEME_CSS_VARS.forEach((cssVar) => root.style.setProperty(cssVar, derived[cssVar]));
  // 與 bootstrap pre-paint 同為 identity 映射（hex → 'R G B'），保證雙端一致。
  root.style.setProperty('--color-primary', hexToRgbTriple(primaryHex));
  updateThemeColorMeta(primaryHex);
}

/**
 * 將主題變數應用到 DOM
 *
 * @description 使用 data attributes 來控制主題；custom 主題另以 inline CSS 變數覆寫主色系列
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

  // 設定字體（Classic 使用 serif；custom 底座為 zen，同 font-sans）
  const fontFamily =
    config.style === 'custom' ? zenStyle.font : STYLE_DEFINITIONS[config.style].font;
  if (fontFamily === 'font-serif') {
    root.classList.add('font-serif');
    root.classList.remove('font-sans');
  } else {
    root.classList.add('font-sans');
    root.classList.remove('font-serif');
  }

  applyCustomThemeOverrides(root, config);
}

/**
 * 預設主題配置
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  style: 'zen',
};

/**
 * 獲取內建風格的顏色（custom 為 runtime 演算，請改用 deriveCustomThemeCssVars）
 */
export function getStyleColors(style: BuiltinThemeStyle): SemanticColors {
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
 */
function toCommaSeparatedRgb(spaceDelimited: string): string {
  return spaceDelimited.split(' ').join(', ');
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
  if (typeof window === 'undefined') {
    // SSR fallback - 使用 Zen 預設值（品牌藍圖表色）
    return {
      lineColor: 'rgb(59, 130, 246)',
      topColor: 'rgba(59, 130, 246, 0.25)',
      bottomColor: 'rgba(59, 130, 246, 0)',
    };
  }

  const root = document.documentElement;
  const style = getComputedStyle(root);

  // CSS Variables 儲存空格分隔格式（Tailwind 相容）
  const line = style.getPropertyValue('--color-chart-line').trim() || '99 102 241';
  const top = style.getPropertyValue('--color-chart-area-top').trim() || '99 102 241';
  const bottom = style.getPropertyValue('--color-chart-area-bottom').trim() || '59 130 246';

  // Convert to comma-separated format for Canvas/lightweight-charts
  return {
    lineColor: `rgb(${toCommaSeparatedRgb(line)})`,
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
 *              支援 7 種風格的主題感知顏色
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
 * 用於 ChristmasTree、MiniChristmasTree、SnowAccumulation 等組件
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
