/**
 * Park-Keeper Application Entry Point for vite-react-ssg
 */
import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './routes';
import './services/i18n';
import './index.css';

export const createRoot = ViteReactSSG({ routes });
