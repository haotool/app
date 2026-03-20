/**
 * NotFound.tsx BDD Tests - SEO Phase 2A-2
 *
 * BDD 測試：驗證 404 頁面元件的功能與 SEO 配置
 *
 * 測試策略：
 * - 🔴 NotFound 元件應該存在並可渲染
 * - 🔴 應該顯示明確的 "404 找不到頁面" 訊息
 * - 🔴 應該有 "返回首頁" 按鈕並正確導航
 * - 🔴 應該提供其他頁面建議連結（FAQ、About）
 * - 🔴 應該設定 SEOHelmet with noindex meta tag
 *
 * 參考：fix/seo-phase2a-bdd-approach
 * 依據：[SEO 審查報告 2025-11-25] 404 頁面 SEO 最佳實踐
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// 🔴 RED: 這個 import 會失敗，因為 NotFound 元件尚未建立
import NotFound from './NotFound';

describe('NotFound Component - 404 Page (BDD)', () => {
  // 測試輔助函數：渲染元件
  const renderNotFound = () => {
    return render(
      <HelmetProvider>
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      </HelmetProvider>,
    );
  };

  describe('🔴 RED: NotFound 元件基本功能', () => {
    it('should render without crashing', () => {
      // 🔴 紅燈：元件不存在，這個測試會失敗
      expect(() => renderNotFound()).not.toThrow();
    });

    it('should display 404 error message', () => {
      renderNotFound();

      // 應該包含 "404" 標題文字
      expect(screen.getByText(/404/i)).toBeInTheDocument();

      // 使用 getByRole 找到 h2 標題元素，更精確
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/找不到頁面|頁面不存在/i);

      // 確認有錯誤說明文字（i18n：notFound.message）
      expect(screen.getByText(/您.*頁面不存在|您訪問的頁面不存在/i)).toBeInTheDocument();
    });

    it('should have a "返回首頁" button', () => {
      renderNotFound();

      // 🔴 紅燈：應該有返回首頁的按鈕或連結
      const homeLink = screen.getByRole('link', { name: /返回首頁|回首頁|home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('🔴 RED: 其他頁面建議連結', () => {
    it('should suggest FAQ page link', () => {
      renderNotFound();

      // 🔴 紅燈：應該有 FAQ 頁面連結
      const faqLink = screen.getByRole('link', { name: /常見問題|FAQ/i });
      expect(faqLink).toBeInTheDocument();
      expect(faqLink).toHaveAttribute('href', '/faq/');
    });

    it('should suggest About page link', () => {
      renderNotFound();

      // 🔴 紅燈：應該有 About 頁面連結
      const aboutLink = screen.getByRole('link', { name: /關於|About/i });
      expect(aboutLink).toBeInTheDocument();
      expect(aboutLink).toHaveAttribute('href', '/about/');
    });
  });

  describe('🔴 RED: SEO Configuration', () => {
    it('should have SEOHelmet component with noindex', async () => {
      // 🔴 紅燈：讀取源碼確認包含 SEOHelmet 與 noindex 設定
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const notFoundPath = path.resolve(__dirname, 'NotFound.tsx');
      const notFoundContent = await fs.readFile(notFoundPath, 'utf-8');

      // 確認包含 SEOHelmet import
      expect(notFoundContent).toContain("import { SEOHelmet } from '../components/SEOHelmet'");

      // 確認包含 <SEOHelmet 使用
      expect(notFoundContent).toContain('<SEOHelmet');

      // 確認包含 noindex 設定
      expect(notFoundContent).toMatch(/robots.*noindex/i);
    });

    it('should have proper page title for 404', async () => {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const notFoundPath = path.resolve(__dirname, 'NotFound.tsx');
      const notFoundContent = await fs.readFile(notFoundPath, 'utf-8');

      // 🔴 紅燈：確認 SEOHelmet 包含 404 相關標題
      expect(notFoundContent).toMatch(/title.*404|找不到頁面/i);
    });
  });

  describe('🔴 RED: User Experience', () => {
    it('should have helpful error message explaining what happened', () => {
      renderNotFound();

      // 🔴 紅燈：應該有友善的錯誤說明文字
      // 範例：「您訪問的頁面不存在」、「請檢查網址是否正確」等
      const container = screen.getByRole('main');
      const text = container.textContent;

      expect(text).toMatch(/您.*頁面|這個頁面|網址|連結|已被移除/i);
    });

    it('should be visually styled consistently with the app', () => {
      renderNotFound();

      // 🔴 紅燈：確認有適當的容器結構
      // 至少應該有 main role 和適當的 className
      const main = screen.getByRole('main');
      expect(main).toHaveClass(/container|min-h-screen|flex|items-center/);
    });
  });
});
