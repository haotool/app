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

import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

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
 * 預設主題值（Fallback & 參考）
 *
 * 用途：
 * 1. 作為 CSS Variables 的預設值（在 global.css 中定義）
 * 2. 作為主題設計的參考文檔
 * 3. 用於 SSR 環境的 fallback
 *
 * @example
 * ```css
 * :root {
 *   --color-neutral-light: 241 245 249; // defaultTheme.neutral.light
 * }
 * ```
 */
export const defaultTheme = {
  neutral: {
    light: colors.slate[100], // 恢復舊版：#f1f5f9 → 241 245 249
    DEFAULT: colors.slate[200], // 恢復舊版：#e2e8f0 → 226 232 240
    dark: colors.slate[300], // 恢復舊版：#cbd5e1 → 203 213 225
    darker: colors.slate[400], // 恢復舊版：#94a3b8 → 148 163 184
    text: colors.slate[900], // 恢復舊版標題：#0f172a → 15 23 42
    'text-secondary': colors.slate[600], // 恢復舊版副標題：#475569 → 71 85 105
    'text-muted': colors.slate[500], // 恢復舊版摘要：#64748b → 100 116 139
    bg: colors.slate[50], // 恢復舊版：#f8fafc → 248 250 252
  },
  primary: {
    bg: colors.violet[100], // 恢復舊版 FAQ 背景：#ede9fe → 237 233 254
    light: colors.violet[100], // #ede9fe
    hover: colors.violet[200], // #ddd6fe → 221 214 254
    active: colors.violet[300], // #c4b5fd → 196 181 253
    'text-light': colors.violet[400], // #a78bfa → 167 139 250
    ring: colors.violet[500], // #a855f7 → 168 85 247
    DEFAULT: colors.violet[600], // 恢復舊版 FAQ 連結：#7c3aed → 124 58 237
    dark: colors.violet[700], // 恢復舊版 FAQ 連結 hover：#6d28d9 → 109 40 217
    darker: colors.violet[800], // #5b21b6
    text: colors.violet[600], // #7c3aed
  },
  danger: {
    bg: colors.red[50], // 恢復舊版：#fef2f2 → 254 242 242
    light: colors.red[100], // #fee2e2 → 254 226 226
    hover: colors.red[200], // #fecaca → 254 202 202
    active: colors.red[300], // #fca5a5 → 252 165 165
    text: colors.red[500], // 恢復舊版錯誤圖標：#ef4444 → 239 68 68
    DEFAULT: colors.red[500], // 恢復舊版錯誤按鈕：#ef4444 → 239 68 68
  },
  success: {
    bg: colors.green[50], // #f0fdf4 → 240 253 244
    light: colors.green[100], // #dcfce7 → 220 252 231
    hover: colors.green[200], // #bbf7d0 → 187 247 208
    active: colors.green[300], // #86efac → 134 239 172
    text: colors.green[600], // #16a34a → 22 163 74
    DEFAULT: colors.green[500], // #22c55e → 34 197 94
  },
  highlight: {
    from: colors.yellow[50], // #fefce8 → 254 252 232
    to: colors.amber[50], // #fffbeb → 255 251 235
  },
  favorite: {
    light: colors.yellow[100], // #fef3c7 → 254 243 199
    DEFAULT: colors.yellow[500], // #eab308 → 234 179 8
  },
  warning: {
    light: colors.amber[100], // #fef3c7 → 254 243 199
    DEFAULT: colors.amber[700], // #b45309 → 180 83 9
    hover: colors.amber[200], // #fde68a → 253 230 138
    active: colors.amber[300], // #fcd34d → 252 211 77
  },
  brand: {
    from: colors.blue[50], // 恢復舊版：#eff6ff → 239 246 255
    via: colors.indigo[50], // 恢復舊版：#eef2ff → 238 242 255
    to: colors.purple[50], // 恢復舊版：#faf5ff → 250 245 255
    border: colors.blue[100], // 恢復舊版邊框：#dbeafe → 219 234 254
    decoration: colors.purple[100], // 恢復舊版：#f3e8ff → 243 232 255
    'button-from': colors.purple[500], // 恢復舊版 Multi 按鈕（梯度起點）：#a855f7 → 168 85 247
    'button-to': colors.blue[500], // 恢復舊版 Single 按鈕：#3b82f6 → 59 130 246
    'button-hover-from': colors.purple[600], // 恢復舊版 Multi 按鈕 hover：#9333ea → 147 51 234
    'button-hover-to': colors.blue[600], // 恢復舊版 Single 按鈕 hover：#2563eb → 37 99 235
    'icon-from': colors.purple[200], // #e9d5ff
    'icon-to': colors.blue[200], // #bfdbfe
    text: colors.blue[600], // #2563eb → 37 99 235 (舊版 H1 起點)
    'text-dark': colors.purple[600], // #9333ea → 147 51 234 (舊版 H1 終點)
    shadow: colors.purple[100], // #f3e8ff
  },
  footer: {
    from: colors.slate[900], // #0f172a → 15 23 42
    via: colors.blue[900], // #1e3a8a → 30 58 138
    to: colors.indigo[900], // #312e81 → 49 46 129
  },
} as const;

