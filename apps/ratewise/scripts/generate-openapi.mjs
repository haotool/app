import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_CONFIG, RAW_DATA_BASE, CDN_DATA_BASE } from '../seo-paths.config.mjs';
import { APP_INFO } from '../src/config/app-info.ts';
import { buildPublicRateProviderMetadata } from '../src/config/rateProviderPublicMetadata.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
const APP_VERSION = pkg.version;

const API_VERSION = '1.3.0';

const constantsPath = resolve(ROOT, 'src/features/ratewise/constants.ts');
const constantsContent = readFileSync(constantsPath, 'utf-8');
const currencyKeys = [...constantsContent.matchAll(/^\s+([A-Z]{3}):\s*\{/gm)].map((m) => m[1]);

const SUPPORTED_CURRENCIES =
  currencyKeys.length > 0
    ? currencyKeys
    : [
        'USD',
        'HKD',
        'GBP',
        'AUD',
        'CAD',
        'SGD',
        'CHF',
        'JPY',
        'NZD',
        'THB',
        'PHP',
        'IDR',
        'EUR',
        'KRW',
        'VND',
        'MYR',
        'CNY',
      ];

const rateModeStrategies = JSON.parse(
  readFileSync(resolve(ROOT, 'src/config/rate-mode-strategies.json'), 'utf-8'),
);

const publicProviderMetadata = buildPublicRateProviderMetadata({
  dataBaseUrl: '/public/rates',
  supportedCurrencies: SUPPORTED_CURRENCIES,
  historyDateToken: '{date}',
});
const exchangeShopProvider = publicProviderMetadata.providers.find(
  (provider) => provider.sourceKind === 'exchange-shop',
);
const EXCHANGE_SHOP_PROVIDER_IDS = publicProviderMetadata.providers
  .filter((provider) => provider.sourceKind === 'exchange-shop')
  .map((provider) => provider.providerId);
const EXCHANGE_SHOP_LATEST_PATH = '/public/rates/providers/{providerId}/latest.json';
const EXCHANGE_SHOP_HISTORY_PATH = '/public/rates/providers/{providerId}/history/{date}.json';

const providerIdPathParameter = {
  name: 'providerId',
  in: 'path',
  required: true,
  description: '匯率來源 providerId。目前換錢所 provider 為 moneybox。',
  schema: {
    type: 'string',
    enum: EXCHANGE_SHOP_PROVIDER_IDS,
    example: exchangeShopProvider?.providerId ?? 'moneybox',
  },
};

const cdnResponseHeaders = {
  ETag: {
    description: '資源版本標識符，用於後續 If-None-Match 條件式請求（可節省約 5 KB／次）',
    schema: { type: 'string', example: '"a1b2c3d4e5f6"' },
  },
  'Cache-Control': {
    description: 'CDN 快取控制；資料更新後 jsDelivr 自動 Purge，實際新鮮度約 5 分鐘',
    schema: { type: 'string', example: 'max-age=300, public' },
  },
};

const response304 = {
  description:
    '資料未變更（ETag 條件式請求命中，零 body，僅 CDN 端點支援）。' +
    '請求時帶入 If-None-Match: <ETag 值> 即可觸發。',
  headers: {
    ETag: {
      description: '與前次回應相同的 ETag 值',
      schema: { type: 'string' },
    },
  },
};

const response404 = {
  description:
    '指定日期無歷史資料。常見原因：日期為國定假日（台銀未開市）、' +
    '早於資料收集起始日，或格式不符 YYYY-MM-DD 正則。',
};

const response429 = {
  description:
    '請求超過速率限制（僅 GitHub Raw 端點；未認證 IP 限 60 req/hr）。' +
    '建議改用 CDN 端點（jsDelivr）以避免觸發此限制。',
  headers: {
    'Retry-After': {
      description: '建議等待秒數後重試',
      schema: { type: 'integer', example: 3600 },
    },
  },
};

const currencyRateDetailSchema = {
  type: 'object',
  description: '單一幣別的完整四種報價（即期與現金的買入/賣出）',
  properties: {
    spot: {
      type: 'object',
      description: '即期匯率（電匯/帳戶轉帳適用）',
      properties: {
        buy: {
          type: 'number',
          description: '即期買入匯率：銀行以此價收購外幣（你匯款回台灣時適用）',
          example: 32.015,
        },
        sell: {
          type: 'number',
          description: '即期賣出匯率：銀行以此價賣出外幣（你從台灣匯款出去時適用）',
          example: 32.085,
        },
      },
      required: ['buy', 'sell'],
    },
    cash: {
      type: 'object',
      description: '現金匯率（臨櫃換鈔適用）',
      properties: {
        buy: {
          type: 'number',
          description: '現金買入匯率：銀行以此價收購外幣現鈔（你拿外幣現鈔換台幣時適用）',
          example: 31.73,
        },
        sell: {
          type: 'number',
          description: '現金賣出匯率：銀行以此價賣出外幣現鈔（你拿台幣換外幣現鈔時適用）',
          example: 32.385,
        },
      },
      required: ['buy', 'sell'],
    },
  },
  required: ['spot', 'cash'],
};

const ratesResponseSchema = {
  type: 'object',
  description: '匯率資料回應（每 5 分鐘由 GitHub Actions 自動同步）',
  properties: {
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: '資料抓取時間（ISO 8601 字串，UTC）',
      example: '2026-05-07T17:25:48.209Z',
    },
    updateTime: {
      type: 'string',
      description: '台灣銀行牌告顯示時間（台灣時間 UTC+8）',
      example: '2026/05/08 01:25:48',
    },
    source: {
      type: 'string',
      description: '匯率資料來源名稱',
      example: '臺灣銀行牌告匯率',
    },
    rates: {
      type: 'object',
      description:
        '各幣別簡化參考匯率（相容舊版欄位）。若要對齊 App 的 auto / sell / mid 匯率模式，請使用 details 搭配 x-rate-mode-strategies。',
      additionalProperties: {
        type: 'number',
        description: '該幣別對 TWD 的簡化參考匯率',
      },
      example: { USD: 32.085, JPY: 0.2088, EUR: 35.12 },
    },
    details: {
      type: 'object',
      description: '各幣別完整四種報價資料（以幣別代碼為 key）',
      additionalProperties: { $ref: '#/components/schemas/CurrencyRateDetail' },
      example: {
        USD: { spot: { buy: 32.015, sell: 32.085 }, cash: { buy: 31.73, sell: 32.385 } },
        JPY: { spot: { buy: 0.2078, sell: 0.2088 }, cash: { buy: 0.2041, sell: 0.2119 } },
      },
    },
  },
  required: ['timestamp', 'updateTime', 'source', 'rates', 'details'],
};

