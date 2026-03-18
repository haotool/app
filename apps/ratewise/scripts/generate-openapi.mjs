/**
 * 生成 OpenAPI 3.1 規格 — 臺灣銀行匯率 API 文件
 *
 * 執行時機：prebuild
 * 輸出：public/openapi.json
 * SSOT 來源：package.json (version) + seo-paths.config.mjs (站點設定) + constants.ts (幣別清單)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_CONFIG } from '../seo-paths.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
const VERSION = pkg.version;

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

/** 單一幣別四種報價 schema */
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

/** 生成幣別 details 的 additionalProperties schema */
const detailsSchema = {
  type: 'object',
  description: '各幣別完整四種報價資料（以幣別代碼為 key）',
  additionalProperties: currencyRateDetailSchema,
  example: {
    USD: {
      spot: { buy: 32.015, sell: 32.085 },
      cash: { buy: 31.73, sell: 32.385 },
    },
    JPY: {
      spot: { buy: 0.2078, sell: 0.2088 },
      cash: { buy: 0.2041, sell: 0.2119 },
    },
  },
};

/** 生成幣別 rates 簡化版 schema */
const ratesSchema = {
  type: 'object',
  description: '各幣別簡化匯率（以幣別代碼為 key，值為即期賣出匯率）',
  additionalProperties: {
    type: 'number',
    description: '該幣別對 TWD 的即期賣出參考匯率',
  },
  example: {
    USD: 32.085,
    JPY: 0.2088,
    EUR: 35.12,
  },
};

/** 完整 latest.json 回應 schema */
const latestResponseSchema = {
  type: 'object',
  description: '最新匯率資料（每 5 分鐘由 GitHub Actions 自動同步）',
  properties: {
    timestamp: {
      type: 'integer',
      description: 'Unix 時間戳（毫秒）',
      example: 1740000000000,
    },
    updateTime: {
      type: 'string',
      format: 'date-time',
      description: '資料最後更新時間（ISO 8601 格式，台灣時間 UTC+8）',
      example: '2025-02-20T10:30:00+08:00',
    },
    source: {
      type: 'string',
      description: '匯率資料來源名稱',
      example: '臺灣銀行牌告匯率',
    },
    rates: ratesSchema,
    details: detailsSchema,
  },
  required: ['timestamp', 'updateTime', 'source', 'rates', 'details'],
};

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'RateWise 匯率 API',
    version: VERSION,
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
    'x-supported-currencies': SUPPORTED_CURRENCIES,
    'x-webapp': SITE_CONFIG.url,
    'x-documentation': `${SITE_CONFIG.url}open-data/`,
  },
  servers: [
    {
      url: 'https://raw.githubusercontent.com/haotool/app/data',
      description: 'GitHub Raw — 主要端點，無快取，每 5 分鐘同步最新匯率',
    },
    {
      url: 'https://cdn.jsdelivr.net/gh/haotool/app@data',
      description: 'CDN（jsDelivr）— 備援端點，注意：CDN 快取最長 24 小時，不適合即時匯率查詢',
    },
  ],
  paths: {
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
        servers: [{ url: 'https://app.haotool.org', description: 'RateWise 應用程式伺服器' }],
        responses: {
          200: {
            description: '成功取得幣對資訊',
            content: {
              'application/json': {
                schema: {
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
                      example:
                        'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json',
                    },
                    rateFieldPath: {
                      type: 'string',
                      description: '在 liveRateUrl 回應中定位此幣別資料的路徑',
                      example: 'details.USD',
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
                    'source',
                  ],
                },
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
        ].join(' '),
        operationId: 'getLatestRates',
        tags: ['匯率資料'],
        responses: {
          200: {
            description: '成功取得最新匯率資料',
            content: {
              'application/json': {
                schema: latestResponseSchema,
              },
            },
          },
        },
      },
    },
    '/public/rates/history/{date}.json': {
      get: {
        summary: '取得指定日期歷史匯率',
        description: '取得指定日期的臺灣銀行牌告匯率歷史資料。',
        operationId: 'getHistoryRates',
        tags: ['匯率資料'],
        parameters: [
          {
            name: 'date',
            in: 'path',
            required: true,
            description: '查詢日期，格式 YYYY-MM-DD',
            schema: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
              example: '2025-02-20',
            },
          },
        ],
        responses: {
          200: {
            description: '成功取得歷史匯率資料',
            content: {
              'application/json': {
                schema: latestResponseSchema,
              },
            },
          },
          404: {
            description: '指定日期無歷史資料',
          },
        },
      },
    },
  },
  tags: [
    {
      name: '匯率資料',
      description: '臺灣銀行牌告匯率相關端點',
      'x-displayName': '匯率資料',
    },
  ],
  'x-pair-endpoints': {
    description: '各幣對靜態 JSON 端點（供搜尋系統與 AI agent 查詢特定幣對匯率資訊）',
    template: `${SITE_CONFIG.url}api/pairs/{PAIR}.json`,
    example: `${SITE_CONFIG.url}api/pairs/usd-twd.json`,
  },
  'x-deep-link': {
    description: '應用程式深層連結（帶入換算參數）',
    format: `${SITE_CONFIG.url}?amount={AMOUNT}&from={FROM}&to={TO}`,
    exampleTemplate: `${SITE_CONFIG.url}?amount={AMOUNT}&from={FROM}&to={TO}`,
  },
};

const openapiOutputPath = resolve(ROOT, 'public/openapi.json');
writeFileSync(openapiOutputPath, JSON.stringify(openApiSpec, null, 2) + '\n');
console.log(
  `✅ openapi.json generated: v${VERSION}, OpenAPI 3.1, ${SUPPORTED_CURRENCIES.length} currencies`,
);
