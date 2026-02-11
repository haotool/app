/**
 * SEO Helmet - 統一 SEO 元資料管理
 * 負責 meta tags、Open Graph、Twitter Cards 與 JSON-LD Schema
 */
import { Head } from 'vite-react-ssg';

interface AlternateLink {
  hrefLang: string;
  href: string;
}

/**
 * FAQ Entry for JSON-LD schema
 *
 * 注意：answer 必須是純文字，不能包含 JSX，否則會導致 SSG 序列化警告
 */
interface FAQEntry {
  question: string;
  answer: string;
}

interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

interface HowToData {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration format (e.g., 'PT30S', 'PT2M')
}

/** Breadcrumb item for navigation trail */
interface BreadcrumbItem {
  name: string;
  item: string; // URL
}

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  pathname?: string;
  locale?: string;
  alternates?: AlternateLink[];
  keywords?: string[];
  updatedTime?: string;
  faq?: FAQEntry[];
  howTo?: HowToData;
  /** Breadcrumb navigation trail (at least 2 items required) */
  breadcrumb?: BreadcrumbItem[];
  /** Custom robots directive (default: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1) */
  robots?: string;
}

const DEFAULT_TITLE = 'RateWise 匯率好工具 - 即時匯率轉換器 | 支援 TWD、USD、JPY、EUR 等多幣別換算';
const DEFAULT_DESCRIPTION =
  'RateWise 提供即時匯率換算服務，參考臺灣銀行牌告匯率，支援 TWD、USD、JPY、EUR、GBP、HKD、CNY、KRW 等 30+ 種貨幣。快速、準確、離線可用的 PWA 匯率工具，歷史趨勢圖一目了然，多幣別同時比較，是您出國旅遊與外幣兌換的最佳助手。';
const DEFAULT_OG_IMAGE = '/og-image.jpg';
const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://app.haotool.org/ratewise/'; // Fallback 尾斜線
/** 資產版本快取破壞參數 - 從建置時間自動生成，避免硬編碼日期 */
const ASSET_VERSION = `v=${(import.meta.env.VITE_BUILD_TIME ?? '').replace(/[-T:Z.]/g, '').slice(0, 8) || 'dev'}`;
const DEFAULT_LOCALE = 'zh-TW';
const DEFAULT_KEYWORDS = [
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
  'exchange rate',
  'currency converter',
];
const SOCIAL_LINKS = ['https://www.threads.net/@azlife_1224', 'https://github.com/haotool/app'];

/** 建置時間戳 - 由 vite.config.ts define 注入，避免 SSG/hydration 不一致 */
const BUILD_TIME = import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString();

const sanitizeBaseUrl = (value: string) => value.replace(/\/+$/, '');
const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);
const ensureTrailingSlash = (value: string) => (value.endsWith('/') ? value : `${value}/`);
const SITE_BASE_URL = ensureTrailingSlash(sanitizeBaseUrl(SITE_URL));

const withAssetVersion = (url: string) =>
  url.includes('?') ? `${url}&${ASSET_VERSION}` : `${url}?${ASSET_VERSION}`;
const buildAssetUrl = (value: string) => {
  const absolute = value.startsWith('http') ? value : `${SITE_BASE_URL}${value.replace(/^\//, '')}`;
  return withAssetVersion(absolute);
};

const buildCanonical = (path?: string) => {
  if (!path || path === '/') return SITE_BASE_URL;
  // Absolute URL passthrough (normalize trailing slash only)
  if (/^https?:\/\//i.test(path)) {
    return ensureTrailingSlash(sanitizeBaseUrl(path));
  }
  const normalizedPath = `${ensureLeadingSlash(path).replace(/\/+$/, '')}/`;
  return `${SITE_BASE_URL}${normalizedPath.replace(/^\//, '')}`;
};

/**
 * Default JSON-LD structured data (SoftwareApplication + Organization + Website + ImageObject)
 * Optimized for 2025 AI search (LLMO, GEO, AEO)
 *
 * 依據 2025 最佳實踐：
 * - [Schema.org](https://schema.org/SoftwareApplication) - 使用 SoftwareApplication 比 WebApplication 更豐富
 * - [Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/software-app)
 *
 * [移除 2025-12-22] AggregateRating: 無真實評論系統支撐，避免違反 Google Review Guidelines
 * - 依據: [Google Review Snippet Guidelines](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
 * - 原則: Linus YAGNI (You Aren't Gonna Need It) - 不實作不需要的功能
 */
const DEFAULT_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'RateWise',
    alternateName: '匯率好工具',
    description: DEFAULT_DESCRIPTION,
    url: SITE_BASE_URL,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      '即時匯率查詢',
      '單幣別換算',
      '多幣別同時換算',
      '歷史匯率趨勢（7~30天）',
      '離線使用（PWA）',
      'Service Worker 快取',
      '台灣銀行牌告匯率',
      '30+ 種貨幣支援',
      '極速性能（LCP 489ms）',
    ],
    screenshot: {
      '@type': 'ImageObject',
      url: buildAssetUrl('screenshots/desktop-converter.png'),
      width: '1200',
      height: '630',
      encodingFormat: 'image/png',
      name: 'RateWise 桌面版匯率換算器截圖',
      description: 'RateWise 匯率換算工具桌面版界面',
      creator: {
        '@type': 'Organization',
        name: 'haotool',
        url: 'https://haotool.org',
      },
      copyrightNotice: '© 2025 haotool',
      creditText: 'haotool',
      acquireLicensePage: 'https://haotool.org/contact/',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RateWise',
    url: SITE_BASE_URL,
    logo: buildAssetUrl('optimized/logo-512w.png'),
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
    name: 'RateWise',
    url: SITE_BASE_URL,
    inLanguage: DEFAULT_LOCALE,
    // SearchAction removed: No ?q= search functionality exists
    // @see https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox
  },
];

