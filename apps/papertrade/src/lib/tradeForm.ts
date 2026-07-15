import { z } from 'zod';
import { type TradeError } from '../engine/engine';
import { LEVERAGE_MAX, LEVERAGE_MIN, MIN_ORDER_NOTIONAL_USDT } from '../config/trading';

export const TRADE_ERROR_MESSAGES: Record<TradeError, string> = {
  'invalid-leverage': '槓桿須在 1–125 倍之間',
  'invalid-qty': '請輸入有效的數量',
  'invalid-price': '請輸入大於 0 的價格',
  'below-min-notional': '訂單價值不得低於 5 USDT',
  'insufficient-balance': '可用餘額不足',
  'exceeds-position': '平倉數量加計掛單不得超過持倉數量',
  'invalid-tp-direction': '止盈價須優於開倉價（多單高於、空單低於）',
  'invalid-sl-direction': '止損價須劣於開倉價（多單低於、空單高於）',
  'not-found': '找不到對應的持倉',
};

const positiveInputSchema = z.coerce.number().finite().positive();

export function parsePositiveInput(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = positiveInputSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export type AmountUnit = 'usdt' | 'base';

export const orderFormSchema = z.object({
  qty: z.number().finite().positive(TRADE_ERROR_MESSAGES['invalid-qty']),
  price: z.number().finite().positive(TRADE_ERROR_MESSAGES['invalid-price']),
  leverage: z
    .number()
    .finite()
    .min(LEVERAGE_MIN, TRADE_ERROR_MESSAGES['invalid-leverage'])
    .max(LEVERAGE_MAX, TRADE_ERROR_MESSAGES['invalid-leverage']),
  notional: z
    .number()
    .finite()
    .min(MIN_ORDER_NOTIONAL_USDT, TRADE_ERROR_MESSAGES['below-min-notional']),
});

export interface OrderFormInput {
  amount: string;
  unit: AmountUnit;
  price: number;
  leverage: number;
}

export type OrderFormParse =
  | { ok: true; qty: number; price: number }
  | { ok: false; message: string };

export function parseOrderForm(input: OrderFormInput): OrderFormParse {
  const amountValue = parsePositiveInput(input.amount);
  if (amountValue === null) return { ok: false, message: TRADE_ERROR_MESSAGES['invalid-qty'] };
  const qty = input.unit === 'usdt' ? amountValue / input.price : amountValue;
  const parsed = orderFormSchema.safeParse({
    qty,
    price: input.price,
    leverage: input.leverage,
    notional: qty * input.price,
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? TRADE_ERROR_MESSAGES['invalid-qty'];
    return { ok: false, message };
  }
  return { ok: true, qty: parsed.data.qty, price: parsed.data.price };
}

export function maxOpenNotional(available: number, leverage: number, feeRate: number): number {
  if (available <= 0) return 0;
  return available / (1 / leverage + feeRate);
}

// 向下截斷而非四捨五入：快捷鈕回填的數量不得超過來源上限（進位會使 100% 必然拒單）。
// toPrecision(15) 先吸收乘法浮點偽差，避免 0.29*100=28.999... 被誤截成 0.28。
export function trimNumberInput(value: number, decimals: number): string {
  const factor = 10 ** decimals;
  const scaled = Number((value * factor).toPrecision(15));
  return (Math.floor(scaled) / factor).toString();
}
