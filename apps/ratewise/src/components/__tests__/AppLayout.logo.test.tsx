import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../AppLayout';
import { APP_INFO } from '../../config/app-info';

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

vi.mock('../RatingModal', () => ({
  RatingModal: () => null,
}));

vi.mock('../PwaInstallGuide', () => ({
  PwaInstallGuide: () => null,
}));

vi.mock('../NonCriticalLazyBoundary', () => ({
  NonCriticalLazyBoundary: () => null,
}));

vi.mock('../RouteErrorBoundary', () => ({
  RouteErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AppLayout Logo', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('品牌 LOGO 應為主題感知 inline SVG（無點陣圖請求、主色隨主題切換）', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<div>內容</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const logo = screen.getByRole('img', { name: APP_INFO.name });
    // inline SVG：不應有任何外部圖片請求。
    expect(logo.querySelector('img')).toBeNull();
    const svg = logo.querySelector('svg');
    expect(svg).not.toBeNull();
    // 主色由主題 token 驅動（--color-primary），切換主題即時跟隨。
    expect(svg?.innerHTML).toContain('var(--color-primary)');
  });
});
