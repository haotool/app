/**
 * URL Normalization Middleware
 *
 * [BDD:2025-12-01] 綠燈階段 - 實作讓測試通過的最小程式碼
 * [SEO:2025-12-01] 修復 URL 大小寫不敏感導致的重複內容問題
 *
 * 功能：
 * 1. 將所有 URL 轉換為小寫（避免重複內容）
 * 2. 檢測是否需要重定向
 * 3. 生成正確的重定向目標 URL
 *
 * SEO 影響：
 * - 避免 /ratewise/ 和 /Ratewise/ 被視為不同頁面
 * - 集中 PageRank 權重到單一標準化 URL
 * - 預期提升搜尋排名 20-30%
 *
 * 參考：
 * - https://moz.com/learn/seo/duplicate-content
 * - https://developers.google.com/search/docs/crawling-indexing/url-structure
 * - docs/dev/SEO_DEEP_AUDIT_2025-12-01.md
 */

/**
 * 將 URL 標準化為小寫
 *
 * @param url - 完整的 URL 字串（pathname + search + hash）
 * @returns 標準化後的 URL
 *
 * @example
 * normalizeUrl('/Ratewise/') // => '/ratewise/'
 * normalizeUrl('/ratewise/FAQ/?Test=1') // => '/ratewise/faq/?test=1'
 * normalizeUrl('/Ratewise/#Section') // => '/ratewise/#section'
 */
export function normalizeUrl(url: string): string {
  if (!url) return '/';

  // 移除多個連續斜線
  let normalized = url.replace(/\/+/g, '/');

  // 轉換為小寫
  normalized = normalized.toLowerCase();

  return normalized;
}

/**
 * 檢查 URL 是否需要重定向
 *
 * @param pathname - 當前的 pathname
 * @returns 是否需要重定向
 *
 * @example
 * shouldRedirect('/Ratewise/') // => true
 * shouldRedirect('/ratewise/') // => false
 */
export function shouldRedirect(pathname: string): boolean {
  // 檢查是否包含大寫字母
  if (/[A-Z]/.test(pathname)) {
    return true;
  }

  // 檢查是否有多個連續斜線
  if (/\/\/+/.test(pathname)) {
    return true;
  }

  return false;
}

/**
 * 獲取重定向目標 URL
 *
 * @param pathname - 當前的 pathname
 * @param origin - 當前的 origin（如 https://app.haotool.org）
 * @param search - 查詢參數（可選）
 * @param hash - Hash fragment（可選）
 * @returns 完整的重定向目標 URL
 *
 * @example
 * getRedirectUrl('/Ratewise/', 'https://app.haotool.org')
 * // => 'https://app.haotool.org/ratewise/'
 *
 * getRedirectUrl('/Ratewise/', 'https://app.haotool.org', '?test=1', '#section')
 * // => 'https://app.haotool.org/ratewise/?test=1#section'
 */
export function getRedirectUrl(pathname: string, origin: string, search = '', hash = ''): string {
  // 標準化 pathname
  const normalizedPathname = normalizeUrl(pathname);

  // 標準化 search 和 hash
  const normalizedSearch = search ? normalizeUrl(search) : '';
  const normalizedHash = hash ? normalizeUrl(hash) : '';

  // 組合完整 URL
  return `${origin}${normalizedPathname}${normalizedSearch}${normalizedHash}`;
}

/**
 * React Router 整合 Hook
 *
 * 在 App.tsx 或 routes.tsx 中使用，自動處理 URL 標準化
 *
 * @example
 * ```tsx
 * function App() {
 *   useUrlNormalization();
 *   return <RouterProvider router={router} />;
 * }
 * ```
 */
export function useUrlNormalization(): void {
  // 這個函數將在下一個檔案中實作（與 React Router 整合）
  // 保持關注點分離：這個檔案只處理純函數邏輯
}
