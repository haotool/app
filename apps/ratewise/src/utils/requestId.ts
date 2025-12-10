/**
 * Request ID / Correlation ID Utility
 * [2025-12-10] 實作分散式追蹤機制
 *
 * 參考:
 * - [Request ID Tracing Best Practices 2025](https://itnext.io/request-id-tracing-in-node-js-applications-c517c7dab62d)
 * - [Distributed Systems Correlation IDs](https://medium.com/@nynptel/mastering-correlation-ids-enhancing-tracing-and-debugging-in-distributed-systems-602a84e1ded6)
 *
 * 功能:
 * 1. 生成唯一的 Request ID (UUID v4)
 * 2. 跨頁面持久化 (localStorage)
 * 3. 自動加入 API 請求 headers
 * 4. 整合到日誌系統
 */

const REQUEST_ID_KEY = 'x-request-id';

/**
 * Generate UUID v4
 * [2025 Best Practice] 使用 crypto.randomUUID() 如果可用，否則 fallback
 */
export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: 簡單的 UUID v4 實作
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create Request ID
 * 從 localStorage 讀取，如果不存在則生成新的
 */
export function getRequestId(): string {
  if (typeof window === 'undefined') {
    // SSR 環境：每次生成新的
    return generateRequestId();
  }

  try {
    let requestId = localStorage.getItem(REQUEST_ID_KEY);

    if (!requestId) {
      requestId = generateRequestId();
      localStorage.setItem(REQUEST_ID_KEY, requestId);
    }

    return requestId;
  } catch {
    // localStorage 不可用時（隱私模式）
    return generateRequestId();
  }
}

/**
 * Reset Request ID
 * 用於新會話或測試
 */
export function resetRequestId(): string {
  const newId = generateRequestId();

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(REQUEST_ID_KEY, newId);
    } catch {
      // Ignore localStorage errors
    }
  }

  return newId;
}

/**
 * Add Request ID to fetch options
 * [2025 Best Practice] 自動注入 X-Correlation-ID header
 *
 * @example
 * const options = addRequestIdHeader({ method: 'GET' });
 * fetch('/api/data', options);
 */
export function addRequestIdHeader(options: RequestInit = {}): RequestInit {
  const requestId = getRequestId();

  return {
    ...options,
    headers: {
      ...options.headers,
      'X-Correlation-ID': requestId,
      'X-Request-ID': requestId, // 兩個 header 都加入，相容不同後端
    },
  };
}

/**
 * Enhanced fetch with automatic Request ID injection
 * [2025 Best Practice] Wrapper function for all API calls
 *
 * @example
 * const data = await fetchWithRequestId('/api/data');
 */
export async function fetchWithRequestId(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const enhancedInit = addRequestIdHeader(init);
  return fetch(input, enhancedInit);
}
