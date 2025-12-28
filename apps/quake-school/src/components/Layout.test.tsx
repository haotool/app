/**
 * Layout Tests
 * BDD: Given-When-Then
 *
 * 建立時間: 2025-12-29T02:27:28+08:00
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';

describe('Layout Component', () => {
  const renderWithRouter = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div>Home Content</div>} />
            <Route path="about" element={<div>About Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  };

  describe('當 Layout 渲染時', () => {
    it('應該顯示 header 和 footer', () => {
      renderWithRouter();

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('應該顯示導航連結', () => {
      renderWithRouter();

      // 導航區域中的連結
      const nav = screen.getByRole('navigation', { name: /主要導航/i });
      expect(nav).toBeInTheDocument();

      // 檢查連結存在（使用 getAllByRole 處理多個首頁連結）
      const homeLinks = screen.getAllByRole('link', { name: /首頁/i });
      expect(homeLinks.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('link', { name: /防災指南/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /常見問題/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /關於/i })).toBeInTheDocument();
    });

    it('應該包含 skip link 以提升無障礙性', () => {
      renderWithRouter();

      const skipLink = screen.getByRole('link', { name: /跳至主要內容/i });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('主要內容區塊應該有正確的 id', () => {
      renderWithRouter();

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
    });
  });

  describe('無障礙性', () => {
    it('導航應該有 aria-label', () => {
      renderWithRouter();

      const nav = screen.getByRole('navigation', { name: /主要導航/i });
      expect(nav).toBeInTheDocument();
    });

    it('當前頁面連結應該有 aria-current', () => {
      renderWithRouter('/');

      // 使用 getAllByRole 並找到有 aria-current 的連結
      const homeLinks = screen.getAllByRole('link', { name: /首頁/i });
      const activeLink = homeLinks.find((link) => link.getAttribute('aria-current') === 'page');
      expect(activeLink).toBeDefined();
      expect(activeLink).toHaveAttribute('aria-current', 'page');
    });
  });
});
