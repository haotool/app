/**
 * 啟動頁偏好與顯示決策（SSOT）
 *
 * SplashScreen 元件與設定頁共用：localStorage 偏好、standalone 偵測、
 * 每次載入僅自動顯示一次的旗標。與元件分離以符合 react-refresh 單一元件匯出規範。
 */

/** 設定頁「預覽啟動畫面」使用的自訂事件名稱。 */
export const SPLASH_PREVIEW_EVENT = 'ratewise:splash-preview';

const SPLASH_STORAGE_KEY = 'ratewise-splash-enabled';

/** 每次頁面載入只自動顯示一次（standalone 冷啟動 = 新載入）。 */
let hasAutoShownThisLoad = false;

export function isSplashEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(SPLASH_STORAGE_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setSplashEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SPLASH_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // 儲存失敗時靜默略過（隱私模式等）。
  }
}

/** PWA standalone 偵測：display-mode media query + iOS navigator.standalone。 */
export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** 決策並消耗自動顯示資格：standalone + 偏好開啟 + 本次載入尚未顯示。 */
export function consumeSplashAutoShow(): boolean {
  if (hasAutoShownThisLoad) return false;
  if (!isStandaloneDisplay() || !isSplashEnabled()) return false;
  hasAutoShownThisLoad = true;
  return true;
}

/** 測試專用：重置自動顯示旗標。 */
export function __resetSplashAutoShowForTests(): void {
  hasAutoShownThisLoad = false;
}
