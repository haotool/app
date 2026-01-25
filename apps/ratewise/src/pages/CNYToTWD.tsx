/**
 * CNY to TWD Landing Page
 *
 * @description SEO-optimized landing page for CNY to TWD currency conversion.
 *              Uses CurrencyLandingPage component for consistent design.
 * @version 2.0.0 - Migrated to CurrencyLandingPage component
 */

import { CurrencyLandingPage } from '../components/CurrencyLandingPage';

const FAQ_ENTRIES = [
  {
    question: '人民幣匯率數據來源與更新頻率？',
    answer:
      '資料 100% 參考臺灣銀行牌告匯率（現金/即期買入賣出價），每 5 分鐘自動同步一次，首頁會顯示最近更新時間。',
  },
  {
    question: '人民幣換算結果與實際交易是否相同？',
    answer:
      'RateWise 提供牌告參考匯率，實際交易匯率可能因銀行或線上換匯平台產生 0.5%~2% 價差，請以交易方公告為準。',
  },
  {
    question: '去中國旅遊要換多少人民幣？',
    answer:
      '建議使用 RateWise 換算器輸入預算金額，即可得知台幣對應人民幣。一般建議行程預算 + 20% 餘裕，並參考當日牌告匯率。',
  },
  {
    question: '人民幣匯率走勢如何查看？',
    answer: '首頁點擊人民幣卡片可展開 7~30 天歷史趨勢圖，視覺化呈現匯率走勢，幫助判斷換匯時機。',
  },
];

const HOW_TO_STEPS = [
  {
    position: 1,
    name: '選擇人民幣 (CNY)',
    text: '在首頁將「從」設定為 CNY，或在多幣別模式中找到人民幣卡片。',
  },
  {
    position: 2,
    name: '輸入人民幣金額',
    text: '輸入 CNY 金額後即時計算對 TWD 的換算結果；多幣別模式可同時查看 30+ 貨幣。',
  },
  {
    position: 3,
    name: '查看歷史趨勢',
    text: '展開卡片可查看 7~30 天歷史趨勢圖，判斷換匯時機，也可切換現金/即期匯率。',
  },
];

const HIGHLIGHTS = [
  '資料來源：臺灣銀行牌告匯率，現金/即期買入賣出價完整呈現。',
  '更新頻率：每 5 分鐘自動同步，首頁顯示最近更新時間。',
  '中國旅遊：預估旅費、換匯金額，一鍵換算。',
  '趨勢圖：7~30 天歷史匯率走勢，判斷換匯時機。',
];

export default function CNYToTWD() {
  return (
    <CurrencyLandingPage
      currencyCode="CNY"
      currencyFlag="🇨🇳"
      currencyName="人民幣"
      title="CNY 對 TWD 匯率換算器 | 即時人民幣台幣匯率"
      description="即時人民幣對台幣匯率，參考臺灣銀行牌告，每 5 分鐘更新。中國旅遊換匯必備工具，支援現金/即期匯率、離線 PWA、多幣別模式。"
      pathname="/cny-twd"
      canonical="https://app.haotool.org/ratewise/cny-twd/"
      keywords={[
        'CNY TWD 匯率',
        '人民幣換台幣',
        '人民幣匯率',
        '中國旅遊換匯',
        '匯率換算',
        '匯率好工具',
        'RateWise',
      ]}
      faqEntries={FAQ_ENTRIES}
      howToSteps={HOW_TO_STEPS}
      highlights={HIGHLIGHTS}
      faqTitle="人民幣換匯常見問題"
    />
  );
}
