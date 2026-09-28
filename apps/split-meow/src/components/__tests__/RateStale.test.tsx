/**
 * R10 匯率生命週期：快照過期（isRateStale）時，Home 與 History 的 ≈ 換算參考
 * 必須附 stale 短標（settings.rate_stale）；快照新鮮時不得出現。
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { type ReactNode } from 'react';
import i18n from '../../i18n';
import { useStore } from '../../store/useStore';
import { HomeTab } from '../HomeTab';
import { HistoryTab } from '../HistoryTab';
import { RATE_TTL_MS } from '../../lib/exchangeRate';
import { SettingsTab } from '../SettingsTab';

const gate = vi.hoisted(() => ({ enabled: false }));
vi.mock('@app/shared/fx/public', () => ({ isFxV3Public: () => gate.enabled }));

const STALE_ISO = new Date(Date.now() - RATE_TTL_MS - 60_000).toISOString();
const FRESH_ISO = new Date().toISOString();

// 全域幣別 KRW＋TWD 快照費用 → ≈ 參考使用當前匯率（R10 生命週期適用對象）。
const EXPENSE_TWD = {
  id: 'e1',
  tripId: 'trip-1',
  type: 'split_evenly' as const,
  participantIds: ['me', 'm1'],
  paidBy: 'me',
  totalAmount: 300,
  perPersonAmounts: { me: 150, m1: 150 },
  note: '',
  createdAt: Date.now(),
  currency: 'TWD' as const,
};

function renderWith(ui: ReactNode) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

beforeEach(() => {
  gate.enabled = false;
  useStore.setState({
    trips: [{ id: 'trip-1', name: 'Trip 1', createdAt: 0 }],
    currentTripId: 'trip-1',
    members: [
      { id: 'me', name: 'Me', avatarUrl: 'seed-me', isActive: true },
      { id: 'm1', name: 'Bob', avatarUrl: 'seed-m1', isActive: true },
    ],
    expenses: [],
    currency: 'TWD',
    currencyManuallySet: true,
    krwPerTwd: 42,
    rateUpdatedAt: '2026/07/17 08:00:00',
    rateUpdatedAtIso: STALE_ISO,
    rateFetchFailed: false,
    rateIsFallback: false,
    calculatorValue: '',
    itemizedValues: {},
    splitMode: 'split_evenly',
    payerId: 'me',
    expenseNote: '',
    expenseCategory: null,
    settledPayments: [],
  });
});

describe('R10：≈ 換算參考的 stale 標注', () => {
  it('Home：快照過期時總額換算附 stale 短標', () => {
    useStore.setState({ calculatorValue: '100' });
    renderWith(<HomeTab />);

    expect(screen.getByText(/≈/)).toBeInTheDocument();
    expect(screen.getByText(i18n.t('settings.rate_stale'))).toBeInTheDocument();
  });

  it('Home：快照新鮮時不出現 stale 短標', () => {
    useStore.setState({ calculatorValue: '100', rateUpdatedAtIso: FRESH_ISO });
    renderWith(<HomeTab />);

    expect(screen.getByText(/≈/)).toBeInTheDocument();
    expect(screen.queryByText(i18n.t('settings.rate_stale'))).not.toBeInTheDocument();
  });

  it('History：快照過期時費用卡換算附 stale 短標', () => {
    useStore.setState({ currency: 'KRW', expenses: [EXPENSE_TWD] });
    renderWith(<HistoryTab />);

    expect(screen.getByText(/≈/)).toBeInTheDocument();
    expect(screen.getByText(i18n.t('settings.rate_stale'))).toBeInTheDocument();
  });

  it('History：快照新鮮時不出現 stale 短標', () => {
    useStore.setState({
      currency: 'KRW',
      expenses: [EXPENSE_TWD],
      rateUpdatedAtIso: FRESH_ISO,
    });
    renderWith(<HistoryTab />);

    expect(screen.getByText(/≈/)).toBeInTheDocument();
    expect(screen.queryByText(i18n.t('settings.rate_stale'))).not.toBeInTheDocument();
  });

  it('flag 關閉時，沒有匯率快照的舊支出沿用全域匯率且不顯示來源標記', () => {
    useStore.setState({ currency: 'KRW', expenses: [EXPENSE_TWD], rateUpdatedAtIso: FRESH_ISO });
    renderWith(<HistoryTab />);

    expect(screen.getByText(/≈ ₩12,600/)).toBeInTheDocument();
    expect(screen.queryByText(i18n.t('settings.rate_fallback'))).not.toBeInTheDocument();
  });
});

describe('v3 MoneyBox legacy fallback label', () => {
  beforeEach(() => {
    gate.enabled = false;
    useStore.setState({ rateIsFallback: true });
  });

  it('shows concise reference copy only when v3 is enabled', () => {
    gate.enabled = true;
    useStore.setState({ calculatorValue: '100' });
    renderWith(<HomeTab />);
    expect(screen.getByText(i18n.t('settings.rate_fallback'))).toBeInTheDocument();
  });

  it('keeps flag-off Home copy unchanged', () => {
    useStore.setState({ calculatorValue: '100' });
    renderWith(<HomeTab />);
    expect(screen.queryByText(i18n.t('settings.rate_fallback'))).not.toBeInTheDocument();
  });

  it('shows fallback copy in History and Settings when enabled', () => {
    gate.enabled = true;
    useStore.setState({
      currency: 'KRW',
      expenses: [{ ...EXPENSE_TWD, exchangeRateKrwPerTwd: 42, rateIsFallback: true }],
    });
    const history = renderWith(<HistoryTab />);
    expect(screen.getByText(i18n.t('settings.rate_fallback'))).toBeInTheDocument();
    history.unmount();
    renderWith(<SettingsTab />);
    expect(screen.getByText(i18n.t('settings.rate_fallback'))).toBeInTheDocument();
  });

  it('uses each KRW expense provenance and leaves legacy expenses unlabelled', () => {
    gate.enabled = true;
    useStore.setState({
      currency: 'TWD',
      krwPerTwd: 40,
      rateIsFallback: false,
      expenses: [
        {
          ...EXPENSE_TWD,
          id: 'krw',
          totalAmount: 9000,
          currency: 'KRW',
          exchangeRateKrwPerTwd: 45,
          rateIsFallback: true,
        },
        { ...EXPENSE_TWD, id: 'legacy', totalAmount: 4000, currency: 'KRW' },
      ],
    });
    renderWith(<HistoryTab />);
    expect(screen.getByText(i18n.t('settings.rate_fallback'))).toBeInTheDocument();
    expect(screen.getByText(/≈ NT\$ 200/)).toBeInTheDocument();
    expect(screen.getAllByText(i18n.t('settings.rate_fallback'))).toHaveLength(1);
  });

  it('uses a TWD expense saved rate for its approximation and fallback provenance', () => {
    gate.enabled = true;
    useStore.setState({
      currency: 'KRW',
      expenses: [{ ...EXPENSE_TWD, exchangeRateKrwPerTwd: 43.5, rateIsFallback: true }],
    });
    renderWith(<HistoryTab />);

    expect(screen.getByText(/≈ ₩13,050/)).toBeInTheDocument();
    expect(screen.getByText(i18n.t('settings.rate_fallback'))).toBeInTheDocument();
    expect(screen.queryByText(i18n.t('settings.rate_stale'))).not.toBeInTheDocument();
  });

  it('leaves a legacy expense using global rate without an expense provenance label', () => {
    gate.enabled = true;
    useStore.setState({
      currency: 'KRW',
      expenses: [{ ...EXPENSE_TWD, rateIsFallback: true }],
    });
    renderWith(<HistoryTab />);

    expect(screen.getByText(/≈ ₩12,600/)).toBeInTheDocument();
    expect(screen.queryByText(i18n.t('settings.rate_fallback'))).not.toBeInTheDocument();
  });
});
