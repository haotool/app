/**
 * 全站共用 Layout：SkipLink + Header + main + Footer。
 * LazyMotion（async features）+ m 元件按需載入；MotionConfig reducedMotion="user"
 * 統一將 transform 動畫降級為僅 opacity（deep-dive §1.4 編排硬規則）。
 */
import { useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { LazyMotion, MotionConfig } from 'motion/react';
import Header from './Header';
import Footer from './Footer';

const loadMotionFeatures = () => import('./motion-features').then((module) => module.default);

// S1 時間軸總長 815ms（motion-deep-dive §2 S1）；取 900ms 上限值含緩衝。
const INTRO_CLEANUP_MS = 900;

export default function Layout() {
  // S1 為單次開場：動畫結束後移除觸發條件，SPA 返回首頁不重播、不與 View Transition 疊加。
  // 動畫自 CSS 到達即開播、本 effect 於 hydration 後起算，timeout 必然晚於時間軸結束；
  // 硬重整的新 session 判定仍由 index.html sessionStorage 閘負責，不受本清理影響。
  useEffect(() => {
    if (document.documentElement.dataset['intro'] !== '1') return undefined;
    const timer = window.setTimeout(() => {
      document.documentElement.removeAttribute('data-intro');
    }, INTRO_CLEANUP_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <div className="flex min-h-screen flex-col">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-0 focus:top-0 focus:z-(--z-toast) focus:rounded-br-input focus:bg-text focus:px-4 focus:py-2.5 focus:text-sm focus:text-white"
          >
            跳至主內容
          </a>
          <Header />
          <main id="main-content" className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        {/* React Router v6 官方捲動治理：SPA 導航含 hash 時捲至錨點（lazy route 於導航
            完成前已 resolve），其餘新頁面捲回頂部、back/forward 還原位置。
            scrollIntoView 尊重錨點的 scroll-margin-top（80px），instant 捲動天然符合
            prefers-reduced-motion。 */}
        <ScrollRestoration />
      </MotionConfig>
    </LazyMotion>
  );
}
