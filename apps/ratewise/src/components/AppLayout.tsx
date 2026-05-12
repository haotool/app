/** AppLayout：整合頁首、導覽與內容區，並處理頁面切換動畫。 */

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNavigation } from './BottomNavigation';
import { SideNavigation } from './SideNavigation';
import { ToastProvider } from './Toast';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';
import { useRatingPrompt } from '../hooks/useRatingPrompt';
import { getResolvedLanguage } from '../i18n';
import { APP_INFO } from '../config/app-info';
import { HOMEPAGE_SEO } from '../config/seo-metadata';
import { navigationTokens } from '../config/design-tokens';
import { getTopLevelTransitionDirection } from '../config/animations';
import { RouteAnalytics } from '@shared/analytics';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { performFullRefresh } from '../utils/swUtils';
import { useUrlNormalization } from '../hooks/useUrlNormalization';
import { NonCriticalLazyBoundary } from './NonCriticalLazyBoundary';
import { PwaAppReadyBeacon } from './PwaAppReadyBeacon';

function AppLazyGlobalPrompts({
  attempt,
  ratingPrompt,
}: {
  attempt: number;
  ratingPrompt: ReturnType<typeof useRatingPrompt>;
}) {
  // 延遲載入非首屏提示元件，避免把 motion/react 提前拉進 app shell。
  const LazyOfflineIndicator = React.useMemo(() => {
    void attempt;
    return React.lazy(() =>
      import('./OfflineIndicator').then((m) => ({ default: m.OfflineIndicator })),
    );
  }, [attempt]);
  const LazyUpdatePrompt = React.useMemo(() => {
    void attempt;
    return React.lazy(() => import('./UpdatePrompt').then((m) => ({ default: m.UpdatePrompt })));
  }, [attempt]);
  const LazyRatingModal = React.useMemo(() => {
    void attempt;
    return React.lazy(() => import('./RatingModal').then((m) => ({ default: m.RatingModal })));
  }, [attempt]);

  return (
    <React.Suspense fallback={null}>
      <LazyOfflineIndicator />
      <LazyUpdatePrompt />
      <LazyRatingModal {...ratingPrompt} />
    </React.Suspense>
  );
}

/** Logo 組件 */
function Logo() {
  const basePath = import.meta.env.BASE_URL || '/';

  return (
    <picture>
      <source srcSet={`${basePath}logo.webp`} type="image/webp" />
      <img
        src={`${basePath}logo.png`}
        alt={APP_INFO.name}
        width={28}
        height={28}
        className="w-7 h-7 shrink-0"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
    </picture>
  );
}

/** Header：行動版頁首，並避免 SSR hydration 語系不一致。 */
function Header() {
  const { t } = useTranslation();

  // 先用固定語系渲染，hydrate 後再切換到實際語系。
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  const currentLanguage = isHydrated ? getResolvedLanguage() : 'zh-TW';
  const isZhTW = currentLanguage === 'zh-TW';

  return (
    <header
      className="
        px-4 z-30 shrink-0
        bg-background/80 backdrop-blur-xl
        border-b border-black/[0.03]
        flex items-center
      "
      style={{
        height: navigationTokens.header.heightWithSafeArea,
        paddingTop: navigationTokens.safeArea.top,
      }}
    >
      <div className="flex justify-between items-center max-w-md mx-auto w-full">
        {/* 品牌 Logo + 標題（使用 span 而非 h1，避免每頁重複 h1）*/}
        <div className="flex items-center gap-1.5">
          <Logo />
          <span
            data-testid="app-title"
            className="
              text-lg font-black tracking-tight
              bg-clip-text text-transparent
              bg-gradient-to-r from-[rgb(var(--color-title-gradient-from))] to-[rgb(var(--color-title-gradient-to))]
              [-webkit-background-clip:text]
            "
          >
            {isZhTW ? APP_INFO.name : t('app.title')}
          </span>
        </div>
      </div>
    </header>
  );
}

/**
 * 主應用佈局：含安全區域、響應式導覽與進場動畫。
 *
 * 使用 enter-only 動畫（無 exit），避免 mode="wait" 造成的空白閃爍。
 * 此為 iOS/Android tab bar 切換的業界標準做法。
 */
