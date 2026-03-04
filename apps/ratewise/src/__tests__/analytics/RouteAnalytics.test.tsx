/**
 * RouteAnalytics 元件單元測試
 *
 * 驗證重點：
 * 1. 元件渲染為 null，無 DOM 輸出
 * 2. 初始 mount 跳過 trackPageview（避免與 isClient 手動呼叫重複）
 * 3. 路由變更時呼叫 trackPageview
 * 4. 連續路由變更時每次均觸發
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { RouteAnalytics } from '@shared/analytics';

// Mock ga 模組，隔離 trackPageview 的副作用
vi.mock('@shared/analytics/ga', () => ({
  trackPageview: vi.fn(),
  trackEvent: vi.fn(),
  initGA: vi.fn(),
}));

// 取得 mock 後的 trackPageview
const getTrackPageview = async () => {
  const mod = await import('@shared/analytics/ga');
  return vi.mocked(mod.trackPageview);
};

/** 觸發 SPA 路由切換的輔助元件 */
function NavTrigger({ to }: { to: string }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => void navigate(to)} data-testid="nav-btn">
      Go
    </button>
  );
}

describe('RouteAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('渲染為 null，不產生 DOM 節點', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <RouteAnalytics />
      </MemoryRouter>,
    );
    // RouteAnalytics 回傳 null，container 應為空的 div wrapper
    expect(container.firstChild).toBeNull();
  });

  it('初始 mount 不呼叫 trackPageview', async () => {
    const trackPageview = await getTrackPageview();

    render(
      <MemoryRouter initialEntries={['/']}>
        <RouteAnalytics />
      </MemoryRouter>,
    );

    expect(trackPageview).not.toHaveBeenCalled();
  });

  it('路由變更時呼叫 trackPageview（含 pathname）', async () => {
    const trackPageview = await getTrackPageview();

    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/']}>
        <RouteAnalytics />
        <Routes>
          <Route path="/" element={<NavTrigger to="/about" />} />
          <Route path="/about" element={<span>About</span>} />
        </Routes>
      </MemoryRouter>,
    );

    // act(sync) 保證 useEffect 在 call 結束前 flush
    act(() => {
      getByTestId('nav-btn').click();
    });

    expect(trackPageview).toHaveBeenCalledTimes(1);
    expect(trackPageview).toHaveBeenCalledWith('/about');
  });

  it('連續路由變更時每次均觸發', async () => {
    const trackPageview = await getTrackPageview();

    const { getByTestId, rerender } = render(
      <MemoryRouter initialEntries={['/']}>
        <RouteAnalytics />
        <Routes>
          <Route path="/" element={<NavTrigger to="/faq" />} />
          <Route path="/faq" element={<NavTrigger to="/about" />} />
          <Route path="/about" element={<span>About</span>} />
        </Routes>
      </MemoryRouter>,
    );

    // 第一次導航：/ → /faq
    act(() => {
      getByTestId('nav-btn').click();
    });

    // 第二次導航：/faq → /about
    act(() => {
      getByTestId('nav-btn').click();
    });

    expect(trackPageview).toHaveBeenCalledTimes(2);
    expect(trackPageview).toHaveBeenNthCalledWith(1, '/faq');
    expect(trackPageview).toHaveBeenNthCalledWith(2, '/about');

    void rerender(<></>);
  });

  it('路由含 search string 時完整傳遞', async () => {
    const trackPageview = await getTrackPageview();

    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/']}>
        <RouteAnalytics />
        <Routes>
          <Route path="/" element={<NavTrigger to="/search?q=USD" />} />
          <Route path="/search" element={<span>Search</span>} />
        </Routes>
      </MemoryRouter>,
    );

    act(() => {
      getByTestId('nav-btn').click();
    });

    expect(trackPageview).toHaveBeenCalledWith('/search?q=USD');
  });
});
