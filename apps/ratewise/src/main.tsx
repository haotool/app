import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';
import { logger } from './utils/logger';
import { initSentry } from './utils/sentry';
import { initWebVitals } from './utils/webVitals';

// Initialize observability
initSentry();
initWebVitals();

// Log application startup
logger.info('Application starting', {
  environment: import.meta.env.MODE,
  version: '0.0.0',
  timestamp: new Date().toISOString(),
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
);

// Log successful mount
logger.info('Application mounted successfully');

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        logger.info('SW registered', { scope: registration.scope });
      })
      .catch((error: unknown) => {
        logger.error('SW registration failed', error as Error);
      });
  });
}
