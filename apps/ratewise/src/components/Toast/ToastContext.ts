/**
 * Toast Context - 共享狀態管理
 *
 * [2026-01-04] 從 Toast.tsx 拆分以符合 react-refresh/only-export-components 規則
 */

import { createContext } from 'react';

// Toast 類型定義
export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// 創建 Context
export const ToastContext = createContext<ToastContextValue | null>(null);
