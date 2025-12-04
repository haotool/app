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
      {/* [fix:2025-12-04] 修正 RWD 問題：
          - 首頁：使用 flex 置中，overflow-hidden 防止意外捲動
          - 其他頁面：允許捲動，確保內容可見
          - 使用 dvh 單位適配 iOS Safari 動態視窗高度
      */}
      <div
        className={`min-h-[100dvh] bg-stone-100 ${
          isHomePage
            ? 'flex flex-col h-[100dvh] overflow-hidden' // 首頁固定高度，禁止捲動
            : 'h-auto overflow-y-auto overflow-x-hidden' // 其他頁面可捲動
        }`}
      >
        <Outlet />
      </div>
    </HelmetProvider>
  );
}

export default Layout;
