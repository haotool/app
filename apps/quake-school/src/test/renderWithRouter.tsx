/**
 * renderWithRouter helper function
 * [fix:2026-01-20] 從 RouterWrapper.tsx 分離以修復 react-refresh/only-export-components 警告
 */
import type { ReactElement } from 'react';
import { TestMemoryRouter } from './RouterWrapper';

/**
 * 簡單的 renderWithRouter helper
 * 用於在測試中包裝組件並提供路由上下文
 */
export function renderWithRouter(ui: ReactElement, initialEntries?: string[]): ReactElement {
  return <TestMemoryRouter initialEntries={initialEntries}>{ui}</TestMemoryRouter>;
}
