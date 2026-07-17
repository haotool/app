import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { type Member, type ExpenseRecord } from '../store/useStore';
import { formatAmount, resolveExpenseCurrency, type CurrencyCode } from '../config/currencies';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { type Settlement } from '../lib/settlements';
import { MemberAvatar } from './MemberAvatar';

interface SettlementSectionProps {
  settlements: Settlement[];
  members: Member[];
  currentTripId: string | null;
  tripCurrency: CurrencyCode;
  settledPayments: string[];
  onToggle: (key: string) => void;
}

/** 結清方式：誰付誰建議清單，點擊/鍵盤切換結清狀態。 */
export function SettlementSection({
  settlements,
  members,
  currentTripId,
  tripCurrency,
  settledPayments,
  onToggle,
}: SettlementSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="mb-10">
      <h3 className="text-xs font-medium uppercase tracking-widest text-outline px-2 mb-4">
        {t('history.settlements')}
      </h3>
      <div className="space-y-3">
        {settlements.map((s, i) => {
          const fromMember = members.find((m) => m.id === s.from);
          const toMember = members.find((m) => m.id === s.to);
          if (!fromMember || !toMember) return null;
          const settlementKey = `${currentTripId ?? ''}:${s.from}:${s.to}`;
          const isSettled = settledPayments.includes(settlementKey);
          return (
            <div
              key={i}
              data-testid="settlement-row"
              role="button"
              tabIndex={0}
              aria-pressed={isSettled}
              onClick={() => onToggle(settlementKey)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggle(settlementKey);
                }
              }}
              className={cn(
                'bg-surface-container-lowest p-4 rounded-[1.5rem] flex items-center gap-3 shadow-ambient cursor-pointer transition-opacity active:scale-[0.98] transition-transform',
                isSettled && 'opacity-50',
              )}
            >
              {/* 誰付誰方向視覺化：付款人 → 收款人 */}
              <div className="flex items-center gap-1 shrink-0">
                <MemberAvatar seed={fromMember.avatarUrl} alt={fromMember.name} size={36} />
                <span
                  className="material-symbols-outlined text-[18px] text-primary"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
                <MemberAvatar seed={toMember.avatarUrl} alt={toMember.name} size={36} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm text-on-surface-variant leading-snug',
                    isSettled && 'line-through',
                  )}
                >
                  {t('history.pay_to', {
                    from: fromMember.name,
                    to: toMember.name,
                  })}
                </p>
                {isSettled && (
                  <p className="text-xs text-tertiary font-medium mt-0.5">
                    {t('history.balance_settled')}
                  </p>
                )}
              </div>
              <div
                className={cn(
                  'rounded-full px-3 py-1 shrink-0 transition-colors',
                  isSettled
                    ? 'bg-tertiary-container text-on-tertiary-container'
                    : 'bg-secondary-container text-on-secondary-container',
                )}
              >
                <span className="text-sm font-bold">
                  {isSettled ? (
                    <span
                      className="material-symbols-outlined text-[16px] leading-none"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                      aria-hidden="true"
                    >
                      check_circle
                    </span>
                  ) : (
                    formatAmount(s.amount, tripCurrency)
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface BalancesSectionProps {
  balances: Record<string, number>;
  members: Member[];
  tripExpenses: ExpenseRecord[];
  tripCurrency: CurrencyCode;
}

/** 各人結算：成員收付摘要卡，點擊/鍵盤展開逐筆明細。 */
export function BalancesSection({
  balances,
  members,
  tripExpenses,
  tripCurrency,
}: BalancesSectionProps) {
  const { t } = useTranslation();
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const expenseCurrency = (exp: ExpenseRecord) => resolveExpenseCurrency(exp, tripCurrency);

  return (
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
              role={isSettled ? undefined : 'button'}
              tabIndex={isSettled ? undefined : 0}
              aria-expanded={isSettled ? undefined : isOpen}
              className={cn(
                'bg-surface-container-lowest rounded-[1.5rem] shadow-ambient overflow-hidden transition-all duration-300',
                !isSettled && 'cursor-pointer',
              )}
              onClick={() => {
                if (isSettled) return;
                setExpandedMemberId(isOpen ? null : memberId);
              }}
              onKeyDown={(e) => {
                if (isSettled || e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setExpandedMemberId(isOpen ? null : memberId);
                }
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
                      {isOwed ? '+' : '-'}
                      {formatAmount(Math.abs(amount), tripCurrency)}
                    </span>
                    <span
                      className="material-symbols-outlined text-on-surface-variant text-lg transition-transform duration-300"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      aria-hidden="true"
                    >
                      expand_more
                    </span>
                  </div>
                )}
              </div>

              {/* 展開明細；收合時 inert 消除幻影可聚焦項 */}
              <div
                inert={!isOpen || undefined}
                className={cn(
                  'grid transition-all duration-200 ease-in-out',
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
                                <span
                                  className="material-symbols-outlined text-[13px]"
                                  aria-hidden="true"
                                >
                                  payments
                                </span>
                                {t('history.balance_paid')}
                              </span>
                              <span className="font-semibold text-secondary">
                                +{formatAmount(exp.totalAmount, expenseCurrency(exp))}
                              </span>
                            </div>
                          )}

                          {/* 分攤行 */}
                          {share > 0.01 && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 text-on-surface-variant">
                                <span
                                  className="material-symbols-outlined text-[13px]"
                                  aria-hidden="true"
                                >
                                  group
                                </span>
                                {t('history.balance_share')}
                              </span>
                              <span className="font-semibold text-error">
                                -{formatAmount(share, expenseCurrency(exp))}
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
                              {net > 0.01 ? '+' : net < -0.01 ? '-' : ''}
                              {formatAmount(Math.abs(net), expenseCurrency(exp))}
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
                        {isOwed ? '+' : '-'}
                        {formatAmount(Math.abs(amount), tripCurrency)}
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
  );
}
