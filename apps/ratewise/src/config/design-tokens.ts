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
 * 頁面佈局設計規範 (SSOT)
 *
 * 統一所有頁面的外層容器與內容區域間距配置。
 * 確保 Settings、MultiConverter、Favorites、SingleConverter 等頁面視覺一致性。
 *
 * 設計原理（2025 最佳實踐）：
 * - 外層容器：min-h-full（不重複 overflow，由 AppLayout 統一處理滾動）
 * - 內容區域：水平內距 20px (px-5)，垂直內距 24px (py-6)，最大寬度 448px (max-w-md)
 * - 區塊間距：各區塊使用 mb-6 分隔，卡片內距 p-4
 * - 底部留白：由 AppLayout pb-[calc(56px+safe-area)] 統一處理
 *
 * 避免問題：
 * - 雙重滾動（nested overflow-y-auto）
 * - 跑版（h-full + pb-32 導致超出視口）
 *
 * @see AppLayout.tsx - 外層滾動容器
 * @see https://web.dev/viewport-units/ - 動態視口高度最佳實踐
 * @see Settings.tsx, MultiConverter.tsx, Favorites.tsx - 參考實作
 * @created 2026-01-25
 * @updated 2026-01-26 - 修正捲軸跑版問題
 * @version 2.0.0
 */
export const pageLayoutTokens = {
  /** 外層頁面容器（不處理滾動，由 AppLayout 統一管理） */
  container: {
    /** 完整類別組合 */
    className: 'min-h-full',
  },
  /** 內容區域 */
  content: {
    horizontalPadding: 20,
    verticalPadding: 24,
    maxWidth: 448,
    /** 完整類別組合 */
    className: 'px-5 py-6 max-w-md mx-auto',
  },
  /** 區塊配置 */
  section: {
    marginBottom: 24,
    className: 'mb-6',
  },
  /** 卡片配置 */
  card: {
    padding: 16,
    className: 'card p-4',
  },
} as const;

/**
 * 單幣別頁面高度斷點佈局規範
 *
 * 針對 iOS PWA 用戶優化的高度響應式設計。
 * 採用流體縮放 (fluid scaling) 搭配斷點隱藏，確保所有螢幕尺寸視覺一致。
 *
 * ## iOS PWA 視口高度參考 (2025)
 *
 * | 裝置               | 視口高度 | 內容區高度 (扣除導覽) |
 * |--------------------|----------|----------------------|
 * | iPhone 16 Pro Max  | 956px    | ~792px               |
 * | iPhone 16 Plus     | 932px    | ~768px               |
 * | iPhone 16 Pro      | 874px    | ~710px               |
 * | iPhone 16/15       | 852px    | ~688px               |
 * | iPhone SE 2022     | 667px    | ~563px               |
 * | iPhone SE 原版     | 568px    | ~464px               |
 *
 * ## 斷點設計原則
 *
 * 1. **流體優先**：使用 CSS `clamp()` 實現元素線性縮放
 * 2. **漸進隱藏**：依重要性順序隱藏次要元素
 * 3. **等比維持**：漸層/光暈使用 `aspect-ratio` 保持比例
 *
 * ## 元素隱藏優先順序（由先到後）
 *
 * 1. 快速金額（來源）  - short (≤700px) 隱藏
 * 2. 快速金額（結果）  - tiny (≤650px) 隱藏
 * 3. 交換按鈕光暈      - short (≤700px) 隱藏
 * 4. 交換按鈕          - micro (≤600px) 隱藏
 * 5. 資料來源          - nano (≤560px) 隱藏（最後）
 *
 * @see https://web.dev/articles/min-max-clamp - CSS clamp() 最佳實踐
 * @see https://tailwindcss.com/docs/responsive-design - Tailwind RWD
 *
 * @created 2026-01-27
 * @updated 2026-01-28 - 重構隱藏優先順序，資料來源改為最後隱藏
 * @version 1.1.0
 */
