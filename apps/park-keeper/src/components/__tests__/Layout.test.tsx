import { beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from '../Layout';
import i18n from '@app/park-keeper/services/i18n';

// UpdatePrompt 依賴 virtual:pwa-register/react；於單元測試以 testid stub 取代，
// 專注驗證「全路由是否掛載」本身（issue #725 pre-release 稽核 C-P0）。
vi.mock('../UpdatePrompt', () => ({
  UpdatePrompt: () => <div data-testid="update-prompt-stub" />,
}));

const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

function renderWithRouter(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter future={ROUTER_FUTURE} initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<span>Test content</span>} />
          <Route path="about" element={<span>About content</span>} />
          <Route path="add" element={<span>Add content</span>} />
          <Route path="guide" element={<span>Guide content</span>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Layout', () => {
  beforeAll(async () => {
    // 統一固定為 zh-TW，避免測試斷言隨 navigator.language 飄動（對應 e2e/helpers.ts 慣例）。
    await i18n.changeLanguage('zh-TW');
  });

  it('should hide footer on immersive app routes', () => {
    renderWithRouter();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });

  it('should render footer with copyright text on about route', () => {
    renderWithRouter(['/about']);
    expect(screen.getByText(/© 2026/)).toBeInTheDocument();
  });

  it('should render author name on about route', () => {
    renderWithRouter(['/about']);
    expect(screen.getByRole('link', { name: '阿璋 (Ah Zhang)' })).toBeInTheDocument();
  });

  it('should render navigation links (About, Settings, Privacy) on about route', () => {
    renderWithRouter(['/about']);
    expect(screen.getByRole('link', { name: '關於' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '設定' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '隱私權' })).toBeInTheDocument();
  });

  it('should have current year in copyright on about route', () => {
    renderWithRouter(['/about']);
    const copyrightEl = screen.getByText(/© 2026/);
    expect(copyrightEl).toBeInTheDocument();
  });

  it('should not render hidden sr-only metadata（issue #725 移除硬編日期隱藏文字）', () => {
    renderWithRouter();
    expect(document.querySelector('.sr-only')).toBeNull();
    expect(document.querySelector('time[dateTime="2026-02-25"]')).toBeNull();
  });

  it('should render Outlet content', () => {
    renderWithRouter();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it.each([
    ['/', 'Test content'],
    ['/about', 'About content'],
    ['/add', 'Add content'],
    ['/guide', 'Guide content'],
  ])(
    'should mount UpdatePrompt globally on %s route（issue #725 pre-release 稽核 C-P0）',
    (path, expectedContent) => {
      renderWithRouter([path]);
      expect(screen.getByText(expectedContent)).toBeInTheDocument();
      expect(screen.getAllByTestId('update-prompt-stub')).toHaveLength(1);
    },
  );
});
