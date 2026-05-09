# Rate Provider SSOT Design

## Goal

建立可長期維護的匯率來源架構。現在只使用台灣銀行與 MoneyBox，先預留 provider 資料模型；未來銀行 provider 超過一家時，再啟用最佳銀行推薦、銀行選單與使用者指定銀行。

## Current State

目前 `RateSource` 只有 `bank` / `exchange-shop` 兩類。這足夠描述「銀行 vs 換錢所」，但不能描述「哪一家銀行」。換錢所已經有 `exchangeShopProviders.ts` registry；銀行目前沒有 provider registry。轉換歷史也只存 `from/to/amount/result/timestamp`，無法在未來準確篩選即期、現金、換錢所或特定 provider。

## Design Principles

- 分類和 provider 分離：分類用於 UI 篩選與簡潔標籤，provider 用於推薦、指定來源與審計。
- 推薦能力先做延遲啟用設計：目前不暴露多銀行推薦 UI；銀行 provider 數量大於 1 時才啟用推薦與選單。
- 推薦邏輯必須是純領域函式：未來啟用時，元件只顯示結果，不直接計算哪家銀行最好。
- 歷史記錄存可查詢欄位，不存展示文案：未來改文案不需要 migration。
- UI 預設簡潔：歷史列表只顯示時間與 `即期` / `現金` / `換錢所` 分類，不顯示 `providerId`、`unitRate`、fallback 狀態。
- 舊資料不可硬猜：舊歷史缺來源欄位時標示為 legacy/default，不偽造精確來源。

## Source Model

新增兩層來源模型。Phase 1 會先存 `sourceKind + providerId`，但不啟用多銀行選單：

```ts
export type RateSourceKind = 'bank' | 'exchange-shop';

export type RateProviderId = 'bot' | 'moneybox' | string;

export type ProviderSelectionMode = 'best' | 'manual';

export interface RateProviderRef {
  sourceKind: RateSourceKind;
  providerId: RateProviderId;
}

export interface RateProviderPreference {
  mode: ProviderSelectionMode;
  manualProvider?: RateProviderRef;
}

export interface ResolvedRateProvider {
  selectionMode: ProviderSelectionMode;
  sourceKind: RateSourceKind;
  providerId: RateProviderId;
  reason: 'manual' | 'best-rate' | 'fallback-default' | 'unsupported-pair';
}
```

`RateSource` 可保留作為相容層，但新邏輯應以 `RateSourceKind + providerId` 為主。

Phase 1 的 selection mode 固定為 `manual`。`best` 只作為未來啟用多銀行推薦時的預留型別，不進目前 UI。

## Provider Registry

建立通用 provider registry，讓銀行與換錢所用同一個註冊形狀：

```ts
export interface RateProviderConfig {
  id: RateProviderId;
  sourceKind: RateSourceKind;
  label: string;
  shortLabel: string;
  supportedRateTypes: RateType[];
  supportedCurrencies: CurrencyCode[] | 'all';
  priority: number;
  isDefault: boolean;
}
```

第一階段 provider：

- `bot`: 台灣銀行，`sourceKind='bank'`，預設銀行 provider。
- `moneybox`: 明洞換錢所，`sourceKind='exchange-shop'`，目前支援 KRW。

Phase 1 只註冊 provider metadata，不改主匯率選擇體驗。新增第二家以上銀行時，只新增 provider config 與資料 adapter，再啟用推薦 UI，不改核心歷史資料欄位。

## Activation Rule

多銀行推薦與銀行選單的啟用條件由 registry 決定：

```ts
export function shouldEnableBankProviderChoice(): boolean {
  return getProvidersBySourceKind('bank').length > 1;
}
```

當 `bank` provider 數量為 1：

- 不顯示銀行選單。
- 不顯示「最佳銀行推薦」。
- `bank` 的主匯率仍等同 `bot`。
- 歷史仍寫入 `sourceKind='bank'`、`providerId='bot'`。

當 `bank` provider 數量大於 1：

- 啟用銀行選單。
- 啟用最佳銀行推薦。
- 使用者可指定銀行。
- 主匯率只顯示 resolved provider 的匯率。

## Recommendation Model

未來銀行 provider 數量大於 1 時，使用者需要兩種模式：

