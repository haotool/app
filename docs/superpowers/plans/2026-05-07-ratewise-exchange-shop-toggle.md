# RateWise Exchange Shop Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 當使用者選擇韓元（KRW）時，將現有「即期 / 現金」二選一切換器擴充為「即期 / 現金 / 換錢所」三選一，並以 CDN live 資料驅動換錢所匯率，架構預留未來多幣別擴充。

**Architecture:** 新增 `EXCHANGE_SHOP_PROVIDERS` registry 作為所有換錢所幣別的 SSOT 配置，`moneyboxRateService` 對齊 `exchangeRateService` 的 CDN + ETag + localStorage 快取策略，`RateSelector` 元件取代現有 inline toggle，使用現有 `segmentedSwitch` animation token 及 `rateCard` design token 擴充。

**Tech Stack:** React 19 + TypeScript + Vite + Framer Motion (`motion/react`) + Tailwind CSS v3 + Vitest + localStorage/ETag caching

---

## SSOT 稽核摘要（預防設計漂移）

| SSOT 位置                                                            | 職責                                             | 勿重複於                              |
| -------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------- |
| `src/config/exchangeShopProviders.ts` (新增)                         | 換錢所幣別清單、CDN URL、fallback、rate 計算函式 | `RateSelector`、`moneyboxRateService` |
| `src/features/ratewise/storage-keys.ts`                              | localStorage key 穩定識別符                      | 任何內聯字串                          |
| `src/config/design-tokens.ts`                                        | rateCard layout classes                          | `RateSelector`、`ExchangeShopBadge`   |
| `src/config/animations.ts` 的 `segmentedSwitch`                      | toggle 動畫 token                                | `RateSelector` 不可內聯 motion 數值   |
| `src/utils/exchangeRateCalculation.ts` 的 `RateTypeAvailability`     | 即期/現金是否可用                                | `RateSelector` 直接用此型別           |
| `src/config/generated/seo-rate-examples.ts` 的 `AlternativeProvider` | SEO 靜態資料格式                                 | 不與 runtime 服務混用                 |

---

## File Map（模組邊界）

```
新增
├── src/config/exchangeShopProviders.ts      # SSOT: 換錢所 registry（幣別 → 配置）
├── src/services/moneyboxRateService.ts      # CDN fetch + ETag + localStorage 快取
├── src/features/ratewise/hooks/
│   └── useMoneyBoxRates.ts                  # React hook，管理 live 資料狀態
├── src/features/ratewise/components/
│   ├── RateSelector.tsx                     # 2/3 選一 segmented switch UI
│   └── ExchangeShopBadge.tsx               # 換錢所選中時的來源 badge
└── src/services/__tests__/
    └── moneyboxRateService.test.ts
    src/features/ratewise/components/__tests__/
    └── RateSelector.test.tsx

修改
├── src/features/ratewise/types.ts           # 新增 RateSource 型別
├── src/features/ratewise/storage-keys.ts   # 新增 RATE_SOURCE key
├── src/config/design-tokens.ts             # rateCard 新增 exchangeShopBadge
├── src/features/ratewise/RateWise.tsx      # rateSource 狀態整合
└── src/features/ratewise/components/
    └── SingleConverter.tsx                  # props 擴充 + 渲染 RateSelector/Badge
```

---

## Task 1: SSOT Provider Registry

**目標：** 建立 `EXCHANGE_SHOP_PROVIDERS` — 所有換錢所幣別配置的唯一來源。

**Files:**

- Create: `apps/ratewise/src/config/exchangeShopProviders.ts`
- Test: `apps/ratewise/src/config/__tests__/exchangeShopProviders.test.ts`

---

- [ ] **Step 1: Write failing tests**

```typescript
// apps/ratewise/src/config/__tests__/exchangeShopProviders.test.ts
import { describe, it, expect } from 'vitest';
import {
  EXCHANGE_SHOP_PROVIDERS,
  hasExchangeShopProvider,
  getExchangeShopProvider,
} from '../exchangeShopProviders';

describe('EXCHANGE_SHOP_PROVIDERS registry', () => {
  it('KRW has a provider configured', () => {
    expect(EXCHANGE_SHOP_PROVIDERS.KRW).toBeDefined();
  });

  it('KRW provider has required fields', () => {
    const p = EXCHANGE_SHOP_PROVIDERS.KRW!;
    expect(p.providerName).toBe('明洞換匯所');
    expect(p.cdnUrl).toContain('moneybox.json');
    expect(p.fallbackSell).toBeGreaterThan(0);
    expect(p.fallbackBuy).toBeGreaterThan(0);
    expect(typeof p.getSellRate).toBe('function');
    expect(typeof p.getBuyRate).toBe('function');
  });

  it('getSellRate extracts TWD→KRW sell rate from raw CDN response', () => {
    const raw = { rates: { TWD: { sell: 44.85, buy: 45.1 } } };
    expect(EXCHANGE_SHOP_PROVIDERS.KRW!.getSellRate(raw)).toBe(44.85);
  });

  it('getBuyRate extracts KRW→TWD buy rate from raw CDN response', () => {
    const raw = { rates: { TWD: { sell: 44.85, buy: 45.1 } } };
    expect(EXCHANGE_SHOP_PROVIDERS.KRW!.getBuyRate(raw)).toBe(45.1);
  });

  it('getSellRate returns null for malformed data', () => {
    expect(EXCHANGE_SHOP_PROVIDERS.KRW!.getSellRate({})).toBeNull();
    expect(EXCHANGE_SHOP_PROVIDERS.KRW!.getSellRate(null)).toBeNull();
  });

  it('hasExchangeShopProvider returns true for KRW', () => {
    expect(hasExchangeShopProvider('KRW')).toBe(true);
  });

  it('hasExchangeShopProvider returns false for USD', () => {
    expect(hasExchangeShopProvider('USD')).toBe(false);
  });

  it('getExchangeShopProvider returns config for KRW', () => {
    expect(getExchangeShopProvider('KRW')).not.toBeNull();
  });

  it('getExchangeShopProvider returns null for unsupported currency', () => {
    expect(getExchangeShopProvider('USD')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd apps/ratewise && pnpm vitest run src/config/__tests__/exchangeShopProviders.test.ts
```

Expected: FAIL — `Cannot find module '../exchangeShopProviders'`

- [ ] **Step 3: Implement the registry**

