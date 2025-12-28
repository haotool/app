/**
 * About Page Tests
 * BDD: Given-When-Then
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterWrapper } from '../test/RouterWrapper';
import { Component as About } from './About';

describe('About Page', () => {
  describe('當使用者訪問關於頁面時', () => {
    it('應該顯示「關於 Quake-School」標題', () => {
      render(
        <RouterWrapper initialEntries={['/about']}>
          <About />
        </RouterWrapper>,
      );

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('關於 Quake-School');
    });

    it('應該顯示使命說明', () => {
      render(
        <RouterWrapper initialEntries={['/about']}>
          <About />
        </RouterWrapper>,
      );

      expect(screen.getByText('我們的使命')).toBeInTheDocument();
    });

    it('應該顯示價值觀區塊', () => {
      render(
        <RouterWrapper initialEntries={['/about']}>
          <About />
        </RouterWrapper>,
      );

      expect(screen.getByText('我們的價值')).toBeInTheDocument();
      expect(screen.getByText('安全第一')).toBeInTheDocument();
      expect(screen.getByText('知識普及')).toBeInTheDocument();
      expect(screen.getByText('社區互助')).toBeInTheDocument();
      expect(screen.getByText('永續免費')).toBeInTheDocument();
    });

    it('應該顯示聯絡資訊', () => {
      render(
        <RouterWrapper initialEntries={['/about']}>
          <About />
        </RouterWrapper>,
      );

      expect(screen.getByText('聯絡我們')).toBeInTheDocument();
      const emailLink = screen.getByRole('link', { name: /haotool.org@gmail.com/i });
      expect(emailLink).toHaveAttribute('href', 'mailto:haotool.org@gmail.com');
    });
  });
});
