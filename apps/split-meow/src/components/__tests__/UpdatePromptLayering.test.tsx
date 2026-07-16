/**
 * 浮層層級迴歸：更新橫幅必須永不被其他浮層蓋住（brief G3 浮層 scale）。
 * EditExpenseSheet（z-[60]）開啟時，UpdatePrompt 的 z 階必須嚴格更高。
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { useStore } from '../../store/useStore';
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

// 由元素向上找最近的 z-[N] 祖先，回傳 N；找不到視為 0（未定層級）。
function nearestZ(start: Element): number {
  let el: Element | null = start;
  while (el) {
    const match = /z-\[(\d+)\]/.exec(el.className);
    if (match) return Number(match[1]);
    el = el.parentElement;
  }
  return 0;
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

describe('UpdatePrompt 層級', () => {
  it('EditExpenseSheet 開啟時更新橫幅 z 階嚴格高於 sheet', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <HistoryTab />
        <UpdatePrompt />
      </I18nextProvider>,
    );

    // 展開消費卡 → 點 Edit 開啟 EditExpenseSheet
    const card = screen.getByTestId('expense-card');
    fireEvent.click(card.querySelector('div[class*="cursor-pointer"]')!);
    fireEvent.click(screen.getByText(i18n.t('history.edit')));

    const sheetHeading = screen.getByText(i18n.t('history.edit_title'));
    const banner = screen.getByRole('alert');

    const sheetZ = nearestZ(sheetHeading);
    const bannerZ = nearestZ(banner);

    expect(sheetZ).toBeGreaterThan(0);
    expect(bannerZ).toBeGreaterThan(sheetZ);
  });
});
