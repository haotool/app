/**
 * useToast Hook - 在組件中使用 Toast
 *
 * [2026-01-04] 從 Toast.tsx 拆分以符合 react-refresh/only-export-components 規則
 * 參考: [eslint:react-refresh/only-export-components]
 *
 * @example
 * const { showToast } = useToast();
 * showToast('已複製到剪貼簿', 'success');
 */

import { useContext } from 'react';
import { ToastContext, type ToastContextValue } from './ToastContext';

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    // 如果未在 ToastProvider 內使用，提供一個 no-op 實作
    return {
      showToast: () => {
        console.warn('useToast: Toast context not found. Wrap your app in ToastProvider.');
      },
    };
  }
  return context;
}
