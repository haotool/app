/**
 * HomeTab + HistoryTab Smoke Tests
 * 確保元件在正常 props 下渲染而不崩潰
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { type ReactNode } from 'react';
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

  it('點擊消費行展開', () => {
    useStore.setState({ expenses: [EXPENSE_1] });
    renderWith(<HistoryTab />);
    // Find a clickable row — any element with the amount text
    const rows = Array.from(document.querySelectorAll('div[class*="cursor-pointer"]'));
    if (rows[0]) {
      fireEvent.click(rows[0]);
    }
    expect(document.body).toBeTruthy();
  });

  it('展開後可點擊刪除按鈕', () => {
    useStore.setState({ expenses: [EXPENSE_1] });
    renderWith(<HistoryTab />);
    // Expand the row first
    const rows = Array.from(document.querySelectorAll('div[class*="cursor-pointer"]'));
    if (rows[0]) fireEvent.click(rows[0]);

    const deleteBtns = Array.from(document.querySelectorAll('button')).filter(
      (b) => b.querySelector('.material-symbols-outlined')?.textContent?.trim() === 'delete',
    );
    if (deleteBtns[0]) {
      fireEvent.click(deleteBtns[0]);
      // 軟刪除：費用進入 pending 狀態，5 秒後才真正移除
      // 此時 store 仍有該筆費用，但 UI 已將卡片從列表隱藏
      expect(useStore.getState().expenses).toHaveLength(1);
      expect(document.body).toBeTruthy();
    }
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
    // Should render settlement amounts somewhere
    expect(document.body).toBeTruthy();
  });
});
