import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useStore, type Member, type ExpenseRecord } from '../store/useStore';
import {
  convertAmount,
  formatAmount,
  resolveExpenseCurrency,
  resolveTripCurrency,
  isMixedCurrencyTrip,
  computeMemberBalances,
} from '../config/currencies';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { isRateStale } from '../lib/exchangeRate';
import { MemberAvatar } from './MemberAvatar';
import { EditExpenseSheet } from './EditExpenseSheet';
import { SettlementSection, BalancesSection } from './SettlementSection';
import { calculateSettlements } from '../lib/settlements';

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
                <span
                  className="material-symbols-outlined text-[8px] text-on-primary leading-none"
                  aria-hidden="true"
                >
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
  const {
    expenses,
    members,
    trips,
    currentTripId,
    currency,
    krwPerTwd,
    rateUpdatedAtIso,
    settledPayments,
  } = useStore(
    useShallow((s) => ({
      expenses: s.expenses,
      members: s.members,
      trips: s.trips,
      currentTripId: s.currentTripId,
      currency: s.currency,
      krwPerTwd: s.krwPerTwd,
      rateUpdatedAtIso: s.rateUpdatedAtIso,
      settledPayments: s.settledPayments,
    })),
  );
  const deleteExpense = useStore((s) => s.deleteExpense);
  const updateExpenseNote = useStore((s) => s.updateExpenseNote);
  const updateExpense = useStore((s) => s.updateExpense);
  const toggleSettlement = useStore((s) => s.toggleSettlement);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
  const undoToastRef = useRef<HTMLDivElement>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

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

  // undo toast 佔位發布為 CSS 變數：其他浮層（UpdatePrompt）據此上移，拇指區不互疊（G3）。
  // ResizeObserver 寫入實高（與 --nav-h 同模式）：ko/ja 長標籤換行時偏移仍正確。
  useEffect(() => {
    if (!pendingDeleteId) return;
    const el = undoToastRef.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty('--undo-toast-h', `${el.offsetHeight + 8}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--undo-toast-h');
    };
  }, [pendingDeleteId]);

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

  const tripCurrency = resolveTripCurrency(tripExpenses, currency);
  const expenseCurrency = (exp: ExpenseRecord) => resolveExpenseCurrency(exp, tripCurrency);
  const isMixedCurrency = isMixedCurrencyTrip(tripExpenses, tripCurrency);
  const totalSpent = isMixedCurrency ? 0 : tripExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const balances = isMixedCurrency ? {} : computeMemberBalances(tripExpenses);
  const settlements = isMixedCurrency ? [] : calculateSettlements(balances);

  const startEditNote = (expId: string, currentNote: string) => {
    setEditingNoteId(expId);
    setEditingNoteValue(currentNote);
    // 等 DOM 更新後 focus
    setTimeout(() => noteInputRef.current?.focus(), 30);
  };

  const commitNote = (expId: string) => {
    updateExpenseNote(expId, editingNoteValue);
    setEditingNoteId(null);
  };

  const CATEGORY_EMOJI: Record<string, string> = {
    food: '🍜',
    transport: '🚗',
    accommodation: '🏨',
    entertainment: '🎪',
    shopping: '🛍️',
    other: '✨',
  };

  const shareSummary = async () => {
    const tripName = trips.find((tr) => tr.id === currentTripId)?.name ?? t('history.title');
    const shareTitle = `${t('app.title')} — ${tripName}`;
    const lines: string[] = [
      `🐾 ${shareTitle}`,
      `${'─'.repeat(24)}`,
      isMixedCurrency
        ? `⚠️ ${t('history.mixed_currency_warning')}`
        : `💰 ${t('history.share_total', { amount: formatAmount(totalSpent, tripCurrency) })}`,
      '',
    ];
    if (tripExpenses.length > 0) {
      lines.push(`📋 ${t('history.share_expense_count', { count: tripExpenses.length })}`);
      tripExpenses.forEach((exp) => {
        const payer = members.find((m) => m.id === exp.paidBy)?.name ?? t('history.unknown_payer');
        const emoji = exp.category ? (CATEGORY_EMOJI[exp.category] ?? '') : '•';
        const label =
          exp.note ||
          (exp.type === 'split_evenly' ? t('history.split_evenly') : t('history.itemized'));
        lines.push(
          `${emoji} ${label}  ${formatAmount(exp.totalAmount, expenseCurrency(exp))}${t('history.share_paid_by', { name: payer })}`,
        );
      });
      lines.push('');
    }
    if (settlements.length > 0 && !isMixedCurrency) {
      lines.push(`💸 ${t('history.settlements')}`);
      settlements.forEach((s) => {
        const from = members.find((m) => m.id === s.from)?.name ?? s.from;
        const to = members.find((m) => m.id === s.to)?.name ?? s.to;
        lines.push(`${from} → ${to}  ${formatAmount(s.amount, tripCurrency)}`);
      });
      lines.push('');
    }
    lines.push('─'.repeat(24));
    lines.push(t('history.share_footer'));
    const text = lines.join('\n');
    if (navigator.share) {
      await navigator.share({ title: shareTitle, text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ paddingBottom: 'calc(var(--chrome-bottom) + 2.5rem)' }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-on-surface tracking-tight mb-2">
          {t('history.title')}
        </h1>
        <p className="text-on-surface-variant text-sm">{t('history.subtitle')}</p>
      </div>

      <section className="grid grid-cols-2 gap-4 mb-10">
        <div className="col-span-2 bg-surface-container-lowest p-8 rounded-[2rem] flex flex-col justify-between relative overflow-hidden shadow-ambient">
          <div className="absolute top-[-10px] right-[-10px] opacity-10" aria-hidden="true">
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
            {isMixedCurrency ? (
              <p className="text-sm font-medium text-error leading-snug">
                {t('history.mixed_currency_warning')}
              </p>
            ) : (
              <h2 className="text-4xl font-medium text-on-surface tracking-tight">
                {formatAmount(totalSpent, tripCurrency)}
              </h2>
            )}
          </div>
          <div className="mt-6 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {(() => {
                // 計算行程中實際有參與消費的成員（而非當前活躍成員）
                const participantIdsSet = new Set(tripExpenses.flatMap((e) => e.participantIds));
                const tripParticipants = members.filter((m) => participantIdsSet.has(m.id));
                return (
                  <>
                    <div className="flex -space-x-2">
                      {tripParticipants.slice(0, 3).map((m) => (
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
                      {t('history.members_count', { count: tripParticipants.length })}
                    </span>
                  </>
                );
              })()}
            </div>
            {tripExpenses.length > 0 && (
              <button
                onClick={() => {
                  void shareSummary();
                }}
                className="flex items-center gap-1 min-h-11 text-xs font-medium text-primary bg-primary-container/40 hover:bg-primary-container px-3 py-1.5 rounded-full transition-colors active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                  share
                </span>
                {t('app.share')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 結清方式 */}
      {settlements.length > 0 && !isMixedCurrency && (
        <SettlementSection
          settlements={settlements}
          members={members}
          currentTripId={currentTripId}
          tripCurrency={tripCurrency}
          settledPayments={settledPayments}
          onToggle={toggleSettlement}
        />
      )}

      {/* 各人結算 */}
      {!isMixedCurrency && Object.keys(balances).length > 0 && (
        <BalancesSection
          balances={balances}
          members={members}
          tripExpenses={tripExpenses}
          tripCurrency={tripCurrency}
        />
      )}

      {/* 近期活動 */}
      <section className="space-y-6">
        <h3 className="text-xs font-medium uppercase tracking-widest text-outline px-2">
          {t('history.recent')}
        </h3>

        {tripExpenses.length === 0 ? (
          <div className="text-center p-8 bg-surface-container-low rounded-[2rem] text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50" aria-hidden="true">
              receipt_long
            </span>
            <p>{t('history.no_expenses')}</p>
            <button
              onClick={() => useStore.getState().setActiveTab('home')}
              className="mt-4 min-h-11 px-6 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold active:scale-95 transition-transform cursor-pointer"
            >
              {t('history.cta_first')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tripExpenses.map((exp) => {
              const isExpanded = expandedId === exp.id;
              const isEditingNote = editingNoteId === exp.id;
              const isThisSwiped = swipedId === exp.id;
              const isThisActive = draggingId === exp.id;
              const offset = isThisActive ? liveDragOffset : isThisSwiped ? SWIPE_REVEAL : 0;
              const toggleExpand = () => {
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
              };

              return (
                <div
                  key={exp.id}
                  data-testid="expense-card"
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
                  {/* 未滑出時 inert：隱藏破壞性控制項不得鍵盤可達（與收合明細同模式）；鍵盤刪除路徑＝展開卡內刪除鈕。 */}
                  <div
                    inert={!isThisSwiped || undefined}
                    className="absolute inset-y-0 right-0 w-[76px] bg-error flex items-center justify-center"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        softDelete(exp.id);
                        setSwipedId(null);
                      }}
                      aria-label={t('history.delete_title')}
                      className="w-11 h-11 flex items-center justify-center text-on-error active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-2xl" aria-hidden="true">
                        delete
                      </span>
                    </button>
                  </div>
                  <div
                    style={{
                      transform: `translateX(-${offset}px)`,
                      transition: isThisActive
                        ? 'none'
                        : 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      willChange: isThisActive ? 'transform' : 'auto',
                    }}
                    className="bg-surface-container-lowest p-5 rounded-[2rem] flex flex-col group hover:bg-surface-container-low transition-colors relative"
                  >
                    {/* 觸發器＝標題列原生 button（鍵盤啟動由瀏覽器保證）；展開內容移出觸發器，消除巢狀 button。 */}
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={toggleExpand}
                      className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
                    >
                      {/* 左側：頭像堆疊 */}
                      <ParticipantAvatars
                        participantIds={exp.participantIds}
                        members={members}
                        paidBy={exp.paidBy}
                      />

                      {/* 中間：名稱 + 時間/付款人 */}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-on-surface truncate flex items-center gap-1">
                          {exp.category && (
                            <span className="text-sm shrink-0">
                              {
                                (
                                  {
                                    food: '🍜',
                                    transport: '🚗',
                                    accommodation: '🏨',
                                    entertainment: '🎪',
                                    shopping: '🛍️',
                                    other: '✨',
                                  } as Record<string, string>
                                )[exp.category]
                              }
                            </span>
                          )}
                          {exp.note ||
                            (exp.type === 'split_evenly'
                              ? t('history.split_evenly')
                              : t('history.itemized'))}
                        </p>
                        <p className="text-xs text-on-surface-variant truncate">
                          {format(exp.createdAt, 'MMM d, h:mm a')} •{' '}
                          {t('history.payer', {
                            name:
                              members.find((m) => m.id === exp.paidBy)?.name ??
                              t('history.unknown_payer'),
                          })}
                        </p>
                      </div>

                      {/* 右側：金額 + 人數 + 展開箭頭 */}
                      <div className="text-right flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="shrink-0">
                          <p className="font-bold text-on-surface whitespace-nowrap text-base sm:text-lg">
                            {formatAmount(exp.totalAmount, expenseCurrency(exp))}
                          </p>
                          {(() => {
                            // 快照幣別 ≠ 全域幣別時顯示 ≈ 參考：KRW 用記帳當下快照匯率，TWD 用當前匯率（即期參考）。
                            // 匯率快照過期時附 stale 短標，維持參考值狀態誠實（R10）。
                            const from = expenseCurrency(exp);
                            if (from === currency) return null;
                            const to = from === 'KRW' ? ('TWD' as const) : ('KRW' as const);
                            const rate = from === 'KRW' ? exp.exchangeRateKrwPerTwd : krwPerTwd;
                            const approx = convertAmount(exp.totalAmount, from, to, rate);
                            if (approx === null) return null;
                            return (
                              <>
                                <p className="text-[10px] font-medium text-on-surface-variant/70 whitespace-nowrap">
                                  ≈ {formatAmount(approx, to)}
                                </p>
                                {isRateStale(rateUpdatedAtIso) && (
                                  <p className="text-[10px] font-medium text-tertiary whitespace-nowrap">
                                    {t('settings.rate_stale')}
                                  </p>
                                )}
                              </>
                            );
                          })()}
                          <p className="text-[10px] font-medium text-secondary uppercase tracking-wider">
                            {t('history.participants', { count: exp.participantIds.length })}
                          </p>
                        </div>
                        <span
                          className="material-symbols-outlined text-on-surface-variant transition-transform duration-300 shrink-0"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                          aria-hidden="true"
                        >
                          expand_more
                        </span>
                      </div>
                    </button>

                    {/* 展開詳情；收合時 inert 移出焦點與無障礙樹，消除幻影可聚焦項 */}
                    <div
                      inert={!isExpanded || undefined}
                      className={cn(
                        'grid transition-all duration-200 ease-in-out',
                        isExpanded
                          ? 'grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-outline-variant/20'
                          : 'grid-rows-[0fr] opacity-0',
                      )}
                    >
                      <div className="overflow-hidden">
                        {/* 備注編輯 */}
                        <div className="mb-3">
                          {isEditingNote ? (
                            <div className="flex items-center gap-2 bg-surface-container rounded-full px-3 py-1.5">
                              <span
                                className="material-symbols-outlined text-[15px] text-on-surface-variant shrink-0"
                                aria-hidden="true"
                              >
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
                                aria-label={t('common.confirm')}
                                className="shrink-0 w-11 h-11 -my-2 -mr-2.5 flex items-center justify-center text-primary cursor-pointer"
                              >
                                <span
                                  className="material-symbols-outlined text-[16px]"
                                  aria-hidden="true"
                                >
                                  check
                                </span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditNote(exp.id, exp.note)}
                              className="flex items-center gap-1.5 min-h-11 text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer group/note"
                            >
                              <span
                                className="material-symbols-outlined text-[13px] group-hover/note:text-primary transition-colors"
                                aria-hidden="true"
                              >
                                {exp.note ? 'edit' : 'add'}
                              </span>
                              <span className={cn(exp.note ? 'text-on-surface' : 'opacity-60')}>
                                {exp.note || t('history.add_note')}
                              </span>
                            </button>
                          )}
                        </div>

                        {/* 標題列：分攤明細 + 編輯 + 刪除 */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-medium text-on-surface-variant">
                            {t('history.breakdown')}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingExpenseId(exp.id)}
                              className="text-xs text-primary flex items-center gap-1 min-h-11 hover:bg-primary-container/50 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                            >
                              <span
                                className="material-symbols-outlined text-[14px]"
                                aria-hidden="true"
                              >
                                edit
                              </span>{' '}
                              {t('history.edit')}
                            </button>
                            <button
                              onClick={() => softDelete(exp.id)}
                              className="text-xs text-error flex items-center gap-1 min-h-11 hover:bg-error-container px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                              title={t('history.delete_title')}
                            >
                              <span
                                className="material-symbols-outlined text-[14px]"
                                aria-hidden="true"
                              >
                                delete
                              </span>{' '}
                              {t('history.delete')}
                            </button>
                          </div>
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
                                  {formatAmount(amt, expenseCurrency(exp))}
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

      {editingExpenseId &&
        (() => {
          const exp = expenses.find((e) => e.id === editingExpenseId);
          if (!exp) return null;
          return (
            <EditExpenseSheet
              expense={exp}
              members={members}
              onSave={(patch) => {
                updateExpense(editingExpenseId, patch);
                setEditingExpenseId(null);
              }}
              onClose={() => setEditingExpenseId(null)}
            />
          );
        })()}

      {pendingDeleteId && (
        <div
          ref={undoToastRef}
          data-testid="undo-toast"
          className="fixed left-4 right-4 z-50 flex items-center justify-between bg-on-surface text-surface rounded-2xl px-4 py-3 shadow-xl animate-in slide-in-from-bottom-4 duration-300"
          style={{ bottom: 'var(--overlay-bottom)' }}
        >
          <span className="text-sm">
            {(() => {
              const exp = expenses.find((e) => e.id === pendingDeleteId);
              const fallback =
                exp?.type === 'split_evenly' ? t('history.split_evenly') : t('history.itemized');
              const label = exp && exp.note.length > 0 ? exp.note : fallback;
              return t('history.deleted_toast', { label });
            })()}
          </span>
          <button
            onClick={undoDelete}
            className="text-sm font-semibold text-primary ml-4 min-h-11 px-3 py-1 rounded-lg active:opacity-70 transition-opacity"
          >
            {t('history.undo')}
          </button>
        </div>
      )}
    </div>
  );
}
