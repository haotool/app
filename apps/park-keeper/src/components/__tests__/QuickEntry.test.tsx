import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import QuickEntry from '../QuickEntry';
import i18n from '@app/park-keeper/services/i18n';
import { plateMemory } from '@app/park-keeper/services/plateMemory';
import { compressImage } from '@app/park-keeper/services/imageUtils';
import type { ThemeConfig } from '@app/park-keeper/types';

// Mock MiniMap component
vi.mock('../MiniMap', () => ({
  default: vi.fn(() => <div data-testid="mini-map">MiniMap</div>),
}));

// jsdom 無真實 canvas，壓縮管線以 stub 取代（僅驗證帶入流程）。
vi.mock('@app/park-keeper/services/imageUtils', () => ({
  compressImage: vi.fn(() => Promise.resolve('data:image/jpeg;base64,stub')),
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
    onPrimary: '#ffffff',
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

    // 重開後重新查詢 DOM，避免 stale 節點參照。
    await waitFor(() => expect(screen.getByPlaceholderText(/車牌/i)).toHaveValue('ABC-1234'));
  });

  it('清空車號後儲存成功，不得抹除上次真實車號記憶', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={onClose} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    // 第一次以真實車號儲存成功。
    fireEvent.change(screen.getByPlaceholderText(/車牌/i), { target: { value: 'ABC-1234' } });
    fireEvent.click(screen.getByText('B2'));
    await waitFor(() => expect(plateMemory.get()).toBe('ABC-1234'));

    // 關閉再重開面板（常駐掛載，重置 saveStatus 進入下一輪）。
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

    // 第二次清空車號直接儲存：空 commit 為 no-op，記憶不得被抹除。
    const plateInput = screen.getByPlaceholderText(/車牌/i);
    fireEvent.change(plateInput, { target: { value: '' } });
    fireEvent.click(screen.getByText('1F'));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));

    expect(plateMemory.get()).toBe('ABC-1234');
  });

  it('onSave 失敗（reject）時不得寫入記憶', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('save failed'));
    const onClose = vi.fn();

    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={onClose} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/車牌/i), { target: { value: 'FAIL-0001' } });
    fireEvent.click(screen.getByText('B3'));
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    // 儲存失敗：記憶不得被寫入。
    expect(plateMemory.get()).toBeNull();
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

describe('QuickEntry - GPS 拒絕卡', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh-TW');
    global.localStorage.clear();

    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: mockGeolocation,
      vibrate: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  function mockGeoDenied() {
    mockGeolocation.watchPosition.mockImplementation((_success, error) => {
      error?.({
        code: 1,
        message: 'User denied Geolocation',
      } as GeolocationPositionError);
      return 1;
    });
  }

  it('GPS 拒絕時顯示 location_denied 卡與重試按鈕，不得回退台北 101 預設座標', async () => {
    mockGeoDenied();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={vi.fn()} />
      </I18nextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(i18n.t('error.location_denied'))).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: i18n.t('action.retry') })).toBeInTheDocument();
    // 不得靜默存台北 101：地圖不應以預設座標渲染。
    expect(screen.queryByTestId('mini-map')).not.toBeInTheDocument();
  });

  it('GPS 拒絕仍可儲存，但經緯度必須為 undefined 且卡片明示未記錄位置', async () => {
    mockGeoDenied();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={vi.fn()} />
      </I18nextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(i18n.t('error.location_denied'))).toBeInTheDocument();
    });
    expect(screen.getByText(i18n.t('record.no_location'))).toBeInTheDocument();

    fireEvent.click(screen.getByText('B2'));
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    const saved = onSave.mock.calls[0]![0] as { latitude?: number; longitude?: number };
    expect(saved.latitude).toBeUndefined();
    expect(saved.longitude).toBeUndefined();
  });

  it('點擊重試按鈕後重新啟動定位並在成功時清除拒絕卡', async () => {
    mockGeoDenied();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={onSave} isVisible={true} onClose={vi.fn()} />
      </I18nextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(i18n.t('error.location_denied'))).toBeInTheDocument();
    });

    // 第二次請求改為成功。
    mockGeolocation.watchPosition.mockImplementation((success) => {
      success({
        coords: { latitude: 25.033, longitude: 121.5654, accuracy: 10, heading: null },
      } as GeolocationPosition);
      return 2;
    });

    fireEvent.click(screen.getByRole('button', { name: i18n.t('action.retry') }));

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());
    expect(screen.queryByText(i18n.t('error.location_denied'))).not.toBeInTheDocument();
  });
});

