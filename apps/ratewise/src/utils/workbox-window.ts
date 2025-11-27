/**
 * ESM Wrapper for workbox-window
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
import * as WorkboxWindow from 'workbox-window';

// Re-export named exports (works in both modes)
// Note: Only export what actually exists in workbox-window
export const Workbox = WorkboxWindow.Workbox;
export const messageSW = WorkboxWindow.messageSW;

// Default export for convenience
export default WorkboxWindow;
