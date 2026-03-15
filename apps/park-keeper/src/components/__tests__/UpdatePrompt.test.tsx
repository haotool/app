import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UpdatePrompt } from '../UpdatePrompt';
import { useUpdatePrompt } from '@app/park-keeper/hooks/useUpdatePrompt';

// useUpdatePrompt mock — 由 vi.mock 注入，各測試可透過 mockReturnValue 覆寫
const mockHandleUpdate = vi.fn();
const mockHandleDismiss = vi.fn();
const mockSetOfflineReady = vi.fn();

vi.mock('@app/park-keeper/hooks/useUpdatePrompt', () => ({
  useUpdatePrompt: vi.fn(() => ({
    offlineReady: false,
    setOfflineReady: mockSetOfflineReady,
    needRefresh: false,
    setNeedRefresh: vi.fn(),
    isUpdating: false,
    updateFailed: false,
    handleUpdate: mockHandleUpdate,
    handleDismiss: mockHandleDismiss,
  })),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'pwa.offlineReady': '已可離線使用',
        'pwa.needRefresh': '正在更新至新版本…',
        'pwa.updateFailed': '更新失敗，請重試。',
        'pwa.actionRetry': '重試',
        'pwa.actionDismiss': '關閉',
      };
      return map[key] ?? key;
    },
    i18n: { changeLanguage: vi.fn() },
  }),
}));

const mockUseUpdatePrompt = vi.mocked(useUpdatePrompt);

describe('UpdatePrompt', () => {
  beforeEach(() => {
    mockHandleUpdate.mockResolvedValue(undefined);
    vi.useFakeTimers();
    // 預設：無更新、無離線就緒
    mockUseUpdatePrompt.mockReturnValue({
      offlineReady: false,
      setOfflineReady: mockSetOfflineReady,
      needRefresh: false,
      setNeedRefresh: vi.fn(),
      isUpdating: false,
      updateFailed: false,
      handleUpdate: mockHandleUpdate,
      handleDismiss: mockHandleDismiss,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('預設不顯示任何提示', () => {
    render(<UpdatePrompt />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('offlineReady 時顯示離線就緒提示（role=status）', () => {
    mockUseUpdatePrompt.mockReturnValue({
      offlineReady: true,
      setOfflineReady: mockSetOfflineReady,
      needRefresh: false,
      setNeedRefresh: vi.fn(),
      isUpdating: false,
      updateFailed: false,
      handleUpdate: mockHandleUpdate,
      handleDismiss: mockHandleDismiss,
    });
    render(<UpdatePrompt />);
    const toast = screen.getByRole('status');
    expect(toast).toBeTruthy();
    expect(toast.textContent).toContain('離線');
  });

  it('offlineReady 提示 3 秒後呼叫 setOfflineReady(false)', () => {
    mockUseUpdatePrompt.mockReturnValue({
      offlineReady: true,
      setOfflineReady: mockSetOfflineReady,
      needRefresh: false,
      setNeedRefresh: vi.fn(),
      isUpdating: false,
      updateFailed: false,
      handleUpdate: mockHandleUpdate,
      handleDismiss: mockHandleDismiss,
    });
    render(<UpdatePrompt />);
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(mockSetOfflineReady).toHaveBeenCalledWith(false);
  });

  it('updateFailed 時顯示錯誤 Toast（role=alert）與重試按鈕', () => {
    mockUseUpdatePrompt.mockReturnValue({
      offlineReady: false,
      setOfflineReady: mockSetOfflineReady,
      needRefresh: true,
      setNeedRefresh: vi.fn(),
      isUpdating: false,
      updateFailed: true,
      handleUpdate: mockHandleUpdate,
      handleDismiss: mockHandleDismiss,
    });
    render(<UpdatePrompt />);
    expect(screen.getByRole('alert')).toBeTruthy();
    const retryBtn = screen.getByRole('button', { name: '重試' });
    expect(retryBtn).toBeTruthy();
  });

  it('點擊重試按鈕呼叫 handleUpdate', () => {
    mockUseUpdatePrompt.mockReturnValue({
      offlineReady: false,
      setOfflineReady: mockSetOfflineReady,
      needRefresh: true,
      setNeedRefresh: vi.fn(),
      isUpdating: false,
      updateFailed: true,
      handleUpdate: mockHandleUpdate,
      handleDismiss: mockHandleDismiss,
    });
    render(<UpdatePrompt />);
    const retryBtn = screen.getByRole('button', { name: '重試' });
    act(() => {
      fireEvent.click(retryBtn);
    });
    expect(mockHandleUpdate).toHaveBeenCalledTimes(1);
  });

  it('點擊關閉按鈕呼叫 handleDismiss', () => {
    mockUseUpdatePrompt.mockReturnValue({
      offlineReady: true,
      setOfflineReady: mockSetOfflineReady,
      needRefresh: false,
      setNeedRefresh: vi.fn(),
      isUpdating: false,
      updateFailed: false,
      handleUpdate: mockHandleUpdate,
      handleDismiss: mockHandleDismiss,
    });
    render(<UpdatePrompt />);
    const closeBtn = screen.getByRole('button', { name: '關閉' });
    fireEvent.click(closeBtn);
    expect(mockHandleDismiss).toHaveBeenCalledTimes(1);
  });
});
