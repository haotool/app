/**
 * ThemeToggle Component Tests
 *
 * @file ThemeToggle.test.tsx
 * @description 測試主題切換器組件功能
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeToggle, ThemeToggleCompact } from '../ThemeToggle';
import * as useThemeModule from '../../hooks/useTheme';

// Mock useTheme Hook
const mockSetTheme = vi.fn();

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    vi.spyOn(useThemeModule, 'useTheme').mockReturnValue({
      theme: 'light',
      mode: 'auto',
      setTheme: mockSetTheme,
    });
  });

  describe('渲染', () => {
    it('應該正確渲染淺色主題狀態', () => {
      render(<ThemeToggle />);
      expect(screen.getByText('淺色')).toBeInTheDocument();
      expect(screen.getByLabelText('切換為深色主題')).toBeInTheDocument();
    });

    it('應該正確渲染深色主題狀態', () => {
      vi.spyOn(useThemeModule, 'useTheme').mockReturnValue({
        theme: 'dark',
        mode: 'dark',
        setTheme: mockSetTheme,
      });

      render(<ThemeToggle />);
      expect(screen.getByText('深色')).toBeInTheDocument();
      expect(screen.getByLabelText('切換為淺色主題')).toBeInTheDocument();
    });
  });

  describe('主題切換', () => {
    it('應該在點擊時切換為深色主題', () => {
      render(<ThemeToggle />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
      expect(mockSetTheme).toHaveBeenCalledTimes(1);
    });

    it('應該在點擊時切換為淺色主題', () => {
      vi.spyOn(useThemeModule, 'useTheme').mockReturnValue({
        theme: 'dark',
        mode: 'dark',
        setTheme: mockSetTheme,
      });

      render(<ThemeToggle />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith('light');
      expect(mockSetTheme).toHaveBeenCalledTimes(1);
    });
  });

  describe('無障礙', () => {
    it('應該包含正確的 aria-label', () => {
      render(<ThemeToggle />);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-label', '切換為深色主題');
    });

    it('應該包含正確的 title 屬性', () => {
      render(<ThemeToggle />);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('title', '切換為深色主題');
    });
  });

  describe('樣式', () => {
    it('應該包含 focus ring 樣式', () => {
      render(<ThemeToggle />);
      const button = screen.getByRole('button');

      expect(button.className).toContain('focus:ring-2');
      expect(button.className).toContain('focus:ring-primary-ring');
    });

    it('應該包含 hover 和 active 狀態樣式', () => {
      render(<ThemeToggle />);
      const button = screen.getByRole('button');

      expect(button.className).toContain('hover:bg-neutral');
      expect(button.className).toContain('active:bg-neutral-dark');
    });
  });
});

describe('ThemeToggleCompact Component', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    vi.spyOn(useThemeModule, 'useTheme').mockReturnValue({
      theme: 'light',
      mode: 'auto',
      setTheme: mockSetTheme,
    });
  });

  describe('渲染', () => {
    it('應該正確渲染緊湊版按鈕', () => {
      render(<ThemeToggleCompact />);
      const button = screen.getByRole('button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', '切換為深色主題');
    });

    it('應該不顯示文字標籤', () => {
      render(<ThemeToggleCompact />);

      expect(screen.queryByText('淺色')).not.toBeInTheDocument();
      expect(screen.queryByText('深色')).not.toBeInTheDocument();
    });
  });

  describe('主題切換', () => {
    it('應該在點擊時切換主題', () => {
      render(<ThemeToggleCompact />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
      expect(mockSetTheme).toHaveBeenCalledTimes(1);
    });
  });

  describe('無障礙', () => {
    it('應該包含描述當前模式的 title 屬性', () => {
      render(<ThemeToggleCompact />);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('title', '當前：淺色模式');
    });
  });
});
