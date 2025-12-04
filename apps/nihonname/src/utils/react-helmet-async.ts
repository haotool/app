/**
 * ESM wrapper for react-helmet
 * [SSR-fix:2025-12-03] Bridge CommonJS/ESM compatibility for Vite 7 SSR
 * [upgrade:2025-12-04] 遷移至 @dr.pogodin/react-helmet 以支援 React 19
 */
import { Helmet as DrHelmet, HelmetProvider as DrHelmetProvider } from '@dr.pogodin/react-helmet';

// Type-safe re-exports - 保持 API 相容性
export const Helmet = DrHelmet;
export const HelmetProvider = DrHelmetProvider;
