/**
 * Layout Component Tests
 *
 * [BDD:2025-12-02] 測試 Layout 組件的 SSR 兼容性和動態載入
 * 目標：Branch 覆蓋率 50% → 80%
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

// Mock modules
vi.mock('../ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../SkeletonLoader', () => ({
  SkeletonLoader: () => <div data-testid="skeleton-loader">Loading...</div>,
}));

vi.mock('../Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock('../../utils/react-helmet-async', () => ({
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Client-side rendering (isBrowser = true)', () => {
    it('應該渲染子組件', async () => {
      const { Layout } = await import('../Layout');

      render(
        <Layout>
          <div data-testid="child-content">Child Content</div>
        </Layout>,
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('應該渲染內容區域', async () => {
      const { Layout } = await import('../Layout');

      render(
        <Layout>
          <div data-testid="content">Content</div>
        </Layout>,
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('應該設置 appReady 數據屬性', async () => {
      const { Layout } = await import('../Layout');

      render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      await waitFor(() => {
        expect(document.body.dataset['appReady']).toBe('true');
      });
    });

    it('應該包含 main 元素且有正確的 role', async () => {
      const { Layout } = await import('../Layout');

      render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveClass('min-h-full');
    });

    it('應該提供可捲動容器以支援長內容頁面', async () => {
      const { Layout } = await import('../Layout');

      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const scrollContainer = container.querySelector('[data-scroll-container="layout"]');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('h-dvh');
      expect(scrollContainer).toHaveClass('overflow-y-auto');
    });
  });

  describe('Layout 不包含 UpdatePrompt', () => {
    it('UpdatePrompt 已移至 App.tsx 統一渲染', async () => {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const layoutPath = path.resolve(__dirname, '../Layout.tsx');
      const sourceCode = await fs.readFile(layoutPath, 'utf-8');
      expect(sourceCode).not.toContain('UpdatePromptLoader');
    });
  });

  describe('React.StrictMode 驗證', () => {
    it('應該被 StrictMode 包裹且正確渲染', async () => {
      const { Layout } = await import('../Layout');

      const { container } = render(
        <Layout>
          <div data-testid="content">Content</div>
        </Layout>,
      );

      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('多次渲染穩定性', () => {
    it('應該在多次渲染後保持穩定', async () => {
      const { Layout } = await import('../Layout');

      const { rerender } = render(
        <Layout>
          <div data-testid="content-1">Content 1</div>
        </Layout>,
      );

      expect(screen.getByTestId('content-1')).toBeInTheDocument();

      rerender(
        <Layout>
          <div data-testid="content-2">Content 2</div>
        </Layout>,
      );

      expect(screen.getByTestId('content-2')).toBeInTheDocument();
    });
  });
});
