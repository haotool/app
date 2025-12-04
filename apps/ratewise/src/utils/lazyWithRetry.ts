/**
 * Lazy loading with retry and auto-refresh for chunk load errors
 *
 * [fix:2025-12-04] 修復 SSG 部署後 chunk 載入失敗導致的 JSON 解析錯誤
 * 問題: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
 *
 * 根因:
 * 1. 部署新版本後，舊的 chunk hash 變化，用戶快取的舊 HTML 嘗試載入不存在的 chunk
 * 2. 服務器返回 HTML 404 頁面，前端嘗試將其解析為 JS 模組
 * 3. Service Worker 快取了錯誤的響應
 *
 * 解決方案:
 * 1. 檢測 chunk 載入錯誤（ChunkLoadError 或 JSON 解析錯誤）
 * 2. 自動重試載入（最多 3 次）
 * 3. 重試失敗後自動刷新頁面（清除快取）
 *
 * @see https://web.dev/articles/service-worker-lifecycle
 * @see https://reactrouter.com/en/main/guides/code-splitting
 */
import { lazy, type ComponentType } from 'react';
import { logger } from './logger';

// 追蹤已刷新的頁面，避免無限刷新循環
const REFRESH_KEY = 'chunk_load_refresh_timestamp';
const REFRESH_COOLDOWN_MS = 30000; // 30 秒內不重複刷新

/**
 * 檢查是否為 chunk 載入錯誤
 */
function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // 常見的 chunk 載入錯誤模式
  return (
    name.includes('chunkloaderror') ||
    message.includes('loading chunk') ||
    message.includes('failed to fetch dynamically imported module') ||
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
function canSafelyRefresh(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const lastRefresh = sessionStorage.getItem(REFRESH_KEY);
    if (!lastRefresh) return true;

    const lastRefreshTime = parseInt(lastRefresh, 10);
    const now = Date.now();

    return now - lastRefreshTime > REFRESH_COOLDOWN_MS;
  } catch {
    return true; // sessionStorage 不可用時允許刷新
  }
}

/**
 * 標記已刷新
 */
function markRefreshed(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(REFRESH_KEY, Date.now().toString());
  } catch {
    // sessionStorage 不可用時忽略
  }
}

/**
 * 強制刷新頁面並清除 Service Worker 快取
 */
async function forceRefresh(): Promise<void> {
  if (typeof window === 'undefined') return;

  // 嘗試清除 Service Worker 快取
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    } catch {
      // 忽略 SW 清除錯誤
    }
  }

  // 嘗試清除 Cache Storage
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    } catch {
      // 忽略快取清除錯誤
    }
  }

  // 標記已刷新並強制重新載入
  markRefreshed();
  window.location.reload();
}

/**
 * 帶重試機制的 lazy loading
 *
 * @param importFn - 動態 import 函數
 * @param retries - 重試次數（預設 3 次）
 * @param retryDelay - 重試延遲（預設 1000ms）
 * @returns React lazy 組件
 *
 * @example
 * const Home = lazyWithRetry(() => import('./pages/Home'));
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
  retryDelay = 1000,
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // 嘗試載入模組
        const module = await importFn();
        return module;
      } catch (error) {
        lastError = error;

        // 如果不是 chunk 載入錯誤，直接拋出
        if (!isChunkLoadError(error)) {
          throw error;
        }

        // 記錄錯誤
        logger.warn(`Chunk load failed (attempt ${attempt + 1}/${retries + 1})`, {
          error: error instanceof Error ? error.message : String(error),
        });

        // 如果還有重試機會，等待後重試
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    // 所有重試都失敗後，檢查是否可以安全刷新
    if (canSafelyRefresh()) {
      logger.warn('All chunk load retries failed, forcing page refresh');
      await forceRefresh();
    }

    // 如果無法刷新（可能已經刷新過），拋出原始錯誤
    throw lastError;
  });
}

export default lazyWithRetry;
