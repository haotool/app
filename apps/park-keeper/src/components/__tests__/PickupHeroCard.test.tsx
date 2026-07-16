/**
 * PickupHeroCard 測試（issue #725 首屏 IA）：
 * hero 卡呈現 display 級樓層、車號/經過時間，tap 觸發導航；未填車號顯示待填文案。
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import PickupHeroCard, { formatElapsed } from '../PickupHeroCard';
import { THEMES } from '@app/park-keeper/constants';
import type { ParkingRecord } from '@app/park-keeper/types';
import i18n from '@app/park-keeper/services/i18n';

const theme = THEMES['minimalist']!;

const baseRecord: ParkingRecord = {
  id: 'r1',
  plateNumber: 'ABC-1234',
  floor: 'B2',
  notes: '',
  timestamp: Date.now() - 3 * 60 * 60 * 1000,
  hasPhoto: false,
};

describe('PickupHeroCard', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-TW');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('顯示 display 級樓層字（text-6xl）、車號與經過時間', () => {
    render(<PickupHeroCard record={baseRecord} theme={theme} onNavigate={() => {}} />);

    const floor = screen.getByText('B2');
    expect(floor).toHaveClass('text-6xl');
    expect(screen.getByText('ABC-1234')).toBeInTheDocument();
    expect(screen.getByText(/3 小時前/)).toBeInTheDocument();
  });

  it('tap 卡片觸發 onNavigate 直入導航', () => {
    const onNavigate = vi.fn();
    render(<PickupHeroCard record={baseRecord} theme={theme} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('button', { name: '導航前往 B2 取車' }));
    expect(onNavigate).toHaveBeenCalledWith(baseRecord);
  });

  it('有照片時渲染大縮圖', () => {
    const withPhoto = { ...baseRecord, photoData: 'data:image/png;base64,x', hasPhoto: true };
    const { container } = render(
      <PickupHeroCard record={withPhoto} theme={theme} onNavigate={() => {}} />,
    );
    expect(container.querySelector('img')).not.toBeNull();
  });

  it('未填車號（N/A sentinel）顯示待填文案', () => {
    render(
      <PickupHeroCard
        record={{ ...baseRecord, plateNumber: 'N/A' }}
        theme={theme}
        onNavigate={() => {}}
      />,
    );
    expect(screen.getByText('未填車號')).toBeInTheDocument();
    expect(screen.queryByText('N/A')).toBeNull();
  });
});

describe('formatElapsed', () => {
  it('依經過時間回傳分鐘/小時/天級相對時間；<1 分鐘回傳 null', () => {
    const now = Date.now();
    expect(formatElapsed(now - 10_000, 'zh-TW')).toBeNull();
    expect(formatElapsed(now - 5 * 60_000, 'zh-TW')).toBe('5 分鐘前');
    expect(formatElapsed(now - 3 * 3_600_000, 'zh-TW')).toBe('3 小時前');
    expect(formatElapsed(now - 2 * 86_400_000, 'zh-TW')).toBe('2 天前');
  });
});
