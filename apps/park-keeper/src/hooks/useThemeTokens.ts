import { useEffect } from 'react';
import type { ThemeConfig } from '@app/park-keeper/types';

/**
 * 將主題色寫入全域 CSS vars（issue #725）：
 * Home 與 /add 共用單一接線點，避免 token 集合漂移（曾缺 accent/secondary/text-muted）。
 */
export function useThemeTokens(theme: ThemeConfig) {
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--color-primary', theme.colors.primary);
    root.setProperty('--color-bg', theme.colors.background);
    root.setProperty('--color-surface', theme.colors.surface);
    root.setProperty('--color-text', theme.colors.text);
    root.setProperty('--color-accent', theme.colors.accent);
    root.setProperty('--color-secondary', theme.colors.secondary);
    root.setProperty('--color-text-muted', theme.colors.textMuted);
    root.setProperty('--color-danger', theme.colors.danger);

    const hex = theme.colors.primary.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    root.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
  }, [theme]);
}
