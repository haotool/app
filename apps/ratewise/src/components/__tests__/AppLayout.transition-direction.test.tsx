import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '../AppLayout';

vi.mock('../SideNavigation', () => ({
  SideNavigation: () => <div data-testid="side-navigation" />,
}));

vi.mock('../BottomNavigation', () => ({
  BottomNavigation: () => <div data-testid="bottom-navigation" />,
}));

vi.mock('../OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

vi.mock('../UpdatePrompt', () => ({
  UpdatePrompt: () => null,
}));

vi.mock('../RouteErrorBoundary', () => ({
  RouteErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      custom,
      variants: _variants,
      initial: _initial,
      exit: _exit,
      transition: _transition,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
      custom?: unknown;
      variants?: unknown;
      initial?: unknown;
      exit?: unknown;
      transition?: unknown;
    }) => {
      const direction = typeof custom === 'number' ? custom : 0;
      return (
        <div data-testid="page-transition" data-transition-direction={direction} {...rest}>
          {children}
        </div>
      );
    },
  },
}));

function RouteContent() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div>
      <p data-testid="current-path">{location.pathname}</p>
      <button type="button" onClick={() => navigate('/multi')}>
        to-multi
      </button>
      <button type="button" onClick={() => navigate('/')}>
        to-home
      </button>
    </div>
  );
}

describe('AppLayout 頁面切換', () => {
  it('導覽時應正確渲染 transition wrapper 與內容', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<RouteContent />} />
            <Route path="multi" element={<RouteContent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/');
    expect(screen.getByTestId('page-transition')).toBeInTheDocument();
    expect(screen.getByTestId('page-transition')).toHaveAttribute('data-transition-direction', '0');

    fireEvent.click(screen.getByRole('button', { name: 'to-multi' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/multi');
    expect(screen.getByTestId('page-transition')).toHaveAttribute('data-transition-direction', '1');

    fireEvent.click(screen.getByRole('button', { name: 'to-home' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/');
    expect(screen.getByTestId('page-transition')).toHaveAttribute(
      'data-transition-direction',
      '-1',
    );
  });
});
