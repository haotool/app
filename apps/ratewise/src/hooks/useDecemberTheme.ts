/**
 * useDecemberTheme Hook
 * @file useDecemberTheme.ts
 * @description 自動偵測 12 月並管理聖誕主題狀態
 *
 * 功能：
 * - 自動偵測是否為 12 月
 * - 結合 prefers-reduced-motion 設定
 * - 提供主題開關控制
 * - SSR 安全
 *
 * [fix:2025-12-26] 修復 ESLint set-state-in-effect 錯誤
 * 參考: [context7:/websites/react_dev_reference:useEffect:2025-12-26]
 * 解法: 使用 useSyncExternalStore 或 lazy initial state 避免 SSR hydration mismatch
 */

import { useState, useCallback, useSyncExternalStore } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * 12 月主題 Hook 返回值
 */
export interface DecemberThemeState {
  /** 當前是否為 12 月 */
  isDecember: boolean;
  /** 是否應該顯示動畫效果（12 月 + 未啟用減少動畫 + 用戶未關閉） */
  showAnimations: boolean;
  /** 用戶是否手動關閉了主題 */
  isDisabledByUser: boolean;
  /** 切換主題開關 */
  toggleTheme: () => void;
  /** 當前年份 */
  currentYear: number;
}

/** LocalStorage key for user preference */
const THEME_DISABLED_KEY = 'ratewise-december-theme-disabled';

/**
 * 取得目前月份和年份（SSR 安全）
 * @returns { isDecember, currentYear }
 *
 * [fix:2026-01-16] 使用 build time 作為 SSR 的基準時間，避免 hydration mismatch
 * - SSR/SSG 時使用 VITE_BUILD_TIME 環境變數
 * - 客戶端 hydration 時也使用相同的 build time
 * - 這確保 SSR 和客戶端的初始渲染一致
 */
function getDateInfo(): { isDecember: boolean; currentYear: number } {
  // 使用 build time 作為基準，避免 SSR/client hydration mismatch
  const buildTime = import.meta.env.VITE_BUILD_TIME;
  const now = typeof buildTime === 'string' ? new Date(buildTime) : new Date();
  return {
    isDecember: now.getMonth() === 11, // 0-indexed, 11 = December
    currentYear: now.getFullYear(),
  };
}

/**
 * 從 localStorage 讀取用戶偏好（SSR 安全）
 */
function getStoredPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(THEME_DISABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

// useSyncExternalStore 訂閱函數（用於 localStorage）
const subscribeToStorage = (callback: () => void) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

// SSR 時返回 false（server snapshot）
const getServerSnapshot = () => false;

/**
 * 12 月主題 Hook
 * @description 自動偵測 12 月並管理聖誕主題狀態
 * @returns 主題狀態和控制函數
 */
export function useDecemberTheme(): DecemberThemeState {
  // [fix:2025-12-26] 使用 useSyncExternalStore 避免 SSR hydration mismatch
  // 這是 React 18+ 推薦的方式來訂閱外部狀態（如 localStorage）
  const isDisabledByUser = useSyncExternalStore(
    subscribeToStorage,
    getStoredPreference,
    getServerSnapshot,
  );

  // 日期資訊使用 lazy initial state，避免 useEffect 中 setState
  const [dateInfo] = useState(getDateInfo);
  const prefersReducedMotion = useReducedMotion();

  // 切換主題開關
  const toggleTheme = useCallback(() => {
    try {
      const current = localStorage.getItem(THEME_DISABLED_KEY) === 'true';
      if (current) {
        localStorage.removeItem(THEME_DISABLED_KEY);
      } else {
        localStorage.setItem(THEME_DISABLED_KEY, 'true');
      }
      // 觸發 storage 事件讓 useSyncExternalStore 更新
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_DISABLED_KEY }));
    } catch {
      // localStorage 不可用，忽略
    }
  }, []);

  // 計算是否顯示動畫
  const showAnimations = dateInfo.isDecember && !prefersReducedMotion && !isDisabledByUser;

  return {
    isDecember: dateInfo.isDecember,
    showAnimations,
    isDisabledByUser,
    toggleTheme,
    currentYear: dateInfo.currentYear,
  };
}
