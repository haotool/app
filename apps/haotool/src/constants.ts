/**
 * Application Constants
 * Real project data and configuration
 * [update:2025-12-14] - Replaced with real projects (nihonname, ratewise)
 */

// [fix:2025-12-14] 更新為「HAOTOOL」取自「好工具」的諧音
export const APP_NAME = 'HAOTOOL';

export const SOCIAL_LINKS = {
  github: 'https://github.com/azlife',
  threads: 'https://www.threads.net/@azlife_1224',
  email: 'haotool.org@gmail.com',
} as const;

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  link: string;
  imageUrl: string;
  featured?: boolean;
  category: 'web' | 'mobile' | 'ai' | 'devops' | 'tool';
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
    // [fix:2025-12-14] 使用 webp 格式截圖
    imageUrl: '/screenshots/nihonname-preview.webp',
    featured: true,
    category: 'ai',
    status: 'live',
  },
  {
    id: 'ratewise',
    title: 'RateWise 匯率計算機',
    description:
      '即時匯率換算工具，整合 30 天歷史數據視覺化圖表。支援 13+ 幣別、離線使用 (PWA)、深色模式。技術棧：React 19, TypeScript, lightweight-charts, Service Worker。',
    tags: ['React 19', 'TypeScript', 'PWA', 'Charts', 'Tailwind CSS'],
    link: '/ratewise/',
    // [fix:2025-12-14] 使用 webp 格式截圖
    imageUrl: '/screenshots/ratewise-preview.webp',
    featured: true,
    category: 'web',
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
  { value: '2', label: '上線專案' },
  { value: '100', suffix: '%', label: '開源貢獻' },
  { value: '24', suffix: '/7', label: '持續學習' },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    question: 'HAOTOOL 的名字由來？',
    answer:
      'HAO 取自我的名字「璋」的諧音，同時也代表「好（Good）」。我希望這裡產出的每一個工具，對使用者來說都是「好工具」。',
  },
  {
    question: '你專精哪些技術？',
    answer:
      '我專精現代 Web 開發，主要使用 React、TypeScript 和 Node.js。同時也有雲端平台（Cloudflare, Zeabur）、DevOps 實踐、以及 AI/ML 整合的實作經驗。',
  },
  {
    question: '這些專案有開源嗎？',
    answer:
      '是的！這裡展示的所有專案都是開源的。我相信開源文化能促進技術交流與進步，歡迎去我的 GitHub 逛逛！',
  },
  {
    question: '接受合作委託嗎？',
    answer:
      '目前我專注於個人產品開發，但如果你有非常有趣的創意或公益性質的專案，歡迎透過下方聯繫方式找我聊聊！',
  },
  {
    question: '網站使用的技術堆疊是？',
    answer:
      '本站使用 React 19, TypeScript, Tailwind CSS, Framer Motion 打造，並使用 Lenis 實現平滑滾動效果。部署於 Cloudflare Pages，追求極致的效能與互動體驗。',
  },
];
