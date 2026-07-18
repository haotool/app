/**
 * NavOverlay modal a11y 測試（issue #725；#752 佈局 v2 對齊）：
 * dialog 語意、Esc 關閉、照片檢視器開啟時 Esc 讓位、抵達態雙按鈕 aria 區分、
 * deck 幾何模式（arc/capsule 降級）。
 */
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NavOverlay from '../NavOverlay';
import i18n from '@app/park-keeper/services/i18n';
import { THEMES } from '@app/park-keeper/constants';
import { ARRIVED_ON_COLOR } from '@app/park-keeper/config/colors';
import type { ParkingRecord, ThemeConfig } from '@app/park-keeper/types';
import { useNavigation, type CompassPermissionState } from '@app/park-keeper/hooks/useNavigation';

vi.mock('../MiniMap', () => ({
  default: vi.fn((props: { onPhotoClick?: () => void }) => (
    <div data-testid="mini-map">
      <button type="button" data-testid="map-photo-anchor" onClick={props.onPhotoClick}>
        map-photo
      </button>
    </div>
  )),
}));

// jsdom 無實際佈局：以 getter 僅對 stage 元素（data-testid=compass-stage）
// 提供量測值，其餘元素維持 jsdom 預設 0，避免全域 stub 汙染其他量測。
// 375×300 → computeDeckGeometry 判定 arc 模式（對齊 390×844 直向實機）。
function stubStageSize(width: number, height: number) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset['testid'] === 'compass-stage' ? width : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.dataset['testid'] === 'compass-stage' ? height : 0;
    },
  });
}

vi.mock('@app/park-keeper/hooks/useNavigation', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, useNavigation: vi.fn() };
});

const theme = THEMES['minimalist']!;

const record: ParkingRecord = {
  id: 'r1',
  plateNumber: 'ABC-1234',
  floor: 'B2',
  notes: '',
  timestamp: Date.now(),
  hasPhoto: true,
  photoData: 'data:image/png;base64,x',
  latitude: 25.033,
  longitude: 121.5654,
};

const navState = {
  userLoc: { lat: 25.034, lng: 121.5644 },
  heading: 0,
  trueAnimHeading: 0,
  distance: 42,
  stepCount: 60,
  animTargetBearing: 0,
  relativeRotation: 90,
  isIndoor: false,
  arrivedState: false,
  hasValidLocation: true,
  isPhoneFlat: true,
  permissionState: 'granted' as CompassPermissionState,
  requestCompassPermission: vi.fn(),
  needsCalibration: false,
  recheckCalibration: vi.fn(),
};

function renderOverlay(
  onClose = vi.fn(),
  stateOverrides: Partial<typeof navState> = {},
  themeOverride: ThemeConfig = theme,
) {
  vi.mocked(useNavigation).mockReturnValue({
    ...navState,
    ...stateOverrides,
  } as unknown as ReturnType<typeof useNavigation>);
  render(
    <I18nextProvider i18n={i18n}>
      <NavOverlay record={record} theme={themeOverride} onClose={onClose} cacheDurationDays={7} />
    </I18nextProvider>,
  );
  return onClose;
}

