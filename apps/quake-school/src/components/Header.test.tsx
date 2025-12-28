/**
 * Header 元件測試
 * [BDD 測試策略 - Given-When-Then]
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('Header 元件', () => {
  describe('當渲染時', () => {
    it('應該顯示預設標題', () => {
      // Given: Header 元件
      const mockOnBack = vi.fn();

      // When: 渲染元件
      renderWithRouter(<Header onBack={mockOnBack} />);

      // Then: 應該顯示預設標題
      expect(screen.getByText('地震小學堂')).toBeInTheDocument();
    });

    it('應該顯示自定義標題', () => {
      // Given: 自定義標題
      const mockOnBack = vi.fn();
      const customTitle = '課程學習';

      // When: 渲染元件
      renderWithRouter(<Header onBack={mockOnBack} title={customTitle} />);

      // Then: 應該顯示自定義標題
      expect(screen.getByText(customTitle)).toBeInTheDocument();
    });
  });

  describe('當點擊返回按鈕時', () => {
    it('應該觸發 onBack 回調', () => {
      // Given: 返回按鈕
      const mockOnBack = vi.fn();
      renderWithRouter(<Header onBack={mockOnBack} />);

      // When: 點擊返回按鈕
      const backButton = screen.getByRole('button', { name: /返回首頁/i });
      fireEvent.click(backButton);

      // Then: onBack 應該被呼叫
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });
});
