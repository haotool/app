/**
 * Test Router Wrapper with v7 future flags
 * [fix:2026-01-09] 消除測試中的 React Router Future Flag 警告
 * [context7:remix-run/react-router:2026-01-09]
 */
import type { ReactNode } from 'react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';

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

/**
 * 用於 Layout 測試的包裝器，已啟用 v7 future flags
 */
interface LayoutTestWrapperProps {
  initialEntries?: string[];
  children: ReactNode;
}

export function LayoutTestWrapper({ initialEntries = ['/'], children }: LayoutTestWrapperProps) {
  return (
    <MemoryRouter
      initialEntries={initialEntries}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route element={children}>
          <Route path="/" element={<div>Home Content</div>} />
          <Route path="/about" element={<div>About Content</div>} />
          <Route path="/projects" element={<div>Projects Content</div>} />
          <Route path="/contact" element={<div>Contact Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}
