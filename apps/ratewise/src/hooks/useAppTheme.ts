/**
 * useAppTheme - 應用程式主題管理 Hook
 *
 * @description 管理風格（Nitro/Kawaii/Zen/Classic/Ocean/Forest）與模式的切換與持久化
 *              支援 SSR 安全的初始化，防止 FOUC（Flash of Unstyled Content）
 *
 * @reference ParkKeeper Design System
 * @reference [context7:/websites/react_dev:useLayoutEffect:2026-01-17]
 * @reference [WebSearch:React SSR hydration flickering theme switching FOUC fix 2025]
 *
 * @architecture
 * 1. index.html 中的同步腳本負責**首次繪製前**設置 data-style/data-mode
 * 2. 本 Hook 只負責**後續的主題切換**和狀態同步
 * 3. 避免在 useEffect 中重新應用主題導致閃爍
 *
 * @created 2026-01-16
 * @updated 2026-01-17 - 修復 FOUC 閃爍問題（配合 index.html 同步腳本）
 * @version 2.1.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type ThemeConfig,
  type ThemeStyle,
  type ThemeMode,
  DEFAULT_THEME_CONFIG,
  applyTheme,
} from '../config/themes';

// Storage key（必須與 index.html 中的腳本一致）
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
  // 直接從 localStorage 初始化（index.html 中的腳本已經同步設置了 DOM）
  // 這避免了 SSR hydration 後的重新渲染閃爍
  const [config, setConfig] = useState<ThemeConfig>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_THEME_CONFIG;
    }
    return loadThemeConfig();
  });
  // isLoaded: 標記客戶端是否已載入（用於 SSR 期間禁用按鈕）
  // 直接從環境判斷，無需在 effect 中更新
  const isLoaded = typeof window !== 'undefined';

  // 追蹤是否是首次掛載（避免重複應用主題）
  const isFirstMount = useRef(true);

  // 客戶端主題更新 - 只在配置變更時應用主題（首次掛載由 index.html 處理）
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      // 首次掛載：index.html 同步腳本已經設置了 DOM，跳過重複應用
      return;
    }
    // 後續更新：正常應用主題
    applyTheme(config);
  }, [config]);

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
    mode: config.mode,
    resolvedMode,

    // 狀態
    isLoaded,
    isDark: resolvedMode === 'dark',

    // 操作
    setStyle,
    setMode,
    toggleMode,
    resetTheme,
  };
}

export type UseAppThemeReturn = ReturnType<typeof useAppTheme>;