const exchangeShopRatesResponseSchema = {
  type: 'object',
  description:
    '換錢所匯率資料回應。目前 MoneyBox 以 KRW 為基準，TWD rate 表示 1 TWD 可換多少 KRW。',
  properties: {
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: '資料抓取時間（ISO 8601 字串，UTC）',
      example: '2026-05-07T17:25:48.209Z',
    },
    updateTime: {
      type: 'string',
      description: 'MoneyBox 資料更新時間（首爾時間 UTC+9）',
      example: '2026/05/08 02:25:48',
    },
    source: {
      type: 'string',
      example: 'MoneyBox (明洞換匯所聯盟)',
    },
    sourceUrl: {
      type: 'string',
      format: 'uri',
      example: 'https://moneybox-exchange.com/zh-CHT/exchange',
    },
    base: {
      type: 'string',
      example: 'KRW',
    },
    rates: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          currency: { type: 'string', example: 'TWD' },
          base: { type: ['number', 'null'], example: 44.9 },
          buy: { type: ['number', 'null'], example: 45.1 },
          sell: { type: ['number', 'null'], example: 44.9 },
          spbuy: { type: ['number', 'null'], example: 45.2 },
          spsell: { type: ['number', 'null'], example: 44.8 },
        },
        required: ['currency', 'base', 'buy', 'sell', 'spbuy', 'spsell'],
      },
    },
  },
  required: ['timestamp', 'updateTime', 'source', 'sourceUrl', 'base', 'rates'],
};

const rateProviderSchema = {
  type: 'object',
  description: '匯率來源 provider metadata。分類使用 sourceKind，實際來源使用 providerId。',
  properties: {
    providerId: { type: 'string', examples: ['bot', 'moneybox'] },
    sourceKind: { type: 'string', enum: ['bank', 'exchange-shop'] },
    name: { type: 'string', examples: ['臺灣銀行', 'MoneyBox (明洞換匯所聯盟)'] },
    supportedCurrencies: {
      type: 'array',
      items: { type: 'string' },
    },
    supportedRateTypes: {
      type: 'array',
      items: { type: 'string', enum: ['cash', 'spot'] },
    },
    currentEndpoint: { type: 'string' },
    historyEndpoint: { type: 'string' },
  },
  required: [
    'providerId',
    'sourceKind',
    'name',
    'supportedCurrencies',
    'supportedRateTypes',
    'currentEndpoint',
    'historyEndpoint',
  ],
};

