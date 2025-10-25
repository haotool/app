import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SEOHelmet } from './components/SEOHelmet';
import { UpdatePrompt } from './components/UpdatePrompt';
import CurrencyConverter from './features/ratewise/RateWise';

// Lazy load FAQ and About pages to reduce initial bundle
const FAQ = lazy(() => import('./pages/FAQ'));
const About = lazy(() => import('./pages/About'));
const ColorSchemeComparison = lazy(() => import('./pages/ColorSchemeComparison'));

function App() {
  // 開發模式使用根路徑，生產環境使用 /ratewise/
  const basename = import.meta.env.DEV ? '/' : '/ratewise';

  // 標記應用已完全載入，供 E2E 測試使用
  // [E2E-fix:2025-10-25] 添加明確的載入完成信號
  useEffect(() => {
    document.body.dataset['appReady'] = 'true';
  }, []);

  return (
    <ErrorBoundary>
      <SEOHelmet />
      <Router basename={basename}>
        <main role="main" className="min-h-screen">
          <h1 className="sr-only">RateWise 匯率轉換器</h1>
          <Suspense
            fallback={
              <div className="flex h-screen items-center justify-center">
                <div className="text-purple-600">載入中...</div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<CurrencyConverter />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/about" element={<About />} />
              <Route path="/color-scheme" element={<ColorSchemeComparison />} />
            </Routes>
          </Suspense>
        </main>
      </Router>
      {/* PWA 更新通知 - 品牌對齊風格 */}
      <UpdatePrompt />
    </ErrorBoundary>
  );
}

export default App;