export const rateWiseLayoutTokens = {
  /**
   * 外層容器 - 使用 flex 填滿可用空間
   * [fix:2026-01-28] 移除 min-h-full 避免與 AppLayout 高度衝突
   */
  container: 'flex flex-col h-full',

  /**
   * 內容容器 - 流體內距搭配最大寬度限制
   * [fix:2026-01-28] 調整為 justify-between 讓資料來源區塊對齊底部
   */
  content: {
    className:
      'flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-3 sm:px-5 py-2 compact:py-1.5 short:py-1 tiny:py-1 micro:py-0.5 nano:py-0.5',
  },

  /**
   * 單幣別區塊 - 使用 flex-1 置中內容
   * [fix:2026-01-28] 優化間距讓資料來源區塊更好對齊
   */
  section: {
    className: 'flex-1 flex flex-col justify-center',
  },

  /** 單幣別卡片 - 移除 flex-1 避免過度拉伸 */
  card: {
    className: 'card p-3 compact:p-2.5 short:p-2 tiny:p-2 micro:p-1.5 nano:p-1.5',
  },

  /**
   * 資料來源區塊 - 最後隱藏（nano 斷點）
   * [fix:2026-01-28] 調整間距讓區塊剛好落在容器與底部導覽列之間
   */
  info: {
    base: 'text-center flex-shrink-0 py-2 compact:py-1.5 short:py-1 tiny:py-1 micro:py-0.5',
    visibility: 'nano:hidden',
  },
} as const;

/**
 * 單幣別轉換器高度斷點配置
 *
 * 控制各元件的間距、字體尺寸與顯示/隱藏規則。
 * 採用線性遞減設計，確保視覺比例在各斷點間平滑過渡。
 *
 * ## 匯率卡片佈局設計
 *
 * - 匯率類型按鈕採相對定位，避免與匯率文字重疊
 * - 漸層光暈使用 `aspect-square` 保持等比例
 * - 趨勢圖高度隨視口流體縮放
 *
 * ## 斷點尺寸對照
 *
 * | 斷點    | 視口高度 | 目標裝置                    |
 * |---------|----------|----------------------------|
 * | tall    | ≥761px   | iPhone 16 Pro+ 系列         |
 * | compact | ≤760px   | iPhone 16/15 標準版         |
 * | short   | ≤700px   | 較舊 iPhone / 小型 Android  |
 * | tiny    | ≤650px   | 接近 iPhone SE 2022         |
 * | micro   | ≤600px   | iPhone SE 原版附近          |
 * | nano    | ≤560px   | 極小螢幕 / 橫向模式         |
 *
 * @created 2026-01-27
 * @updated 2026-01-28 - 調整隱藏順序，快速金額優先隱藏
 * @version 1.1.0
 */
