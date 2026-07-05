/**
 * Design Token System - Single Source of Truth (CSS Variables Edition)
 *
 * @file design-tokens.ts
 * @description 統一管理應用色彩、間距、字體等設計 token
 *              使用 CSS Variables 實現動態主題切換
 *
 * @see docs/design/COLOR_SCHEME_OPTIONS.md - 方案 A: 品牌對齊
 * @see docs/dev/005_design_token_refactoring.md - 技術決策記錄
 *
 * @reference Context7 - Tailwind CSS Official Docs:
 * - https://tailwindcss.com/docs/customizing-colors#using-css-variables
 * - https://tailwindcss.com/docs/theme
 *
 * @created 2026-01-12
 * @updated 2026-01-13 - 升級為 CSS Variables 支援動態主題
 * @version 2.0.0
 */

/**
 * Semantic Colors - 語義化色彩系統（CSS Variables）
 *
 * 使用 CSS Variables 實現運行時主題切換
 * 格式：'rgb(var(--color-*) / <alpha-value>)'
 *
 * @example
 * ```tsx
 * // 組件中使用（無需修改）
 * <div className="bg-neutral-light text-neutral-text" />
 *
 * // 主題切換（運行時）
 * <html data-theme="dark">  // 自動切換為深色主題
 * <html data-theme="neon">  // 自動切換為霓虹主題
 * ```
 */
