/**
 * HomeTab + HistoryTab Smoke Tests
 * 確保元件在正常 props 下渲染而不崩潰
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { type ReactNode } from 'react';
import { act } from 'react';
import i18n from '../../i18n';
import { useStore } from '../../store/useStore';
import { HomeTab } from '../HomeTab';
import { HistoryTab } from '../HistoryTab';

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

function renderWith(ui: ReactNode) {
  return render(ui, { wrapper: Wrapper });
}

const BASE_MEMBERS = [
  { id: 'me', name: 'Alice', avatarUrl: 'seed-me', isActive: true },
  { id: 'm1', name: 'Bob', avatarUrl: 'seed-m1', isActive: true },
];

const BASE_STATE = {
  trips: [{ id: 'trip-1', name: 'Trip 1', createdAt: 0 }],
  currentTripId: 'trip-1',
  members: BASE_MEMBERS,
  expenses: [],
  splitMode: 'split_evenly' as const,
  calculatorValue: '',
  focusedMemberId: null,
  itemizedValues: {},
  payerId: 'me',
  expenseNote: '',
  activeTab: 'home' as const,
  // 重置幣別相關狀態，避免設定 currency/krwPerTwd 的測試洩漏污染後續測試
  currency: 'TWD' as const,
  currencyManuallySet: false,
  krwPerTwd: null,
  rateUpdatedAt: null,
  // 補齊其餘 test-mutable 欄位，避免未來測試設值後跨測試洩漏（與 store 初始值對齊）
  expenseCategory: null,
  settledPayments: [],
  catPlayMode: false,
};

beforeEach(() => {
  useStore.setState(BASE_STATE);
});

// ── HomeTab ──────────────────────────────────────────────────────────────────

describe('HomeTab', () => {
  it('渲染不崩潰（空值）', () => {
    const { container } = renderWith(<HomeTab />);
    expect(container).toBeTruthy();
  });

  it('顯示 NT$ 總金額', () => {
    useStore.setState({ calculatorValue: '300' });
    renderWith(<HomeTab />);
    const el = document.querySelector('h1');
    expect(el?.textContent).toContain('NT$');
  });

  it('calculatorValue 有值時顯示表達式', () => {
    useStore.setState({ calculatorValue: '10+20' });
    renderWith(<HomeTab />);
    expect(screen.getByText('10+20')).toBeInTheDocument();
  });

  it('顯示成員列表', () => {
    renderWith(<HomeTab />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('itemized 模式渲染不崩潰', () => {
    useStore.setState({ splitMode: 'itemized', itemizedValues: { me: '100', m1: '200' } });
    const { container } = renderWith(<HomeTab />);
    expect(container).toBeTruthy();
  });

  it('幣別為 KRW 時顯示 ₩ 金額', () => {
    useStore.setState({ calculatorValue: '10000', currency: 'KRW' });
    renderWith(<HomeTab />);
    const el = document.querySelector('h1');
    expect(el?.textContent).toContain('₩');
    expect(el?.textContent).toContain('10,000');
  });

  it('KRW 模式有匯率時顯示 ≈ NT$ 換算提示', () => {
    // 1 TWD = 40 KRW → 10000 KRW ≈ NT$ 250
    useStore.setState({ calculatorValue: '10000', currency: 'KRW', krwPerTwd: 40 });
    renderWith(<HomeTab />);
    expect(screen.getByText(/≈ NT\$ 250/)).toBeInTheDocument();
  });

  it('TWD 模式有匯率時顯示 ≈ ₩ 換算提示', () => {
    // 1 TWD = 40 KRW → 100 TWD ≈ ₩4,000
    useStore.setState({ calculatorValue: '100', currency: 'TWD', krwPerTwd: 40 });
    renderWith(<HomeTab />);
    expect(screen.getByText(/≈ ₩4,000/)).toBeInTheDocument();
  });

  it('無匯率時不顯示換算提示', () => {
    useStore.setState({ calculatorValue: '10000', currency: 'KRW', krwPerTwd: null });
    renderWith(<HomeTab />);
    expect(screen.queryByText(/≈ NT\$/)).not.toBeInTheDocument();
  });

  it('KRW ₩10,000 draft 切 TWD 後不得顯示 NT$ 10,000（回歸 R1）', () => {
    useStore.setState({ calculatorValue: '10000', currency: 'KRW' });
    renderWith(<HomeTab />);

    act(() => {
      useStore.getState().setCurrency('TWD');
    });

    // draft 已清空、畫面回到空狀態提示，且不得殘留任何幣別標籤的 10,000
    expect(useStore.getState().calculatorValue).toBe('');
    expect(screen.getByText(i18n.t('home.empty_hint_evenly'))).toBeInTheDocument();
    expect(screen.queryByText(/NT\$\s*10,000|₩10,000/)).not.toBeInTheDocument();
  });

  it('itemized 模式停用目前焦點成員後會自動切換到仍有效的成員', () => {
    useStore.setState({
      splitMode: 'itemized',
      focusedMemberId: 'm1',
      itemizedValues: { me: '100', m1: '200' },
    });
    renderWith(<HomeTab />);

    act(() => {
      useStore.getState().toggleMemberActive('m1');
    });

    expect(useStore.getState().members.find((member) => member.id === 'm1')?.isActive).toBe(false);
    expect(useStore.getState().focusedMemberId).toBe('me');
  });
});

// ── HistoryTab ───────────────────────────────────────────────────────────────

const EXPENSE_1 = {
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

describe('HistoryTab', () => {
  it('無消費時渲染不崩潰', () => {
    const { container } = renderWith(<HistoryTab />);
    expect(container).toBeTruthy();
  });

  it('有消費時顯示金額', () => {
    useStore.setState({ expenses: [EXPENSE_1] });
    renderWith(<HistoryTab />);
    // Multiple elements may show 300 (heading + detail)
    expect(screen.getAllByText(/300/).length).toBeGreaterThan(0);
  });

  it('有備注時顯示備注', () => {
    useStore.setState({
      expenses: [{ ...EXPENSE_1, id: 'e2', note: 'Dinner 晚餐' }],
    });
    renderWith(<HistoryTab />);
    expect(screen.getAllByText('Dinner 晚餐').length).toBeGreaterThan(0);
  });

  it('點擊消費行展開顯示分攤明細', () => {
    useStore.setState({ expenses: [EXPENSE_1] });
    renderWith(<HistoryTab />);
    const card = screen.getByTestId('expense-card');
    const row = card.querySelector('div[class*="cursor-pointer"]');
    expect(row).not.toBeNull();
    fireEvent.click(row as HTMLElement);

    expect(screen.getByText(i18n.t('history.breakdown'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('history.edit'))).toBeInTheDocument();
  });

  it('展開後點擊刪除進入軟刪除並顯示 undo toast', () => {
    useStore.setState({ expenses: [EXPENSE_1] });
    renderWith(<HistoryTab />);
    const card = screen.getByTestId('expense-card');
    fireEvent.click(card.querySelector('div[class*="cursor-pointer"]')!);

    const deleteBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.trim().endsWith(i18n.t('history.delete')),
    );
    expect(deleteBtn).toBeDefined();
    fireEvent.click(deleteBtn as HTMLElement);

    // 軟刪除：store 仍保留該筆，但卡片自列表隱藏並出現 undo toast
    expect(useStore.getState().expenses).toHaveLength(1);
    expect(screen.queryByTestId('expense-card')).not.toBeInTheDocument();
    const toast = screen.getByTestId('undo-toast');
    expect(toast).toHaveTextContent(i18n.t('history.undo'));
  });

  it('有 currency 快照的 KRW 支出以 ₩ 顯示金額', () => {
    useStore.setState({ expenses: [{ ...EXPENSE_1, currency: 'KRW' }], currency: 'KRW' });
    renderWith(<HistoryTab />);
    expect(document.body.textContent).toContain('₩');
  });

  it('缺 currency 的舊支出在全域 KRW 時仍顯示 NT$', () => {
    useStore.setState({ expenses: [EXPENSE_1], currency: 'KRW' });
    renderWith(<HistoryTab />);
    expect(document.body.textContent).toContain('NT$');
    expect(document.body.textContent).not.toContain('₩');
  });

  it('TWD 300 快照在全域 KRW、krwPerTwd=40 顯示 ≈ ₩12,000', () => {
    useStore.setState({
      expenses: [{ ...EXPENSE_1, currency: 'TWD' }],
      currency: 'KRW',
      krwPerTwd: 40,
    });
    renderWith(<HistoryTab />);
    expect(screen.getByText(/≈ ₩12,000/)).toBeInTheDocument();
  });

  it('KRW 9000 快照（rate 45）在全域 TWD 顯示 ≈ NT$ 200', () => {
    useStore.setState({
      expenses: [{ ...EXPENSE_1, totalAmount: 9000, currency: 'KRW', exchangeRateKrwPerTwd: 45 }],
      currency: 'TWD',
    });
    renderWith(<HistoryTab />);
    expect(screen.getByText(/≈ NT\$ 200/)).toBeInTheDocument();
  });

  it('快照幣別 = 全域幣別時不顯示 ≈ 提示', () => {
    useStore.setState({
      expenses: [{ ...EXPENSE_1, currency: 'TWD' }],
      currency: 'TWD',
      krwPerTwd: 40,
    });
    renderWith(<HistoryTab />);
    expect(screen.queryByText(/≈/)).not.toBeInTheDocument();
  });

  it('rate 缺失（null）時不顯示 ≈ 提示', () => {
    useStore.setState({
      expenses: [{ ...EXPENSE_1, totalAmount: 9000, currency: 'KRW', exchangeRateKrwPerTwd: null }],
      currency: 'TWD',
      krwPerTwd: null,
    });
    renderWith(<HistoryTab />);
    expect(screen.queryByText(/≈/)).not.toBeInTheDocument();
  });

  it('多筆消費顯示 settlement 區塊', () => {
    useStore.setState({
      expenses: [
        EXPENSE_1,
        {
          id: 'e2',
          tripId: 'trip-1',
          type: 'split_evenly' as const,
          participantIds: ['me', 'm1'],
          paidBy: 'm1',
          totalAmount: 60,
          perPersonAmounts: { me: 30, m1: 30 },
          note: '',
          createdAt: Date.now() + 1,
        },
      ],
    });
    renderWith(<HistoryTab />);
    // me 墊付 300（分攤 150/150）＋ m1 墊付 60（分攤 30/30）→ m1 應付 me 120
    expect(screen.getByText(i18n.t('history.settlements'))).toBeInTheDocument();
    const row = screen.getByTestId('settlement-row');
    expect(row).toHaveTextContent('NT$ 120');
  });

  it('混幣行程顯示警告並隱藏總額與結算（避免跨幣別錯誤加總）', () => {
    useStore.setState({
      expenses: [
        { ...EXPENSE_1, id: 'mix-twd', currency: 'TWD', totalAmount: 300 },
        {
          id: 'mix-krw',
          tripId: 'trip-1',
          type: 'split_evenly' as const,
          participantIds: ['me', 'm1'],
          paidBy: 'm1',
          totalAmount: 9000,
          perPersonAmounts: { me: 4500, m1: 4500 },
          note: '',
          createdAt: Date.now() + 1,
          currency: 'KRW',
        },
      ],
    });
    renderWith(<HistoryTab />);
    expect(screen.getByText(i18n.t('history.mixed_currency_warning'))).toBeInTheDocument();
    expect(screen.queryByText(i18n.t('history.settlements'))).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.t('history.balances'))).not.toBeInTheDocument();
  });

  it('單一幣別行程不顯示混幣警告', () => {
    useStore.setState({
      expenses: [
        { ...EXPENSE_1, id: 'same-1', currency: 'TWD' },
        {
          ...EXPENSE_1,
          id: 'same-2',
          currency: 'TWD',
          paidBy: 'm1',
          totalAmount: 60,
          perPersonAmounts: { me: 30, m1: 30 },
        },
      ],
    });
    renderWith(<HistoryTab />);
    expect(screen.queryByText(i18n.t('history.mixed_currency_warning'))).not.toBeInTheDocument();
  });
});
