/**
 * History 卡鍵盤可達性（G10 / Sonnet Major 迴歸）：
 * 展開觸發器為標題列原生 button（Enter/Space 啟動由瀏覽器保證），
 * 展開內容移出觸發器（無巢狀 button），收合時 inert 消除幻影可聚焦項。
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

function getCard(): HTMLElement {
  return screen.getByTestId('expense-card');
}

function getCardTrigger(): HTMLElement {
  const trigger = getCard().querySelector('button[aria-expanded]');
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
  it('觸發器為原生 button、可聚焦且曝露 aria-expanded', () => {
    renderHistory();
    const trigger = getCardTrigger();

    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger.tabIndex).toBe(0);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('啟動觸發器切換展開，aria-expanded 同步', () => {
    renderHistory();
    const trigger = getCardTrigger();

    // 原生 button 的 Enter/Space 啟動由瀏覽器對映為 click。
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(i18n.t('history.breakdown'))).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('觸發器內無巢狀互動元素，展開內容位於觸發器外', () => {
    renderHistory();
    const trigger = getCardTrigger();

    fireEvent.click(trigger);
    expect(trigger.querySelector('button, input, [role="button"]')).toBeNull();
    expect(trigger.contains(screen.getByText(i18n.t('history.breakdown')))).toBe(false);
  });

  it('收合時展開內容為 inert（無幻影可聚焦項），展開後解除', () => {
    renderHistory();
    const trigger = getCardTrigger();

    // 觸發器相鄰的明細容器（swipe 揭露層另有獨立 inert 治理）
    const details = getCard().querySelector('button[aria-expanded] + div[inert]');
    expect(details).not.toBeNull();

    fireEvent.click(trigger);
    expect(getCard().querySelector('button[aria-expanded] + div[inert]')).toBeNull();
  });

  it('內部備註輸入的 Enter 不觸發卡片收合', () => {
    renderHistory();
    const trigger = getCardTrigger();

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    // 開啟備註編輯 → 在 input 內按 Enter（事件冒泡至卡片容器）
    fireEvent.click(screen.getByText(i18n.t('history.add_note')));
    const noteInput = screen.getByPlaceholderText(i18n.t('history.note_placeholder'));
    fireEvent.keyDown(noteInput, { key: 'Enter' });

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('swipe 揭露的刪除鈕（隱藏破壞性控制項）', () => {
  function getSwipeDeleteButton(): HTMLElement {
    // 展開卡內刪除鈕的 accessible name 為「刪除」文字；swipe 鈕以 delete_title 全名區分
    return screen.getByRole('button', { name: i18n.t('history.delete_title') });
  }

  function swipeCardOpen(card: HTMLElement) {
    fireEvent.touchStart(card, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(card, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(card);
  }

  it('未滑出時位於 inert 容器內：不在 Tab 順序、Enter 無法觸發刪除', () => {
    renderHistory();

    // inert 由瀏覽器原生阻斷聚焦與啟動；結構鎖定未滑出狀態必為 inert 子樹
    expect(getSwipeDeleteButton().closest('[inert]')).not.toBeNull();
  });

  it('左滑揭露後解除 inert，點擊觸發軟刪除', () => {
    renderHistory();
    const card = getCard();

    swipeCardOpen(card);
    const btn = getSwipeDeleteButton();
    expect(btn.closest('[inert]')).toBeNull();

    fireEvent.click(btn);
    expect(screen.getByTestId('undo-toast')).toBeInTheDocument();
    expect(screen.queryByTestId('expense-card')).not.toBeInTheDocument();
  });

  it('展開卡內的刪除鈕（鍵盤刪除路徑）不受 swipe 治理影響', () => {
    renderHistory();

    fireEvent.click(getCardTrigger());
    const inlineDelete = screen.getByRole('button', { name: i18n.t('history.delete') });
    expect(inlineDelete.closest('[inert]')).toBeNull();
    expect(inlineDelete.className).toContain('min-h-11');
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
