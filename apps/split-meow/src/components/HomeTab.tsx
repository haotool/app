import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { evaluateExpression } from '../lib/evaluateExpression';
import { Calculator } from './Calculator';
import { MemberList } from './MemberList';
import { MemberAvatar } from './MemberAvatar';
import { cn } from '../lib/utils';
import { useEffect, useRef, useState } from 'react';
import { convertAmount, formatAmount } from '../config/currencies';

interface HomeTabProps {
  onPawParticle?: (x: number, y: number) => void;
}

export function HomeTab({ onPawParticle }: HomeTabProps = {}) {
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
    expenseCategory,
    setExpenseCategory,
    currency,
    krwPerTwd,
  } = useStore();

  const CATEGORIES = [
    { id: 'food' as const, emoji: '🍜' },
    { id: 'transport' as const, emoji: '🚗' },
    { id: 'accommodation' as const, emoji: '🏨' },
    { id: 'entertainment' as const, emoji: '🎪' },
    { id: 'shopping' as const, emoji: '🛍️' },
    { id: 'other' as const, emoji: '✨' },
  ];

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelH, setPanelH] = useState(400);
  const [keyboardH, setKeyboardH] = useState(0);
  // 矮視窗（<480px 高，多為手機橫向）：面板改為流式佈局，主內容永遠可捲動抵達。
  const [isShortViewport, setIsShortViewport] = useState(false);

  // Track panel height → drives content paddingBottom；固定模式時發布 --home-panel-h 供貓咪層避讓。
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) {
        setPanelH(entry.contentRect.height);
        if (!isShortViewport) {
          document.documentElement.style.setProperty(
            '--home-panel-h',
            `${Math.round(entry.contentRect.height)}px`,
          );
        }
      }
    });
    ro.observe(el);
    if (isShortViewport) document.documentElement.style.removeProperty('--home-panel-h');
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--home-panel-h');
    };
  }, [isShortViewport]);

  // Detect system keyboard via visualViewport (iOS PWA / Android Chrome)
  useEffect(() => {
    const update = () => {
      const vvh = window.visualViewport?.height ?? window.innerHeight;
      setKeyboardH(Math.max(0, window.innerHeight - vvh));
    };
    update();
    window.visualViewport?.addEventListener('resize', update);
    return () => window.visualViewport?.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-height: 479px)');
    const update = () => setIsShortViewport(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const activeMembers = members.filter((m) => m.isActive);

  // 個別輸入模式必須始終把焦點維持在有效成員上，避免鍵盤輸入寫入已停用對象。
  useEffect(() => {
    if (splitMode !== 'itemized') return;

    if (activeMembers.length === 0) {
      if (focusedMemberId) setFocusedMemberId(null);
      return;
    }

    const focusedMemberIsActive = activeMembers.some((member) => member.id === focusedMemberId);
    if (!focusedMemberIsActive) {
      const first = activeMembers[0];
      if (first) setFocusedMemberId(first.id);
    }
  }, [splitMode, focusedMemberId, activeMembers, setFocusedMemberId]);

  const totalAmount =
    splitMode === 'split_evenly'
      ? evaluateExpression(calculatorValue)
      : activeMembers.reduce((sum, m) => sum + evaluateExpression(itemizedValues[m.id] ?? '0'), 0);

  const splitAmount = activeMembers.length > 0 ? totalAmount / activeMembers.length : 0;

  // 系統鍵盤開啟時：面板移至鍵盤上方；否則：固定在 BottomNav 上方
  const isKeyboardOpen = keyboardH > 0;
  const panelBottom = isKeyboardOpen ? `${keyboardH}px` : 'var(--chrome-bottom)';

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{
        paddingBottom: isShortViewport
          ? 'calc(var(--chrome-bottom) + 1rem)'
          : `calc(${panelH + 16}px + var(--chrome-bottom))`,
      }}
    >
      {/* Amount Display Card */}
      <div className="relative overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-ambient px-6 py-5 mb-4 text-center">
        <div
          className="absolute -right-4 -top-4 opacity-5 pointer-events-none select-none"
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-9xl">pets</span>
        </div>

        {totalAmount === 0 ? (
          <div className="py-2 flex flex-col items-center gap-2 animate-in fade-in duration-300">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/25 select-none">
              pets
            </span>
            <p className="text-sm text-on-surface-variant/60">
              {t(
                splitMode === 'split_evenly'
                  ? 'home.empty_hint_evenly'
                  : 'home.empty_hint_itemized',
              )}
            </p>
          </div>
        ) : (
          <>
            <span className="block text-on-surface-variant text-xs font-medium uppercase tracking-widest mb-2">
              {splitMode === 'split_evenly' ? t('home.totalAmount') : t('home.totalItemized')}
            </span>
            <h1 className="text-4xl sm:text-5xl font-headline font-semibold tracking-tight text-on-surface leading-none break-all">
              {formatAmount(totalAmount, currency)}
            </h1>
            {/* 換算提示：另一幣別的近似金額（derived only，rate 無效時隱藏） */}
            {totalAmount > 0 &&
              (() => {
                const to = currency === 'KRW' ? 'TWD' : 'KRW';
                const approx = convertAmount(totalAmount, currency, to, krwPerTwd);
                if (approx === null) return null;
                return (
                  <p className="text-xs text-on-surface-variant/50 mt-1">
                    ≈ {formatAmount(approx, to)}
                  </p>
                );
              })()}
            {splitMode === 'split_evenly' && activeMembers.length > 0 && (
              <p className="text-sm text-on-surface-variant mt-2">
                {t('home.perPerson')}{' '}
                <span className="font-semibold text-secondary">
                  {formatAmount(splitAmount, currency)}
                </span>{' '}
                × {activeMembers.length} {t('home.people')}
              </p>
            )}
            {splitMode === 'split_evenly' && calculatorValue && (
              <p className="text-xs text-on-surface-variant mt-1 font-mono opacity-70">
                {calculatorValue}
              </p>
            )}
          </>
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
                  {formatAmount(evaluateExpression(itemizedValues[m.id] ?? '0'), currency)}
                </span>
                {itemizedValues[m.id] && focusedMemberId === m.id && (
                  <p className="text-xs opacity-70 font-mono mt-1">{itemizedValues[m.id]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 固定底部面板（G11）：直向 max-height 受控＋內部可捲；矮視窗（橫向）改流式，主內容永遠可達 */}
      <div
        ref={panelRef}
        data-testid="home-panel"
        className={cn(
          'z-40 max-w-lg rounded-t-[2rem] bg-surface shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.10)] pt-2 vshort:pt-1',
          isShortViewport
            ? 'relative -mx-4 mt-4'
            : 'home-panel-fixed fixed inset-x-0 mx-auto overflow-y-auto overscroll-contain',
        )}
        style={
          isShortViewport ? undefined : { bottom: panelBottom, transition: 'bottom 0.15s ease-out' }
        }
      >
        {/* 裝飾性把手（不可拖動）；極矮視窗隱藏換取鍵盤可見高度 */}
        <div className="w-10 h-1 rounded-full bg-on-surface/10 mx-auto mb-2 vshort:hidden" />

        {/* Note Input */}
        <div className="mx-4 mt-1 mb-2 vshort:mt-0 vshort:mb-1">
          <div className="flex items-center gap-2 bg-surface-container rounded-full px-4 py-2">
            <button
              onClick={() => {
                setShowCategoryPicker((prev) => !prev);
                noteInputRef.current?.blur();
              }}
              className={cn(
                // 44px 命中區（G1）：負邊距維持備註列高不變，與右側清除鈕同模式。
                'shrink-0 w-11 h-11 -my-2.5 -ml-3 flex items-center justify-center rounded-full transition-all cursor-pointer active:scale-90',
                showCategoryPicker ? 'bg-primary-container' : '',
              )}
              aria-label={t('home.pick_category')}
              aria-expanded={showCategoryPicker}
            >
              {expenseCategory ? (
                <span className="text-base leading-none">
                  {CATEGORIES.find((c) => c.id === expenseCategory)?.emoji}
                </span>
              ) : (
                <span
                  className={cn(
                    'material-symbols-outlined text-[18px]',
                    showCategoryPicker ? 'text-primary' : 'text-on-surface-variant',
                  )}
                >
                  label
                </span>
              )}
            </button>
            <input
              ref={noteInputRef}
              type="text"
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              onFocus={() => setShowCategoryPicker(false)}
              placeholder={t('home.note_placeholder')}
              maxLength={20}
              enterKeyHint="done"
              className="flex-1 bg-transparent text-base text-on-surface placeholder:text-on-surface-variant/50 outline-none"
            />
            {expenseNote && (
              <button
                onClick={() => setExpenseNote('')}
                aria-label={t('common.clear')}
                className="w-11 h-11 -my-2.5 -mr-3 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  close
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Category Picker — 點擊備註左側圖示才展開 */}
        {showCategoryPicker && (
          <div className="flex gap-1.5 mx-4 mb-2 animate-in fade-in slide-in-from-top-1 duration-150">
            {CATEGORIES.map((cat) => {
              const isActive = expenseCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setExpenseCategory(isActive ? null : cat.id);
                    setShowCategoryPicker(false);
                  }}
                  aria-label={t(`home.category_${cat.id}`)}
                  aria-pressed={isActive}
                  className={cn(
                    'flex-1 min-h-11 rounded-full text-base transition-all active:scale-90 cursor-pointer',
                    isActive
                      ? 'bg-primary-container shadow-ambient'
                      : 'bg-surface-container text-on-surface-variant/60 hover:bg-surface-container-high',
                  )}
                >
                  {cat.emoji}
                </button>
              );
            })}
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex p-0.5 mx-4 bg-surface-container rounded-full mb-2 vshort:mb-1">
          <button
            onClick={() => setSplitMode('split_evenly')}
            aria-pressed={splitMode === 'split_evenly'}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 min-h-11 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer',
              splitMode === 'split_evenly'
                ? 'bg-surface-container-lowest text-primary shadow-ambient'
                : 'text-on-surface-variant hover:bg-surface-container-high',
            )}
          >
            <span className="material-symbols-outlined text-[14px] leading-none" aria-hidden="true">
              call_split
            </span>
            {t('home.split_evenly')}
          </button>
          <button
            onClick={() => setSplitMode('itemized')}
            aria-pressed={splitMode === 'itemized'}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 min-h-11 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer',
              splitMode === 'itemized'
                ? 'bg-surface-container-lowest text-primary shadow-ambient'
                : 'text-on-surface-variant hover:bg-surface-container-high',
            )}
          >
            <span className="material-symbols-outlined text-[14px] leading-none" aria-hidden="true">
              edit_note
            </span>
            {t('home.itemized')}
          </button>
        </div>

        {/* 系統鍵盤開啟時只顯示備註列，隱藏計算機避免面板超出可視區域 */}
        {!isKeyboardOpen && (
          <>
            <DockInfo
              splitMode={splitMode}
              activeMembersCount={activeMembers.length}
              totalAmount={totalAmount}
              focusedMemberId={focusedMemberId}
              focusedMemberAvatarUrl={members.find((m) => m.id === focusedMemberId)?.avatarUrl}
              focusedMemberName={members.find((m) => m.id === focusedMemberId)?.name}
            />

            <div className="px-1 pb-2 vshort:pb-1 touch-manipulation">
              <Calculator onPawParticle={onPawParticle} />
            </div>
          </>
        )}
      </div>
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
      <p className="text-xs text-center text-on-surface-variant mb-2 vshort:mb-1 opacity-60">
        {t('home.save_hint')}
      </p>
    );
  }

  return null;
}
