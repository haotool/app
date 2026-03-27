import { describe, it, expect, beforeEach } from 'vitest';
import { act } from 'react';
import { useStore } from '../useStore';

/** 每次測試前重置 store 到乾淨初始狀態 */
function resetStore() {
  useStore.setState({
    trips: [{ id: 'default-trip', name: 'My Trip', createdAt: 0 }],
    currentTripId: 'default-trip',
    members: [
      { id: 'me', name: 'Me', avatarUrl: 'seed-me', isActive: true },
      { id: 'm1', name: 'Oliver', avatarUrl: 'seed-m1', isActive: true },
      { id: 'm2', name: 'Luna', avatarUrl: 'seed-m2', isActive: true },
    ],
    expenses: [],
    activeTab: 'home',
    splitMode: 'split_evenly',
    calculatorValue: '',
    focusedMemberId: null,
    itemizedValues: {},
    payerId: 'me',
    expenseNote: '',
  });
}

describe('useStore', () => {
  beforeEach(() => resetStore());

  // ── Tab ────────────────────────────────────────────────────
  describe('setActiveTab', () => {
    it('history に切り替わる', () => {
      act(() => useStore.getState().setActiveTab('history'));
      expect(useStore.getState().activeTab).toBe('history');
    });
    it('settings に切り替わる', () => {
      act(() => useStore.getState().setActiveTab('settings'));
      expect(useStore.getState().activeTab).toBe('settings');
    });
  });

  // ── Trip ───────────────────────────────────────────────────
  describe('addTrip / setCurrentTrip', () => {
    it('新增行程並自動切換', () => {
      act(() => useStore.getState().addTrip('Beach Party'));
      const s = useStore.getState();
      expect(s.trips).toHaveLength(2);
      expect(s.trips[1]?.name).toBe('Beach Party');
      expect(s.currentTripId).toBe(s.trips[1]?.id);
    });

    it('setCurrentTrip 切換行程', () => {
      act(() => useStore.getState().setCurrentTrip('default-trip'));
      expect(useStore.getState().currentTripId).toBe('default-trip');
    });
  });

  // ── Member ─────────────────────────────────────────────────
  describe('addMember', () => {
    it('新增成員', () => {
      act(() => useStore.getState().addMember());
      expect(useStore.getState().members).toHaveLength(4);
    });

    it('新成員 isActive = true', () => {
      act(() => useStore.getState().addMember());
      const members = useStore.getState().members;
      const last = members[members.length - 1]!;
      expect(last.isActive).toBe(true);
    });
  });

  describe('deleteMember', () => {
    it('刪除成員', () => {
      act(() => useStore.getState().deleteMember('m1'));
      const ids = useStore.getState().members.map((m) => m.id);
      expect(ids).not.toContain('m1');
    });

    it('只剩一人時不刪除', () => {
      useStore.setState({ members: [{ id: 'me', name: 'Me', avatarUrl: 'x', isActive: true }] });
      act(() => useStore.getState().deleteMember('me'));
      expect(useStore.getState().members).toHaveLength(1);
    });

    it('刪除付款人時自動換人', () => {
      useStore.setState({ payerId: 'm1' });
      act(() => useStore.getState().deleteMember('m1'));
      const s = useStore.getState();
      expect(s.payerId).not.toBe('m1');
    });
  });

  describe('updateMember', () => {
    it('更新成員名稱', () => {
      act(() => useStore.getState().updateMember('me', '小明'));
      const me = useStore.getState().members.find((m) => m.id === 'me');
      expect(me?.name).toBe('小明');
    });
  });

  describe('toggleMemberActive', () => {
    it('切換 isActive', () => {
      act(() => useStore.getState().toggleMemberActive('m1'));
      const m1 = useStore.getState().members.find((m) => m.id === 'm1');
      expect(m1?.isActive).toBe(false);
    });

    it('再次切換恢復 true', () => {
      act(() => useStore.getState().toggleMemberActive('m1'));
      act(() => useStore.getState().toggleMemberActive('m1'));
      const m1 = useStore.getState().members.find((m) => m.id === 'm1');
      expect(m1?.isActive).toBe(true);
    });
  });

  describe('randomizeAvatar', () => {
    it('改變 avatarUrl', () => {
      const before = useStore.getState().members.find((m) => m.id === 'me')?.avatarUrl;
      act(() => useStore.getState().randomizeAvatar('me'));
      const after = useStore.getState().members.find((m) => m.id === 'me')?.avatarUrl;
      // UUID 一定不同於固定 seed（非常低機率衝突）
      expect(after).not.toBe(before);
    });
  });

  // ── Calculator ─────────────────────────────────────────────
  describe('setCalculatorValue / clearCalculator', () => {
    it('設定值', () => {
      act(() => useStore.getState().setCalculatorValue('150'));
      expect(useStore.getState().calculatorValue).toBe('150');
    });

    it('clearCalculator 清空所有計算狀態', () => {
      useStore.setState({
        calculatorValue: '100',
        itemizedValues: { me: '50' },
        expenseNote: 'test',
      });
      act(() => useStore.getState().clearCalculator());
      const s = useStore.getState();
      expect(s.calculatorValue).toBe('');
      expect(s.itemizedValues).toEqual({});
      expect(s.expenseNote).toBe('');
    });
  });

  describe('setSplitMode', () => {
    it('切換模式並清空計算值', () => {
      useStore.setState({ calculatorValue: '100', itemizedValues: { me: '50' } });
      act(() => useStore.getState().setSplitMode('itemized'));
      const s = useStore.getState();
      expect(s.splitMode).toBe('itemized');
      expect(s.calculatorValue).toBe('');
      expect(s.itemizedValues).toEqual({});
    });
  });

  describe('setItemizedValue', () => {
    it('設定逐項金額', () => {
      act(() => useStore.getState().setItemizedValue('me', '300'));
      expect(useStore.getState().itemizedValues['me']).toBe('300');
    });
  });

  describe('setPayerId / setExpenseNote / setFocusedMemberId', () => {
    it('setPayerId', () => {
      act(() => useStore.getState().setPayerId('m1'));
      expect(useStore.getState().payerId).toBe('m1');
    });

    it('setExpenseNote', () => {
      act(() => useStore.getState().setExpenseNote('晚餐'));
      expect(useStore.getState().expenseNote).toBe('晚餐');
    });

    it('setFocusedMemberId', () => {
      act(() => useStore.getState().setFocusedMemberId('m2'));
      expect(useStore.getState().focusedMemberId).toBe('m2');
    });
  });

  // ── Expense ────────────────────────────────────────────────
  describe('saveExpense — split_evenly', () => {
    it('平均分帳新增紀錄', () => {
      useStore.setState({ splitMode: 'split_evenly', calculatorValue: '300', payerId: 'me' });
      act(() => useStore.getState().saveExpense());
      const s = useStore.getState();
      expect(s.expenses).toHaveLength(1);
      expect(s.expenses[0]?.totalAmount).toBe(300);
      expect(s.expenses[0]?.type).toBe('split_evenly');
    });

    it('每人金額 = 總金額 / 人數', () => {
      useStore.setState({ splitMode: 'split_evenly', calculatorValue: '300', payerId: 'me' });
      act(() => useStore.getState().saveExpense());
      const expense = useStore.getState().expenses[0]!;
      const participantCount = Object.keys(expense.perPersonAmounts).length;
      const perPerson = expense.totalAmount / participantCount;
      Object.values(expense.perPersonAmounts).forEach((amount) => {
        expect(amount).toBeCloseTo(perPerson);
      });
    });

    it('儲存後自動切換到 history 頁', () => {
      useStore.setState({ calculatorValue: '100' });
      act(() => useStore.getState().saveExpense());
      expect(useStore.getState().activeTab).toBe('history');
    });

    it('儲存後清空計算機', () => {
      useStore.setState({ calculatorValue: '100', expenseNote: '午餐' });
      act(() => useStore.getState().saveExpense());
      const s = useStore.getState();
      expect(s.calculatorValue).toBe('');
      expect(s.expenseNote).toBe('');
    });

    it('金額為 0 不儲存', () => {
      useStore.setState({ calculatorValue: '0' });
      act(() => useStore.getState().saveExpense());
      expect(useStore.getState().expenses).toHaveLength(0);
    });

    it('無 currentTripId 不儲存', () => {
      useStore.setState({ currentTripId: null, calculatorValue: '100' });
      act(() => useStore.getState().saveExpense());
      expect(useStore.getState().expenses).toHaveLength(0);
    });

    it('無 active 成員不儲存', () => {
      useStore.setState({
        members: [{ id: 'me', name: 'Me', avatarUrl: 'x', isActive: false }],
        calculatorValue: '100',
      });
      act(() => useStore.getState().saveExpense());
      expect(useStore.getState().expenses).toHaveLength(0);
    });

    it('備注已 trim', () => {
      useStore.setState({ calculatorValue: '100', expenseNote: '  午餐  ' });
      act(() => useStore.getState().saveExpense());
      expect(useStore.getState().expenses[0]?.note).toBe('午餐');
    });
  });

  describe('saveExpense — itemized', () => {
    it('逐項分帳新增紀錄', () => {
      useStore.setState({
        splitMode: 'itemized',
        itemizedValues: { me: '100', m1: '200', m2: '150' },
        payerId: 'me',
      });
      act(() => useStore.getState().saveExpense());
      const expense = useStore.getState().expenses[0]!;
      expect(expense.totalAmount).toBeCloseTo(450);
      expect(expense.type).toBe('itemized');
    });

    it('逐項總金額為 0 不儲存', () => {
      useStore.setState({
        splitMode: 'itemized',
        itemizedValues: { me: '0', m1: '0' },
      });
      act(() => useStore.getState().saveExpense());
      expect(useStore.getState().expenses).toHaveLength(0);
    });
  });

  describe('deleteExpense', () => {
    it('刪除指定支出', () => {
      useStore.setState({ calculatorValue: '100' });
      act(() => useStore.getState().saveExpense());
      const id = useStore.getState().expenses[0]!.id;
      act(() => useStore.getState().deleteExpense(id));
      expect(useStore.getState().expenses).toHaveLength(0);
    });
  });

  describe('updateExpenseNote', () => {
    it('更新備注並 trim', () => {
      useStore.setState({ calculatorValue: '100' });
      act(() => useStore.getState().saveExpense());
      const id = useStore.getState().expenses[0]!.id;
      act(() => useStore.getState().updateExpenseNote(id, '  晚餐  '));
      expect(useStore.getState().expenses[0]?.note).toBe('晚餐');
    });
  });
});
