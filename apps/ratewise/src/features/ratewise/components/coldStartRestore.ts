import type { ConverterMode } from '../types';
import { MULTI_CONVERTER_MODE } from '../constants';

/**
 * 冷啟動單次還原旗標。
 * 僅在整個 page load 中嘗試還原一次；之後的 in-app route 重新掛載不再自動導向，
 * 避免使用者手動切回單幣別時被彈回多幣別。
 *
 * 若冷啟動 URL 不是首頁（例如直接開啟 /multi），RememberedHomeRoute 不會掛載，
 * 導致 hasAttemptedRestore 維持 false；之後 in-app 導向首頁時會錯誤觸發 redirect。
 * 為防止此情況，模組初始化時若偵測到非首頁冷啟動即預先標記已嘗試還原。
 */
let hasAttemptedRestore = false;

// 非首頁冷啟動預標記：BASE_URL 為首頁路徑（如 '/ratewise/'），
// 若目前 pathname 不符則代表從子路由冷啟動，不應在後續進入首頁時觸發 redirect。
if (typeof window !== 'undefined') {
  const base = import.meta.env.BASE_URL ?? '/';
  const path = window.location.pathname;
  const isHomeColdStart = path === base || path === base.replace(/\/$/, '') || path === '/';
  if (!isHomeColdStart) {
    hasAttemptedRestore = true;
  }
}

/**
 * 判斷冷啟動是否應還原至多幣別頁（純讀取，不改旗標）。
 * 須等 persist hydrate 完成、無 deep-link 參數，且上次停留為 multi 才還原。
 */
export function shouldRestoreToMulti(params: {
  hydrated: boolean;
  hasDeepLink: boolean;
  lastConverterView: ConverterMode;
}): boolean {
  return (
    params.hydrated &&
    !hasAttemptedRestore &&
    !params.hasDeepLink &&
    params.lastConverterView === MULTI_CONVERTER_MODE
  );
}

/** 標記冷啟動還原已嘗試；須於 effect 中呼叫，避免 render 期間產生副作用。 */
export function markRestoreAttempted(): void {
  hasAttemptedRestore = true;
}

/** 僅供單元測試重置冷啟動還原旗標。 */
export function __resetColdStartRestoreForTests(): void {
  hasAttemptedRestore = false;
}
