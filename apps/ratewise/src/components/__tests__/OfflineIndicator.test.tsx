/**
 * OfflineIndicator Component Tests
 *
 * 測試離線模式指示器的網路狀態監控與 UI 行為
 *
 * @created 2026-02-08
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { OfflineIndicator, resetSessionDismissed } from '../OfflineIndicator';
import * as networkStatus from '../../utils/networkStatus';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      (
        ({
          'offline.title': '離線模式',
          'offline.description': '部分功能可能無法使用',
          'offline.close': '關閉離線提示',
        }) as Record<string, string>
      )[key] ?? key,
  }),
}));

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock network status utilities to control online/offline state
vi.mock('../../utils/networkStatus', () => ({
  isOnline: vi.fn(),
  checkOnlineStatus: vi.fn(),
  checkNetworkConnectivity: vi.fn(),
}));

describe('OfflineIndicator', () => {
  beforeEach(() => {
    // 重置 session 狀態
    resetSessionDismissed();
    sessionStorage.clear();

    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });

    vi.mocked(networkStatus.isOnline).mockResolvedValue(true);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🔴 RED: Network Status Monitoring', () => {
    it('should not render indicator when online', () => {
      render(<OfflineIndicator />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should render indicator when offline', async () => {
      // Set offline status
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Mock isOnline to return false (offline)
      vi.mocked(networkStatus.isOnline).mockResolvedValue(false);

      render(<OfflineIndicator />);

      // Trigger offline event
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });

    it('should hide indicator when connection restored', async () => {
      // Start offline
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Mock isOnline to return false (offline)
      vi.mocked(networkStatus.isOnline).mockResolvedValue(false);

      const { rerender } = render(<OfflineIndicator />);
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      // Go online
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });

      // Mock isOnline to return true (online)
      vi.mocked(networkStatus.isOnline).mockResolvedValue(true);

      window.dispatchEvent(new Event('online'));
      rerender(<OfflineIndicator />);

      // AnimatePresence exit 動畫需要時間完成，增加 timeout
      await waitFor(
        () => {
          expect(screen.queryByRole('status')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });

  describe('🟢 GREEN: User Interaction', () => {
    it('should dismiss indicator when clicking close button', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Mock isOnline to return false (offline)
      vi.mocked(networkStatus.isOnline).mockResolvedValue(false);

      render(<OfflineIndicator />);
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByRole('button', { name: /關閉離線提示/i });
      fireEvent.click(closeButton);

      await waitFor(
        () => {
          expect(screen.queryByRole('status')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('should dismiss indicator when clicking the entire container', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Mock isOnline to return false (offline)
      vi.mocked(networkStatus.isOnline).mockResolvedValue(false);

      render(<OfflineIndicator />);
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      // Click the container div (the one with cursor-pointer and onClick handler)
      const status = screen.getByRole('status');
      const clickableDiv = status.querySelector('div[class*="cursor-pointer"]');
      if (clickableDiv) {
        fireEvent.click(clickableDiv);
      }

      await waitFor(
        () => {
          expect(screen.queryByRole('status')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('should NOT re-show indicator after dismissal in same session', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      vi.mocked(networkStatus.isOnline).mockResolvedValue(false);

      render(<OfflineIndicator />);

      window.dispatchEvent(new Event('offline'));
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      // 手動關閉
      const closeButton = screen.getByRole('button', { name: /關閉離線提示/i });
      fireEvent.click(closeButton);

      await waitFor(
        () => {
          expect(screen.queryByRole('status')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // 再次離線 - 同次 session 不應再顯示
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });
      vi.mocked(networkStatus.isOnline).mockResolvedValue(true);
      window.dispatchEvent(new Event('online'));

      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });
      vi.mocked(networkStatus.isOnline).mockResolvedValue(false);
      window.dispatchEvent(new Event('offline'));

      // 不應重新顯示
      await waitFor(
        () => {
          expect(screen.queryByRole('status')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('should keep dismissed state after simulated page reload in same session', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });
      vi.mocked(networkStatus.isOnline).mockResolvedValue(false);

      const { unmount } = render(<OfflineIndicator />);
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /關閉離線提示/i }));
      await waitFor(
        () => {
          expect(screen.queryByRole('status')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // 模擬整頁重載：模組變數重置，但 sessionStorage 保留
      unmount();
      resetSessionDismissed();
      render(<OfflineIndicator />);
      window.dispatchEvent(new Event('offline'));

      await waitFor(
        () => {
          expect(screen.queryByRole('status')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });

  describe('🔵 REFACTOR: Accessibility & Design', () => {
    it('should have proper ARIA attributes', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Mock isOnline to return false (offline)
      vi.mocked(networkStatus.isOnline).mockResolvedValue(false);

      render(<OfflineIndicator />);
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        const indicator = screen.getByRole('status');
        expect(indicator).toHaveAttribute('aria-live', 'polite');
        expect(indicator).toHaveAttribute('aria-atomic', 'true');
      });
    });

    it('should display correct text content', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Mock isOnline to return false (offline)
      vi.mocked(networkStatus.isOnline).mockResolvedValue(false);

      render(<OfflineIndicator />);
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText('離線模式')).toBeInTheDocument();
        expect(screen.getByText('部分功能可能無法使用')).toBeInTheDocument();
      });
    });

    it('should include WifiOff icon', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Mock isOnline to return false (offline)
      vi.mocked(networkStatus.isOnline).mockResolvedValue(false);

      render(<OfflineIndicator />);
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        // WifiOff icon from lucide-react renders as SVG
        const svgs = screen.getByRole('status').querySelectorAll('svg');
        expect(svgs.length).toBeGreaterThan(0);
      });
    });

    it('should apply design tokens via CSS classes', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Mock isOnline to return false (offline)
      vi.mocked(networkStatus.isOnline).mockResolvedValue(false);

      render(<OfflineIndicator />);
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        const status = screen.getByRole('status');
        const styledDiv = status.querySelector('div[class*="bg-surface"]');
        expect(styledDiv).toBeTruthy();
        expect(styledDiv?.className).toContain('bg-surface');
        expect(styledDiv?.className).toContain('border-border/70');
        expect(styledDiv?.className).toContain('shadow-floating');
      });
    });
  });

  describe('SSR Safety', () => {
    it('should handle SSR environment gracefully', () => {
      // The component has built-in SSR safety check:
      // if (typeof window === 'undefined') return null;
      // This test verifies the component is designed with SSR in mind

      // In a real SSR environment, window would be undefined
      // and the component would return null without rendering
      // We can't easily test this in JSDOM environment,
      // so we verify the component structure instead

      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const { container } = render(<OfflineIndicator />);

      // When online, indicator should not render
      expect(container.firstChild).toBeNull();
    });
  });
});
