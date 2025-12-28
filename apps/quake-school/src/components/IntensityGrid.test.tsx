/**
 * IntensityGrid 元件測試
 * [BDD 測試策略 - Given-When-Then]
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import IntensityGrid from './IntensityGrid';

describe('IntensityGrid 元件', () => {
  describe('當渲染時', () => {
    it('應該顯示所有震度等級', () => {
      // Given: IntensityGrid 元件
      // When: 渲染元件
      render(<IntensityGrid />);

      // Then: 應該顯示震度等級
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5弱')).toBeInTheDocument();
      expect(screen.getByText('5強')).toBeInTheDocument();
      expect(screen.getByText('6弱')).toBeInTheDocument();
      expect(screen.getByText('6強')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('應該顯示震度描述', () => {
      // Given: IntensityGrid 元件
      // When: 渲染元件
      render(<IntensityGrid />);

      // Then: 應該顯示震度描述（使用 getAllByText 因為可能有多個匹配）
      expect(screen.getAllByText(/無感/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/微震/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/劇震/i).length).toBeGreaterThan(0);
    });
  });
});
