/**
 * USD to TWD Landing Page
 *
 * @description SEO-optimized landing page for USD to TWD currency conversion.
 *              Uses CurrencyLandingPage component for consistent design.
 * @version 2.0.0 - Migrated to CurrencyLandingPage component
 */

import { CurrencyLandingPage } from '../components/CurrencyLandingPage';

const FAQ_ENTRIES = [
  {
    question: '匯率數據來源與更新頻率？',
    answer:
      '資料 100% 參考臺灣銀行牌告匯率（現金/即期買入賣出價），每 5 分鐘自動同步一次，首頁會顯示最近更新時間。',
  },
  {
    question: '換算結果與實際交易是否相同？',
    answer:
      'RateWise 提供牌告參考匯率，實際交易匯率可能因銀行或線上換匯平台產生 0.5%~2% 價差，請以交易方公告為準。',
  },
  {
    question: '可以離線使用嗎？',
    answer:
      '可以。PWA 首次開啟會快取資源與最近匯率，離線時仍可用上次更新的數據進行換算，恢復上網後會自動刷新。',
  },
  {
    question: '如何同時查看多種貨幣？',
    answer:
      '切換到「多幣別」模式即可同時看到 USD 對所有支援貨幣的換算；也可收藏常用貨幣，快速對照台幣匯率。',
  },
];

const HOW_TO_STEPS = [
  {
    position: 1,
    name: '選擇原始貨幣',
    text: '在首頁將「從」設定為 USD，美金對台幣或其他貨幣都可在同一介面切換。',
  },
  {
    position: 2,
    name: '輸入金額',
    text: '輸入 USD 金額後即時計算對 TWD 的換算結果；多幣別模式可同時查看 30+ 貨幣。',
  },
  {
    position: 3,
    name: '查看趨勢與模式',
    text: '展開卡片可查看 7~30 天歷史趨勢圖，也可切換現金/即期匯率或啟用離線快取。',
  },
];

const HIGHLIGHTS = [
  '資料來源：臺灣銀行牌告匯率，現金/即期買入賣出價完整呈現。',
  '更新頻率：每 5 分鐘自動同步，首頁顯示最近更新時間。',
  '模式切換：單幣別/多幣別，支援 30+ 貨幣同時換算。',
  '離線可用：PWA 快取資源與最近匯率，無網路仍可換算。',
];

export default function USDToTWD() {
  return (
    <CurrencyLandingPage
      currencyCode="USD"
      currencyFlag="🇺🇸"
      currencyName="美金"
      title="USD 對 TWD 匯率換算器 | 即時台幣匯率"
      description="即時美金對台幣匯率，參考臺灣銀行牌告，每 5 分鐘更新。支援現金/即期匯率、離線 PWA、多幣別模式。"
      pathname="/usd-twd"
      canonical="https://app.haotool.org/ratewise/usd-twd/"
      keywords={['USD TWD 匯率', '美金換台幣', '美金匯率', '匯率換算', '匯率好工具', 'RateWise']}
      faqEntries={FAQ_ENTRIES}
      howToSteps={HOW_TO_STEPS}
      highlights={HIGHLIGHTS}
    />
  );
}
