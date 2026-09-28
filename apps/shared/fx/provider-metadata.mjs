/**
 * 上游 provider 標示 SSOT（零依賴）：v3 manifest 與 RateWise 開放資料 metadata 共用。
 * 條款未查證前 termsUrl 為 null、redistributionStatus 維持 unknown（PRD §17 #6）。
 */
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
