import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { evaluateExpression } from '../lib/evaluateExpression';
import { Calculator } from './Calculator';
import { MemberList } from './MemberList';
import { BottomSheet } from './BottomSheet';
import { MemberAvatar } from './MemberAvatar';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';

/** 根據視窗高度動態計算 BottomSheet 高度，避免在小螢幕上蓋住成員清單 */
function useResponsiveSheetHeight() {
  const [vh, setVh] = useState(() => window.innerHeight);
  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  // 保留 240px 給 header(64) + 金額卡(100) + 成員列(52) + 間距(24)
  const peekHeight = Math.min(440, Math.max(300, vh - 72 - 240));
  const expandedHeight = Math.min(520, vh - 72 - 80);
  return { peekHeight, expandedHeight };
}

export function HomeTab() {
  const { t } = useTranslation();
  const {
    splitMode,
    setSplitMode,
    calculatorValue,
    members,
    itemizedValues,
    focusedMemberId,
    setFocusedMemberId,
    expenseNote,
    setExpenseNote,
  } = useStore();

  const activeMembers = members.filter((m) => m.isActive);
  const { peekHeight, expandedHeight } = useResponsiveSheetHeight();

  // Set default focused member for itemized mode if none is focused
  useEffect(() => {
    if (splitMode === 'itemized' && !focusedMemberId && activeMembers.length > 0) {
      const first = activeMembers[0];
      if (first) setFocusedMemberId(first.id);
    }
  }, [splitMode, focusedMemberId, activeMembers, setFocusedMemberId]);

  const totalAmount =
    splitMode === 'split_evenly'
      ? evaluateExpression(calculatorValue)
      : activeMembers.reduce((sum, m) => sum + evaluateExpression(itemizedValues[m.id] ?? '0'), 0);

  const splitAmount = activeMembers.length > 0 ? totalAmount / activeMembers.length : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[520px]">
      {/* Amount Display Card */}
      <div className="relative overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-ambient px-6 py-5 mb-4 text-center">
        <div
          className="absolute -right-4 -top-4 opacity-5 pointer-events-none select-none"
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-9xl">pets</span>
        </div>
        <span className="block text-on-surface-variant text-xs font-medium uppercase tracking-widest mb-2">
          {splitMode === 'split_evenly' ? t('home.totalAmount') : t('home.totalItemized')}
        </span>
        <h1 className="text-4xl sm:text-5xl font-headline font-semibold tracking-tight text-on-surface leading-none break-all">
          NT$ {Math.round(totalAmount).toLocaleString()}
        </h1>
        {splitMode === 'split_evenly' && activeMembers.length > 0 && totalAmount > 0 && (
          <p className="text-sm text-on-surface-variant mt-2">
            {t('home.perPerson')}{' '}
            <span className="font-semibold text-secondary">
              NT$ {Math.round(splitAmount).toLocaleString()}
            </span>{' '}
            × {activeMembers.length} {t('home.people')}
          </p>
        )}
        {splitMode === 'split_evenly' && calculatorValue && (
          <p className="text-xs text-on-surface-variant mt-1 font-mono opacity-70">
            {calculatorValue}
          </p>
        )}
      </div>

      <MemberList />

      {/* Itemized Inputs */}
      {splitMode === 'itemized' && (
        <div className="grid grid-cols-2 gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeMembers.map((m) => (
            <div
              key={m.id}
              onClick={() => setFocusedMemberId(m.id)}
              className={cn(
                'flex flex-col gap-2 p-3 rounded-[2rem] transition-all cursor-pointer',
                focusedMemberId === m.id
                  ? 'bg-primary-container text-on-primary-container shadow-ambient'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container',
              )}
            >
              <div className="flex items-center gap-3">
                <MemberAvatar seed={m.avatarUrl} alt={m.name} size={40} />
                <span className="font-medium truncate">{m.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-medium">
                  NT$ {Math.round(evaluateExpression(itemizedValues[m.id] ?? '0')).toLocaleString()}
                </span>
                {itemizedValues[m.id] && focusedMemberId === m.id && (
                  <p className="text-xs opacity-70 font-mono mt-1">{itemizedValues[m.id]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Sheet: 計算機 + 模式切換；bottom-[72px] 確保浮動 BottomNav（~68px）不遮蓋 */}
      <BottomSheet
        isOpen={true}
        onClose={() => undefined}
        peekHeight={peekHeight}
        expandedHeight={expandedHeight}
        className="bottom-[72px]"
      >
        {/* Note Input */}
        <div className="mx-4 mt-1 mb-2">
          <div className="flex items-center gap-2 bg-surface-container rounded-full px-4 py-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">
              label
            </span>
            <input
              type="text"
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              placeholder={t('home.note_placeholder')}
              maxLength={20}
              enterKeyHint="done"
              className="flex-1 bg-transparent text-base text-on-surface placeholder:text-on-surface-variant/50 outline-none"
            />
            {expenseNote && (
              <button
                onClick={() => setExpenseNote('')}
                className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex p-0.5 mx-4 bg-surface-container rounded-full mb-2">
          <button
            onClick={() => setSplitMode('split_evenly')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer',
              splitMode === 'split_evenly'
                ? 'bg-surface-container-lowest text-primary shadow-ambient'
                : 'text-on-surface-variant hover:bg-surface-container-high',
            )}
          >
            <span className="material-symbols-outlined text-[14px] leading-none">call_split</span>
            {t('home.split_evenly')}
          </button>
          <button
            onClick={() => setSplitMode('itemized')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer',
              splitMode === 'itemized'
                ? 'bg-surface-container-lowest text-primary shadow-ambient'
                : 'text-on-surface-variant hover:bg-surface-container-high',
            )}
          >
            <span className="material-symbols-outlined text-[14px] leading-none">edit_note</span>
            {t('home.itemized')}
          </button>
        </div>

        <DockInfo
          splitMode={splitMode}
          activeMembersCount={activeMembers.length}
          totalAmount={totalAmount}
          focusedMemberId={focusedMemberId}
          focusedMemberAvatarUrl={members.find((m) => m.id === focusedMemberId)?.avatarUrl}
          focusedMemberName={members.find((m) => m.id === focusedMemberId)?.name}
        />

        <div className="px-1 pb-4 touch-manipulation">
          <Calculator />
        </div>
      </BottomSheet>
    </div>
  );
}

function DockInfo(props: {
  splitMode: 'split_evenly' | 'itemized';
  activeMembersCount: number;
  totalAmount: number;
  focusedMemberId: string | null;
  focusedMemberAvatarUrl: string | undefined;
  focusedMemberName: string | undefined;
}) {
  const { t } = useTranslation();
  const {
    splitMode,
    activeMembersCount,
    totalAmount,
    focusedMemberId,
    focusedMemberAvatarUrl,
    focusedMemberName,
  } = props;

  if (splitMode === 'itemized') {
    if (!focusedMemberId) return null;
    return (
      <div className="flex items-center justify-center gap-2 mb-2 mx-4 animate-in fade-in slide-in-from-bottom-2">
        <MemberAvatar seed={focusedMemberAvatarUrl ?? ''} size={24} className="shadow-sm" />
        <span className="text-sm font-medium text-on-surface-variant">
          {t('home.inputting_for', { name: focusedMemberName })}
        </span>
      </div>
    );
  }

  if (activeMembersCount <= 0 || totalAmount <= 0) {
    return (
      <p className="text-xs text-center text-on-surface-variant mb-2 opacity-60">
        {t('home.save_hint')}
      </p>
    );
  }

  return null;
}
