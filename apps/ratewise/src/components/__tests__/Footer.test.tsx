import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Footer } from '../Footer';
import { getDisplayVersion } from '../../config/version';

vi.mock('vite-react-ssg', () => ({
  ClientOnly: ({
    children,
    fallback,
  }: {
    children?: (() => ReactNode) | ReactNode;
    fallback?: ReactNode;
  }) => {
    if (typeof children === 'function') return children();
    return children ?? fallback ?? null;
  },
}));

vi.mock('../../features/ratewise/hooks/useExchangeRates', () => ({
  useExchangeRates: () => ({
    lastUpdate: null,
    lastFetchedAt: null,
  }),
}));

describe('Footer', () => {
  const renderFooter = () =>
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

  it('renders version from SSOT', () => {
    renderFooter();
    expect(screen.getByText(getDisplayVersion())).toBeInTheDocument();
  });

  it('renders update time placeholders when data is missing', () => {
    renderFooter();
    const matches = screen.getAllByText(
      (_, element) => element?.textContent?.includes('--/-- --:--') ?? false,
    );
    expect(matches.length).toBeGreaterThan(0);
  });
});
