import { SITE_CONFIG } from '../../app.config.mjs';

const BASE_URL = SITE_CONFIG.url.replace(/\/$/, '');

type JsonLdObject = Record<string, unknown>;

function createWebApp(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '停車好工具',
    alternateName: 'ParkKeeper',
    url: `${BASE_URL}/`,
    description: SITE_CONFIG.description,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript, GPS',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TWD',
    },
    author: {
      '@type': 'Person',
      name: '阿璋 (Ah Zhang)',
      url: 'https://app.haotool.org/about/',
    },
    publisher: {
      '@type': 'Organization',
      name: 'haotool.org',
      url: 'https://app.haotool.org/',
    },
    inLanguage: ['zh-TW', 'en', 'ja'],
    featureList: [
      '停車位置 GPS 記錄',
      '車牌號碼與樓層記錄',
      '照片拍攝與壓縮',
      '羅盤導航找車',
      '室內計步器模式',
      '四種介面主題',
      '三語言支援',
      'IndexedDB 離線儲存',
      'PWA 安裝支援',
    ],
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
        name: '停車好工具是什麼？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '停車好工具是一款免費的 PWA 應用，幫助您記錄停車位置（車牌、樓層、GPS、照片），並透過羅盤導航快速找回愛車。支援離線使用。',
        },
      },
      {
        '@type': 'Question',
        name: '需要註冊帳號嗎？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '不需要！所有資料都儲存在您的裝置上（IndexedDB），完全隱私。不收集任何個人資料。',
        },
      },
      {
        '@type': 'Question',
        name: '停車好工具支援哪些語言？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '支援繁體中文、English 和日本語三種語言。',
        },
      },
    ],
  };
}

export function getJsonLdForRoute(route: string, _buildTime: string): JsonLdObject[] {
  const normalized = route === '/' ? '/' : route.replace(/\/?$/, '/');
  const schemas: JsonLdObject[] = [createBreadcrumb(normalized)];

  if (normalized === '/') {
    schemas.push(createWebApp(), createFAQ());
  }

  return schemas;
}

export function jsonLdToScriptTags(schemas: JsonLdObject[]): string {
  return schemas
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n');
}
