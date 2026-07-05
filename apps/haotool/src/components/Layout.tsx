/**
 * 全站共用 Layout：SkipLink + Header + main + Footer。
 * LazyMotion（async features）+ m 元件按需載入；MotionConfig reducedMotion="user"
 * 統一將 transform 動畫降級為僅 opacity（deep-dive §1.4 編排硬規則）。
 */
import { Outlet } from 'react-router-dom';
import { LazyMotion, MotionConfig } from 'motion/react';
import Header from './Header';
import Footer from './Footer';

const loadMotionFeatures = () => import('./motion-features').then((module) => module.default);

export default function Layout() {
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
      </MotionConfig>
    </LazyMotion>
  );
}
