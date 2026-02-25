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
      textMuted: '#64748b',
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
      text: '#8E7C80', // Softer Warm Grey (less harsh than black)
      textMuted: '#C5B4B6',
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

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'minimalist',
  language: 'zh-TW',
  cacheDurationDays: 7,
  notificationsEnabled: true,
};