export const singleConverterLayoutTokens = {
  /** 區塊間距 - 線性遞減 */
  section: {
    className: 'mb-3 compact:mb-2.5 short:mb-2 tiny:mb-1.5 micro:mb-1 nano:mb-1',
  },

  /** 標籤間距 */
  label: {
    className: 'mb-1.5 short:mb-1 tiny:mb-1 micro:mb-0.5 nano:mb-0.5',
  },

  /** 金額輸入框 - 流體尺寸 */
  amountInput: {
    className:
      'py-2.5 text-xl compact:py-2 compact:text-lg short:py-2 short:text-lg tiny:py-1.5 tiny:text-base micro:py-1.5 micro:text-base nano:py-1 nano:text-sm',
  },

  /** 匯率卡片區塊 */
  rateCard: {
    /** 區塊容器 */
    section:
      'flex flex-col items-center mb-3 compact:mb-2.5 short:mb-2 tiny:mb-1.5 micro:mb-1 nano:mb-1',

    /** 卡片底部間距 */
    cardSpacing: 'mb-2.5 compact:mb-2 short:mb-1.5 tiny:mb-1 micro:mb-1 nano:mb-0.5',

    /** 匯率資訊區內距 */
    infoPadding: 'py-3 compact:py-2.5 short:py-2 tiny:py-1.5 micro:py-1.5 nano:py-1',

    /** 匯率類型按鈕容器間距 */
    rateTypeContainer: 'mb-2.5 compact:mb-2 short:mb-1.5 tiny:mb-1.5 micro:mb-1 nano:mb-1',

    /** 匯率類型按鈕尺寸 */
    rateTypeButton:
      'px-2 py-0.5 text-[11px] compact:px-2 compact:py-0.5 compact:text-[11px] short:px-1.5 short:py-0.5 short:text-[10px] tiny:px-1.5 tiny:py-0.5 tiny:text-[10px] micro:px-1.5 micro:py-0.5 micro:text-[10px] nano:px-1 nano:py-0.5 nano:text-[9px]',

    /** 匯率類型圖示 - nano 隱藏 */
    rateTypeIcon:
      'w-2.5 h-2.5 compact:w-2.5 compact:h-2.5 short:w-2 short:h-2 tiny:w-2 tiny:h-2 micro:w-2 micro:h-2 nano:hidden',

    /** 主要匯率文字 */
    rateText: 'text-xl compact:text-lg short:text-base tiny:text-base micro:text-sm nano:text-sm',

    /** 次要匯率文字 */
    rateSubText: 'text-xs short:text-[11px] tiny:text-[11px] micro:text-[10px] nano:text-[10px]',

    /** 趨勢圖高度 - 線性遞減 */
    chartHeight: 'h-16 compact:h-14 short:h-12 tiny:h-10 micro:h-9 nano:h-8',

    /** 趨勢圖懸停高度 */
    chartHoverHeight:
      'group-hover:h-20 compact:group-hover:h-18 short:group-hover:h-14 tiny:group-hover:h-12 micro:group-hover:h-11 nano:group-hover:h-10',
  },

  /**
   * 快速金額區塊
   *
   * 隱藏優先順序：來源 (short) → 結果 (tiny)
   * 快速金額為輔助功能，優先於資料來源隱藏
   */
  quickAmounts: {
    /** 容器樣式 */
    container:
      'flex gap-1.5 mt-1.5 compact:mt-1 short:mt-1 tiny:mt-0.5 micro:mt-0.5 nano:mt-0.5 min-w-0 overflow-x-auto scrollbar-hide [overflow-y:hidden] [-webkit-overflow-scrolling:touch]',

    /** 來源快速金額：short (≤700px) 隱藏 */
    fromVisibility: 'short:hidden',

    /** 結果快速金額：tiny (≤650px) 隱藏 */
    toVisibility: 'tiny:hidden',
  },

  /**
   * 交換按鈕
   *
   * 光暈效果 short 隱藏，按鈕本體 micro 隱藏
   */
  swap: {
    /** 按鈕包裝器 */
    wrapper: 'relative group/swap',

    /** 按鈕可見性：micro (≤600px) 隱藏 */
    visibility: 'micro:hidden',

    /** 光暈可見性：short (≤700px) 隱藏 */
    glowHidden: 'short:hidden',
  },

  /** 加入歷史按鈕 - 線性縮減 */
  addToHistory: {
    className: 'py-3 compact:py-2.5 short:py-2 tiny:py-2 micro:py-1.5 nano:py-1.5',
  },
} as const;

/**
 * 快速金額按鈕設計規範 (SSOT)
 *
 * 統一貨幣快速金額選擇按鈕樣式。
 * 適用於 SingleConverter 與 MultiConverter 元件。
 *
 * 設計原理：
 * - 中性變體：低視覺權重，不與主要操作競爭注意力
 * - 互動回饋：色彩漸變 + 縮放動畫，提供明確操作反饋
 *
 * 互動狀態：
 * - 預設：抬升表面背景 + 柔和文字 (bg-surface-elevated text-text/70)
 * - 懸停：主色調淡化 + 主色文字 (bg-primary/10 text-primary)
 * - 按壓：主色調加深 + 縮放回饋 (bg-primary/20 scale-[0.97])
 *
 * @created 2026-01-25
 * @version 1.0.0
 */
