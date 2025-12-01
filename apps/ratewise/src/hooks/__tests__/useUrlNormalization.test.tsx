/**
 * useUrlNormalization Hook - Tests
 *
 * [BDD:2025-12-02] 測試覆蓋率提升
 * [SEO:2025-12-01] 確保 URL 標準化正確運作
 *
 * 參考：
 * - [context7:testing-library] React Router testing best practices
 * - docs/prompt/BDD.md - BDD 開發流程
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useUrlNormalization, withUrlNormalization } from '../useUrlNormalization';

// Mock window.location.replace
const mockReplace = vi.fn();
const originalLocation = window.location;

beforeEach(() => {
  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      ...originalLocation,
      replace: mockReplace,
    },
    writable: true,
  });
  vi.clearAllMocks();
});

afterEach(() => {
  // Restore window.location
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
  });
});

// Test component that uses the hook
function TestComponent() {
  useUrlNormalization();
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

// Simple component for HOC testing
function SimpleComponent({ message }: { message: string }) {
  return <div data-testid="simple">{message}</div>;
}

describe('useUrlNormalization Hook', () => {
  describe('重定向邏輯', () => {
    it('當 pathname 包含大寫字母時應該重定向', async () => {
      render(
        <MemoryRouter initialEntries={['/Ratewise/']}>
          <TestComponent />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/ratewise/');
      });
    });

    it('當 pathname 全部小寫時不應該重定向', async () => {
      render(
        <MemoryRouter initialEntries={['/ratewise/']}>
          <TestComponent />
        </MemoryRouter>,
      );

      // 等待一小段時間確保 useEffect 執行
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('當 pathname 是根路徑時不應該重定向', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <TestComponent />
        </MemoryRouter>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('應該處理帶有查詢參數的大寫 URL', async () => {
      render(
        <MemoryRouter initialEntries={['/Ratewise/?Test=1']}>
          <TestComponent />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/ratewise/?test=1');
      });
    });

    it('應該處理帶有 hash 的大寫 URL', async () => {
      render(
        <MemoryRouter initialEntries={['/Ratewise/#Section']}>
          <TestComponent />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/ratewise/#section');
      });
    });

    it('應該處理完整的大寫 URL（pathname + search + hash）', async () => {
      render(
        <MemoryRouter initialEntries={['/Ratewise/FAQ/?Page=2#Answer']}>
          <TestComponent />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/ratewise/faq/?page=2#answer');
      });
    });
  });

  describe('邊緣情況', () => {
    it('應該處理多個連續斜線', async () => {
      render(
        <MemoryRouter initialEntries={['/ratewise//faq//']}>
          <TestComponent />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/ratewise/faq/');
      });
    });

    it('應該處理混合大小寫的深層路徑', async () => {
      render(
        <MemoryRouter initialEntries={['/Ratewise/Guide/Section-1/']}>
          <TestComponent />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/ratewise/guide/section-1/');
      });
    });
  });
});

describe('withUrlNormalization HOC', () => {
  it('應該正確包裝組件', () => {
    const WrappedComponent = withUrlNormalization(SimpleComponent);

    render(
      <MemoryRouter initialEntries={['/ratewise/']}>
        <WrappedComponent message="Hello" />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('simple')).toHaveTextContent('Hello');
  });

  it('應該在包裝的組件中應用 URL 標準化', async () => {
    const WrappedComponent = withUrlNormalization(SimpleComponent);

    render(
      <MemoryRouter initialEntries={['/Ratewise/']}>
        <WrappedComponent message="Test" />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/ratewise/');
    });
  });

  it('應該正確傳遞 props 到被包裝的組件', () => {
    const WrappedComponent = withUrlNormalization(SimpleComponent);

    render(
      <MemoryRouter initialEntries={['/ratewise/']}>
        <WrappedComponent message="Custom Message" />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('simple')).toHaveTextContent('Custom Message');
  });

  it('HOC 應該保持組件的顯示名稱', () => {
    const WrappedComponent = withUrlNormalization(SimpleComponent);

    // HOC 返回的組件應該有一個名稱
    expect(WrappedComponent.name).toBe('UrlNormalizedComponent');
  });
});

describe('整合測試', () => {
  it('應該在實際路由環境中正確運作', () => {
    render(
      <MemoryRouter initialEntries={['/ratewise/']}>
        <TestComponent />
      </MemoryRouter>,
    );

    // 組件應該正確渲染
    expect(screen.getByTestId('location')).toHaveTextContent('/ratewise/');
  });

  it('應該只在初始渲染時檢查 URL', async () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/ratewise/']}>
        <TestComponent />
      </MemoryRouter>,
    );

    // 初始渲染不應該觸發重定向
    expect(mockReplace).not.toHaveBeenCalled();

    // 重新渲染也不應該觸發重定向
    rerender(
      <MemoryRouter initialEntries={['/ratewise/']}>
        <TestComponent />
      </MemoryRouter>,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
