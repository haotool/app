/**
 * Quake-School Main Entry
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
 *
 * 使用 ViteReactSSG 實現靜態站點生成
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './routes';
import './index.css';

export const createRoot = ViteReactSSG(
  {
    routes,
    basename: import.meta.env.BASE_URL,
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  },
  ({ isClient }) => {
    if (isClient) {
      // 客戶端初始化邏輯
      console.log('[Quake-School] Client initialized');
    }
  },
);
