/**
 * SEO Head wrapper for vite-react-ssg
 * [fix:2025-12-06] 改用 vite-react-ssg 原生 Head 組件以支援 SSG JSON-LD 注入
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-06]
 *
 * vite-react-ssg 提供專為 SSG 設計的 Head 組件，確保：
 * - Script tags (包含 JSON-LD) 在 SSG build 時正確渲染
 * - 無 hydration mismatch 錯誤
 * - 更好的效能（無 client-side injection 負擔）
 * - 完全的 SSG 相容性
 */
import { Head } from 'vite-react-ssg';
import { HelmetProvider as ReactHelmetProvider } from 'react-helmet-async';
import type { PropsWithChildren } from 'react';

// Type-safe re-export - 保持 API 相容性
export const Helmet = Head;

/**
 * HelmetProvider - 在測試環境中需要使用 react-helmet-async 的 Provider
 * vite-react-ssg 內部使用 react-helmet-async，但在測試環境中我們需要手動提供 Provider
 * [context7:/staylor/react-helmet-async:2025-12-06]
 */
export function HelmetProvider({ children }: PropsWithChildren) {
  return <ReactHelmetProvider>{children}</ReactHelmetProvider>;
}
