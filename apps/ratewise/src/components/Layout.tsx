/**
 * 根佈局元件 — ErrorBoundary + HelmetProvider + 12 月聖誕主題
 *
 * 獨立於 routes.tsx 以確保 Fast Refresh 正常運作
 */

import React from 'react';
// ESM 封裝層：react-helmet-async 在 Vite 7 SSR 下需經相容處理
import { HelmetProvider } from '../utils/react-helmet-async';
import { RouteAnalytics } from '@shared/analytics';
import { ErrorBoundary } from './ErrorBoundary';
import { SkeletonLoader } from './SkeletonLoader';
import { Footer } from './Footer';
import { OfflineIndicator } from './OfflineIndicator';
import { UpdatePrompt } from './UpdatePrompt';

const DecemberTheme = React.lazy(() => import('../features/calculator/easter-eggs/DecemberTheme'));

export function Layout({ children }: { children: React.ReactNode }) {
  const isBrowser = typeof window !== 'undefined';
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
      {/* SEO 落地頁間的 SPA 路由切換追蹤 */}
      <RouteAnalytics />
      <HelmetProvider context={helmetContext}>
        <ErrorBoundary>
          <div
            data-scroll-container="layout"
            className="h-dvh min-h-0 overflow-y-auto overflow-x-hidden"
          >
            {/* 主要內容 */}
            <main className="min-h-full [overscroll-behavior-y:contain]">
              <React.Suspense fallback={<SkeletonLoader />}>{children}</React.Suspense>
            </main>

            {/* 頁尾 - Stage 6：內部連結結構（僅桌面版顯示） */}
            <div className="hidden md:block">
              <Footer />
            </div>
          </div>
        </ErrorBoundary>

        {/* 全域 PWA/離線狀態提示 */}
        <OfflineIndicator />
        <UpdatePrompt />

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
