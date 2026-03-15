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
    secondary: '#f1f5f9',
    accent: '#3b82f6',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
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

    fireEvent.click(screen.getByRole('button', { name: /navigate/i }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: currentRecord.id }));
    expect(screen.getByText(/靠近電梯口/)).toBeInTheDocument();
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
});
