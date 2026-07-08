/**
 * 金額階梯表（六段 IA 第 3 段）：Toss 交易列表式排版。
 * 保留 <table> 語意（featured snippet 可提取）；金額左、數值右、hairline 分隔。
 */

import { Link } from 'react-router-dom';
import type { ForwardLadderRow, ReverseLadderRow } from '../../config/seo-metadata';
import { formatNum } from './format';

export interface AmountLadderSectionProps {
  isTwdToForeign: boolean;
  currencyCode: string;
  currencyName: string;
  pathname: string;
  forwardLadder: ForwardLadderRow[];
  reverseLadder: ReverseLadderRow[];
  /** 金額頁當前金額：對應列標記為本頁（#634），不自我連結。 */
  highlightAmount?: number | null;
}

export function AmountLadderSection({
  isTwdToForeign,
  currencyCode,
  currencyName,
  pathname,
  forwardLadder,
  reverseLadder,
  highlightAmount = null,
}: AmountLadderSectionProps) {
  const basePath = pathname.replace(/\/$/, '');

  // 當前金額列：純文字＋「本頁」標記取代自我連結。
  const amountCell = (amount: number) =>
    amount === highlightAmount ? (
      <span className="font-medium tabular-nums text-text">
        {formatNum(amount)}
        <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-2xs font-semibold text-primary-on-surface">
          本頁
        </span>
      </span>
    ) : (
      <Link
        to={`${basePath}/${amount}/`}
        className="font-medium tabular-nums text-primary-on-surface hover:underline"
      >
        {formatNum(amount)}
      </Link>
    );

  return (
    <div
      className="overflow-x-auto rounded-card border border-border/60 bg-surface p-4 shadow-card sm:p-5"
      data-testid="amount-ladder"
    >
      <table className="w-full text-left text-xs sm:text-sm">
        <caption className="mb-3 text-left text-sm font-semibold text-text">
          {isTwdToForeign
            ? `常用台幣金額換${currencyName}對照（台銀現金賣出）`
            : `常用${currencyName}金額換台幣對照（台銀牌告）`}
        </caption>
        <thead>
          <tr className="border-b border-border/60 text-2xs text-text-muted">
            {isTwdToForeign ? (
              <>
                <th scope="col" className="py-2 pr-3 font-medium">
                  台幣（TWD）
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  可換{currencyName}（現金賣出）
                </th>
              </>
            ) : (
              <>
                <th scope="col" className="py-2 pr-3 font-medium">
                  {currencyName}（{currencyCode}）
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  換回台幣（現金買入）
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  買入成本（現金賣出）
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {isTwdToForeign
            ? reverseLadder.map((row) => (
                <tr
                  key={row.twdAmount}
                  className={`border-b border-border/40 last:border-b-0 ${row.twdAmount === highlightAmount ? 'bg-primary/5' : ''}`}
                  aria-current={row.twdAmount === highlightAmount ? 'page' : undefined}
                >
                  <td className="py-2.5 pr-3">{amountCell(row.twdAmount)}</td>
                  <td className="py-2.5 text-right font-medium tabular-nums text-text">
                    {formatNum(row.foreignAtCashSell)} {currencyCode}
                  </td>
                </tr>
              ))
            : forwardLadder.map((row) => (
                <tr
                  key={row.amount}
                  className={`border-b border-border/40 last:border-b-0 ${row.amount === highlightAmount ? 'bg-primary/5' : ''}`}
                  aria-current={row.amount === highlightAmount ? 'page' : undefined}
                >
                  <td className="py-2.5 pr-3">{amountCell(row.amount)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-text-muted">
                    {row.twdAtCashBuy !== null ? `${formatNum(row.twdAtCashBuy)} TWD` : '—'}
                  </td>
                  <td className="py-2.5 text-right font-medium tabular-nums text-text">
                    {formatNum(row.twdAtCashSell)} TWD
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
      <p className="mt-3 text-2xs leading-relaxed text-text-muted">
        表格由台銀牌告每日更新資料計算；「換回台幣」為現金買入估算值，實際以臨櫃牌告為準。
      </p>
    </div>
  );
}
