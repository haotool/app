/**
 * Design Token System - Single Source of Truth (CSS Variables Edition)
 *
 * @file design-tokens.ts
 * @description 統一管理應用色彩、間距、字體等設計 token
 *              使用 CSS Variables 實現動態主題切換
 *
 * @see ../../../DESIGN.md
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
    foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
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
   * 遮罩層（Overlay）
   * 用途：modal / bottom sheet 背景遮罩
   */
  overlay: 'rgb(var(--color-overlay) / <alpha-value>)',

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
   * 歷史品牌漸變（Legacy Brand Gradient）
   * 用途：保留歷史通知／展示頁相容層，不作為目前正式產品語法
   * 映射：blue-indigo-purple 色系
   * @see ../../../DESIGN.md
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
 * 1. 作為歷史相容色票與測試參考
 * 2. 供展示頁與相容層比對使用
 *
 * 注意：
 * - 正式產品視覺基準以 `DESIGN.md`、`index.css` 的 `zen` CSS variables 為準
 * - 本物件不是目前 runtime theme 的唯一真實來源
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
 * 深色相容色票
 *
 * 用途：保留舊主題測試與相容層參考
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
      fontSize: 12,
      fontSizeClass: 'text-xs',
      fontWeight: 'font-semibold',
      letterSpacing: '0.08em',
      letterSpacingClass: 'tracking-[0.08em]',
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
 * - 內容區域：響應式內距 + 1120px 內容寬度上限，桌面不再鎖成窄欄
 * - 區塊間距：各區塊使用 mb-6 分隔，卡片內距 p-5 / lg:p-6
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
    maxWidth: 1024,
    /** 完整類別組合 */
    className: 'w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8',
    padding: {
      default: 'px-4 sm:px-6 lg:px-8 py-6 lg:py-8',
      compact: 'px-4 sm:px-6 py-4 lg:py-5',
      none: '',
    },
    variant: {
      default: 'w-full max-w-5xl mx-auto',
      full: 'w-full',
      centered: 'w-full max-w-2xl mx-auto flex min-h-full flex-col items-center justify-center',
    },
  },
  /** 區塊配置 */
  section: {
    marginBottom: 24,
    className: 'mb-6',
  },
  /** 卡片配置 */
  card: {
    padding: 20,
    className: 'card p-5 lg:p-6',
  },
} as const;

/**
 * 內容頁頂部返回 + 麵包屑導覽 SSOT
 *
 * 用於 SEO 內容頁、設定子頁與所有需要返回路徑的資訊頁。
 * 設計重點：
 * - sticky header 與 iOS PWA safe-area 合併處理
 * - 單行麵包屑可水平捲動，最後一項截斷，避免小螢幕撐高 header
 * - 返回按鈕保持 44px 觸控高度與清楚 focus ring
 */
export const pageNavHeaderTokens = {
  root: 'sticky top-0 z-20 -mx-4 mb-6 border-b border-border/50 bg-background/92 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top,0px)+0.625rem)] backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
  row: 'flex min-h-[44px] min-w-0 items-center gap-3',
  backButton:
    'inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1 rounded-lg px-1.5 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  backIcon: 'h-4 w-4',
  separator: 'h-4 w-px shrink-0 bg-border/60',
  breadcrumbSlot: 'min-w-0 flex-1',
} as const;

export const breadcrumbTokens = {
  nav: 'min-w-0',
  list: 'no-scrollbar flex min-w-0 touch-pan-x items-center gap-2 overflow-x-auto whitespace-nowrap text-sm text-text-muted [-webkit-overflow-scrolling:touch]',
  item: 'flex min-h-11 min-w-0 shrink-0 items-center gap-2 last:shrink',
  separatorIcon: 'h-4 w-4 flex-shrink-0 text-text-muted',
  current: 'block max-w-[min(52vw,28rem)] truncate font-medium text-text',
  link: 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-1 transition-colors duration-200 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
} as const;

/**
 * 內容頁視覺語法 SSOT
 *
 * 統一 About、FAQ、Guide、首頁 SEO 區塊與幣別內容頁的頁面骨架、
 * section eyebrow、靜態資訊卡與內容型連結語法，避免各頁各自硬編碼。
 */
