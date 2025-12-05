/**
 * Test Router Wrapper with v7 future flags
 * [fix:2025-12-06] 消除測試中的 React Router Future Flag 警告
 * [context7:remix-run/react-router:2025-12-06]
 */
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

interface RouterWrapperProps {
  children: ReactNode;
  initialEntries?: string[];
}

/**
 * 用於測試的 BrowserRouter，已啟用 v7 future flags
 */
export function TestBrowserRouter({ children }: RouterWrapperProps) {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {children}
    </BrowserRouter>
  );
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
