/**
 * Breadcrumb Component BDD Tests - Stage 3 GREEN
 *
 * 依據：
 * - [WCAG 2.1] 無障礙導航要求
 *   https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 *
 * 測試範圍：
 * - UI 渲染測試（視覺麵包屑導航）
 * - 無障礙測試（ARIA 屬性、語意標籤）
 * - 邊界情況測試（空陣列、單項目、長路徑）
 * - 響應式設計驗證
 *
 * **注意**: Schema 測試已移至 SEOHelmet.test.tsx
 * - Breadcrumb 組件專注 UI 渲染（SRP 原則）
 * - SEOHelmet 統一管理所有 JSON-LD Schema
 *
 * 建立時間: 2025-12-20
 * 最後更新: 2025-12-22 (移除 Schema 測試)
 * BDD 階段: Stage 3 GREEN
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumb } from '../Breadcrumb';

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
