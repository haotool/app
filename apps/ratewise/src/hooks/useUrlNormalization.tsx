/**
 * URL Normalization Hook - React Router Integration
 *
 * [BDD:2025-12-01] 綠燈階段 - React Router 整合
 * [SEO:2025-12-01] 自動重定向大寫 URL 到小寫版本
 *
 * 使用方式：
 * 在 App.tsx 或主要路由組件中調用此 hook
 *
 * @example
 * ```tsx
 * function App() {
 *   useUrlNormalization();
 *   return <RouterProvider router={router} />;
 * }
 * ```
 */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { shouldRedirect, normalizeUrl } from '../middleware/urlNormalization';

/**
 * URL 標準化 Hook
 *
 * 自動檢測並重定向大寫 URL 到小寫版本
 * 使用 window.location.replace 確保不在歷史記錄中留下大寫版本
 */
export function useUrlNormalization(): void {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 檢查當前 URL 是否需要標準化
    if (shouldRedirect(location.pathname)) {
      // 標準化完整 URL（pathname + search + hash）
      const normalizedPathname = normalizeUrl(location.pathname);
      const normalizedSearch = location.search ? normalizeUrl(location.search) : '';
      const normalizedHash = location.hash ? normalizeUrl(location.hash) : '';

      const normalizedUrl = `${normalizedPathname}${normalizedSearch}${normalizedHash}`;

      // 使用 window.location.replace 進行重定向
      // 這樣不會在瀏覽器歷史中留下大寫版本的 URL
      // 對 SEO 更友好，因為爬蟲會直接看到 301 重定向（通過 HTTP 標頭）
      window.location.replace(normalizedUrl);
    }
  }, [location.pathname, location.search, location.hash, navigate]);
}

/**
 * URL 標準化 HOC（Higher-Order Component）
 *
 * 用於包裝需要 URL 標準化的組件
 *
 * @example
 * ```tsx
 * const NormalizedApp = withUrlNormalization(App);
 * ```
 */
export function withUrlNormalization<P extends object>(
  Component: React.ComponentType<P>,
): React.ComponentType<P> {
  return function UrlNormalizedComponent(props: P) {
    useUrlNormalization();
    return <Component {...props} />;
  };
}
