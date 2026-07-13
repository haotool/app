/**
 * About FAQ Data - Single Source of Truth
 *
 * 全站 FAQ 唯一資料源：About 頁 Accordion 與 FAQPage JSON-LD 皆由此生成。
 * 內容基準：design-deep-dive §6.4 五題終稿。
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export const ABOUT_FAQS: FaqItem[] = [
  {
    question: 'HaoTool 的名字由來？',
    answer:
      '「HAO」是中文「好」的拼音，核心理念是打造真正的「好工具」：能解決痛點、並在使用過程帶來愉悅感的工藝品。',
  },
  {
    question: '這些工具真的免費嗎？',
    answer:
      '是的，全部免費、無廣告、不收集個資；營運成本由我自行吸收，因為這些工具我自己每天也在用。',
  },
  {
    question: '專案有開源嗎？',
    answer: '大部分專案託管在 GitHub（GPL-3.0）。我相信開源能促進交流與進步，歡迎檢視原始碼。',
  },
  {
    question: '接受合作委託嗎？',
    answer: '接受。形象網站、前端架構規劃、產品原型開發都可以聊，透過聯繫頁與我討論即可。',
  },
  {
    question: '網站用什麼技術打造？',
    answer:
      'React 19、TypeScript、Vite、Tailwind CSS，以 SSG 預渲染與 PWA 離線能力交付，追求可驗證的效能。',
  },
];
