/**
 * Logo 元件測試
 * [BDD 測試策略 - Given-When-Then]
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Logo from './Logo';

describe('Logo 元件', () => {
  describe('當渲染時', () => {
    it('應該正確顯示 SVG 元素', () => {
      // Given: Logo 元件
      // When: 渲染元件
      render(<Logo className="w-14 h-14" animate={false} />);

      // Then: 應該有 SVG 元素
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('應該套用自定義 className', () => {
      // Given: 自定義 className
      const customClass = 'w-20 h-20';

      // When: 渲染元件
      const { container } = render(<Logo className={customClass} animate={false} />);

      // Then: 容器應該有自定義 class
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('w-20', 'h-20');
    });
  });

  describe('當 animate 為 true 時', () => {
    it('應該渲染動畫元素', () => {
      // Given: animate = true
      // When: 渲染元件
      render(<Logo className="w-14 h-14" animate={true} />);

      // Then: 應該有 motion 元素
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
