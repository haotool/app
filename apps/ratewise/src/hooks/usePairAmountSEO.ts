/**
 * Wise-pattern 幣對金額動態 SEO hook。
 * 支援路徑型（/usd-twd/500/）與 query string 型（?amount=500）兩種 URL。
 * 路徑型優先：params.amount > searchParams.amount，canonical 一律指向路徑型。
 * 路徑型 URL 可被 vite-react-ssg 預渲染為靜態 HTML，Googlebot 無需執行 JS 即可讀取。
 */

import { useParams, useSearchParams } from 'react-router-dom';

export interface UsePairAmountSEOProps {
  currencyCode: string;
  currencyName: string;
  pathname: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultCanonical: string;
  direction?: 'to-twd' | 'twd-to-foreign';
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
  direction = 'to-twd',
}: UsePairAmountSEOProps): UsePairAmountSEOResult {
  // 路徑型（/usd-twd/500/）優先；fallback 為 query string（?amount=500）。
  const params = useParams<{ amount?: string }>();
  const [searchParams] = useSearchParams();
  const raw = params.amount ?? searchParams.get('amount');
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

  // Wise-style title：「500 美元換新台幣（USD/TWD）」或「台幣換 500 美元（TWD/USD）」
  const seoTitle =
    direction === 'twd-to-foreign'
      ? `台幣換 ${formatted} ${currencyName}（TWD/${currencyCode}）— 台銀實際賣出價 | RateWise`
      : `${formatted} ${currencyName}換新台幣（${currencyCode}/TWD）— 台銀實際賣出價 | RateWise`;

  // 直接回答「X 幣換多少？」意圖，強調非中間價，說明數據來源。
  const seoDescription =
    direction === 'twd-to-foreign'
      ? `${formatted} 台幣今日可換多少${currencyName}？RateWise 直接顯示台銀牌告現金賣出價（非中間價），資料每 5 分鐘自動更新，幫你出國換匯前精確估算可兌換的外幣金額，避免被中間價誤導。`
      : `${formatted} ${currencyName}今日換新台幣要多少？RateWise 直接顯示台銀牌告現金賣出價（非中間價），資料每 5 分鐘自動更新，幫你出國換匯前精確估算所需台幣金額，避免被中間價誤導。`;

  // canonical 一律回到可預渲染的路徑型金額頁，避免 query-string 製造重複索引訊號。
  const base = defaultCanonical.endsWith('/') ? defaultCanonical.slice(0, -1) : defaultCanonical;
  const seoCanonical = `${base}/${amount}/`;

  return { seoTitle, seoDescription, seoCanonical, amount };
}