export const semanticColors = {
  /**
   * 中性色系（Neutral）
   * 用途：數字鍵、背景、文字
   * 映射：slate 色系（淺色）/ slate 反轉（深色）
   */
  neutral: {
    light: 'rgb(var(--color-neutral-light) / <alpha-value>)',
    DEFAULT: 'rgb(var(--color-neutral) / <alpha-value>)',
    dark: 'rgb(var(--color-neutral-dark) / <alpha-value>)',
    darker: 'rgb(var(--color-neutral-darker) / <alpha-value>)',
    text: 'rgb(var(--color-neutral-text) / <alpha-value>)',
    'text-secondary': 'rgb(var(--color-neutral-text-secondary) / <alpha-value>)',
    'text-muted': 'rgb(var(--color-neutral-text-muted) / <alpha-value>)',
    bg: 'rgb(var(--color-neutral-bg) / <alpha-value>)',
  },

  /**
   * 品牌主色（Primary）
   * 用途：運算符、等號鍵、強調元素
   * 映射：violet 色系（淺色）/ violet 調整（深色）
   */
  primary: {
    bg: 'rgb(var(--color-primary-bg) / <alpha-value>)',
    light: 'rgb(var(--color-primary-light) / <alpha-value>)',
    hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
    active: 'rgb(var(--color-primary-active) / <alpha-value>)',
    'text-light': 'rgb(var(--color-primary-text-light) / <alpha-value>)',
    ring: 'rgb(var(--color-primary-ring) / <alpha-value>)',
    DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
    // 白字表面 AA 錨點：custom 主題由演算 clamp 保證對比 ≥4.5:1。
    // 全主題皆定義 --color-primary-strong（theme-css-var-parity 守門），無需 fallback。
    strong: 'rgb(var(--color-primary-strong) / <alpha-value>)',
    dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
    darker: 'rgb(var(--color-primary-darker) / <alpha-value>)',
    text: 'rgb(var(--color-primary-text) / <alpha-value>)',
  },

  /**
   * 危險色系（Danger）
   * 用途：清除操作、錯誤狀態
   * 映射：red 色系
   */
  danger: {
    bg: 'rgb(var(--color-danger-bg) / <alpha-value>)',
    light: 'rgb(var(--color-danger-light) / <alpha-value>)',
    hover: 'rgb(var(--color-danger-hover) / <alpha-value>)',
    active: 'rgb(var(--color-danger-active) / <alpha-value>)',
    text: 'rgb(var(--color-danger-text) / <alpha-value>)',
    DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
  },

  /**
   * 成功色系（Success）
   * 用途：上漲趨勢、成功狀態、確認操作
   * 映射：green 色系
   */
  success: {
    bg: 'rgb(var(--color-success-bg) / <alpha-value>)',
    light: 'rgb(var(--color-success-light) / <alpha-value>)',
    hover: 'rgb(var(--color-success-hover) / <alpha-value>)',
    active: 'rgb(var(--color-success-active) / <alpha-value>)',
    text: 'rgb(var(--color-success-text) / <alpha-value>)',
    DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
  },

  /**
   * 高亮色系（Highlight）
   * 用途：基準貨幣背景高亮
   * 映射：yellow/amber 色系
   */
  highlight: {
    from: 'rgb(var(--color-highlight-from) / <alpha-value>)',
    to: 'rgb(var(--color-highlight-to) / <alpha-value>)',
  },

  /**
   * 收藏色系（Favorite）
   * 用途：星號圖標顏色
   * 映射：yellow 色系
   */
  favorite: {
    DEFAULT: 'rgb(var(--color-favorite) / <alpha-value>)',
    light: 'rgb(var(--color-favorite-light) / <alpha-value>)',
  },

  /**
   * 警告色系（Warning）
   * 用途：刪除操作、警告狀態
   * 映射：amber 色系
   */
  warning: {
    light: 'rgb(var(--color-warning-light) / <alpha-value>)',
    DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
    hover: 'rgb(var(--color-warning-hover) / <alpha-value>)',
    active: 'rgb(var(--color-warning-active) / <alpha-value>)',
  },

  /**
   * 品牌漸變（Brand Gradient）
   * 用途：品牌色彩漸變、通知視窗背景
   * 映射：blue-indigo-purple 色系
   * @see docs/design/COLOR_SCHEME_OPTIONS.md - 方案 A
   */
  brand: {
    // 背景漸變（淺色）
    from: 'rgb(var(--color-brand-from) / <alpha-value>)',
    via: 'rgb(var(--color-brand-via) / <alpha-value>)',
    to: 'rgb(var(--color-brand-to) / <alpha-value>)',

    // 邊框與裝飾
    border: 'rgb(var(--color-brand-border) / <alpha-value>)',
    decoration: 'rgb(var(--color-brand-decoration) / <alpha-value>)',

    // 按鈕漸變（中等亮度）
    'button-from': 'rgb(var(--color-brand-button-from) / <alpha-value>)',
    'button-to': 'rgb(var(--color-brand-button-to) / <alpha-value>)',
    'button-hover-from': 'rgb(var(--color-brand-button-hover-from) / <alpha-value>)',
    'button-hover-to': 'rgb(var(--color-brand-button-hover-to) / <alpha-value>)',

    // 圖標漸變
    'icon-from': 'rgb(var(--color-brand-icon-from) / <alpha-value>)',
    'icon-to': 'rgb(var(--color-brand-icon-to) / <alpha-value>)',

    // 文字與陰影
    text: 'rgb(var(--color-brand-text) / <alpha-value>)',
    'text-dark': 'rgb(var(--color-brand-text-dark) / <alpha-value>)',
    shadow: 'rgb(var(--color-brand-shadow) / <alpha-value>)',
  },

  /**
   * Footer 漸變
   * 用途：行動版 Footer 背景
   * 映射：slate/blue/indigo 深色系
   */
  footer: {
    from: 'rgb(var(--color-footer-from) / <alpha-value>)',
    via: 'rgb(var(--color-footer-via) / <alpha-value>)',
    to: 'rgb(var(--color-footer-to) / <alpha-value>)',
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
 * console.log(tokens.colors.primary.DEFAULT);
 * // => 'rgb(var(--color-primary) / <alpha-value>)'
 * ```
 */
export function getDesignTokens() {
  return { colors: semanticColors };
}

/**
 * Navigation Design Tokens (SSOT)
 *
 * Mobile-first navigation system inspired by modern social media apps.
 * Balances compactness with accessibility requirements.
 *
 * Industry Standards Reference:
 * - iOS Human Interface Guidelines: Header 44pt min, Tab Bar 49pt
 *   @see https://developer.apple.com/design/human-interface-guidelines/tab-bars
 * - Material Design 3: App Bar 56dp, Navigation Bar 56dp
 *   @see https://m3.material.io/components/navigation-bar
 * - WCAG 2.2 Success Criterion 2.5.8: Touch targets min 44x44 CSS pixels
 *   @see https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
 * - Threads/Instagram: Header ~44-48px, Bottom Nav ~50px (industry observation)
 *
 * Design Decision:
 * Compact social-media-inspired navigation optimized for content visibility:
 * - Header: 48px (iOS-inspired, compact yet comfortable)
 * - Bottom Nav: 56px (balanced between iOS 49pt and Material 56dp)
 * - Touch targets: 44px minimum (WCAG AAA compliant)
 *
 * @created 2026-01-24
 * @version 1.0.0
 */
