/**
 * Toast 模組入口
 *
 * [2026-01-04] 重構：拆分為多個檔案以符合 react-refresh/only-export-components 規則
 *
 * 使用方式：
 * 1. 在 App.tsx 包裝 ToastProvider
 * 2. 在需要的組件中使用 useToast hook
 *
 * @example
 * // App.tsx
 * import { ToastProvider } from './components/Toast';
 * <ToastProvider><App /></ToastProvider>
 *
 * // Component.tsx
 * import { useToast } from './components/Toast';
 * const { showToast } = useToast();
 * showToast('成功!', 'success');
 */

export { ToastProvider } from './ToastProvider';
export { useToast } from './useToast';
export type { ToastType, ToastMessage, ToastContextValue } from './ToastContext';
