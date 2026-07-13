/**
 * Application Entry Point for vite-react-ssg
 */
import { ViteReactSSG } from 'vite-react-ssg';
import routes from './routes';
import './index.css';

export const createRoot = ViteReactSSG({ routes }, () => {
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(`HaoTool v${__APP_VERSION__}`);
  }
});
