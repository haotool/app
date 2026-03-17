/**
 * useDeepLinkSEO — deep-link URL 動態 SEO
 *
 * 讀取 ?amount=X&from=Y&to=Z 參數，回傳對應的 title / description / canonical。
 * 讓 Googlebot 渲染後可建立「500 美元換新台幣」等長尾關鍵字索引頁。
 *
 * 回傳 null 表示無有效 deep-link 參數，使用預設首頁 SEO。
 */

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CURRENCY_DEFINITIONS } from '../features/ratewise/constants';
import { APP_INFO } from '../config/app-info';

type CurrencyCode = keyof typeof CURRENCY_DEFINITIONS;

export interface DeepLinkSEO {
  title: string;
  description: string;
  canonical: string;
}

function isValidCurrency(code: string): code is CurrencyCode {
  return code in CURRENCY_DEFINITIONS;
}

/** 千位分隔符（不依賴 locale API，測試環境安全）。 */
function formatAmount(amount: number): string {
  const str = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  const dotIndex = str.indexOf('.');
  const intPart = dotIndex >= 0 ? str.slice(0, dotIndex) : str;
  const decPart = dotIndex >= 0 ? str.slice(dotIndex + 1) : '';
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart ? `${formatted}.${decPart}` : formatted;
}

export function useDeepLinkSEO(): DeepLinkSEO | null {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const amountStr = searchParams.get('amount');
    const fromRaw = searchParams.get('from') ?? '';
    const toRaw = searchParams.get('to') ?? '';

    const from = fromRaw.toUpperCase();
    const to = toRaw.toUpperCase();
    const amount = amountStr ? parseFloat(amountStr) : NaN;

    if (isNaN(amount) || amount <= 0) return null;
    if (!isValidCurrency(from) || !isValidCurrency(to)) return null;

    const fromName = CURRENCY_DEFINITIONS[from].name;
    const toName = CURRENCY_DEFINITIONS[to].name;
    const formatted = formatAmount(amount);

    // 格式：「500 美元換新台幣（USD/TWD）｜RateWise 匯率好工具」
    const title = `${formatted} ${fromName}換${toName}（${from}/${to}）｜${APP_INFO.name}`;

    // 格式：「即時換算 500 美元（USD）到新台幣（TWD）。查詢台銀最新 USD/TWD 匯率，顯示實際買賣價（非中間價）。」
    const description =
      `即時換算 ${formatted} ${fromName}（${from}）到${toName}（${to}）。` +
      `查詢台銀最新 ${from}/${to} 匯率，顯示實際買賣價（非中間價）。`;

    // canonical 保留完整 query string，讓 Googlebot 可獨立建立索引。
    const canonical = `${APP_INFO.siteUrl}?amount=${amountStr}&from=${from}&to=${to}`;

    return { title, description, canonical };
  }, [searchParams]);
}
