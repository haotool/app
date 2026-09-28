import type { QuoteSnapshot } from '@app/shared/fx';
import { MINOR_UNITS } from '@app/shared/fx/minor-units';

const MAX_AMOUNT = 9007199254740991n;

/** 與 shared/fx isValidAmount 同一文法與上界。 */
function isValidAmount(value: string): boolean {
  if (value.length > 25 || !/^(0|[1-9]\d*)(\.\d{1,8})?$/.test(value)) return false;
  const { digits, scale } = toScaled(value);
  return digits <= MAX_AMOUNT * 10n ** BigInt(scale);
}

function toScaled(value: string): { digits: bigint; scale: number } {
  const [whole = '0', fraction = ''] = value.split('.');
  return { digits: BigInt(whole + fraction), scale: fraction.length };
}

/** a × b 後以 ROUND_HALF_EVEN 捨入至 scale 位，輸出與 Decimal#toFixed() 相同的最短十進位。 */
function multiplyHalfEven(a: string, b: string, scale: number): string {
  const x = toScaled(a),
    y = toScaled(b);
  let digits = x.digits * y.digits;
  const excess = x.scale + y.scale - scale;
  if (excess > 0) {
    const divisor = 10n ** BigInt(excess);
    const quotient = digits / divisor,
      twice = (digits % divisor) * 2n;
    digits =
      twice > divisor || (twice === divisor && quotient % 2n === 1n) ? quotient + 1n : quotient;
  } else {
    digits *= 10n ** BigInt(-excess);
  }
  const text = digits.toString().padStart(scale + 1, '0');
  const whole = text.slice(0, text.length - scale);
  const fraction = text.slice(text.length - scale).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}

/**
 * 同一方向報價供畫面、FAQ、CTA 與 JSON-LD 使用；未知時間不補值。
 * 只處理 build-time 已驗證的 SEO 快照與 EXACT_IN：rate 取 canonical quote.rate，
 * 金額 = amount × rate 依目標幣 minor unit 半位取偶（與 shared/fx estimate 等價，測試守門）。
 * 刻意不匯入完整 shared/fx（decimal.js＋schema 驗證器），避免 v3 chunk 進入首頁 initial JS。
 */
export function projectSeoQuote(
  quotes: readonly QuoteSnapshot[],
  currency: string,
  direction: 'to-twd' | 'twd-to-foreign',
  amount: string,
): {
  rate: string;
  amount: string;
  quoteId: string;
  sourcePublishedAt: string | null;
  fetchedAt: string;
} | null {
  const fromCurrency = direction === 'to-twd' ? currency : 'TWD';
  const toCurrency = direction === 'to-twd' ? 'TWD' : currency;
  const quote = quotes.find((q) => q.fromCurrency === fromCurrency && q.toCurrency === toCurrency);
  const toScale = MINOR_UNITS[toCurrency];
  if (
    quote?.status !== 'available' ||
    quote.rate === null ||
    !/^(0|[1-9]\d*)(\.\d+)?$/.test(quote.rate) ||
    /^0(\.0+)?$/.test(quote.rate) ||
    !isValidAmount(amount) ||
    MINOR_UNITS[fromCurrency] === undefined ||
    toScale === undefined
  )
    return null;
  return {
    rate: quote.rate,
    amount: multiplyHalfEven(amount, quote.rate, toScale),
    quoteId: quote.quoteId,
    sourcePublishedAt: quote.sourceQuote.sourcePublishedAt,
    fetchedAt: quote.sourceQuote.fetchedAt,
  };
}
