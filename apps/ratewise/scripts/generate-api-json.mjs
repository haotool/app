/**
 * 自動生成 /api/latest.json 靜態 API 端點
 *
 * 執行時機：prebuild（與 generate-llms-txt.mjs 同階段）
 * 功能：產生靜態 JSON metadata，指向 GitHub data 分支的即時匯率 API
 * SSOT 來源：package.json (version) + seo-paths.config.mjs (currencies) + constants.ts (全幣別)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_CONFIG, RAW_DATA_BASE, CDN_DATA_BASE } from '../seo-paths.config.mjs';
import { APP_INFO } from '../src/config/app-info.ts';
import {
  API_SEMANTICS_DOC,
  API_SEMANTICS_SCHEMA_VERSION,
  buildProviderSemanticFieldMapping,
  buildSemanticFieldMapping,
} from '../src/config/api-semantics-v2.ts';
import { buildPublicRateProviderMetadata } from '../src/config/rateProviderPublicMetadata.ts';
import { FX_V3_PUBLIC } from '../src/config/api-endpoints.ts';
import { FX_PUBLISHER } from '../../shared/fx/publisher-metadata.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));

const DATA_BASE_URL = `${RAW_DATA_BASE}/public/rates`;
const CDN_BASE_URL = `${CDN_DATA_BASE}/public/rates`;
const FX_V3_SCHEMA_URL = 'https://app.haotool.org/ratewise/api/v3/contract.schema.json';
const FX_V3_AVAILABILITY =
  'v3 current 是目前啟用的 canonical API；legacy latest/history 僅供相容讀取，已棄用。';

const constantsPath = resolve(ROOT, 'src/features/ratewise/constants.ts');
const constantsContent = readFileSync(constantsPath, 'utf-8');
const currencyKeys = [...constantsContent.matchAll(/^\s+([A-Z]{3}):\s*\{/gm)].map((m) => m[1]);

const rateModeStrategies = JSON.parse(
  readFileSync(resolve(ROOT, 'src/config/rate-mode-strategies.json'), 'utf-8'),
);

const providerMetadata = buildPublicRateProviderMetadata({
  dataBaseUrl: DATA_BASE_URL,
  cdnBaseUrl: CDN_BASE_URL,
  supportedCurrencies: currencyKeys,
});
const { providerSelection, providers } = providerMetadata;
const exchangeShopProvider = providerMetadata.providers.find(
  (provider) => provider.sourceKind === 'exchange-shop',
);

function buildV3Descriptor() {
  return {
    contract: FX_V3_SCHEMA_URL,
    availability: FX_V3_AVAILABILITY,
    current: `${DATA_BASE_URL}/v3/current.json`,
    cdnCurrent: `${CDN_BASE_URL}/v3/current.json`,
    releaseObjectTemplate: `${DATA_BASE_URL}/v3/objects/{sha256}.json`,
    releaseManifestTemplate: `${DATA_BASE_URL}/v3/releases/{releaseId}.json`,
    rateSemantics: 'fromCurrency -> toCurrency; rate is decimal string per 1 fromCurrency',
    estimateModes: ['EXACT_IN', 'EXACT_OUT'],
    hash: 'SHA-256 over final UTF-8 bytes',
    clientRule:
      'Verify current pointer, manifest and every referenced object before using a quote; rate is target units per 1 fromCurrency.',
  };
}

const latestJson = {
  publisher: { ...FX_PUBLISHER },
  name: `${APP_INFO.shortName} Exchange Rate API`,
  version: pkg.version,
  ...(FX_V3_PUBLIC
    ? { schemaVersion: '3.0', legacySchemaVersion: API_SEMANTICS_SCHEMA_VERSION }
    : { schemaVersion: API_SEMANTICS_SCHEMA_VERSION }),
  semanticsDoc: API_SEMANTICS_DOC.publicUrl,
  // B3 #10：宣告 3.0 時以 $schema 取代 v2 semanticFieldMapping，不得並存。
  ...(FX_V3_PUBLIC
    ? { $schema: 'https://app.haotool.org/ratewise/api/v3/contract.schema.json' }
    : { semanticFieldMapping: buildSemanticFieldMapping() }),
  description: FX_V3_PUBLIC
    ? '匯率 API v3 — 以不可變 release manifest、SHA-256 objects 與 fromCurrency→toCurrency quote 為 canonical contract；legacy latest/history 端點僅作相容投影。'
    : '臺灣銀行牌告匯率靜態 API — 資料約每 5 分鐘檢查更新，並提供 App 匯率模式欄位對照',
  source: '臺灣銀行牌告匯率',
  sourceUrl: 'https://rate.bot.com.tw/xrt',
  updateFrequency: 'every 5 minutes',
  baseCurrency: 'TWD',
  rateModes: ['auto', 'sell', 'mid'],
  rateModeStrategies,
  rateTypes: ['cash_buy', 'cash_sell', 'spot_buy', 'spot_sell'],
  supportedCurrencies: currencyKeys,
  endpoints: {
    latest: `${DATA_BASE_URL}/latest.json`,
    ...(FX_V3_PUBLIC ? { legacyLatest: `${DATA_BASE_URL}/latest.json` } : {}),
    history: `${DATA_BASE_URL}/history/{YYYY-MM-DD}.json`,
    moneybox: exchangeShopProvider?.currentEndpoint,
    moneyboxHistory: exchangeShopProvider?.historyEndpoint,
  },
  cdnEndpoints: {
    latest: `${CDN_BASE_URL}/latest.json`,
    ...(FX_V3_PUBLIC ? { legacyLatest: `${CDN_BASE_URL}/latest.json` } : {}),
    history: `${CDN_BASE_URL}/history/{YYYY-MM-DD}.json`,
    moneybox: exchangeShopProvider?.cdnCurrentEndpoint,
    moneyboxHistory: exchangeShopProvider?.cdnHistoryEndpoint,
  },
  ...(FX_V3_PUBLIC ? { v3: buildV3Descriptor() } : {}),
  providerSelection,
  providers: providers.map((provider) => ({
    ...provider,
    semanticFieldMapping: buildProviderSemanticFieldMapping(provider.sourceKind, {
      providerId: provider.providerId,
      ...(provider.sourceKind === 'exchange-shop' ? { quoteUnit: 'KRW_PER_TWD' } : {}),
    }),
  })),
  rateTypeDescriptions: {
    cash_buy: '現金買入：銀行以此價收購外幣現鈔（你拿外幣換台幣）',
    cash_sell: '現金賣出：銀行以此價賣出外幣現鈔（你拿台幣換外幣現金）',
    spot_buy: '即期買入：電匯/帳戶轉入匯率（你匯款回台灣）',
    spot_sell: '即期賣出：電匯/帳戶轉出匯率（你從台灣匯款出去）',
  },
  openapi: `${SITE_CONFIG.url}openapi.json`,
  documentation: `${SITE_CONFIG.url}open-data/`,
  llms: `${SITE_CONFIG.url}llms.txt`,
  webapp: SITE_CONFIG.url,
  preferredLandingPageTemplate: `${SITE_CONFIG.url}{pair}/{amount}/`,
  interactiveDeepLinkTemplate: `${SITE_CONFIG.url}?amount={AMOUNT}&from={FROM}&to={TO}`,
  pairEndpoints: {
    template: `${SITE_CONFIG.url}api/pairs/{PAIR}.json`,
    description:
      '各幣對靜態 JSON 端點，提供幣對資訊、即時匯率連結、匯率欄位路徑、App 匯率模式欄位對照與落地頁 URL',
    example: `${SITE_CONFIG.url}api/pairs/usd-twd.json`,
    availablePairs:
      'usd-twd, jpy-twd, eur-twd, gbp-twd, cny-twd, krw-twd, hkd-twd, aud-twd, cad-twd, sgd-twd, thb-twd, nzd-twd, chf-twd, vnd-twd, php-twd, idr-twd, myr-twd',
  },
  disclaimer: '匯率僅供參考，實際交易請以金融機構公告為準。',
  license: pkg.license,
  codeLicense: pkg.license,
  dataLicenseNote:
    'Provider data terms and redistribution rights are separate from the repository code license; see each provider attribution and termsUrl.',
  contact: pkg.author?.email || 'haotool.org@gmail.com',
};

const apiDir = resolve(ROOT, 'public/api');
mkdirSync(apiDir, { recursive: true });
const apiOutputPath = resolve(apiDir, 'latest.json');
writeFileSync(apiOutputPath, JSON.stringify(latestJson, null, 2) + '\n');
const contractDir = resolve(apiDir, 'v3');
mkdirSync(contractDir, { recursive: true });
const contractSource = readFileSync(resolve(ROOT, '../shared/fx/schema.json'), 'utf8');
writeFileSync(
  resolve(contractDir, 'contract.schema.json'),
  contractSource.endsWith('\n') ? contractSource : `${contractSource}\n`,
);
console.log(`✅ api/latest.json generated: v${pkg.version}, ${currencyKeys.length} currencies`);
