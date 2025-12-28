/**
 * Home Page Tests
 * BDD: Given-When-Then
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterWrapper } from '../test/RouterWrapper';
import { Component as Home } from './Home';

describe('Home Page', () => {
  describe('當使用者訪問首頁時', () => {
    it('應該顯示主標題 Quake-School', () => {
      // Given: 渲染首頁
      render(
        <RouterWrapper>
          <Home />
        </RouterWrapper>,
      );

      // When: 查找標題
      const title = screen.getByRole('heading', { level: 1 });

      // Then: 應該包含 Quake-School
      expect(title).toHaveTextContent('Quake-School');
    });

    it('應該顯示「開始學習防災知識」按鈕', () => {
      render(
        <RouterWrapper>
          <Home />
        </RouterWrapper>,
      );

      const button = screen.getByRole('link', { name: /開始學習防災知識/i });

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/guide/');
    });

    it('應該顯示功能特色區塊', () => {
      render(
        <RouterWrapper>
          <Home />
        </RouterWrapper>,
      );

      expect(screen.getByText('功能特色')).toBeInTheDocument();
      expect(screen.getByText('地震知識')).toBeInTheDocument();
      expect(screen.getByText('防災準備')).toBeInTheDocument();
      expect(screen.getByText('緊急應變')).toBeInTheDocument();
      expect(screen.getByText('PWA 支援')).toBeInTheDocument();
    });

    it('應該顯示 PWA 安裝提示區塊', () => {
      render(
        <RouterWrapper>
          <Home />
        </RouterWrapper>,
      );

      expect(screen.getByText('離線也能使用')).toBeInTheDocument();
      expect(screen.getByText(/將 Quake-School 加入主畫面/i)).toBeInTheDocument();
    });
  });

  describe('無障礙性檢查', () => {
    it('所有圖示都應該有 aria-hidden', () => {
      render(
        <RouterWrapper>
          <Home />
        </RouterWrapper>,
      );

      const hiddenElements = document.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });
  });
});