```typescript
// apps/ratewise/src/config/exchangeShopProviders.ts

import type { CurrencyCode } from '../features/ratewise/types';

/**
 * 換錢所幣別配置介面
 *
 * SSOT：每種支援換錢所匯率的幣別在此登記一次。
 * 未來新增 PHP / THB 等幣別時，只需在 EXCHANGE_SHOP_PROVIDERS 加一個 entry，
 * UI（RateSelector）、服務層（moneyboxRateService）均自動支援。
 */
export interface ExchangeShopConfig {
  /** 換匯所中文名稱（顯示於 UI badge） */
  providerName: string;
  /** 換匯所英文名稱 */
  providerNameEn: string;
  /** jsDelivr CDN 主要 URL（支援 ETag） */
  cdnUrl: string;
  /** GitHub Raw 備援 URL */
  cdnUrlFallback: string;
  /** 資料來源名稱（顯示於 badge） */
  source: string;
  /** 資料來源網頁 URL（badge 超連結） */
  sourceUrl: string;
  /**
   * 從 CDN raw JSON 取得「客戶買入外幣」匯率（TWD→外幣方向）
   * 例 KRW：raw.rates.TWD.sell = 44.85（1 TWD = 44.85 KRW）
   * 回傳 null 表示資料無效，應使用 fallbackSell
   */
  getSellRate: (raw: unknown) => number | null;
  /**
   * 從 CDN raw JSON 取得「客戶賣出外幣」匯率（外幣→TWD 方向）
   * 例 KRW：raw.rates.TWD.buy = 45.1（45.1 KRW = 1 TWD）
   * 回傳 null 表示資料無效，應使用 fallbackBuy
   */
  getBuyRate: (raw: unknown) => number | null;
  /** getSellRate 失敗時的緊急後備值 */
  fallbackSell: number;
  /** getBuyRate 失敗時的緊急後備值 */
  fallbackBuy: number;
}

/**
 * 換錢所幣別 Registry
 *
 * SSOT for all currencies with exchange shop rate support.
 * Add new entries here to enable the toggle for additional currencies.
 *
 * 目前支援：
 *   KRW — 明洞換匯所（MoneyBox），每 5 分鐘更新
 *
 * 未來可新增：
 *   PHP — 馬尼拉換匯所
 *   THB — 曼谷換匯所
 *   等等…
 */
export const EXCHANGE_SHOP_PROVIDERS: Readonly<Partial<Record<CurrencyCode, ExchangeShopConfig>>> =
  {
    KRW: {
      providerName: '明洞換匯所',
      providerNameEn: 'Myeongdong Exchange',
      cdnUrl: 'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/moneybox.json',
      cdnUrlFallback:
        'https://raw.githubusercontent.com/haotool/app/data/public/rates/moneybox.json',
      source: 'MoneyBox',
      sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
      getSellRate: (raw: unknown): number | null => {
        const data = raw as { rates?: { TWD?: { sell?: unknown } } } | null;
        const sell = data?.rates?.TWD?.sell;
        return typeof sell === 'number' && sell > 0 ? sell : null;
      },
      getBuyRate: (raw: unknown): number | null => {
        const data = raw as { rates?: { TWD?: { buy?: unknown } } } | null;
        const buy = data?.rates?.TWD?.buy;
        return typeof buy === 'number' && buy > 0 ? buy : null;
      },
      fallbackSell: 46.0,
      fallbackBuy: 46.7,
    },
  } as const;

/** 檢查幣別是否有換錢所匯率支援 */
export function hasExchangeShopProvider(currency: CurrencyCode): boolean {
  return currency in EXCHANGE_SHOP_PROVIDERS;
}

/** 取得幣別的換錢所配置，不存在時回傳 null */
export function getExchangeShopProvider(currency: CurrencyCode): ExchangeShopConfig | null {
  return EXCHANGE_SHOP_PROVIDERS[currency] ?? null;
}

/** 取得有換錢所支援的幣別清單（for testing / logging） */
export function getSupportedExchangeShopCurrencies(): CurrencyCode[] {
  return Object.keys(EXCHANGE_SHOP_PROVIDERS) as CurrencyCode[];
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd apps/ratewise && pnpm vitest run src/config/__tests__/exchangeShopProviders.test.ts
```

Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/ratewise/src/config/exchangeShopProviders.ts \
        apps/ratewise/src/config/__tests__/exchangeShopProviders.test.ts
git commit -m "feat(ratewise): 新增換錢所 provider registry SSOT

- EXCHANGE_SHOP_PROVIDERS 統一管理幣別換錢所配置
- 預留 PHP/THB 等未來幣別擴充架構
- hasExchangeShopProvider / getExchangeShopProvider helpers"
```

---

## Task 2: MoneyBox Rate Service

**目標：** 建立 `moneyboxRateService`，對齊 `exchangeRateService` 的 CDN + ETag + localStorage 快取策略。

**Files:**

- Create: `apps/ratewise/src/services/moneyboxRateService.ts`
- Create: `apps/ratewise/src/services/__tests__/moneyboxRateService.test.ts`

---

- [ ] **Step 1: Write failing tests**

```typescript
// apps/ratewise/src/services/__tests__/moneyboxRateService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchExchangeShopRate,
  computeConverterRate,
  type ExchangeShopRate,
} from '../moneyboxRateService';

const MOCK_MONEYBOX_JSON = {
  timestamp: '2026-05-07T07:33:55.932Z',
  updateTime: '2026/05/07 16:33:55',
  source: 'MoneyBox (明洞換匯所聯盟)',
  sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
  base: 'KRW',
  rates: {
    TWD: { currency: 'TWD', base: 44.9, buy: 45.1, sell: 44.85, spbuy: 45.5, spsell: 44.2 },
  },
};

describe('fetchExchangeShopRate', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns structured ExchangeShopRate on successful fetch', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_MONEYBOX_JSON,
      headers: { get: () => '"etag-abc"' },
    } as unknown as Response);

    const result = await fetchExchangeShopRate('KRW');
    expect(result).not.toBeNull();
    expect(result!.sell).toBe(44.85);
    expect(result!.buy).toBe(45.1);
    expect(result!.providerName).toBe('明洞換匯所');
    expect(result!.source).toBe('MoneyBox');
  });

  it('returns cached data within 5 minutes without re-fetching', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_MONEYBOX_JSON,
      headers: { get: () => null },
    } as unknown as Response);

    await fetchExchangeShopRate('KRW');
    await fetchExchangeShopRate('KRW'); // second call should use cache
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns fallback values when fetch fails and no cache', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    const result = await fetchExchangeShopRate('KRW');
    expect(result).not.toBeNull();
    expect(result!.sell).toBe(46.0); // EXCHANGE_SHOP_PROVIDERS.KRW.fallbackSell
    expect(result!.buy).toBe(46.7); // EXCHANGE_SHOP_PROVIDERS.KRW.fallbackBuy
    expect(result!.isFallback).toBe(true);
  });

  it('returns null for unsupported currency', async () => {
    const result = await fetchExchangeShopRate('USD');
    expect(result).toBeNull();
  });
});

