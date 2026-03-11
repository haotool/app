/**
 * Chunk 載入錯誤偵測與恢復流程
 *
 * 用途:
 * - 統一判斷 chunk 載入錯誤訊息
 * - 避免無限刷新循環
 * - 簡單 reload 讓 SW 從 precache 提供新版本資源（不清除 precache）
 */

import { logger } from './logger';

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
 * Chunk 載入錯誤恢復：簡單重載，保留 precache 讓離線功能不中斷。
 *
 * 版本撕裂場景（最常見）：舊 HTML 引用舊 chunk URL，新 SW precache 只有新 chunk。
 * 解法：reload → NetworkFirst 取新 HTML → 新 chunk URL 存在於 precache → 離線正常。
 * 不應呼叫 performFullRefresh / clearAllServiceWorkerCaches，以免清除 precache 造成二次離線崩潰。
 */
export function recoverFromChunkLoadError(): boolean {
  if (typeof window === 'undefined') return false;
  if (!canSafelyRefresh()) return false;

  logger.warn('Chunk load retries exhausted, reloading page (precache preserved)');
  markChunkRefreshed();
  window.location.reload();
  return true;
}
