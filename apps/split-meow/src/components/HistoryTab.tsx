import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { MemberAvatar } from './MemberAvatar';

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

function calculateSettlements(balances: Record<string, number>): Settlement[] {
  const creditors = Object.entries(balances)
    .filter(([, b]) => b > 0.01)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = Object.entries(balances)
    .filter(([, b]) => b < -0.01)
    .map(([id, amount]) => ({ id, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    if (!credit || !debt) break;
    const amount = Math.min(credit.amount, debt.amount);

    if (amount > 0.01) {
      settlements.push({ from: debt.id, to: credit.id, amount });
    }

    credit.amount -= amount;
    debt.amount -= amount;

    if (credit.amount < 0.01) ci++;
    if (debt.amount < 0.01) di++;
  }

  return settlements;
}

export function HistoryTab() {
  const { expenses, members, currentTripId, deleteExpense } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tripExpenses = expenses.filter((e) => e.tripId === currentTripId);
  const totalSpent = tripExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

  // Calculate per-person balances
  const balances: Record<string, number> = {};
  tripExpenses.forEach((exp) => {
    balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.totalAmount;
    Object.entries(exp.perPersonAmounts).forEach(([memberId, amount]) => {
      balances[memberId] = (balances[memberId] || 0) - amount;
    });
  });

  const settlements = calculateSettlements({ ...balances });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-on-surface tracking-tight mb-2">行程紀錄</h1>
        <p className="text-on-surface-variant text-sm">記錄你們的貓咪探險</p>
      </div>

      <section className="grid grid-cols-2 gap-4 mb-10">
        <div className="col-span-2 bg-surface-container-lowest p-8 rounded-[2rem] flex flex-col justify-between relative overflow-hidden shadow-ambient">
          <div className="absolute top-[-10px] right-[-10px] opacity-10">
            <span
              className="material-symbols-outlined text-[120px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              pets
            </span>
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-widest text-primary mb-1 block">
              總花費
            </span>
            <h2 className="text-4xl font-medium text-on-surface tracking-tight">
              NT$ {Math.round(totalSpent).toLocaleString('zh-TW')}
            </h2>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <div className="flex -space-x-2">
              {members
                .filter((m) => m.isActive)
                .slice(0, 3)
                .map((m) => (
                  <MemberAvatar
                    key={m.id}
                    seed={m.avatarUrl}
                    alt={m.name}
                    size={32}
                    className="border-2 border-surface-container-lowest"
                  />
                ))}
            </div>
            <span className="text-xs text-on-surface-variant">
              由 {members.filter((m) => m.isActive).length} 位探險家分攤
            </span>
          </div>
        </div>
      </section>

      {/* Settlement Instructions */}
      {settlements.length > 0 && (
        <section className="mb-10">
          <h3 className="text-xs font-medium uppercase tracking-widest text-outline px-2 mb-4">
            結清方式
          </h3>
          <div className="space-y-3">
            {settlements.map((s, i) => {
              const fromMember = members.find((m) => m.id === s.from);
              const toMember = members.find((m) => m.id === s.to);
              if (!fromMember || !toMember) return null;
              return (
                <div
                  key={i}
                  className="bg-surface-container-lowest p-4 rounded-[1.5rem] flex items-center gap-3 shadow-ambient"
                >
                  <MemberAvatar seed={fromMember.avatarUrl} alt={fromMember.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface-variant leading-snug">
                      <span className="font-semibold text-on-surface">{fromMember.name}</span>
                      {' 付給 '}
                      <span className="font-semibold text-on-surface">{toMember.name}</span>
                    </p>
                  </div>
                  <MemberAvatar seed={toMember.avatarUrl} alt={toMember.name} size={36} />
                  <div className="bg-secondary-container text-on-secondary-container rounded-full px-3 py-1 shrink-0">
                    <span className="text-sm font-bold">
                      NT$ {Math.round(s.amount).toLocaleString('zh-TW')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Member Balances */}
      {Object.keys(balances).length > 0 && (
        <section className="mb-10">
          <h3 className="text-xs font-medium uppercase tracking-widest text-outline px-2 mb-4">
            各人結算
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(balances).map(([memberId, amount]) => {
              const member = members.find((m) => m.id === memberId);
              if (!member || Math.abs(amount) < 0.01) return null;
              const isOwed = amount > 0;
              return (
                <div
                  key={memberId}
                  className="bg-surface-container-lowest p-4 rounded-[1.5rem] flex items-center gap-3 shadow-ambient"
                >
                  <MemberAvatar seed={member.avatarUrl} alt={member.name} size={40} />
                  <div>
                    <p className="font-medium text-sm text-on-surface truncate max-w-[80px]">
                      {member.name}
                    </p>
                    <p
                      className={`font-medium text-sm ${isOwed ? 'text-secondary' : 'text-error'}`}
                    >
                      {isOwed ? '應收' : '應付'} <br /> NT${' '}
                      {Math.round(Math.abs(amount)).toLocaleString('zh-TW')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <h3 className="text-xs font-medium uppercase tracking-widest text-outline px-2">
          近期活動
        </h3>

        {tripExpenses.length === 0 ? (
          <div className="text-center p-8 bg-surface-container-low rounded-[2rem] text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
            <p>尚無花費紀錄。開始記帳吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tripExpenses.map((exp) => {
              const isExpanded = expandedId === exp.id;
              return (
                <div
                  key={exp.id}
                  onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                  className="bg-surface-container-lowest p-5 rounded-[2rem] flex flex-col group hover:bg-surface-container-low transition-all relative shadow-ambient cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container shrink-0">
                        <span className="material-symbols-outlined">
                          {exp.note
                            ? 'label'
                            : exp.type === 'split_evenly'
                              ? 'restaurant'
                              : 'receipt'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-on-surface truncate">
                          {exp.note || (exp.type === 'split_evenly' ? '平分' : '個別輸入')}
                        </p>
                        <p className="text-xs text-on-surface-variant truncate">
                          {format(exp.createdAt, 'MMM d, h:mm a')} • 付款人：
                          {members.find((m) => m.id === exp.paidBy)?.name || '某人'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className="shrink-0">
                        <p className="font-bold text-on-surface whitespace-nowrap text-base sm:text-lg">
                          NT$ {Math.round(exp.totalAmount).toLocaleString('zh-TW')}
                        </p>
                        <p className="text-[10px] font-medium text-secondary uppercase tracking-wider">
                          {exp.participantIds.length} 人
                        </p>
                      </div>
                      <span
                        className="material-symbols-outlined text-on-surface-variant transition-transform duration-300 shrink-0"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <div
                    className={cn(
                      'grid transition-all duration-300 ease-in-out',
                      isExpanded
                        ? 'grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-outline-variant/20'
                        : 'grid-rows-[0fr] opacity-0',
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-medium text-on-surface-variant">
                          分攤明細
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteExpense(exp.id);
                          }}
                          className="text-xs text-error flex items-center gap-1 hover:bg-error-container px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                          title="刪除紀錄"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span> 刪除
                        </button>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(exp.perPersonAmounts).map(([mId, amt]) => {
                          const m = members.find((x) => x.id === mId);
                          if (!m || amt === 0) return null;
                          return (
                            <div
                              key={mId}
                              className="flex justify-between items-center text-sm bg-surface-container-low p-2.5 rounded-xl"
                            >
                              <div className="flex items-center gap-3">
                                <MemberAvatar
                                  seed={m.avatarUrl}
                                  alt={m.name}
                                  size={24}
                                  className="shadow-sm"
                                />
                                <span className="font-medium text-on-surface">{m.name}</span>
                              </div>
                              <span className="font-semibold text-on-surface">
                                NT$ {Math.round(amt).toLocaleString('zh-TW')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
