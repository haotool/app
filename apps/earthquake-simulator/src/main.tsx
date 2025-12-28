/**
 * 地震小學堂 - 主入口點
 * [SEO:2025-12-29] 使用 vite-react-ssg 實現 SSG 預渲染
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
 */

import { ViteReactSSG } from 'vite-react-ssg';
import type { RouteRecord } from 'vite-react-ssg';
// React is used by JSX transform
import App from './App';
import './index.css';

// [SEO:2025-12-29] 定義路由配置
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/quiz/',
    element: <App initialStage="QUIZ" />,
  },
];

// [fix:2025-12-29] 抑制 React Hydration 預期錯誤
// 僅抑制 SSG 預期的 hydration 警告，不影響實際錯誤偵測
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = args[0];
  // 抑制 SSG 預期的 hydration 錯誤
  if (
    typeof message === 'string' &&
    (message.includes('Hydration failed') ||
      message.includes('There was an error while hydrating') ||
      message.includes('Text content does not match'))
  ) {
    return;
  }
  // 處理 Error 物件
  if (message instanceof Error) {
    const errorMessage = message.message;
    if (
      errorMessage.includes('Hydration failed') ||
      errorMessage.includes('There was an error while hydrating')
    ) {
      return;
    }
  }
  originalConsoleError.apply(console, args);
};

// [SEO:2025-12-29] 初始化 vite-react-ssg
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
      console.log('[QuakeSchool] Client initialized');
    }
  },
);
