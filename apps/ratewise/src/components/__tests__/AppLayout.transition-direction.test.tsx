import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '../AppLayout';
import { pageTransition } from '../../config/animations';

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

vi.mock('motion/react', () => {
  interface MotionDivProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    custom?: 1 | -1;
    variants?: Record<string, unknown>;
    initial?: unknown;
    exit?: unknown;
    transition?: unknown;
  }

  const resolveVariant = (
    variant: unknown,
    variants: Record<string, unknown> | undefined,
    custom: 1 | -1 | undefined,
  ): Record<string, unknown> | null => {
    if (variant === false || variant == null) {
      return null;
    }

    const variantDefinition = typeof variant === 'string' && variants ? variants[variant] : variant;

    if (typeof variantDefinition === 'function') {
      return variantDefinition(custom) as Record<string, unknown>;
    }

    return typeof variantDefinition === 'object'
      ? (variantDefinition as Record<string, unknown>)
      : null;
  };

  return {
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({
        children,
        custom,
        variants,
        initial,
        exit,
        transition: _transition,
        ...rest
      }: MotionDivProps) => {
        const initialState = resolveVariant(initial, variants, custom);
        const exitState = resolveVariant(exit, variants, custom);

        const initialX =
          typeof initialState?.['x'] === 'number' ? (initialState['x'] as number) : '';
        const exitX = typeof exitState?.['x'] === 'number' ? (exitState['x'] as number) : '';

        return (
          <div
            data-testid="page-transition"
            data-initial-x={String(initialX)}
            data-exit-x={String(exitX)}
            {...rest}
          >
            {children}
          </div>
        );
      },
    },
  };
});

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

function getInitialX(): number {
  return Number(screen.getByTestId('page-transition').getAttribute('data-initial-x'));
}

describe('AppLayout Transition Direction', () => {
  it('前進再返回時，應該立即使用正確的切換方向', () => {
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
    expect(getInitialX()).toBe(pageTransition.offsetX);

    fireEvent.click(screen.getByRole('button', { name: 'to-multi' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/multi');
    expect(getInitialX()).toBe(pageTransition.offsetX);

    fireEvent.click(screen.getByRole('button', { name: 'to-home' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/');
    expect(getInitialX()).toBe(-pageTransition.offsetX);
  });
});
