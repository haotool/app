import { useStore } from '../store/useStore';
import { evaluateExpression } from '../lib/evaluateExpression';
import { Calculator } from './Calculator';
import { MemberList } from './MemberList';
import { BottomSheet } from './BottomSheet';
import { cn } from '../lib/utils';
import { useEffect } from 'react';

export function HomeTab() {
  const {
    splitMode,
    setSplitMode,
    calculatorValue,
    members,
    itemizedValues,
    focusedMemberId,
    setFocusedMemberId,
  } = useStore();

  const activeMembers = members.filter((m) => m.isActive);

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[420px]">
      {/* Amount Display Card */}
      <div className="relative overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-ambient px-6 py-5 mb-4 text-center">
        <div
          className="absolute -right-4 -top-4 opacity-5 pointer-events-none select-none"
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-9xl">pets</span>
        </div>
        <span className="block text-on-surface-variant text-xs font-medium uppercase tracking-widest mb-2">
          {splitMode === 'split_evenly' ? '總金額' : '總計（自動加總）'}
        </span>
        <h1 className="text-4xl sm:text-5xl font-headline font-semibold tracking-tight text-on-surface leading-none break-all">
          NT$ {Math.round(totalAmount).toLocaleString('zh-TW')}
        </h1>
        {splitMode === 'split_evenly' && activeMembers.length > 0 && totalAmount > 0 && (
          <p className="text-sm text-on-surface-variant mt-2">
            每人{' '}
            <span className="font-semibold text-secondary">
              NT$ {Math.round(splitAmount).toLocaleString('zh-TW')}
            </span>{' '}
            × {activeMembers.length} 人
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
                <img
                  src={m.avatarUrl}
                  alt={m.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="font-medium truncate">{m.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-medium">
                  NT${' '}
                  {Math.round(evaluateExpression(itemizedValues[m.id] ?? '0')).toLocaleString(
                    'zh-TW',
                  )}
                </span>
                {itemizedValues[m.id] && focusedMemberId === m.id && (
                  <p className="text-xs opacity-70 font-mono mt-1">{itemizedValues[m.id]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Sheet: 計算機 + 模式切換 */}
      <BottomSheet isOpen={true} onClose={() => undefined} peekHeight={390} expandedHeight={450}>
        {/* Mode Toggle */}
        <div className="flex p-0.5 mx-4 mt-1 bg-surface-container rounded-full mb-2">
          <button
            onClick={() => setSplitMode('split_evenly')}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium rounded-full transition-all',
              splitMode === 'split_evenly'
                ? 'bg-surface-container-lowest text-primary shadow-ambient'
                : 'text-on-surface-variant hover:bg-surface-container-high',
            )}
          >
            平分
          </button>
          <button
            onClick={() => setSplitMode('itemized')}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium rounded-full transition-all',
              splitMode === 'itemized'
                ? 'bg-surface-container-lowest text-primary shadow-ambient'
                : 'text-on-surface-variant hover:bg-surface-container-high',
            )}
          >
            個別輸入
          </button>
        </div>

        <DockInfo
          splitMode={splitMode}
          activeMembersCount={activeMembers.length}
          totalAmount={totalAmount}
          splitAmount={splitAmount}
          focusedMemberId={focusedMemberId}
          focusedMemberAvatarUrl={members.find((m) => m.id === focusedMemberId)?.avatarUrl}
          focusedMemberName={members.find((m) => m.id === focusedMemberId)?.name}
        />

        <div className="px-1 pb-2">
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
  splitAmount: number;
  focusedMemberId: string | null;
  focusedMemberAvatarUrl: string | undefined;
  focusedMemberName: string | undefined;
}) {
  const {
    splitMode,
    activeMembersCount,
    totalAmount,
    splitAmount,
    focusedMemberId,
    focusedMemberAvatarUrl,
    focusedMemberName,
  } = props;

  if (splitMode === 'itemized') {
    if (!focusedMemberId) return null;
    return (
      <div className="flex items-center justify-center gap-2 mb-2 mx-4 animate-in fade-in slide-in-from-bottom-2">
        <img
          src={focusedMemberAvatarUrl}
          alt=""
          className="w-6 h-6 rounded-full shadow-sm object-cover"
        />
        <span className="text-sm font-medium text-on-surface-variant">
          正在輸入 <span className="text-primary font-bold">{focusedMemberName}</span> 的金額
        </span>
      </div>
    );
  }

  if (activeMembersCount <= 0 || totalAmount <= 0) {
    return (
      <p className="text-xs text-center text-on-surface-variant mb-2 opacity-60">
        輸入金額後按完成儲存 🐾
      </p>
    );
  }

  return (
    <div className="relative mb-2 mx-4 overflow-hidden rounded-[1.5rem] bg-surface-container-low px-4 py-2.5 shadow-ambient">
      <div className="relative z-10 text-center">
        <p className="text-sm text-on-surface-variant leading-relaxed">
          由 <span className="font-semibold text-primary">{activeMembersCount} 位貓奴</span> 平分。
          <br />
          每人需支付{' '}
          <span className="font-semibold text-secondary">
            NT$ {Math.round(splitAmount).toLocaleString('zh-TW')}
          </span>
          。
        </p>
      </div>
      <div className="absolute -left-3 -bottom-6 text-surface-variant/35">
        <span className="material-symbols-outlined text-7xl">pets</span>
      </div>
    </div>
  );
}
