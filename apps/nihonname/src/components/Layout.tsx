/**
 * Layout component for NihonName
 * Provides consistent page structure with SEO defaults
 * [UI/UX 2025-12-03] 垂直置中 + 上下留白設計
 */
import { Outlet, useLocation } from 'react-router-dom';
import { HelmetProvider } from '../utils/react-helmet-async';

export function Layout() {
  const location = useLocation();
  // 首頁（生成器）不需要捲軸，其他頁面需要
  const isHomePage = location.pathname === '/' || location.pathname === '';

  return (
    <HelmetProvider>
      <div
        className={`min-h-[100dvh] bg-stone-100 ${
          isHomePage
            ? 'flex flex-col' // 首頁使用 flex 置中
            : 'overflow-y-auto' // 其他頁面可捲動
        }`}
      >
        <Outlet />
      </div>
    </HelmetProvider>
  );
}

export default Layout;
