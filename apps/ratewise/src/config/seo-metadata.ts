import { CURRENCY_DEFINITIONS, SUPPORTED_CURRENCY_COUNT } from '../features/ratewise/constants';
import { APP_INFO, SEO_SOCIAL_LINKS } from './app-info';
import { SHARE_IMAGE, TWITTER_IMAGE, normalizeSiteUrl } from './seo-paths';

export interface AlternateLink {
  hrefLang: string;
  href: string;
}

export interface FAQEntry {
  question: string;
  answer: string;
}

export interface HowToStep {
  position: number;
  name: string;
  text: string;
  image?: string;
}

export interface HowToData {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string;
}

export interface BreadcrumbItem {
  name: string;
  item: string;
}

export type JsonLdBlock = Record<string, unknown>;

export interface SEOPageMetadata {
  title?: string;
  description: string;
  pathname: string;
  ogType?: 'website' | 'article';
  jsonLd?: JsonLdBlock | JsonLdBlock[];
  locale?: string;
  alternates?: AlternateLink[];
  keywords?: string[];
  updatedTime?: string;
  faq?: FAQEntry[];
  howTo?: HowToData;
  breadcrumb?: BreadcrumbItem[];
  robots?: string;
}

export interface HomepageQuickLink {
  href: string;
  label: string;
}

export interface HomepageContent {
  eyebrow: string;
  heading: string;
  intro: string;
  highlights: string[];
  quickLinks: HomepageQuickLink[];
}

export interface AuthorityGuideSection {
  title: string;
  paragraphs: string[];
}

export interface AuthorityGuideContent extends SEOPageMetadata {
  heading: string;
  intro: string;
  highlights: string[];
  sections: AuthorityGuideSection[];
  ctaTitle: string;
  ctaDescription: string;
}

export interface CommonAmountEntry {
  amount: number;
  label: string;
  question: string;
}

export interface CurrencyLandingPageContent {
  currencyCode: string;
  currencyFlag: string;
  currencyName: string;
  title: string;
  description: string;
  pathname: string;
  canonical: string;
  keywords: string[];
  faqEntries: FAQEntry[];
  howToSteps: HowToStep[];
  highlights: string[];
  faqTitle: string;
  commonAmounts: CommonAmountEntry[];
  travelTip: string;
  jsonLd: JsonLdBlock[];
}

const sanitizeBaseUrl = (value: string) => value.replace(/\/+$/, '');
const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);
const ensureTrailingSlash = (value: string) => (value.endsWith('/') ? value : `${value}/`);
const SITE_BASE_URL = ensureTrailingSlash(
  sanitizeBaseUrl(normalizeSiteUrl(import.meta.env.VITE_SITE_URL ?? APP_INFO.siteUrl)),
);
const BUILD_TIME = import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString();
const ASSET_VERSION = `v=${BUILD_TIME.replace(/[-T:Z.]/g, '').slice(0, 8) || 'dev'}`;

export const DEFAULT_LOCALE = 'zh-TW' as const;
export const OG_IMAGE_ALT = `${APP_INFO.name} 匯率轉換器分享圖片` as const;
export const DEFAULT_TITLE =
  'RateWise 匯率好工具 — 台灣最精準匯率換算器 | 顯示實際買賣價，不用中間價';
export const DEFAULT_DESCRIPTION = `RateWise 顯示臺灣銀行牌告的實際買入賣出價，而非中間價，讓你換匯前就知道真正要付多少台幣。支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣、現金與即期匯率切換、計算機快速輸入、收藏拖曳排序與 7~30 天趨勢圖，每 5 分鐘同步，離線也可使用。`;
export const DEFAULT_KEYWORDS = [
  '匯率好工具',
  'RateWise',
  '匯率工具',
  '匯率換算',
  '即時匯率',
  '台幣匯率',
  'TWD匯率',
  'USD匯率',
  '外幣兌換',
  '匯率查詢',
  '臺灣銀行匯率',
  '台灣匯率',
  '美金匯率',
  '日幣匯率',
  '歐元匯率',
  '線上匯率',
  '匯率計算機',
  '匯率轉換器',
  '貨幣換算',
  '台幣換算',
  '台銀匯率',
  '現金匯率',
  '即期匯率',
  '賣出匯率',
  '買入匯率',
  '換匯計算',
  '旅遊換匯',
  'exchange rate',
  'currency converter',
  'Taiwan bank exchange rate',
] as const;

export const SITE_SEO = {
  baseUrl: SITE_BASE_URL,
  locale: DEFAULT_LOCALE,
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  keywords: [...DEFAULT_KEYWORDS],
  ogImage: SHARE_IMAGE,
  twitterImage: TWITTER_IMAGE,
  socialLinks: [...SEO_SOCIAL_LINKS],
  updatedTime: BUILD_TIME,
  application: {
    category: 'FinanceApplication',
    browserRequirements: 'Requires JavaScript',
    featureList: [
      '顯示實際買賣價（非中間價）——換匯金額更精準',
      '即時匯率查詢（臺灣銀行牌告匯率）',
      '現金與即期匯率切換（適合不同換匯情境）',
      '單幣別精準換算',
      '多幣別同時比較',
      '計算機鍵盤快速輸入',
      '快速金額按鈕',
      '收藏常用貨幣',
      '拖曳排序自訂幣別順序',
      '換算歷史記錄',
      '7~30 天歷史匯率趨勢圖',
      '6 種主題風格',
      '3 語言支援（繁中／英／日）',
      '下拉更新即時同步',
      '離線使用（PWA）',
      `${SUPPORTED_CURRENCY_COUNT} 種貨幣支援`,
    ],
  },
} as const;

export function buildCanonicalUrl(pathname?: string): string {
  if (!pathname || pathname === '/') return SITE_BASE_URL;
  if (/^https?:\/\//i.test(pathname)) {
    return ensureTrailingSlash(sanitizeBaseUrl(pathname));
  }
  const normalizedPath = `${ensureLeadingSlash(pathname).replace(/\/+$/, '')}/`;
  return `${SITE_BASE_URL}${normalizedPath.replace(/^\//, '')}`;
}

export function withAssetVersion(url: string): string {
  return url.includes('?') ? `${url}&${ASSET_VERSION}` : `${url}?${ASSET_VERSION}`;
}

export function buildAbsoluteAssetUrl(pathname: string): string {
  const absolute = pathname.startsWith('http')
    ? pathname
    : `${SITE_BASE_URL}${pathname.replace(/^\//, '')}`;
  return withAssetVersion(absolute);
}

