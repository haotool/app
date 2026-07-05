/**
 * SplashScreen 測試
 *
 * 驗證：standalone 才自動顯示、偏好可關閉、預覽事件強制顯示、
 * 停留後自動淡出卸載、每次載入僅自動顯示一次。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SplashScreen } from '../SplashScreen';
import {
  SPLASH_PREVIEW_EVENT,
  isSplashEnabled,
  setSplashEnabled,
  __resetSplashAutoShowForTests,
} from '../../utils/splashPreference';
import { APP_INFO } from '../../config/app-info';

function mockMatchMedia(matchedQueries: string[]) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: matchedQueries.some((matched) => query.includes(matched)),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

/** 掛載後 flush 自動顯示的 macrotask。 */
function flushAutoShow() {
  act(() => {
    vi.advanceTimersByTime(0);
  });
}

describe('SplashScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    sessionStorage.clear();
    __resetSplashAutoShowForTests();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('瀏覽器分頁（非 standalone）不自動顯示', () => {
    mockMatchMedia([]);
    render(<SplashScreen />);
    flushAutoShow();
    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
  });

  it('standalone 且偏好開啟時自動顯示，停留後自動淡出並卸載', () => {
    mockMatchMedia(['display-mode: standalone']);
    render(<SplashScreen />);
    flushAutoShow();

    const splash = screen.getByTestId('splash-screen');
    expect(splash).toBeInTheDocument();
    expect(splash).toHaveAttribute('data-phase', 'enter');

    // 停留結束 → 淡出。
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByTestId('splash-screen')).toHaveAttribute('data-phase', 'exit');

    // 淡出結束 → 卸載。
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
  });

  it('偏好關閉時 standalone 也不顯示', () => {
    mockMatchMedia(['display-mode: standalone']);
    setSplashEnabled(false);
    render(<SplashScreen />);
    flushAutoShow();
    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
  });

  it('inline splash 本 session 已顯示時不自動顯示（避免雙重播放），預覽事件仍可播放', () => {
    mockMatchMedia(['display-mode: standalone']);
    sessionStorage.setItem('rw-splash-shown', '1');
    render(<SplashScreen />);
    flushAutoShow();
    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent(SPLASH_PREVIEW_EVENT));
    });
    expect(screen.getByTestId('splash-screen')).toBeInTheDocument();
  });

  it('預覽事件在瀏覽器模式也強制顯示', () => {
    mockMatchMedia([]);
    render(<SplashScreen />);
    flushAutoShow();
    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent(SPLASH_PREVIEW_EVENT));
    });
    expect(screen.getByTestId('splash-screen')).toBeInTheDocument();
  });

  it('每次頁面載入只自動顯示一次（remount 不重播）', () => {
    mockMatchMedia(['display-mode: standalone']);
    const { unmount } = render(<SplashScreen />);
    flushAutoShow();
    expect(screen.getByTestId('splash-screen')).toBeInTheDocument();
    unmount();

    render(<SplashScreen />);
    flushAutoShow();
    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
  });

  it('點擊啟動頁可提前進入淡出', () => {
    mockMatchMedia(['display-mode: standalone']);
    render(<SplashScreen />);
    flushAutoShow();

    const splash = screen.getByTestId('splash-screen');
    act(() => {
      splash.click();
    });
    expect(splash).toHaveAttribute('data-phase', 'exit');
  });

  it('顯示品牌 wordmark 與副標（Brand SSOT）', () => {
    mockMatchMedia(['display-mode: standalone']);
    render(<SplashScreen />);
    flushAutoShow();

    const splash = screen.getByTestId('splash-screen');
    expect(splash.textContent).toContain(APP_INFO.shortName);
    expect(splash.textContent).toContain(APP_INFO.subtitle);
  });

  it('wordmark 拆分串接必須等於品牌短名（SSOT 不變量）', () => {
    expect(APP_INFO.wordmarkPrefix + APP_INFO.wordmarkAccent).toBe(APP_INFO.shortName);
  });

  it('偏好 helpers：預設開啟、可持久化關閉', () => {
    expect(isSplashEnabled()).toBe(true);
    setSplashEnabled(false);
    expect(isSplashEnabled()).toBe(false);
    expect(localStorage.getItem('ratewise-splash-enabled')).toBe('0');
    setSplashEnabled(true);
    expect(isSplashEnabled()).toBe(true);
  });
});
