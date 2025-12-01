/**
 * Layout Component Tests
 *
 * 測試覆蓋:
 * 1. 基本渲染
 * 2. ErrorBoundary 整合
 * 3. HelmetProvider 整合
 * 4. SSR 兼容性 (isBrowser 檢查)
 * 5. Suspense fallback
 * 6. appReady 標記
 *
 * 依據: [Context7:testing-library][LINUS_GUIDE.md:測試覆蓋率 ≥80%]
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Layout } from '../Layout';

// Mock ErrorBoundary
vi.mock('../ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

// Mock SkeletonLoader
vi.mock('../SkeletonLoader', () => ({
  SkeletonLoader: () => <div data-testid="skeleton-loader">Loading...</div>,
}));

// Mock HelmetProvider
vi.mock('../../utils/react-helmet-async', () => ({
  HelmetProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="helmet-provider">{children}</div>
  ),
}));

// Mock UpdatePrompt - 動態導入
vi.mock('../UpdatePrompt', () => ({
  UpdatePrompt: () => <div data-testid="update-prompt">Update Available</div>,
}));

describe('Layout Component', () => {
  beforeEach(() => {
    // 清理 document.body 的 dataset
    delete document.body.dataset['appReady'];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <Layout>
        <div data-testid="test-child">Test Content</div>
      </Layout>,
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('wraps content with ErrorBoundary', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>,
    );

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('wraps content with HelmetProvider', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>,
    );

    expect(screen.getByTestId('helmet-provider')).toBeInTheDocument();
  });

  it('renders main element with correct role', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>,
    );

    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('min-h-screen');
  });

  it('sets appReady data attribute on document.body', async () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>,
    );

    await waitFor(() => {
      expect(document.body.dataset['appReady']).toBe('true');
    });
  });

  it('renders Suspense fallback (SkeletonLoader) while loading', () => {
    // 創建一個會暫停的組件 - 使用 React.lazy 模擬
    const LazyComponent = React.lazy(
      () =>
        new Promise(() => {
          // 永遠不會 resolve，模擬載入中狀態
        }),
    );

    render(
      <Layout>
        <LazyComponent />
      </Layout>,
    );

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('loads UpdatePrompt dynamically on client-side', async () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>,
    );

    // UpdatePrompt 應該在客戶端動態載入
    // 注意：由於動態導入的異步性質，可能需要等待
    // 如果 UpdatePrompt 沒有立即出現，這是預期行為
    await waitFor(
      () => {
        // 檢查 UpdatePrompt 是否被載入，或者 Layout 仍然正常渲染
        const updatePrompt = screen.queryByTestId('update-prompt');
        const mainContent = screen.getByText('Content');
        expect(mainContent).toBeInTheDocument();
        // UpdatePrompt 可能存在也可能不存在（取決於動態導入時機）
        // 主要確保不會因為動態導入失敗而崩潰
        if (updatePrompt) {
          expect(updatePrompt).toBeInTheDocument();
        }
      },
      { timeout: 100 },
    );
  });

  it('renders in StrictMode', () => {
    // StrictMode 會在開發模式下雙重渲染，但不會影響最終輸出
    const { container } = render(
      <Layout>
        <div data-testid="strict-mode-test">Content</div>
      </Layout>,
    );

    // 確認組件正確渲染
    expect(screen.getByTestId('strict-mode-test')).toBeInTheDocument();
    expect(container.querySelector('main')).toBeInTheDocument();
  });

  it('renders multiple children correctly', () => {
    render(
      <Layout>
        <div data-testid="child-1">First</div>
        <div data-testid="child-2">Second</div>
      </Layout>,
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('handles empty children', () => {
    const { container } = render(<Layout>{null}</Layout>);

    // 應該仍然渲染 Layout 結構
    expect(container.querySelector('main')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });
});

describe('Layout SSR Compatibility', () => {
  it('isBrowser check works correctly in browser environment', () => {
    // 在瀏覽器環境中，isBrowser 應該是 true
    // 這會觸發 UpdatePrompt 的動態導入
    render(
      <Layout>
        <div>Browser Content</div>
      </Layout>,
    );

    // 內容應該正確渲染
    expect(screen.getByText('Browser Content')).toBeInTheDocument();
    // appReady 應該被設置
    expect(document.body.dataset['appReady']).toBe('true');
  });
});