export function buildSiteJsonLd(): JsonLdBlock[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: APP_INFO.name,
      alternateName: APP_INFO.subtitle,
      description: SITE_SEO.description,
      url: SITE_BASE_URL,
      applicationCategory: SITE_SEO.application.category,
      operatingSystem: 'Any',
      browserRequirements: SITE_SEO.application.browserRequirements,
      datePublished: `${APP_INFO.copyrightStartYear}-01-01`,
      dateModified: BUILD_TIME,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: SITE_SEO.application.featureList,
      inLanguage: SITE_SEO.locale,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: APP_INFO.author,
      url: SITE_BASE_URL,
      foundingDate: String(APP_INFO.copyrightStartYear),
      logo: buildAbsoluteAssetUrl('/icons/ratewise-icon-512x512.png'),
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Support',
        email: APP_INFO.email,
      },
      sameAs: SITE_SEO.socialLinks,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: APP_INFO.name,
      url: SITE_BASE_URL,
      inLanguage: SITE_SEO.locale,
      dateModified: BUILD_TIME,
    },
  ];
}

export function buildShareImageJsonLd(name: string, description: string): JsonLdBlock {
  const imageUrl = buildAbsoluteAssetUrl(SITE_SEO.ogImage);
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: imageUrl,
    url: imageUrl,
    width: '1200',
    height: '630',
    encodingFormat: 'image/jpeg',
    name,
    description,
    creator: {
      '@type': 'Organization',
      name: APP_INFO.author,
      url: APP_INFO.organizationUrl,
    },
    copyrightHolder: {
      '@type': 'Organization',
      name: APP_INFO.author,
    },
    copyrightNotice: `© ${new Date(BUILD_TIME).getUTCFullYear() || 2026} ${APP_INFO.author}`,
    creditText: APP_INFO.author,
  };
}

export const HOMEPAGE_FAQ = [
  {
    question: 'RateWise 和其他匯率工具有什麼不同？',
    answer:
      '多數匯率工具顯示「中間價」（買賣均值），並非銀行實際換匯報價。RateWise 直接顯示臺灣銀行牌告的現金與即期買賣四種報價，讓您換匯前就知道真正要付多少台幣。以日圓為例，中間價與賣出價差約 1～3%，換 10 萬日圓大約差 1,500～3,000 元台幣。',
  },
  {
    question: '支援哪些貨幣？',
    answer: `支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣，包括 TWD、USD、JPY、EUR、GBP、HKD、CNY、KRW、AUD、CAD、SGD 等，可收藏常用貨幣並以拖曳排序自訂順序。`,
  },
  {
    question: '可以離線使用嗎？',
    answer: '可以。PWA 首次開啟會快取資源與最近匯率，離線時仍可用上次更新的數據進行換算。',
  },
  {
    question: '匯率多久更新一次？',
    answer:
      '匯率數據每 5 分鐘自動同步臺灣銀行最新牌告匯率，畫面會顯示最近更新時間。您也可以在首頁下拉重新整理以手動同步。',
  },
  {
    question: '單幣別和多幣別模式有什麼差別？',
    answer:
      '單幣別模式適合精準換算一組貨幣對，可查看詳細買賣價與趨勢圖。多幣別模式可同時查看一個基準貨幣對所有支援貨幣的即時換算結果，適合旅遊前快速比價。',
  },
  {
    question: '支援哪些介面語言？',
    answer: '支援繁體中文、English 與日本語三種介面語言，可在設定頁面中切換。',
  },
  {
    question: '有哪些主題風格可選？',
    answer:
      '提供 6 種主題風格：Zen（極簡專業）、Nitro（深色科技）、Kawaii（可愛粉嫩）、Classic（復古書卷）、Ocean（海洋深邃）、Forest（自然森林），可在設定頁面中切換。',
  },
  {
    question: '什麼是現金匯率和即期匯率？',
    answer:
      '現金匯率適用於臨櫃換鈔，即期匯率適用於匯款與帳戶轉帳。RateWise 同時提供兩種匯率，您可依換匯情境一鍵切換，方便比較差異。',
  },
] as const satisfies readonly FAQEntry[];

export const HOMEPAGE_HOW_TO: HowToData = {
  name: '如何使用 RateWise 進行匯率換算',
  description: '四步驟完成即時匯率換算，支援計算機快速輸入、收藏管理與歷史趨勢查看。',
  totalTime: 'PT30S',
  steps: [
    {
      position: 1,
      name: '選擇貨幣',
      text: `從下拉選單選擇來源貨幣與目標貨幣，支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣，可收藏常用幣別以便快速存取。`,
    },
    {
      position: 2,
      name: '輸入金額',
      text: '在輸入框直接輸入或展開計算機鍵盤快速輸入金額，也可使用快速金額按鈕一鍵帶入常用數字。',
    },
    {
      position: 3,
      name: '查看結果與趨勢',
      text: '換算結果即時顯示，可展開查看 7~30 天歷史趨勢圖，並切換現金或即期匯率以符合不同換匯情境。',
    },
    {
      position: 4,
      name: '管理與個人化',
      text: '在收藏頁面透過拖曳手柄調整貨幣順序、管理收藏清單與查看換算歷史記錄，並在設定頁面切換 6 種主題風格與 3 種介面語言。',
    },
  ],
};

export const HOMEPAGE_SEO = {
  description: SITE_SEO.description,
  pathname: '/',
  keywords: [...SITE_SEO.keywords],
  faq: [...HOMEPAGE_FAQ],
  howTo: HOMEPAGE_HOW_TO,
  jsonLd: [buildShareImageJsonLd(OG_IMAGE_ALT, `${APP_INFO.name} 首頁匯率換算與趨勢功能預覽`)],
  content: {
    eyebrow: '臺灣銀行牌告匯率 · 每 5 分鐘同步 · 顯示實際買賣價',
    heading: 'RateWise 即時匯率換算',
    intro: `顯示臺灣銀行牌告的實際買入賣出價（不是中間價），讓你換匯前就知道真正要付多少台幣。支援台幣、美元、日圓、韓元、歐元等 ${SUPPORTED_CURRENCY_COUNT} 種貨幣，每 5 分鐘自動同步，適合出國旅遊、海外付款與跨境報價前快速比價。`,
    highlights: [
      '顯示實際買賣價：臺灣銀行牌告匯率的現金與即期買入賣出四種報價，不是中間價——換匯金額更精準。',
      `支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣，提供計算機快速輸入、收藏管理、拖曳排序與換算歷史。`,
      '6 種主題風格、3 語言介面（繁中／英／日），PWA 可離線使用，重新連線自動同步。',
    ],
    quickLinks: [
      { href: '/usd-twd/', label: 'USD/TWD 匯率' },
      { href: '/sell-rate-vs-mid-rate/', label: '賣出價指南' },
      { href: '/faq/', label: '常見問題' },
      { href: '/guide/', label: '使用指南' },
    ],
  },
} as const satisfies SEOPageMetadata & { content: HomepageContent };

