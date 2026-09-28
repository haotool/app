import { FX_PUBLISHER } from '../../../../shared/fx/publisher-metadata.mjs';
import { FX_PROVIDER_METADATA } from '../../../../shared/fx/provider-metadata.mjs';

export const API_ATTRIBUTION = Object.freeze({
  publisher: FX_PUBLISHER,
  upstreamSources: [
    FX_PROVIDER_METADATA.bot.attribution,
    FX_PROVIDER_METADATA.moneybox.attribution,
  ],
  terms: [
    '本 API 提供免費公開讀取。使用 API 時，必須在展示相關匯率資料的位置同時顯示以下發布者標示：',
    '同時保留 API 回應中的上游來源標示。這些來源文字是來源揭露，不代表我們已查證或授予上游資料的使用或再散布授權。',
    '標示連結可依使用者選擇加上 rel="nofollow"、rel="sponsored" 或 rel="ugc"。',
    '匯率僅供參考，不保證可按該匯率完成交易；資料未包含交易費用。',
    '本頁條款規範本 API 服務的使用，不主張匯率數值的著作權。上游條款仍適用；臺灣銀行及 MoneyBox 資料的再散布狀態尚未查證。',
  ],
  htmlSnippet: `<a href="${FX_PUBLISHER.url}">${FX_PUBLISHER.requiredText}</a>`,
  markdownSnippet: `[${FX_PUBLISHER.requiredText}](${FX_PUBLISHER.url})`,
});
