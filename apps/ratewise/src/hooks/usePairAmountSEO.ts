/**
 * Wise-pattern 幣對金額動態 SEO hook。
 * 支援路徑型（/usd-twd/500/）與 query string 型（?amount=500）兩種 URL。
 * 路徑型優先：params.amount > searchParams.amount。
 * canonical 金額頁自我 canonical。
 * 非索引金額頁回指基礎幣對頁。
 */

import { useParams, useSearchParams } from 'react-router-dom';
import { buildPairAmountSeo } from '../config/seo-metadata';
import { isIndexableAmount } from '../config/seo-paths';

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
  /** 是否屬於 canonical 索引金額頁。 */
  isIndexableAmount: boolean;
  /** 相容欄位：保留舊名稱。 */
  isPrerendered: boolean;
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
      isIndexableAmount: true,
      isPrerendered: true,
    };
  }

  const amount = parsed;
  const { title: seoTitle, description: seoDescription } = buildPairAmountSeo(
    amount,
    currencyCode,
    currencyName,
    direction,
  );

  const isCanonicalAmountPage = isIndexableAmount(currencyCode, amount, direction);

  const base = defaultCanonical.endsWith('/') ? defaultCanonical.slice(0, -1) : defaultCanonical;
  const seoCanonical = isCanonicalAmountPage ? `${base}/${amount}/` : `${base}/`;

  return {
    seoTitle,
    seoDescription,
    seoCanonical,
    amount,
    isIndexableAmount: isCanonicalAmountPage,
    isPrerendered: isCanonicalAmountPage,
  };
}