export const FAQ_PAGE_ENTRIES = [
  {
    question: '什麼是 RateWise 匯率好工具？',
    answer: `RateWise 是基於臺灣銀行牌告匯率的即時匯率 PWA 應用，支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣換算，提供單幣別與多幣別模式、計算機鍵盤快速輸入、收藏管理、拖曳排序、換算歷史紀錄與 7~30 天匯率趨勢圖。`,
  },
  {
    question: '匯率數據來源是什麼？',
    answer:
      'RateWise 的匯率資料來源為臺灣銀行官方牌告匯率，每 5 分鐘自動同步一次，涵蓋現金與即期買入賣出價四種報價。',
  },
  {
    question: '現金匯率和即期匯率有什麼差別？',
    answer:
      '現金匯率適用於臨櫃或現鈔兌換，即期匯率適用於匯款與帳戶間轉帳。現金匯率通常比即期匯率差，因為銀行有現鈔保管與運送成本。RateWise 提供兩種匯率切換功能，方便依情境選擇。',
  },
  {
    question: '買入和賣出匯率怎麼看？',
    answer:
      '買入與賣出是站在銀行角度。您拿外幣換回台幣，看「買入」價格；您拿台幣買外幣，看「賣出」價格。RateWise 單幣別模式預設顯示銀行賣出價（您買外幣的價格），可自行切換。',
  },
  {
    question: '如何使用計算機鍵盤？',
    answer:
      '在金額輸入框點擊即可開啟底部計算機鍵盤，採用 iOS 標準按鍵配置，支援加減乘除、百分比、正負號切換與退格。也可使用實體鍵盤直接輸入，單幣別與多幣別模式皆可使用。',
  },
  {
    question: '快速金額按鈕有哪些？',
    answer:
      'RateWise 依據各國旅遊與消費習慣提供常用金額按鈕。例如台幣預設 100~5,000、日圓 1,000~30,000、韓元 10,000~300,000、美元 10~500，點擊即可一鍵帶入。',
  },
  {
    question: '如何使用多幣別換算功能？',
    answer:
      '切換到多幣別模式後，可同時查看一個基準貨幣對所有支援貨幣的即時換算結果。點擊任一貨幣即可設為新的基準貨幣，每個貨幣可獨立切換現金或即期匯率。',
  },
  {
    question: '如何收藏貨幣與拖曳排序？',
    answer:
      '點擊貨幣旁的星號圖示即可收藏或取消收藏。在收藏頁面的「所有貨幣」列表中，透過拖曳手柄可重新排列貨幣順序，拖曳未收藏的貨幣會自動加入收藏，排序結果會自動儲存。',
  },
  {
    question: '換算歷史記錄如何運作？',
    answer:
      '每次換算結果會自動記錄在收藏頁面的「歷史記錄」分頁中。單擊可複製結果到剪貼簿，雙擊或長按可重新載入該組換算，也可一鍵清除全部歷史。',
  },
  {
    question: '匯率更新頻率如何？',
    answer:
      '匯率數據每 5 分鐘自動更新一次，畫面會顯示最近更新時間。您也可以在首頁下拉重新整理（Pull to Refresh）以手動同步最新牌告資料。',
  },
  {
    question: '如何安裝 RateWise 到手機桌面？',
    answer:
      'iPhone 可在 Safari 點選分享後加入主畫面，Android 可在 Chrome 選擇安裝應用程式或加到主畫面。安裝後可像原生 App 一樣從桌面直接開啟。',
  },
  {
    question: 'RateWise 免費嗎？',
    answer:
      'RateWise 完全免費、無廣告、無付費牆，不要求註冊帳號。所有功能（包含計算機、收藏、歷史記錄、主題切換等）皆開放使用。',
  },
  {
    question: '匯率換算結果準確嗎？',
    answer:
      '換算結果基於臺灣銀行官方牌告匯率，但實際交易匯率仍可能因金融機構、交易平台與手續費產生差異，僅供參考，實際交易前請以交易方公告為準。',
  },
  {
    question: '可以查看歷史匯率嗎？',
    answer:
      '可以。RateWise 提供 7 到 30 天歷史匯率趨勢圖，幫助您觀察匯率波動趨勢並挑選較合適的換匯時機。',
  },
  {
    question: '刷卡匯率跟台銀牌告匯率一樣嗎？',
    answer:
      '不一樣。刷卡匯率由發卡組織（Visa、Mastercard）決定清算匯率，再加上發卡銀行的海外手續費，與臺灣銀行牌告匯率是不同體系。RateWise 目前提供的是台銀牌告匯率（現金與即期），適用於臨櫃換匯與匯款場景。',
  },
  {
    question: '去韓國前要先換多少韓幣？',
    answer:
      '建議依行程天數與消費規劃決定。可在 RateWise 使用韓元快速金額按鈕（10,000~300,000 韓元）估算所需台幣金額。提醒：韓國多數店家接受刷卡，建議準備部分現金搭配信用卡使用。',
  },
  {
    question: '下拉更新是什麼功能？',
    answer:
      '在首頁向下拉動畫面超過一定距離，即可觸發匯率資料重新載入，同步臺灣銀行最新牌告匯率。此功能模擬原生 App 的「Pull to Refresh」操作體驗。',
  },
  {
    question: '什麼是 DCC（動態貨幣轉換）？為什麼要拒絕？',
    answer:
      'DCC（動態貨幣轉換）是商家刷卡時提供「以台幣結帳」的選項，但匯率通常比卡組織清算匯率差 3~5%。建議選「以當地貨幣結帳」，讓發卡行套用較優的卡組織匯率計算費用。',
  },
  {
    question: '我要換外幣應該看哪個匯率？',
    answer:
      '依您的換匯情境決定：臨櫃換鈔看「現金賣出」價格，外幣帳戶線上換匯看「即期賣出」價格。若您要把外幣換回台幣，則分別看「現金買入」或「即期買入」。RateWise 支援一鍵切換現金與即期匯率，幫助您快速比較。',
  },
  {
    question: '刷卡匯率怎麼計算？',
    answer:
      '海外刷卡費用 = 卡組織清算匯率（Visa/Mastercard）+ 銀行海外手續費（約 1.5%）+ 若選 DCC 則再加商家匯差。三者合計，與台銀牌告匯率屬不同體系，RateWise 提供的是台銀牌告匯率。',
  },
  {
    question: '現金匯率為什麼比即期匯率差？',
    answer:
      '銀行持有實體外幣需要保管、運送、保險與偽鈔鑑定成本，這些成本反映在現金匯率的價差（買入與賣出價之間的差距）上。即期匯率是電子帳面轉帳，成本較低，因此通常比現金匯率更優。',
  },
] as const satisfies readonly FAQEntry[];

