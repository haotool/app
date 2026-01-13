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
 * - 支援自動跟隨系統模式 ('auto')
 *
 * @usage
 * ```tsx
 * const { theme, mode, setTheme } = useTheme();
 *
 * // 手動設定主題
 * <button onClick={() => setTheme('dark')}>切換深色</button>
 *
 * // 跟隨系統
 * <button onClick={() => setTheme('auto')}>跟隨系統</button>
 * ```
 *
 * @see src/config/design-tokens.ts - Design Token 定義
 * @see src/index.css - CSS Variables 定義
 *
 * @created 2026-01-13
 * @version 2.0.0 - 新增 auto 模式支援
 */

import { useEffect, useState } from 'react';

/**
 * 主題模式類型（包含 auto 模式）
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * 實際應用的主題類型
 */
export type Theme = 'light' | 'dark';

/**
 * localStorage 儲存鍵名
 */
const STORAGE_KEY = 'ratewise-theme';

/**
 * 取得系統偏好主題
 *
 * @returns {Theme} 系統偏好的主題
 */
function getSystemPreference(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * 取得初始主題模式
 *
 * 優先級：
 * 1. localStorage 中的使用者偏好 ('light' | 'dark' | 'auto')
 * 2. 預設為 'auto' (跟隨系統)
 *
 * @returns {ThemeMode} 初始主題模式
 */
function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'auto';
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored;
    }
  } catch (error) {
    console.warn('[useTheme] Failed to read theme preference:', error);
  }

  return 'auto';
}

/**
 * 根據模式解析實際應用的主題
 *
 * @param {ThemeMode} mode - 主題模式
 * @returns {Theme} 實際應用的主題
 */
function resolveTheme(mode: ThemeMode): Theme {
  if (mode === 'auto') {
    return getSystemPreference();
  }
  return mode;
}

/**
 * useTheme Hook
 *
 * @returns {{ theme: Theme, mode: ThemeMode, setTheme: (mode: ThemeMode) => void }}
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, mode, setTheme } = useTheme();
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
  // 用戶選擇的模式 ('light' | 'dark' | 'auto')
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  // 實際應用的主題 ('light' | 'dark')
  const [theme, setThemeState] = useState<Theme>(() => resolveTheme(getInitialMode()));

  // 監聽系統偏好變更（只在 auto 模式下生效）
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // 只在 auto 模式下設置監聽器
    if (mode === 'auto') {
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
      };

      // 監聽變更
      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }

    // 當 mode 不是 auto 時，不需要監聽器
    return undefined;
  }, [mode]);

  // 應用主題到 DOM（不寫入 localStorage）
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  /**
   * 切換主題模式
   *
   * @param {ThemeMode} newMode - 新的主題模式 ('light' | 'dark' | 'auto')
   */
  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);

    // 解析實際應用的主題
    const resolvedTheme = resolveTheme(newMode);
    setThemeState(resolvedTheme);

    // 儲存用戶選擇到 localStorage
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch (error) {
      console.warn('[useTheme] Failed to save theme preference:', error);
    }
  };

  return { theme, mode, setTheme };
}
