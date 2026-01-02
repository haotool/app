/**
 * Application Constants
 * Real project data and configuration
 * [update:2025-12-14] - Replaced with real projects (nihonname, ratewise)
 */

// [fix:2025-12-14] 更新為「haotool」取自「好工具」的諧音
export const APP_NAME = 'haotool';

export const SOCIAL_LINKS = {
  github: 'https://github.com/haotool/app',
  threads: 'https://www.threads.net/@azlife_1224',
  email: 'haotool.org@gmail.com',
} as const;

export enum ProjectCategory {
  ALL = '全部',
  TOOL = '工具類',
  ENTERTAINMENT = '娛樂類',
  DATA = '資料類',
  CREATIVE = '創意類',
  EDUCATION = '教育類',
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  link: string;
  imageUrl: string;
  featured?: boolean;
  category: ProjectCategory;
  status: 'live' | 'beta' | 'development';
}

export const PROJECTS: Project[] = [
  {
    id: 'nihonname',
    title: '日本名字產生器',
    description:
      '輸入你的中文姓氏，瞬間產生道地的日文名字與諧音梗。支援 100+ 漢姓對照，提供羅馬拼音、歷史來源說明，並可一鍵分享至社群。Built with React 19, TypeScript, Vite SSG，Lighthouse SEO 100/100。',
    tags: ['React 19', 'TypeScript', 'Vite SSG', 'PWA', 'Tailwind CSS'],
    link: '/nihonname/',
    imageUrl: '/projects/nihonname-og.svg',
    featured: true,
    category: ProjectCategory.CREATIVE,
    status: 'live',
  },
  {
    id: 'ratewise',
    title: 'RateWise 匯率計算機',
    description:
      '即時匯率換算工具，整合 30 天歷史數據視覺化圖表。支援 13+ 幣別、離線使用 (PWA)、深色模式。技術棧：React 19, TypeScript, lightweight-charts, Service Worker。',
    tags: ['React 19', 'TypeScript', 'PWA', 'Charts', 'Tailwind CSS'],
    link: '/ratewise/',
    imageUrl: '/projects/ratewise-og.png',
    featured: true,
    category: ProjectCategory.TOOL,
    status: 'live',
  },
  {
    id: 'quake-school',
    title: '地震知識小學堂',
    description:
      '互動式地震衛教平台，透過 18 道精心設計的測驗題與 SVG 動畫，深入淺出講解地震科學知識。規模看大小，震度看搖晃！支援 PWA 離線使用，隨時隨地學習防災知識。',
    tags: ['React 19', 'TypeScript', 'SVG Animation', 'PWA', 'Tailwind CSS'],
    link: '/quake-school/',
    imageUrl: '/projects/quake-school-og.svg',
    featured: true,
    category: ProjectCategory.EDUCATION,
    status: 'live',
  },
];

export interface Stat {
  value: string;
  suffix?: string;
  label: string;
}

export const STATS: Stat[] = [
  { value: '3', suffix: '+', label: '年開發經驗' },
  { value: '3', label: '上線專案' },
  { value: '100', suffix: '%', label: '開源貢獻' },
  { value: '24', suffix: '/7', label: '持續學習' },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    question: 'haotool 的名字由來？',
    answer:
      '「HAO」是中文「好」的拼音。haotool 的核心理念非常純粹——打造真正的「好工具」。我深信優秀的數位產品不應只是功能的堆砌，更要是能解決痛點、並在使用過程中帶來愉悅感的工藝品。',
  },
  {
    question: '你專精哪些技術？',
    answer:
      '我專精現代 Web 開發，主要使用 React、TypeScript 和 Node.js。同時也有雲端平台（Cloudflare, Zeabur）、DevOps 實踐、以及 AI/ML 整合的實作經驗。',
  },
  {
    question: '這些專案有開源嗎？',
    answer:
      '是的，我大部分的個人專案都託管在 GitHub 上。我相信開源文化能促進技術的交流與進步，歡迎去我的 GitHub 逛逛！',
  },
  {
    question: '接受合作委託嗎？',
    answer:
      '是的，我目前開放承接各類型的技術委託。無論是高互動性的形象網站、複雜的前端架構規劃，或是產品原型的快速開發。如果您有任何想法，歡迎透過頁面下方的聯繫方式與我討論。',
  },
  {
    question: '網站使用的技術堆疊是？',
    answer:
      '本站使用 React, TypeScript, Tailwind CSS, Framer Motion 以及 React Three Fiber 打造。追求極致的效能與互動體驗。',
  },
];
