import { Project, ProjectCategory, StatItem, FaqItem } from './types';

export const APP_NAME = "HAOTOOL.ORG";

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'DialHero',
    description: '一款向復古電話致敬的節奏遊戲。將撥號盤的操作轉化為音樂打擊的樂趣，挑戰你的反應極限。',
    category: ProjectCategory.ENTERTAINMENT,
    tags: ['React', 'Web Audio API', 'Game'],
    imageUrl: 'https://picsum.photos/600/400?random=1',
    link: '#', // Placeholder link
    featured: true,
  },
  {
    id: 'p2',
    title: '兔兔點擊 (BunnyClicker)',
    description: '療癒系放置型遊戲。透過自動化升級與收集胡蘿蔔，解鎖數百種可愛的兔兔裝扮。',
    category: ProjectCategory.ENTERTAINMENT,
    tags: ['Canvas', 'PWA', 'Casual'],
    imageUrl: 'https://picsum.photos/600/400?random=2',
    link: '#',
    featured: true,
  },
  {
    id: 'p3',
    title: '經典版展示平台',
    description: '為設計師打造的 3D 作品展示櫃，支援 GLTF 模型即時預覽與材質編輯。',
    category: ProjectCategory.CREATIVE,
    tags: ['Three.js', 'R3F', 'Tool'],
    imageUrl: 'https://picsum.photos/600/400?random=3',
    link: '#',
    featured: true,
  },
  {
    id: 'p4',
    title: 'JSON 格式化大師',
    description: '極速、本地端運算的 JSON 處理工具，支援大數據渲染與即時型別轉換。',
    category: ProjectCategory.TOOL,
    tags: ['Utility', 'Performance', 'Local-first'],
    imageUrl: 'https://picsum.photos/600/400?random=4',
    link: '#',
  },
  {
    id: 'p5',
    title: 'OpenData 視覺化儀表板',
    description: '整合政府公開數據，將複雜的交通與氣象資訊轉化為直覺的互動地圖。',
    category: ProjectCategory.DATA,
    tags: ['D3.js', 'Maps', 'Data Vis'],
    imageUrl: 'https://picsum.photos/600/400?random=5',
    link: '#',
  },
  {
    id: 'p6',
    title: 'AI 靈感產生器',
    description: '整合 Gemini API 的創意輔助工具，幫助開發者突破靈感枯竭的困境。',
    category: ProjectCategory.TOOL,
    tags: ['AI', 'Gemini', 'Productivity'],
    imageUrl: 'https://picsum.photos/600/400?random=6',
    link: '#',
  }
];

export const STATS: StatItem[] = [
  { label: '專案總數', value: '30', suffix: '+' },
  { label: '本月更新', value: '4', suffix: '個' },
  { label: '開源貢獻', value: '1.2', suffix: 'k' },
];

export const FAQS: FaqItem[] = [
  {
    question: "HAOTOOL 的名字由來？",
    answer: "「HAOTOOL」取自「好工具」的諧音，HAO 也取自我的名字「璋」的讀音，代表「好（Good）」。我希望這裡產出的每一個工具，對使用者來說都是「好工具」。"
  },
  {
    question: "這些專案有開源嗎？",
    answer: "是的，我大部分的個人專案都託管在 GitHub 上。我相信開源文化能促進技術的交流與進步，歡迎去我的 GitHub 逛逛！"
  },
  {
    question: "接受合作委託嗎？",
    answer: "目前我專注於個人產品開發，但如果你有非常有趣的創意或公益性質的專案，歡迎透過下方聯繫方式找我聊聊！"
  },
  {
    question: "網站使用的技術堆疊是？",
    answer: "本站使用 React, TypeScript, Tailwind CSS, Framer Motion 以及 React Three Fiber 打造。追求極致的效能與互動體驗。"
  }
];