const pairInfoSchema = {
  type: 'object',
  description: '幣對靜態資訊（指向即時匯率 CDN 的入口）',
  properties: {
    pair: { type: 'string', example: 'USD/TWD' },
    from: { type: 'string', example: 'USD' },
    to: { type: 'string', example: 'TWD' },
    slug: { type: 'string', example: 'usd-twd' },
    pageUrl: {
      type: 'string',
      format: 'uri',
      example: `${SITE_CONFIG.url}usd-twd/`,
    },
    liveRateUrl: {
      type: 'string',
      format: 'uri',
      description: '即時匯率 JSON 來源（CDN）',
      example: `${CDN_DATA_BASE}/public/rates/latest.json`,
    },
    rateFieldPath: {
      type: 'string',
      description: '在 liveRateUrl 回應中定位此幣別資料的路徑',
      example: 'details.USD',
    },
    rateModes: {
      type: 'object',
      description: 'App 匯率模式對應的欄位選擇策略；用於依使用者模式取正確 buy/sell/mid 欄位。',
      example: rateModeStrategies,
    },
    source: { type: 'string', example: '臺灣銀行牌告匯率' },
  },
  required: [
    'pair',
    'from',
    'to',
    'slug',
    'pageUrl',
    'liveRateUrl',
    'rateFieldPath',
    'rateModes',
    'source',
  ],
};

