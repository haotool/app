import type { ConverterMode } from '../types';

/**
 * 冷啟動單次還原旗標。
 * 僅在整個 page load 中嘗試還原一次；之後的 in-app route 重新掛載不再自動導向，
 * 避免使用者手動切回單幣別時被彈回多幣別。
 */
let hasAttemptedRestore = false;

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
    params.lastConverterView === 'multi'
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
