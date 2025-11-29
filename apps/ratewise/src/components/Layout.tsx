/**
 * Layout Component with ErrorBoundary + HelmetProvider + UpdatePrompt
 *
 * [SSR-fix:2025-11-26] 從 routes.tsx 分離以解決 Fast Refresh 警告
 * 依據：eslint-plugin-react-refresh (只導出組件的文件才能 Fast Refresh)
 */

import React from 'react';
// [SSR-fix:2025-11-26] Use ESM wrapper to bridge CommonJS/ESM compatibility
// Direct imports from 'react-helmet-async' fail in Vite 7 dev mode SSR
import { HelmetProvider } from '../utils/react-helmet-async';
import { ErrorBoundary } from './ErrorBoundary';
import { SkeletonLoader } from './SkeletonLoader';

export function Layout({ children }: { children: React.ReactNode }) {
  // [SSR-fix:2025-11-26] Check if running in browser (client-side)
  const isBrowser = typeof window !== 'undefined';
  const [UpdatePrompt, setUpdatePrompt] = React.useState<React.ComponentType | null>(null);

  // [SSR-fix:2025-11-26] Dynamically import UpdatePrompt only on client-side
  // This prevents workbox-window from being loaded during SSR
  React.useEffect(() => {
    if (isBrowser) {
      import('./UpdatePrompt')
        .then((module) => setUpdatePrompt(() => module.UpdatePrompt))
        .catch((err) => console.error('Failed to load UpdatePrompt:', err));
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
      <HelmetProvider>
        <ErrorBoundary>
          <main role="main" className="min-h-screen">
            {/* [SEO Fix 2025-11-26] 移除 Layout 的 sr-only H1，讓各頁面自定義語義 H1
                依據：[Google SEO Guidelines] 每頁應有唯一的語義 H1
                參考：[Context7:vite-react-ssg] Head component best practices */}
            <React.Suspense fallback={<SkeletonLoader />}>{children}</React.Suspense>
          </main>
        </ErrorBoundary>
        {/* PWA 更新通知 - 只在客戶端動態載入（避免 SSR 時 workbox-window 錯誤） */}
        {UpdatePrompt && <UpdatePrompt />}
      </HelmetProvider>
    </React.StrictMode>
  );
}

export default Layout;