/**
 * 深色主題值
 *
 * 用途：為深色模式提供預設配置
 *
 * 設計原則：
 * - 中性色反轉（淺色 ↔ 深色）
 * - 品牌色調整（提高對比度）
 * - 文字色增亮（可讀性）
 */
export const darkTheme = {
  neutral: {
    light: colors.slate[800], // #1e293b → 30 41 59
    DEFAULT: colors.slate[900], // #0f172a → 15 23 42
    dark: colors.slate[950], // #020617 → 2 6 23
    darker: colors.slate[950], // #020617 → 2 6 23
    text: colors.slate[50], // #f8fafc → 248 250 252
    'text-secondary': colors.slate[300], // #cbd5e1 → 203 213 225
    'text-muted': colors.slate[500], // #64748b → 100 116 139
    bg: colors.slate[950], // #020617 → 2 6 23
  },
  primary: {
    bg: colors.violet[950], // #2e1065 → 46 16 101
    light: colors.violet[900], // #4c1d95 → 76 29 149
    hover: colors.violet[800], // #5b21b6 → 91 33 182
    active: colors.violet[700], // #6d28d9 → 109 40 217
    'text-light': colors.violet[300], // #c4b5fd → 196 181 253
    ring: colors.violet[400], // #a78bfa → 167 139 250
    DEFAULT: colors.violet[400], // #a78bfa → 167 139 250
    dark: colors.violet[300], // #c4b5fd → 196 181 253
    darker: colors.violet[200], // #ddd6fe → 221 214 254
    text: colors.violet[300], // #c4b5fd → 196 181 253
  },
  danger: {
    bg: colors.red[950], // #450a0a → 69 10 10
    light: colors.red[900], // #7f1d1d → 127 29 29
    hover: colors.red[800], // #991b1b → 153 27 27
    active: colors.red[700], // #b91c1c → 185 28 28
    text: colors.red[400], // #f87171 → 248 113 113
    DEFAULT: colors.red[500], // #ef4444 → 239 68 68
  },
  success: {
    bg: colors.green[950], // #0a2813 → 10 40 19
    light: colors.green[900], // #14532d → 20 83 45
    hover: colors.green[800], // #166534 → 22 101 52
    active: colors.green[700], // #15803d → 21 128 61
    text: colors.green[400], // #4ade80 → 74 222 128
    DEFAULT: colors.green[500], // #22c55e → 34 197 94
  },
  highlight: {
    from: colors.yellow[900], // #78350f → 120 53 15
    to: colors.amber[900], // #78350f → 120 53 15
  },
  favorite: {
    light: colors.yellow[700], // #ca8a04 → 202 138 4
    DEFAULT: colors.yellow[400], // #facc15 → 250 204 21
  },
  warning: {
    light: colors.amber[900], // #78350f → 120 53 15
    DEFAULT: colors.amber[500], // #f59e0b → 245 158 11
    hover: colors.amber[800], // #92400e → 146 64 14
    active: colors.amber[700], // #b45309 → 180 83 9
  },
  brand: {
    from: colors.blue[950], // #172554 → 23 37 84
    via: colors.indigo[950], // #1e1b4b → 30 27 75
    to: colors.purple[950], // #3b0764 → 59 7 100
    border: colors.purple[700], // #7e22ce → 126 34 206
    decoration: colors.purple[800], // #6b21a8 → 107 33 168
    'button-from': colors.purple[500], // #a855f7 → 168 85 247
    'button-to': colors.blue[500], // #3b82f6 → 59 130 246
    'button-hover-from': colors.purple[400], // #c084fc → 192 132 252
    'button-hover-to': colors.blue[400], // #60a5fa → 96 165 250
    'icon-from': colors.purple[700], // #7e22ce → 126 34 206
    'icon-to': colors.blue[700], // #1d4ed8 → 29 78 216
    text: colors.blue[400], // #60a5fa → 96 165 250
    'text-dark': colors.purple[400], // #c084fc → 192 132 252
    shadow: colors.purple[900], // #581c87 → 88 28 135
  },
  footer: {
    from: colors.slate[900], // #0f172a → 15 23 42
    via: colors.blue[900], // #1e3a8a → 30 58 138
    to: colors.indigo[900], // #312e81 → 49 46 129
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
export const navigationTokens = {
  /**
   * Header Configuration
   * Compact header inspired by Threads/Instagram design language
   */
  header: {
    /** Total header height in pixels (excluding safe area) */
    height: 48,
    /** CSS value including safe area for notched devices */
    heightWithSafeArea: 'calc(48px + env(safe-area-inset-top, 0px))',
    /** Tailwind class for header height */
    heightClass: 'h-12',
    /** Logo dimensions */
    logo: {
      size: 28,
      sizeClass: 'w-7 h-7',
    },
    /** Title typography */
    title: {
      fontSize: 'text-xl',
      fontWeight: 'font-black',
    },
    /** Padding values */
    padding: {
      horizontal: 16,
      vertical: 8,
      class: 'px-4 py-2',
    },
  },

  /**
   * Bottom Navigation Configuration
   * Balanced design between iOS Tab Bar (49pt) and Material Navigation Bar (56dp)
   */
  bottomNav: {
    /** Total bottom nav height in pixels (excluding safe area) */
    height: 56,
    /** CSS value including safe area for notched devices */
    heightWithSafeArea: 'calc(56px + env(safe-area-inset-bottom, 0px))',
    /** Tailwind class for bottom nav height */
    heightClass: 'h-14',
    /** Icon configuration */
    icon: {
      size: 20,
      sizeClass: 'w-5 h-5',
      activeStrokeWidth: 2.5,
      inactiveStrokeWidth: 2,
    },
    /** Label typography */
    label: {
      fontSize: 8,
      fontSizeClass: 'text-[8px]',
      fontWeight: 'font-black',
      letterSpacing: '0.15em',
      letterSpacingClass: 'tracking-[0.15em]',
    },
    /** Active indicator bar */
    indicator: {
      width: 24,
      height: 3,
      widthClass: 'w-6',
      heightClass: 'h-[3px]',
    },
    /** Touch target for accessibility */
    touchTarget: {
      /** Minimum touch target size (WCAG 2.2 AAA) */
      minSize: 44,
    },
  },

  /**
   * Safe Area Configuration
   * For devices with notches (iPhone X+) or navigation gestures
   */
  safeArea: {
    top: 'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    /** Tailwind safe area classes */
    classes: {
      top: 'pt-safe-top',
      bottom: 'pb-safe-bottom',
    },
  },
} as const;

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
 * https://tailwindcss.com/docs/customizing-colors#using-css-variables
 */
export function generateTailwindThemeExtension(): Config['theme'] {
  return {
    extend: {
      colors: semanticColors,
    },
  };
}
