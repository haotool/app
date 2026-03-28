import { useTranslation } from 'react-i18next';
import { useStore, type Member } from '../store/useStore';
import { format } from 'date-fns';
import { useRef, useState } from 'react';
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

/** 最多顯示 MAX_AVATAR 個頭像，其餘以 +N 呈現 */
const MAX_AVATAR = 3;

function ParticipantAvatars({
  participantIds,
  members,
  paidBy,
}: {
  participantIds: string[];
  members: Member[];
  paidBy: string;
}) {
  // 付款人排最前
  const sorted = [
    ...participantIds.filter((id) => id === paidBy),
    ...participantIds.filter((id) => id !== paidBy),
  ];
  const visibleSorted = sorted.slice(0, MAX_AVATAR);
  const overflowCount = sorted.length - MAX_AVATAR;

  return (
    <div className="flex -space-x-2 shrink-0">
      {visibleSorted.map((pid) => {
        const m = members.find((x: Member) => x.id === pid);
        if (!m) return null;
        const isPayer = pid === paidBy;
        return (
          <div key={pid} className="relative">
            <MemberAvatar
              seed={m.avatarUrl}
              alt={m.name}
              size={36}
              className={cn(
                'border-2',
                isPayer
                  ? 'border-primary ring-1 ring-primary/30'
                  : 'border-surface-container-lowest',
              )}
            />
            {isPayer && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center"
                title="payer"
              >
                <span className="material-symbols-outlined text-[8px] text-on-primary leading-none">
                  payments
                </span>
              </span>
            )}
          </div>
        );
      })}
      {overflowCount > 0 && (
        <div className="w-9 h-9 rounded-full bg-surface-container border-2 border-surface-container-lowest flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-on-surface-variant leading-none">
            +{overflowCount}
          </span>
        </div>
      )}
    </div>
  );
}