describe('QuickEntry - fullscreen 模式', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh-TW');
    global.localStorage.clear();

    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: mockGeolocation,
      vibrate: vi.fn(),
    });

    mockGeolocation.watchPosition.mockImplementation((success) => {
      success({
        coords: { latitude: 25.033, longitude: 121.5654, accuracy: 10, heading: null },
      } as GeolocationPosition);
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('fullscreen 模式渲染巨型拍照 CTA（label 直包 file input），無 bottom sheet 把手', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry
          theme={mockTheme}
          onSave={vi.fn()}
          isVisible={true}
          onClose={vi.fn()}
          mode="fullscreen"
        />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    // 巨型 CTA：拍照 label 存在且直包 capture input。
    const fileInput = document.querySelector('input[type="file"][capture="environment"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput?.closest('label')).not.toBeNull();

    // 全螢幕模式不渲染 sheet 把手與 backdrop。
    expect(document.querySelector('[data-testid="quick-entry-handle"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-testid="quick-entry-backdrop"]')).not.toBeInTheDocument();
  });

  it('sheet 模式維持既有把手與 backdrop 行為', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={vi.fn()} isVisible={true} onClose={vi.fn()} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    expect(document.querySelector('[data-testid="quick-entry-handle"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="quick-entry-backdrop"]')).toBeInTheDocument();
  });

  it('sheet 模式具 modal dialog 語意且 Esc 觸發 onClose（issue #725）', async () => {
    const onClose = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={vi.fn()} isVisible={true} onClose={onClose} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    const dialog = screen.getByRole('dialog', { name: i18n.t('add.title') });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // 開啟時焦點移入 dialog 容器（focus trap 起點）。
    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('相機取消（input cancel 事件）顯示照片來源引導卡，重新拍照與返回不得死路', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={vi.fn()} isVisible={true} onClose={vi.fn()} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    fireEvent(screen.getByTestId('quick-entry-photo-input'), new Event('cancel'));

    const card = await screen.findByTestId('photo-issue-card');
    expect(card).toHaveTextContent(i18n.t('error.photo_cancelled'));
    expect(card).toHaveTextContent(i18n.t('error.photo_source_help'));
    // 重新拍照入口仍為 label+capture input（無程式化喚起）。
    expect(screen.getByTestId('photo-issue-retake-input')).toHaveAttribute(
      'capture',
      'environment',
    );

    // 返回：關閉引導卡回到拍照 label（等待退場動畫移除節點）。
    fireEvent.click(screen.getByRole('button', { name: i18n.t('action.dismiss') }));
    await waitFor(() => expect(screen.queryByTestId('photo-issue-card')).toBeNull(), {
      timeout: 4000,
    });
    expect(screen.getByTestId('quick-entry-photo-input')).toBeInTheDocument();
  });

  it('壓縮失敗顯示讀取失敗引導卡，重新拍照成功後恢復照片預覽', async () => {
    vi.mocked(compressImage).mockRejectedValueOnce(new Error('broken image'));

    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={vi.fn()} isVisible={true} onClose={vi.fn()} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    const file = new File(['x'], 'broken.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByTestId('quick-entry-photo-input'), {
      target: { files: [file] },
    });

    const card = await screen.findByTestId('photo-issue-card');
    expect(card).toHaveTextContent(i18n.t('error.image'));

    // 由引導卡重新拍照（第二次壓縮成功）→ 照片預覽出現、卡片消失。
    // AnimatePresence mode=wait 於 jsdom（rAF stub）退場較慢，放寬等待上限。
    fireEvent.change(screen.getByTestId('photo-issue-retake-input'), {
      target: { files: [new File(['y'], 'ok.jpg', { type: 'image/jpeg' })] },
    });
    await waitFor(
      () => expect(screen.getByAltText(i18n.t('record.photo_alt'))).toBeInTheDocument(),
      { timeout: 4000 },
    );
    expect(screen.queryByTestId('photo-issue-card')).toBeNull();
  });

  it('歷史車號 chips 一鍵切換（排除當前輸入值）', async () => {
    localStorage.setItem('park-keeper:last-plate', 'AAA-1111');
    localStorage.setItem('park-keeper:plate-history', JSON.stringify(['AAA-1111', 'BBB-2222']));

    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry theme={mockTheme} onSave={vi.fn()} isVisible={true} onClose={vi.fn()} />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());

    // 當前值 AAA-1111 不重複出現在 chips；BBB-2222 可一鍵切換。
    const chips = screen.getByTestId('plate-history-chips');
    expect(chips).toHaveTextContent('BBB-2222');
    expect(chips).not.toHaveTextContent('AAA-1111');

    fireEvent.click(screen.getByRole('button', { name: 'BBB-2222' }));
    expect(screen.getByPlaceholderText(/車牌/i)).toHaveValue('BBB-2222');
    // 切換後原車號進入 chips 供切回。
    expect(screen.getByTestId('plate-history-chips')).toHaveTextContent('AAA-1111');
  });

  it('fullscreen 模式為頁面內容，不得帶 dialog 語意', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry
          theme={mockTheme}
          onSave={vi.fn()}
          isVisible={true}
          onClose={vi.fn()}
          mode="fullscreen"
        />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('initialPhotoFile 於開啟時直接帶入照片預覽（首屏 CTA 拍照直達流程）', async () => {
    const file = new File(['photo'], 'cta.jpg', { type: 'image/jpeg' });

    render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry
          theme={mockTheme}
          onSave={vi.fn()}
          isVisible={true}
          onClose={vi.fn()}
          initialPhotoFile={file}
        />
      </I18nextProvider>,
    );

    await waitFor(() =>
      expect(screen.getByAltText(i18n.t('record.photo_alt'))).toBeInTheDocument(),
    );
  });

  it('關閉面板後才完成的壓縮不得殘留照片（generation token 防護）', async () => {
    let resolveCompress: ((value: string) => void) | undefined;
    vi.mocked(compressImage).mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          resolveCompress = resolve;
        }),
    );

    const file = new File(['photo'], 'slow.jpg', { type: 'image/jpeg' });
    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <QuickEntry
          theme={mockTheme}
          onSave={vi.fn()}
          isVisible={true}
          onClose={vi.fn()}
          initialPhotoFile={file}
        />
      </I18nextProvider>,
    );

    await waitFor(() => expect(resolveCompress).toBeDefined());

    // 壓縮完成前關閉面板，再讓過期任務 resolve。
    rerender(
      <I18nextProvider i18n={i18n}>
        <QuickEntry
          theme={mockTheme}
          onSave={vi.fn()}
          isVisible={false}
          onClose={vi.fn()}
          initialPhotoFile={null}
        />
      </I18nextProvider>,
    );
    resolveCompress!('data:image/jpeg;base64,stale');

    // 重新開啟（無帶入照片）：過期 resolve 不得殘留照片。
    rerender(
      <I18nextProvider i18n={i18n}>
        <QuickEntry
          theme={mockTheme}
          onSave={vi.fn()}
          isVisible={true}
          onClose={vi.fn()}
          initialPhotoFile={null}
        />
      </I18nextProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mini-map')).toBeInTheDocument());
    expect(screen.queryByAltText(i18n.t('record.photo_alt'))).not.toBeInTheDocument();
  });
});
