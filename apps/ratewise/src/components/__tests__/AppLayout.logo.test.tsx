import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

describe('AppLayout Logo', () => {
  it('應只使用透明 logo.png，避免 retina 螢幕誤載入有底色的 PWA icon', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<div>內容</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const logo = screen.getByRole('img', { name: 'RateWise 匯率好工具' });
    expect(logo).toHaveAttribute('src', '/logo.png');
    expect(logo).not.toHaveAttribute('srcset');
  });
});
