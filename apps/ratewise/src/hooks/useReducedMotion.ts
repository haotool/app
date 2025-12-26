/**
 * useReducedMotion Hook
 * @file useReducedMotion.ts
 * @description 偵測使用者的 prefers-reduced-motion 設定
 *
 * 用途：
 * - 尊重使用者的無障礙設定
 * - 在使用者偏好減少動畫時停用動畫效果
 *
 * [fix:2025-12-26] 修復 ESLint set-state-in-effect 錯誤
 * 參考: [context7:/websites/react_dev_reference:useSyncExternalStore:2025-12-26]
 * 解法: 使用 useSyncExternalStore 訂閱 media query 變化
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
 */

import { useSyncExternalStore } from 'react';

// Media query string
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * 取得目前的 prefers-reduced-motion 狀態
 */
function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * SSR 時的快照（伺服器端返回 false）
 */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * 訂閱 media query 變化
 * @param callback - 當 media query 狀態變化時呼叫
 * @returns 取消訂閱函數
 */
function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {
      /* noop for SSR */
    };
  }

  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

/**
 * 偵測使用者是否偏好減少動畫
 * @returns 是否偏好減少動畫（預設 false，SSR 安全）
 *
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * if (prefersReducedMotion) {
 *   // 使用簡化動畫或無動畫
 * }
 */
export function useReducedMotion(): boolean {
  // [fix:2025-12-26] 使用 useSyncExternalStore 避免 useEffect 中同步 setState
  // 這是 React 18+ 推薦訂閱外部狀態的方式
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
