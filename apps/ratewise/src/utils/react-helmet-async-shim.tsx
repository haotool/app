import type { PropsWithChildren, ReactNode } from 'react';

interface HelmetProviderProps extends PropsWithChildren {
  context?: unknown;
}

interface HelmetProps extends PropsWithChildren {
  defer?: boolean;
  prioritizeSeoTags?: boolean;
}

// React 19 已原生支援 metadata hoisting。
// vite-react-ssg 仍會在 client runtime 引入 react-helmet-async，
// 這個 shim 讓既有 API 保持穩定，同時避免舊版 library 在 React 19 下的 runtime 錯誤。
export function HelmetProvider({ children }: HelmetProviderProps): ReactNode {
  return children ?? null;
}

export function Helmet({ children }: HelmetProps): ReactNode {
  return children ?? null;
}

export class HelmetData {
  context: unknown;

  constructor(context: unknown = {}) {
    this.context = context;
  }
}

export default {
  Helmet,
  HelmetData,
  HelmetProvider,
};
