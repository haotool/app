import { z } from 'zod';
import { type TradeError } from '../engine/engine';

export const TRADE_ERROR_MESSAGES: Record<TradeError, string> = {
  'invalid-leverage': '槓桿須在 1–125 倍之間',
  'invalid-qty': '請輸入有效的數量',
  'invalid-price': '請輸入大於 0 的價格',
  'below-min-notional': '訂單價值不得低於 5 USDT',
  'insufficient-balance': '可用餘額不足',
  'not-found': '找不到對應的持倉',
};

const positiveInputSchema = z.coerce.number().finite().positive();

export function parsePositiveInput(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = positiveInputSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function maxOpenNotional(available: number, leverage: number, feeRate: number): number {
  if (available <= 0) return 0;
  return available / (1 / leverage + feeRate);
}

export function trimNumberInput(value: number, decimals: number): string {
  return Number(value.toFixed(decimals)).toString();
}
