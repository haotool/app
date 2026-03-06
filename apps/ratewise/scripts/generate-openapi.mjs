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
  },
  servers: [
    {
      url: 'https://cdn.jsdelivr.net/gh/haotool/app@data',
      description: 'CDN（jsDelivr）— 建議使用，全球加速，每 5 分鐘更新',
    },
    {
      url: 'https://raw.githubusercontent.com/haotool/app/data',
      description: 'GitHub Raw — 備援端點',
    },
  ],
  paths: {
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
  'x-deep-link': {
    description: '應用程式深層連結（帶入換算參數）',
    format: `${SITE_CONFIG.url}?amount={AMOUNT}&from={FROM}&to={TO}`,
    examples: [
      `${SITE_CONFIG.url}?amount=50000&from=KRW&to=TWD`,
      `${SITE_CONFIG.url}?amount=10000&from=JPY&to=TWD`,
      `${SITE_CONFIG.url}?amount=100&from=USD&to=TWD`,
    ],
  },
};

const openapiOutputPath = resolve(ROOT, 'public/openapi.json');
const openapiConfig = await prettier.resolveConfig(openapiOutputPath);
const openapiFormatted = await prettier.format(JSON.stringify(openApiSpec, null, 2), {
  ...openapiConfig,
  parser: 'json',
});
writeFileSync(openapiOutputPath, openapiFormatted);
console.log(
  `✅ openapi.json generated: v${VERSION}, OpenAPI 3.1, ${SUPPORTED_CURRENCIES.length} currencies`,
);
