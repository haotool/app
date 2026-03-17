/**
 * Wise-pattern 幣對金額動態 SEO hook。
 * 當 URL 含有效 ?amount=X 時，產生金額專屬 title / description / canonical，
 * 使 /usd-twd/?amount=500 等 URL 可被 Googlebot 獨立索引（類 Wise 程序化 SEO）。
 *
 * canonical 固定指向幣對頁路徑 + ?amount=X（非首頁 deep-link），
 * 確保 Disallow: /ratewise/? 不會封鎖此類 URL。
 */

import { useSearchParams } from 'react-router-dom';

export interface UsePairAmountSEOProps {
  currencyCode: string;
  currencyName: string;
  pathname: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultCanonical: string;
}

export interface UsePairAmountSEOResult {
  seoTitle: string;
  seoDescription: string;
  seoCanonical: string;
  amount: number | null;
}

function formatAmountLocale(amount: number): string {
  return amount.toLocaleString('zh-TW');
}

export function usePairAmountSEO({
  currencyCode,
  currencyName,
  pathname: _pathname,
  defaultTitle,
  defaultDescription,
  defaultCanonical,
}: UsePairAmountSEOProps): UsePairAmountSEOResult {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get('amount');
  const parsed = raw !== null ? parseFloat(raw) : null;

  // 無效金額（null、0、負數、Infinity、NaN）→ 回傳預設 SEO。
  const isValid = parsed !== null && isFinite(parsed) && parsed > 0;

  if (!isValid) {
    return {
      seoTitle: defaultTitle,
      seoDescription: defaultDescription,
      seoCanonical: defaultCanonical,
      amount: null,
    };
  }

  const amount = parsed;
  const formatted = formatAmountLocale(amount);

  // Wise-style title：「500 美元換新台幣（USD/TWD）— 台銀實際賣出價 | RateWise」
  const seoTitle = `${formatted} ${currencyName}換新台幣（${currencyCode}/TWD）— 台銀實際賣出價 | RateWise`;

  // 直接回答「X 幣換多少？」意圖，強調非中間價。
  const seoDescription = `${formatted} ${currencyName}今日換新台幣要多少？查台銀牌告現金賣出價（非中間價），每 5 分鐘更新。適合出國換匯前快速估算。`;

  // canonical = 幣對頁路徑 + ?amount=（自引用，告知 Google 此 URL 可被索引）
  const base = defaultCanonical.endsWith('/') ? defaultCanonical.slice(0, -1) : defaultCanonical;
  const seoCanonical = `${base}/?amount=${amount}`;

  return { seoTitle, seoDescription, seoCanonical, amount };
}
