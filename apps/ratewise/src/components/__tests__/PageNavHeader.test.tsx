import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PageNavHeader } from '../PageNavHeader';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.back': '返回',
        'nav.breadcrumb': '麵包屑',
      };
      return translations[key] ?? key;
    },
  }),
}));

function renderHeader() {
  return render(
    <MemoryRouter>
      <PageNavHeader
        breadcrumbItems={[
          { label: '首頁', href: '/' },
          { label: '支援與資訊', href: '/guide/' },
          { label: '很長很長的頁面標題應該保持單行截斷而不是把頂部導覽撐高', href: '/guide/' },
        ]}
      />
    </MemoryRouter>,
  );
}

describe('PageNavHeader', () => {
  it('不得使用 sticky 定位與 safe-area hack，避免 PWA 用戶內容被遮擋', () => {
    renderHeader();

    const header = screen.getByTestId('page-nav-header');
    expect(header.className).not.toContain('sticky');
    expect(header.className).not.toContain('safe-area-inset-top');
    expect(header.className).not.toContain('backdrop-blur');
    expect(header.className).not.toContain('-mx-4');
    expect(header).not.toHaveAttribute('style');
  });

  it('應為 in-flow 區塊並保持 breadcrumb 單行可截斷', () => {
    renderHeader();

    const header = screen.getByTestId('page-nav-header');
    expect(header.className).toContain('mb-');

    const breadcrumb = screen.getByRole('navigation', { name: '麵包屑' });
    const breadcrumbList = breadcrumb.querySelector('ol');
    expect(breadcrumb).toHaveClass('min-w-0');
    expect(breadcrumbList).toHaveClass('overflow-x-auto');
    expect(breadcrumbList).toHaveClass('whitespace-nowrap');
  });

  it('返回按鈕應為 pill 造型且維持 44px 觸控目標與鍵盤 focus 樣式', () => {
    renderHeader();

    const backButton = screen.getByRole('button', { name: '返回' });
    expect(backButton).toHaveClass('focus-visible:ring-2');
    expect(backButton.className).toContain('min-h-11');
    expect(backButton.className).toContain('rounded-full');
  });
});
