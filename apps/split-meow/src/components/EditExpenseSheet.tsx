import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useStore, type Member, type ExpenseRecord } from '../store/useStore';
import {
  getCurrencySymbol,
  resolveExpenseCurrency,
  resolveTripCurrency,
} from '../config/currencies';
import { cn } from '../lib/utils';
import { MemberAvatar } from './MemberAvatar';

interface EditExpenseSheetProps {
  expense: ExpenseRecord;
  members: Member[];
  onSave: (
    patch: Partial<
      Pick<ExpenseRecord, 'totalAmount' | 'perPersonAmounts' | 'participantIds' | 'paidBy'>
    >,
  ) => void;
  onClose: () => void;
}

export function EditExpenseSheet({ expense, members, onSave, onClose }: EditExpenseSheetProps) {
  const { t } = useTranslation();
  const globalCurrency = useStore((s) => s.currency);
  // selector 不可回傳新陣列（getSnapshot 不穩定會觸發無限迴圈）；filter 於 render 內派生。
  const allExpenses = useStore((s) => s.expenses);
  const currentTripId = useStore((s) => s.currentTripId);
  const tripExpenses = allExpenses.filter((e) => e.tripId === currentTripId);
  const tripCurrency = resolveTripCurrency(tripExpenses, globalCurrency);
  const expenseCurrency = resolveExpenseCurrency(expense, tripCurrency);
  const isEvenly = expense.type === 'split_evenly';

  const [totalInput, setTotalInput] = useState(
    isEvenly ? String(Math.round(expense.totalAmount)) : '',
  );

  const [perPersonInputs, setPerPersonInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    Object.entries(expense.perPersonAmounts).forEach(([id, amt]) => {
      init[id] = String(Math.round(amt));
    });
    return init;
  });

  const [editPayerId, setEditPayerId] = useState(expense.paidBy);

  const handleSave = () => {
    if (isEvenly) {
      const total = parseFloat(totalInput);
      if (!Number.isFinite(total) || total <= 0) return;
      const participantIds = expense.participantIds;
      const split = total / participantIds.length;
      const perPersonAmounts: Record<string, number> = {};
      participantIds.forEach((id) => {
        perPersonAmounts[id] = split;
      });
      onSave({ totalAmount: total, perPersonAmounts, paidBy: editPayerId });
    } else {
      const perPersonAmounts: Record<string, number> = {};
      let total = 0;
      Object.entries(perPersonInputs).forEach(([id, val]) => {
        const n = parseFloat(val);
        if (Number.isFinite(n) && n > 0) {
          perPersonAmounts[id] = n;
          total += n;
        }
      });
      if (total <= 0) return;
      const participantIds = Object.keys(perPersonAmounts);
      onSave({ totalAmount: total, perPersonAmounts, participantIds, paidBy: editPayerId });
    }
  };

  return (
    // modal 層級必須高於 BottomNav（z-50），否則同 z 下 DOM 較晚的 nav 會攔截 CTA 點擊（G3）。
    <div
      className="fixed inset-0 z-[60] flex items-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full bg-surface-container-low rounded-t-[2rem] p-6 animate-in slide-in-from-bottom-4 duration-300 space-y-4"
        style={{ paddingBottom: 'calc(var(--chrome-bottom) + 1rem)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-on-surface">{t('history.edit_title')}</h2>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-11 h-11 -mr-2 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        {isEvenly ? (
          <div className="flex items-center gap-3 bg-surface-container rounded-2xl px-4 py-3">
            <span className="text-on-surface-variant text-sm font-medium shrink-0">
              {getCurrencySymbol(expenseCurrency)}
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={totalInput}
              onChange={(e) => setTotalInput(e.target.value)}
              className="flex-1 bg-transparent text-lg font-semibold text-on-surface outline-none"
              autoFocus
            />
          </div>
        ) : (
          <div className="space-y-2">
            {expense.participantIds.map((id) => {
              const m = members.find((x) => x.id === id);
              if (!m) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 bg-surface-container rounded-2xl px-4 py-2.5"
                >
                  <MemberAvatar seed={m.avatarUrl} alt={m.name} size={28} />
                  <span className="flex-1 text-sm font-medium text-on-surface truncate">
                    {m.name}
                  </span>
                  <span className="text-on-surface-variant text-sm shrink-0">
                    {getCurrencySymbol(expenseCurrency)}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={perPersonInputs[id] ?? ''}
                    onChange={(e) =>
                      setPerPersonInputs((prev) => ({ ...prev, [id]: e.target.value }))
                    }
                    className="w-20 bg-transparent text-sm font-semibold text-on-surface outline-none text-right"
                  />
                </div>
              );
            })}
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-on-surface-variant mb-2">
            {t('history.edit_payer')}
          </p>
          <div className="flex flex-wrap gap-2">
            {members
              .filter((m) => expense.participantIds.includes(m.id))
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => setEditPayerId(m.id)}
                  aria-pressed={editPayerId === m.id}
                  className={cn(
                    'flex items-center gap-1.5 min-h-11 px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer',
                    editPayerId === m.id
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
                  )}
                >
                  <MemberAvatar seed={m.avatarUrl} alt={m.name} size={20} />
                  {m.name}
                </button>
              ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-surface-container text-on-surface-variant text-sm font-medium transition-colors hover:bg-surface-container-high cursor-pointer"
          >
            {t('history.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-primary text-on-primary text-sm font-semibold transition-colors active:scale-95 cursor-pointer"
          >
            {t('history.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
