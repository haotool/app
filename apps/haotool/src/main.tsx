/**
 * Application Entry Point for vite-react-ssg
 */
import { ViteReactSSG } from 'vite-react-ssg';
import routes from './routes';
import './index.css';

export const createRoot = ViteReactSSG({ routes }, () => {
  // Client-side initialization
  if (typeof window !== 'undefined') {
    console.log(
      `%c🚀 ${import.meta.env.VITE_APP_NAME || 'haotool.org'} v${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
      'color: #6366f1; font-weight: bold;',
    );
  }
});