export const contentPageTokens = {
  shell: pageLayoutTokens.content.className,
  intro: 'mt-3 max-w-3xl text-sm leading-7 text-text-muted sm:text-base',
  meta: 'mt-2 text-sm text-text-muted',
  hero: {
    wrapper: 'mb-6 sm:mb-8',
    title: 'mt-2 text-3xl font-bold tracking-tight text-text text-balance sm:text-4xl',
    compactTitle: 'text-2xl font-bold leading-tight text-text text-balance sm:text-3xl md:text-4xl',
    description: 'mt-2 text-sm leading-7 text-text-muted sm:text-base',
    metaRow: 'mt-2 flex items-center gap-1.5 text-xs text-text-muted',
    statusDot: 'inline-block h-1.5 w-1.5 rounded-full bg-success',
  },
  badges: {
    subtle:
      'inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface-elevated px-2.5 py-1 text-xs font-semibold text-primary',
    neutral:
      'rounded-full border border-border/70 bg-surface-elevated px-3 py-1 text-xs font-medium text-text-muted',
  },
  sectionHeader: {
    row: 'mb-3 flex items-center gap-2 px-2 text-text-muted',
    eyebrow: 'text-xs font-semibold uppercase tracking-[0.16em] text-text-muted',
    title: 'text-xl font-bold text-text sm:text-2xl',
  },
  section: {
    block: 'mb-6 sm:mb-8',
    loose: 'mb-8 sm:mb-10',
    stack: 'space-y-6',
    grid2: 'grid gap-3 sm:grid-cols-2',
    grid3: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
  },
  surfaces: {
    quiet: 'rounded-lg border border-border/70 bg-surface-elevated p-4',
    quietInteractive:
      'rounded-lg border border-border/70 bg-surface p-4 transition-[background-color,border-color,color] duration-200 hover:border-primary/20 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    emphasized: 'rounded-lg border border-border/70 bg-surface p-6 shadow-sm',
    panel: 'rounded-lg border border-border/70 bg-surface p-5 shadow-card lg:p-6',
  },
  article: {
    card: 'rounded-lg border border-border/70 bg-surface p-4 shadow-sm sm:p-5',
    cardLoose: 'rounded-lg border border-border/70 bg-surface p-6 shadow-sm',
    title: 'mb-3 text-xl font-bold text-text sm:text-2xl',
    titleCompact: 'mb-2 text-base font-bold text-text sm:text-lg',
    body: 'space-y-3 text-text-muted',
    paragraph: 'text-sm leading-7 text-text-muted sm:text-base',
    finePrint: 'text-xs leading-relaxed text-text-muted',
    list: 'space-y-3 text-text-muted',
    listItem: 'flex items-start gap-3',
    bullet: 'mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary',
    numberBadge:
      'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary',
    iconBadge:
      'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
    faqStack: 'space-y-3 md:mx-auto md:max-w-3xl',
    faqItem: 'group rounded-lg border border-border/70 bg-surface shadow-sm',
    faqSummary:
      'flex cursor-pointer list-none items-start gap-3 rounded-lg p-4 transition-colors hover:bg-surface-elevated sm:p-5',
    faqAnswer: 'px-4 pb-4 pt-0 text-sm leading-7 text-text-muted sm:px-5 sm:pb-5',
  },
  callouts: {
    warning: 'rounded-lg border border-warning/30 bg-warning/10 p-4 sm:p-5',
    success: 'rounded-lg border border-success/20 bg-success/10 p-3',
    danger: 'rounded-lg border border-destructive/20 bg-destructive/10 p-3',
    neutral: 'rounded-lg border border-border/70 bg-surface p-3',
    elevated: 'rounded-lg border border-border/70 bg-surface-elevated p-4',
    icon: 'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
    note: 'rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-text-muted',
  },
  result: {
    section: 'mb-6 sm:mb-8',
    card: 'rounded-lg border border-border/70 bg-surface-elevated p-4 shadow-sm sm:p-5',
    eyebrowRow:
      'mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary/80',
    amountRow: 'mb-1 flex flex-wrap items-baseline gap-2',
    sourceAmount: 'text-xs text-text-muted',
    operator: 'text-sm text-text-muted',
    value: 'text-2xl font-black text-primary sm:text-3xl',
    note: 'mb-4 text-xs leading-relaxed text-text-muted',
  },
  table: {
    wrapper: 'max-w-full overflow-x-auto rounded-lg border border-border/70',
    wrapperBlock: 'mb-6 max-w-full overflow-x-auto rounded-lg border border-border/70',
    table: 'min-w-[42rem] text-sm',
    wideTable: 'min-w-[56rem] text-sm',
    headRow: 'border-b border-border/70 bg-surface-elevated',
    headCell: 'px-4 py-3 text-left font-semibold text-text',
    body: 'divide-y divide-border/70 bg-surface',
    cell: 'px-4 py-3 text-text',
    mutedCell: 'px-4 py-3 text-text-muted',
    monoCell: 'px-4 py-3 font-mono text-xs text-primary',
  },
  links: {
    inline:
      'text-primary underline underline-offset-4 decoration-primary/30 transition-colors hover:text-primary-hover',
    pill: 'inline-flex min-h-11 items-center justify-center rounded-full border border-border/70 bg-surface-elevated px-3 py-2.5 text-xs font-semibold text-text transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
    tile: 'flex min-h-11 items-center gap-2 rounded-lg border border-border/70 bg-surface-elevated px-3 py-2.5 text-xs font-semibold text-text transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    row: 'group flex items-center justify-between rounded-lg border border-border/70 bg-surface px-4 py-3 transition-colors hover:border-primary/20 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    ctaSecondary:
      'inline-flex items-center rounded-lg border border-border/70 bg-surface px-5 py-3 font-semibold text-primary transition-colors hover:border-primary/30 hover:bg-surface-elevated hover:text-primary-hover',
  },
  buttons: {
    primary:
      'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    primaryWide:
      'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    dangerQuiet:
      'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-destructive/20 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  },
} as const;

export const appPageTokens = {
  narrowShell: 'mx-auto w-full max-w-md px-3 py-6 sm:px-5',
  section: {
    wrapper: 'mb-6',
    headerRow: 'mb-3 flex items-center gap-2 px-2 text-text-muted',
    headerText: 'text-xs font-black uppercase tracking-[0.16em]',
  },
  infoCard: 'rounded-lg border border-border/70 bg-surface p-5 shadow-sm',
  listCard: 'overflow-hidden rounded-lg border border-border/70 bg-surface shadow-sm',
  linkRow:
    'group flex min-h-11 w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
  statRow:
    'flex items-center justify-between rounded-lg border border-border/70 bg-surface px-4 py-3',
  tinyMeta: 'text-xs font-semibold uppercase tracking-[0.12em] text-text-muted',
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
 * @updated 2026-01-29 - 回復 3ea33 頁面上緣對齊與卡片比例
 * @version 1.1.0
 */
export const rateWiseLayoutTokens = {
  /**
   * 外層容器 - 使用 flex 填滿可用空間
   * [align:2026-01-29] 對齊 MultiConverter page 上緣間距
   */
  container: 'flex flex-col min-h-full',

  /**
   * 內容容器 - 流體內距搭配最大寬度限制
   * [align:2026-01-29] 與 3ea33 版一致的 px/py 與 max-w
   */
  content: {
    className: 'flex-1 flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8',
  },

  section: {
    className: 'flex-1 flex flex-col mb-4',
  },

  /** 單幣別卡片 - 移除 flex-1 避免過度拉伸 */
  card: {
    className: 'card p-5 lg:p-6',
  },

  /**
   * 資料來源區塊 - 最後隱藏（nano 斷點）
   * [align:2026-01-29] 與 3ea33 版一致，不額外加內距
   */
  info: {
    base: 'text-center flex-shrink-0',
    visibility: 'nano:hidden',
  },
} as const;

/**
 * 多幣別頁面佈局規範
 *
 * 與單幣別頁面對齊的上緣間距與卡片比例，避免頁面切換時跳位。
 * 統一使用 SSOT token，禁止 page 層硬編碼間距。
 *
 * @created 2026-01-29
 * @version 1.0.0
 */
export const multiConverterLayoutTokens = {
  /** 外層容器 */
  container: 'flex flex-col min-h-full',

  /** 內容容器 */
  content: {
    className: 'flex-1 flex flex-col w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8',
  },

  /** 主區塊 */
  section: {
    className: 'flex-1 flex flex-col',
  },

  /** 卡片容器 */
  card: {
    className: 'card p-4 flex-1 flex flex-col',
  },

  /** 更新時間區塊 */
  info: {
    wrapper: 'mt-4 flex-shrink-0',
    titleRow: contentPageTokens.sectionHeader.row,
    titleText: contentPageTokens.sectionHeader.eyebrow,
    card: 'card px-4 py-3',
    text: 'text-xs text-center lg:text-left opacity-70 font-medium',
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
 * - 匯率類型按鈕採絕對定位，回復舊版比例，避免佔用內容高度
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
 * @updated 2026-01-28 - 回復舊版比例與間距，保留高度斷點縮放
 * @version 1.1.0
 */
export const singleConverterLayoutTokens = {
  /** 區塊間距 - 線性遞減 */
  section: {
    className: 'mb-4 compact:mb-3.5 short:mb-3 tiny:mb-2.5 micro:mb-2 nano:mb-2',
  },

  /** 標籤間距 */
  label: {
    className: 'mb-2 short:mb-1.5 tiny:mb-1 micro:mb-1 nano:mb-0.5',
  },

  /** 金額輸入框 - 流體尺寸 */
  amountInput: {
    className:
      'py-3 text-2xl compact:py-2.5 compact:text-xl short:py-2 short:text-lg tiny:py-1.5 tiny:text-base micro:py-1.5 micro:text-base nano:py-1 nano:text-sm',
  },

  /** 匯率卡片區塊 */
  rateCard: {
    /** 區塊容器 */
    section:
      'flex flex-col items-center mb-4 compact:mb-3.5 short:mb-3 tiny:mb-2.5 micro:mb-2 nano:mb-2',

    /** 卡片底部間距 */
    cardSpacing: 'mb-3 compact:mb-2.5 short:mb-2 tiny:mb-1.5 micro:mb-1.5 nano:mb-1',

    /** 匯率資訊區內距 - 保持充足空間感 */
    infoPadding:
      'pt-16 pb-6 compact:pt-16 compact:pb-5 short:pt-16 short:pb-4 tiny:pt-16 tiny:pb-3 micro:pt-16 micro:pb-2.5 nano:pt-16 nano:pb-2',

    /** 匯率類型按鈕容器定位 */
    rateTypeContainer:
      'absolute top-3 left-1/2 -translate-x-1/2 compact:top-2.5 short:top-2 tiny:top-2 micro:top-1.5 nano:top-1.5',

    /** 匯率類型按鈕尺寸 */
    rateTypeButton:
      'px-2.5 py-1 text-xs compact:px-2 short:px-2 tiny:px-1.5 micro:px-1.5 nano:px-1.5',

    /** 匯率類型圖示 - nano 隱藏 */
    rateTypeIcon:
      'w-3 h-3 compact:w-2.5 compact:h-2.5 short:w-2.5 short:h-2.5 tiny:w-2 tiny:h-2 micro:w-2 micro:h-2 nano:hidden',

    /** 主要匯率文字 */
    rateText: 'text-2xl compact:text-xl short:text-lg tiny:text-base micro:text-sm nano:text-sm',

    /** 次要匯率文字 */
    rateSubText: 'text-sm short:text-xs tiny:text-xs micro:text-xs nano:text-xs',

    /** 趨勢圖高度 - 線性遞減 */
    chartHeight: 'h-20 compact:h-16 short:h-14 tiny:h-12 micro:h-10 nano:h-8',

    /** 趨勢圖懸停高度 */
    chartHoverHeight: '',

    /** 換錢所來源 badge 容器（換錢所選中時顯示） */
    exchangeShopBadge:
      'mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-xs font-medium leading-tight text-text-muted/60',

    /** 換錢所 badge 圖示 */
    exchangeShopBadgeIcon: 'h-3 w-3 shrink-0 text-primary/70',

    /** 換錢所 badge 分隔點 */
    exchangeShopBadgeDot: 'text-text-muted/40',

    /** 換錢所 badge 來源連結 */
    exchangeShopBadgeLink:
      'text-text-muted/70 underline decoration-dotted underline-offset-2 transition-colors hover:text-primary',
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
      'flex gap-2 mt-2 compact:mt-1.5 short:mt-1 tiny:mt-1 micro:mt-0.5 nano:mt-0.5 min-w-0 overflow-x-auto scrollbar-hide [overflow-y:hidden] [-webkit-overflow-scrolling:touch]',

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
    className: 'py-3.5 compact:py-3 short:py-2.5 tiny:py-2 micro:py-1.5 nano:py-1.5',
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
  className:
    'inline-flex min-h-11 flex-shrink-0 items-center justify-center rounded-lg bg-surface-elevated px-3 py-2.5 text-sm font-semibold text-text/70 transition-[background-color,color,box-shadow,transform] duration-200 ease-out hover:scale-[1.03] hover:bg-primary/10 hover:text-primary hover:shadow-md active:scale-[0.97] active:bg-primary/20 active:text-primary active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  /** 基礎樣式 */
  base: {
    padding: 'px-3 py-2.5',
    borderRadius: 'rounded-lg',
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
    transition: 'transition-[background-color,color,box-shadow,transform] duration-200 ease-out',
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
    /** 12px - 最小可讀標籤；保留 2xs key 作為舊呼叫相容別名 */
    '2xs': { size: '0.75rem', lineHeight: '1rem', class: 'text-xs' },
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
    border: 'rounded-lg',
    cursor: 'cursor-pointer',
    transition:
      'transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out',
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
      default: 'bg-primary text-primary-foreground',
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
      default: 'bg-destructive text-destructive-foreground',
      hover: 'hover:bg-destructive-hover hover:shadow-lg hover:-translate-y-0.5',
      active: 'active:translate-y-0 active:shadow-md',
    },
  },

  /** 完整類別組合 - 直接複製使用 */
  patterns: {
    primaryMd:
      'inline-flex items-center justify-center font-semibold rounded-lg cursor-pointer transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none px-4 py-2 text-base h-10 gap-2 bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md',
    secondaryMd:
      'inline-flex items-center justify-center font-semibold rounded-lg cursor-pointer transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none px-4 py-2 text-base h-10 gap-2 bg-surface-elevated text-text border border-border hover:bg-surface hover:border-primary/30 hover:text-primary active:bg-surface-sunken',
    ghostMd:
      'inline-flex items-center justify-center font-semibold rounded-lg cursor-pointer transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none px-4 py-2 text-base h-10 gap-2 bg-transparent text-text hover:bg-surface-elevated hover:text-primary active:bg-surface-sunken',
    dangerMd:
      'inline-flex items-center justify-center font-semibold rounded-lg cursor-pointer transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none px-4 py-2 text-base h-10 gap-2 bg-destructive text-destructive-foreground hover:bg-destructive-hover hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md',
  },
} as const;

export const feedbackSurfaceTokens = {
  pageCenter: 'flex min-h-dvh items-center justify-center bg-background p-4 sm:p-6',
  card: 'w-full max-w-lg rounded-lg border border-border/70 bg-surface p-6 text-center shadow-lg sm:p-8',
  icon: 'mx-auto text-destructive',
  title: 'mt-4 text-2xl font-bold text-text',
  description: 'mb-6 mt-2 text-text-muted',
  actionButton:
    'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  dangerActionButton:
    'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  detailsPanel: 'rounded-lg border border-danger-light bg-danger-bg p-3',
} as const;

/**
 * PWA 通知設計規範 (SSOT)
 *
 * 統一 UpdatePrompt 與 OfflineIndicator 的視覺風格。
 * Material Design snackbar 風格，支援頂部與底部定位。
 *
 * 設計原則：
 * - 使用安靜的 surface 浮層，避免品牌漸層背景
 * - 透過圖標顏色區分狀態（更新=主色、離線=警告色）
 * - 共享一致的動作、邊框與微弱裝飾語法
 *
 * @see src/components/UpdatePrompt.tsx
 * @see src/components/OfflineIndicator.tsx
 * @created 2026-02-03
 * @updated 2026-02-09 - 新增離線通知變體，統一設計系統
 * @version 2.0.0
 */
export const notificationTokens = {
  /** 固定定位 + 容器尺寸（視窗底部中央） - UpdatePrompt 專用
   * 注意：不使用 -translate-x-1/2，改用 Motion 的 x: '-50%' 避免 transform 衝突
   * 行動版定位在 header 下方，避免阻擋底部導覽列
   */
  position:
    'fixed top-[var(--notification-mobile-top-offset)] md:top-auto md:bottom-4 left-1/2 w-[calc(100vw-2rem)] max-w-[344px] z-50',
  /** 行動版頂部偏移量：header 高度 + safe area + 16px 間距 */
  mobileTopOffset: `calc(${navigationTokens.header.height}px + env(safe-area-inset-top, 0px) + 16px)`,
  /** 固定定位 + 容器尺寸（視窗頂部中央） - OfflineIndicator 專用
   * 注意：不使用 -translate-x-1/2，改用 Motion 的 x: '-50%' 避免 transform 衝突
   */
  positionTop: 'fixed top-4 left-1/2 w-[calc(100vw-2rem)] max-w-[344px] z-[9999]',
  /** 內距 */
  padding: 'px-6 py-3.5',
  /** 圓角（與 card / button 統一） */
  borderRadius: 'rounded-lg',
  /** 陰影（統一較安靜的浮層語法） */
  shadow: 'shadow-lg',

  /** 背景與邊框 */
  background: {
    brand: 'bg-surface',
    brandBorder: 'border border-border/70',
  },

  /** 裝飾光暈 */
  decoration: {
    size: 'w-14 h-14',
    blur: 'blur-xl',
    /** 品牌色光暈（UpdatePrompt） */
    topRight: 'bg-primary/10',
    bottomLeft: 'bg-accent/10',
    /** 警告色光暈（OfflineIndicator） */
    offlineTopRight: 'bg-warning/12',
    offlineBottomLeft: 'bg-warning/8',
  },

  /** 狀態圖標 */
  icon: {
    container: 'w-8 h-8 rounded-lg border border-border/60 bg-surface-elevated',
    svg: 'w-5 h-5',
    strokeWidth: 2.5,
    /** 品牌圖標底色（UpdatePrompt） */
    brandGradient: 'bg-surface-elevated text-primary',
    /** 警告圖標底色（OfflineIndicator） */
    warningGradient: 'bg-warning/15 text-warning',
  },

  /** 文字顏色 */
  text: {
    /** 品牌色標題（UpdatePrompt） */
    brandTitle: 'text-text',
    brandDescription: 'text-text-muted',
    /** 警告色標題（OfflineIndicator） */
    warningTitle: 'text-warning',
    warningDescription: 'text-text-muted',
  },

  /** 通知類操作按鈕 */
  actions: {
    primary:
      'pointer-events-auto inline-flex items-center justify-center rounded-full border border-border/70 bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text shadow-sm transition-[color,background-color,border-color,transform,opacity] duration-200 ease-out hover:border-primary/30 hover:bg-surface hover:text-primary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
    text: 'inline-flex items-center rounded px-1 text-xs text-text-muted transition-colors duration-150 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
    icon: 'pointer-events-auto rounded-full border border-border/70 bg-surface-elevated p-1.5 text-text-muted transition-[color,background-color,border-color,transform] duration-200 ease-out hover:border-primary/20 hover:bg-surface hover:text-text active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
  },

  /** 時序 */
  timing: {
    /** 入場延遲 (ms) */
    showDelay: 100,
    /** SW 定期檢查間隔 (ms) */
    updateInterval: 3_600_000,
    /** offlineReady 自動消失 (ms) */
    autoDismiss: 5_000,
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
