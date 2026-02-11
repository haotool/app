/**
 * THB to TWD Landing Page
 *
 * @description SEO-optimized landing page for THB to TWD currency conversion.
 *              Uses CurrencyLandingPage component for consistent design.
 * @version 2.0.0 - Migrated to CurrencyLandingPage component
 */

import { CurrencyLandingPage } from '../components/CurrencyLandingPage';

const FAQ_ENTRIES = [
  {
    question: '泰銖匯率數據來源與更新頻率？',
    answer:
      '資料 100% 參考臺灣銀行牌告匯率（現金/即期買入賣出價），每 5 分鐘自動同步一次，首頁會顯示最近更新時間。',
  },
  {
    question: '泰銖換算結果與實際交易是否相同？',
    answer:
      'RateWise 提供牌告參考匯率，實際交易匯率可能因銀行或線上換匯平台產生 0.5%~2% 價差，請以交易方公告為準。',
  },
  {
    question: '去泰國旅遊要換多少泰銖？',
    answer:
      '建議使用 RateWise 換算器輸入預算金額，即可得知台幣對應泰銖。一般建議行程預算 + 20% 餘裕，並參考當日牌告匯率。',
  },
  {
    question: '泰銖匯率走勢如何查看？',
    answer: '首頁點擊泰銖卡片可展開 7~30 天歷史趨勢圖，視覺化呈現匯率走勢，幫助判斷換匯時機。',
  },
];

const HOW_TO_STEPS = [
  {
    position: 1,
    name: '選擇泰銖 (THB)',
    text: '在首頁將「從」設定為 THB，或在多幣別模式中找到泰銖卡片。',
  },
  {
    position: 2,
    name: '輸入泰銖金額',
    text: '輸入 THB 金額後即時計算對 TWD 的換算結果；多幣別模式可同時查看 30+ 貨幣。',
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
  '泰國旅遊：預估旅費、換匯金額，一鍵換算。',
  '趨勢圖：7~30 天歷史匯率走勢，判斷換匯時機。',
];

export default function THBToTWD() {
  return (
    <CurrencyLandingPage
      currencyCode="THB"
      currencyFlag="🇹🇭"
      currencyName="泰銖"
      title="THB 對 TWD 匯率換算器 | 即時泰銖台幣匯率"
      description="即時泰銖兌台幣匯率換算，參考臺灣銀行官方牌告匯率，每 5 分鐘自動更新。1 THB 等於多少台幣？泰國旅遊換匯必備，支援現金匯率與即期匯率切換、離線 PWA 使用、多幣別同時換算。"
      pathname="/thb-twd"
      canonical="https://app.haotool.org/ratewise/thb-twd/"
      keywords={[
        'THB TWD 匯率',
        '泰銖換台幣',
        '泰銖匯率',
        '泰國旅遊換匯',
        '匯率換算',
        '匯率好工具',
        'RateWise',
      ]}
      faqEntries={FAQ_ENTRIES}
      howToSteps={HOW_TO_STEPS}
      highlights={HIGHLIGHTS}
      faqTitle="泰銖換匯常見問題"
    />
  );
}
