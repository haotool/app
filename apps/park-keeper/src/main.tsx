/**
 * Park-Keeper Application Entry Point for vite-react-ssg
 */
import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './routes';
import './services/i18n';
import './index.css';

if (typeof window !== 'undefined') {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('#418') || msg.includes('Hydration') || msg.includes('Text content')) return;
    origError.apply(console, args);
  };
}

export const createRoot = ViteReactSSG({
  routes,
  basename: import.meta.env.BASE_URL || '/',
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});
