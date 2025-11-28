/**
 * ESM Wrapper for react-helmet-async
 *
 * [SSR-fix:2025-11-26] Bridge CommonJS/ESM compatibility issue in Vite 7
 *
 * Problem:
 * - Dev mode SSR: Vite 7 module runner cannot handle CommonJS named exports
 * - Production build: Rollup requires proper ESM named exports
 *
 * Solution:
 * Use namespace import (* as) which works in both CommonJS and ESM:
 * - CommonJS: `* as` imports the entire module object
 * - ESM: `* as` creates a namespace object with named exports
 *
 * Reference: [Context7:vitejs/vite:2025-11-26] SSR CommonJS Compatibility
 */

// Use namespace import for compatibility with both CommonJS and ESM
import * as HelmetAsync from 'react-helmet-async';

// Re-export named exports (works in both modes)
export const Helmet = HelmetAsync.Helmet;
export const HelmetProvider = HelmetAsync.HelmetProvider;
export const HelmetData = HelmetAsync.HelmetData;

// Default export for convenience
export default HelmetAsync;
