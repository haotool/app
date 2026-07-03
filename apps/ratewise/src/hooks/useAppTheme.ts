/**
 * useAppTheme - 應用程式主題管理 Hook
 *
 * @description 管理風格（Zen/Violet/Nitro/Racing/Kawaii/Classic/Forest）的切換與持久化
 *              支援 SSR 安全的初始化，防止 FOUC（Flash of Unstyled Content）
 *
 * @reference ParkKeeper Design System
 *
 * @architecture
 * 1. index.html 中的同步腳本負責**首次繪製前**設置 data-style
 * 2. 本 Hook 只負責**後續的主題切換**和狀態同步
 * 3. 避免在 useEffect 中重新應用主題導致閃爍
 * 4. 讀取持久化配置時對 legacy 風格值做無感遷移（見 LEGACY_STYLE_MIGRATION）
 *
 * @created 2026-01-16
 * @updated 2026-07-04 - Plan 014：加入 ocean→racing 持久化遷移
 * @version 3.1.0
 */

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import {
  type ThemeConfig,
  type ThemeStyle,
  DEFAULT_THEME_CONFIG,
  applyTheme,
} from '../config/themes';

// Storage key（必須與 index.html 中的腳本一致）
const STORAGE_KEY = 'ratewise-theme';

/**
 * Legacy 風格值遷移對映
 *
 * @description Plan 014 移除 Ocean「海洋深邃」主題並以 Racing「黑紅賽車」取代；
 *              既有使用者持久化的 'ocean' 值讀取時無感遷移為 'racing'，並回寫 localStorage。
 */
const LEGACY_STYLE_MIGRATION: Record<string, ThemeStyle> = {
  ocean: 'racing',
};

function subscribeHydrationReady(onStoreChange: () => void): () => void {
  let isSubscribed = true;
  queueMicrotask(() => {
    if (isSubscribed) {
      onStoreChange();
    }
  });
  return () => {
    isSubscribed = false;
  };
}

/**
 * 從 localStorage 讀取主題配置
 *
 * @description 讀到 legacy 風格值（如舊版 'ocean'）時，透過
 *              {@link LEGACY_STYLE_MIGRATION} 無感遷移為現行風格並回寫 localStorage，
 *              確保後續讀取與 setStyle 儲存的值一致。
 */
function loadThemeConfig(): ThemeConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_CONFIG;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { style?: unknown };
      const rawStyle = parsed.style;
      if (typeof rawStyle === 'string') {
        const migrated = LEGACY_STYLE_MIGRATION[rawStyle];
        if (migrated) {
          const migratedConfig: ThemeConfig = { style: migrated };
          saveThemeConfig(migratedConfig);
          return migratedConfig;
        }
        return { style: rawStyle as ThemeStyle };
      }
      return DEFAULT_THEME_CONFIG;
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
 * useAppTheme Hook
 *
 * @returns 主題配置與操作方法
 */
export function useAppTheme() {
  // 直接從 localStorage 初始化（index.html 中的腳本已經同步設置了 DOM）。
  const [config, setConfig] = useState<ThemeConfig>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_THEME_CONFIG;
    }
    return loadThemeConfig();
  });
  // useSyncExternalStore 讓 hydration 先匹配 server(false)，再於 client 自動翻轉為 true。
  const isLoaded = useSyncExternalStore(
    subscribeHydrationReady,
    () => true,
    () => false,
  );

  // 追蹤是否是首次掛載（避免重複應用主題）
  const isFirstMount = useRef(true);

  // 客戶端主題更新 - 只在配置變更時應用主題（首次掛載由 index.html 處理）
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // 後續更新：正常應用主題
    applyTheme(config);
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

  // 重置為預設
  const resetTheme = useCallback(() => {
    setConfig(DEFAULT_THEME_CONFIG);
    saveThemeConfig(DEFAULT_THEME_CONFIG);
    applyTheme(DEFAULT_THEME_CONFIG);
  }, []);

  return {
    // 配置
    config,
    style: config.style,

    // 狀態
    isLoaded,

    // 操作
    setStyle,
    resetTheme,
  };
}

export type UseAppThemeReturn = ReturnType<typeof useAppTheme>;