export function AppLayout() {
  // 大寫 URL 自動正規化（SEO）。
  useUrlNormalization();

  const ratingPrompt = useRatingPrompt();

  const location = useLocation();
  const [hasMounted, setHasMounted] = React.useState(false);
  const [pageTransitionState, setPageTransitionState] = React.useState({
    currentPathname: location.pathname,
    previousPathname: location.pathname,
    direction: 0,
  });
  const mainRef = React.useRef<HTMLElement>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const { pullDistance, isRefreshing, canTrigger } = usePullToRefresh(mainRef, performFullRefresh);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  // 修正 WebView（Threads、Instagram 等）與一般瀏覽器的視口高度擠壓問題。
  // `100dvh` 在 WebView 內可能包含宿主 App 的 UI（頂/底導覽列），
  // 導致內容被壓縮。改用 `window.innerHeight`（JS 實際可用高度）寫入
  // `--app-height` CSS 變量，確保所有環境顯示一致。
  React.useEffect(() => {
    const setAppHeight = () => {
      // visualViewport.height 較 window.innerHeight 更精確（會扣除虛擬鍵盤）。
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${h}px`);
    };

    setAppHeight();

    // visualViewport resize 事件捕捉鍵盤彈出/收起與 WebView 高度變化。
    const vp = window.visualViewport;
    if (vp) {
      vp.addEventListener('resize', setAppHeight);
      return () => vp.removeEventListener('resize', setAppHeight);
    }
    window.addEventListener('resize', setAppHeight);
    return () => window.removeEventListener('resize', setAppHeight);
  }, []);

  let transitionForRender = pageTransitionState;
  if (pageTransitionState.currentPathname !== location.pathname) {
    transitionForRender = {
      currentPathname: location.pathname,
      previousPathname: pageTransitionState.currentPathname,
      direction: getTopLevelTransitionDirection(
        pageTransitionState.currentPathname,
        location.pathname,
      ),
    };
    setPageTransitionState(transitionForRender);
  }

  const direction = transitionForRender.direction;
  const disableInitialAnimation = prefersReducedMotion || !hasMounted;
  const shouldAnimatePageEnter = !disableInitialAnimation && direction !== 0;

  return (
    <ToastProvider>
      <PwaAppReadyBeacon />
      {/* SPA 路由變更時送出 GA4 page_view */}
      <RouteAnalytics />
      {/* 根容器：固定視口高度，啟用 flex 滾動
       * 使用 --app-height（由 JS 設定）而非 100dvh，確保 WebView 環境高度正確。
       * Fallback：100dvh（JS 尚未執行時，或 SSG 初始渲染）。 */}
      <div
        className="w-full flex flex-col font-sans bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] overflow-hidden"
        style={{ height: 'var(--app-height, 100dvh)' }}
      >
        {location.pathname === '/' ? (
          <div className="sr-only">
            <h1 id="homepage-seo-heading">{HOMEPAGE_SEO.content.heading}</h1>
          </div>
        ) : null}

        {/* Desktop sidebar (≥768px) */}
        <div className="flex flex-1 min-h-0 min-w-0">
          <SideNavigation className="hidden md:block" />

          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Header (mobile only) - shrink-0 確保不被壓縮 */}
            <div className="md:hidden shrink-0">
              <Header />
            </div>

            {/* 內容區域 - 支援 iOS Safari 慣性滾動 */}
            <main
              ref={mainRef}
              data-scroll-container="main"
              tabIndex={0}
              className="flex-1 min-h-0 min-w-0 w-full relative overflow-y-auto overflow-x-hidden pb-[calc(56px+env(safe-area-inset-bottom,0px))] md:pb-0 [-webkit-overflow-scrolling:touch] overscroll-y-contain"
            >
              <PullToRefreshIndicator
                pullDistance={pullDistance}
                isRefreshing={isRefreshing}
                canTrigger={canTrigger}
              />
              <RouteErrorBoundary>
                {/* enter-only：key 變化觸發 remount，新頁面從方向滑入淡入（CSS @keyframes） */}
                <div
                  key={location.pathname}
                  data-testid="page-transition"
                  data-transition-direction={direction}
                  data-initial-disabled={shouldAnimatePageEnter ? 'false' : 'true'}
                  className={`min-h-full${shouldAnimatePageEnter ? ' ratewise-page-enter' : ''}`}
                  style={
                    !shouldAnimatePageEnter
                      ? undefined
                      : ({ '--enter-x': `${direction * 8}%` } as React.CSSProperties)
                  }
                >
                  <Outlet />
                </div>
              </RouteErrorBoundary>
            </main>

            {/* Mobile bottom navigation (<768px) */}
            <BottomNavigation />
          </div>
        </div>
      </div>

      {/* 全域 PWA/離線狀態提示：延遲載入，不影響首次 LCP */}
      <NonCriticalLazyBoundary resetKey={location.pathname}>
        {(attempt) => <AppLazyGlobalPrompts attempt={attempt} ratingPrompt={ratingPrompt} />}
      </NonCriticalLazyBoundary>
    </ToastProvider>
  );
}
