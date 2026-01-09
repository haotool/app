/**
 * Test Router Wrapper with v7 future flags
 * [fix:2026-01-09] 消除測試中的 React Router Future Flag 警告
 * [context7:remix-run/react-router:2026-01-09]
 */
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

interface RouterWrapperProps {
  children: ReactNode;
  initialEntries?: string[];
}

/**
 * 用於測試的 MemoryRouter，已啟用 v7 future flags
 */
export function TestMemoryRouter({ children, initialEntries = ['/'] }: RouterWrapperProps) {
  return (
    <MemoryRouter
      initialEntries={initialEntries}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {children}
    </MemoryRouter>
  );
}

/**
 * 簡單的 renderWithRouter helper
 */
export const renderWithRouter = (ui: React.ReactElement, initialEntries?: string[]) => {
  return <TestMemoryRouter initialEntries={initialEntries}>{ui}</TestMemoryRouter>;
};
