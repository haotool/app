/**
 * Network Status Detection Utilities
 *
 * 混合式離線偵測策略：
 * 1. navigator.onLine API - 快速基本檢查
 * 2. 實際網路請求驗證 - fetch HEAD + cache busting
 * 3. 混合式檢測邏輯 - 結合兩者優勢
 *
 * 參考：
 * - [DEV: Is your app online?](https://dev.to/maxmonteil/is-your-app-online-here-s-how-to-reliably-know-in-just-10-lines-of-js-guide-3in7)
 * - [Chrome: Improved PWA Offline Detection](https://developer.chrome.com/blog/improved-pwa-offline-detection)
 * - [MDN: Navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)
 *
 * @created 2026-02-08
 * @version 1.0.0
 */

/**
 * 檢查 navigator.onLine 狀態
 *
 * 注意：navigator.onLine 只能信任 false 表示離線
 * true 可能只是連接到網路，但不代表有實際網路連線
 *
 * @returns true 表示瀏覽器認為在線上，false 表示確定離線
 */
export function checkOnlineStatus(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true; // SSR 環境預設為在線
  }
  return navigator.onLine;
}

/**
 * 實際網路連線驗證（fetch HEAD + cache busting）
 *
 * 發送 HEAD 請求到自己的 origin 驗證實際網路連線
 * 使用隨機 query parameter 防止瀏覽器快取
 *
 * @param timeout - 請求超時時間（毫秒），預設 3000ms（優化為 3 秒以提升響應速度）
 * @returns Promise<boolean> - true 表示有實際網路連線，false 表示無法連線
 */
export async function checkNetworkConnectivity(timeout = 3000): Promise<boolean> {
  if (typeof window === 'undefined') {
    return true; // SSR 環境預設為在線
  }

  try {
    // 建立 AbortController 用於超時控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Cache busting: 使用時間戳作為隨機 query parameter
    const cacheBuster = `t=${Date.now()}`;
    const url = `${window.location.origin}${window.location.pathname}?${cacheBuster}`;

    // 發送 HEAD 請求（最小化頻寬使用）
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store', // 繞過快取
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 檢查回應狀態
    return response.ok;
  } catch {
    // 網路錯誤、超時或其他錯誤都視為離線
    return false;
  }
}

/**
 * 混合式離線偵測（推薦使用）
 *
 * 結合 navigator.onLine 和實際網路請求驗證：
 * 1. 如果 navigator.onLine 為 false，立即返回 false（信任離線狀態）
 * 2. 如果 navigator.onLine 為 true，執行實際網路請求驗證
 *
 * @returns Promise<boolean> - true 表示確定在線，false 表示離線
 */
export async function isOnline(): Promise<boolean> {
  // Step 1: 快速檢查 navigator.onLine
  const basicCheck = checkOnlineStatus();

  // 如果 navigator.onLine 為 false，可以信任（確定離線）
  if (!basicCheck) {
    return false;
  }

  // Step 2: navigator.onLine 為 true 時，進行實際網路驗證
  // 因為 true 可能只是連接到網路，但沒有實際網路連線
  return await checkNetworkConnectivity();
}