export const FAQ_PAGE_SEO = {
  title: '常見問題 - RateWise 匯率工具完整 FAQ 解答',
  description:
    'RateWise 匯率好工具完整 FAQ：匯率來源、現金與即期差別、買入賣出怎麼看、DCC 動態貨幣轉換、刷卡匯率計算、計算機與快速金額、收藏排序、多幣別模式、歷史趨勢、主題切換、離線使用與安裝教學。',
  pathname: '/faq',
  breadcrumb: [
    { name: 'RateWise 首頁', item: '/' },
    { name: '常見問題', item: '/faq/' },
  ],
  faq: [...FAQ_PAGE_ENTRIES],
} as const satisfies SEOPageMetadata;

export const GUIDE_HOW_TO_STEPS = [
  {
    position: 1,
    name: '開啟 RateWise',
    text: '在瀏覽器中開啟 RateWise 匯率好工具，或將其加入手機主畫面作為 PWA 應用程式使用。',
    image: '/screenshots/step1-open-app.png',
  },
  {
    position: 2,
    name: '選擇換算模式',
    text: '在頁面頂部選擇單幣別或多幣別換算模式，依需求查看一對一或一對多的匯率結果。',
    image: '/screenshots/step2-select-mode.png',
  },
  {
    position: 3,
    name: '選擇原始貨幣',
    text: '在從欄位選擇您要兌換的貨幣，例如 TWD 台幣。',
    image: '/screenshots/step3-select-from.png',
  },
  {
    position: 4,
    name: '選擇目標貨幣',
    text: '在到欄位選擇您要兌換成的貨幣，例如 USD 美元或 JPY 日圓。',
    image: '/screenshots/step4-select-to.png',
  },
  {
    position: 5,
    name: '輸入金額',
    text: '輸入欲換算金額，或使用快速金額按鈕，系統會即時計算並顯示結果。',
    image: '/screenshots/step5-enter-amount.png',
  },
  {
    position: 6,
    name: '選擇匯率類型',
    text: '依換匯情境切換現金匯率或即期匯率。',
    image: '/screenshots/step6-rate-type.png',
  },
  {
    position: 7,
    name: '查看歷史趨勢',
    text: '展開匯率卡片可查看過去 30 天的歷史趨勢圖與波動資訊。',
    image: '/screenshots/step7-trend-chart.png',
  },
  {
    position: 8,
    name: '收藏常用貨幣',
    text: '點擊星號圖示收藏常用貨幣，方便未來快速存取。',
    image: '/screenshots/step8-favorites.png',
  },
] as const satisfies readonly HowToStep[];

export const GUIDE_PAGE_SEO = {
  title: '使用指南 - 如何使用 RateWise 進行匯率換算',
  description:
    '完整 8 步驟教學，快速學會使用 RateWise 進行單幣別和多幣別匯率換算，包含匯率類型切換、歷史趨勢查看與收藏功能。',
  pathname: '/guide',
  breadcrumb: [
    { name: 'RateWise 首頁', item: '/' },
    { name: '使用教學', item: '/guide/' },
  ],
  howTo: {
    name: '如何使用 RateWise 進行匯率換算',
    description: '完整 8 步驟教學，快速學會使用 RateWise 進行單幣別與多幣別匯率換算。',
    totalTime: 'PT2M',
    steps: [...GUIDE_HOW_TO_STEPS],
  },
  jsonLd: [buildShareImageJsonLd('RateWise 使用指南分享圖片', 'RateWise 使用指南與換算步驟預覽')],
} as const satisfies SEOPageMetadata;

export const ABOUT_PAGE_FAQ = [
  {
    question: 'RateWise 匯率數據來源是什麼？',
    answer:
      '資料來源為臺灣銀行官方牌告匯率，每 5 分鐘自動同步，涵蓋現金買入、現金賣出、即期買入、即期賣出四種報價。',
  },
  {
    question: 'RateWise 是免費的嗎？需要帳號或有廣告嗎？',
    answer:
      '完全免費、無廣告、無付費功能，不需要建立帳號。計算機、收藏、歷史記錄、主題風格等所有功能皆可直接使用。',
  },
  {
    question: 'RateWise 和一般匯率 App 有什麼不同？',
    answer:
      '一般工具顯示中間價（買賣均值），RateWise 顯示臺灣銀行牌告的實際現金與即期四種報價，讓您換匯前就知道真正要付多少台幣。',
  },
  {
    question: '如何聯絡 RateWise 開發者？',
    answer:
      '可透過 Email（haotool.org@gmail.com）聯繫，歡迎回饋意見或錯誤回報，也可在 GitHub（github.com/haotool/app）查看原始碼或提交 Issue。',
  },
] as const satisfies readonly FAQEntry[];

export const ABOUT_PAGE_SEO = {
  title: '關於 RateWise 匯率好工具 - 資料來源與技術特色',
  description: `RateWise 是專為台灣用戶設計的即時匯率 PWA 工具，資料來源為臺灣銀行官方牌告匯率，支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣換算與離線使用。`,
  pathname: '/about',
  breadcrumb: [
    { name: 'RateWise 首頁', item: '/' },
    { name: '關於我們', item: '/about/' },
  ],
  faq: [...ABOUT_PAGE_FAQ],
} as const satisfies SEOPageMetadata;

