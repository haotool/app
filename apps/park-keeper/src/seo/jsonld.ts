import { SITE_CONFIG } from '../../app.config.mjs';

const BASE_URL = SITE_CONFIG.url.replace(/\/$/, '');

type JsonLdObject = Record<string, unknown>;

function createOrganization(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://app.haotool.org/#organization',
    name: 'haotool.org',
    url: 'https://app.haotool.org/',
    logo: {
      '@type': 'ImageObject',
      url: 'https://app.haotool.org/park-keeper/og-image.svg',
    },
    founder: {
      '@type': 'Person',
      name: '阿璋 (Ah Zhang)',
    },
    sameAs: ['https://haotool.org'],
  };
}

function createWebSite(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: '停車好工具',
    alternateName: ['ParkKeeper', '台灣停車工具', '台灣最好用的停車工具'],
    url: `${BASE_URL}/`,
    inLanguage: 'zh-TW',
    publisher: { '@id': 'https://app.haotool.org/#organization' },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

function createWebApp(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${BASE_URL}/#app`,
    name: '停車好工具',
    alternateName: ['ParkKeeper', '台灣停車記錄 App', '台灣最好用的停車工具'],
    url: `${BASE_URL}/`,
    description:
      '台灣最好用的免費停車工具。記錄車牌、樓層、GPS 座標與照片，羅盤導航秒找愛車。PWA 離線可用、零註冊、完全隱私保護。',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web, Android, iOS',
    browserRequirements: 'Requires JavaScript, GPS',
    softwareVersion: '1.0.5',
    datePublished: '2026-02-01',
    dateModified: '2026-02-27',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TWD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '52',
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Person',
      name: '阿璋 (Ah Zhang)',
      url: 'https://haotool.org',
    },
    publisher: { '@id': 'https://app.haotool.org/#organization' },
    isPartOf: { '@id': `${BASE_URL}/#website` },
    inLanguage: ['zh-TW', 'en', 'ja'],
    availableLanguage: [
      { '@type': 'Language', name: '繁體中文', alternateName: 'zh-TW' },
      { '@type': 'Language', name: 'English', alternateName: 'en' },
      { '@type': 'Language', name: '日本語', alternateName: 'ja' },
    ],
    featureList: [
      '停車位置 GPS 記錄',
      '車牌號碼與樓層記錄',
      '照片拍攝與自動壓縮',
      '羅盤導航快速找車',
      '室內計步器模式',
      'Zen/Nitro/Kawaii/Classic 四種介面主題',
      '繁中/英/日三語言支援',
      'IndexedDB 離線儲存',
      'PWA 安裝至主畫面',
      '零註冊、完全隱私',
    ],
    screenshot: `${BASE_URL}/og-image.svg`,
    keywords:
      '台灣停車工具,停車記錄,找車app,GPS停車,羅盤導航,免費停車app,停車好工具,台灣最好用停車工具',
  };
}

function createBreadcrumb(route: string): JsonLdObject {
  const items: { name: string; url: string }[] = [
    { name: 'haotool.org', url: 'https://app.haotool.org/' },
    { name: '停車好工具', url: `${BASE_URL}/` },
  ];

  if (route === '/about/' || route === '/about') {
    items.push({ name: '關於', url: `${BASE_URL}/about/` });
  } else if (route === '/settings/' || route === '/settings') {
    items.push({ name: '設定', url: `${BASE_URL}/settings/` });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function createFAQ(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '台灣最好用的停車工具是什麼？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '停車好工具（ParkKeeper）是台灣最好用的免費停車記錄工具。支援 GPS 定位記錄車牌、樓層、座標與照片，羅盤導航秒找愛車，PWA 離線可用，零註冊完全隱私。已有超過 170 座停車場實測驗證。',
        },
      },
      {
        '@type': 'Question',
        name: '停車好工具是什麼？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '停車好工具是一款完全免費的 PWA 停車位置記錄與導航應用，由 haotool.org 出品。記錄車牌、樓層、GPS 座標與照片，透過羅盤導航快速找回愛車。所有資料儲存在裝置本機，不收集任何個人資訊。',
        },
      },
      {
        '@type': 'Question',
        name: '需要註冊帳號或付費嗎？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '完全不需要！停車好工具是 100% 免費的。所有資料都儲存在您的裝置上（IndexedDB），不需要註冊帳號、不收集任何個人資料、不含廣告。',
        },
      },
      {
        '@type': 'Question',
        name: '停車好工具支援哪些語言？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '支援繁體中文、English 和日本語三種語言，介面完整在地化。',
        },
      },
      {
        '@type': 'Question',
        name: '沒有網路也能使用嗎？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '可以！停車好工具是 PWA 應用，安裝後可完全離線使用。停車紀錄儲存在 IndexedDB，不需要網路連線就能記錄和查看停車資訊。',
        },
      },
      {
        '@type': 'Question',
        name: '停車好工具如何幫我找回停車位置？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '停車好工具提供兩種找車方式：(1) GPS 羅盤導航 — 利用裝置方向感測器和 GPS 精準指引停車方向與距離；(2) 地圖導航 — 在 Leaflet 地圖上顯示停車位置，可一鍵開啟 Google Maps 導航。室內場景會自動切換計步器模式估算距離。',
        },
      },
    ],
  };
}

function createHowTo(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: '如何使用停車好工具記錄和找回停車位置',
    description: '三步驟教你用停車好工具記錄停車位置並快速找回愛車，適用於台灣所有停車場。',
    totalTime: 'PT1M',
    tool: [{ '@type': 'HowToTool', name: '手機（支援 GPS 的智慧型手機）' }],
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: '記錄停車位置',
        text: '打開停車好工具，點擊「記錄停車」按鈕。輸入車牌號碼與樓層，系統自動取得 GPS 座標。可選擇拍攝車位照片。',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: '完成停車紀錄',
        text: '確認資訊後儲存。紀錄會安全存放在您的裝置中（IndexedDB），不會上傳到任何伺服器。',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: '羅盤導航找車',
        text: '返回時打開停車好工具，選擇停車紀錄後點擊「導航」。羅盤會指引方向與距離，幫您快速找回愛車。',
      },
    ],
  };
}

export function getJsonLdForRoute(route: string, _buildTime: string): JsonLdObject[] {
  const normalized = route === '/' ? '/' : route.replace(/\/?$/, '/');
  const schemas: JsonLdObject[] = [createBreadcrumb(normalized)];

  if (normalized === '/') {
    schemas.push(createOrganization(), createWebSite(), createWebApp(), createFAQ(), createHowTo());
  }

  return schemas;
}

export function jsonLdToScriptTags(schemas: JsonLdObject[]): string {
  return schemas
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n');
}
