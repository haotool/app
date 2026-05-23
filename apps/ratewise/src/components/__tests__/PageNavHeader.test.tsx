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
  it('應由 SSOT class 為 iOS PWA sticky header 預留 safe-area top', () => {
    renderHeader();

    const header = screen.getByTestId('page-nav-header');
    expect(header).toHaveClass('pt-[calc(env(safe-area-inset-top,0px)+0.625rem)]');
    expect(header).not.toHaveAttribute('style');
  });

  it('應使用 responsive bleed 並保持 breadcrumb 單行可截斷', () => {
    renderHeader();

    const header = screen.getByTestId('page-nav-header');
    expect(header.className).toContain('-mx-4');
    expect(header.className).toContain('sm:-mx-6');
    expect(header.className).toContain('lg:-mx-8');

    const breadcrumb = screen.getByRole('navigation', { name: '麵包屑' });
    const breadcrumbList = breadcrumb.querySelector('ol');
    expect(breadcrumb).toHaveClass('min-w-0');
    expect(breadcrumbList).toHaveClass('overflow-x-auto');
    expect(breadcrumbList).toHaveClass('whitespace-nowrap');
  });

  it('返回按鈕應有鍵盤 focus 樣式', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: '返回' })).toHaveClass('focus-visible:ring-2');
  });
});
