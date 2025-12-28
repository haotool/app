/**
 * 地震知識小學堂 - 入口點
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-29]
 */
import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './routes';
import './index.css';

export const createRoot = ViteReactSSG(
  {
    routes,
    basename: import.meta.env.BASE_URL,
    future: {
      v7_normalizeFormMethod: true,
      v7_startTransition: true,
      v7_fetcherPersist: true,
      v7_relativeSplatPath: true,
      v7_skipActionErrorRevalidation: true,
      v7_partialHydration: true,
    },
  },
  () => {
    // 客戶端初始化邏輯
  },
);
