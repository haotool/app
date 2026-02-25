import type { ReactNode } from 'react';
import { vi } from 'vitest';

export const ViteReactSSG = vi.fn();

export function useSSG() {
  return { isClient: true };
}

export function ClientOnly({ children }: { children: ReactNode }) {
  return children;
}

export function Head({ children }: { children: ReactNode }) {
  return children;
}

export interface RouteRecord {
  path: string;
  element?: ReactNode;
  children?: RouteRecord[];
  index?: boolean;
}
