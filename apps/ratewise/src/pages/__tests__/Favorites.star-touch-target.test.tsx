// @vitest-environment jsdom

/**
 * 收藏頁星號 toggle 觸控熱區迴歸測試（#638）
 *
 * jsdom 無法量測 Tailwind 實際 bounding box，改以 class 合約斷言：
 * min-w-11/min-h-11（44px）＋負邊距補償（margin box 維持原尺寸、列高不變）。
 * 同時守護星號按鈕與 dnd 拖曳把手為不同元素，避免熱區擴大後誤觸拖曳。
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Favorites from '../Favorites';
import { DND_DRAG_HANDLE_ATTRIBUTE } from '../../hooks/usePullToRefresh';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../components/SEOHelmet', () => ({
  SEOHelmet: () => null,
}));

vi.mock('../../features/ratewise/hooks/useExchangeRates', () => ({
  useExchangeRates: () => ({
    rates: { USD: 31.5, JPY: 0.21 },
    details: {},
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../features/ratewise/hooks/useCurrencyConverter', () => ({
  useCurrencyConverter: () => ({
    favorites: ['USD', 'JPY'],
    history: [],
    toggleFavorite: vi.fn(),
    reorderFavorites: vi.fn(),
    clearAllHistory: vi.fn(),
    reconvertFromHistory: vi.fn(),
    setFromCurrency: vi.fn(),
    setToCurrency: vi.fn(),
  }),
}));

describe('收藏頁星號 toggle 觸控熱區（#638）', () => {
  it('星號按鈕 class 含 min-w-11/min-h-11（44px 熱區）與負邊距補償', () => {
    render(<Favorites />);

    const starToggle = screen.getByTestId('star-toggle-USD');
    expect(starToggle.className).toContain('min-w-11');
    expect(starToggle.className).toContain('min-h-11');
    // 負邊距補償：margin box 維持 w-7（28px）× 22px，列高與左緣對齊不變。
    expect(starToggle.className).toContain('-mx-2');
    expect(starToggle.className).toContain('-my-[11px]');
  });

  it('星號按鈕不在 dnd 拖曳把手內，熱區擴大不與拖曳互相干擾', () => {
    render(<Favorites />);

    const starToggle = screen.getByTestId('star-toggle-USD');
    expect(starToggle.closest(`[${DND_DRAG_HANDLE_ATTRIBUTE}]`)).toBeNull();

    // 拖曳把手仍為獨立的相鄰元素（收藏幣才有把手）。
    const dragZone = screen.getByTestId('drag-zone-USD');
    expect(dragZone.hasAttribute(DND_DRAG_HANDLE_ATTRIBUTE)).toBe(true);
    expect(dragZone.contains(starToggle)).toBe(false);
  });

  it('TWD 固定星為裝飾元素，不套用互動熱區', () => {
    render(<Favorites />);

    const twdStar = screen.getByTestId('twd-star-fixed');
    expect(twdStar.tagName).toBe('DIV');
    expect(twdStar.className).toContain('w-7');
  });
});
