import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import RecordCard from '../RecordCard';
import type { ParkingRecord, ThemeConfig } from '@app/park-keeper/types';

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
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    render(
      <RecordCard
        record={record}
        theme={theme}
        onDelete={vi.fn()}
        onUpdate={onUpdate}
        onNavigate={vi.fn()}
        miniMapText={miniMapText}
      />,
    );

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
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    render(
      <RecordCard
        record={record}
        theme={theme}
        onDelete={vi.fn()}
        onUpdate={onUpdate}
        onNavigate={vi.fn()}
        miniMapText={miniMapText}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: `編輯車牌 ${record.plateNumber}` }));

    const input = screen.getByDisplayValue(record.plateNumber);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'def-5566' } });
      fireEvent.blur(input);
      await onUpdate.mock.results[0]?.value;
    });

    expect(onUpdate).toHaveBeenCalledWith(record.id, { plateNumber: 'DEF-5566' });
  });
});
