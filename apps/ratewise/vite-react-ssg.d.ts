// 暫時性類型定義：vite-react-ssg 缺失官方類型
declare module 'vite-react-ssg' {
  import { type ReactNode } from 'react';
  import { type RouteObject } from 'react-router-dom';

  export interface RouteRecord {
    path?: string;
    element?: ReactNode;
    children?: RouteRecord[];
    lazy?: () => Promise<{ Component: () => ReactNode }>;
    entry?: string;
  }

  export interface ViteReactSSGOptions {
    routes: RouteRecord[];
    basename?: string;
    future?: {
      v7_startTransition?: boolean;
      v7_relativeSplatPath?: boolean;
    };
  }

  export interface SSGContext {
    isClient: boolean;
  }

  export function ViteReactSSG(
    options: ViteReactSSGOptions,
    onCreated?: (context: SSGContext) => void,
  ): void;

  export function useSSG(): SSGContext;

  export function ClientOnly(props: {
    children: ReactNode | (() => ReactNode);
    fallback?: ReactNode;
  }): ReactNode;

  export function Head(props: { children: ReactNode }): ReactNode;
}

// 暫時性類型定義：vite-plugin-pwa virtual module
declare module 'virtual:pwa-register/react' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: any) => void;
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, (value: boolean) => void];
    offlineReady: [boolean, (value: boolean) => void];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}