export const quickAmountButtonTokens = {
  /** 基礎樣式 */
  base: {
    padding: 'px-3 py-1.5',
    borderRadius: 'rounded-xl',
    typography: 'text-sm font-semibold',
  },
  /** 色彩狀態 */
  colors: {
    default: {
      background: 'bg-surface-elevated',
      text: 'text-text/70',
    },
    hover: {
      background: 'bg-primary/10',
      text: 'text-primary',
    },
    active: {
      background: 'bg-primary/20',
      text: 'text-primary',
    },
  },
  /** 微互動效果 */
  interactions: {
    transition: 'transition-all duration-200 ease-out',
    hoverScale: 'hover:scale-[1.03]',
    activeScale: 'active:scale-[0.97]',
    hoverShadow: 'hover:shadow-md',
    activeShadow: 'active:shadow-sm',
  },
  /** 觸覺回饋時長 (毫秒) */
  hapticDuration: 30,
} as const;

/**
 * 間距設計規範 (SSOT)
 *
 * 統一應用程式間距系統，基於 4px 基礎網格。
 * 遵循 Tailwind CSS 官方間距系統，確保一致性。
 *
 * 設計原理：
 * - 基礎單位：4px (0.25rem)
 * - 倍數系統：xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48, 3xl=64
 * - 用途區分：內距 (padding)、外距 (margin)、間隙 (gap)
 *
 * @reference Tailwind CSS Spacing Scale
 * @see https://tailwindcss.com/docs/customizing-spacing
 * @created 2026-01-25
 * @version 1.0.0
 */
export const spacingTokens = {
  /** 基礎單位 (4px) */
  base: 4,

  /** 間距比例表 */
  scale: {
    /** 4px - 極小間距 (圖標與文字間) */
    xs: { px: 4, rem: '0.25rem', class: '1' },
    /** 8px - 小間距 (元素內部) */
    sm: { px: 8, rem: '0.5rem', class: '2' },
    /** 12px - 中小間距 */
    'md-sm': { px: 12, rem: '0.75rem', class: '3' },
    /** 16px - 中間距 (卡片內距、按鈕間距) */
    md: { px: 16, rem: '1rem', class: '4' },
    /** 20px - 中大間距 */
    'md-lg': { px: 20, rem: '1.25rem', class: '5' },
    /** 24px - 大間距 (區塊間距) */
    lg: { px: 24, rem: '1.5rem', class: '6' },
    /** 32px - 超大間距 (主要區塊間) */
    xl: { px: 32, rem: '2rem', class: '8' },
    /** 48px - 2倍超大間距 */
    '2xl': { px: 48, rem: '3rem', class: '12' },
    /** 64px - 3倍超大間距 (頁面區段間) */
    '3xl': { px: 64, rem: '4rem', class: '16' },
  },

  /** 常用組合 - 直接複製使用 */
  patterns: {
    /** 卡片內距 */
    cardPadding: 'p-4', // 16px
    /** 區塊間距 */
    sectionGap: 'gap-6', // 24px
    /** 列表項目間距 */
    listGap: 'gap-3', // 12px
    /** 表單欄位間距 */
    formGap: 'gap-4', // 16px
    /** 按鈕組間距 */
    buttonGroupGap: 'gap-2', // 8px
    /** 頁面水平內距 */
    pageHorizontal: 'px-5', // 20px
    /** 頁面垂直內距 */
    pageVertical: 'py-6', // 24px
  },
} as const;

/**
 * 字型設計規範 (SSOT)
 *
 * 統一應用程式字型系統，確保視覺層次與可讀性。
 * 基於 Tailwind CSS 字型比例，針對中英文混排優化。
 *
 * 設計原理：
 * - 字型家族：Inter (英文) + Noto Sans TC (中文) + system-ui
 * - 字重系統：regular(400), medium(500), semibold(600), bold(700), black(900)
 * - 行高優化：緊湊(1.25)、標準(1.5)、寬鬆(1.75)
 *
 * @reference Tailwind CSS Typography
 * @see https://tailwindcss.com/docs/font-size
 * @created 2026-01-25
 * @version 1.0.0
 */
