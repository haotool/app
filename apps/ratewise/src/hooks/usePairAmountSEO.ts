/**
 * Wise-pattern 幣對金額動態 SEO hook。
 * 支援路徑型（/usd-twd/500/）與 query string 型（?amount=500）兩種 URL。
 * 路徑型優先：params.amount > searchParams.amount，canonical 一律指向路徑型。
 * 路徑型 URL 可被 vite-react-ssg 預渲染為靜態 HTML，Googlebot 無需執行 JS 即可讀取。
 */

import { useParams, useSearchParams } from 'react-router-dom';
import { buildPairAmountSeo } from '../config/seo-metadata';

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
  const { title: seoTitle, description: seoDescription } = buildPairAmountSeo(
    amount,
    currencyCode,
    currencyName,
    direction,
  );

  // canonical 一律回到可預渲染的路徑型金額頁，避免 query-string 製造重複索引訊號。
  const base = defaultCanonical.endsWith('/') ? defaultCanonical.slice(0, -1) : defaultCanonical;
  const seoCanonical = `${base}/${amount}/`;

  return { seoTitle, seoDescription, seoCanonical, amount };
}
