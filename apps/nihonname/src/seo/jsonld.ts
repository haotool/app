/**
 * JSON-LD Structured Data Configuration
 * [fix:2025-12-06] 將 JSON-LD 從 SEOHelmet 移至 build-time 注入
 * [context7:/daydreamer-riri/vite-react-ssg:2025-12-06]
 *
 * 根據 vite-react-ssg 官方最佳實踐，JSON-LD 應該在 onPageRendered hook 中注入，
 * 而不是使用 <Head> 組件中的 <script> 標籤，因為後者不會在 SSG build 時渲染。
 */

const SITE_BASE_URL = 'https://app.haotool.org/nihonname/';

const DEFAULT_DESCRIPTION =
  '探索1940年代台灣皇民化運動的歷史改姓對照。輸入你的姓氏，發現日治時期的日式姓名與趣味諧音名。基於歷史文獻《内地式改姓名の仕方》。';

const SOCIAL_LINKS = [
  'https://github.com/haotool/app',
  'https://www.threads.com/@azlife_1224/post/DR2NCeEj6Fo?xmt=AQF0K8pg5PLpzoBz7nnYMEI2CdxVzs2pUyIJHabwZWeYCw',
  'https://twitter.com/azlife_1224',
];

/**
 * 基礎 JSON-LD 結構化數據 (適用於所有頁面)
 */
export const BASE_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'NihonName 皇民化改姓生成器',
    alternateName: '日式姓名生成器',
    description: DEFAULT_DESCRIPTION,
    url: SITE_BASE_URL,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      '皇民化改姓查詢',
      '歷史姓氏對照',
      '趣味諧音日本名',
      '族譜來源查證',
      'PWA 離線支援',
      '300+ 姓氏資料庫',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'haotool',
    url: 'https://haotool.org',
    logo: `${SITE_BASE_URL}icons/icon-512x512.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'haotool.org@gmail.com',
    },
    sameAs: SOCIAL_LINKS,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NihonName',
    url: SITE_BASE_URL,
    inLanguage: 'zh-TW',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_BASE_URL}?surname={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
];

/**
 * 頁面特定的 BreadcrumbList schema
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(breadcrumbs: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http')
        ? item.url
        : `${SITE_BASE_URL}${item.url.replace(/^\//, '')}`,
    })),
  };
}

/**
 * FAQ 頁面的 FAQPage schema
 */
export interface FAQEntry {
  question: string;
  answer: string;
}

export function buildFaqSchema(faq: FAQEntry[], url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
    url,
  };
}

/**
 * 歷史專區頁面的 Article schema
 */
export interface ArticleData {
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  keywords: string[];
}

