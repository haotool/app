/**
 * 上游 provider 標示 SSOT（零依賴）：v3 manifest 與 RateWise 開放資料 metadata 共用。
 * 條款未查證前 termsUrl 為 null、redistributionStatus 維持 unknown（PRD §17 #6）。
 */
const exchangeRateApiUrl = 'https://www.exchangerate-api.com';
const exchangeRateApi = {
  name: 'ExchangeRate-API',
  sourceUrl: exchangeRateApiUrl,
  requiredText: 'Rates By Exchange Rate API',
};

export const FX_ATTRIBUTION_METADATA = Object.freeze({
  exchangeRateApi: Object.freeze({
    ...exchangeRateApi,
    attributionLine: `${exchangeRateApi.requiredText} (${exchangeRateApi.sourceUrl})`,
  }),
});

export const FX_PROVIDER_OPEN_DATA_NAMES = Object.freeze({
  bot: '臺灣銀行牌告匯率',
  moneybox: 'MoneyBox (明洞換匯所聯盟)',
});

export const FX_PROVIDER_METADATA = Object.freeze({
  bot: Object.freeze({
    name: '臺灣銀行',
    kind: 'bank',
    sourceUrl: 'https://rate.bot.com.tw/xrt?Lang=zh-TW',
    termsUrl: null,
    redistributionStatus: 'unknown',
    attribution: '資料來源：臺灣銀行牌告匯率',
  }),
  moneybox: Object.freeze({
    name: 'MoneyBox 明洞換匯所',
    kind: 'exchange_shop',
    sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange/',
    termsUrl: null,
    redistributionStatus: 'unknown',
    attribution: '資料來源：MoneyBox 明洞換匯所',
  }),
});
