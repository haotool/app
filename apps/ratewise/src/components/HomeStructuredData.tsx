import { Head } from 'vite-react-ssg';

interface FaqEntry {
  question: string;
  answer: string;
}

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://app.haotool.org/ratewise/';
const SITE_BASE_URL = SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`;
const OG_IMAGE_URL = `${SITE_BASE_URL}og-image.png?v=20251208`;

const HOW_TO_STEPS = [
  {
    '@type': 'HowToStep',
    position: 1,
    name: '選擇貨幣',
    text: '從下拉選單中選擇您要換算的來源貨幣和目標貨幣。RateWise 支援超過 30 種主要貨幣，包括 TWD、USD、JPY、EUR、GBP 等。',
  },
  {
    '@type': 'HowToStep',
    position: 2,
    name: '輸入金額',
    text: '在輸入框中輸入您想要換算的金額。系統會即時計算並顯示換算結果，數據來源為臺灣銀行牌告匯率。',
  },
  {
    '@type': 'HowToStep',
    position: 3,
    name: '查看結果',
    text: '換算結果會立即顯示在畫面上。您還可以查看歷史匯率趨勢圖，了解過去一段時間的匯率變化走勢。',
  },
];

const HOW_TO_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: '如何使用 RateWise 進行匯率換算',
  description: '三步驟輕鬆完成即時匯率換算，支援 30+ 種貨幣快速轉換',
  url: SITE_BASE_URL,
  step: HOW_TO_STEPS,
};

const ARTICLE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'RateWise 2025 預渲染與 PWA 強化',
  description:
    'RateWise 採用 vite-react-ssg 預渲染與 PWA 快取，提供離線匯率、iOS 風格計算機體驗及多幣別快速換算。',
  author: {
    '@type': 'Person',
    name: 'haotool',
    url: 'https://haotool.org',
  },
  publisher: {
    '@type': 'Organization',
    name: 'HaoTool',
    url: 'https://haotool.org',
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_BASE_URL}icons/ratewise-icon-512x512.png`,
    },
  },
  url: SITE_BASE_URL,
  inLanguage: 'zh-TW',
  image: OG_IMAGE_URL,
  thumbnailUrl: OG_IMAGE_URL,
  datePublished: '2025-11-26T00:00:00+08:00',
  dateModified: '2026-01-03T23:24:00+08:00',
};

export function HomeStructuredData({ faq }: { faq: FaqEntry[] }) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: SITE_BASE_URL,
    inLanguage: 'zh-TW',
    mainEntity: faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };

  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(HOW_TO_SCHEMA)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(ARTICLE_SCHEMA)}</script>
    </Head>
  );
}