export const SELL_RATE_VS_MID_RATE_PAGE = {
  title: '賣出價與中間價差在哪？為什麼換匯不能只看中間價',
  description:
    '解析賣出價、中間價與實際換匯成本差異。RateWise 聚焦臺灣銀行牌告賣出價，協助台灣用戶在買外幣前估算更接近實際支付的台幣金額。',
  pathname: '/sell-rate-vs-mid-rate',
  breadcrumb: [
    { name: 'RateWise 首頁', item: '/' },
    { name: '賣出價與中間價差異', item: '/sell-rate-vs-mid-rate/' },
  ],
  heading: '賣出價比中間價更接近你真正要付的台幣',
  intro:
    '多數匯率網站與金融 App 主打中間價，適合用來觀察市場方向，但不等於你去銀行買外幣時的實際成本。對台灣使用者來說，真正影響換匯預算的通常是銀行賣出價，尤其是臨櫃換現鈔時的現金賣出價。',
  highlights: [
    '中間價是買入與賣出的平均值，不是銀行實際成交價。',
    '你拿台幣買外幣時，通常要看銀行賣出價。',
    '換匯金額越大，中間價與實際賣出價的差距越明顯。',
  ],
  sections: [
    {
      title: '中間價適合看市場，不適合估實際換匯成本',
      paragraphs: [
        '中間價常見於 Google、XE 或國際金融資訊平台，主要用途是快速比較市場匯率方向。這類價格沒有納入銀行牌告買賣差，也沒有反映現鈔、匯款或手續費情境。',
        '如果你只是想知道最近美元或日圓偏強還是偏弱，中間價有參考價值；但若你的目標是估算「我今天去銀行換 5 萬日圓要付多少台幣」，中間價就會偏樂觀。',
      ],
    },
    {
      title: '買外幣看賣出價，賣外幣看買入價',
      paragraphs: [
        '銀行牌告的買入與賣出是站在銀行角度。你拿台幣買外幣，銀行是在賣外幣給你，所以要看賣出價；你把外幣換回台幣，銀行是在買你的外幣，所以要看買入價。',
        'RateWise 把這個判讀邏輯放在首頁、FAQ 與各幣別頁，目的就是避免使用者只看到漂亮的中間價，卻低估了實際換匯成本。',
      ],
    },
    {
      title: '為什麼台灣用戶更需要賣出價視角',
      paragraphs: [
        '台灣多數匯率需求集中在旅遊換匯、外幣帳戶轉換與海外付款前估算。這些情境都更接近「我要付出多少台幣」，因此賣出價通常比中間價更有決策價值。',
        'RateWise 採用臺灣銀行牌告匯率作為資料來源，讓使用者在同一個介面中比較現金賣出與即期賣出，避免把不同情境混在一起判讀。',
      ],
    },
  ],
  faq: [
    {
      question: '為什麼中間價看起來比較優惠？',
      answer:
        '因為中間價是買入與賣出的平均值，天然會落在兩者之間。它不是銀行實際賣給你的價格，所以看起來通常比實際賣出價更漂亮。',
    },
    {
      question: '拿台幣換外幣時，RateWise 建議看哪個欄位？',
      answer:
        '臨櫃換現鈔看現金賣出，外幣帳戶或網銀換匯看即期賣出。兩者都比中間價更接近你真正會支付的台幣金額。',
    },
    {
      question: '中間價完全沒有參考價值嗎？',
      answer:
        '不是。中間價仍可用來觀察大方向與跨平台比較，但若目標是做換匯決策或估算預算，應優先看銀行牌告的實際賣出或買入價格。',
    },
  ],
  ctaTitle: '直接用實際賣出價換算',
  ctaDescription:
    '回到首頁輸入金額，即可用臺灣銀行牌告的現金賣出或即期賣出估算更接近實際的換匯成本。',
} as const satisfies AuthorityGuideContent;

export const CASH_VS_SPOT_RATE_PAGE = {
  title: '現金匯率 vs 即期匯率：什麼情境該看哪一種',
  description:
    '說明現金匯率與即期匯率差異，整理臨櫃換鈔、外幣帳戶、匯款與旅遊換匯情境，幫助你在 RateWise 正確選擇報價類型。',
  pathname: '/cash-vs-spot-rate',
  breadcrumb: [
    { name: 'RateWise 首頁', item: '/' },
    { name: '現金匯率與即期匯率差異', item: '/cash-vs-spot-rate/' },
  ],
  heading: '現金與即期不是同一種匯率',
  intro:
    '很多人以為銀行只會有一個外幣價格，但實際上臺灣銀行牌告通常至少分成現金匯率與即期匯率。前者對應現鈔交易，後者對應帳戶間轉換與匯款。選錯類型，就會高估或低估實際成本。',
  highlights: [
    '臨櫃換外幣現鈔時，通常看現金匯率。',
    '外幣帳戶轉換、網銀換匯或匯款時，通常看即期匯率。',
    '現金匯率常比即期匯率差，因為包含現鈔成本。',
  ],
  sections: [
    {
      title: '現金匯率反映的是實體鈔券成本',
      paragraphs: [
        '銀行持有外幣現鈔需要保管、運送、清點、保險與防偽流程，這些成本會反映在現金匯率的買賣差之中。',
        '因此，若你是出國前到分行換日圓、韓元或美元現鈔，應優先比較現金賣出，而不是即期賣出或中間價。',
      ],
    },
    {
      title: '即期匯率適用帳戶交易與匯款',
      paragraphs: [
        '即期匯率通常用於外幣帳戶之間的轉換、網銀換匯或電匯場景，因為交易不涉及實體鈔券，所以成本較低，價格通常較佳。',
        '如果你是先在線上買入外幣，再之後提領現鈔，就要另外注意提領手續費與銀行規則，不能直接把即期當作全部成本。',
      ],
    },
    {
      title: 'RateWise 為什麼要同時顯示兩種匯率',
      paragraphs: [
        '同一組幣別在不同換匯方式下，成本可能差很多。RateWise 把現金與即期匯率分開顯示，讓你在同一頁面內對照情境，而不是只給一個模糊的單一價格。',
        '對旅遊用戶來說，這能避免出發前看錯欄位；對跨境付款或外幣帳戶使用者來說，也能更精準抓到匯款與換匯成本。',
      ],
    },
  ],
  faq: [
    {
      question: '臨櫃換外幣要看現金還是即期？',
      answer: '臨櫃換現鈔通常看現金賣出；若是把外幣現鈔換回台幣，則看現金買入。',
    },
    {
      question: '網銀外幣帳戶換匯看哪個價格？',
      answer: '通常看即期匯率。你拿台幣換外幣看即期賣出，把外幣換回台幣看即期買入。',
    },
    {
      question: '為什麼現金匯率常比即期差？',
      answer:
        '因為現鈔交易涉及保管、運送、保險與作業成本，銀行會把這些成本反映在現金匯率的價差裡。',
    },
  ],
  ctaTitle: '依情境切換正確匯率類型',
  ctaDescription: '回到首頁後可直接切換現金與即期匯率，比較同一筆金額在不同換匯方式下的成本差異。',
} as const satisfies AuthorityGuideContent;

