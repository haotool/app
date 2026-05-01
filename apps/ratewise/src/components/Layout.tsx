/**
 * 根佈局元件 — ErrorBoundary + HelmetProvider + 12 月聖誕主題
 *
 * 獨立於 routes.tsx 以確保 Fast Refresh 正常運作
 */

import React from 'react';
// ESM 封裝層：react-helmet-async 在 Vite 8 SSR 下需經相容處理
import { HelmetProvider } from '../utils/react-helmet-async';
import { ErrorBoundary } from './ErrorBoundary';
import { SkeletonLoader } from './SkeletonLoader';
import { Footer } from './Footer';
import { useUrlNormalization } from '../hooks/useUrlNormalization';
import { NonCriticalLazyBoundary } from './NonCriticalLazyBoundary';

const LazyOfflineIndicator = React.lazy(() =>
  import('./OfflineIndicator').then((m) => ({ default: m.OfflineIndicator })),
);
const LazyUpdatePrompt = React.lazy(() =>
  import('./UpdatePrompt').then((m) => ({ default: m.UpdatePrompt })),
);

const DecemberTheme = React.lazy(() => import('../features/calculator/easter-eggs/DecemberTheme'));

export function Layout({ children }: { children: React.ReactNode }) {
  // 大寫 URL 自動正規化（SEO）。
  useUrlNormalization();

  const isBrowser = typeof window !== 'undefined';
  const isSsg = !isBrowser;
  const [showDecemberTheme, setShowDecemberTheme] = React.useState(false);

  // SSR 端需提供空 context 避免狀態洩漏；客戶端使用預設值
  const helmetContext = isBrowser ? undefined : {};

  React.useEffect(() => {
    if (isBrowser) {
      const isDecember = new Date().getMonth() === 11; // 0-indexed, 11 = December
      setShowDecemberTheme(isDecember);
    }
  }, [isBrowser]);

  // 標記應用已載入完成，供 E2E 測試偵測
  React.useEffect(() => {
    if (isBrowser) {
      document.body.dataset['appReady'] = 'true';
    }
  }, [isBrowser]);

  return (
    <React.StrictMode>
      <HelmetProvider context={helmetContext}>
        <ErrorBoundary>
          <div
            data-scroll-container="layout"
            className="h-dvh min-h-0 overflow-y-auto overflow-x-hidden"
          >
            {/* 主要內容 */}
            <main className="min-h-full [overscroll-behavior-y:contain]">
              {isSsg ? (
                children
              ) : (
                <React.Suspense fallback={<SkeletonLoader />}>{children}</React.Suspense>
              )}
            </main>

            {/* 頁尾 - Stage 6：內部連結結構（僅桌面版顯示） */}
            <div className="hidden md:block">
              <Footer />
            </div>
          </div>
        </ErrorBoundary>

        {/* 全域 PWA/離線狀態提示：延遲載入，不影響首次 LCP */}
        <NonCriticalLazyBoundary>
          <React.Suspense fallback={null}>
            <LazyOfflineIndicator />
            <LazyUpdatePrompt />
          </React.Suspense>
        </NonCriticalLazyBoundary>

        {/* 12 月聖誕主題（動態載入） */}
        {showDecemberTheme && (
          <React.Suspense fallback={null}>
            <DecemberTheme />
          </React.Suspense>
        )}
      </HelmetProvider>
    </React.StrictMode>
  );
}

export default Layout;
