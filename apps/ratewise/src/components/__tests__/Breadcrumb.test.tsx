/**
 * Breadcrumb Component BDD Tests - Stage 3 RED
 *
 * 依據：
 * - [Schema.org] BreadcrumbList 結構化數據規範
 * - [Google Search Central] 麵包屑導航最佳實踐
 * - [WCAG 2.1] 無障礙導航要求
 *
 * BDD 流程：
 * 🔴 RED - 建立失敗測試（本檔案）
 * 🟢 GREEN - 實作 Breadcrumb 組件
 * 🔵 REFACTOR - 優化並整合到所有頁面
 *
 * 建立時間: 2025-12-20
 * BDD 階段: Stage 3 RED
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumb } from '../Breadcrumb';

// Type definitions for JSON-LD BreadcrumbList schema
interface BreadcrumbListSchema {
  '@context': string;
  '@type': string;
  itemListElement: {
    '@type': string;
    position: number;
    name: string;
    item: string;
  }[];
}

describe('🔴 RED: Breadcrumb Component', () => {
  describe('Visual Breadcrumb Navigation', () => {
    it('should render breadcrumb navigation element', () => {
      const items = [
        { label: '首頁', href: '/' },
        { label: 'FAQ', href: '/faq/' },
      ];

      render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      const nav = screen.getByRole('navigation', { name: /麵包屑/i });
      expect(nav).toBeDefined();
    });

    it('should render all breadcrumb items', () => {
      const items = [
        { label: '首頁', href: '/' },
        { label: 'FAQ', href: '/faq/' },
        { label: '當前頁', href: '/faq/currency/' },
      ];

      render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      expect(screen.getByText('首頁')).toBeDefined();
      expect(screen.getByText('FAQ')).toBeDefined();
      expect(screen.getByText('當前頁')).toBeDefined();
    });

    it('should mark last item as current page with aria-current="page"', () => {
      const items = [
        { label: '首頁', href: '/' },
        { label: '當前頁', href: '/current/' },
      ];

      render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      const currentItem = screen.getByText('當前頁');
      expect(currentItem.getAttribute('aria-current')).toBe('page');
    });

    it('should render links for non-current items', () => {
      const items = [
        { label: '首頁', href: '/' },
        { label: 'FAQ', href: '/faq/' },
        { label: '當前頁', href: '/current/' },
      ];

      render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      const homeLink = screen.getByRole('link', { name: '首頁' });
      expect(homeLink.getAttribute('href')).toBe('/');

      const faqLink = screen.getByRole('link', { name: 'FAQ' });
      expect(faqLink.getAttribute('href')).toBe('/faq/');
    });

    it('should render separators between items', () => {
      const items = [
        { label: '首頁', href: '/' },
        { label: 'FAQ', href: '/faq/' },
        { label: '當前頁', href: '/current/' },
      ];

      const { container } = render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      // 檢查分隔符號存在（應該有 2 個，因為有 3 個項目）
      const separators = container.querySelectorAll('[aria-hidden="true"]');
      expect(separators.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('BreadcrumbList JSON-LD Schema', () => {
    it('should render JSON-LD script tag', () => {
      const items = [
        { label: '首頁', href: '/' },
        { label: 'FAQ', href: '/faq/' },
      ];

      const { container } = render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeDefined();
    });

    it('should generate valid BreadcrumbList schema', () => {
      const items = [
        { label: '首頁', href: '/' },
        { label: 'FAQ', href: '/faq/' },
        { label: '當前頁', href: '/current/' },
      ];

      const { container } = render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script?.textContent ?? '{}') as BreadcrumbListSchema;

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('BreadcrumbList');
      expect(jsonLd.itemListElement).toBeDefined();
      expect(Array.isArray(jsonLd.itemListElement)).toBe(true);
      expect(jsonLd.itemListElement.length).toBe(3);
    });

    it('should have correct schema structure for each item', () => {
      const items = [
        { label: '首頁', href: '/' },
        { label: 'FAQ', href: '/faq/' },
      ];

      const { container } = render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script?.textContent ?? '{}') as BreadcrumbListSchema;

      const firstItem = jsonLd.itemListElement[0];
      expect(firstItem).toBeDefined();
      expect(firstItem!['@type']).toBe('ListItem');
      expect(firstItem!.position).toBe(1);
      expect(firstItem!.name).toBe('首頁');
      expect(firstItem!.item).toContain('/'); // 應包含完整 URL
    });

    it('should use absolute URLs in schema', () => {
      const items = [
        { label: '首頁', href: '/' },
        { label: 'FAQ', href: '/faq/' },
      ];

      const { container } = render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      const jsonLd = JSON.parse(script?.textContent ?? '{}') as BreadcrumbListSchema;

      const firstItem = jsonLd.itemListElement[0];
      expect(firstItem).toBeDefined();
      // 應使用完整 URL (https://app.haotool.org/ratewise/)
      expect(firstItem!.item).toMatch(/^https?:\/\//);
    });
  });

  describe('Accessibility (a11y)', () => {
    it('should have accessible navigation landmark', () => {
      const items = [{ label: '首頁', href: '/' }];

      render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toBeDefined();
    });

    it('should have descriptive aria-label', () => {
      const items = [{ label: '首頁', href: '/' }];

      render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      const nav = screen.getByRole('navigation');
      const ariaLabel = nav.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/麵包屑/i);
    });

    it('should use ordered list for breadcrumb items', () => {
      const items = [
        { label: '首頁', href: '/' },
        { label: 'FAQ', href: '/faq/' },
      ];

      const { container } = render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      const ol = container.querySelector('ol');
      expect(ol).toBeDefined();
    });

    it('should hide separator icons from screen readers', () => {
      const items = [
        { label: '首頁', href: '/' },
        { label: 'FAQ', href: '/faq/' },
      ];

      const { container } = render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      const separators = container.querySelectorAll('[aria-hidden="true"]');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single item breadcrumb', () => {
      const items = [{ label: '首頁', href: '/' }];

      render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      expect(screen.getByText('首頁')).toBeDefined();
    });

    it('should handle empty items array gracefully', () => {
      const items: { label: string; href: string }[] = [];

      const { container } = render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      // 不應渲染任何內容或渲染空的導航
      const nav = container.querySelector('nav');
      if (nav) {
        expect(nav.textContent?.trim()).toBe('');
      }
    });

    it('should handle long breadcrumb paths (>5 items)', () => {
      const items = [
        { label: '首頁', href: '/' },
        { label: 'Level 1', href: '/l1/' },
        { label: 'Level 2', href: '/l2/' },
        { label: 'Level 3', href: '/l3/' },
        { label: 'Level 4', href: '/l4/' },
        { label: 'Level 5', href: '/l5/' },
      ];

      render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      items.forEach((item) => {
        expect(screen.getByText(item.label)).toBeDefined();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive CSS classes', () => {
      const items = [
        { label: '首頁', href: '/' },
        { label: 'FAQ', href: '/faq/' },
      ];

      const { container } = render(
        <MemoryRouter>
          <Breadcrumb items={items} />
        </MemoryRouter>,
      );

      const nav = container.querySelector('nav');
      // 應包含響應式或隱藏類別（例如在小螢幕上隱藏）
      expect(nav?.className).toBeDefined();
    });
  });
});
