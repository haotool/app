import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UpdatePrompt } from './components/UpdatePrompt';
import { SkeletonLoader } from './components/SkeletonLoader';
import { useUrlNormalization } from './hooks/useUrlNormalization';
import CurrencyConverter from './features/ratewise/RateWise';

// Lazy load FAQ and About pages to reduce initial bundle
const FAQ = lazy(() => import('./pages/FAQ'));
const About = lazy(() => import('./pages/About'));
const ColorSchemeComparison = lazy(() => import('./pages/ColorSchemeComparison'));
const USDToTWD = lazy(() => import('./pages/USDToTWD'));
// [SEO Fix 2025-11-25 Phase 2A-2] Lazy load 404 page with noindex SEO
const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * URL 標準化組件
 * 必須在 Router 內部使用，負責自動重定向大寫 URL 到小寫版本
 */
function UrlNormalizer({ children }: { children: React.ReactNode }) {
  // [SEO:2025-12-01] 自動處理 URL 標準化（大寫轉小寫）
  // 修復重複內容問題，集中 PageRank 權重
  // 參考：docs/dev/SEO_DEEP_AUDIT_2025-12-01.md
  useUrlNormalization();
  return <>{children}</>;
}

function App() {
  // 與 Vite base 設定同步，避免 FAQ / About 在不同部署路徑出現空白頁
  const rawBaseUrl = import.meta.env.BASE_URL || '/';
  const basename = rawBaseUrl === '/' ? '/' : rawBaseUrl.replace(/\/+$/, '');

  // 標記應用已完全載入，供 E2E 測試使用
  // [E2E-fix:2025-10-25] 添加明確的載入完成信號
  useEffect(() => {
    document.body.dataset['appReady'] = 'true';
  }, []);

  return (
    <ErrorBoundary>
      {/* [SEO Fix 2025-11-25 Phase 2A]
          移除全域 SEOHelmet，避免與子頁面 meta tags 衝突

          SEO 策略：
          - 首頁 (/): 使用 index.html 靜態 meta tags（Google/AI 爬蟲立即讀取）
          - FAQ (/faq): 使用 FAQ.tsx 的 SEOHelmet（頁面專用 meta tags）
          - About (/about): 使用 About.tsx 的 SEOHelmet（頁面專用 meta tags）
          - 404 (*): 使用 NotFound.tsx 的 SEOHelmet（noindex）

          參考：fix/seo-phase2a-bdd-approach
          依據：[SEO 審查報告 2025-11-25] Meta Tags 重複衝突 Critical 問題
      */}
      {/* [React Router v7] future flags 已成為默認行為，無需再指定 */}
      <Router basename={basename}>
        <UrlNormalizer>
          <main role="main" className="min-h-screen">
            {/* [SEO Fix 2025-11-26] 移除 sr-only H1，讓各頁面自定義語義 H1
              依據：[Google SEO Guidelines] 每頁應有唯一的語義 H1
              參考：[Context7:vite-react-ssg] Head component best practices */}
            <Suspense fallback={<SkeletonLoader />}>
              <Routes>
                <Route path="/" element={<CurrencyConverter />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/about" element={<About />} />
                <Route path="/usd-twd" element={<USDToTWD />} />
                <Route path="/color-scheme" element={<ColorSchemeComparison />} />
                {/* [SEO Fix 2025-11-25 Phase 2A-2] Catch-all 404 route with noindex */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </UrlNormalizer>
      </Router>
      {/* PWA 更新通知 - 品牌對齊風格 */}
      <UpdatePrompt />
    </ErrorBoundary>
  );
}

export default App;
