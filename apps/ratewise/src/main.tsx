import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';
import { logger } from './utils/logger';
import { initSentry } from './utils/sentry';
import { initWebVitals } from './utils/webVitals';

// 全域錯誤處理器 - 捕捉網路請求錯誤
// [context7:googlechrome/lighthouse-ci:2025-10-20T04:10:04+08:00]
// 主要用於處理歷史匯率 404 錯誤（正常現象，資料可能尚未生成）
window.addEventListener('unhandledrejection', (event) => {
  // 安全地提取錯誤訊息
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

  // 檢查是否為歷史匯率相關的網路錯誤
  const isHistoricalRates404 =
    errorMessage.includes('history') ||
    errorMessage.includes('404') ||
    errorMessage.includes('Failed to fetch');

  if (isHistoricalRates404) {
    // 這是預期的錯誤（歷史資料可能尚未生成），阻止顯示在 console
    logger.debug('Historical data fetch failed (expected)', {
      reason: errorMessage,
    });
    event.preventDefault(); // 防止錯誤顯示在瀏覽器 console
  } else {
    // 其他未處理的錯誤記錄但不阻止
    logger.error(
      'Unhandled promise rejection',
      reason instanceof Error ? reason : new Error(errorMessage),
    );
  }
});

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

// Service Worker 註冊由 UpdatePrompt 組件處理