export const CARD_RATE_GUIDE_PAGE = {
  title: '刷卡匯率怎麼看？台銀牌告、卡組織匯率與 DCC 一次搞懂',
  description:
    '整理海外刷卡匯率的組成方式，說明 Visa、Mastercard 清算匯率、銀行海外手續費與 DCC 差異，幫助你正確理解 RateWise 與刷卡成本的關係。',
  pathname: '/card-rate-guide',
  breadcrumb: [
    { name: 'RateWise 首頁', item: '/' },
    { name: '刷卡匯率與 DCC 指南', item: '/card-rate-guide/' },
  ],
  heading: '刷卡匯率不是台銀牌告，但台銀賣出價仍很有參考價值',
  intro:
    '海外刷卡走的是卡組織清算匯率，再加上發卡銀行的海外手續費，與臺灣銀行牌告匯率不是同一套系統。不過，台銀賣出價仍可作為你估算海外消費成本與現金換匯成本的基準參考。',
  highlights: [
    '海外刷卡主要看卡組織清算匯率與銀行手續費。',
    'DCC 以台幣結帳通常較差，常比當地貨幣結帳貴。',
    'RateWise 適合估算台銀牌告情境，也能作為刷卡成本的基準比較。',
  ],
  sections: [
    {
      title: '刷卡金額通常由三段成本構成',
      paragraphs: [
        '第一段是 Visa、Mastercard 等卡組織在清算日時套用的匯率；第二段是發卡銀行加收的海外交易手續費；第三段若選擇 DCC，還會多一層商家或收單機構的匯差。',
        '這也是為什麼同樣一筆海外消費，刷卡金額與銀行牌告現金賣出價不會完全一致，但兩者仍能形成很有用的比較基準。',
      ],
    },
    {
      title: '為什麼 DCC 常讓實際成本更高',
      paragraphs: [
        'DCC（Dynamic Currency Conversion）是在商家端直接把當地貨幣轉成台幣請你結帳。看似方便，但轉換匯率多半比卡組織的清算匯率差，等於先被商家端換一次匯。',
        '多數情況下，選擇當地貨幣結帳，再讓發卡銀行與卡組織完成清算，通常會比直接用台幣結帳更有利。',
      ],
    },
    {
      title: 'RateWise 在刷卡情境中的正確用法',
      paragraphs: [
        'RateWise 目前顯示的是臺灣銀行牌告匯率，因此更適合臨櫃換鈔、外幣帳戶換匯與匯款前估算。',
        '若你要估刷卡成本，可把台銀賣出價當成保守基準，額外再加上發卡銀行海外手續費，並避免 DCC。這樣通常比只看中間價更接近真實支出。',
      ],
    },
  ],
  faq: [
    {
      question: '海外刷卡時應該選台幣還是當地貨幣？',
      answer:
        '多數情況下建議選當地貨幣，避免 DCC 額外匯差。讓卡組織與發卡銀行處理清算，通常會比商家直接換成台幣更有利。',
    },
    {
      question: 'RateWise 可以直接算出刷卡最終扣款金額嗎？',
      answer:
        'RateWise 目前提供的是臺灣銀行牌告匯率，無法直接反映各銀行卡片的清算日期與海外手續費，但可作為估算與比較基準。',
    },
    {
      question: '為什麼刷卡匯率和銀行現金賣出價不一樣？',
      answer:
        '因為兩者是不同體系。刷卡走卡組織清算與銀行手續費，現金賣出價則是銀行對外販售現鈔的牌告價格。',
    },
  ],
  ctaTitle: '先用牌告賣出價估算，再留意刷卡費用',
  ctaDescription:
    '回到首頁輸入金額，可先用台銀牌告價格抓基準，再把發卡銀行海外手續費納入最終預算判斷。',
} as const satisfies AuthorityGuideContent;

export const PRIVACY_PAGE_SEO = {
  title: '隱私政策 - RateWise 個人資料保護說明',
  description:
    'RateWise 隱私政策說明：本服務不要求註冊，收藏、設定與歷史記錄保存在您的裝置本地；站點營運另使用第三方分析與安全服務處理匿名流量資料。',
  pathname: '/privacy',
  breadcrumb: [
    { name: 'RateWise 首頁', item: '/' },
    { name: '隱私政策', item: '/privacy/' },
  ],
  robots: 'noindex, follow',
} as const satisfies SEOPageMetadata;

export const APP_ONLY_PAGE_SEO = {
  multi: {
    title: `多幣別同時換算 - 一次比較 ${SUPPORTED_CURRENCY_COUNT} 種即時匯率`,
    description:
      'RateWise 多幣別同時換算功能，一次查看所有支援貨幣的即時匯率換算結果，適合旅遊換匯比價與跨境貿易報價。',
    pathname: '/multi',
    robots: 'noindex, follow',
  },
  favorites: {
    title: '收藏貨幣與換算歷史記錄 - 快速存取常用匯率',
    description: 'RateWise 收藏管理與換算歷史記錄頁面，支援快速回到主換算器並重新查看常用貨幣。',
    pathname: '/favorites',
    robots: 'noindex, follow',
  },
  settings: {
    title: '應用程式設定 - 介面風格切換與語言偏好管理',
    description: 'RateWise 設定頁面，提供介面風格、語言偏好與資料管理等應用程式個人化選項。',
    pathname: '/settings',
    robots: 'noindex, follow',
  },
} as const satisfies Record<string, SEOPageMetadata>;

