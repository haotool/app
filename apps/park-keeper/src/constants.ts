import type { ThemeConfig, AppSettings } from './types';

export const THEMES: Record<string, ThemeConfig> = {
  racing: {
    id: 'racing',
    name: 'Nitro',
    colors: {
      primary: '#00f2ff', // 提高飽和度
      secondary: '#ff00ff',
      accent: '#ffff00',
      background: '#020617', // 改為極深 Slate，強化對比
      surface: '#0f172a',
      text: '#ffffff',
      // textMuted 加亮至 WCAG AA：4.63:1（on #020617），修正首屏底部導覽列 inactive tab
      // 對比不足問題（原 #64748b 僅 4.24:1，issue #753 主題對比修復）。
      textMuted: '#6b7a91',
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
      secondary: '#BAE1FF', // Pastel Blue (Sky)
      accent: '#FFFFBA', // Pastel Yellow (Cream)
      background: '#FFFAF4', // Very light warm white
      surface: '#FFFFFF',
      // 暖粉灰調加深至 WCAG AA：text 5.66:1、textMuted 4.61:1（on #FFFAF4），保留粉彩柔和感。
      text: '#755F63',
      textMuted: '#826D73',
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
      secondary: '#f1f5f9',
      accent: '#3b82f6',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      textMuted: '#64748b',
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
      secondary: '#ffedd5',
      accent: '#ea580c',
      background: '#fffafb',
      surface: '#fffcf9',
      text: '#431407',
      textMuted: '#9a3412',
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
