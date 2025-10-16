import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { logger } from './utils/logger';

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
    <App />
  </React.StrictMode>,
);

// Log successful mount
logger.info('Application mounted successfully');
