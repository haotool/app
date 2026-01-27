import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '../AppLayout';
import { navigationTokens } from '../../config/design-tokens';

vi.mock('../SideNavigation', () => ({
  SideNavigation: () => <div data-testid="side-navigation" />,
}));

vi.mock('../BottomNavigation', () => ({
  BottomNavigation: () => <div data-testid="bottom-navigation" />,
}));

describe('AppLayout Safe Area', () => {
  it('標題列應該保留安全區並使用設計 Token 高度', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<div>內容</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveStyle(`height: ${navigationTokens.header.heightWithSafeArea}`);
    expect(header).toHaveStyle(`padding-top: ${navigationTokens.safeArea.top}`);
  });
});
