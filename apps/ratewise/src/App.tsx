import { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UpdatePrompt } from './components/UpdatePrompt';
import { SkeletonLoader } from './components/SkeletonLoader';
import { useUrlNormalization } from './hooks/useUrlNormalization';
import CurrencyConverter from './features/ratewise/RateWise';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Lazy load pages with retry mechanism
// [fix:2025-12-04] 修復 SSG 部署後 "Unexpected token '<'" 錯誤
const FAQ = lazyWithRetry(() => import('./pages/FAQ'));
const About = lazyWithRetry(() => import('./pages/About'));
const ColorSchemeComparison = lazyWithRetry(() => import('./pages/ColorSchemeComparison'));
const USDToTWD = lazyWithRetry(() => import('./pages/USDToTWD'));
// [SEO Fix 2025-11-25 Phase 2A-2] Lazy load 404 page with noindex SEO
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));

// [December Theme 2025-12-27] Lazy load December theme with snowflakes & Christmas tree
// Only loads during December, automatically hidden other months
const DecemberTheme = lazyWithRetry(() =>
  import('./features/calculator/easter-eggs/DecemberTheme').then((m) => ({
    default: m.DecemberTheme,
  })),
);

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
      {/* [December Theme 2025-12-27] 12 月常駐的聖誕裝飾效果
          - 雪花飄落動畫（8 種精緻 SVG 變體，GPU 加速）
          - 互動式迷你聖誕樹（長按 1 秒可關閉動畫）
          - 自動判斷月份（非 12 月不渲染任何內容）
          - 尊重 prefers-reduced-motion（自動禁用動畫）
          - SSR 安全（useSyncExternalStore + getServerSnapshot）
          參考：/features/calculator/easter-eggs/DecemberTheme.tsx
      */}
      <Suspense fallback={null}>
        <DecemberTheme />
      </Suspense>

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
          <main className="min-h-screen">
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