export function buildArticleSchema(article: ArticleData, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    url,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: {
      '@type': 'Organization',
      name: 'haotool',
      url: 'https://haotool.org',
    },
    publisher: {
      '@type': 'Organization',
      name: 'haotool',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_BASE_URL}icons/icon-512x512.png`,
      },
    },
    keywords: article.keywords,
    inLanguage: 'zh-TW',
  };
}

/**
 * HowTo schema for Guide page
 */
export function buildHowToSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: '如何使用皇民化改姓生成器',
    description: '學習如何使用 NihonName 查詢日治時期的日式姓名對照',
    step: [
      {
        '@type': 'HowToStep',
        name: '輸入姓氏',
        text: '在輸入框中輸入你的中文姓氏（支援單姓與複姓）',
        position: 1,
      },
      {
        '@type': 'HowToStep',
        name: '點擊查詢',
        text: '點擊「改名実行」按鈕開始查詢',
        position: 2,
      },
      {
        '@type': 'HowToStep',
        name: '查看結果',
        text: '系統會顯示對應的日式姓名、羅馬拼音和歷史來源',
        position: 3,
      },
      {
        '@type': 'HowToStep',
        name: '分享結果',
        text: '可以使用截圖模式分享你的日式姓名',
        position: 4,
      },
    ],
    totalTime: 'PT1M',
  };
}

/**
 * ImageObject schema for OG images
 */
export function buildImageObjectSchema(imagePath: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    url: `${SITE_BASE_URL}${imagePath.replace(/^\//, '')}`,
    width: 1200,
    height: 630,
    caption: 'NihonName 皇民化改姓生成器',
    inLanguage: 'zh-TW',
  };
}

/**
 * FAQ 資料 - 與 FAQ.tsx 保持同步
 * [fix:2025-12-06] 修復缺少 FAQPage schema 的問題
 */
const FAQ_DATA: FAQEntry[] = [
  // 歷史背景
  {
    question: '什麼是皇民化運動？',
    answer:
      '皇民化運動是1937-1945年間日本殖民政府在台灣推行的同化政策，包含推行日本語、改日本姓名、參拜神社等內容。這是日本殖民統治末期為了將台灣人「同化」為日本人所推行的政策。',
  },
  {
    question: '改姓是強制的嗎？',
    answer:
      '改姓採申請許可制，並非強制。但當時社會氛圍下，許多家庭為了子女升學、就業等現實考量而申請改姓。申請改姓需要符合一定條件，如「國語」（日語）能力、生活習慣等。',
  },
  {
    question: '改姓的原則是什麼？',
    answer:
      '主要有五種變異法：明示法（如林→小林）、拆字法（如林→二木）、同音法（如蔡→佐井）、郡望法（如陳→穎川）、暗示法（如柯→青山）。這些方法讓台灣人在改姓時能保留與原姓的某種連結。',
  },
  {
    question: '為什麼要了解這段歷史？',
    answer:
      '了解皇民化運動的歷史，可以幫助我們理解台灣在日治時期的社會變遷，以及當時人民面對殖民政策時的選擇與困境。這是台灣歷史的重要一頁。',
  },
  // 使用方法
  {
    question: '如何使用日本名字產生器？',
    answer:
      '只需在輸入框中輸入你的中文姓氏，系統會自動根據歷史文獻匹配對應的日文姓氏。點擊「名字」區域可以隨機產生有趣的諧音梗名字。',
  },
  {
    question: '為什麼我的姓氏找不到對應的日文姓氏？',
    answer:
      '目前資料庫收錄了約 90+ 個台灣常見姓氏的對應日文姓氏，共計 1,700+ 筆對照記錄。如果你的姓氏較為罕見，可能暫時沒有收錄。歡迎透過 About 頁面聯繫我們補充。',
  },
  {
    question: '諧音梗名字是怎麼產生的？',
    answer:
      '我們收集了約 500 個有趣的諧音梗日文名字，這些名字的日文發音與中文、台語或其他語言的詞彙相似，產生有趣的雙關效果。',
  },
  {
    question: '自訂的諧音梗名字會保存在哪裡？',
    answer:
      '自訂的諧音梗名字會儲存在你的瀏覽器 localStorage 中，不會上傳到伺服器。清除瀏覽器資料會同時清除這些自訂名字。',
  },
  {
    question: '可以用這個名字當作正式的日本名字嗎？',
    answer:
      '這個產生器主要是娛樂用途，產生的諧音梗名字可能不適合正式場合。如果需要正式的日本名字，建議諮詢專業的翻譯或命名服務。',
  },
  // 資料來源
  {
    question: '資料來源是什麼？',
    answer:
      '本系統整合多方歷史文獻：國史館臺灣文獻館檔案、吳秀環論文、劉正元論文、《內地式改姓名の仕方》及田野調查，涵蓋超過 90 個漢姓、1,700+ 筆對照記錄。',
  },
  {
    question: '資料庫有多少筆記錄？',
    answer:
      '目前資料庫收錄 90+ 個台灣常見漢姓，共計 1,700+ 筆日本姓氏對照記錄，每筆記錄皆標註變異法說明與歷史來源。',
  },
  {
    question: '資料準確性如何？',
    answer:
      '所有資料皆經過歷史文獻交叉比對，並標註來源。每筆姓氏對照都可以展開查看詳細的來源與變異法說明，確保資料的可追溯性。',
  },
  {
    question: '為什麼有些姓氏有多個日本姓氏對應？',
    answer:
      '這是歷史真實情況。改姓採申請制，同一漢姓可根據不同變異法（明示法、拆字法、同音法等）改為不同的日本姓氏。例如「林」可改為「小林」（明示法）或「二木」（拆字法）。',
  },
  {
    question: '如何確認結果的準確性？',
    answer:
      '每筆姓氏對照都可以展開查看「來源說明」，包含變異法分類（如明示法、拆字法）及歷史文獻引用。你可以點擊「顯示來源」查看詳細資料。',
  },
  // 隱私與技術
  {
    question: '我的資料會被上傳到伺服器嗎？',
    answer:
      '完全不會。所有資料（自訂諧音名、瀏覽紀錄）都儲存在你的瀏覽器 localStorage，不會傳送到任何伺服器。我們無法存取你的個人資料。',
  },
  {
    question: '這個生成器可以離線使用嗎？',
    answer:
      '可以！本應用支援 PWA (Progressive Web App) 技術。首次訪問後，你可以將網頁「加入主畫面」，之後即可離線使用姓氏查詢功能。',
  },
  {
    question: '瀏覽器不支援怎麼辦？',
    answer:
      '本應用建議使用現代瀏覽器（Chrome, Firefox, Safari, Edge 最新版）。如遇到顯示或功能問題，請嘗試更新瀏覽器或清除快取後重新載入。',
  },
];

/**
 * 根據路由生成完整的 JSON-LD 數據
 */
export function getJsonLdForRoute(route: string, buildTime: string): Record<string, unknown>[] {
  const normalizedRoute = route.replace(/\/$/, '') || '/';
  const fullUrl = `${SITE_BASE_URL}${normalizedRoute.replace(/^\//, '')}`;

  // 基礎數據
  const jsonLd: Record<string, unknown>[] = [...BASE_JSON_LD];

  // 根據路由添加特定的 schema
  switch (normalizedRoute) {
    case '/':
    case '':
      jsonLd.push(
        buildBreadcrumbSchema([{ name: '首頁', url: SITE_BASE_URL }]),
        buildImageObjectSchema('og-image.png'),
      );
      break;

    case '/about':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '關於', url: `${SITE_BASE_URL}about` },
        ]),
        buildImageObjectSchema('og-image.png'),
      );
      break;

    case '/guide':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '使用指南', url: `${SITE_BASE_URL}guide` },
        ]),
        buildHowToSchema(),
        buildImageObjectSchema('og-image.png'),
      );
      break;

    case '/faq':
      // [fix:2025-12-06] 添加 FAQPage schema，提升 Google Rich Snippets 顯示率
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '常見問題', url: `${SITE_BASE_URL}faq` },
        ]),
        buildFaqSchema(FAQ_DATA, fullUrl),
        buildImageObjectSchema('og-image.png'),
      );
      break;

    case '/history':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '歷史專區', url: `${SITE_BASE_URL}history` },
        ]),
        buildArticleSchema(
          {
            headline: '台灣歷史專區 - 皇民化運動與改姓歷史',
            description: '深入了解台灣日治時期的皇民化運動、馬關條約、舊金山和約等重要歷史事件',
            datePublished: '2025-12-04',
            dateModified: buildTime.split('T')[0] || '2025-12-04',
            keywords: ['皇民化運動', '馬關條約', '舊金山和約', '台灣歷史', '日治時期'],
          },
          fullUrl,
        ),
        buildImageObjectSchema('og-image.png'),
      );
      break;

    case '/history/kominka':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '歷史專區', url: `${SITE_BASE_URL}history` },
          { name: '皇民化運動', url: `${SITE_BASE_URL}history/kominka` },
        ]),
        buildArticleSchema(
          {
            headline: '皇民化運動 - 1937-1945 台灣同化政策',
            description: '詳細介紹日本殖民時期對台灣實施的皇民化運動，包括改姓名、國語運動等政策',
            datePublished: '2025-12-04',
            dateModified: buildTime.split('T')[0] || '2025-12-04',
            keywords: ['皇民化運動', '改姓名運動', '國語運動', '台灣日治時期', '1940年代'],
          },
          fullUrl,
        ),
        buildImageObjectSchema('og-image.png'),
      );
      break;

    case '/history/shimonoseki':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '歷史專區', url: `${SITE_BASE_URL}history` },
          { name: '馬關條約', url: `${SITE_BASE_URL}history/shimonoseki` },
        ]),
        buildArticleSchema(
          {
            headline: '馬關條約 - 1895 台灣割讓日本',
            description: '介紹甲午戰爭後簽訂的馬關條約，以及台灣被割讓給日本的歷史背景',
            datePublished: '2025-12-04',
            dateModified: buildTime.split('T')[0] || '2025-12-04',
            keywords: ['馬關條約', '甲午戰爭', '台灣割讓', '1895年', '清日戰爭'],
          },
          fullUrl,
        ),
        buildImageObjectSchema('og-image.png'),
      );
      break;

    case '/history/san-francisco':
      jsonLd.push(
        buildBreadcrumbSchema([
          { name: '首頁', url: SITE_BASE_URL },
          { name: '歷史專區', url: `${SITE_BASE_URL}history` },
          { name: '舊金山和約', url: `${SITE_BASE_URL}history/san-francisco` },
        ]),
        buildArticleSchema(
          {
            headline: '舊金山和約 - 1951 台灣主權歸屬',
            description: '介紹二戰後簽訂的舊金山和約，以及台灣主權歸屬的國際法爭議',
            datePublished: '2025-12-04',
            dateModified: buildTime.split('T')[0] || '2025-12-04',
            keywords: ['舊金山和約', '台灣主權', '二戰後', '1951年', '國際法'],
          },
          fullUrl,
        ),
        buildImageObjectSchema('og-image.png'),
      );
      break;

    default:
      // 未知路由使用預設 breadcrumb + ImageObject
      jsonLd.push(
        buildBreadcrumbSchema([{ name: '首頁', url: SITE_BASE_URL }]),
        buildImageObjectSchema('og-image.png'),
      );
  }

  return jsonLd;
}

/**
 * 將 JSON-LD 數據轉換為 HTML script 標籤
 */
export function jsonLdToScriptTags(jsonLd: Record<string, unknown>[]): string {
  return jsonLd
    .map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`)
    .join('\n');
}