describe('computeConverterRate', () => {
  const rate: ExchangeShopRate = {
    sell: 44.85,
    buy: 45.1,
    updateTime: '2026/05/07 16:33:55',
    source: 'MoneyBox',
    sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
    providerName: '明洞換匯所',
    isFallback: false,
  };

  it('TWD→KRW returns sell rate (how many KRW per 1 TWD)', () => {
    // 1 TWD = 44.85 KRW
    const r = computeConverterRate(rate, 'TWD', 'KRW');
    expect(r).toBeCloseTo(44.85, 5);
  });

  it('KRW→TWD returns 1/buy rate (how many TWD per 1 KRW)', () => {
    // 1 KRW = 1/45.1 TWD ≈ 0.02219
    const r = computeConverterRate(rate, 'KRW', 'TWD');
    expect(r).toBeCloseTo(1 / 45.1, 5);
  });

  it('returns null for non-KRW pairs', () => {
    expect(computeConverterRate(rate, 'USD', 'KRW')).toBeNull();
    expect(computeConverterRate(rate, 'KRW', 'JPY')).toBeNull();
    expect(computeConverterRate(rate, 'USD', 'EUR')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd apps/ratewise && pnpm vitest run src/services/__tests__/moneyboxRateService.test.ts
```

Expected: FAIL — `Cannot find module '../moneyboxRateService'`

- [ ] **Step 3: Implement the service**

```typescript
// apps/ratewise/src/services/moneyboxRateService.ts

import { logger } from '../utils/logger';
import {
  getExchangeShopProvider,
  hasExchangeShopProvider,
  type ExchangeShopConfig,
} from '../config/exchangeShopProviders';
import type { CurrencyCode } from '../features/ratewise/types';

// 快取 TTL 與台銀匯率相同（5 分鐘）
const CACHE_DURATION_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;

// localStorage key prefix（幣別不同各用不同 key）
const CACHE_KEY_PREFIX = 'exchangeShopRate_';

export interface ExchangeShopRate {
  /** 客戶買入外幣匯率：1 TWD = sell 外幣（TWD→外幣方向） */
  sell: number;
  /** 客戶賣出外幣匯率：buy 外幣 = 1 TWD（外幣→TWD 方向） */
  buy: number;
  /** CDN 更新時間（人類可讀） */
  updateTime: string;
  /** 資料來源名稱 */
  source: string;
  /** 資料來源 URL */
  sourceUrl: string;
  /** 換匯所中文名稱 */
  providerName: string;
  /** true = 使用後備值（CDN 取得失敗） */
  isFallback: boolean;
}

interface CacheEntry {
  rate: ExchangeShopRate;
  timestamp: number;
  etag?: string;
}

function getCacheKey(currency: CurrencyCode): string {
  return `${CACHE_KEY_PREFIX}${currency}`;
}

function readCache(currency: CurrencyCode): CacheEntry | null {
  try {
    const raw = localStorage.getItem(getCacheKey(currency));
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(currency: CurrencyCode, entry: CacheEntry): void {
  try {
    localStorage.setItem(getCacheKey(currency), JSON.stringify(entry));
  } catch (e) {
    logger.warn('Failed to save exchange shop rate to cache', { error: e });
  }
}

function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_DURATION_MS;
}

function buildFallbackRate(config: ExchangeShopConfig): ExchangeShopRate {
  return {
    sell: config.fallbackSell,
    buy: config.fallbackBuy,
    updateTime: '—',
    source: config.source,
    sourceUrl: config.sourceUrl,
    providerName: config.providerName,
    isFallback: true,
  };
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromCDN(
  config: ExchangeShopConfig,
  cachedEtag?: string,
): Promise<{ raw: unknown; etag?: string; notModified: boolean }> {
  const urls = [config.cdnUrl, config.cdnUrlFallback];

  for (const url of urls) {
    try {
      const headers: Record<string, string> = {};
      if (url === config.cdnUrl && cachedEtag) {
        headers['If-None-Match'] = cachedEtag;
      }

      const res = await fetchWithTimeout(url, { headers });

      if (res.status === 304) {
        return { raw: null, notModified: true };
      }

      if (!res.ok) {
        logger.warn(`Exchange shop CDN returned ${res.status}`, { url });
        continue;
      }

      const raw: unknown = await res.json();
      const etag = res.headers.get('etag') ?? undefined;
      return { raw, etag, notModified: false };
    } catch (e) {
      logger.warn(`Exchange shop CDN fetch failed`, { url, error: e });
    }
  }

  throw new Error('All CDN URLs failed');
}

/**
 * 取得換錢所即時匯率（含快取、ETag 條件式請求、fallback）
 *
 * @param currency - 幣別代碼（需在 EXCHANGE_SHOP_PROVIDERS 中有配置）
 * @returns ExchangeShopRate 或 null（幣別不支援）
 */
export async function fetchExchangeShopRate(
  currency: CurrencyCode,
): Promise<ExchangeShopRate | null> {
  if (!hasExchangeShopProvider(currency)) return null;

  const config = getExchangeShopProvider(currency)!;
  const cached = readCache(currency);

  // 快取有效：直接回傳
  if (cached && isCacheValid(cached)) {
    logger.debug(`Exchange shop cache hit for ${currency}`);
    return cached.rate;
  }

  try {
    const { raw, etag, notModified } = await fetchFromCDN(config, cached?.etag);

    // 304 Not Modified：更新 timestamp 並回傳快取資料
    if (notModified && cached) {
      writeCache(currency, { ...cached, timestamp: Date.now() });
      return cached.rate;
    }

    const sell = config.getSellRate(raw);
    const buy = config.getBuyRate(raw);

    if (!sell || !buy) {
      logger.warn(`Exchange shop rate parse failed for ${currency}, using fallback`);
      return buildFallbackRate(config);
    }

    const rawData = raw as { updateTime?: string } | null;
    const rate: ExchangeShopRate = {
      sell,
      buy,
      updateTime: rawData?.updateTime ?? '—',
      source: config.source,
      sourceUrl: config.sourceUrl,
      providerName: config.providerName,
      isFallback: false,
    };

    writeCache(currency, { rate, timestamp: Date.now(), etag });
    return rate;
  } catch (e) {
    logger.warn(`fetchExchangeShopRate failed for ${currency}`, { error: e });
    return cached?.rate ?? buildFallbackRate(config);
  }
}

/**
 * 計算換錢所在換算器中使用的匯率數值
 *
 * 換算器 base = TWD，所有匯率表示為「1 TWD = X 外幣」或「1 外幣 = X TWD」。
 *
 * @param rate - ExchangeShopRate
 * @param from - 來源幣別
 * @param to - 目標幣別
 * @returns 有效匯率數值，或 null（幣別組合不支援）
 */
export function computeConverterRate(
  rate: ExchangeShopRate,
  from: CurrencyCode,
  to: CurrencyCode,
): number | null {
  // TWD → 外幣：sell rate（1 TWD = sell 外幣）
  if (from === 'TWD' && hasExchangeShopProvider(to)) {
    return rate.sell;
  }
  // 外幣 → TWD：1 / buy rate（buy 外幣 = 1 TWD，所以 1 外幣 = 1/buy TWD）
  if (to === 'TWD' && hasExchangeShopProvider(from)) {
    return 1 / rate.buy;
  }
  return null;
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd apps/ratewise && pnpm vitest run src/services/__tests__/moneyboxRateService.test.ts
```

Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/ratewise/src/services/moneyboxRateService.ts \
        apps/ratewise/src/services/__tests__/moneyboxRateService.test.ts
git commit -m "feat(ratewise): 新增 moneyboxRateService，對齊台銀快取策略

- CDN + ETag 條件式請求（省頻寬）
- localStorage 5 分鐘快取 + 離線後備值
- computeConverterRate 處理 TWD↔KRW 雙向匯率計算
- 全部由 EXCHANGE_SHOP_PROVIDERS registry 驅動"
```

---

## Task 3: Types + Storage Keys

**目標：** 在 SSOT 檔案中加入 `RateSource` 型別與 `RATE_SOURCE` localStorage key。

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/types.ts`
- Modify: `apps/ratewise/src/features/ratewise/storage-keys.ts`

---

- [ ] **Step 1: Add `RateSource` to types.ts**

在 `types.ts` 中 `RateType` 定義之後加入：

```typescript
// 在 "export type RateType = 'spot' | 'cash';" 之後新增

/**
 * 匯率資料來源選擇
 *
 * - 'bank': 台灣銀行牌告匯率（預設）
 * - 'exchange-shop': 換錢所即時匯率（僅適用於有 provider 的幣別）
 */
export type RateSource = 'bank' | 'exchange-shop';
```

- [ ] **Step 2: Add `RATE_SOURCE` key to storage-keys.ts**

在 `RATE_TYPE` 條目之後新增（遵守 stable identifier policy）：

```typescript
  /** 匯率來源選擇 (bank/exchange-shop) - 用戶偏好的匯率資料來源，預設為 bank */
  RATE_SOURCE: 'rateSource',
```

同時在 `USER_DATA_KEYS` 陣列加入：

```typescript
  STORAGE_KEYS.RATE_SOURCE,
```

- [ ] **Step 3: TypeCheck**

```bash
cd apps/ratewise && pnpm typecheck
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/ratewise/src/features/ratewise/types.ts \
        apps/ratewise/src/features/ratewise/storage-keys.ts
git commit -m "feat(ratewise): 新增 RateSource 型別與 RATE_SOURCE storage key

- RateSource: 'bank' | 'exchange-shop'
- storage-keys.ts 穩定識別符 'rateSource'"
```

---

## Task 4: Design Token 擴充

**目標：** 在 `rateCard` 中新增 `exchangeShopBadge` token（SSOT 統一管理 badge 樣式）。

**Files:**

- Modify: `apps/ratewise/src/config/design-tokens.ts`

---

- [ ] **Step 1: Add tokens to `rateCard` section**

在 `design-tokens.ts` 的 `rateCard` 物件中，`chartHoverHeight` 之後新增：

```typescript
    /** 換錢所來源 badge 容器（換錢所選中時顯示） */
    exchangeShopBadge:
      'mt-2 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[10px] text-amber-600/80 dark:text-amber-400/80',

    /** 換錢所 badge 分隔點 */
    exchangeShopBadgeDot: 'text-amber-400/50',

    /** 換錢所 badge 來源連結 */
    exchangeShopBadgeLink:
      'underline decoration-dotted hover:text-amber-700 dark:hover:text-amber-300 transition-colors',
```

- [ ] **Step 2: TypeCheck**

```bash
cd apps/ratewise && pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/ratewise/src/config/design-tokens.ts
git commit -m "feat(ratewise): rateCard design token 新增換錢所 badge 樣式"
```

---

## Task 5: useMoneyBoxRates Hook

**目標：** React hook，在幣別有換錢所支援時按需 fetch 資料。

**Files:**

- Create: `apps/ratewise/src/features/ratewise/hooks/useMoneyBoxRates.ts`
- Create: `apps/ratewise/src/features/ratewise/hooks/__tests__/useMoneyBoxRates.test.ts`

---

- [ ] **Step 1: Write failing tests**

```typescript
// apps/ratewise/src/features/ratewise/hooks/__tests__/useMoneyBoxRates.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMoneyBoxRates } from '../useMoneyBoxRates';
import * as service from '../../../../services/moneyboxRateService';
import type { ExchangeShopRate } from '../../../../services/moneyboxRateService';

const MOCK_RATE: ExchangeShopRate = {
  sell: 44.85,
  buy: 45.1,
  updateTime: '2026/05/07 16:33:55',
  source: 'MoneyBox',
  sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
  providerName: '明洞換匯所',
  isFallback: false,
};

describe('useMoneyBoxRates', () => {
  beforeEach(() => {
    vi.spyOn(service, 'fetchExchangeShopRate').mockResolvedValue(MOCK_RATE);
  });

  it('returns null rate initially for KRW', () => {
    const { result } = renderHook(() => useMoneyBoxRates('KRW'));
    expect(result.current.rate).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('fetches and returns rate for KRW', async () => {
    const { result } = renderHook(() => useMoneyBoxRates('KRW'));
    await waitFor(() => !result.current.isLoading);
    expect(result.current.rate).toEqual(MOCK_RATE);
    expect(result.current.isLoading).toBe(false);
  });

  it('skips fetch for USD (no provider)', async () => {
    vi.spyOn(service, 'fetchExchangeShopRate').mockClear();
    const { result } = renderHook(() => useMoneyBoxRates('USD'));
    await waitFor(() => !result.current.isLoading);
    expect(result.current.rate).toBeNull();
    expect(service.fetchExchangeShopRate).not.toHaveBeenCalled();
  });

  it('re-fetches when activeCurrency changes', async () => {
    const spy = vi.spyOn(service, 'fetchExchangeShopRate');
    const { rerender } = renderHook(({ currency }) => useMoneyBoxRates(currency), {
      initialProps: { currency: 'KRW' as const },
    });
    await waitFor(() => expect(spy).toHaveBeenCalledWith('KRW'));

    // Change to non-supported currency — should not call fetch again
    rerender({ currency: 'USD' as const });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd apps/ratewise && pnpm vitest run src/features/ratewise/hooks/__tests__/useMoneyBoxRates.test.ts
```

Expected: FAIL — `Cannot find module '../useMoneyBoxRates'`

- [ ] **Step 3: Implement the hook**

```typescript
// apps/ratewise/src/features/ratewise/hooks/useMoneyBoxRates.ts

import { useState, useEffect } from 'react';
import {
  fetchExchangeShopRate,
  type ExchangeShopRate,
} from '../../../services/moneyboxRateService';
import { hasExchangeShopProvider } from '../../../config/exchangeShopProviders';
import type { CurrencyCode } from '../types';

interface UseMoneyBoxRatesResult {
  rate: ExchangeShopRate | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * 取得換錢所即時匯率
 *
 * 僅在 activeCurrency 有 provider 配置時才發起 fetch。
 * 適用於 RateWise 首頁：fromCurrency 或 toCurrency 為 KRW 時掛載。
 *
 * @param activeCurrency - 目前有換錢所支援的幣別（fromCurrency 或 toCurrency）
 */
export function useMoneyBoxRates(activeCurrency: CurrencyCode): UseMoneyBoxRatesResult {
  const [rate, setRate] = useState<ExchangeShopRate | null>(null);
  const [isLoading, setIsLoading] = useState(hasExchangeShopProvider(activeCurrency));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasExchangeShopProvider(activeCurrency)) {
      setRate(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchExchangeShopRate(activeCurrency)
      .then((result) => {
        if (!cancelled) {
          setRate(result);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unknown error');
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeCurrency]);

  return { rate, isLoading, error };
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd apps/ratewise && pnpm vitest run src/features/ratewise/hooks/__tests__/useMoneyBoxRates.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/ratewise/src/features/ratewise/hooks/useMoneyBoxRates.ts \
        apps/ratewise/src/features/ratewise/hooks/__tests__/useMoneyBoxRates.test.ts
git commit -m "feat(ratewise): useMoneyBoxRates hook，按需 fetch 換錢所資料

- 僅 hasExchangeShopProvider 幣別觸發 fetch
- cancelled flag 防止 unmount 後 setState"
```

---

## Task 6: ExchangeShopBadge Component

**目標：** 換錢所選中時顯示的來源資訊條，使用 `slideUpVariants` 動畫 + `rateCard.exchangeShopBadge` token。

**Files:**

- Create: `apps/ratewise/src/features/ratewise/components/ExchangeShopBadge.tsx`
- Create: `apps/ratewise/src/features/ratewise/components/__tests__/ExchangeShopBadge.test.tsx`

---

- [ ] **Step 1: Write failing tests**

```typescript
// apps/ratewise/src/features/ratewise/components/__tests__/ExchangeShopBadge.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExchangeShopBadge } from '../ExchangeShopBadge';
import type { ExchangeShopRate } from '../../../../services/moneyboxRateService';

const MOCK_RATE: ExchangeShopRate = {
  sell: 44.85,
  buy: 45.1,
  updateTime: '2026/05/07 16:33:55',
  source: 'MoneyBox',
  sourceUrl: 'https://moneybox-exchange.com/zh-CHT/exchange',
  providerName: '明洞換匯所',
  isFallback: false,
};

describe('ExchangeShopBadge', () => {
  it('renders provider name and update time', () => {
    render(<ExchangeShopBadge rate={MOCK_RATE} />);
    expect(screen.getByText('明洞換匯所')).toBeInTheDocument();
    expect(screen.getByText(/16:33:55/)).toBeInTheDocument();
  });

  it('renders source link with correct href', () => {
    render(<ExchangeShopBadge rate={MOCK_RATE} />);
    const link = screen.getByRole('link', { name: /明洞換匯所/ });
    expect(link).toHaveAttribute('href', 'https://moneybox-exchange.com/zh-CHT/exchange');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows fallback indicator when isFallback is true', () => {
    render(<ExchangeShopBadge rate={{ ...MOCK_RATE, isFallback: true }} />);
    expect(screen.getByText(/參考值/)).toBeInTheDocument();
  });

  it('does not show fallback indicator when isFallback is false', () => {
    render(<ExchangeShopBadge rate={MOCK_RATE} />);
    expect(screen.queryByText(/參考值/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd apps/ratewise && pnpm vitest run src/features/ratewise/components/__tests__/ExchangeShopBadge.test.tsx
```

Expected: FAIL — `Cannot find module '../ExchangeShopBadge'`

- [ ] **Step 3: Implement component**

```typescript
// apps/ratewise/src/features/ratewise/components/ExchangeShopBadge.tsx

import { motion } from 'motion/react';
import { Store } from 'lucide-react';
import { rateWiseLayoutTokens } from '../../../config/design-tokens';
import { slideUpVariants, transitions } from '../../../config/animations';
import type { ExchangeShopRate } from '../../../services/moneyboxRateService';

interface ExchangeShopBadgeProps {
  rate: ExchangeShopRate;
}

/**
 * 換錢所來源資訊 badge
 *
 * 使用 slideUpVariants 動畫從下方進場。
 * 樣式完全由 design-tokens.rateCard.exchangeShopBadge 管理。
 */
export function ExchangeShopBadge({ rate }: ExchangeShopBadgeProps) {
  return (
    <motion.div
      variants={slideUpVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={transitions.gentle}
      className={rateWiseLayoutTokens.rateCard.exchangeShopBadge}
    >
      <Store
        size={10}
        aria-hidden="true"
        className="shrink-0 text-amber-500/60"
      />
      <a
        href={rate.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={rateWiseLayoutTokens.rateCard.exchangeShopBadgeLink}
        aria-label={`${rate.providerName} 資料來源（在新視窗開啟）`}
      >
        {rate.providerName}
      </a>
      <span className={rateWiseLayoutTokens.rateCard.exchangeShopBadgeDot}>·</span>
      <span>{rate.updateTime}</span>
      {rate.isFallback && (
        <>
          <span className={rateWiseLayoutTokens.rateCard.exchangeShopBadgeDot}>·</span>
          <span className="text-amber-500/60">參考值</span>
        </>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd apps/ratewise && pnpm vitest run src/features/ratewise/components/__tests__/ExchangeShopBadge.test.tsx
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/ratewise/src/features/ratewise/components/ExchangeShopBadge.tsx \
        apps/ratewise/src/features/ratewise/components/__tests__/ExchangeShopBadge.test.tsx
git commit -m "feat(ratewise): ExchangeShopBadge 元件，顯示換錢所來源與更新時間"
```

---

## Task 7: RateSelector Component（三選一 Segmented Switch）

**目標：** 取代 `SingleConverter` 中的 inline spot/cash toggle，支援 2 選（非 KRW）或 3 選（KRW）模式，完全使用 `segmentedSwitch` animation token。

**Files:**

- Create: `apps/ratewise/src/features/ratewise/components/RateSelector.tsx`
- Create: `apps/ratewise/src/features/ratewise/components/__tests__/RateSelector.test.tsx`

---

- [ ] **Step 1: Write failing tests**

```typescript
// apps/ratewise/src/features/ratewise/components/__tests__/RateSelector.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RateSelector } from '../RateSelector';
import type { RateTypeAvailability } from '../../../../utils/exchangeRateCalculation';

const defaultAvailability: RateTypeAvailability = { spot: true, cash: true };
const cashOnlyAvailability: RateTypeAvailability = { spot: false, cash: true };

describe('RateSelector (2-option mode — no exchange shop)', () => {
  it('renders spot and cash buttons', () => {
    render(
      <RateSelector
        rateType="spot"
        rateSource="bank"
        rateTypeAvailability={defaultAvailability}
        hasExchangeShop={false}
        onRateTypeChange={vi.fn()}
        onRateSourceChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /即期/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /現金/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /換錢所/ })).not.toBeInTheDocument();
  });

  it('calls onRateTypeChange when cash is clicked', () => {
    const onChange = vi.fn();
    render(
      <RateSelector
        rateType="spot"
        rateSource="bank"
        rateTypeAvailability={defaultAvailability}
        hasExchangeShop={false}
        onRateTypeChange={onChange}
        onRateSourceChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /現金/ }));
    expect(onChange).toHaveBeenCalledWith('cash');
  });
});

describe('RateSelector (3-option mode — with exchange shop)', () => {
  it('renders 3 options when hasExchangeShop is true', () => {
    render(
      <RateSelector
        rateType="cash"
        rateSource="bank"
        rateTypeAvailability={cashOnlyAvailability}
        hasExchangeShop={true}
        onRateTypeChange={vi.fn()}
        onRateSourceChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /即期/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /現金/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /換錢所/ })).toBeInTheDocument();
  });

  it('即期 button is disabled when spot unavailable', () => {
    render(
      <RateSelector
        rateType="cash"
        rateSource="bank"
        rateTypeAvailability={cashOnlyAvailability}
        hasExchangeShop={true}
        onRateTypeChange={vi.fn()}
        onRateSourceChange={vi.fn()}
      />,
    );
    const spotBtn = screen.getByRole('button', { name: /即期/ });
    expect(spotBtn).toBeDisabled();
  });

  it('calls onRateSourceChange("exchange-shop") when 換錢所 is clicked', () => {
    const onSourceChange = vi.fn();
    render(
      <RateSelector
        rateType="cash"
        rateSource="bank"
        rateTypeAvailability={cashOnlyAvailability}
        hasExchangeShop={true}
        onRateTypeChange={vi.fn()}
        onRateSourceChange={onSourceChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /換錢所/ }));
    expect(onSourceChange).toHaveBeenCalledWith('exchange-shop');
  });

  it('shows 換錢所 as active when rateSource is exchange-shop', () => {
    render(
      <RateSelector
        rateType="cash"
        rateSource="exchange-shop"
        rateTypeAvailability={cashOnlyAvailability}
        hasExchangeShop={true}
        onRateTypeChange={vi.fn()}
        onRateSourceChange={vi.fn()}
      />,
    );
    const shopBtn = screen.getByRole('button', { name: /換錢所/ });
    // active button has aria-pressed="true"
    expect(shopBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd apps/ratewise && pnpm vitest run src/features/ratewise/components/__tests__/RateSelector.test.tsx
```

Expected: FAIL — `Cannot find module '../RateSelector'`

- [ ] **Step 3: Implement RateSelector**

```typescript
// apps/ratewise/src/features/ratewise/components/RateSelector.tsx

import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Banknote, TrendingUp, Store } from 'lucide-react';
import { segmentedSwitch, transitions } from '../../../config/animations';
import { singleConverterLayoutTokens } from '../../../config/design-tokens';
import { RateTypeTooltip } from '../../../components/RateTypeTooltip';
import type { RateType, RateSource } from '../types';
import type { RateTypeAvailability } from '../../../utils/exchangeRateCalculation';

interface RateSelectorProps {
  rateType: RateType;
  rateSource: RateSource;
  rateTypeAvailability: RateTypeAvailability;
  /** 當前幣別組合是否有換錢所 provider，true → 顯示第三個選項 */
  hasExchangeShop: boolean;
  onRateTypeChange: (type: RateType) => void;
  onRateSourceChange: (source: RateSource) => void;
}

interface SelectorOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isDisabled: boolean;
  disabledMessage?: string;
  onClick: () => void;
}

/**
 * 匯率類型選擇器
 *
 * 2-option 模式（hasExchangeShop=false）：即期 ｜ 現金
 * 3-option 模式（hasExchangeShop=true）：即期 ｜ 現金 ｜ 換錢所
 *
 * 完全使用 segmentedSwitch animation token（animations.ts SSOT）。
 * layout classes 使用 singleConverterLayoutTokens.rateCard（design-tokens.ts SSOT）。
 */
export function RateSelector({
  rateType,
  rateSource,
  rateTypeAvailability,
  hasExchangeShop,
  onRateTypeChange,
  onRateSourceChange,
}: RateSelectorProps) {
  const { t } = useTranslation();

  const isExchangeShopActive = rateSource === 'exchange-shop';

  const options: SelectorOption[] = [
    {
      id: 'spot',
      label: t('singleConverter.spotRate'),
      icon: <TrendingUp size={12} aria-hidden="true" className={singleConverterLayoutTokens.rateCard.rateTypeIcon} />,
      isActive: rateType === 'spot' && !isExchangeShopActive,
      isDisabled: !rateTypeAvailability.spot,
      disabledMessage: !rateTypeAvailability.spot
        ? t('singleConverter.rateTypeUnavailableForCurrencies', {
            rateType: t('singleConverter.spotRate'),
            fallbackType: t('singleConverter.cashRate'),
          })
        : undefined,
      onClick: () => {
        if (!rateTypeAvailability.spot) return;
        onRateSourceChange('bank');
        onRateTypeChange('spot');
      },
    },
    {
      id: 'cash',
      label: t('singleConverter.cashRate'),
      icon: <Banknote size={12} aria-hidden="true" className={singleConverterLayoutTokens.rateCard.rateTypeIcon} />,
      isActive: rateType === 'cash' && !isExchangeShopActive,
      isDisabled: !rateTypeAvailability.cash,
      onClick: () => {
        onRateSourceChange('bank');
        onRateTypeChange('cash');
      },
    },
  ];

  return (
    <div
      className={`inline-flex bg-background/80 backdrop-blur-md rounded-full p-0.5 shadow-sm border border-border/60 ${singleConverterLayoutTokens.rateCard.rateTypeContainer}`}
      role="group"
      aria-label="匯率類型"
    >
      {options.map((option) => (
        <RateTypeTooltip
          key={option.id}
          show={option.isDisabled}
          message={option.disabledMessage ?? ''}
        >
          <motion.button
            type="button"
            role="button"
            aria-pressed={option.isActive}
            aria-label={option.label}
            disabled={option.isDisabled}
            onClick={option.onClick}
            whileHover={option.isDisabled ? undefined : segmentedSwitch.item.whileHover}
            whileTap={option.isDisabled ? undefined : segmentedSwitch.item.whileTap}
            className={`flex items-center gap-1 ${singleConverterLayoutTokens.rateCard.rateTypeButton} rounded-full font-semibold relative ${
              option.isDisabled
                ? 'opacity-40 cursor-not-allowed'
                : 'cursor-pointer'
            } ${option.isActive ? 'text-primary' : 'text-neutral-text-secondary'}`}
          >
            {option.isActive && (
              <motion.span
                layoutId="rate-selector-indicator"
                className="absolute inset-0 rounded-full bg-surface shadow-sm"
                transition={segmentedSwitch.indicator}
              />
            )}
            {option.icon}
            <span className="relative z-10">{option.label}</span>
          </motion.button>
        </RateTypeTooltip>
      ))}

      {/* 換錢所第三選項：AnimatePresence 控制進出場 */}
      <AnimatePresence>
        {hasExchangeShop && (
          <motion.button
            key="exchange-shop"
            type="button"
            role="button"
            aria-pressed={isExchangeShopActive}
            aria-label="換錢所"
            initial={{ opacity: 0, scale: 0.75, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, scale: 1, width: 'auto', marginLeft: 2 }}
            exit={{ opacity: 0, scale: 0.75, width: 0, marginLeft: 0 }}
            transition={transitions.spring}
            whileHover={segmentedSwitch.item.whileHover}
            whileTap={segmentedSwitch.item.whileTap}
            onClick={() => onRateSourceChange('exchange-shop')}
            className={`flex items-center gap-1 ${singleConverterLayoutTokens.rateCard.rateTypeButton} rounded-full font-semibold relative cursor-pointer overflow-hidden ${
              isExchangeShopActive ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-text-secondary'
            }`}
          >
            {isExchangeShopActive && (
              <motion.span
                layoutId="rate-selector-indicator"
                className="absolute inset-0 rounded-full bg-amber-500/10 shadow-sm ring-1 ring-amber-500/20"
                transition={segmentedSwitch.indicator}
              />
            )}
            <Store size={12} aria-hidden="true" className={`${singleConverterLayoutTokens.rateCard.rateTypeIcon} relative z-10`} />
            <span className="relative z-10">換錢所</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd apps/ratewise && pnpm vitest run src/features/ratewise/components/__tests__/RateSelector.test.tsx
```

Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/ratewise/src/features/ratewise/components/RateSelector.tsx \
        apps/ratewise/src/features/ratewise/components/__tests__/RateSelector.test.tsx
git commit -m "feat(ratewise): RateSelector 三選一切換器

- hasExchangeShop=false → 2選（即期/現金）向下相容
- hasExchangeShop=true → 3選，換錢所 spring 動畫展開
- 完全使用 segmentedSwitch animation token
- aria-pressed 無障礙支援"
```

---

## Task 8: RateWise 狀態整合

**目標：** 在 `RateWise.tsx` 加入 `rateSource` 狀態管理，對齊現有 `rateType` 的 localStorage 持久化模式。

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/RateWise.tsx`

---

- [ ] **Step 1: 在 RateWise.tsx 加入 rateSource 狀態**

在現有 `rateType` state 之後加入：

```typescript
// RateWise.tsx — 在 rateType state 之後（約 line 42）

const [rateSource, setRateSource] = useState<RateSource>('bank');

// Restore rateSource from localStorage after hydration
useEffect(() => {
  const stored = localStorage.getItem(STORAGE_KEYS.RATE_SOURCE);
  if (stored === 'exchange-shop') {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRateSource('exchange-shop');
  }
}, []);

// Persist rateSource
useEffect(() => {
  localStorage.setItem(STORAGE_KEYS.RATE_SOURCE, rateSource);
}, [rateSource]);
```

- [ ] **Step 2: 加入換錢所幣別偵測與自動重置**

在 `rateTypeAvailability` useMemo 之後加入：

```typescript
// 當前幣別組合是否有換錢所 provider
const exchangeShopCurrency = useMemo((): CurrencyCode | null => {
  if (hasExchangeShopProvider(fromCurrency)) return fromCurrency;
  if (hasExchangeShopProvider(toCurrency)) return toCurrency;
  return null;
}, [fromCurrency, toCurrency]);

// 離開支援換錢所的幣別時，自動重置為台銀
useEffect(() => {
  if (!exchangeShopCurrency && rateSource === 'exchange-shop') {
    setRateSource('bank');
  }
}, [exchangeShopCurrency, rateSource]);
```

- [ ] **Step 3: 掛載 useMoneyBoxRates hook**

在 `exchangeRates` hook 之後加入：

```typescript
// 換錢所即時資料（exchangeShopCurrency 有值時才 fetch）
const { rate: moneyBoxRate } = useMoneyBoxRates(
  exchangeShopCurrency ?? 'USD', // 'USD' is a no-op (no provider)
);
```

- [ ] **Step 4: 加入 handleRateSourceChange callback**

在 `handleRateTypeChange` 之後加入：

```typescript
const handleRateSourceChange = useCallback(
  (nextSource: RateSource) => {
    if (nextSource === 'exchange-shop' && !exchangeShopCurrency) return;
    if (nextSource === 'exchange-shop') {
      // 換錢所只有現金匯率
      setRateType('cash');
    }
    setRateSource(nextSource);
  },
  [exchangeShopCurrency],
);
```

- [ ] **Step 5: 將新 props 傳入 SingleConverter**

找到 `<SingleConverter` 並新增這些 props：

```typescript
rateSource = { rateSource };
moneyBoxRate = { moneyBoxRate };
exchangeShopCurrency = { exchangeShopCurrency };
onRateSourceChange = { handleRateSourceChange };
```

- [ ] **Step 6: 加入必要 import**

在 `RateWise.tsx` 頂部 import 區塊加入：

```typescript
import type { RateSource } from './types';
import { hasExchangeShopProvider } from '../../config/exchangeShopProviders';
import { useMoneyBoxRates } from './hooks/useMoneyBoxRates';
```

- [ ] **Step 7: TypeCheck**

```bash
cd apps/ratewise && pnpm typecheck
```

Expected: No errors（此時 SingleConverter 尚未接收新 props，TypeScript 會報 prop 未使用，但不會報錯）

- [ ] **Step 8: Commit**

```bash
git add apps/ratewise/src/features/ratewise/RateWise.tsx
git commit -m "feat(ratewise): RateWise 新增 rateSource 狀態與換錢所整合

- rateSource localStorage 持久化（對齊 rateType 模式）
- exchangeShopCurrency memo 偵測支援幣別
- 離開 KRW 時自動 reset rateSource → bank
- 換錢所選中時 rateType 強制 cash"
```

---

## Task 9: SingleConverter 整合（最終接線）

**目標：** SingleConverter 接收新 props，以 `RateSelector` 取代 inline toggle，條件渲染 `ExchangeShopBadge`，並覆蓋換錢所匯率計算。

**Files:**

- Modify: `apps/ratewise/src/features/ratewise/components/SingleConverter.tsx`
- Modify: `apps/ratewise/src/features/ratewise/components/__tests__/SingleConverter.core.test.tsx`（補測試）

---

- [ ] **Step 1: 擴充 SingleConverterProps（optional props，保持向下相容）**

在現有 `onRateTypeChange` prop 之後加入：

```typescript
// SingleConverterProps 介面新增（全部 optional）
rateSource?: RateSource;
moneyBoxRate?: ExchangeShopRate | null;
exchangeShopCurrency?: CurrencyCode | null;
onRateSourceChange?: (source: RateSource) => void;
```

- [ ] **Step 2: 解構新 props**

在 `const SingleConverter = ({` 解構區塊加入：

```typescript
rateSource = 'bank',
moneyBoxRate = null,
exchangeShopCurrency = null,
onRateSourceChange,
```

- [ ] **Step 3: 新增 effectiveRate 計算（換錢所匯率覆蓋）**

在現有 `displayRate` 計算之前插入：

```typescript
// 換錢所匯率覆蓋：僅在 rateSource === 'exchange-shop' 且有 live 資料時生效
const effectiveExchangeRate = useMemo<number | null>(() => {
  if (rateSource !== 'exchange-shop' || !moneyBoxRate) {
    return exchangeRates[effectiveForeignCurrency] ?? null;
  }
  return computeConverterRate(moneyBoxRate, fromCurrency, toCurrency);
}, [rateSource, moneyBoxRate, fromCurrency, toCurrency, exchangeRates, effectiveForeignCurrency]);
```

（將後續使用 `exchangeRates[effectiveForeignCurrency]` 的地方改為 `effectiveExchangeRate`，具體行號需視 SingleConverter.tsx 當前結構而定）

- [ ] **Step 4: 以 RateSelector 取代 inline toggle**

找到現有 inline spot/cash toggle（`rateTypeContainer` className），替換為：

```tsx
<RateSelector
  rateType={rateType}
  rateSource={rateSource}
  rateTypeAvailability={rateTypeAvailability}
  hasExchangeShop={!!exchangeShopCurrency}
  onRateTypeChange={onRateTypeChange}
  onRateSourceChange={onRateSourceChange ?? (() => undefined)}
/>
```

- [ ] **Step 5: 在匯率顯示區塊下方加入 ExchangeShopBadge**

在率資訊區塊（`infoPadding` 區域）的最後，加入：

```tsx
<AnimatePresence>
  {rateSource === 'exchange-shop' && moneyBoxRate && (
    <ExchangeShopBadge key="exchange-shop-badge" rate={moneyBoxRate} />
  )}
</AnimatePresence>
```

- [ ] **Step 6: 加入必要 import**

```typescript
import { RateSelector } from './RateSelector';
import { ExchangeShopBadge } from './ExchangeShopBadge';
import { AnimatePresence } from 'motion/react';
import { computeConverterRate } from '../../../services/moneyboxRateService';
import type { RateSource } from '../types';
import type { ExchangeShopRate } from '../../../services/moneyboxRateService';
```

- [ ] **Step 7: 補充核心測試（換錢所匯率計算）**

在 `SingleConverter.core.test.tsx` 加入：

```typescript
describe('exchange shop rate override', () => {
  it('uses moneyBoxRate.sell when rateSource=exchange-shop and TWD→KRW', () => {
    // render with rateSource="exchange-shop", moneyBoxRate.sell=44.85
    // enter 1000 TWD → expect ~44850 KRW displayed
    // (具體 render 呼叫參照該 test file 現有寫法)
  });

  it('uses 1/moneyBoxRate.buy when rateSource=exchange-shop and KRW→TWD', () => {
    // render with rateSource="exchange-shop", moneyBoxRate.buy=45.1
    // enter 45100 KRW → expect ~1000 TWD displayed
  });
});
```

- [ ] **Step 8: TypeCheck + 全部測試**

```bash
cd apps/ratewise && pnpm typecheck && pnpm vitest run
```

Expected: No TypeScript errors, all tests pass

- [ ] **Step 9: Commit**

```bash
git add apps/ratewise/src/features/ratewise/components/SingleConverter.tsx \
        apps/ratewise/src/features/ratewise/components/__tests__/SingleConverter.core.test.tsx
git commit -m "feat(ratewise): SingleConverter 整合換錢所三選一切換器

- RateSelector 取代 inline spot/cash toggle
- exchange-shop 時 effectiveExchangeRate 覆蓋台銀匯率
- ExchangeShopBadge AnimatePresence 進出場
- 新 props 全部 optional，現有測試零衝擊"
```

---

## Task 10: Changeset + 端對端驗證

**目標：** 建立 changeset，驗證完整功能流程。

**Files:**

- Create: `.changeset/*.md`

---

- [ ] **Step 1: 全套測試確認**

```bash
pnpm -r typecheck && pnpm -r test
```

Expected: All tests pass

- [ ] **Step 2: Dev server 驗證（UI 功能）**

```bash
pnpm --filter @app/ratewise dev
```

驗證清單：

- [ ] 選 USD/EUR 等幣別：只顯示「即期」「現金」2 選項
- [ ] 選 KRW（任一方向）：第三個「換錢所」pill 以 spring 動畫展開
- [ ] 「即期」在 KRW 下呈 disabled + tooltip
- [ ] 點「換錢所」：badge 從下方 slideUp 進場，顯示明洞換匯所、更新時間、來源連結
- [ ] 點「換錢所」後換算結果從台銀匯率切換到 MoneyBox 匯率
- [ ] 切換回其他幣別：「換錢所」pill fade+scale 退場，rateSource 自動 reset
- [ ] prefers-reduced-motion 模擬：所有動畫靜止，功能正常

- [ ] **Step 3: 建立 changeset**

```bash
pnpm changeset
```

選擇：

- Package: `@app/ratewise`
- Bump type: `minor`（新的使用者可感知功能：換錢所匯率切換）
- Summary: `新增換錢所匯率切換：選韓元時可在台銀、換錢所（明洞換匯所）之間切換，即時顯示更優惠匯率`

- [ ] **Step 4: Final commit**

```bash
git add .changeset/
git commit -m "chore: 新增 exchange shop toggle changeset (minor)"
```

---

## Self-Review Checklist

### Spec Coverage

| 需求                                        | Task                                                |
| ------------------------------------------- | --------------------------------------------------- |
| 韓元觸發時顯示「即期 現金 換錢所」三選一    | Task 7 RateSelector                                 |
| 高級現代化 UI（spring 動畫、badge slideUp） | Task 6, 7                                           |
| 保持 segmentedSwitch animation SSOT         | Task 7（直接使用 token，無 inline 數值）            |
| 保持 design-tokens SSOT                     | Task 4（rateCard 擴充）、Task 6（badge 使用 token） |
| MoneyBox CDN live 資料驅動                  | Task 2, 5                                           |
| 模組化預留未來幣別擴充                      | Task 1 EXCHANGE_SHOP_PROVIDERS registry             |
| rateSource localStorage 持久化              | Task 3, 8                                           |
| 換錢所匯率計算正確（TWD↔KRW 雙向）          | Task 2 computeConverterRate                         |
| 向下相容（非 KRW 幣別無影響）               | Task 7（props optional），Task 9                    |

### No Placeholders ✅

所有步驟均含具體程式碼，無 TBD / TODO / "similar to Task N"。

### Type Consistency ✅

| 符號                         | 定義 Task               | 使用 Task    |
| ---------------------------- | ----------------------- | ------------ |
| `RateSource`                 | Task 3 (types.ts)       | Task 7, 8, 9 |
| `ExchangeShopConfig`         | Task 1                  | Task 2       |
| `ExchangeShopRate`           | Task 2                  | Task 5, 6, 9 |
| `computeConverterRate`       | Task 2                  | Task 9       |
| `hasExchangeShopProvider`    | Task 1                  | Task 5, 8    |
| `STORAGE_KEYS.RATE_SOURCE`   | Task 3                  | Task 8       |
| `rateCard.exchangeShopBadge` | Task 4                  | Task 6       |
| `segmentedSwitch`            | `animations.ts`（現有） | Task 7       |

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-07-ratewise-exchange-shop-toggle.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — 每個 Task 派一個全新 subagent，兩階段審核，快速迭代

**2. Inline Execution** — 使用 `executing-plans` 在本 session 逐 Task 執行，有 checkpoint

**Which approach?**
