import { describe, it, expect, beforeEach } from 'vitest';
import { act } from 'react';
import {
  useStore,
  migratePersistedState,
  mergePersistedState,
  type ExpenseRecord,
} from '../useStore';

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

    it('保存記帳當下的幣別與匯率快照（KRW）', () => {
      useStore.setState({ calculatorValue: '30000', currency: 'KRW', krwPerTwd: 43.5 });
      act(() => useStore.getState().saveExpense());
      const exp = useStore.getState().expenses[0]!;
      expect(exp.currency).toBe('KRW');
      expect(exp.exchangeRateKrwPerTwd).toBe(43.5);
    });

    it('幣別快照不受日後切換幣別影響', () => {
      useStore.setState({ calculatorValue: '1000', currency: 'TWD', krwPerTwd: null });
      act(() => useStore.getState().saveExpense());
      // 記帳後切換全域幣別到 KRW
      act(() => useStore.getState().setCurrency('KRW'));
      const exp = useStore.getState().expenses[0]!;
      expect(exp.currency).toBe('TWD');
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

  // ── 幣別切換 draft 清理（回歸 R1/R3）───────────────────────
  describe('setCurrency draft 清理', () => {
    it('KRW draft 切 TWD 時清空 calculatorValue', () => {
      useStore.setState({ calculatorValue: '10000', currency: 'KRW' });
      act(() => useStore.getState().setCurrency('TWD'));
      const s = useStore.getState();
      expect(s.calculatorValue).toBe('');
      expect(s.currency).toBe('TWD');
    });

    it('itemizedValues 一併清空', () => {
      useStore.setState({ itemizedValues: { me: '9000' }, currency: 'KRW' });
      act(() => useStore.getState().setCurrency('TWD'));
      expect(useStore.getState().itemizedValues).toEqual({});
    });

    it('相同幣別重設不清 draft', () => {
      useStore.setState({ calculatorValue: '10000', currency: 'KRW' });
      act(() => useStore.getState().setCurrency('KRW'));
      expect(useStore.getState().calculatorValue).toBe('10000');
    });

    it('自動偵測（manual=false）同樣清空', () => {
      useStore.setState({ calculatorValue: '30000', currency: 'KRW', currencyManuallySet: false });
      act(() => useStore.getState().setCurrency('TWD', false));
      const s = useStore.getState();
      expect(s.calculatorValue).toBe('');
      expect(s.currencyManuallySet).toBe(false);
    });
  });

  // ── persist migrate v1（legacy 幣別物化）───────────────────
  describe('persist migrate v1', () => {
    const legacyExpense = {
      id: 'e1',
      tripId: 'trip-1',
      type: 'split_evenly',
      participantIds: ['me'],
      paidBy: 'me',
      totalAmount: 300,
      perPersonAmounts: { me: 300 },
      note: '',
      createdAt: 1,
    } as ExpenseRecord;

    it('缺 currency 舊記錄物化為 TWD、匯率快照補 null', () => {
      const migrated = migratePersistedState({ expenses: [legacyExpense] }, 0);
      expect(migrated.expenses[0]?.currency).toBe('TWD');
      expect(migrated.expenses[0]?.exchangeRateKrwPerTwd).toBeNull();
    });

    it('已有 KRW 快照的記錄不變', () => {
      const krwExpense = { ...legacyExpense, currency: 'KRW', exchangeRateKrwPerTwd: 43.5 };
      const migrated = migratePersistedState({ expenses: [krwExpense] }, 0);
      expect(migrated.expenses[0]?.currency).toBe('KRW');
      expect(migrated.expenses[0]?.exchangeRateKrwPerTwd).toBe(43.5);
    });

    it('版本已為 1 時原樣通過', () => {
      const migrated = migratePersistedState({ expenses: [legacyExpense] }, 1);
      expect(migrated.expenses[0]?.currency).toBeUndefined();
    });

    it('不改寫輸入物件（純函式）', () => {
      const persisted = { expenses: [legacyExpense] };
      migratePersistedState(persisted, 0);
      expect(persisted.expenses[0]).toBe(legacyExpense);
      expect(persisted.expenses[0]?.currency).toBeUndefined();
    });
  });

  // ── 無 version 欄位的 v0 blob（zustand 跳過 migrate，靠 merge 物化）───
  describe('無 version blob rehydrate（deep-qa B 場景）', () => {
    const legacyExpense = {
      id: 'legacy-1',
      tripId: 'default-trip',
      type: 'split_evenly',
      participantIds: ['me'],
      paidBy: 'me',
      totalAmount: 900,
      perPersonAmounts: { me: 900 },
      note: 'Legacy Dinner',
      createdAt: 1,
    } as ExpenseRecord;

    it('mergePersistedState 物化缺 currency 記錄且不動已有快照', () => {
      const merged = mergePersistedState(
        { expenses: [legacyExpense, { ...legacyExpense, id: 'krw', currency: 'KRW' }] },
        useStore.getState(),
      );
      expect(merged.expenses[0]?.currency).toBe('TWD');
      expect(merged.expenses[0]?.exchangeRateKrwPerTwd).toBeNull();
      expect(merged.expenses[1]?.currency).toBe('KRW');
    });

    it('注入無 version blob → rehydrate 物化成功，後續寫回蓋章 version 1', async () => {
      localStorage.setItem(
        'split-meow-storage',
        JSON.stringify({ state: { expenses: [legacyExpense] } }),
      );

      await useStore.persist.rehydrate();

      const exp = useStore.getState().expenses[0];
      expect(exp?.currency).toBe('TWD');
      expect(exp?.exchangeRateKrwPerTwd).toBeNull();
      expect(exp?.note).toBe('Legacy Dinner');

      // 任一 set 觸發 persist 寫回：version 蓋章為 1，且寫回內容已物化
      act(() => useStore.getState().setActiveTab('history'));
      const blob = JSON.parse(localStorage.getItem('split-meow-storage') ?? '{}') as {
        version: number;
        state: { expenses: ExpenseRecord[] };
      };
      expect(blob.version).toBe(1);
      expect(blob.state.expenses[0]?.currency).toBe('TWD');

      localStorage.removeItem('split-meow-storage');
    });
  });

  // ── saveExpense 幣別快照（回歸 R2 資料污染）────────────────
  describe('saveExpense 幣別快照（回歸 R2）', () => {
    it('切換幣別後儲存的記錄快照為新幣別且金額為新輸入', () => {
      useStore.setState({ calculatorValue: '10000', currency: 'KRW', krwPerTwd: 45 });
      act(() => useStore.getState().setCurrency('TWD'));
      act(() => useStore.getState().setCalculatorValue('300'));
      act(() => useStore.getState().saveExpense());
      const exp = useStore.getState().expenses[0]!;
      expect(exp.totalAmount).toBe(300);
      expect(exp.currency).toBe('TWD');
    });

    it('切換幣別後直接儲存不得產生記錄（draft 已清空）', () => {
      useStore.setState({ calculatorValue: '10000', currency: 'KRW' });
      act(() => useStore.getState().setCurrency('TWD'));
      act(() => useStore.getState().saveExpense());
      expect(useStore.getState().expenses).toHaveLength(0);
    });
  });
});
