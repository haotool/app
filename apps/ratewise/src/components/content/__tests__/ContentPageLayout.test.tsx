// @vitest-environment jsdom

/**
 * ContentPageLayout／ContentSections 測試：
 * 骨架必備件（返回導覽、麵包屑、行動版底部導覽）與五種 section 型別渲染。
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import { ContentPageLayout } from '../ContentPageLayout';
import { ContentSections, type ContentSection } from '../ContentSections';

const BREADCRUMB = [
  { label: '首頁', href: '/' },
  { label: '測試頁', href: '/test/' },
];

function renderLayout(children: React.ReactNode = <p>內容</p>) {
  return render(
    <BrowserRouter>
      <ContentPageLayout breadcrumbItems={BREADCRUMB}>{children}</ContentPageLayout>
    </BrowserRouter>,
  );
}

describe('ContentPageLayout', () => {
  it('渲染返回按鈕與麵包屑', () => {
    renderLayout();
    expect(screen.getByRole('button', { name: /返回|back/i })).toBeInTheDocument();
    expect(screen.getByText('測試頁')).toBeInTheDocument();
  });

  it('內容頁保留行動版底部導覽（修復審計 P1-8）', () => {
    renderLayout();
    const navs = screen.getAllByRole('navigation');
    // 至少含麵包屑 nav 與底部導覽 nav。
    expect(navs.length).toBeGreaterThanOrEqual(2);
    // 底部導覽四個主要目的地存在。
    expect(screen.getByRole('link', { name: /設定|settings/i })).toBeInTheDocument();
  });

  it('內容底部保留導覽列高度內距，避免被固定導覽遮擋', () => {
    renderLayout();
    const container = screen.getByTestId('content-page').firstElementChild;
    expect(container?.className).toContain('pb-24');
  });
});

describe('ContentSections', () => {
  const SECTIONS: readonly ContentSection[] = [
    { kind: 'text', title: '文字區', paragraphs: ['第一段', '第二段'] },
    { kind: 'list', title: '清單區', items: [{ term: '重點：', description: '說明文字' }] },
    { kind: 'faq', title: '問答區', items: [{ question: '問題一？', answer: '答案一' }] },
    {
      kind: 'links',
      title: '連結區',
      links: [
        { label: '站內連結', href: '/faq/' },
        { label: '站外連結', href: 'https://example.com', external: true },
      ],
    },
    { kind: 'cards', title: '卡片區', cards: [{ title: '功能卡', description: '功能說明' }] },
  ];

  it('五種 section 型別皆正確渲染', () => {
    render(
      <BrowserRouter>
        <ContentSections sections={SECTIONS} />
      </BrowserRouter>,
    );

    for (const title of ['文字區', '清單區', '問答區', '連結區', '卡片區']) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }
    expect(screen.getByText('第二段')).toBeInTheDocument();
    expect(screen.getByText('重點：')).toBeInTheDocument();
    expect(screen.getByText('問題一？')).toBeInTheDocument();

    const internal = screen.getByRole('link', { name: /站內連結/ });
    expect(internal).toHaveAttribute('href', '/faq/');
    const external = screen.getByRole('link', { name: /站外連結/ });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', expect.stringContaining('noopener'));

    expect(screen.getByRole('heading', { level: 3, name: '功能卡' })).toBeInTheDocument();
  });

  it('FAQ 手風琴使用原生 details 且預設收合', () => {
    render(
      <BrowserRouter>
        <ContentSections sections={[{ kind: 'faq', items: [{ question: 'Q', answer: 'A' }] }]} />
      </BrowserRouter>,
    );
    const details = document.querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
  });
});
