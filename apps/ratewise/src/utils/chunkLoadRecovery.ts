/**
 * Chunk 載入錯誤偵測與恢復流程
 *
 * 用途:
 * - 統一判斷 chunk 載入錯誤訊息
 * - 避免無限刷新循環
 * - 溫和恢復：套用新版 SW 後整頁重載，絕不清除任何快取
 *
 * chunk 失敗最常見原因是部署後版本更替，正確解法是套用新版 SW 後整頁重載；
 * 清除全部快取會摧毀離線防護、把弱網用戶推向 offline.html。
 */

import { logger } from './logger';
import { recordPwaDiagnostic } from './pwaDiagnostics';
import { forceServiceWorkerUpdate } from './swUtils';

export const CHUNK_REFRESH_KEY = 'chunk_load_refresh_timestamp';
export const CHUNK_REFRESH_COOLDOWN_MS = 30000;

/**
 * 判斷是否為 chunk 載入錯誤
 *
 * Safari 特殊處理：
 * Safari 動態 import 失敗時拋出 TypeError("Load failed")
 * PR #117 移除了過於寬鬆的 "load failed" 匹配（會誤判 API fetch 失敗）
 * 此處改為精確匹配：僅 TypeError + "load failed" 才視為 chunk 錯誤
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Safari 動態 import 失敗: TypeError("Load failed")
  // 僅限 TypeError，避免誤判一般 fetch 錯誤
  if (name === 'typeerror' && message === 'load failed') {
    return true;
  }

  // Chrome: SW setCatchHandler 回傳 Response.error() 時觸發的 TypeError。
  if (name === 'typeerror' && message.includes('response served by service worker is an error')) {
    return true;
  }

  return (
    name.includes('chunkloaderror') ||
    message.includes('loading chunk') ||
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('failed to load module script') ||
    message.includes('unexpected token') ||
    message.includes('<!doctype') ||
    message.includes('is not valid json') ||
    message.includes('syntax error') ||
    message.includes("unexpected token '<'")
  );
}

/**
 * 檢查是否可以安全刷新（避免無限刷新循環）
 */
export function canSafelyRefresh(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const lastRefresh = sessionStorage.getItem(CHUNK_REFRESH_KEY);
    if (!lastRefresh) return true;

    const lastRefreshTime = Number.parseInt(lastRefresh, 10);
    const now = Date.now();

    return now - lastRefreshTime > CHUNK_REFRESH_COOLDOWN_MS;
  } catch {
    return true;
  }
}

/**
 * 標記已刷新
 */
export function markChunkRefreshed(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(CHUNK_REFRESH_KEY, Date.now().toString());
  } catch {
    // sessionStorage 不可用時忽略
  }
}

/**
 * 觸發溫和恢復流程：套用新版 SW（若有）後整頁重載，不清除任何快取。
 */
export async function recoverFromChunkLoadError(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 離線時重載只會回到 shell 首頁、無法取得 chunk：交由呼叫端顯示離線 UI，
  // 待 online 事件自動重試（不消耗 cooldown）。
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    recordPwaDiagnostic('chunk-load-refresh-skipped-offline', undefined, 'warn');
    return false;
  }

  if (!canSafelyRefresh()) {
    recordPwaDiagnostic('chunk-load-refresh-blocked', undefined, 'warn');
    return false;
  }

  logger.warn('Chunk load retries exhausted, applying SW update and reloading');
  recordPwaDiagnostic('chunk-load-refresh-triggered');
  markChunkRefreshed();
  await forceServiceWorkerUpdate();
  // 有 waiting SW 時由 controllerchange 觸發重載（新 SW 接管後才載頁，避免再拿到舊 shell）；
  // 延遲兜底重載涵蓋無 waiting SW 的情境，若 controllerchange 先重載則此計時器隨頁面卸載消失。
  setTimeout(() => {
    window.location.reload();
  }, 600);
  return true;
}
