/**
 * 帶重試與自動刷新機制的 lazy 載入
 *
 * 用途：
 * - 部署後避免舊快取造成 chunk 載入失敗
 * - 偵測 ChunkLoadError 與 JSON 解析失敗
 * - 指數退避重試（預設 3 次）
 * - 最後觸發完整刷新流程
 *
 * 參考：
 * - https://web.dev/articles/service-worker-lifecycle
 * - https://reactrouter.com/en/main/guides/code-splitting
 */
import { lazy, type ComponentType } from 'react';
import { logger } from './logger';
import { isChunkLoadError, recoverFromChunkLoadError } from './chunkLoadRecovery';

/**
 * 帶重試機制的 lazy 載入
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
    await recoverFromChunkLoadError();

    // 如果無法刷新（可能已經刷新過），拋出原始錯誤
    throw lastError;
  });
}

export default lazyWithRetry;
