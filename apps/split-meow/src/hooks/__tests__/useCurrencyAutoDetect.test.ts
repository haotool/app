import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type * as CurrenciesModule from '../../config/currencies';
import type * as ExchangeRateModule from '../../lib/exchangeRate';
import { useStore } from '../../store/useStore';

vi.mock('../../lib/exchangeRate', async (importOriginal) => {
  const actual = await importOriginal<typeof ExchangeRateModule>();
  return {
    ...actual,
    fetchMoneyboxRate: vi.fn().mockResolvedValue({
      krwPerTwd: 43.5,
      updatedAt: '2026-01-01',
      updatedAtIso: '2026-01-01T00:00:00Z',
    }),
  };
});

vi.mock('../../config/currencies', async (importOriginal) => {
  const actual = await importOriginal<typeof CurrenciesModule>();
  return {
    ...actual,
    detectCurrencyFromTimezone: vi.fn(() => 'KRW' as const),
  };
});

import { useCurrencyAutoDetect } from '../useCurrencyAutoDetect';
import { detectCurrencyFromTimezone } from '../../config/currencies';
import { fetchMoneyboxRate } from '../../lib/exchangeRate';

describe('useCurrencyAutoDetect', () => {
  beforeEach(() => {
    vi.mocked(detectCurrencyFromTimezone).mockReturnValue('KRW');
    vi.mocked(fetchMoneyboxRate).mockResolvedValue({
      krwPerTwd: 43.5,
      updatedAt: '2026-01-01',
      updatedAtIso: '2026-01-01T00:00:00Z',
    });
    useStore.setState({
      currency: 'TWD',
      currencyManuallySet: false,
      currentTripId: 'default-trip',
      expenses: [],
      calculatorValue: '',
      itemizedValues: {},
      krwPerTwd: null,
      rateUpdatedAt: null,
      rateUpdatedAtIso: null,
      rateFetchFailed: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('混幣風險時跳過自動切換幣別', async () => {
    useStore.setState({
      expenses: [
        {
          id: 'exp-1',
          tripId: 'default-trip',
          type: 'split_evenly',
          participantIds: ['me'],
          paidBy: 'me',
          totalAmount: 100,
          perPersonAmounts: { me: 100 },
          note: '',
          createdAt: 1,
          currency: 'TWD',
        },
      ],
    });

    renderHook(() => useCurrencyAutoDetect());

    await waitFor(() => {
      expect(useStore.getState().currency).toBe('TWD');
    });
  });

  it('無混幣風險時依時區自動切換', async () => {
    renderHook(() => useCurrencyAutoDetect());

    await waitFor(() => {
      expect(useStore.getState().currency).toBe('KRW');
    });
  });

  it('draft 非空時跳過自動切換，幣別與 draft 均保留（Blocking#3）', async () => {
    useStore.setState({ calculatorValue: '30000' });

    renderHook(() => useCurrencyAutoDetect());

    // 匯率 fetch 完成後仍未切幣，證明非時序巧合
    await waitFor(() => {
      expect(useStore.getState().krwPerTwd).toBe(43.5);
    });
    expect(useStore.getState().currency).toBe('TWD');
    expect(useStore.getState().calculatorValue).toBe('30000');
  });

  it('itemized draft 非空時同樣跳過自動切換', async () => {
    useStore.setState({ itemizedValues: { me: '9000' } });

    renderHook(() => useCurrencyAutoDetect());

    await waitFor(() => {
      expect(useStore.getState().krwPerTwd).toBe(43.5);
    });
    expect(useStore.getState().currency).toBe('TWD');
    expect(useStore.getState().itemizedValues).toEqual({ me: '9000' });
  });

  it('成功取得匯率時寫入 ISO 時間戳並清除失敗旗標', async () => {
    useStore.setState({ rateFetchFailed: true });
    renderHook(() => useCurrencyAutoDetect());

    await waitFor(() => {
      const s = useStore.getState();
      expect(s.krwPerTwd).toBe(43.5);
      expect(s.rateUpdatedAtIso).toBe('2026-01-01T00:00:00Z');
      expect(s.rateFetchFailed).toBe(false);
    });
  });

  it('fetch 失敗時標記 rateFetchFailed 且沿用快取值', async () => {
    vi.mocked(fetchMoneyboxRate).mockRejectedValue(new Error('offline'));
    useStore.setState({ krwPerTwd: 40, rateUpdatedAt: 'cached' });

    renderHook(() => useCurrencyAutoDetect());

    await waitFor(() => {
      expect(useStore.getState().rateFetchFailed).toBe(true);
    });
    expect(useStore.getState().krwPerTwd).toBe(40);
  });

  it('回前景且快照過期時 refetch', async () => {
    renderHook(() => useCurrencyAutoDetect());
    await waitFor(() => {
      expect(fetchMoneyboxRate).toHaveBeenCalledTimes(1);
    });

    // 快照過期（>6h）→ visibilitychange 觸發 refetch
    useStore.setState({ rateUpdatedAtIso: '2020-01-01T00:00:00Z' });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => {
      expect(fetchMoneyboxRate).toHaveBeenCalledTimes(2);
    });
  });

  it('回前景但快照未過期時不 refetch', async () => {
    renderHook(() => useCurrencyAutoDetect());
    await waitFor(() => {
      expect(fetchMoneyboxRate).toHaveBeenCalledTimes(1);
    });

    useStore.setState({ rateUpdatedAtIso: new Date().toISOString() });
    document.dispatchEvent(new Event('visibilitychange'));

    // 等待微任務排空後仍只呼叫一次
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchMoneyboxRate).toHaveBeenCalledTimes(1);
  });

  // ── R11 自動偵測生命週期：draft 非空 → 空時重跑偵測 ──────────────────────────

  it('R11：首載 draft 阻擋後，draft 清空即自動切換', async () => {
    useStore.setState({ calculatorValue: '30000' });

    renderHook(() => useCurrencyAutoDetect());

    await waitFor(() => {
      expect(useStore.getState().krwPerTwd).toBe(43.5);
    });
    expect(useStore.getState().currency).toBe('TWD');

    // 使用者 AC 清空 → draft 非空轉空 → 重跑偵測並靜默切換
    useStore.setState({ calculatorValue: '' });

    expect(useStore.getState().currency).toBe('KRW');
    expect(useStore.getState().currencyManuallySet).toBe(false);
  });

  it('R11：itemized draft 清空同樣重跑偵測', async () => {
    useStore.setState({ itemizedValues: { me: '9000' } });

    renderHook(() => useCurrencyAutoDetect());

    await waitFor(() => {
      expect(useStore.getState().krwPerTwd).toBe(43.5);
    });
    expect(useStore.getState().currency).toBe('TWD');

    useStore.setState({ itemizedValues: {} });

    expect(useStore.getState().currency).toBe('KRW');
  });

  it('R11：手動設定過幣別後 draft 清空不切換', async () => {
    useStore.setState({ calculatorValue: '30000' });

    renderHook(() => useCurrencyAutoDetect());
    await waitFor(() => {
      expect(useStore.getState().krwPerTwd).toBe(43.5);
    });

    // 使用者手動選定 TWD（manual=true）後清空 draft → 尊重選擇，不覆蓋
    useStore.getState().setCurrency('TWD', true);
    useStore.setState({ calculatorValue: '' });

    expect(useStore.getState().currency).toBe('TWD');
    expect(useStore.getState().currencyManuallySet).toBe(true);
  });

  it('R11：draft 清空但有混幣風險時不切換（guard 照舊）', async () => {
    useStore.setState({
      calculatorValue: '500',
      expenses: [
        {
          id: 'exp-1',
          tripId: 'default-trip',
          type: 'split_evenly',
          participantIds: ['me'],
          paidBy: 'me',
          totalAmount: 100,
          perPersonAmounts: { me: 100 },
          note: '',
          createdAt: 1,
          currency: 'TWD',
        },
      ],
    });

    renderHook(() => useCurrencyAutoDetect());
    await waitFor(() => {
      expect(useStore.getState().krwPerTwd).toBe(43.5);
    });

    useStore.setState({ calculatorValue: '' });

    expect(useStore.getState().currency).toBe('TWD');
  });

  it('R11：unmount 後 draft 清空不再觸發偵測（訂閱已清理）', async () => {
    useStore.setState({ calculatorValue: '30000' });

    const { unmount } = renderHook(() => useCurrencyAutoDetect());
    await waitFor(() => {
      expect(useStore.getState().krwPerTwd).toBe(43.5);
    });

    unmount();
    useStore.setState({ calculatorValue: '' });

    expect(useStore.getState().currency).toBe('TWD');
  });
});
