/**
 * Vite React SSG Entry Point for NihonName
 * [context7:daydreamer-riri/vite-react-ssg:2025-12-03]
 */
import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './routes';
import './index.css';

// Application version from build
const appVersion: string =
  typeof import.meta.env['VITE_APP_VERSION'] === 'string'
    ? import.meta.env['VITE_APP_VERSION']
    : '1.0.0';
const buildTime: string =
  typeof import.meta.env['VITE_BUILD_TIME'] === 'string'
    ? import.meta.env['VITE_BUILD_TIME']
    : new Date().toISOString();

// Vite React SSG Configuration
export const createRoot = ViteReactSSG(
  {
    routes,
    basename: import.meta.env.BASE_URL || '/',
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  },
  ({ isClient }) => {
    // Client-side initialization
    if (isClient) {
      console.log('[NihonName] Application mounted', {
        version: appVersion,
        buildTime,
        mode: import.meta.env.MODE,
      });

      // Global error handler
      window.addEventListener('unhandledrejection', (event) => {
        const reason: unknown = event.reason;
        let errorMessage = '';

        if (reason instanceof Error) {
          errorMessage = reason.message;
        } else if (typeof reason === 'string') {
          errorMessage = reason;
        } else if (reason && typeof reason === 'object' && 'message' in reason) {
          const msg = (reason as { message: unknown }).message;
          errorMessage = typeof msg === 'string' ? msg : JSON.stringify(reason);
        }

        console.warn('[NihonName] Unhandled rejection:', errorMessage);
      });
    } else {
      // Server-side rendering
      console.log('[NihonName] Generating static HTML', {
        version: appVersion,
        buildTime,
      });
    }
  },
);
