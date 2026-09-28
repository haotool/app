/** ISO 4217 minor unit SSOT；零依賴，供 SEO 投影等輕量路徑使用而不載入 decimal／驗證器。 */
export const MINOR_UNITS = Object.freeze({
  TWD: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  AUD: 2,
  CAD: 2,
  CHF: 2,
  CNY: 2,
  HKD: 2,
  SGD: 2,
  NZD: 2,
  THB: 2,
  MYR: 2,
  PHP: 2,
  IDR: 2,
  INR: 2,
  ZAR: 2,
  SEK: 2,
  NOK: 2,
  DKK: 2,
  JPY: 0,
  KRW: 0,
  VND: 0,
  KWD: 3,
  BHD: 3,
  OMR: 3,
  TND: 3,
});
export function minorUnit(currency) {
  const result = MINOR_UNITS[currency];
  if (result === undefined) throw new Error(`Unsupported currency minor unit: ${currency}`);
  return result;
}
