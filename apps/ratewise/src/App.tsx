import { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UpdatePrompt } from './components/UpdatePrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SkeletonLoader } from './components/SkeletonLoader';
import { useUrlNormalization } from './hooks/useUrlNormalization';
import { AppLayout } from './components/AppLayout';
import CurrencyConverter from './features/ratewise/RateWise';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Lazy load pages with retry mechanism
const FAQ = lazyWithRetry(() => import('./pages/FAQ'));
const About = lazyWithRetry(() => import('./pages/About'));
const ColorSchemeComparison = lazyWithRetry(() => import('./pages/ColorSchemeComparison'));
const USDToTWD = lazyWithRetry(() => import('./pages/USDToTWD'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const MultiConverter = lazyWithRetry(() => import('./pages/MultiConverter'));
const Favorites = lazyWithRetry(() => import('./pages/Favorites'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));

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
  // Auto-normalize URLs (uppercase to lowercase) for SEO
  // 參考：docs/dev/SEO_DEEP_AUDIT_2025-12-01.md
  useUrlNormalization();
  return <>{children}</>;
}

function App() {
  // 與 Vite base 設定同步，避免 FAQ / About 在不同部署路徑出現空白頁
  const rawBaseUrl = import.meta.env.BASE_URL || '/';
  const basename = rawBaseUrl === '/' ? '/' : rawBaseUrl.replace(/\/+$/, '');

  // Mark application as ready for E2E testing
  useEffect(() => {
    document.body.dataset['appReady'] = 'true';
  }, []);

  return (
    <ErrorBoundary>
      {/* December seasonal theme (auto-hides outside December) */}
      <Suspense fallback={null}>
        <DecemberTheme />
      </Suspense>

      {/* Router with URL normalization for SEO */}
      <Router basename={basename}>
        <UrlNormalizer>
          {/* Nested routes: AppLayout for core pages, standalone for SEO landing pages */}
          <Suspense fallback={<SkeletonLoader />}>
            <Routes>
              {/* 核心 App 路由 - 使用 AppLayout */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<CurrencyConverter />} />
                <Route path="/multi" element={<MultiConverter />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* SEO 落地頁 - 獨立佈局 */}
              <Route path="/faq" element={<FAQ />} />
              <Route path="/about" element={<About />} />
              <Route path="/usd-twd" element={<USDToTWD />} />
              <Route path="/color-scheme" element={<ColorSchemeComparison />} />

              {/* 404 catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </UrlNormalizer>
      </Router>
      {/* 離線模式指示器 - 顯示網路連線狀態 */}
      <OfflineIndicator />
      {/* PWA 更新通知 - 品牌對齊風格 */}
      <UpdatePrompt />
    </ErrorBoundary>
  );
}

export default App;
