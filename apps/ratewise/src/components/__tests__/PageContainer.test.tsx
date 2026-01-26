/**
 * PageContainer Component Tests - TDD Coverage
 *
 * 測試範圍：
 * - PageContainer 基本渲染
 * - 變體樣式 (default, full, centered)
 * - 內距模式 (default, compact, none)
 * - 底部導覽留白
 * - PageSection 組件
 * - PageCard 組件
 *
 * @see src/components/PageContainer.tsx
 * @created 2026-01-25
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageContainer, PageSection, PageCard } from '../PageContainer';

describe('PageContainer Component', () => {
  describe('基本渲染', () => {
    it('應該渲染子元素', () => {
      render(
        <PageContainer>
          <p>Test content</p>
        </PageContainer>,
      );
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('應該使用 min-h-full 容器類別', () => {
      const { container } = render(
        <PageContainer>
          <p>Content</p>
        </PageContainer>,
      );
      const outerDiv = container.firstChild as HTMLElement;
      // v2.0.0: 改用 min-h-full，底部留白由 AppLayout 統一處理
      expect(outerDiv.className).toContain('min-h-full');
    });

    it('hasBottomNav 參數已廢棄但保持向後相容', () => {
      // v2.0.0: hasBottomNav 參數已廢棄，由 AppLayout 統一處理底部留白
      const { container } = render(
        <PageContainer hasBottomNav={false}>
          <p>Content</p>
        </PageContainer>,
      );
      const outerDiv = container.firstChild as HTMLElement;
      // 無論 hasBottomNav 為何值，都使用相同的 min-h-full 類別
      expect(outerDiv.className).toContain('min-h-full');
    });
  });

  describe('變體樣式', () => {
    it('default 變體應該有 max-w-md 限制', () => {
      const { container } = render(
        <PageContainer variant="default">
          <p>Content</p>
        </PageContainer>,
      );
      // 外層是 container div，內層是 content div
      const outerDiv = container.firstChild as HTMLElement;
      const contentDiv = outerDiv.firstChild as HTMLElement;
      expect(contentDiv.className).toContain('max-w-md');
      expect(contentDiv.className).toContain('mx-auto');
    });

    it('full 變體應該是滿版寬度', () => {
      const { container } = render(
        <PageContainer variant="full">
          <p>Content</p>
        </PageContainer>,
      );
      const outerDiv = container.firstChild as HTMLElement;
      const contentDiv = outerDiv.firstChild as HTMLElement;
      expect(contentDiv.className).toContain('max-w-full');
    });

    it('centered 變體應該置中內容', () => {
      const { container } = render(
        <PageContainer variant="centered">
          <p>Content</p>
        </PageContainer>,
      );
      const outerDiv = container.firstChild as HTMLElement;
      const contentDiv = outerDiv.firstChild as HTMLElement;
      expect(contentDiv.className).toContain('flex');
      expect(contentDiv.className).toContain('items-center');
      expect(contentDiv.className).toContain('justify-center');
    });
  });

  describe('內距模式', () => {
    it('default 內距應該有 px-5 py-6', () => {
      const { container } = render(
        <PageContainer padding="default">
          <p>Content</p>
        </PageContainer>,
      );
      // 外層是 container div，內層是 content div
      const outerDiv = container.firstChild as HTMLElement;
      const contentDiv = outerDiv.firstChild as HTMLElement;
      expect(contentDiv.className).toContain('px-5');
      expect(contentDiv.className).toContain('py-6');
    });

    it('compact 內距應該有 px-4 py-4', () => {
      const { container } = render(
        <PageContainer padding="compact">
          <p>Content</p>
        </PageContainer>,
      );
      const outerDiv = container.firstChild as HTMLElement;
      const contentDiv = outerDiv.firstChild as HTMLElement;
      expect(contentDiv.className).toContain('px-4');
      expect(contentDiv.className).toContain('py-4');
    });

    it('none 內距不應該有 padding 類別', () => {
      const { container } = render(
        <PageContainer padding="none">
          <p>Content</p>
        </PageContainer>,
      );
      const outerDiv = container.firstChild as HTMLElement;
      const contentDiv = outerDiv.firstChild as HTMLElement;
      expect(contentDiv.className).not.toContain('px-5');
      expect(contentDiv.className).not.toContain('py-6');
      expect(contentDiv.className).not.toContain('px-4');
      expect(contentDiv.className).not.toContain('py-4');
    });
  });

  describe('語義化元素', () => {
    it('預設應該使用 div 元素', () => {
      const { container } = render(
        <PageContainer>
          <p>Content</p>
        </PageContainer>,
      );
      const contentElement = container.querySelector('div > div');
      expect(contentElement?.tagName).toBe('DIV');
    });

    it('as="section" 應該使用 section 元素', () => {
      const { container } = render(
        <PageContainer as="section">
          <p>Content</p>
        </PageContainer>,
      );
      const contentElement = container.querySelector('div > section');
      expect(contentElement).toBeInTheDocument();
    });

    it('as="article" 應該使用 article 元素', () => {
      const { container } = render(
        <PageContainer as="article">
          <p>Content</p>
        </PageContainer>,
      );
      const contentElement = container.querySelector('div > article');
      expect(contentElement).toBeInTheDocument();
    });
  });

  describe('自定義類別', () => {
    it('應該合併自定義 className', () => {
      const { container } = render(
        <PageContainer className="custom-class">
          <p>Content</p>
        </PageContainer>,
      );
      // 外層是 container div，內層是 content div
      const outerDiv = container.firstChild as HTMLElement;
      const contentDiv = outerDiv.firstChild as HTMLElement;
      expect(contentDiv.className).toContain('custom-class');
    });
  });
});

describe('PageSection Component', () => {
  it('應該渲染子元素', () => {
    render(
      <PageSection>
        <p>Section content</p>
      </PageSection>,
    );
    expect(screen.getByText('Section content')).toBeInTheDocument();
  });

  it('應該使用 section 標籤', () => {
    const { container } = render(
      <PageSection>
        <p>Content</p>
      </PageSection>,
    );
    expect(container.querySelector('section')).toBeInTheDocument();
  });

  it('預設應該有底部間距', () => {
    const { container } = render(
      <PageSection>
        <p>Content</p>
      </PageSection>,
    );
    const section = container.querySelector('section')!;
    expect(section.className).toContain('mb-6');
  });

  it('isLast=true 時不應該有底部間距', () => {
    const { container } = render(
      <PageSection isLast>
        <p>Content</p>
      </PageSection>,
    );
    const section = container.querySelector('section')!;
    expect(section.className).not.toContain('mb-6');
  });

  it('應該合併自定義 className', () => {
    const { container } = render(
      <PageSection className="custom-section">
        <p>Content</p>
      </PageSection>,
    );
    const section = container.querySelector('section')!;
    expect(section.className).toContain('custom-section');
  });
});

describe('PageCard Component', () => {
  it('應該渲染子元素', () => {
    render(
      <PageCard>
        <p>Card content</p>
      </PageCard>,
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('應該有卡片樣式', () => {
    const { container } = render(
      <PageCard>
        <p>Content</p>
      </PageCard>,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('card');
    expect(card.className).toContain('p-4');
  });

  describe('互動模式', () => {
    it('interactive=true 時應該有 hover 效果', () => {
      const { container } = render(
        <PageCard interactive>
          <p>Content</p>
        </PageCard>,
      );
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
      expect(card.className).toContain('hover:shadow-card-hover');
    });

    it('有 onClick 時應該有 button role', () => {
      const handleClick = vi.fn();
      render(
        <PageCard onClick={handleClick}>
          <p>Content</p>
        </PageCard>,
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('點擊時應該觸發 onClick', () => {
      const handleClick = vi.fn();
      render(
        <PageCard onClick={handleClick}>
          <p>Content</p>
        </PageCard>,
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('按 Enter 鍵時應該觸發 onClick', () => {
      const handleClick = vi.fn();
      render(
        <PageCard onClick={handleClick}>
          <p>Content</p>
        </PageCard>,
      );
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('有 onClick 時應該可聚焦 (tabIndex=0)', () => {
      const handleClick = vi.fn();
      render(
        <PageCard onClick={handleClick}>
          <p>Content</p>
        </PageCard>,
      );
      expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '0');
    });
  });

  it('應該合併自定義 className', () => {
    const { container } = render(
      <PageCard className="custom-card">
        <p>Content</p>
      </PageCard>,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-card');
  });
});
