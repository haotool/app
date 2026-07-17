/**
 * G1 觸控目標鎖定測試：曾被 review 點名 <44px 的互動元素必須帶 min-h-11 / h-11（44px）。
 * jsdom 無版面引擎，以 class 斷言鎖定（瀏覽器實高由 QA 量測腳本驗證）。
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { type ReactNode } from 'react';
import i18n from '../../i18n';
import { useStore } from '../../store/useStore';
import { SettingsTab } from '../SettingsTab';
import { HomeTab } from '../HomeTab';
import { HistoryTab } from '../HistoryTab';
import { UpdatePrompt } from '../UpdatePrompt';

vi.mock('../../hooks/useUpdatePrompt', () => ({
  useUpdatePrompt: () => ({
    visible: true,
    needRefresh: true,
    offlineReady: false,
    handleUpdate: vi.fn(),
    handleDismiss: vi.fn(),
  }),
}));

function renderWith(ui: ReactNode) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

const EXPENSE = {
  id: 'e1',
  tripId: 'trip-1',
  type: 'split_evenly' as const,
  participantIds: ['me', 'm1'],
  paidBy: 'me',
  totalAmount: 300,
  perPersonAmounts: { me: 150, m1: 150 },
  note: '',
  createdAt: Date.now(),
};

beforeEach(() => {
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
    krwPerTwd: null,
    rateUpdatedAt: '2026/07/16 08:00:00',
    rateUpdatedAtIso: new Date().toISOString(),
    rateFetchFailed: true,
    calculatorValue: '',
    itemizedValues: {},
    splitMode: 'split_evenly',
    payerId: 'me',
    expenseNote: '',
    expenseCategory: null,
    settledPayments: [],
  });
});

describe('G1 觸控目標 ≥44px（min-h-11 class 鎖定）', () => {
  it('Settings：語系、幣別與匯率重試按鈕', () => {
    renderWith(<SettingsTab />);

    for (const name of ['繁中', 'EN', '한국어', '日本語']) {
      const btn = screen.getByText(name).closest('button');
      expect(btn?.className).toContain('min-h-11');
    }

    for (const symbol of ['NT$', '₩']) {
      const btn = screen.getByText(symbol).closest('button');
      expect(btn?.className).toContain('min-h-11');
    }

    const retry = screen.getByText(i18n.t('settings.rate_retry')).closest('button');
    expect(retry?.className).toContain('min-h-11');
  });

  it('Home：平分／個別模式切換按鈕', () => {
    renderWith(<HomeTab />);

    for (const key of ['home.split_evenly', 'home.itemized']) {
      const btn = screen.getByText(i18n.t(key)).closest('button');
      expect(btn?.className).toContain('min-h-11');
    }
  });

  it('Home：備註類別展開觸發鈕為 44px 命中區（w-11 h-11）', () => {
    renderWith(<HomeTab />);

    const trigger = screen.getByRole('button', { name: i18n.t('home.pick_category') });
    expect(trigger.className).toContain('w-11');
    expect(trigger.className).toContain('h-11');
  });

  it('UpdatePrompt：立即更新與關閉兩顆 CTA', () => {
    renderWith(<UpdatePrompt />);

    for (const key of ['update.update_button', 'update.close']) {
      const btn = screen.getByText(i18n.t(key)).closest('button');
      expect(btn?.className).toContain('min-h-11');
    }
  });

  it('History：頂部分享按鈕', () => {
    useStore.setState({ expenses: [EXPENSE] });
    renderWith(<HistoryTab />);

    // app.share 與 balance_share 英文同為 Share：取按鈕型的分享觸發器斷言
    const share = screen
      .getAllByText(i18n.t('app.share'))
      .map((el) => el.closest('button'))
      .find((btn) => btn !== null);
    expect(share).toBeTruthy();
    expect(share?.className).toContain('min-h-11');
  });

  it('History：展開後新增備注鈕（min-h-11）與備注確認鈕（w-11 h-11）', () => {
    useStore.setState({ expenses: [EXPENSE] });
    renderWith(<HistoryTab />);

    fireEvent.click(screen.getByTestId('expense-card').querySelector('button[aria-expanded]')!);

    const addNote = screen.getByText(i18n.t('history.add_note')).closest('button');
    expect(addNote?.className).toContain('min-h-11');

    fireEvent.click(addNote!);
    const confirm = screen.getByRole('button', { name: i18n.t('common.confirm') });
    expect(confirm.className).toContain('w-11');
    expect(confirm.className).toContain('h-11');
  });

  it('EditExpenseSheet：付款人 chips', () => {
    useStore.setState({ expenses: [EXPENSE] });
    renderWith(<HistoryTab />);

    // 展開消費卡 → Edit 開啟 sheet
    const card = screen.getByTestId('expense-card');
    fireEvent.click(card.querySelector('button[aria-expanded]')!);
    fireEvent.click(screen.getByText(i18n.t('history.edit')));

    const payerHeading = screen.getByText(i18n.t('history.edit_payer'));
    const chipContainer = payerHeading.parentElement?.querySelector('div.flex.flex-wrap');
    const chips = Array.from(chipContainer?.querySelectorAll('button') ?? []);
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of chips) {
      expect(chip.className).toContain('min-h-11');
    }
  });
});
