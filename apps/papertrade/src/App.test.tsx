import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routes } from './routes';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('App shell', () => {
  it('renders bottom navigation with five tabs', () => {
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: '主導覽' });
    expect(nav).toBeInTheDocument();
    for (const label of ['行情', '圖表', '交易', '資產', '設定']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('renders trade placeholder page', () => {
    renderAt('/trade');
    expect(screen.getByRole('heading', { name: '交易' })).toBeInTheDocument();
  });

  it('renders assets placeholder page', () => {
    renderAt('/assets');
    expect(screen.getByRole('heading', { name: '資產' })).toBeInTheDocument();
  });

  it('renders settings page with disclaimer', () => {
    renderAt('/settings');
    expect(screen.getByText(/模擬交易工具/)).toBeInTheDocument();
  });

  it('redirects unknown paths to markets page', () => {
    renderAt('/nope');
    expect(screen.getByRole('link', { name: '行情' })).toBeInTheDocument();
  });
});
