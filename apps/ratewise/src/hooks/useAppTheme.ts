/**
 * useAppTheme - 應用程式主題管理 Hook
 *
 * @description 管理風格、配色、模式的切換與持久化
 *              支援 SSR 安全的初始化
 *
 * @created 2026-01-16
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import {
  type ThemeConfig,
  type ThemeStyle,
  type ColorScheme,
  type ThemeMode,
  DEFAULT_THEME_CONFIG,
  applyTheme,
} from '../config/themes';

// Storage key
const STORAGE_KEY = 'ratewise-theme';

/**
 * 從 localStorage 讀取主題配置
 */
function loadThemeConfig(): ThemeConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_CONFIG;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ThemeConfig>;
      return {
        style: parsed.style ?? DEFAULT_THEME_CONFIG.style,
        colorScheme: parsed.colorScheme ?? DEFAULT_THEME_CONFIG.colorScheme,
        mode: parsed.mode ?? DEFAULT_THEME_CONFIG.mode,
      };
    }
  } catch {
    // Ignore parsing errors
  }

  return DEFAULT_THEME_CONFIG;
}

/**
 * 保存主題配置到 localStorage
 */
function saveThemeConfig(config: ThemeConfig): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

/**
 * 檢測系統是否偏好深色模式
 */
function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * useAppTheme Hook
 *
 * @returns 主題配置與操作方法
 */
export function useAppTheme() {
  // 使用固定初始值避免 SSR hydration 問題
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  // 客戶端初始化 - 使用 requestAnimationFrame 避免同步 setState
  // [fix:2026-01-16] 遵循 ESLint react-hooks/set-state-in-effect 規則
  useEffect(() => {
    // 使用 requestAnimationFrame 延遲執行，避免同步 setState
    const initTheme = () => {
      const savedConfig = loadThemeConfig();
      setConfig(savedConfig);
      applyTheme(savedConfig);
      setIsLoaded(true);
    };

    // 延遲到下一幀執行，避免同步 setState 警告
    const frameId = requestAnimationFrame(initTheme);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // 監聽系統主題變化（當 mode 為 auto 時）
  useEffect(() => {
    if (config.mode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyTheme(config);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [config]);

  // 設定風格
  const setStyle = useCallback((style: ThemeStyle) => {
    setConfig((prev) => {
      const newConfig = { ...prev, style };
      saveThemeConfig(newConfig);
      applyTheme(newConfig);
      return newConfig;
    });
  }, []);

  // 設定配色
  const setColorScheme = useCallback((colorScheme: ColorScheme) => {
    setConfig((prev) => {
      const newConfig = { ...prev, colorScheme };
      saveThemeConfig(newConfig);
      applyTheme(newConfig);
      return newConfig;
    });
  }, []);

  // 設定模式
  const setMode = useCallback((mode: ThemeMode) => {
    setConfig((prev) => {
      const newConfig = { ...prev, mode };
      saveThemeConfig(newConfig);
      applyTheme(newConfig);
      return newConfig;
    });
  }, []);

  // 切換深淺模式
  const toggleMode = useCallback(() => {
    setConfig((prev) => {
      const currentIsDark =
        prev.mode === 'dark' || (prev.mode === 'auto' && getSystemPrefersDark());
      const newMode: ThemeMode = currentIsDark ? 'light' : 'dark';
      const newConfig = { ...prev, mode: newMode };
      saveThemeConfig(newConfig);
      applyTheme(newConfig);
      return newConfig;
    });
  }, []);

  // 重置為預設
  const resetTheme = useCallback(() => {
    setConfig(DEFAULT_THEME_CONFIG);
    saveThemeConfig(DEFAULT_THEME_CONFIG);
    applyTheme(DEFAULT_THEME_CONFIG);
  }, []);

  // 計算當前實際模式
  const resolvedMode: 'light' | 'dark' =
    config.mode === 'auto' ? (getSystemPrefersDark() ? 'dark' : 'light') : config.mode;

  return {
    // 配置
    config,
    style: config.style,
    colorScheme: config.colorScheme,
    mode: config.mode,
    resolvedMode,

    // 狀態
    isLoaded,
    isDark: resolvedMode === 'dark',

    // 操作
    setStyle,
    setColorScheme,
    setMode,
    toggleMode,
    resetTheme,
  };
}

export type UseAppThemeReturn = ReturnType<typeof useAppTheme>;