const CURRENCY_PAGE_OVERRIDES = {
  USD: {
    displayName: '美金',
    region: '美國旅遊與海外付款',
    question: '1 USD 等於多少台幣？',
    keyword: '美金換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '美國消費以刷卡為主，建議準備少量現金搭配信用卡。',
    searchQueries: ['100 美金等於多少台幣', '美金匯率', '美元換台幣'],
  },
  JPY: {
    displayName: '日圓',
    region: '日本旅遊換匯',
    question: '1000 JPY 等於多少台幣？',
    keyword: '日圓換台幣',
    popularAmounts: [1000, 3000, 5000, 10000, 30000, 50000, 100000],
    travelTip: '日本許多餐廳與商店仍以現金為主，建議準備充足日圓現鈔。',
    searchQueries: ['1000 日幣等於多少台幣', '日圓匯率', '日幣換台幣'],
  },
  EUR: {
    displayName: '歐元',
    region: '歐洲旅遊與跨境付款',
    question: '1 EUR 等於多少台幣？',
    keyword: '歐元換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '歐洲多數國家接受刷卡，建議備少量歐元現金用於小型商店與市集。',
    searchQueries: ['100 歐元等於多少台幣', '歐元匯率', '歐元換台幣'],
  },
  GBP: {
    displayName: '英鎊',
    region: '英國旅遊換匯',
    question: '1 GBP 等於多少台幣？',
    keyword: '英鎊換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '英國刷卡普及度高，感應支付廣泛。',
    searchQueries: ['100 英鎊等於多少台幣', '英鎊匯率', '英鎊換台幣'],
  },
  CNY: {
    displayName: '人民幣',
    region: '人民幣付款與報價',
    question: '1 CNY 等於多少台幣？',
    keyword: '人民幣換台幣',
    popularAmounts: [1, 100, 500, 1000, 5000, 10000],
    travelTip: '中國大陸以行動支付為主，建議準備小額現金備用。',
    searchQueries: ['100 人民幣等於多少台幣', '人民幣匯率', '人民幣換台幣'],
  },
  KRW: {
    displayName: '韓元',
    region: '韓國旅遊換匯',
    question: '1000 KRW 等於多少台幣？',
    keyword: '韓元換台幣',
    popularAmounts: [1000, 5000, 10000, 50000, 100000, 300000, 500000],
    travelTip: '韓國多數店家接受刷卡，但夜市與小吃攤建議準備現金。',
    searchQueries: ['50000 韓元多少台幣', '一萬韓元多少台幣', '韓幣換台幣'],
  },
  HKD: {
    displayName: '港幣',
    region: '香港旅遊換匯',
    question: '1 HKD 等於多少台幣？',
    keyword: '港幣換台幣',
    popularAmounts: [1, 100, 500, 1000, 5000, 10000],
    travelTip: '香港八達通卡適用於交通與便利商店，其餘可刷卡或付現。',
    searchQueries: ['100 港幣等於多少台幣', '港幣匯率', '港幣換台幣'],
  },
  AUD: {
    displayName: '澳幣',
    region: '澳洲旅遊與留學換匯',
    question: '1 AUD 等於多少台幣？',
    keyword: '澳幣換台幣',
    popularAmounts: [1, 20, 50, 100, 500, 1000],
    travelTip: '澳洲刷卡非常普遍，感應支付接受度高。',
    searchQueries: ['100 澳幣等於多少台幣', '澳幣匯率', '澳幣換台幣'],
  },
  CAD: {
    displayName: '加幣',
    region: '加拿大旅遊與留學換匯',
    question: '1 CAD 等於多少台幣？',
    keyword: '加幣換台幣',
    popularAmounts: [1, 20, 50, 100, 500, 1000],
    travelTip: '加拿大刷卡普及，建議準備少量現金用於小費。',
    searchQueries: ['100 加幣等於多少台幣', '加幣匯率', '加幣換台幣'],
  },
  SGD: {
    displayName: '新加坡幣',
    region: '新加坡旅遊與商務換匯',
    question: '1 SGD 等於多少台幣？',
    keyword: '新加坡幣換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '新加坡刷卡與行動支付普及，熟食中心建議準備現金。',
    searchQueries: ['100 新加坡幣等於多少台幣', '新幣匯率', '新加坡幣換台幣'],
  },
  THB: {
    displayName: '泰銖',
    region: '泰國旅遊換匯',
    question: '100 THB 等於多少台幣？',
    keyword: '泰銖換台幣',
    popularAmounts: [100, 500, 1000, 3000, 5000, 10000],
    travelTip: '泰國路邊攤、計程車與夜市以現金為主，建議準備充足泰銖。',
    searchQueries: ['1000 泰銖等於多少台幣', '泰銖匯率', '泰銖換台幣'],
  },
  NZD: {
    displayName: '紐元',
    region: '紐西蘭旅遊與留學換匯',
    question: '1 NZD 等於多少台幣？',
    keyword: '紐元換台幣',
    popularAmounts: [1, 20, 50, 100, 500, 1000],
    travelTip: '紐西蘭刷卡普及，但部分戶外活動可能需要現金。',
    searchQueries: ['100 紐元等於多少台幣', '紐元匯率', '紐元換台幣'],
  },
  CHF: {
    displayName: '瑞士法郎',
    region: '瑞士旅遊與跨境付款',
    question: '1 CHF 等於多少台幣？',
    keyword: '瑞士法郎換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '瑞士消費水準高，刷卡普遍，建議備少量法郎現金。',
    searchQueries: ['100 瑞士法郎等於多少台幣', '瑞郎匯率', '瑞士法郎換台幣'],
  },
  VND: {
    displayName: '越南盾',
    region: '越南旅遊換匯',
    question: '100000 VND 等於多少台幣？',
    keyword: '越南盾換台幣',
    popularAmounts: [10000, 50000, 100000, 500000, 1000000, 5000000],
    travelTip:
      '越南以現金為主，建議準備充足越南盾。信用卡在大城市飯店與餐廳可用，但市集與路邊攤需現金。',
    searchQueries: ['100000 越南盾多少台幣', '越南盾匯率', '越南幣換台幣'],
  },
  PHP: {
    displayName: '菲律賓披索',
    region: '菲律賓旅遊換匯',
    question: '1000 PHP 等於多少台幣？',
    keyword: '菲律賓披索換台幣',
    popularAmounts: [100, 500, 1000, 5000, 10000, 50000],
    travelTip: '菲律賓刷卡接受度視地區而異，宿霧與長灘島觀光區較普及，偏遠地區建議準備現金。',
    searchQueries: ['1000 菲律賓披索等於多少台幣', '菲律賓披索匯率', '披索換台幣'],
  },
  IDR: {
    displayName: '印尼盾',
    region: '印尼旅遊換匯',
    question: '100000 IDR 等於多少台幣？',
    keyword: '印尼盾換台幣',
    popularAmounts: [10000, 50000, 100000, 500000, 1000000, 5000000],
    travelTip: '印尼（峇里島）以現金為主，建議在機場或市區換匯所兌換。注意面額較大的紙鈔較受歡迎。',
    searchQueries: ['100000 印尼盾多少台幣', '印尼盾匯率', '印尼盾換台幣'],
  },
  MYR: {
    displayName: '馬來幣',
    region: '馬來西亞旅遊換匯',
    question: '100 MYR 等於多少台幣？',
    keyword: '馬來幣換台幣',
    popularAmounts: [10, 50, 100, 500, 1000, 5000],
    travelTip: '馬來西亞刷卡普及度中等，吉隆坡市區可刷卡，但夜市、熟食中心與小鎮建議準備現金。',
    searchQueries: ['100 馬來幣等於多少台幣', '馬來幣匯率', '馬來西亞幣換台幣'],
  },
} as const;

export type CurrencyLandingCode = keyof typeof CURRENCY_PAGE_OVERRIDES;

function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-TW');
}