export const typographyTokens = {
  /** 字型家族 */
  fontFamily: {
    sans: ['Inter', '"Noto Sans TC"', 'system-ui', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
  },

  /** 字型大小比例表 */
  fontSize: {
    /** 10px - 極小標籤 */
    '2xs': { size: '0.625rem', lineHeight: '0.875rem', class: 'text-[10px]' },
    /** 12px - 小標籤、說明文字 */
    xs: { size: '0.75rem', lineHeight: '1rem', class: 'text-xs' },
    /** 14px - 次要內容 */
    sm: { size: '0.875rem', lineHeight: '1.25rem', class: 'text-sm' },
    /** 16px - 正文 */
    base: { size: '1rem', lineHeight: '1.5rem', class: 'text-base' },
    /** 18px - 大正文 */
    lg: { size: '1.125rem', lineHeight: '1.75rem', class: 'text-lg' },
    /** 20px - 小標題 */
    xl: { size: '1.25rem', lineHeight: '1.75rem', class: 'text-xl' },
    /** 24px - 標題 */
    '2xl': { size: '1.5rem', lineHeight: '2rem', class: 'text-2xl' },
    /** 30px - 大標題 */
    '3xl': { size: '1.875rem', lineHeight: '2.25rem', class: 'text-3xl' },
    /** 36px - 超大標題 */
    '4xl': { size: '2.25rem', lineHeight: '2.5rem', class: 'text-4xl' },
    /** 48px - 巨大標題 (Hero) */
    '5xl': { size: '3rem', lineHeight: '1', class: 'text-5xl' },
  },

  /** 字重 */
  fontWeight: {
    regular: { value: 400, class: 'font-normal' },
    medium: { value: 500, class: 'font-medium' },
    semibold: { value: 600, class: 'font-semibold' },
    bold: { value: 700, class: 'font-bold' },
    black: { value: 900, class: 'font-black' },
  },

  /** 行高 */
  lineHeight: {
    tight: { value: 1.25, class: 'leading-tight' },
    normal: { value: 1.5, class: 'leading-normal' },
    relaxed: { value: 1.75, class: 'leading-relaxed' },
  },

  /** 常用組合 - 直接複製使用 */
  patterns: {
    /** 頁面標題 (H1) */
    pageTitle: 'text-2xl font-bold leading-tight',
    /** 區塊標題 (H2) */
    sectionTitle: 'text-xl font-semibold leading-tight',
    /** 卡片標題 (H3) */
    cardTitle: 'text-lg font-semibold',
    /** 正文 */
    body: 'text-base font-normal leading-normal',
    /** 次要文字 */
    secondary: 'text-sm text-foreground-secondary',
    /** 小標籤 */
    label: 'text-xs font-medium uppercase tracking-wide',
    /** 數值顯示 (匯率、金額) */
    numeric: 'text-2xl font-bold tabular-nums',
    /** 小數值 */
    numericSmall: 'text-lg font-semibold tabular-nums',
  },
} as const;

/**
 * RWD 斷點設計規範 (SSOT)
 *
 * 統一應用程式響應式斷點策略，採用 Mobile-First 設計。
 * 與 Tailwind CSS 預設斷點對齊，確保一致性。
 *
 * 設計原理：
 * - Mobile-First：預設樣式為行動裝置，使用 min-width 向上擴展
 * - 斷點選擇：基於常見裝置寬度，非任意數值
 * - 內容優先：斷點位置取決於內容需求，而非特定裝置
 * - 高度斷點：支援小螢幕裝置 (iPhone SE/8) 的垂直空間優化
 *
 * @reference Tailwind CSS Responsive Design
 * @see https://tailwindcss.com/docs/responsive-design
 * @created 2026-01-25
 * @updated 2026-01-28 - 調整高度斷點隱藏優先順序
 * @version 1.2.1
 */
export const breakpointTokens = {
  /**
   * 斷點定義
   *
   * ## 寬度斷點 (min-width)
   *
   * 標準 Tailwind 斷點配置，適用於水平響應式設計。
   *
   * ## 高度斷點 (max-height)
   *
   * 針對 iOS PWA 用戶優化的垂直響應式設計。
   * 斷點值基於 2025 年主流 iPhone 視口高度統計。
   *
   * | 斷點    | 觸發條件   | 目標裝置                |
   * |---------|------------|------------------------|
   * | tall    | ≥761px     | iPhone 16 Pro+ 系列     |
   * | compact | ≤760px     | iPhone 16/15 標準版     |
   * | short   | ≤700px     | 較舊機型 / 小型裝置     |
   * | tiny    | ≤650px     | 接近 iPhone SE 2022     |
   * | micro   | ≤600px     | iPhone SE 原版區間      |
   * | nano    | ≤560px     | 極小螢幕 / 特殊情境     |
   */
  screens: {
    /* ─────────────────────────────────────────────────────────────
     * 寬度斷點 (Tailwind 標準)
     * ───────────────────────────────────────────────────────────── */

    /** 640px - 大型手機 / 小平板 (橫向) */
    sm: { min: '640px', max: '767px', class: 'sm:' },

    /** 768px - 平板 (直向) */
    md: { min: '768px', max: '1023px', class: 'md:' },

    /** 1024px - 平板 (橫向) / 小筆電 */
    lg: { min: '1024px', max: '1279px', class: 'lg:' },

    /** 1280px - 筆電 / 桌機 */
    xl: { min: '1280px', max: '1535px', class: 'xl:' },

    /** 1536px - 大螢幕桌機 */
    '2xl': { min: '1536px', max: null, class: '2xl:' },

    /* ─────────────────────────────────────────────────────────────
     * 高度斷點 (iOS PWA 優化)
     * ───────────────────────────────────────────────────────────── */

    /** 中短螢幕 - iPhone 16/15 標準版以下 */
    compact: { raw: '(max-height: 760px)', class: 'compact:' },

    /** 短螢幕 - 較舊機型，快速金額(來源)開始隱藏 */
    short: { raw: '(max-height: 700px)', class: 'short:' },

    /** 極短螢幕 - 接近 iPhone SE 2022 (667px)，快速金額(結果)隱藏 */
    tiny: { raw: '(max-height: 650px)', class: 'tiny:' },

    /** 超短螢幕 - iPhone SE 原版區間，交換按鈕隱藏 */
    micro: { raw: '(max-height: 600px)', class: 'micro:' },

    /** 最小螢幕 - 極端情境，資料來源隱藏（最後） */
    nano: { raw: '(max-height: 560px)', class: 'nano:' },

    /** 長螢幕 - 完整顯示所有元素 */
    tall: { raw: '(min-height: 761px)', class: 'tall:' },
  },

  /** 容器最大寬度 */
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  /** 常用響應式模式 */
  patterns: {
    /** 隱藏於行動裝置，桌面顯示 */
    desktopOnly: 'hidden md:block',
    /** 顯示於行動裝置，桌面隱藏 */
    mobileOnly: 'block md:hidden',
    /** 響應式網格 (1→2→3→4 欄) */
    responsiveGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    /** 響應式 Flex (堆疊→並排) */
    responsiveFlex: 'flex flex-col md:flex-row',
    /** 響應式文字 (小→中→大) */
    responsiveText: 'text-sm md:text-base lg:text-lg',
    /** 響應式間距 (小→中→大) */
    responsiveSpacing: 'p-4 md:p-6 lg:p-8',

    /** 短螢幕隱藏（高度 ≤700px） */
    shortHidden: 'short:hidden',
    /** 極短螢幕隱藏（高度 ≤620px） */
    tinyHidden: 'tiny:hidden',
    /** 超短螢幕隱藏（高度 ≤580px） */
    microHidden: 'micro:hidden',
    /** 最小螢幕隱藏（高度 ≤540px） */
    nanoHidden: 'nano:hidden',
    /** 正常螢幕才顯示（高度 >600px） */
    tallOnly: 'hidden tall:flex',
  },

  /** 媒體查詢輔助函數 */
  mediaQueries: {
    /** 手機 (<640px) */
    mobile: '@media (max-width: 639px)',
    /** 平板以上 (≥768px) */
    tablet: '@media (min-width: 768px)',
    /** 桌面以上 (≥1024px) */
    desktop: '@media (min-width: 1024px)',
    /** 觸控裝置 */
    touch: '@media (hover: none) and (pointer: coarse)',
    /** 滑鼠裝置 */
    pointer: '@media (hover: hover) and (pointer: fine)',
    /** 減少動畫偏好 */
    reducedMotion: '@media (prefers-reduced-motion: reduce)',
  },
} as const;

/**
 * 按鈕設計規範 (SSOT)
 *
 * 統一應用程式按鈕系統，支援多種變體與尺寸。
 * 結合語義色彩與微互動效果。
 *
 * 設計原理：
 * - 變體分類：primary (主要)、secondary (次要)、ghost (幽靈)、danger (危險)
 * - 尺寸分類：sm (小)、md (中)、lg (大)
 * - 狀態完整：default、hover、active、disabled、loading
 *
 * @created 2026-01-25
 * @version 1.0.0
 */
export const buttonTokens = {
  /** 基礎樣式 (所有按鈕共用) */
  base: {
    display: 'inline-flex items-center justify-center',
    typography: 'font-semibold',
    border: 'rounded-2xl',
    cursor: 'cursor-pointer',
    transition: 'transition-all duration-200 ease-out',
    focus:
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  },

  /** 尺寸變體 */
  sizes: {
    sm: {
      padding: 'px-3 py-1.5',
      fontSize: 'text-sm',
      height: 'h-8',
      iconSize: 'w-4 h-4',
      gap: 'gap-1.5',
    },
    md: {
      padding: 'px-4 py-2',
      fontSize: 'text-base',
      height: 'h-10',
      iconSize: 'w-5 h-5',
      gap: 'gap-2',
    },
    lg: {
      padding: 'px-6 py-3',
      fontSize: 'text-lg',
      height: 'h-12',
      iconSize: 'w-6 h-6',
      gap: 'gap-2.5',
    },
  },

  /** 顏色變體 */
  variants: {
    /** 主要按鈕 - 高視覺權重 */
    primary: {
      default: 'bg-primary text-white',
      hover: 'hover:bg-primary-hover hover:shadow-lg hover:-translate-y-0.5',
      active: 'active:translate-y-0 active:shadow-md',
    },
    /** 次要按鈕 - 中視覺權重 */
    secondary: {
      default: 'bg-surface-elevated text-text border border-border',
      hover: 'hover:bg-surface hover:border-primary/30 hover:text-primary',
      active: 'active:bg-surface-sunken',
    },
    /** 幽靈按鈕 - 低視覺權重 */
    ghost: {
      default: 'bg-transparent text-text',
      hover: 'hover:bg-surface-elevated hover:text-primary',
      active: 'active:bg-surface-sunken',
    },
    /** 危險按鈕 - 警示操作 */
    danger: {
      default: 'bg-destructive text-white',
      hover: 'hover:bg-destructive-hover hover:shadow-lg hover:-translate-y-0.5',
      active: 'active:translate-y-0 active:shadow-md',
    },
  },

  /** 完整類別組合 - 直接複製使用 */
  patterns: {
    primaryMd:
      'inline-flex items-center justify-center font-semibold rounded-2xl cursor-pointer transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none px-4 py-2 text-base h-10 gap-2 bg-primary text-white hover:bg-primary-hover hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md',
    secondaryMd:
      'inline-flex items-center justify-center font-semibold rounded-2xl cursor-pointer transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none px-4 py-2 text-base h-10 gap-2 bg-surface-elevated text-text border border-border hover:bg-surface hover:border-primary/30 hover:text-primary active:bg-surface-sunken',
    ghostMd:
      'inline-flex items-center justify-center font-semibold rounded-2xl cursor-pointer transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none px-4 py-2 text-base h-10 gap-2 bg-transparent text-text hover:bg-surface-elevated hover:text-primary active:bg-surface-sunken',
    dangerMd:
      'inline-flex items-center justify-center font-semibold rounded-2xl cursor-pointer transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none px-4 py-2 text-base h-10 gap-2 bg-destructive text-white hover:bg-destructive-hover hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md',
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
