/**
 * NavOverlay modal a11y 測試（issue #725）：
 * dialog 語意、Esc 關閉、照片檢視器開啟時 Esc 讓位、抵達態雙按鈕 aria 區分。
 */
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NavOverlay from '../NavOverlay';
import i18n from '@app/park-keeper/services/i18n';
import { THEMES } from '@app/park-keeper/constants';
import type { ParkingRecord } from '@app/park-keeper/types';
import { useNavigation } from '@app/park-keeper/hooks/useNavigation';

vi.mock('../MiniMap', () => ({
  default: vi.fn(() => <div data-testid="mini-map" />),
}));

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
  permissionState: 'granted' as const,
  requestCompassPermission: vi.fn(),
  needsCalibration: false,
};

function renderOverlay(onClose = vi.fn(), stateOverrides: Partial<typeof navState> = {}) {
  vi.mocked(useNavigation).mockReturnValue({
    ...navState,
    ...stateOverrides,
  } as unknown as ReturnType<typeof useNavigation>);
  render(
    <I18nextProvider i18n={i18n}>
      <NavOverlay record={record} theme={theme} onClose={onClose} cacheDurationDays={7} />
    </I18nextProvider>,
  );
  return onClose;
}

describe('NavOverlay - modal a11y', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh-TW');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
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

    fireEvent.click(screen.getByRole('button', { name: '查看停車照片' }));
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
  });
});
