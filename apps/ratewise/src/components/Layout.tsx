/**
 * Layout Component with ErrorBoundary + HelmetProvider + UpdatePrompt + DecemberTheme
 *
 * [SSR-fix:2025-11-26] 從 routes.tsx 分離以解決 Fast Refresh 警告
 * 依據：eslint-plugin-react-refresh (只導出組件的文件才能 Fast Refresh)
 *
 * [December-Theme:2025-12-26] 新增 12 月聖誕主題常駐效果
 * - 自動偵測 12 月並顯示下雪動畫和聖誕裝飾
 * - 使用 React.lazy 動態載入，不影響 SEO 和效能
 */

import React from 'react';
// [SSR-fix:2025-11-26] Use ESM wrapper to bridge CommonJS/ESM compatibility
// Direct imports from 'react-helmet-async' fail in Vite 7 dev mode SSR
import { HelmetProvider } from '../utils/react-helmet-async';
import { ErrorBoundary } from './ErrorBoundary';
import { SkeletonLoader } from './SkeletonLoader';
import { Footer } from './Footer';

// [December-Theme:2025-12-26] 動態載入 12 月主題組件（Lazy Loading）
const DecemberTheme = React.lazy(() => import('../features/calculator/easter-eggs/DecemberTheme'));

export function Layout({ children }: { children: React.ReactNode }) {
  // [SSR-fix:2025-11-26] Check if running in browser (client-side)
  const isBrowser = typeof window !== 'undefined';
  const [UpdatePrompt, setUpdatePrompt] = React.useState<React.ComponentType | null>(null);
  const [showDecemberTheme, setShowDecemberTheme] = React.useState(false);

  // [SSR-fix:2025-12-03] react-helmet-async 需要在 SSR 時提供 context
  // 參考: [react-helmet-async README](https://github.com/staylor/react-helmet-async#readme)
  // - Server: 為每個請求創建空的 context 對象 {}，避免狀態洩漏
  // - Client: 使用默認 context (undefined)，HelmetProvider 會自動管理
  // 這修復了 React Error #418 Hydration mismatch (FAQ/About 頁面)
  const helmetContext = isBrowser ? undefined : {};

  // [SSR-fix:2025-11-26] Dynamically import UpdatePrompt only on client-side
  // This prevents workbox-window from being loaded during SSR
  React.useEffect(() => {
    if (isBrowser) {
      import('./UpdatePrompt')
        .then((module) => setUpdatePrompt(() => module.UpdatePrompt))
        .catch((err) => console.error('Failed to load UpdatePrompt:', err));
    }
  }, [isBrowser]);

  // [December-Theme:2025-12-26] 偵測 12 月並啟用聖誕主題
  React.useEffect(() => {
    if (isBrowser) {
      const isDecember = new Date().getMonth() === 11; // 0-indexed, 11 = December
      setShowDecemberTheme(isDecember);
    }
  }, [isBrowser]);

  // 標記應用已完全載入,供 E2E 測試使用
  // [E2E-fix:2025-10-25] 添加明確的載入完成信號
  React.useEffect(() => {
    if (isBrowser) {
      document.body.dataset['appReady'] = 'true';
    }
  }, [isBrowser]);

  return (
    <React.StrictMode>
      <HelmetProvider context={helmetContext}>
        <ErrorBoundary>
          {/* Main Content
              [fix:2025-12-27] 新增 overscrollBehaviorY: 'contain' 確保下拉刷新在 PWA 中正常工作
              這個設置防止瀏覽器原生的 overscroll 行為（如 Safari 的彈性滾動）
              參考：[context7:mdn/web/docs:overscroll-behavior:2025-12-27]
          */}
          <main role="main" className="min-h-screen" style={{ overscrollBehaviorY: 'contain' }}>
            {/* [SEO Fix 2025-11-26] 移除 Layout 的 sr-only H1，讓各頁面自定義語義 H1
                依據：[Google SEO Guidelines] 每頁應有唯一的語義 H1
                參考：[Context7:vite-react-ssg] Head component best practices */}
            <React.Suspense fallback={<SkeletonLoader />}>{children}</React.Suspense>
          </main>

          {/* Footer - Stage 6: 內部連結結構 (只在桌面版顯示) */}
          <div className="hidden md:block">
            <Footer />
          </div>
        </ErrorBoundary>
        {/* PWA 更新通知 - 只在客戶端動態載入（避免 SSR 時 workbox-window 錯誤） */}
        {UpdatePrompt && <UpdatePrompt />}

        {/* [December-Theme:2025-12-26] 12 月聖誕主題 - 動態載入 */}
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
