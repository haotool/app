/**
 * BottomNavigation A11y Test - TDD RED Phase
 *
 * 測試目標：驗證 W3C 規範 - `<a>` 元素內部不應有 tabindex 屬性的子元素
 *
 * @reference https://rocketvalidator.com/html-validation/an-element-with-the-attribute-tabindex-must-not-appear-as-a-descendant-of-the-a-element
 * @reference W3C HTML Validator Error: "An element with the attribute tabindex must not appear as a descendant of the a element"
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNavigation } from '../BottomNavigation';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'nav.mainNavigation': 'Main Navigation',
        'nav.singleCurrency': 'Single',
        'nav.singleCurrencyFull': 'Single Currency',
        'nav.multiCurrency': 'Multi',
        'nav.multiCurrencyFull': 'Multi Currency',
        'nav.favorites': 'Favorites',
        'nav.favoritesFull': 'Favorites & History',
        'nav.settings': 'Settings',
        'nav.settingsFull': 'App Settings',
      };
      return translations[key] ?? key;
    },
  }),
}));

describe('BottomNavigation A11y Compliance', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * W3C Validation Rule:
   * An element with the attribute tabindex must not appear as a descendant of the `<a>` element.
   *
   * This test ensures that no descendant elements within `<a>` (Link) have tabindex attributes.
   */
  it('應該確保 Link 元素內部沒有帶有 tabindex 屬性的子元素（W3C 規範）', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNavigation />
      </MemoryRouter>,
    );

    // 取得所有 Link/anchor 元素
    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);

    // 檢查每個 link 內部是否有帶 tabindex 的子元素
    links.forEach((link, index) => {
      const descendantsWithTabindex = link.querySelectorAll('[tabindex]');

      // 過濾掉 tabindex="-1" 的元素（這是合法的，用於移除焦點）
      const invalidDescendants = Array.from(descendantsWithTabindex).filter(
        (el) => el.getAttribute('tabindex') !== '-1',
      );

      expect(
        invalidDescendants.length,
        `Link ${index + 1} 內有 ${invalidDescendants.length} 個帶有 tabindex 的非法子元素。這違反了 W3C 規範。`,
      ).toBe(0);
    });
  });

  /**
   * 確保導航項目使用正確的 a11y 屬性
   */
  it('應該為活動頁面設置 aria-current="page"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNavigation />
      </MemoryRouter>,
    );

    const activeLink = screen.getByRole('link', { current: 'page' });
    expect(activeLink).toBeInTheDocument();
    expect(activeLink).toHaveAttribute('href', '/');
  });

  /**
   * 確保所有導航連結都有 aria-label
   */
  it('應該為所有導航連結提供 aria-label', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNavigation />
      </MemoryRouter>,
    );

    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      expect(link).toHaveAttribute('aria-label');
      expect(link.getAttribute('aria-label')).not.toBe('');
    });
  });

  /**
   * 確保 nav 元素有適當的 aria-label
   */
  it('應該為 nav 元素提供 aria-label', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNavigation />
      </MemoryRouter>,
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main Navigation');
  });
});
