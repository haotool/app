import type { ThemeConfig, AppSettings } from './types';

export const THEMES: Record<string, ThemeConfig> = {
  racing: {
    id: 'racing',
    name: 'Nitro',
    colors: {
      primary: '#00f2ff', // 提高飽和度
      // primary 底前景色：14.55:1（on #00f2ff），CTA 深字取代白字（issue #753 審查收斂）。
      onPrimary: '#020617',
      secondary: '#ff00ff',
      accent: '#ffff00',
      background: '#020617', // 改為極深 Slate，強化對比
      surface: '#0f172a',
      text: '#ffffff',
      // textMuted 安全 margin 提升（R6 NEW-2）：6.43:1（on #020617）、5.69:1（on #0f172a surface）。
      // 原 #7387a3 on surface 僅 4.87:1，axe 字型渲染取樣偏差（實測可低 ~0.5）下無安全餘裕。
      textMuted: '#7f93af',
      // 深底主題用亮紅：7.29:1（on #020617）、6.45:1（on #0f172a）。
      danger: '#f87171',
    },
    font: 'font-racing',
    borderRadius: '0px',
    animationType: 'inertia',
  },
  cute: {
    id: 'cute',
    name: 'Kawaii',
    colors: {
      primary: '#FFB3BA', // Lighter Pastel Pink (Strawberry Milk)
      // primary 底前景色：深莓紅 7.58:1（on #FFB3BA），取代白字 1.69:1（issue #753 審查收斂）。
      onPrimary: '#5c1a2a',
      secondary: '#BAE1FF', // Pastel Blue (Sky)
      accent: '#FFFFBA', // Pastel Yellow (Cream)
      background: '#FFFAF4', // Very light warm white
      surface: '#FFFFFF',
      // 暖粉棕調主文字（R6 review：修正 text < textMuted 層級倒置）：7.91:1（on #FFFAF4）、
      // 8.21:1（on #FFFFFF），高於 textMuted 一階，保留粉彩柔和感。
      text: '#5D4A4F',
      // textMuted 安全 margin 提升（R6 NEW-2）：6.14:1（on #FFFAF4）、6.37:1（on #FFFFFF）。
      // 原 #826D73 僅 4.61/4.79:1，axe 實測邊緣 case 已跌破 4.5（Kawaii 為 round-5 最嚴重主題）。
      textMuted: '#6E5A60',
      // 淺底主題用深紅（red-700）：6.23:1（on #FFFAF4）、6.47:1（on #FFFFFF）。
      danger: '#b91c1c',
    },
    font: 'font-cute',
    borderRadius: '28px', // Rounder
    animationType: 'spring',
  },
  minimalist: {
    id: 'minimalist',
    name: 'Zen',
    colors: {
      primary: '#1e293b',
      onPrimary: '#ffffff', // 14.63:1（on #1e293b）。
      secondary: '#f1f5f9',
      accent: '#3b82f6',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      // textMuted 安全 margin 提升（R6 NEW-2）：7.24:1（on #f8fafc）、7.58:1（on #ffffff）。
      // 原 #64748b 僅 4.55/4.76:1，round-5 axe 實測「手動記錄」4.07、空態 hint（LCP 元素）4.26。
      textMuted: '#475569',
      // 淺底主題用深紅（red-700）：6.18:1（on #f8fafc）、6.47:1（on #ffffff）。
      danger: '#b91c1c',
    },
    font: 'font-minimalist',
    borderRadius: '12px',
    animationType: 'tween',
  },
  literary: {
    id: 'literary',
    name: 'Classic',
    colors: {
      primary: '#7c2d12',
      onPrimary: '#ffffff', // 9.37:1（on #7c2d12）。
      secondary: '#ffedd5',
      accent: '#ea580c',
      background: '#fffafb',
      surface: '#fffcf9',
      text: '#431407',
      // 7.07:1（on #fffafb）、7.15:1（on #fffcf9），margin 充足，R6 不調。
      textMuted: '#9a3412',
      // 淺底主題用深紅（red-700）：6.26:1（on #fffafb）、6.33:1（on #fffcf9）。
      danger: '#b91c1c',
    },
    font: 'font-literary',
    borderRadius: '2px',
    animationType: 'tween',
  },
};

/**
 * cute 主題 wordmark 漸層色 token（issue #753 主題對比修復）。
 * 原 #FF9A9E／#FFB7B2（on #FFFAF4）對比僅 1.60–1.95:1，嚴重低於 WCAG AA；
 * 改用深玫瑰調三色，對比 4.80–5.45:1，保留 cute 主題粉色識別但可讀。
 */
export const CUTE_WORDMARK_GRADIENT = ['#C2255C', '#D0296B', '#C2255C'] as const;

// 保存天數 SSOT：照片清理、SW tile TTL、設定滑桿共用同一組邊界與預設值。
export const CACHE_DAYS = { MIN: 1, MAX: 30, DEFAULT: 7 } as const;

export const clampCacheDays = (value: number): number =>
  Math.min(CACHE_DAYS.MAX, Math.max(CACHE_DAYS.MIN, Math.round(value)));

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'minimalist',
  language: 'zh-TW',
  cacheDurationDays: CACHE_DAYS.DEFAULT,
};