export function getCurrencyLandingPageContent(
  code: CurrencyLandingCode,
): CurrencyLandingPageContent {
  const override = CURRENCY_PAGE_OVERRIDES[code];
  const definition = CURRENCY_DEFINITIONS[code];
  const pathname = `/${code.toLowerCase()}-twd`;
  const displayName = override.displayName;

  const commonAmounts: CommonAmountEntry[] = override.popularAmounts.map((amount) => ({
    amount,
    label: `${formatAmount(amount)} ${code}`,
    question: `${formatAmount(amount)} ${displayName}等於多少台幣？`,
  }));

  const canonicalUrl = buildCanonicalUrl(pathname);

  const financialServiceJsonLd: JsonLdBlock = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: `${displayName}兌台幣匯率換算 — ${APP_INFO.name}`,
    description: `即時${displayName}（${code}）兌新台幣（TWD）匯率換算服務，資料來源為臺灣銀行官方牌告匯率，支援現金與即期匯率切換。`,
    url: canonicalUrl,
    serviceType: 'CurrencyExchange',
    dateModified: BUILD_TIME,
    provider: {
      '@type': 'Organization',
      name: APP_INFO.author,
      url: APP_INFO.organizationUrl,
    },
    areaServed: { '@type': 'Country', name: 'Taiwan' },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: canonicalUrl,
      availableLanguage: ['zh-TW', 'en', 'ja'],
    },
    termsOfService: buildCanonicalUrl('/privacy'),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TWD',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${code}/TWD 匯率報價目錄`,
      itemListElement: [
        {
          '@type': 'Offer',
          name: `${displayName}現金賣出匯率`,
          description: `臺灣銀行牌告${displayName}（${code}）現金賣出匯率，適用臨櫃換外幣現鈔`,
        },
        {
          '@type': 'Offer',
          name: `${displayName}即期賣出匯率`,
          description: `臺灣銀行牌告${displayName}（${code}）即期賣出匯率，適用網銀外幣帳戶`,
        },
      ],
    },
  };

  return {
    currencyCode: code,
    currencyFlag: definition.flag,
    currencyName: displayName,
    title: `即時${displayName}匯率 — 台銀實際賣出價 | ${code}/TWD RateWise`,
    description: `台銀實際${displayName}賣出價（非中間價），換匯前先知道要付多少台幣。${override.question}每 5 分鐘更新，支援現金與即期匯率切換、計算機快速輸入。適合${override.region}。`,
    pathname,
    canonical: canonicalUrl,
    keywords: [
      `${code} TWD 匯率`,
      override.keyword,
      `${displayName}匯率`,
      `${displayName}換台幣`,
      ...override.searchQueries,
      '匯率換算',
      APP_INFO.name,
    ],
    jsonLd: [
      financialServiceJsonLd,
      buildShareImageJsonLd(
        `${displayName}兌台幣匯率分享圖片`,
        `${APP_INFO.name} ${code}/TWD 即時匯率換算與趨勢`,
      ),
    ],
    faqEntries: [
      {
        question: `用其他 App 查${displayName}匯率為什麼跟 RateWise 不一樣？`,
        answer: `多數匯率 App 顯示中間價（mid-rate），是買入與賣出的平均值，並非你實際換匯的價格。RateWise 顯示臺灣銀行牌告的「現金賣出」價——你拿台幣去銀行換${displayName}現鈔時，這才是真正要付的金額。中間價通常比實際賣出價優惠 1~3%，換 10 萬日圓大約差 1,500~3,000 元台幣，換匯金額越大差距越明顯。`,
      },
      {
        question: `${displayName}現金賣出和即期賣出有什麼差別？怎麼選？`,
        answer: `「現金賣出」適合臨櫃換外幣現鈔，「即期賣出」適合網銀外幣帳戶轉換或匯款。現金匯率通常比即期差，因為銀行需負擔現鈔的保管、運送與保險成本。出國旅遊前換現金看「現金賣出」，線上外幣轉換看「即期賣出」。`,
      },
      {
        question: override.question,
        answer: `使用 RateWise 可即時查看 ${code} 兌 TWD 最新匯率，資料來源為臺灣銀行牌告匯率，每 5 分鐘自動更新。點擊「開始換算」即可輸入任意金額查看結果。`,
      },
      {
        question: `${displayName}的現金匯率和即期匯率差多少？`,
        answer: `${displayName}現金匯率與即期匯率的價差取決於銀行現鈔保管與運送成本。臨櫃換鈔看「現金」匯率，外幣帳戶匯款看「即期」匯率。RateWise 可一鍵切換 ${code}/TWD 的現金與即期報價，方便比較差異。`,
      },
      {
        question: `台幣買${displayName}和${displayName}換回台幣的匯率一樣嗎？`,
        answer: `不一樣。台幣買${displayName}看銀行「賣出」價格，${displayName}換回台幣看銀行「買入」價格，兩者之間有價差。RateWise 會依照您選擇的 ${code}/TWD 換算方向自動套用正確報價。`,
      },
      {
        question: `去${override.region.replace(/前.*$/, '')}前要準備多少${displayName}？`,
        answer: `${override.travelTip}您可使用 RateWise 的快速金額按鈕（${override.popularAmounts.slice(0, 3).map(formatAmount).join('、')} ${code} 等常用金額）估算所需台幣，並在出發前觀察 7~30 天匯率趨勢選擇換匯時機。`,
      },
      {
        question: `${displayName}匯率最近走勢如何？`,
        answer: `在 RateWise 展開 ${code}/TWD 匯率卡片即可查看 7~30 天歷史趨勢圖，包含最高、最低與平均值，幫助您觀察${displayName}匯率波動並選擇較合適的換匯時機。`,
      },
      {
        question: `${formatAmount(override.popularAmounts.at(-1) ?? 0)} ${displayName}大約等於多少台幣？`,
        answer: `${formatAmount(override.popularAmounts.at(-1) ?? 0)} ${code} 的台幣金額會隨匯率浮動，請使用 RateWise 輸入金額即時查看最新換算結果。資料參考臺灣銀行牌告匯率，每 5 分鐘自動更新。`,
      },
      {
        question: `在台灣哪裡可以換${displayName}？`,
        answer: `臺灣銀行各分行可兌換${displayName}現鈔，也可透過外幣帳戶線上換匯。建議出發前先用 RateWise 比較 ${code}/TWD 現金與即期匯率，選擇最適合的換匯方式。`,
      },
      {
        question: `出國刷卡的匯率跟 RateWise 顯示的${displayName}台銀牌告匯率一樣嗎？`,
        answer: `不一樣。出國刷卡使用的是發卡組織（Visa、Mastercard）的清算匯率，再加上發卡銀行的海外交易手續費（通常 1.5%），與臺灣銀行牌告匯率是不同體系。RateWise 顯示的台銀牌告匯率適用於臨櫃換鈔或外幣帳戶匯款，不代表你出國刷卡時的實際扣款匯率。若出國以刷卡為主，建議另行查詢發卡銀行的海外手續費規定。`,
      },
    ],
    howToSteps: [
      {
        position: 1,
        name: '選擇原始貨幣',
        text: `在首頁將來源貨幣設定為 ${code}，再選擇 TWD 或其他目標貨幣。可點擊星號收藏常用幣別。`,
      },
      {
        position: 2,
        name: '輸入金額',
        text: `輸入 ${code} 金額、使用計算機鍵盤或點擊快速金額按鈕（如 ${override.popularAmounts.slice(0, 3).map(formatAmount).join('、')}），系統即時計算換算結果。`,
      },
      {
        position: 3,
        name: '切換匯率類型',
        text: '依換匯情境切換現金匯率或即期匯率。臨櫃換鈔選現金，匯款轉帳選即期。',
      },
      {
        position: 4,
        name: '查看趨勢與歷史',
        text: '展開匯率卡片可查看 7~30 天歷史趨勢圖，幫助判斷換匯時機。',
      },
    ],
    highlights: [
      `精準賣出價：顯示臺灣銀行牌告的現金賣出與即期賣出實際報價，非中間價——換匯金額更精準，避免低估所需台幣。`,
      `資料來源：臺灣銀行牌告匯率，現金與即期買入賣出四種報價完整呈現。`,
      `更新頻率：每 5 分鐘自動同步，首頁顯示最近更新時間，亦可下拉手動重新整理。`,
      `適用情境：${override.region}前快速查看 ${code}/TWD 即時換算與歷史趨勢。`,
      `${override.travelTip}`,
      `工具功能：計算機鍵盤快速輸入、快速金額按鈕、收藏管理與拖曳排序、換算歷史紀錄。`,
    ],
    commonAmounts,
    travelTip: override.travelTip,
    faqTitle: `${displayName}換匯常見問題`,
  };
}
