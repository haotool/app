import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SEOHelmet } from './components/SEOHelmet';
import { UpdatePrompt } from './components/UpdatePrompt';
import CurrencyConverter from './features/ratewise/RateWise';

// Lazy load FAQ and About pages to reduce initial bundle
const FAQ = lazy(() => import('./pages/FAQ'));
const About = lazy(() => import('./pages/About'));
const ShowcaseIndex = lazy(() => import('./pages/ShowcaseIndex'));
const ShowcaseNotification = lazy(() => import('./pages/ShowcaseNotification'));
const ShowcaseNotificationLight = lazy(() => import('./pages/ShowcaseNotificationLight'));

function App() {
  // 開發模式使用根路徑，生產環境使用 /ratewise/
  const basename = import.meta.env.DEV ? '/' : '/ratewise';

  return (
    <ErrorBoundary>
      <SEOHelmet />
      <Router basename={basename}>
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
            <Route path="/showcase" element={<ShowcaseIndex />} />
            <Route path="/showcase/notification" element={<ShowcaseNotification />} />
            <Route path="/showcase/notification-light" element={<ShowcaseNotificationLight />} />
          </Routes>
        </Suspense>
      </Router>
      {/* PWA 更新通知 - 液態玻璃效果 + 微動畫 */}
      <UpdatePrompt />
    </ErrorBoundary>
  );
}

export default App;
