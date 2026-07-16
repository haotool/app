/**
 * History 卡鍵盤可達性（G10 / Sonnet Major 迴歸）：
 * 展開觸發器必須可 Tab 聚焦、Enter/Space 切換並曝露 aria-expanded；
 * 收合內容必須 inert，消除螢幕閱讀器的幻影可聚焦項。
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { useStore } from '../../store/useStore';
import { HistoryTab } from '../HistoryTab';

const MEMBERS = [
  { id: 'me', name: 'Alice', avatarUrl: 'seed-me', isActive: true },
  { id: 'm1', name: 'Bob', avatarUrl: 'seed-m1', isActive: true },
];

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

function renderHistory() {
  return render(
    <I18nextProvider i18n={i18n}>
      <HistoryTab />
    </I18nextProvider>,
  );
}

function getCardTrigger(): HTMLElement {
  const card = screen.getByTestId('expense-card');
  const trigger = card.querySelector('[role="button"][aria-expanded]');
  expect(trigger).not.toBeNull();
  return trigger as HTMLElement;
}

beforeEach(() => {
  useStore.setState({
    trips: [{ id: 'trip-1', name: 'Trip 1', createdAt: 0 }],
    currentTripId: 'trip-1',
    members: MEMBERS,
    expenses: [EXPENSE],
    activeTab: 'history',
    currency: 'TWD',
    krwPerTwd: null,
    settledPayments: [],
  });
});

describe('費用卡展開觸發器', () => {
  it('可聚焦且曝露 role/aria-expanded', () => {
    renderHistory();
    const trigger = getCardTrigger();

    expect(trigger.getAttribute('role')).toBe('button');
    expect(trigger.tabIndex).toBe(0);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('Enter 展開、Space 收合，aria-expanded 同步', () => {
    renderHistory();
    const trigger = getCardTrigger();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(i18n.t('history.breakdown'))).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: ' ' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('收合時展開內容為 inert（無幻影可聚焦項），展開後解除', () => {
    renderHistory();
    const trigger = getCardTrigger();

    const details = trigger.querySelector('div[inert]');
    expect(details).not.toBeNull();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(trigger.querySelector('div[inert]')).toBeNull();
  });

  it('內部備註輸入的 Enter 不觸發卡片收合', () => {
    renderHistory();
    const trigger = getCardTrigger();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    // 開啟備註編輯 → 在 input 內按 Enter（事件冒泡至卡片）
    fireEvent.click(screen.getByText(i18n.t('history.add_note')));
    const noteInput = screen.getByPlaceholderText(i18n.t('history.note_placeholder'));
    fireEvent.keyDown(noteInput, { key: 'Enter' });

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('結清與各人結算', () => {
  const EXPENSE_2 = {
    id: 'e2',
    tripId: 'trip-1',
    type: 'split_evenly' as const,
    participantIds: ['me', 'm1'],
    paidBy: 'm1',
    totalAmount: 60,
    perPersonAmounts: { me: 30, m1: 30 },
    note: '',
    createdAt: Date.now() + 1,
  };

  it('結清列可鍵盤切換結清狀態（aria-pressed 同步）', () => {
    useStore.setState({ expenses: [EXPENSE, EXPENSE_2] });
    renderHistory();

    const row = screen.getByTestId('settlement-row');
    expect(row.getAttribute('role')).toBe('button');
    expect(row.tabIndex).toBe(0);
    expect(row.getAttribute('aria-pressed')).toBe('false');

    fireEvent.keyDown(row, { key: 'Enter' });
    expect(row.getAttribute('aria-pressed')).toBe('true');
    expect(useStore.getState().settledPayments).toHaveLength(1);

    fireEvent.keyDown(row, { key: ' ' });
    expect(row.getAttribute('aria-pressed')).toBe('false');
  });

  it('各人結算卡可鍵盤展開明細且收合內容 inert', () => {
    useStore.setState({ expenses: [EXPENSE, EXPENSE_2] });
    renderHistory();

    const balanceCards = document.querySelectorAll('[role="button"][aria-expanded]');
    // 至少含各人結算卡（費用卡另計）；取帶 inert 收合明細者驗證
    const memberCard = Array.from(balanceCards).find(
      (el) => el.getAttribute('aria-expanded') === 'false' && el.querySelector('div[inert]'),
    ) as HTMLElement | undefined;
    expect(memberCard).toBeDefined();

    fireEvent.keyDown(memberCard!, { key: 'Enter' });
    expect(memberCard!.getAttribute('aria-expanded')).toBe('true');
    expect(memberCard!.querySelector('div[inert]')).toBeNull();
  });
});
