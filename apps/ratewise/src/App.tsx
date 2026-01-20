import { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UpdatePrompt } from './components/UpdatePrompt';
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
// [refactor:2026-01-15] 新增 App 架構頁面
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
          {/* [refactor:2026-01-15] 使用巢狀路由結構
              - AppLayout 提供響應式導覽系統（桌面側邊欄 + 移動底部導覽）
              - 核心功能（/、/multi、/favorites、/settings）使用 AppLayout
              - SEO 落地頁（/faq、/about、/usd-twd 等）保持獨立佈局 */}
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

              {/* [SEO Fix 2025-11-25 Phase 2A-2] Catch-all 404 route with noindex */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </UrlNormalizer>
      </Router>
      {/* PWA 更新通知 - 品牌對齊風格 */}
      <UpdatePrompt />
    </ErrorBoundary>
  );
}

export default App;
