import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from './routes';
import { useTradeStore } from './stores/tradeStore';
import { createInitialAccount } from './engine/engine';
import { DISCLAIMER_STORAGE_KEY } from './config/trading';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('App shell', () => {
  beforeEach(() => {
    useTradeStore.setState({ account: createInitialAccount(), toasts: [] });
  });

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

describe('DisclaimerDialog', () => {
  beforeEach(() => {
    useTradeStore.setState({ account: createInitialAccount(), toasts: [] });
  });

  it('shows on first visit and remembers acknowledgement', async () => {
    window.localStorage.removeItem(DISCLAIMER_STORAGE_KEY);
    const user = userEvent.setup();
    renderAt('/');

    const dialog = screen.getByRole('alertdialog', { name: '免責聲明' });
    expect(dialog).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '我已了解，開始模擬交易' }));
    expect(screen.queryByRole('alertdialog', { name: '免責聲明' })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(DISCLAIMER_STORAGE_KEY)).toBe('1');
  });

  it('stays hidden once acknowledged', () => {
    renderAt('/');
    expect(screen.queryByRole('alertdialog', { name: '免責聲明' })).not.toBeInTheDocument();
  });
});