export function HistoryTab() {
  const { t } = useTranslation();
  const { expenses, members, currentTripId, deleteExpense, updateExpenseNote } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');
  const noteInputRef = useRef<HTMLInputElement>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [liveDragOffset, setLiveDragOffset] = useState(0);
  const swipeTouchStartX = useRef(0);
  const swipeActiveId = useRef<string | null>(null);
  const didSwipeRef = useRef(false);
  const SWIPE_REVEAL = 76;
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const softDelete = (id: string) => {
    if (pendingDeleteId && pendingDeleteTimerRef.current) {
      clearTimeout(pendingDeleteTimerRef.current);
      deleteExpense(pendingDeleteId);
    }
    setPendingDeleteId(id);
    pendingDeleteTimerRef.current = setTimeout(() => {
      deleteExpense(id);
      setPendingDeleteId(null);
      pendingDeleteTimerRef.current = null;
    }, 5000);
  };

  const undoDelete = () => {
    if (pendingDeleteTimerRef.current) {
      clearTimeout(pendingDeleteTimerRef.current);
      pendingDeleteTimerRef.current = null;
    }
    setPendingDeleteId(null);
    setSwipedId(null);
  };

  // 向後相容：舊資料可能含 0 元成員，讀取時過濾
  const tripExpenses = expenses
    .filter((e) => e.tripId === currentTripId && e.id !== pendingDeleteId)
    .map((e) => {
      const perPersonAmounts = Object.fromEntries(
        Object.entries(e.perPersonAmounts).filter(([, v]) => v > 0),
      );
      return {
        ...e,
        perPersonAmounts,
        participantIds: e.participantIds.filter((id) => id in perPersonAmounts),
      };
    });
  const totalSpent = tripExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

  // 計算各人餘額
  const balances: Record<string, number> = {};
  tripExpenses.forEach((exp) => {
    balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.totalAmount;
    Object.entries(exp.perPersonAmounts).forEach(([memberId, amount]) => {
      balances[memberId] = (balances[memberId] || 0) - amount;
    });
  });

  const settlements = calculateSettlements({ ...balances });

  const startEditNote = (expId: string, currentNote: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoteId(expId);
    setEditingNoteValue(currentNote);
    // 等 DOM 更新後 focus
    setTimeout(() => noteInputRef.current?.focus(), 30);
  };

  const commitNote = (expId: string) => {
    updateExpenseNote(expId, editingNoteValue);
    setEditingNoteId(null);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28">
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-on-surface tracking-tight mb-2">
          {t('history.title')}
        </h1>
        <p className="text-on-surface-variant text-sm">{t('history.subtitle')}</p>
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
              {t('history.total_spent')}
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
              {t('history.members_count', { count: members.filter((m) => m.isActive).length })}
            </span>
          </div>
        </div>
      </section>

      {/* 結清方式 */}
      {settlements.length > 0 && (
        <section className="mb-10">
          <h3 className="text-xs font-medium uppercase tracking-widest text-outline px-2 mb-4">
            {t('history.settlements')}
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
                      {t('history.pay_to', {
                        from: fromMember.name,
                        to: toMember.name,
                      })}
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

      {/* 各人結算 */}
      {Object.keys(balances).length > 0 && (
        <section className="mb-10">
          <h3 className="text-xs font-medium uppercase tracking-widest text-outline px-2 mb-4">
            {t('history.balances')}
          </h3>
          <div className="space-y-3">
            {Object.entries(balances).map(([memberId, amount]) => {
              const member = members.find((m) => m.id === memberId);
              if (!member) return null;
              const isOwed = amount > 0;
              const isSettled = Math.abs(amount) < 0.01;
              const isOpen = expandedMemberId === memberId;

              // 與此成員相關的消費（有參與的）
              const memberExpenses = tripExpenses.filter(
                (e) => e.paidBy === memberId || memberId in e.perPersonAmounts,
              );

              return (
                <div
                  key={memberId}
                  className={cn(
                    'bg-surface-container-lowest rounded-[1.5rem] shadow-ambient overflow-hidden transition-all duration-300',
                    !isSettled && 'cursor-pointer',
                  )}
                  onClick={() => {
                    if (isSettled) return;
                    setExpandedMemberId(isOpen ? null : memberId);
                  }}
                >
                  {/* 摘要列 */}
                  <div className="p-4 flex items-center gap-3">
                    <MemberAvatar seed={member.avatarUrl} alt={member.name} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-on-surface truncate">{member.name}</p>
                      {isSettled ? (
                        <p className="text-xs text-on-surface-variant/60">
                          {t('history.balance_settled')}
                        </p>
                      ) : (
                        <p
                          className={cn(
                            'text-xs font-medium',
                            isOwed ? 'text-secondary' : 'text-error',
                          )}
                        >
                          {isOwed ? t('history.owed') : t('history.owing')}
                          {' · '}
                          {t('history.tap_to_detail')}
                        </p>
                      )}
                    </div>
                    {!isSettled && (
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            'text-sm font-bold px-3 py-1 rounded-full',
                            isOwed
                              ? 'bg-secondary-container text-on-secondary-container'
                              : 'bg-error-container text-on-error-container',
                          )}
                        >
                          {isOwed ? '+' : '-'}NT$ {Math.round(Math.abs(amount)).toLocaleString()}
                        </span>
                        <span
                          className="material-symbols-outlined text-on-surface-variant text-lg transition-transform duration-300"
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          expand_more
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 展開明細 */}
                  <div
                    className={cn(
                      'grid transition-all duration-300 ease-in-out',
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}
                  >
                    <div className="overflow-hidden">
                      <div
                        className="px-4 pb-4 space-y-2 border-t border-outline-variant/15 pt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {memberExpenses.map((exp, idx) => {
                          const isPayer = exp.paidBy === memberId;
                          const share = exp.perPersonAmounts[memberId] ?? 0;
                          const net = (isPayer ? exp.totalAmount : 0) - share;
                          const expLabel =
                            exp.note ||
                            (exp.type === 'split_evenly'
                              ? t('history.split_evenly')
                              : t('history.itemized'));

                          return (
                            <div
                              key={exp.id}
                              className={cn(
                                'rounded-2xl bg-surface-container-low p-3 space-y-2',
                                idx > 0 && '',
                              )}
                            >
                              {/* 消費標題 */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-on-surface truncate max-w-[140px]">
                                  {expLabel}
                                </span>
                                <span className="text-[10px] text-on-surface-variant/60 shrink-0">
                                  {format(exp.createdAt, 'M/d HH:mm')}
                                </span>
                              </div>

                              {/* 墊付行（只有付款人才有） */}
                              {isPayer && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1.5 text-secondary">
                                    <span className="material-symbols-outlined text-[13px]">
                                      payments
                                    </span>
                                    {t('history.balance_paid')}
                                  </span>
                                  <span className="font-semibold text-secondary">
                                    +NT$ {Math.round(exp.totalAmount).toLocaleString()}
                                  </span>
                                </div>
                              )}

                              {/* 分攤行 */}
                              {share > 0.01 && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1.5 text-on-surface-variant">
                                    <span className="material-symbols-outlined text-[13px]">
                                      group
                                    </span>
                                    {t('history.balance_share')}
                                  </span>
                                  <span className="font-semibold text-error">
                                    -NT$ {Math.round(share).toLocaleString()}
                                  </span>
                                </div>
                              )}

                              {/* 小計 */}
                              <div className="flex items-center justify-between text-xs border-t border-outline-variant/20 pt-1.5">
                                <span className="text-on-surface-variant/70">
                                  {t('history.balance_net')}
                                </span>
                                <span
                                  className={cn(
                                    'font-bold',
                                    net > 0.01
                                      ? 'text-secondary'
                                      : net < -0.01
                                        ? 'text-error'
                                        : 'text-on-surface-variant',
                                  )}
                                >
                                  {net > 0.01 ? '+' : ''}NT$ {Math.round(net).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* 合計 */}
                        <div className="flex items-center justify-between pt-1 px-1">
                          <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                            {t('history.balance_total')}
                          </span>
                          <span
                            className={cn(
                              'text-base font-bold',
                              isOwed ? 'text-secondary' : 'text-error',
                            )}
                          >
                            {isOwed ? '+' : ''}NT$ {Math.round(amount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 近期活動 */}
      <section className="space-y-6">
        <h3 className="text-xs font-medium uppercase tracking-widest text-outline px-2">
          {t('history.recent')}
        </h3>

        {tripExpenses.length === 0 ? (
          <div className="text-center p-8 bg-surface-container-low rounded-[2rem] text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
            <p>{t('history.no_expenses')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tripExpenses.map((exp) => {
              const isExpanded = expandedId === exp.id;
              const isEditingNote = editingNoteId === exp.id;
              const isThisSwiped = swipedId === exp.id;
              const isThisActive = draggingId === exp.id;
              const offset = isThisActive ? liveDragOffset : isThisSwiped ? SWIPE_REVEAL : 0;

              return (
                <div
                  key={exp.id}
                  className="relative overflow-hidden rounded-[2rem] shadow-ambient"
                  onTouchStart={(e) => {
                    if (swipedId && swipedId !== exp.id) setSwipedId(null);
                    swipeActiveId.current = exp.id;
                    swipeTouchStartX.current = e.touches[0]?.clientX ?? 0;
                    didSwipeRef.current = false;
                    setDraggingId(exp.id);
                    setLiveDragOffset(isThisSwiped ? SWIPE_REVEAL : 0);
                  }}
                  onTouchMove={(e) => {
                    if (swipeActiveId.current !== exp.id) return;
                    const base = isThisSwiped ? SWIPE_REVEAL : 0;
                    const delta = swipeTouchStartX.current - (e.touches[0]?.clientX ?? 0);
                    if (Math.abs(delta) > 8) didSwipeRef.current = true;
                    setLiveDragOffset(Math.max(0, Math.min(SWIPE_REVEAL, base + delta)));
                  }}
                  onTouchEnd={() => {
                    if (swipeActiveId.current !== exp.id) return;
                    swipeActiveId.current = null;
                    setDraggingId(null);
                    if (liveDragOffset >= SWIPE_REVEAL / 2) setSwipedId(exp.id);
                    else setSwipedId(null);
                  }}
                >
                  <div className="absolute inset-y-0 right-0 w-[76px] bg-error flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        softDelete(exp.id);
                        setSwipedId(null);
                      }}
                      className="flex items-center justify-center text-on-error active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-2xl">delete</span>
                    </button>
                  </div>
                  <div
                    onClick={() => {
                      if (isEditingNote) return;
                      if (didSwipeRef.current) {
                        didSwipeRef.current = false;
                        return;
                      }
                      if (isThisSwiped) {
                        setSwipedId(null);
                        return;
                      }
                      setExpandedId(isExpanded ? null : exp.id);
                    }}
                    style={{
                      transform: `translateX(-${offset}px)`,
                      transition: isThisActive
                        ? 'none'
                        : 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      willChange: isThisActive ? 'transform' : 'auto',
                    }}
                    className="bg-surface-container-lowest p-5 rounded-[2rem] flex flex-col group hover:bg-surface-container-low transition-colors relative cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* 左側：頭像堆疊 */}
                      <ParticipantAvatars
                        participantIds={exp.participantIds}
                        members={members}
                        paidBy={exp.paidBy}
                      />

                      {/* 中間：名稱 + 時間/付款人 */}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-on-surface truncate">
                          {exp.note ||
                            (exp.type === 'split_evenly'
                              ? t('history.split_evenly')
                              : t('history.itemized'))}
                        </p>
                        <p className="text-xs text-on-surface-variant truncate">
                          {format(exp.createdAt, 'MMM d, h:mm a')} •{' '}
                          {t('history.payer', {
                            name:
                              members.find((m) => m.id === exp.paidBy)?.name ||
                              t('history.unknown_payer'),
                          })}
                        </p>
                      </div>

                      {/* 右側：金額 + 人數 + 展開箭頭 */}
                      <div className="text-right flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="shrink-0">
                          <p className="font-bold text-on-surface whitespace-nowrap text-base sm:text-lg">
                            NT$ {Math.round(exp.totalAmount).toLocaleString('zh-TW')}
                          </p>
                          <p className="text-[10px] font-medium text-secondary uppercase tracking-wider">
                            {t('history.participants', { count: exp.participantIds.length })}
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

                    {/* 展開詳情 */}
                    <div
                      className={cn(
                        'grid transition-all duration-300 ease-in-out',
                        isExpanded
                          ? 'grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-outline-variant/20'
                          : 'grid-rows-[0fr] opacity-0',
                      )}
                    >
                      <div className="overflow-hidden">
                        {/* 備注編輯 */}
                        <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                          {isEditingNote ? (
                            <div className="flex items-center gap-2 bg-surface-container rounded-full px-3 py-1.5">
                              <span className="material-symbols-outlined text-[15px] text-on-surface-variant shrink-0">
                                label
                              </span>
                              <input
                                ref={noteInputRef}
                                type="text"
                                value={editingNoteValue}
                                onChange={(e) => setEditingNoteValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitNote(exp.id);
                                  if (e.key === 'Escape') setEditingNoteId(null);
                                }}
                                onBlur={() => commitNote(exp.id)}
                                maxLength={20}
                                enterKeyHint="done"
                                placeholder={t('history.note_placeholder')}
                                className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none"
                              />
                              <button
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  commitNote(exp.id);
                                }}
                                className="shrink-0 text-primary cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">check</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => startEditNote(exp.id, exp.note, e)}
                              className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer group/note"
                            >
                              <span className="material-symbols-outlined text-[13px] group-hover/note:text-primary transition-colors">
                                {exp.note ? 'edit' : 'add'}
                              </span>
                              <span className={cn(exp.note ? 'text-on-surface' : 'opacity-60')}>
                                {exp.note || t('history.add_note')}
                              </span>
                            </button>
                          )}
                        </div>

                        {/* 標題列：分攤明細 + 刪除 */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-medium text-on-surface-variant">
                            {t('history.breakdown')}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              softDelete(exp.id);
                            }}
                            className="text-xs text-error flex items-center gap-1 hover:bg-error-container px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                            title={t('history.delete_title')}
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>{' '}
                            {t('history.delete')}
                          </button>
                        </div>

                        {/* 分攤明細 */}
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
                </div>
              );
            })}
          </div>
        )}
      </section>

      {pendingDeleteId && (
        <div className="fixed bottom-24 left-4 right-4 z-50 flex items-center justify-between bg-on-surface text-surface rounded-2xl px-4 py-3 shadow-xl animate-in slide-in-from-bottom-4 duration-300">
          <span className="text-sm">
            {(() => {
              const exp = expenses.find((e) => e.id === pendingDeleteId);
              const label =
                exp?.note ??
                (exp?.type === 'split_evenly' ? t('history.split_evenly') : t('history.itemized'));
              return `已刪除「${label}」`;
            })()}
          </span>
          <button
            onClick={undoDelete}
            className="text-sm font-semibold text-primary ml-4 px-2 py-1 rounded-lg active:opacity-70 transition-opacity"
          >
            復原
          </button>
        </div>
      )}
    </div>
  );
}
