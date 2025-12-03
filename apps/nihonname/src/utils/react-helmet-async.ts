/**
 * ESM wrapper for react-helmet-async
 * [SSR-fix:2025-12-03] Bridge CommonJS/ESM compatibility for Vite 7 SSR
 */
import * as ReactHelmetAsync from 'react-helmet-async';

// Type-safe re-exports
export const Helmet = ReactHelmetAsync.Helmet;
export const HelmetProvider = ReactHelmetAsync.HelmetProvider;
