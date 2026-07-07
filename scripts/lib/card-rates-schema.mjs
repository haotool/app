// 刷卡匯率快照 schema 契約（SSOT）。抓取腳本與 contract test 共用，杜絕 schema drift。
// 快照語意：rates[幣別].{visa,mastercard} = 1 單位外幣的清算 TWD 金額（TWD per 1 foreign unit）。

/** 支援的刷卡幣別（TWD 為帳單幣別，故不列於外幣清單）。對齊 latest.json 幣別集。 */
export const CARD_RATE_CURRENCIES = Object.freeze([
  'USD',
  'HKD',
  'GBP',
  'AUD',
  'CAD',
  'SGD',
  'CHF',
  'JPY',
  'NZD',
  'THB',
  'PHP',
  'IDR',
  'EUR',
  'KRW',
  'VND',
  'MYR',
  'CNY',
]);

/** 至少要有這麼多幣別成功，快照才算有效（canary 熔斷，防半套髒資料）。 */
export const MIN_CARD_RATE_CURRENCIES = 10;

const UTC_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function isFiniteRate(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validateSourceEntry(errors, label, entry) {
  if (typeof entry !== 'object' || entry === null) {
    errors.push(`source.${label} 缺失或非物件`);
    return;
  }
  if (typeof entry.url !== 'string' || entry.url.length === 0) {
    errors.push(`source.${label}.url 缺失`);
  }
  if (typeof entry.fetchedAt !== 'string' || !UTC_ISO_PATTERN.test(entry.fetchedAt)) {
    errors.push(`source.${label}.fetchedAt 非 UTC ISO`);
  }
}

/**
 * 驗證刷卡匯率快照結構。回傳 { valid, errors }；errors 為訊息陣列。
 * 純函式、零依賴，供 contract test 與抓取腳本 commit 前置檢查共用。
 */
export function validateCardRates(data) {
  const errors = [];

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['快照非物件'] };
  }

  if (typeof data.updateTime !== 'string' || !UTC_ISO_PATTERN.test(data.updateTime)) {
    errors.push('updateTime 非 UTC ISO 格式');
  }

  if (typeof data.source !== 'object' || data.source === null) {
    errors.push('source 缺失');
  } else {
    validateSourceEntry(errors, 'visa', data.source.visa);
    validateSourceEntry(errors, 'mastercard', data.source.mastercard);
  }

  if (typeof data.rates !== 'object' || data.rates === null) {
    errors.push('rates 缺失');
    return { valid: errors.length === 0, errors };
  }

  const currencyKeys = Object.keys(data.rates);
  if (currencyKeys.length < MIN_CARD_RATE_CURRENCIES) {
    errors.push(`rates 幣別數 ${currencyKeys.length} 低於熔斷門檻 ${MIN_CARD_RATE_CURRENCIES}`);
  }

  for (const [currency, entry] of Object.entries(data.rates)) {
    if (!CARD_RATE_CURRENCIES.includes(currency)) {
      errors.push(`rates.${currency} 非支援幣別`);
      continue;
    }
    if (typeof entry !== 'object' || entry === null) {
      errors.push(`rates.${currency} 非物件`);
      continue;
    }
    // 每幣別至少要有一個 provider 的有效匯率；兩者皆缺視為髒資料。
    const hasVisa = 'visa' in entry;
    const hasMc = 'mastercard' in entry;
    if (!hasVisa && !hasMc) {
      errors.push(`rates.${currency} 無任何 provider 匯率`);
    }
    if (hasVisa && !isFiniteRate(entry.visa)) {
      errors.push(`rates.${currency}.visa 非正數`);
    }
    if (hasMc && !isFiniteRate(entry.mastercard)) {
      errors.push(`rates.${currency}.mastercard 非正數`);
    }
  }

  return { valid: errors.length === 0, errors };
}
