/**
 * Mock for vite-react-ssg in test environment
 *
 * 測試環境 mock：vite-react-ssg 虛擬模組在測試環境無法解析
 */
import type { ReactNode } from 'react';

export const ViteReactSSG = vi.fn();

export const useSSG = vi.fn(() => ({
  isClient: true,
}));

export const ClientOnly = ({
  children,
}: {
  children: ReactNode | (() => ReactNode);
  fallback?: ReactNode;
}) => {
  if (typeof children === 'function') {
    return children();
  }
  return children;
};

export const Head = ({ children }: { children: ReactNode }) => children;

export interface RouteRecord {
  path?: string;
  element?: ReactNode;
  children?: RouteRecord[];
  lazy?: () => Promise<{ Component: () => ReactNode }>;
  entry?: string;
}