const openApiSpec = {
  openapi: '3.1.0',
  jsonSchemaDialect: 'https://json-schema.org/draft/2020-12/schema',
  info: {
    title: `${APP_INFO.shortName} 匯率 API`,
    version: API_VERSION,
    description: [
      '臺灣銀行牌告匯率靜態 JSON API，每 5 分鐘由 GitHub Actions 自動同步。',
      '',
      '**匯率類型說明：**',
      '- `cash_buy`（現金買入）：銀行以此價收購外幣現鈔（你拿外幣換台幣）',
      '- `cash_sell`（現金賣出）：銀行以此價賣出外幣現鈔（你拿台幣換外幣現金）',
      '- `spot_buy`（即期買入）：電匯/帳戶轉入匯率（你匯款回台灣）',
      '- `spot_sell`（即期賣出）：電匯/帳戶轉出匯率（你從台灣匯款出去）',
      '',
      '**重要提示：** 賣出（sell）= 銀行賣給你外幣的價格 = 你拿台幣換外幣看此價；',
      '買入（buy）= 銀行收你外幣的價格 = 你拿外幣換台幣看此價。',
      '',
      '**App 匯率模式對應：**',
      '- `auto`：來源外幣用 `{rateType}.buy`，目標外幣用 `{rateType}.sell`；TWD 視為 1。',
      '- `sell`：來源與目標皆用 `{rateType}.sell`。',
      '- `mid`：來源與目標皆用 `({rateType}.buy + {rateType}.sell) / 2`。',
      '',
      '匯率僅供參考，實際交易請以金融機構公告為準。',
    ].join('\n'),
    contact: {
      name: 'haotool',
      email: pkg.author?.email || 'haotool.org@gmail.com',
      url: pkg.author?.url || 'https://haotool.org',
    },
    license: {
      name: 'GPL-3.0',
      url: 'https://www.gnu.org/licenses/gpl-3.0.html',
    },
    'x-source': '臺灣銀行牌告匯率',
    'x-source-url': 'https://rate.bot.com.tw/xrt',
    'x-update-frequency': 'every 5 minutes',
    'x-base-currency': 'TWD',
    'x-rate-modes': ['auto', 'sell', 'mid'],
    'x-rate-mode-strategies': rateModeStrategies,
    'x-rate-providers': publicProviderMetadata,
    'x-supported-currencies': SUPPORTED_CURRENCIES,
    'x-webapp': SITE_CONFIG.url,
    'x-documentation': `${SITE_CONFIG.url}open-data/`,
    'x-app-version': APP_VERSION,
  },
  'x-changelog': {
    '1.2.0': {
      date: '2026-05-09',
      summary: '新增 MoneyBox 換錢所 current/history 端點與 provider metadata 合約。',
      'app-version': APP_VERSION,
    },
    '1.1.0': {
      date: '2026-05-08',
      summary: '新增 App 匯率模式欄位對照與幣對 rateModes 規格，並對齊資料端時間欄位格式。',
      'app-version': APP_VERSION,
    },
    '1.0.0': {
      date: '2026-03-21',
      summary: '初始 API 版本。包含最新匯率、歷史匯率、幣對資訊三個端點。',
      'app-version': APP_VERSION,
    },
  },
  servers: [
    {
      url: CDN_DATA_BASE,
      description:
        'CDN（jsDelivr）— 建議端點，全球 PoP 節點加速，支援 ETag 條件式請求（If-None-Match）省流量。' +
        'GitHub Actions 每次推送後自動呼叫 jsDelivr Purge API，CDN 快取立即失效，實際新鮮度約 5 分鐘。',
    },
    {
      url: RAW_DATA_BASE,
      description:
        'GitHub Raw — 無快取端點，每次請求直接取得 data 分支最新版本（每 5 分鐘由 GitHub Actions 同步）。' +
        '適合需要確保即時性的場景，但注意 GitHub 對未認證 IP 有速率限制（60 req/hr/IP）。',
    },
  ],
  paths: {
    [EXCHANGE_SHOP_LATEST_PATH]: {
      get: {
        summary: '取得指定 provider 最新換錢所匯率',
        description: [
          '取得指定 provider 的最新換錢所匯率資料。',
          '目前 App 只在 KRW 相關換算啟用 MoneyBox，且換錢所來源固定視為現金匯率。',
          'CDN 端點支援 ETag 條件式請求（If-None-Match）。',
        ].join(' '),
        operationId: 'getExchangeShopProviderRates',
        tags: ['匯率資料', '匯率來源'],
        parameters: [
          providerIdPathParameter,
          {
            name: 'If-None-Match',
            in: 'header',
            required: false,
            description: 'ETag 條件式請求標頭；帶入前次回應的 ETag 值，資料未變時可節省傳輸。',
            schema: { type: 'string', example: '"a1b2c3d4e5f6"' },
          },
        ],
        responses: {
          200: {
            description: '成功取得指定 provider 最新換錢所匯率',
            headers: cdnResponseHeaders,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ExchangeShopRatesResponse' },
              },
            },
          },
          304: response304,
          429: response429,
        },
      },
    },
    [EXCHANGE_SHOP_HISTORY_PATH]: {
      get: {
        summary: '取得指定 provider 指定日期換錢所歷史匯率',
        description: [
          '取得指定 provider 與指定日期的換錢所歷史匯率快照。',
          '資料路徑與台銀 history 分離，避免銀行與換錢所歷史資料語意混用。',
        ].join(' '),
        operationId: 'getExchangeShopProviderHistoryRates',
        tags: ['匯率資料', '匯率來源'],
        parameters: [
          providerIdPathParameter,
          {
            name: 'date',
            in: 'path',
            required: true,
            description: '查詢日期，格式 YYYY-MM-DD。',
            schema: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
              example: '2026-05-09',
            },
          },
          {
            name: 'If-None-Match',
            in: 'header',
            required: false,
            description: 'ETag 條件式請求標頭；帶入前次回應的 ETag 值，資料未變時可節省傳輸。',
            schema: { type: 'string', example: '"a1b2c3d4e5f6"' },
          },
        ],
        responses: {
          200: {
            description: '成功取得指定 provider 歷史換錢所匯率',
            headers: cdnResponseHeaders,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ExchangeShopRatesResponse' },
              },
            },
          },
          304: response304,
          404: response404,
          429: response429,
        },
      },
    },
    '/ratewise/api/pairs/{pair}.json': {
      get: {
        summary: '取得指定幣對資訊',
        description: [
          '取得指定幣對（如 usd-twd）的靜態資訊，包含幣對代碼、即時匯率 CDN 端點、',
          '匯率欄位路徑與對應落地頁 URL。適合搜尋系統與 AI agent 查詢特定幣對。',
        ].join(''),
        operationId: 'getPairInfo',
        tags: ['幣對資訊'],
        parameters: [
          {
            name: 'pair',
            in: 'path',
            required: true,
            description: '幣對代碼，格式 {from}-twd（例如 usd-twd、jpy-twd）',
            schema: {
              type: 'string',
              enum: [
                'usd-twd',
                'jpy-twd',
                'eur-twd',
                'gbp-twd',
                'cny-twd',
                'krw-twd',
                'hkd-twd',
                'aud-twd',
                'cad-twd',
                'sgd-twd',
                'thb-twd',
                'nzd-twd',
                'chf-twd',
                'vnd-twd',
                'php-twd',
                'idr-twd',
                'myr-twd',
              ],
              example: 'usd-twd',
            },
          },
        ],
        servers: [
          { url: 'https://app.haotool.org', description: `${APP_INFO.shortName} 應用程式伺服器` },
        ],
        responses: {
          200: {
            description: '成功取得幣對資訊',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PairInfo' },
              },
            },
          },
        },
      },
    },
    '/public/rates/latest.json': {
      get: {
        summary: '取得最新匯率',
        description: [
          '取得臺灣銀行最新牌告匯率資料。',
          '資料每 5 分鐘由 GitHub Actions 自動同步。',
          '包含各幣別的現金買入、現金賣出、即期買入、即期賣出四種報價。',
          'CDN 端點支援 ETag 條件式請求（If-None-Match），資料未變時回傳 304（零 body）。',
        ].join(' '),
        operationId: 'getLatestRates',
        tags: ['匯率資料'],
        parameters: [
          {
            name: 'If-None-Match',
            in: 'header',
            required: false,
            description: 'ETag 條件式請求標頭；帶入前次回應的 ETag 值，資料未變時可節省傳輸。',
            schema: { type: 'string', example: '"a1b2c3d4e5f6"' },
          },
        ],
        responses: {
          200: {
            description: '成功取得最新匯率資料',
            headers: cdnResponseHeaders,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RatesResponse' },
              },
            },
          },
          304: response304,
          429: response429,
        },
      },
    },
    '/public/rates/history/{date}.json': {
      get: {
        summary: '取得指定日期歷史匯率',
        description: [
          '取得指定日期的臺灣銀行牌告匯率歷史資料。',
          '可查詢日期自資料收集起始日起（約 2025-02 至今）；',
          '國定假日（台銀未開市）或收集前日期均無資料，回傳 404。',
          'CDN 端點支援 ETag 條件式請求（If-None-Match），資料未變時回傳 304（零 body）。',
        ].join(''),
        operationId: 'getHistoryRates',
        tags: ['匯率資料'],
        parameters: [
          {
            name: 'date',
            in: 'path',
            required: true,
            description:
              '查詢日期，格式 YYYY-MM-DD。' + '可查詢範圍自 2025-02 起；假日或格式不符回傳 404。',
            schema: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
              example: '2025-02-20',
            },
          },
          {
            name: 'If-None-Match',
            in: 'header',
            required: false,
            description: 'ETag 條件式請求標頭；帶入前次回應的 ETag 值，資料未變時可節省傳輸。',
            schema: { type: 'string', example: '"a1b2c3d4e5f6"' },
          },
        ],
        responses: {
          200: {
            description: '成功取得歷史匯率資料',
            headers: cdnResponseHeaders,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RatesResponse' },
              },
            },
          },
          304: response304,
          404: response404,
          429: response429,
        },
      },
    },
  },
  components: {
    schemas: {
      CurrencyRateDetail: currencyRateDetailSchema,
      ExchangeShopRatesResponse: exchangeShopRatesResponseSchema,
      RatesResponse: ratesResponseSchema,
      PairInfo: pairInfoSchema,
      RateProvider: rateProviderSchema,
    },
  },
  tags: [
    {
      name: '匯率資料',
      description: '臺灣銀行牌告匯率相關端點（最新 / 歷史）',
      'x-displayName': '匯率資料',
    },
    {
      name: '幣對資訊',
      description: '幣對靜態資訊端點（幣對代碼、CDN 端點、落地頁 URL）',
      'x-displayName': '幣對資訊',
    },
    {
      name: '匯率來源',
      description: 'provider metadata 與換錢所資料端點',
      'x-displayName': '匯率來源',
    },
  ],
  'x-rate-providers': {
    ...publicProviderMetadata,
  },
  'x-pair-endpoints': {
    description: '各幣對靜態 JSON 端點（供搜尋系統與 AI agent 查詢特定幣對匯率資訊）',
    template: `${SITE_CONFIG.url}api/pairs/{PAIR}.json`,
    example: `${SITE_CONFIG.url}api/pairs/usd-twd.json`,
  },
  'x-deep-link': {
    description: '公開可索引的幣對金額頁與首頁互動 deep-link 模板。',
    preferredLandingPageTemplate: `${SITE_CONFIG.url}{pair}/{amount}/`,
    preferredLandingPageDescription:
      '優先提供公開可索引的 path-based landing page，適合搜尋引擎與 AI agent 引用。',
    interactiveDeepLinkTemplate: `${SITE_CONFIG.url}?amount={AMOUNT}&from={FROM}&to={TO}`,
    interactiveDeepLinkDescription:
      '僅在需要同時指定三個自由變數時使用，作為首頁換算器的互動狀態 URL。',
  },
};

const openapiOutputPath = resolve(ROOT, 'public/openapi.json');
writeFileSync(openapiOutputPath, JSON.stringify(openApiSpec, null, 2) + '\n');
console.log(
  `✅ openapi.json generated: API v${API_VERSION} (app v${APP_VERSION}), OpenAPI 3.1, ${SUPPORTED_CURRENCIES.length} currencies`,
);
