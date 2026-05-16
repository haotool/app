import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { PageNavHeader } from '../PageNavHeader';
import { APP_INFO } from '../../config/app-info';
import { SUPPORT_INFO_LINKS } from '../../config/support-info';

const breadcrumbItems = [
  { label: '首頁', href: '/' },
  { label: '常見問題', href: '/faq/' },
];

function renderHeader(path = '/faq/', basename?: string) {
  return render(
    <MemoryRouter basename={basename} initialEntries={[path]}>
      <PageNavHeader breadcrumbItems={breadcrumbItems} />
    </MemoryRouter>,
  );
}

describe('PageNavHeader', () => {
  it('在公開內容頁顯示品牌、返回與麵包屑', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '首頁' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(APP_INFO.name)).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /麵包屑/ })).toBeInTheDocument();
  });

  it('顯示支援與資訊分群導覽並標示目前頁面', () => {
    renderHeader('/open-data/');

    const supportNav = screen.getByRole('navigation', { name: '支援與資訊' });
    expect(supportNav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /常見問題/ })).toHaveAttribute('href', '/faq/');
    expect(screen.getByRole('link', { name: /使用指南/ })).toHaveAttribute('href', '/guide/');
    expect(screen.getByRole('link', { name: /關於我們/ })).toHaveAttribute('href', '/about/');
    expect(
      Array.from(supportNav.querySelectorAll('a')).map((link) => link.getAttribute('href')),
    ).toEqual(SUPPORT_INFO_LINKS.map((item) => item.href));
    const activeLink = screen.getByRole('link', { name: /開放資料 API/ });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(activeLink).toHaveClass('text-active-pill-foreground');
    expect(activeLink).not.toHaveClass('text-white');
  });

  it('非支援資訊頁不顯示支援分群導覽', () => {
    renderHeader('/usd-twd/');

    expect(screen.queryByRole('navigation', { name: '支援與資訊' })).not.toBeInTheDocument();
  });

  it('在 basename 部署下產生正確連結', () => {
    renderHeader('/ratewise/faq/', '/ratewise');

    expect(screen.getByRole('link', { name: /常見問題/ })).toHaveAttribute(
      'href',
      '/ratewise/faq/',
    );
    expect(screen.getAllByRole('link', { name: '首頁' })[0]).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/ratewise\/?$/),
    );
  });
});
