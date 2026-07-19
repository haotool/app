import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import RecordCard from '../RecordCard';
import type { ParkingRecord, ThemeConfig } from '@app/park-keeper/types';

vi.mock('motion/react', () => {
  const motionProps = ['initial', 'animate', 'whileInView', 'viewport', 'transition', 'exit'];
  return {
    motion: new Proxy(
      {},
      {
        get(_target, prop) {
          const Component = ({
            children,
            ...props
          }: { children?: React.ReactNode } & Record<string, unknown>) => {
            const tag = String(prop);
            const domProps = { ...props };
            motionProps.forEach((key) => delete domProps[key]);
            return React.createElement(tag, domProps, children);
          };
          Component.displayName = `motion.${String(prop)}`;
          return Component;
        },
      },
    ),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      const map: Record<string, string> = {
        'record.plate': '車牌號碼',
        'record.plate_unset': '未填車號',
        'home.just_now': '剛剛',
        'record.edit_plate': '編輯車牌 {{plate}}',
        'record.edit_plate_icon': '編輯車牌',
        'record.delete': '刪除停車記錄 {{plate}}',
        'record.manage_label': '紀錄管理',
        'record.view_photo': '查看停車照片',
        'record.photo_alt': '停車照片',
        'record.no_map': 'No Map',
        'record.navigate': '導航',
        'record.saving': '正在儲存...',
      };
      let str = map[key] ?? key;
      if (opts) {
        for (const [k, v] of Object.entries(opts)) {
          str = str.replace(`{{${k}}}`, v);
        }
      }
      return str;
    },
    i18n: { language: 'zh-TW' },
  }),
}));

vi.mock('../MiniMap', () => ({
  default: ({ onPhotoClick }: { onPhotoClick?: () => void }) => (
    <div
      data-testid="mini-map"
      onClick={(event) => {
        event.stopPropagation();
        onPhotoClick?.();
      }}
    >
      MiniMap
    </div>
  ),
}));

vi.mock('../PhotoViewerModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div aria-label="照片檢視器" role="dialog">
      <button type="button" onClick={onClose}>
        關閉照片預覽
      </button>
    </div>
  ),
}));

const theme: ThemeConfig = {
  id: 'minimalist',
  name: 'Zen',
  colors: {
    primary: '#1e293b',
    onPrimary: '#ffffff',
    secondary: '#f1f5f9',
    accent: '#3b82f6',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
    danger: '#b91c1c',
  },
  font: 'font-minimalist',
  borderRadius: '12px',
  animationType: 'tween',
};

const record: ParkingRecord = {
  id: 'record-1',
  plateNumber: 'ABC-1234',
  floor: 'B2',
  timestamp: Date.now(),
  hasPhoto: false,
};

function renderRecordCard(
  recordOverrides: Partial<ParkingRecord> = {},
  propOverrides: Partial<React.ComponentProps<typeof RecordCard>> = {},
) {
  const onDelete = vi.fn();
  const onUpdate = vi.fn().mockResolvedValue(undefined);
  const onNavigate = vi.fn();
  const currentRecord = { ...record, ...recordOverrides };

  render(
    <RecordCard
      record={currentRecord}
      theme={theme}
      onDelete={onDelete}
      onUpdate={onUpdate}
      onNavigate={onNavigate}
      miniMapText={miniMapText}
      {...propOverrides}
    />,
  );

  return {
    record: currentRecord,
    onDelete,
    onNavigate,
    onUpdate,
  };
}

const miniMapText = {
  markerCarLabel: 'Car',
  markerUserLabel: 'You',
  legendCurrentLabel: 'Current',
  legendCarLabel: 'Car',
  dragCarHintLabel: 'Drag car to adjust',
  ariaInteractiveSelectionLabel: 'select location',
  ariaInteractiveTrackingLabel: 'tracking location',
  ariaStaticLabel: 'static map',
};