describe('NavOverlay - modal a11y', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh-TW');
    stubStageSize(375, 300);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    // 還原 prototype stub，避免污染其他測試檔。
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)['clientWidth'];
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)['clientHeight'];
  });

  it('具 dialog 語意（role/aria-modal/label）且開啟時聚焦容器', () => {
    renderOverlay();

    const dialog = screen.getByRole('dialog', { name: '羅盤導航' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.activeElement).toBe(dialog);
  });

  it('Esc 關閉導航', () => {
    const onClose = renderOverlay();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('照片檢視器開啟時 Esc 只關閉照片，不關閉導航', async () => {
    const onClose = renderOverlay();

    // 照片入口改為地圖照片錨（issue #752：地圖為主內容、tap 縮圖開檢視器）。
    fireEvent.click(screen.getByTestId('map-photo-anchor'));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '照片檢視器' })).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '照片檢視器' })).toBeNull();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('資訊緊湊列（deck 上緣）：樓層＋車號恆在；備註有則截行顯示', () => {
    // 無備註。
    vi.mocked(useNavigation).mockReturnValue(
      navState as unknown as ReturnType<typeof useNavigation>,
    );
    const { unmount } = render(
      <I18nextProvider i18n={i18n}>
        <NavOverlay
          record={{ ...record, notes: '' }}
          theme={theme}
          onClose={vi.fn()}
          cacheDurationDays={7}
        />
      </I18nextProvider>,
    );
    let strip = screen.getByTestId('nav-info-strip');
    expect(within(strip).getByText('B2')).toBeInTheDocument();
    expect(within(strip).getByText('ABC-1234')).toBeInTheDocument();
    unmount();

    // 有備註：資訊列顯示備註內容。
    vi.mocked(useNavigation).mockReturnValue(
      navState as unknown as ReturnType<typeof useNavigation>,
    );
    render(
      <I18nextProvider i18n={i18n}>
        <NavOverlay
          record={{ ...record, notes: '停在柱子 B2-17 旁' }}
          theme={theme}
          onClose={vi.fn()}
          cacheDurationDays={7}
        />
      </I18nextProvider>,
    );
    strip = screen.getByTestId('nav-info-strip');
    expect(within(strip).getByText('停在柱子 B2-17 旁')).toBeInTheDocument();
  });

  it('佈局 v2：hub 為距離唯一顯示（deck 內無重複距離 HUD）', () => {
    renderOverlay();

    const hub = screen.getByTestId('compass-hub');
    expect(within(hub).getByText('42')).toBeInTheDocument();
    // 距離數字全域唯一（根治頂部 HUD／資訊卡重複顯示）。
    expect(screen.getAllByText('42')).toHaveLength(1);
    // 資訊緊湊列不含距離。
    expect(within(screen.getByTestId('nav-info-strip')).queryByText('42')).toBeNull();
  });

  it('矮視高 stage 降級為方向膠囊（不渲染弧形盤面）', () => {
    stubStageSize(375, 140);
    renderOverlay();

    expect(screen.getByTestId('compass-capsule')).toBeInTheDocument();
    expect(screen.queryByTestId('compass-arc')).toBeNull();
    // 膠囊仍顯示距離＋方位提示（唯一距離顯示）。
    expect(screen.getAllByText('42')).toHaveLength(1);
  });

  it('校準卡提供手動重新偵測按鈕（reduced-motion 下不依賴系統自動）', () => {
    const recheck = vi.fn();
    vi.mocked(useNavigation).mockReturnValue({
      ...navState,
      needsCalibration: true,
      recheckCalibration: recheck,
    } as unknown as ReturnType<typeof useNavigation>);
    render(
      <I18nextProvider i18n={i18n}>
        <NavOverlay record={record} theme={theme} onClose={vi.fn()} cacheDurationDays={7} />
      </I18nextProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: '重新偵測精度' }));
    expect(recheck).toHaveBeenCalledTimes(1);
  });

  it('抵達態雙關閉入口 aria 可區分（頂部 X vs 抵達 CTA）', () => {
    vi.useFakeTimers();
    renderOverlay(vi.fn(), { arrivedState: true });

    // 抵達 CTA 於 1 秒後出現。
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    const closeButtons = screen.getAllByRole('button', { name: /關閉導航/ });
    const names = closeButtons.map((el) => el.getAttribute('aria-label') ?? el.textContent ?? '');
    // 兩顆按鈕 accessible name 必須不同，避免 SR/語音控制歧義與 e2e strict-mode 衝突。
    expect(closeButtons).toHaveLength(2);
    expect(new Set(names).size).toBe(2);

    // 抵達 CTA 前景色跟隨 ARRIVED_ON_COLOR token：白字 on ARRIVED 綠僅 2.28:1（round-4 Sonnet F2）。
    const arrivedCta = screen.getByRole('button', { name: '已抵達，關閉導航' });
    expect(arrivedCta).toHaveStyle({ color: ARRIVED_ON_COLOR });
  });

  it('未填車號（sentinel）頂部車牌 pill 顯示待填文案而非裸露 N/A（formatPlate SSOT）', () => {
    vi.mocked(useNavigation).mockReturnValue(
      navState as unknown as ReturnType<typeof useNavigation>,
    );
    render(
      <I18nextProvider i18n={i18n}>
        <NavOverlay
          record={{ ...record, plateNumber: 'N/A' }}
          theme={theme}
          onClose={vi.fn()}
          cacheDurationDays={7}
        />
      </I18nextProvider>,
    );

    // 頂部車牌 pill 與資訊緊湊列各一處（皆走 formatPlate SSOT）。
    expect(screen.getAllByText('未填車號')).toHaveLength(2);
    expect(screen.queryByText(/N\/A/)).toBeNull();
  });

  it('刻度環旋轉時方位文字以自身錨點反向抵銷保持直立（issue #733）', () => {
    renderOverlay(vi.fn(), { trueAnimHeading: 90 });

    const cardinalTexts = Array.from(document.querySelectorAll('text'));
    expect(cardinalTexts).toHaveLength(4);
    for (const textEl of cardinalTexts) {
      const x = textEl.getAttribute('x');
      const y = textEl.getAttribute('y');
      // 回轉 +heading（容器 -heading 的相反數），旋轉中心即文字錨點。
      expect(textEl.getAttribute('transform')).toBe(`rotate(90 ${x} ${y})`);
    }
  });

  // primary 底前景色跨流收斂（issue #753 onPrimary token；R4 整合回歸）：
  // racing 主題 onPrimary 為近黑（非白），若元件硬編白字會在此主題下對比嚴重不足。
  it('權限卡「啟用羅盤」按鈕前景色跟隨主題 onPrimary token（非硬編白字）', () => {
    const racingTheme = THEMES['racing']!;
    renderOverlay(vi.fn(), { permissionState: 'prompt' }, racingTheme);

    const enableButton = screen.getByRole('button', { name: '啟用羅盤' });
    expect(enableButton).toHaveStyle({ color: racingTheme.colors.onPrimary });
  });

  it('照片位置調整按鈕啟用態前景色跟隨主題 onPrimary token（非硬編白字）', () => {
    const racingTheme = THEMES['racing']!;
    renderOverlay(vi.fn(), {}, racingTheme);

    fireEvent.click(screen.getByRole('button', { name: '調整照片位置' }));
    expect(screen.getByRole('button', { name: '完成' })).toHaveStyle({
      color: racingTheme.colors.onPrimary,
    });
  });
});