const buildFaqSchema = (faq: FAQEntry[], url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answer,
    },
  })),
  url,
});

const buildHowToSchema = (
  howTo: { name: string; description: string; steps: HowToStep[]; totalTime?: string },
  url: string,
) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: howTo.name,
  description: howTo.description,
  url,
  totalTime: howTo.totalTime ?? 'PT30S', // ISO 8601 duration format (default: 30 seconds)
  step: howTo.steps.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.name,
    text: step.text,
    ...(step.image && { image: step.image }),
  })),
});

/**
 * Build BreadcrumbList JSON-LD schema
 * 依據 Google 2025 最佳實踐:
 * - 至少 2 個 ListItems
 * - 使用 position 屬性
 * - 所有 URL 必須是絕對路徑
 * 參考: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 */
const buildBreadcrumbSchema = (items: BreadcrumbItem[]) => {
  if (!items || items.length < 2) {
    console.warn('[SEOHelmet] BreadcrumbList requires at least 2 items');
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildCanonical(item.item),
    })),
  };
};

export function SEOHelmet({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  jsonLd,
  pathname,
  locale = DEFAULT_LOCALE,
  alternates,
  keywords,
  updatedTime,
  faq,
  howTo,
  breadcrumb,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
}: SEOProps) {
  const fullTitle = title ? `${title} | RateWise` : DEFAULT_TITLE;

  const canonicalUrl = canonical ? buildCanonical(canonical) : buildCanonical(pathname);
  const ogImageUrl = buildAssetUrl(ogImage);
  const keywordsContent = (keywords?.length ? keywords : DEFAULT_KEYWORDS).join(', ');
  const alternatesToRender = alternates?.length
    ? alternates
    : [
        { hrefLang: 'x-default', href: canonicalUrl },
        { hrefLang: DEFAULT_LOCALE, href: canonicalUrl },
      ];
  const normalizedAlternates = alternatesToRender.map(({ href, hrefLang }) => ({
    hrefLang,
    href: buildCanonical(href),
  }));
  const updatedTimestamp = updatedTime ?? BUILD_TIME;
  const ogLocale = locale.replace('-', '_');

  // Merge default JSON-LD with custom blocks
  const baseJsonLd = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  const structuredData = [...DEFAULT_JSON_LD, ...baseJsonLd];

  if (faq?.length) {
    structuredData.push(buildFaqSchema(faq, canonicalUrl));
  }

  if (howTo) {
    structuredData.push(buildHowToSchema(howTo, canonicalUrl));
  }

  if (breadcrumb && breadcrumb.length >= 2) {
    const breadcrumbSchema = buildBreadcrumbSchema(breadcrumb);
    if (breadcrumbSchema) {
      structuredData.push(breadcrumbSchema);
    }
  }

  // [2025 AI SEO] 添加 OG 圖片的 ImageObject Schema
  // 依據: https://schema.org/ImageObject + Google Search Central 2025 建議欄位
  // 幫助 AI 搜索引擎理解圖片內容
  structuredData.push({
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: ogImageUrl,
    url: ogImageUrl,
    width: '1200',
    height: '630',
    encodingFormat: 'image/png',
    name: 'RateWise 匯率轉換器應用截圖',
    description: 'RateWise 即時匯率換算工具界面截圖，展示單幣別與多幣別換算功能',
    // [GSC 2025-12-31] 新增建議欄位
    creator: {
      '@type': 'Organization',
      name: 'haotool',
      url: 'https://haotool.org',
    },
    author: {
      '@type': 'Organization',
      name: 'haotool',
      url: 'https://haotool.org',
    },
    copyrightHolder: {
      '@type': 'Organization',
      name: 'haotool',
    },
    copyrightYear: '2025',
    copyrightNotice: '© 2025 haotool. All rights reserved.',
    creditText: 'Image by haotool',
    license: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    acquireLicensePage: 'https://haotool.org/contact/',
  });

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsContent} />
      <meta name="author" content="haotool" />
      <meta name="robots" content={robots} />
      <meta name="language" content={locale} />
      {/* 注意：文檔語言由 <html lang="zh-TW"> 指定，不使用 http-equiv */}
      <link rel="canonical" href={canonicalUrl} />
      {normalizedAlternates.map(({ href, hrefLang }) => (
        <link key={hrefLang} rel="alternate" hrefLang={hrefLang} href={href} />
      ))}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="RateWise 匯率轉換器應用截圖" />
      <meta property="og:locale" content={ogLocale} />
      {/* og:locale:alternate 只包含與主要 locale 不同的語言 */}
      {normalizedAlternates
        .filter(
          ({ hrefLang }) => hrefLang !== 'x-default' && hrefLang.replace('-', '_') !== ogLocale,
        )
        .map(({ hrefLang }) => (
          <meta
            key={hrefLang}
            property="og:locale:alternate"
            content={hrefLang.replace('-', '_')}
          />
        ))}
      <meta property="og:site_name" content="RateWise" />
      <meta property="og:updated_time" content={updatedTimestamp} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:image:alt" content="RateWise 匯率轉換器" />

      {/* JSON-LD Structured Data */}
      {structuredData.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Head>
  );
}
