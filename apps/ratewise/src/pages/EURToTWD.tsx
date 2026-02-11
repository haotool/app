/**
 * EUR to TWD Landing Page
 *
 * @description SEO-optimized landing page for EUR to TWD currency conversion.
 *              Uses CurrencyLandingPage component for consistent design.
 * @version 2.0.0 - Migrated to CurrencyLandingPage component
 */

import { CurrencyLandingPage } from '../components/CurrencyLandingPage';

const FAQ_ENTRIES = [
  {
    question: '歐元匯率數據來源與更新頻率？',
    answer:
      '資料 100% 參考臺灣銀行牌告匯率（現金/即期買入賣出價），每 5 分鐘自動同步一次，首頁會顯示最近更新時間。',
  },
  {
    question: '歐元換算結果與實際交易是否相同？',
    answer:
      'RateWise 提供牌告參考匯率，實際交易匯率可能因銀行或線上換匯平台產生 0.5%~2% 價差，請以交易方公告為準。',
  },
  {
    question: '去歐洲旅遊要換多少歐元？',
    answer:
      '建議使用 RateWise 換算器輸入預算金額，即可得知台幣對應歐元。一般建議行程預算 + 20% 餘裕，並參考當日牌告匯率。',
  },
  {
    question: '歐元匯率走勢如何查看？',
    answer: '首頁點擊歐元卡片可展開 7~30 天歷史趨勢圖，視覺化呈現匯率走勢，幫助判斷換匯時機。',
  },
];

const HOW_TO_STEPS = [
  {
    position: 1,
    name: '選擇歐元 (EUR)',
    text: '在首頁將「從」設定為 EUR，或在多幣別模式中找到歐元卡片。',
  },
  {
    position: 2,
    name: '輸入歐元金額',
    text: '輸入 EUR 金額後即時計算對 TWD 的換算結果；多幣別模式可同時查看 30+ 貨幣。',
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
  '歐洲旅遊：預估旅費、換匯金額，一鍵換算。',
  '趨勢圖：7~30 天歷史匯率走勢，判斷換匯時機。',
];

export default function EURToTWD() {
  return (
    <CurrencyLandingPage
      currencyCode="EUR"
      currencyFlag="🇪🇺"
      currencyName="歐元"
      title="EUR 對 TWD 匯率換算器 | 即時歐元台幣匯率"
      description="即時歐元兌台幣匯率換算，參考臺灣銀行官方牌告匯率，每 5 分鐘自動更新。1 EUR 等於多少台幣？歐洲旅遊換匯必備，支援現金匯率與即期匯率切換、離線 PWA 使用、多幣別同時換算。"
      pathname="/eur-twd"
      canonical="https://app.haotool.org/ratewise/eur-twd/"
      keywords={[
        'EUR TWD 匯率',
        '歐元換台幣',
        '歐元匯率',
        '歐洲旅遊換匯',
        '匯率換算',
        '匯率好工具',
        'RateWise',
      ]}
      faqEntries={FAQ_ENTRIES}
      howToSteps={HOW_TO_STEPS}
      highlights={HIGHLIGHTS}
      faqTitle="歐元換匯常見問題"
    />
  );
}
