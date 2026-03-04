import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageview } from './ga';

/**
 * SPA 路由變更追蹤元件。
 *
 * 置於 react-router Router 根節點內；初始 mount 跳過，
 * 避免與 main.tsx isClient 區塊的手動 trackPageview 重複計算。
 * 回傳 null，無 DOM 輸出。
 */
export function RouteAnalytics(): null {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    trackPageview(location.pathname + location.search);
  }, [location]);

  return null;
}
