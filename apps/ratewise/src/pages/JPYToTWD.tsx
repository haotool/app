/**
 * JPY to TWD Landing Page
 *
 * @description SEO-optimized landing page for JPY to TWD currency conversion.
 *              Uses CurrencyLandingPage component for consistent design.
 * @version 2.0.0 - Migrated to CurrencyLandingPage component
 */

import { CurrencyLandingPage } from '../components/CurrencyLandingPage';

const FAQ_ENTRIES = [
  {
    question: '日圓匯率數據來源與更新頻率？',
    answer:
      '資料 100% 參考臺灣銀行牌告匯率（現金/即期買入賣出價），每 5 分鐘自動同步一次，首頁會顯示最近更新時間。',
  },
  {
    question: '日圓換算結果與實際交易是否相同？',
    answer:
      'RateWise 提供牌告參考匯率，實際交易匯率可能因銀行或線上換匯平台產生 0.5%~2% 價差，請以交易方公告為準。',
  },
  {
    question: '去日本旅遊要換多少日圓？',
    answer:
      '建議使用 RateWise 換算器輸入預算金額，即可得知台幣對應日圓。一般建議行程預算 + 20% 餘裕，並參考當日牌告匯率。',
  },
  {
    question: '日圓匯率走勢如何查看？',
    answer: '首頁點擊日圓卡片可展開 7~30 天歷史趨勢圖，視覺化呈現匯率走勢，幫助判斷換匯時機。',
  },
];

const HOW_TO_STEPS = [
  {
    position: 1,
    name: '選擇日圓 (JPY)',
    text: '在首頁將「從」設定為 JPY，或在多幣別模式中找到日圓卡片。',
  },
  {
    position: 2,
    name: '輸入日圓金額',
    text: '輸入 JPY 金額後即時計算對 TWD 的換算結果；多幣別模式可同時查看 30+ 貨幣。',
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
  '日本旅遊：預估旅費、換匯金額，一鍵換算。',
  '趨勢圖：7~30 天歷史匯率走勢，判斷換匯時機。',
];

export default function JPYToTWD() {
  return (
    <CurrencyLandingPage
      currencyCode="JPY"
      currencyFlag="🇯🇵"
      currencyName="日圓"
      title="JPY 對 TWD 匯率換算器 | 即時日圓台幣匯率"
      description="即時日圓兌台幣匯率換算，參考臺灣銀行官方牌告匯率，每 5 分鐘自動更新。1 JPY 等於多少台幣？100 日圓換台幣即時報價，日本旅遊換匯必備，支援現金匯率與即期匯率切換、多幣別同時換算。完全免費、無廣告，不追蹤個人資料，資料 100% 來自臺灣銀行官方牌告匯率。"
      pathname="/jpy-twd"
      canonical="https://app.haotool.org/ratewise/jpy-twd/"
      keywords={[
        'JPY TWD 匯率',
        '日圓換台幣',
        '日圓匯率',
        '日本旅遊換匯',
        '匯率換算',
        '匯率好工具',
        'RateWise',
      ]}
      faqEntries={FAQ_ENTRIES}
      howToSteps={HOW_TO_STEPS}
      highlights={HIGHLIGHTS}
      faqTitle="日圓換匯常見問題"
    />
  );
}
