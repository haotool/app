/**
 * useTheme Hook - 動態主題切換
 *
 * @file useTheme.ts
 * @description 管理應用主題狀態，實現運行時主題切換
 *
 * @features
 * - 持久化主題偏好（localStorage）
 * - SSR 安全（檢查 window 是否存在）
 * - 自動更新 HTML data-theme attribute
 * - 支援系統偏好檢測（prefers-color-scheme）
 *
 * @usage
 * ```tsx
 * const { theme, setTheme } = useTheme();
 *
 * <button onClick={() => setTheme('dark')}>切換深色</button>
 * ```
 *
 * @see src/config/design-tokens.ts - Design Token 定義
 * @see src/index.css - CSS Variables 定義
 *
 * @created 2026-01-13
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';

/**
 * 支援的主題類型
 */
export type Theme = 'light' | 'dark';

/**
 * localStorage 儲存鍵名
 */
const STORAGE_KEY = 'ratewise-theme';

/**
 * 取得初始主題
 *
 * 優先級：
 * 1. localStorage 中的使用者偏好
 * 2. 系統偏好（prefers-color-scheme）
 * 3. 預設為淺色主題
 *
 * @returns {Theme} 初始主題
 */
function getInitialTheme(): Theme {
  // SSR 環境：返回預設值
  if (typeof window === 'undefined') {
    return 'light';
  }

  try {
    // 1. 檢查 localStorage
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    // 2. 檢查系統偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (error) {
    console.warn('[useTheme] Failed to read theme preference:', error);
  }

  // 3. 預設淺色主題
  return 'light';
}

/**
 * 應用主題到 DOM
 *
 * @param {Theme} theme - 要應用的主題
 */
function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  // 更新 HTML data-theme attribute
  document.documentElement.setAttribute('data-theme', theme);

  // 儲存到 localStorage
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    console.warn('[useTheme] Failed to save theme preference:', error);
  }
}

/**
 * useTheme Hook
 *
 * @returns {{ theme: Theme, setTheme: (theme: Theme) => void }}
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, setTheme } = useTheme();
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *       {theme === 'light' ? '🌙' : '☀️'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // 監聽系統偏好變更
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // 只在使用者未手動設定主題時跟隨系統偏好
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // 初始化時應用主題
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  /**
   * 切換主題
   *
   * @param {Theme} newTheme - 新主題
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  return { theme, setTheme };
}
