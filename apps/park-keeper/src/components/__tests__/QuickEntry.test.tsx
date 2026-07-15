import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import QuickEntry from '../QuickEntry';
import i18n from '@app/park-keeper/services/i18n';
import { plateMemory } from '@app/park-keeper/services/plateMemory';
import type { ThemeConfig } from '@app/park-keeper/types';

// Mock MiniMap component
vi.mock('../MiniMap', () => ({
  default: vi.fn(() => <div data-testid="mini-map">MiniMap</div>),
}));

// Mock hooks
vi.mock('@app/park-keeper/hooks/useDeviceOrientation', () => ({
  useDeviceOrientation: vi.fn(() => ({
    heading: null,
    tilt: null,
    isPhoneFlat: false,
    isSupported: true,
  })),
}));

// Mock geolocation
const mockGeolocation = {
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
  getCurrentPosition: vi.fn(),
};

const mockTheme: ThemeConfig = {
  id: 'minimalist',
  name: 'Minimalist',
  colors: {
    primary: '#000000',
    secondary: '#666666',
    accent: '#0066ff',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#000000',
    textMuted: '#666666',
  },
  font: 'system-ui',
  borderRadius: '12px',
  animationType: 'spring',
};

describe('QuickEntry - 車牌自動載入與清空功能', () => {
  beforeEach(async () => {
    // 設定 i18n 語言為繁中
    await i18n.changeLanguage('zh-TW');

    // Mock localStorage
    global.localStorage.clear();

    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: mockGeolocation,
      vibrate: vi.fn(),
    });

    mockGeolocation.watchPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 25.033,
          longitude: 121.5654,
          accuracy: 10,
          heading: null,
        },
      } as GeolocationPosition);
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('應該在儲存成功後、重新開啟時保留上次車牌號碼', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    // 第一次掛載：輸入車牌並儲存成功
    const { unmount } = render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={onClose} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    const plateInput = screen.getByPlaceholderText(/車牌/i);
    fireEvent.change(plateInput, { target: { value: 'ABC-1234' } });
    expect(plateInput).toHaveValue('ABC-1234');

    fireEvent.click(screen.getByText('B2'));
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    // 卸載組件（模擬關閉面板）
    unmount();

    // 重新掛載組件（模擬重新開啟面板）
    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={onClose} />
      </I18nextProvider>,
    );

    // 等待地圖載入並驗證車牌仍然存在
    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());
    const plateInputAfterReopen = screen.getByPlaceholderText(/車牌/i);
    expect(plateInputAfterReopen).toHaveValue('ABC-1234');
  });

  it('RED: 車牌輸入框應該顯示清空按鈕（當有內容時）', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={onClose} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    const plateInput = screen.getByPlaceholderText(/車牌/i);

    // 初始狀態：沒有清空按鈕
    expect(screen.queryByLabelText(/清空車牌/i)).not.toBeInTheDocument();

    // 輸入車牌後：出現清空按鈕
    fireEvent.change(plateInput, { target: { value: 'ABC-1234' } });
    await waitFor(() => {
      expect(screen.getByLabelText(/清空車牌/i)).toBeInTheDocument();
    });
  });

  it('RED: 點擊清空按鈕應該清除車牌內容', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={onClose} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    const plateInput = screen.getByPlaceholderText(/車牌/i);

    // 輸入車牌
    fireEvent.change(plateInput, { target: { value: 'ABC-1234' } });
    expect(plateInput).toHaveValue('ABC-1234');

    // 點擊清空按鈕
    const clearButton = await screen.findByLabelText(/清空車牌/i);
    fireEvent.click(clearButton);

    // 驗證已清空
    expect(plateInput).toHaveValue('');
    expect(screen.queryByLabelText(/清空車牌/i)).not.toBeInTheDocument();
  });

  it('應該在成功儲存後才清空車牌（不是關閉時清空）', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={onClose} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    const plateInput = screen.getByPlaceholderText(/車牌/i);
    fireEvent.change(plateInput, { target: { value: 'ABC-1234' } });

    // 點擊樓層按鈕觸發儲存
    const floorButton = screen.getByText('B2');
    fireEvent.click(floorButton);

    // 等待儲存完成
    await waitFor(() => expect(onSave).toHaveBeenCalled(), { timeout: 2000 });

    // 此時車牌應該還在（只有成功後才關閉面板）
    expect(plateInput).toHaveValue('ABC-1234');
  });

  it('P0 破壞路徑修復：清空輸入框後關閉面板，重開仍帶入上次已儲存車號', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={onClose} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    const plateInput = screen.getByPlaceholderText(/車牌/i);
    fireEvent.change(plateInput, { target: { value: 'ABC-1234' } });
    fireEvent.click(screen.getByText('B2'));
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    // 使用者想換車號，先清空輸入框，但改變心意直接關閉面板（不儲存）。
    const clearButton = await screen.findByLabelText(/清空車牌/i);
    fireEvent.click(clearButton);
    expect(plateInput).toHaveValue('');

    // 關閉面板（QuickEntry 常駐掛載，僅切換 isVisible）。
    rerender(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={false} onClose={onClose} />
      </I18nextProvider>,
    );

    // 重新開啟面板，應帶入上次已儲存的車號，而非清空後的空白。
    rerender(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={onClose} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(plateInput).toHaveValue('ABC-1234'));
  });

  it('輸入過程中不落 storage，僅於儲存成功時 commit', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={onClose} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    const plateInput = screen.getByPlaceholderText(/車牌/i);
    fireEvent.change(plateInput, { target: { value: 'D' } });
    fireEvent.change(plateInput, { target: { value: 'DE' } });
    fireEvent.change(plateInput, { target: { value: 'DEF-5678' } });

    // 尚未儲存：記憶不應被鍵擊過程覆寫。
    expect(plateMemory.get()).toBeNull();

    fireEvent.click(screen.getByText('B1'));
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    // 儲存成功後才正式 commit。
    expect(plateMemory.get()).toBe('DEF-5678');
  });

  it('上次樓層應於重新開啟時預選高亮', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={onClose} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    fireEvent.click(screen.getByText('3F'));
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    rerender(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={false} onClose={onClose} />
      </I18nextProvider>,
    );
    rerender(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={onClose} />
      </I18nextProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText('3F').className).toContain('bg-[var(--color-primary)]'),
    );
  });
});
