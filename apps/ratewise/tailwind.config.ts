import type { Config } from 'tailwindcss';
import {
  generateTailwindThemeExtension,
  spacingTokens,
  typographyTokens,
  breakpointTokens,
} from './src/config/design-tokens';

/**
 * Tailwind CSS Configuration
 *
 * @description 現代化設計系統 - 扁平 UI + 語義化 Token + SSOT
 * @see src/config/design-tokens.ts - Design Token SSOT (色彩、間距、字型、斷點)
 * @see src/index.css - CSS Variables 定義
 * @see src/components/Button.tsx - 統一按鈕組件
 * @see src/components/PageContainer.tsx - 統一頁面佈局組件
 *
 * @reference
 * - shadcn/ui Theming: https://ui.shadcn.com/docs/theming
 * - Tailwind CSS Theme: https://tailwindcss.com/docs/theme
 *
 * @updated 2026-01-25 - 整合 spacingTokens、typographyTokens、breakpointTokens SSOT
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-mode="dark"]'],
  theme: {
    ...generateTailwindThemeExtension(),
    extend: {
      ...generateTailwindThemeExtension().extend,
      // 字型家族 - 使用 typographyTokens SSOT
      fontFamily: {
        sans: typographyTokens.fontFamily.sans,
        mono: typographyTokens.fontFamily.mono,
      },
      // 自定義間距 - 使用 spacingTokens SSOT 擴展
      spacing: {
        // 額外的間距值（補充 Tailwind 預設）
        '18': '4.5rem', // 72px
        '22': '5.5rem', // 88px
      },
      // 現代化語義色彩（使用 CSS Variables）
      colors: {
        // 新版語義化 token（主要使用）
        // SSOT: 基礎語義色彩
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
          sunken: 'rgb(var(--color-surface-sunken) / <alpha-value>)',
        },
        text: 'rgb(var(--color-text) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        'background-secondary': 'rgb(var(--color-background-secondary) / <alpha-value>)',
        'background-tertiary': 'rgb(var(--color-background-tertiary) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        'foreground-secondary': 'rgb(var(--color-foreground-secondary) / <alpha-value>)',
        'foreground-muted': 'rgb(var(--color-foreground-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        'border-secondary': 'rgb(var(--color-border-secondary) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--color-destructive) / <alpha-value>)',
          hover: 'rgb(var(--color-destructive-hover) / <alpha-value>)',
          foreground: 'rgb(var(--color-destructive-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          foreground: 'rgb(var(--color-success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          foreground: 'rgb(var(--color-warning-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--color-card) / <alpha-value>)',
          foreground: 'rgb(var(--color-card-foreground) / <alpha-value>)',
        },
        input: {
          DEFAULT: 'rgb(var(--color-input) / <alpha-value>)',
          border: 'rgb(var(--color-input-border) / <alpha-value>)',
        },
        ring: 'rgb(var(--color-ring) / <alpha-value>)',
        sidebar: {
          DEFAULT: 'rgb(var(--color-sidebar) / <alpha-value>)',
          foreground: 'rgb(var(--color-sidebar-foreground) / <alpha-value>)',
          active: 'rgb(var(--color-sidebar-active) / <alpha-value>)',
        },
        // 計算機按鍵專用色彩（iOS-inspired 三色分組）
        // @see docs/dev/xxx_calculator_color_system.md
        'calc-number': 'rgb(var(--color-calc-number) / <alpha-value>)',
        'calc-number-text': 'rgb(var(--color-calc-number-text) / <alpha-value>)',
        'calc-number-hover': 'rgb(var(--color-calc-number-hover) / <alpha-value>)',
        'calc-number-active': 'rgb(var(--color-calc-number-active) / <alpha-value>)',
        'calc-operator': 'rgb(var(--color-calc-operator) / <alpha-value>)',
        'calc-operator-text': 'rgb(var(--color-calc-operator-text) / <alpha-value>)',
        'calc-operator-hover': 'rgb(var(--color-calc-operator-hover) / <alpha-value>)',
        'calc-operator-active': 'rgb(var(--color-calc-operator-active) / <alpha-value>)',
        'calc-function': 'rgb(var(--color-calc-function) / <alpha-value>)',
        'calc-function-text': 'rgb(var(--color-calc-function-text) / <alpha-value>)',
        'calc-function-hover': 'rgb(var(--color-calc-function-hover) / <alpha-value>)',
        'calc-function-active': 'rgb(var(--color-calc-function-active) / <alpha-value>)',
        // 等號鍵專用色彩（深色強調）
        'calc-equals': 'rgb(var(--color-calc-equals) / <alpha-value>)',
        'calc-equals-text': 'rgb(var(--color-calc-equals-text) / <alpha-value>)',
        'calc-equals-hover': 'rgb(var(--color-calc-equals-hover) / <alpha-value>)',
        'calc-equals-active': 'rgb(var(--color-calc-equals-active) / <alpha-value>)',
        // 保留舊版 token 向後相容
        ...generateTailwindThemeExtension().extend?.colors,
      },
      // 現代化圓角 - ParkKeeper 風格
      borderRadius: {
        '4xl': '2rem', // 超大圓角
        '3xl': '1.5rem', // 卡片預設
        '2xl': '1rem', // 按鈕、輸入框
        xl: '0.75rem',
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      // 現代化陰影（微妙、扁平）
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 3px 0 rgb(0 0 0 / 0.05)',
        'card-hover': '0 2px 4px 0 rgb(0 0 0 / 0.04), 0 4px 8px 0 rgb(0 0 0 / 0.06)',
        soft: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
      },
      // 現代化動畫
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-in-bounce': 'slide-in-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(0.5rem)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      // 字型大小 - 補充 2xs 尺寸
      fontSize: {
        '2xs': [typographyTokens.fontSize['2xs'].size, typographyTokens.fontSize['2xs'].lineHeight],
      },
    },
    // 斷點 - 使用 breakpointTokens SSOT (覆蓋預設)
    screens: {
      sm: breakpointTokens.screens.sm.min,
      md: breakpointTokens.screens.md.min,
      lg: breakpointTokens.screens.lg.min,
      xl: breakpointTokens.screens.xl.min,
      '2xl': breakpointTokens.screens['2xl'].min,
      // 高度斷點 - 小螢幕 RWD 優化 (iPhone SE/8)
      short: { raw: breakpointTokens.screens.short.raw },
      // 高度斷點 - 緊湊螢幕 (大多數手機 PWA)
      compact: { raw: breakpointTokens.screens.compact.raw },
      tall: { raw: breakpointTokens.screens.tall.raw },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
} satisfies Config;
