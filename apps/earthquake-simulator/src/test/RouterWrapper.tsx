/**
 * Test Router Wrapper
 * 提供測試用的 Router 包裝器
 */

import React from 'react';
import { MemoryRouter } from 'react-router-dom';

interface RouterWrapperProps {
  children: React.ReactNode;
  initialEntries?: string[];
}

export const RouterWrapper: React.FC<RouterWrapperProps> = ({
  children,
  initialEntries = ['/'],
}) => {
  return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
};

export default RouterWrapper;
