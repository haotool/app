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
import {
  DEFAULT_CUSTOM_BACKGROUND_TONE,
  DEFAULT_CUSTOM_PRIMARY,
  isValidBackgroundToneValue,
  isValidHexColor,
  type CustomBackgroundToneValue,
} from '../config/custom-theme';

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
 *              export 供 main.tsx client 初始化補齊 custom 完整演算（bootstrap 僅做最小覆寫）。
 */
export function loadThemeConfig(): ThemeConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_CONFIG;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as {
        style?: unknown;
        customPrimary?: unknown;
        customBackgroundTone?: unknown;
      };
      const rawStyle = parsed.style;
      // customPrimary 僅在通過 hex 驗證時保留（防注入與壞資料）。
      const customPrimary = isValidHexColor(parsed.customPrimary)
        ? parsed.customPrimary
        : undefined;
      // customBackgroundTone 走 allowlist | hex 驗證（E7 wave-C 連續 tone）；
      // 舊資料缺省不寫入（讀取端視為 pure）。
      const customBackgroundTone = isValidBackgroundToneValue(parsed.customBackgroundTone)
        ? parsed.customBackgroundTone
        : undefined;
      if (typeof rawStyle === 'string') {
        const migrated = LEGACY_STYLE_MIGRATION[rawStyle];
        if (migrated) {
          const migratedConfig: ThemeConfig = {
            style: migrated,
            ...(customPrimary && { customPrimary }),
            ...(customBackgroundTone && { customBackgroundTone }),
          };
          saveThemeConfig(migratedConfig);
          return migratedConfig;
        }
        // style 為 custom 但主色缺失/無效時，回退預設自訂主色（與 bootstrap 行為一致）。
        if (rawStyle === 'custom') {
          return {
            style: 'custom',
            customPrimary: customPrimary ?? DEFAULT_CUSTOM_PRIMARY,
            ...(customBackgroundTone && { customBackgroundTone }),
          };
        }
        return {
          style: rawStyle as ThemeStyle,
          ...(customPrimary && { customPrimary }),
          ...(customBackgroundTone && { customBackgroundTone }),
        };
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

  // 客戶端主題更新 - 只在配置變更時應用主題
  // （首次掛載由 index.html bootstrap 與 main.tsx client 初始化處理，含 custom 完整演算補齊）
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // 後續更新：正常應用主題
    applyTheme(config);
  }, [config]);

  // 設定風格（切至 custom 時沿用已存主色，無則使用預設自訂主色）
  const setStyle = useCallback((style: ThemeStyle) => {
    setConfig((prev) => {
      const newConfig: ThemeConfig =
        style === 'custom'
          ? { ...prev, style, customPrimary: prev.customPrimary ?? DEFAULT_CUSTOM_PRIMARY }
          : { ...prev, style };
      saveThemeConfig(newConfig);
      applyTheme(newConfig);
      return newConfig;
    });
  }, []);

  // 提交自訂主題（E7 wave-B draft 語意：sheet 關閉時單次原子持久化主色＋背景調）
  const commitCustomTheme = useCallback(
    (customPrimary: string, customBackgroundTone: CustomBackgroundToneValue) => {
      if (!isValidHexColor(customPrimary) || !isValidBackgroundToneValue(customBackgroundTone))
        return;
      const newConfig: ThemeConfig = { style: 'custom', customPrimary, customBackgroundTone };
      setConfig(newConfig);
      saveThemeConfig(newConfig);
      applyTheme(newConfig);
    },
    [],
  );

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
    customPrimary: config.customPrimary ?? DEFAULT_CUSTOM_PRIMARY,
    customBackgroundTone: config.customBackgroundTone ?? DEFAULT_CUSTOM_BACKGROUND_TONE,

    // 狀態
    isLoaded,

    // 操作
    setStyle,
    commitCustomTheme,
    resetTheme,
  };
}

export type UseAppThemeReturn = ReturnType<typeof useAppTheme>;