describe('RecordCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('應該在列表頁點擊車牌後，以防抖方式自動儲存', async () => {
    const { onUpdate } = renderRecordCard();

    fireEvent.click(screen.getByRole('button', { name: `編輯車牌 ${record.plateNumber}` }));

    const input = screen.getByDisplayValue(record.plateNumber);
    fireEvent.change(input, { target: { value: 'xyz-7788' } });

    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(onUpdate).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(onUpdate).toHaveBeenCalledWith(record.id, { plateNumber: 'XYZ-7788' });
  });

  it('應該在 blur 時立即儲存尚未進入防抖時間的變更', async () => {
    const { onUpdate } = renderRecordCard();

    fireEvent.click(screen.getByRole('button', { name: `編輯車牌 ${record.plateNumber}` }));

    const input = screen.getByDisplayValue(record.plateNumber);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'def-5566' } });
      fireEvent.blur(input);
      await onUpdate.mock.results[0]?.value;
    });

    expect(onUpdate).toHaveBeenCalledWith(record.id, { plateNumber: 'DEF-5566' });
  });

  it('應該在輸入空白車牌後於 blur 時還原原始值且不送出更新', () => {
    const { onUpdate } = renderRecordCard();

    fireEvent.click(screen.getByRole('button', { name: `編輯車牌 ${record.plateNumber}` }));

    const input = screen.getByDisplayValue(record.plateNumber);
    act(() => {
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.blur(input);
    });

    expect(screen.getByRole('button', { name: `編輯車牌 ${record.plateNumber}` })).toBeVisible();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('應該在按下 Escape 時取消編輯並還原內容', () => {
    renderRecordCard();

    fireEvent.click(screen.getByRole('button', { name: `編輯車牌 ${record.plateNumber}` }));

    const input = screen.getByDisplayValue(record.plateNumber);
    fireEvent.change(input, { target: { value: 'ZZZ-0001' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.getByRole('button', { name: `編輯車牌 ${record.plateNumber}` })).toBeVisible();
    expect(screen.queryByDisplayValue('ZZZ-0001')).not.toBeInTheDocument();
  });

  it('應該在儲存失敗時回復顯示的車牌', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onUpdate = vi.fn().mockRejectedValue(new Error('save failed'));

    renderRecordCard({}, { onUpdate });

    fireEvent.click(screen.getByRole('button', { name: `編輯車牌 ${record.plateNumber}` }));

    const input = screen.getByDisplayValue(record.plateNumber);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'def-5566' } });
      fireEvent.blur(input);
      await onUpdate.mock.results[0]?.value?.catch(() => undefined);
    });

    expect(screen.getByRole('button', { name: `編輯車牌 ${record.plateNumber}` })).toBeVisible();
    expect(errorSpy).toHaveBeenCalledWith('Failed to update plate number:', expect.any(Error));
  });

  it('未填車號（sentinel）應顯示待填文案而非裸露 N/A（formatPlate SSOT）', () => {
    renderRecordCard({ plateNumber: 'N/A' });

    expect(screen.getByText('未填車號')).toBeInTheDocument();
    expect(screen.queryByText(/N\/A/)).toBeNull();
  });

  it('未填車號（sentinel）時編輯／刪除按鈕 accessible name 走 formatPlate，不裸露 N/A（round-3 Grok/Sonnet P2）', () => {
    renderRecordCard({ plateNumber: 'N/A' });

    expect(screen.getByRole('button', { name: '編輯車牌 未填車號' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '刪除停車記錄 未填車號' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /N\/A/ })).toBeNull();
  });

  it('compact 精簡列隱藏照片＋地圖列，保留車牌編輯與刪除（issue #733）', () => {
    renderRecordCard({ notes: '柱子旁' }, { compact: true });

    expect(screen.queryByTestId('record-card-media')).toBeNull();
    // 管理操作與備註不受影響。
    expect(screen.getByLabelText('編輯車牌')).toBeInTheDocument();
    expect(screen.getByLabelText('刪除停車記錄 ABC-1234')).toBeInTheDocument();
    expect(screen.getByText(/柱子旁/)).toBeInTheDocument();
  });

  it('非 compact 時車牌與樓層資訊照常顯示', () => {
    renderRecordCard();

    expect(screen.getByText(record.plateNumber)).toBeInTheDocument();
    expect(screen.getByText(record.floor)).toBeInTheDocument();
  });

  it('compact 精簡列只留操作，不重複顯示車牌／樓層／時間（issue #753 單筆去重）', () => {
    renderRecordCard({}, { compact: true });

    expect(screen.getByText('紀錄管理')).toBeInTheDocument();
    expect(screen.queryByText(record.plateNumber)).toBeNull();
    expect(screen.queryByText(record.floor)).toBeNull();
  });

  it('預設（非 compact）照片＋地圖列照常渲染', () => {
    renderRecordCard();

    expect(screen.getByTestId('record-card-media')).toBeInTheDocument();
  });

  it('時間顯示統一走 formatSmartTime 相對時間 SSOT，不再使用日曆格式（issue #753）', () => {
    renderRecordCard({ timestamp: Date.now() - 3 * 3_600_000 });

    expect(screen.getByText('3 小時前')).toBeInTheDocument();
    expect(screen.queryByText('昨天')).toBeNull();
  });

  it('應該支援刪除與導航操作，並顯示備註', () => {
    const notes = '靠近電梯口';
    const {
      onDelete,
      onNavigate,
      record: currentRecord,
    } = renderRecordCard({
      latitude: 25.033,
      longitude: 121.5654,
      notes,
    });

    fireEvent.click(
      screen.getByRole('button', { name: `刪除停車記錄 ${currentRecord.plateNumber}` }),
    );
    expect(onDelete).toHaveBeenCalledWith(currentRecord.id);

    fireEvent.click(screen.getByRole('button', { name: /導航/ }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: currentRecord.id }));
    expect(screen.getByText(/靠近電梯口/)).toBeInTheDocument();
  });

  // racing 主題 onPrimary 為近黑（非白），硬編白字在其 primary 底對比僅 1.37:1（round-4 Sonnet F1）。
  it('地圖縮圖導航 pill 前景色跟隨主題 onPrimary token（非硬編白字）', () => {
    const racingLikeTheme: ThemeConfig = {
      ...theme,
      colors: { ...theme.colors, primary: '#00f2ff', onPrimary: '#020617' },
    };
    renderRecordCard({ latitude: 25.033, longitude: 121.5654 }, { theme: racingLikeTheme });

    const pill = screen.getByText('導航').closest('div');
    expect(pill).toHaveStyle({ color: '#020617' });
  });

  it('應該在列表照片面板被點擊後開啟並關閉照片 modal', async () => {
    vi.useRealTimers();

    renderRecordCard({
      latitude: 25.033,
      longitude: 121.5654,
      photoData: 'data:image/png;base64,abc',
      hasPhoto: true,
    });

    const photoButton = await screen.findByRole('button', { name: '查看停車照片' });
    fireEvent.click(photoButton);
    expect(screen.getByRole('dialog', { name: '照片檢視器' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '關閉照片預覽' }));
    expect(screen.queryByRole('dialog', { name: '照片檢視器' })).not.toBeInTheDocument();
  });

  it('照片 modal 應透過 createPortal 渲染到 document.body，而非 card 容器內', async () => {
    vi.useRealTimers();

    const { container } = render(
      <RecordCard
        record={{ ...record, photoData: 'data:image/png;base64,abc', hasPhoto: true }}
        theme={theme}
        onDelete={vi.fn()}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
        onNavigate={vi.fn()}
        miniMapText={miniMapText}
      />,
    );

    const photoButton = await screen.findByRole('button', { name: '查看停車照片' });
    fireEvent.click(photoButton);

    // modal 不應在 card 容器內（createPortal 會跳出）
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    // modal 應在 document.body 中
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
  });
});
