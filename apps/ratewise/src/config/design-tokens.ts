/**
 * Design Token System - Single Source of Truth
 *
 * @file design-tokens.ts
 * @description 統一管理應用色彩、間距、字體等設計 token
 *
 * @see docs/design/COLOR_SCHEME_OPTIONS.md - 方案 A: 品牌對齊
 * @see docs/dev/005_design_token_refactoring.md - 技術決策記錄
 *
 * @reference Context7 - Tailwind CSS Official Docs:
 * - https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/colors.mdx
 * - https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/theme.mdx
 *
 * @created 2026-01-12
 * @version 1.0.0
 */

import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

/**
 * Semantic Colors - 語義化色彩系統
 *
 * 基於 Context7 官方最佳實踐，定義應用層級的語義化色彩
 * 使用語義化命名取代硬編碼的 Tailwind 類別
 */
export const semanticColors = {
  /**
   * 中性色系（Neutral）
   * 用途：數字鍵、背景、文字
   * 映射：slate 色系
   */
  neutral: {
    light: colors.slate[100], // 數字鍵背景
    DEFAULT: colors.slate[200], // hover 狀態 / 功能鍵背景
    dark: colors.slate[300], // active 狀態
    darker: colors.slate[400], // 功能鍵 active 狀態
    text: colors.slate[900], // 主要文字顏色（標題）
    'text-secondary': colors.slate[700], // 次要文字顏色（功能鍵、表達式）
    'text-muted': colors.slate[400], // 淡化文字顏色（佔位符、箭頭）
    bg: colors.slate[50], // 頁面背景、表達式背景
  },

  /**
   * 品牌主色（Primary）
   * 用途：運算符、等號鍵、強調元素
   * 映射：violet 色系
   */
  primary: {
    bg: colors.violet[50], // 淺背景（結果區域）
    light: colors.violet[100], // 運算符背景
    hover: colors.violet[200], // 運算符 hover 狀態
    active: colors.violet[300], // 運算符 active 狀態
    'text-light': colors.violet[400], // 淺色文字（圖標、輔助文字）
    ring: colors.violet[500], // 焦點環
    DEFAULT: colors.violet[600], // 等號鍵、強調元素、文字強調
    dark: colors.violet[700], // 等號鍵 hover 狀態
    darker: colors.violet[800], // 等號鍵 active 狀態
    text: colors.violet[700], // 運算符文字
  },

  /**
   * 危險色系（Danger）
   * 用途：清除操作、錯誤狀態
   * 映射：red 色系
   */
  danger: {
    bg: colors.red[50], // 淺背景（錯誤訊息區域）
    light: colors.red[100], // 清除鍵背景
    hover: colors.red[200], // 清除鍵 hover 狀態
    active: colors.red[300], // 清除鍵 active 狀態
    text: colors.red[600], // 錯誤圖標、懸停文字
    DEFAULT: colors.red[700], // 錯誤文字、清除鍵文字
  },

  /**
   * 警告色系（Warning）
   * 用途：刪除操作、警告狀態
   * 映射：amber 色系
   */
  warning: {
    light: colors.amber[100],
    DEFAULT: colors.amber[700],
    hover: colors.amber[200],
    active: colors.amber[300],
  },

  /**
   * 品牌漸變（Brand Gradient）
   * 用途：品牌色彩漸變、通知視窗背景
   * 映射：blue-indigo-purple 色系
   * @see docs/design/COLOR_SCHEME_OPTIONS.md - 方案 A
   */
  brand: {
    // 背景漸變（淺色）
    from: colors.blue[50], // #eff6ff - 漸變起點
    via: colors.indigo[50], // #eef2ff - 漸變中點
    to: colors.purple[50], // #faf5ff - 漸變終點

    // 邊框與裝飾
    border: colors.purple[200], // 邊框顏色
    decoration: colors.purple[100], // 裝飾元素

    // 按鈕漸變（中等亮度）
    'button-from': colors.purple[400], // 按鈕漸變起點
    'button-to': colors.blue[400], // 按鈕漸變終點
    'button-hover-from': colors.purple[500], // 按鈕 hover 起點
    'button-hover-to': colors.blue[500], // 按鈕 hover 終點

    // 圖標漸變
    'icon-from': colors.purple[200], // 圖標漸變起點
    'icon-to': colors.blue[200], // 圖標漸變終點

    // 文字與陰影
    text: colors.purple[600], // 主要文字
    'text-dark': colors.purple[800], // 深色文字
    shadow: colors.purple[100], // 陰影顏色
  },
} as const;

/**
 * 取得 Design Token 配置
 *
 * @returns Design token 物件（包含 colors）
 *
 * @example
 * ```typescript
 * const tokens = getDesignTokens();
 * console.log(tokens.colors.primary.DEFAULT); // violet-600
 * ```
 */
export function getDesignTokens() {
  return { colors: semanticColors };
}

/**
 * 生成 Tailwind 主題擴展配置
 *
 * 基於 Context7 官方最佳實踐，生成可直接用於 tailwind.config.ts 的配置
 *
 * @returns Tailwind Config 的 theme 配置物件
 *
 * @example
 * ```typescript
 * // tailwind.config.ts
 * import { generateTailwindThemeExtension } from './src/config/design-tokens';
 *
 * export default {
 *   theme: {
 *     ...generateTailwindThemeExtension(),
 *   },
 * };
 * ```
 *
 * @reference Context7 - Tailwind CSS Theme Configuration:
 * https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/theme.mdx
 */
export function generateTailwindThemeExtension(): Config['theme'] {
  return {
    extend: {
      colors: semanticColors,
    },
  };
}
