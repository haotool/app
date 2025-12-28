/**
 * Router Wrapper for Testing
 * 測試用路由包裝器
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

interface RouterWrapperProps {
  children: ReactNode;
  initialEntries?: string[];
}

export function RouterWrapper({ children, initialEntries = ['/'] }: RouterWrapperProps) {
  return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
}