- `best`: 系統依目前轉換方向與金額推薦結果最好的 provider。
- `manual`: 使用者指定 provider，主匯率只顯示該 provider。

推薦函式應該只吃資料，不依賴 React。Phase 1 可以先保留型別與測試，不接 UI：

```ts
export interface ProviderQuote {
  provider: RateProviderRef;
  rateType: RateType;
  sourceKind: RateSourceKind;
  unitRate: number;
  resultAmount: number;
  isAvailable: boolean;
}

export function rankProviderQuotes(input: {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
  rateType: RateType;
  quotes: ProviderQuote[];
}): ProviderQuote[];
```

排序原則：

- `from -> to` 的實際 `resultAmount` 最大者為最佳。
- 不可用 provider 不參與最佳推薦，但可在選單中顯示不可用狀態。
- 若沒有可用 provider，fallback 到預設 provider，並回傳 `reason='fallback-default'`。

## UI Contract

主畫面只顯示目前 resolved provider 的匯率：

- Phase 1：銀行來源只有 `bot`，不顯示銀行選單，主匯率仍顯示台銀匯率。
- Phase 2：`bank` provider 數量大於 1 時，顯示 provider 選單。
- `best` 模式：主匯率顯示推薦到的 provider。
- `manual` 模式：主匯率顯示使用者指定 provider。

歷史列表保持簡潔：

- 第一行：`1000 TWD -> 44900 KRW`
- 第二行：`今天 14:30 · 換錢所`
- 銀行來源顯示 `即期` 或 `現金`
- 換錢所來源顯示 `換錢所`

Provider 名稱不放在歷史列表第一版。它只存在資料層與未來篩選/明細中。

## History Contract

新歷史記錄應存可篩選欄位：

```ts
export interface ConversionHistoryEntry {
  from: CurrencyCode;
  to: CurrencyCode;
  amount: string;
  result: string;
  time: string;
  timestamp: number;
  rateType: RateType;
  sourceKind: RateSourceKind;
  providerId: RateProviderId;
  providerSelectionMode: ProviderSelectionMode; // Phase 1 固定為 'manual'
  schemaVersion: 2;
}
```

舊資料 migration：

- 缺 `sourceKind` / `providerId` 的舊紀錄只保留基本欄位，不補 `sourceKind='bank'` 或 `providerId='bot'`。
- 不回推 `exchange-shop` 或銀行來源，因為舊紀錄沒有可靠來源資訊。
- 篩選時舊紀錄可保留在 `全部`，若使用者篩 `即期` / `現金` / `換錢所`，只顯示有明確分類的紀錄。

## Migration Strategy

使用者偏好遷移：

- 舊 `rateSource='bank'` -> `{ mode: 'manual', manualProvider: { sourceKind: 'bank', providerId: 'bot' } }`
- 舊 `rateSource='exchange-shop'` -> `{ mode: 'manual', manualProvider: { sourceKind: 'exchange-shop', providerId: 'moneybox' } }`
- Phase 1 不把任何使用者切到 `{ mode: 'best' }`。
- 未來啟用多銀行推薦時，新使用者可預設 `{ mode: 'best' }`；既有使用者維持 migration 後的手動 provider，避免升級後主匯率突然變動。

## Non-Goals

- 第一階段不實作多銀行資料抓取。
- 第一階段不顯示銀行選單。
- 第一階段不顯示最佳銀行推薦。
- 第一階段不讓使用者切換 `best/manual`。
- 第一階段不在歷史列表顯示 provider 名稱。
- 第一階段不加入複雜推薦規則，例如手續費、分行可用性、會員優惠。
- 第一階段不重播歷史舊匯率；從歷史帶入仍是用目前設定重新計算。

## Phases

Phase 1：預留架構，不啟用多銀行功能。

- 建立 `sourceKind + providerId`。
- 建立通用 provider registry。
- 註冊 `bot` 與 `moneybox`。
- 歷史開始寫入 provider 欄位。
- UI 維持目前體驗。

Phase 2：`bank` provider 數量大於 1 時啟用多銀行。

- 啟用銀行選單。
- 啟用最佳銀行推薦。
- 啟用使用者指定銀行。
- 主匯率只顯示 resolved provider。

Phase 3：擴充推薦規則。

- 加入手續費、會員優惠、分行可用性等非匯率因素。
- 加入 provider 明細頁或比較表。
