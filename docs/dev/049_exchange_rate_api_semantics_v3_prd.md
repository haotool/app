# 匯率 API 語意 v3 正名與 MoneyBox 上游遷移 PRD

> **建立時間**: 2026-08-26T14:00:00+08:00
> **版本**: v11.0
> **狀態**: ✅ 欄位語意定案；⚠️ SSOT 生成鏈未建立（§19.8 十一項）；PR 1 可立即實作
> **作者**: Claude Code（研究與盤點）+ Codex（獨立第二意見）
> **上位文件**: `CLAUDE.md`、`AGENTS.md`
> **相關**: PR #472（v2 導入）、PR #1039（MoneyBox 中斷處理）

---

## 1. 摘要

MoneyBox 於 2026-08 將匯率 API 遷移至新 endpoint，舊 endpoint 雖仍可存取但 18/20 幣別的 `sell` 恆為 0，RateWise 的匯率抓取自 2026-08-22 起持續失敗。

調查遷移方案時發現更根本的問題：**現行 API Semantics v2 的欄位命名方案已失效，且從未真正落地**——

1. 同一欄位名 `customerBuyForeignRate` 在兩種 provider 下需要**相反的四則運算**，宣稱的「跨 provider 可比較」實質不成立
2. v2 只套用在文件面與單一 provider 檔，**佔 92% 流量的台銀主資料檔完全沒有 v2 語意層**

產品裁決：此 API **從未公開宣傳**，無需保護潛在外部消費者，**直接硬切單一 v3**，不留 sunset 期。目標是收斂乾淨的架構與最佳實踐語意欄位。

---

## 2. 背景與證據

### 2.1 上游遷移（實測）

官網 `https://moneybox-exchange.com/zh-CHT/exchange` 現行載入時**完全不再呼叫**舊 endpoint：

|          | 舊                                                                 | 新                                                                                 |
| -------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| endpoint | `cems.moneybox.or.kr/api/cmd.php?cmd=C011&key=…`                   | `moneybox-exchange.com/api/rates`                                                  |
| 回應     | `{ result, data: [{ currency, base, buy, sell, spbuy, spsell }] }` | `{ success, data: { publishedAt, rates: [{ currencyCode, buyRate, sellRate }] } }` |
| 幣別數   | 20（含 `GFT` 禮券偽幣別）                                          | 19                                                                                 |
| 現況     | 仍可存取，但 18/20 幣別 `sell` 恆為 0                              | 正常                                                                               |

### 2.2 陷阱一：欄位語意反轉

**新 `buyRate` ≡ 舊 `sell`；新 `sellRate` ≡ 舊 `buy`。** 三重交叉驗證：

1. 舊官網欄位：CAD 買入 1,015 = 舊 `sell`；賣出 1,028 = 舊 `buy`
2. 新官網欄位：CAD 買入 1,004 = 新 `buyRate`；賣出 1,015 = 新 `sellRate`
3. 價差方向：舊 `sell`(43) < `buy`(43.5)；新 `buyRate`(42.15) < `sellRate`(42.3)——店家低買高賣，順序一致

> 照字面把 `sell` 對到 `sellRate` 會取到價差的錯誤那一側。

### 2.3 陷阱二：per-100 vs per-1 單位差（僅 MoneyBox）

以仍在更新的舊 `base` 為基準推算比例：

| 幣別    | 比例       | 幣別       | 比例      |
| ------- | ---------- | ---------- | --------- |
| **JPY** | **100.17** | TWD        | 1.03      |
| **IDR** | **93.10**  | USD        | 1.00      |
| **VND** | **99.25**  | 其餘 13 個 | 0.98–1.01 |

**台銀側無此問題**：CDN 實測 JPY `{buy:0.1911}`、VND `{buy:0.001}`、IDR `{buy:0.00143}`、KRW `{buy:0.02125}`，全部 per-1。

FX 標準 `CCY1/CCY2 = X` 恆為 per-1；per-100 是日韓櫃檯的**展示**慣例。

> **風險緩解線索**：MoneyBox 的 JPY/IDR/VND 在本系統中**無任何消費者**（`EXCHANGE_SHOP_PROVIDERS` 僅有 KRW 一組，即 TWD↔KRW），正規化不影響任何使用者可見行為。

### 2.4 陷阱三：欄位缺失

新 API 只有 `buyRate` / `sellRate`，**移除** `base` / `spbuy` / `spsell`。

`base` 是上游的**市場參考價**，與 `(buy+sell)/2` 不同（實測 `base=43.59` vs `midMarketRate=43.25`）。若用 `(buy+sell)/2` 合成，會使兩者冗餘且失去獨立資訊。

### 2.5 v2 命名方案失效：同名反運算

```jsonc
// bank
"customerBuyForeignRate": { "twdToForeignFormula": "amount / details.{TO}.{rateType}.sell" }
// exchange-shop
"customerBuyForeignRate": { "twdToForeignFormula": "amount * rates.TWD.sell" }
```

消費端未同時讀 `quoteUnit` 即算出**倒數**。此欄位名的賣點是「跨 provider 可比較」，但兩者連運算方向都不同——可比較性是假的，風險從「看錯欄位」升級為「算出倒數而不自知」。

### 2.6 守門測試驗的是文件、不是算術

現行 7 條 v2 測試全部驗欄位對應，其中一條把公式**字串**當期望值鎖住：

```js
expect(payload.semanticFieldMapping.fields.customerBuyForeignRate.twdToForeignFormula).toBe(
  'amount * rates.TWD.sell',
);
```

**沒有任何一條真的執行換算並檢查數值。** 「bank 用除、shop 用乘」的不一致不但沒被攔下，還被當成正確行為固定下來。

### 2.7 v2 從未真正落地：覆蓋率與流量成反比

| 檔案                                                                       | 月流量     | v2 語意層                                                           |
| -------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| `public/rates/latest.json`（台銀主匯率）                                   | **69,487** | **完全沒有**——`details.USD.cash` 僅 `{buy, sell}`，無 schemaVersion |
| `public/rates/providers/moneybox/latest.json`                              | 6,100      | 有完整 v2 欄位                                                      |
| `api/latest.json`、`api/pairs/*`、`openapi.json`、`llms.txt`、open-data 頁 | —          | 有 v2 語意描述                                                      |

v2 套用在**文件面與單一 provider 檔**，卻沒套用在佔 92% 流量的主資料檔。

### 2.8 消費者盤點

全 repo `customerBuyForeignRate` 出現位置逐一分類：

- **生產／文件端（只寫不讀）**：`api-semantics-v2.ts`、`generate-openapi.mjs`、`generate-llms-txt.mjs`、`openapi.json`、`llms.txt`、`api/latest.json`、`api/pairs/*.json`、`OpenData.tsx`、`seo-metadata/core.ts`
- **消費端（讀取來計算）：零**
- 我方換算器讀的是 legacy `rates.TWD.sell`（`exchangeShopProviders.ts` 的 `getSellRate`）

導入於 2026-06-27（PR #472），已滿 2 個月。**產品確認：從未公開宣傳。**

### 2.9 權威做法對照（實測／官方文件）

| 來源                                                            | 做法                                                                                                                                                                                                                                                 | 對本案的啟示                                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **ECB SDMX**（`data-api.ecb.europa.eu/service/data/EXR`，實測） | series 維度為 `FREQ` / `CURRENCY` / **`CURRENCY_DENOM`** / **`EXR_TYPE`**(`SP00=Spot`) / `EXR_SUFFIX`(`A=Average`)；observation 維度為 `TIME_PERIOD`；observation 屬性含 **`OBS_STATUS`**；series 屬性含 `COLLECTION` / `COMPILING_ORG` / `DISS_ORG` | ①方向＝兩個幣別維度 ②**rate type 是一級平行維度** ③**每筆值自帶 status** ④出處與觀測時間分開建模 |
| **Stripe FX Quotes**                                            | 完全不用側名：方向由 `from_currency`→`to_currency` 表達；`exchange_rate`（客戶實得）/ `base_rate`（未扣費）/ `reference_rate` + `reference_rate_provider`                                                                                            | 方向進 key，基準價標出處                                                                         |
| **schema.org `ExchangeRateSpecification`**                      | `currency` + `currentExchangeRate`（`UnitPriceSpecification`：`price` + `priceCurrency`）+ `exchangeRateSpread`。**本身無任何日期／有效期屬性**，時間需由父結構表達                                                                                  | 語彙可直接對應；spread 是一級概念                                                                |
| Open Exchange Rates                                             | `bid`/`ask`/`mid` + `base`，且文件**未明確定義方向**                                                                                                                                                                                                 | 證明側名必留解釋空間                                                                             |
| Forex 券商                                                      | `bid`/`ask` 是交易商視角，UI 普遍改顯示 Buy/Sell                                                                                                                                                                                                     | **資料層用中性詞，展示層才翻譯**                                                                 |
| ISO 20022                                                       | `SPOT` 定義為「以約定匯率進行兩種貨幣交換、現金交割」，rate type 屬標準碼                                                                                                                                                                            | rate type 應為受控詞彙而非自由字串                                                               |

**共同結論**：權威做法一致地（a）用「來源幣／目標幣」兩個維度表達方向、（b）把 rate type 當**平行維度**、（c）用**每筆值的 status** 表達缺值原因、（d）把「出處」與「觀測時間」分開建模。無一使用需要外部 flag 才能決定乘除的側名欄位。

### 2.9.1 生產級 API 實測對照（各層級各取一家）

| 產品                            | 層級       | 方向表達                              | 匯率欄位                                               | 時間欄位                                                                  | 狀態欄位                  |
| ------------------------------- | ---------- | ------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------- |
| **Wise**（最接近本產品）        | 消費級匯兌 | `source`（send）／`target`（receive） | `rate`                                                 | `time`                                                                    | —                         |
| **Stripe FX Quotes**            | 支付       | `from_currency`／`to_currency`        | `exchange_rate` / `base_rate` / `reference_rate`       | `lock_expires_at`                                                         | `lock_status`             |
| **OANDA v20**                   | 交易       | `instrument`（`EUR_USD` 合併字串）    | `bids[].price` / `asks[].price`（含 `liquidity` 分層） | `time`                                                                    | **`status: tradeable`**   |
| **exchangerate-api v6**（實測） | 公共資料   | `base_code` + rates map               | rates map                                              | `time_last_update_utc` / **`time_next_update_utc`** / **`time_eol_unix`** | `result: success`         |
| **ECB SDMX**（實測）            | 官方統計   | `CURRENCY` / `CURRENCY_DENOM`         | observation value                                      | `TIME_PERIOD`                                                             | **`OBS_STATUS`**（19 碼） |
| **schema.org**                  | 語意標註   | `currency` / `priceCurrency`          | `price` + `exchangeRateSpread`                         | **無**（須由父結構表達）                                                  | —                         |

**五家中四家用「兩個幣別欄位」表達方向**；唯一例外 OANDA 是交易 API，其 `instrument` 合併字串是交易標的識別碼而非換算語意。**本產品是消費級匯兌工具，應對齊 Wise／Stripe 一側。**

三個本 PRD 先前未納入、但生產級 API 普遍具備的能力：

1. **輪詢契約**：exchangerate-api 提供 `time_next_update_*`，明確告訴消費端何時再拉。本專案應據此提供 `nextSourceCheckAt`（§18.2 已裁決改依上游 `max-age` 排程），同時降低 CDN 負載。
2. **payload 內建出處**：exchangerate-api 在 payload 帶 `provider` / `documentation` / `terms_of_use` 連結。本專案已有 open-data 頁可指向。
3. **端點生命週期訊號**：exchangerate-api 有 `time_eol_unix`；其 v4 甚至在 payload 內放 `WARNING_UPGRADE_TO_V6`。**版本轉換的訊號應在頻內（in-band），不能只靠文件。**

### 2.9.2 版本治理標準

| 標準                               | 規則                                                                          | 對本案的意義                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Google AIP-180**                 | 「改名等同於移除＋新增」；同一 major 版本內**不得移除**元件、**不得改變語意** | 本案要改名＋移除＋改語意 ⇒ **必須**是 major 版本變更，`3.0` 是正確載體     |
| **RFC 9745**（Deprecation header） | `Deprecation: <date>` 為 structured field date                                | 棄用訊號有標準格式，不應自創                                               |
| **RFC 8594**（Sunset header）      | `Sunset: <HTTP-date>`；`Sunset` **不得早於** `Deprecation`                    | 若保留舊路徑，用標準 header 而非自訂欄位                                   |
| **Zalando #187**                   | 棄用**必須**反映在 API spec（`deprecated: true`）                             | `openapi.json` 需標記                                                      |
| **Zalando #185 / #186**            | 關閉前**必須**取得客戶同意                                                    | 本案**無法達成**（無已知消費者、無聯絡管道）                               |
| **Zalando #188**                   | **必須監控**已棄用 API 的使用量以觀察遷移進度                                 | **這是 #185/#186 無法達成時的正當替代**——jsDelivr 提供逐檔流量統計（§2.7） |

> **對「硬切」決策的補強**：產品裁決不留 sunset 期是可執行的，但仍應採用標準做法降低風險——切換期間於舊路徑發出 `Deprecation` / `Sunset` / `Link` header（本專案已有 `security-headers` Cloudflare Worker 可依路徑注入），`openapi.json` 標 `deprecated: true`，並以 jsDelivr 逐檔流量監控是否仍有人拉舊路徑。這三項合計成本極低，且正是 Zalando #188 對「無法取得客戶同意」情境的建議替代。

### 2.10 我方 JSON-LD 已使用正確語意（與資料 API 形成對比）

`apps/ratewise/src/config/seo-metadata/core.ts` 的幣別頁 schema：

```js
'@type': 'ExchangeRateSpecification',
currency: fromCurrency,
currentExchangeRate: {
  '@type': 'UnitPriceSpecification',
  price: String(rate),
  priceCurrency: toCurrency,
},
```

這正是 **from/to 模型**——`currency` 是來源、`priceCurrency` 是目標、`price` 是 `received = paid × rate` 的 rate，**不需要任何 quoteUnit flag**。

> **本專案的 SEO 層在語意上比資料 API 層更正確。** v3 的目標之一，是讓 JSON-LD 成為資料模型的**直接投影**而非翻譯。`exchangeRateSpread` 目前未輸出，v3 可順勢補上。

---

## 3. 決策

### 3.1 產品裁決（推翻先前建議）

| 項目           | 先前建議                 | 產品裁決                      |
| -------------- | ------------------------ | ----------------------------- |
| 外部消費者保護 | 60–90 日 sunset + 雙入口 | **不需要**——從未公開宣傳      |
| 切換方式       | 漸進遷移                 | **直接硬切單一 v3**           |
| 唯一過渡要求   | —                        | **公開 API 說明頁同步到最新** |

### 3.2 維持的判斷

| 判斷                                                | 理由                                                 |
| --------------------------------------------------- | ---------------------------------------------------- |
| MoneyBox ingest 遷移與 v3 語意公開**仍拆成獨立 PR** | 上游遷移本身帶兩個陷阱，與正名混在一起出事將無法歸因 |
| `(buy+sell)/2` **不得冒充** market rate             | 對價差 3% 的換錢所而言那是 mid-shop 不是 mid-market  |
| 跨 provider 換算不變式**必須有數值測試**            | §2.6 證明只驗文件的測試會把錯誤認證為正確            |

### 3.3 v3 覆蓋範圍（擴大）

**同時涵蓋台銀與 MoneyBox 兩個 provider 的主資料檔、歷史檔、聚合檔與衍生 API。**

理由：§2.5 的同名反運算是**兩個 provider 共同的病**，§2.7 顯示 v2 半套。只治一邊等於保留半個地雷，違背「收斂乾淨」目標。

### 3.4 歷史資料裁決：全部轉換

**轉換全部 419 個歷史檔為 v3 統一結構，不做公開 v2 相容層。**

| 對象                          | 處理                                                 |
| ----------------------------- | ---------------------------------------------------- |
| 台銀 314 檔                   | 只做結構／方向正規化，**數值不變**（已驗證皆 per-1） |
| MoneyBox 105 檔中 JPY/IDR/VND | **÷100 正規化為 per-1**                              |
| MoneyBox 其餘 16 幣別         | 分母為 1，不調整                                     |

回滾靠**轉換前 release tag + migration manifest**（含來源／輸出 hash、原始分母、正規化係數），**不**透過保留 v2 公開層。

---

## 4. v3 目標架構

### 4.1 核心不變式

```
receivedAmount = paidAmount × rate      對所有 provider 恆成立，永不出現倒數分支
```

### 4.2 移除清單（Clean code 收斂）

- legacy `buy` / `sell`（同名反義地雷的來源）
- `rates` / `details` **雙結構**（統一為單一 `rates[]` 陣列）
- `customerBuyForeignRate` / `customerSellForeignRate`（"Foreign" 是相對詞）
- `quoteUnit` / `quotePerBaseUnit`（方向改由 from/to 編碼）
- `midMarketRate`（不得由算術中點冒充市場價）
- `schemaVersion: 2.0` → `3.0`（語意變更必須有版本訊號）

### 4.3 欄位表

每筆 rate row 的維度與量值（維度對齊 ECB SDMX，語彙對齊 schema.org）。

> **本表為欄位名的權威來源。** §16 與 §18 的後續裁決已回填於此；已汰換名稱見 §4.5。

| 欄位                            | 型別                                     | 定義                                                                           | 缺值行為                                | 權威依據                                            |
| ------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------- | --------------------------------------------------- |
| `rateType`                      | `"cash"` \| `"spot"` \| `"unspecified"`  | **一級平行維度**，非巢狀於 rate 之下（受控詞彙）                               | 必填                                    | ECB `EXR_TYPE`；ISO 20022 SPOT                      |
| `customerBuy.fromCurrency`      | string                                   | 客戶付出的幣別                                                                 | 必填                                    | ECB `CURRENCY_DENOM`；schema.org `currency`         |
| `customerBuy.toCurrency`        | string                                   | 客戶取得的幣別                                                                 | 必填                                    | ECB `CURRENCY`；schema.org `priceCurrency`          |
| `customerBuy.publishedRate`     | **decimal string**                       | `received = paid × publishedRate`                                              | 必填                                    | schema.org `UnitPriceSpecification.price`           |
| `customerBuy.rateUnit`          | `"TO_PER_1_FROM"`                        | 固定值，明示「每 1 單位來源幣換多少目標幣」                                    | 必填                                    | FX `CCY1/CCY2 = X` 恆 per-1                         |
| `customerBuy.quoteNature`       | `"published_board_rate"`                 | **傳達精準**：牌告實際買賣價，非中間價                                         | 必填                                    | 本產品定位（§16.4）                                 |
| `customerBuy.quoteAvailability` | `"indicative_not_transaction_guarantee"` | **防止過度承諾**：牌告價會變動、現場可得性不保證                               | 必填                                    | §14 排除清單                                        |
| `customerSell.*`                | 同上                                     | 反方向                                                                         | 必填                                    | —                                                   |
| `spread`                        | decimal string \| null                   | `customerSell.publishedRate − customerBuy.publishedRate`                       | 無法計算時 `null`                       | schema.org `exchangeRateSpread`                     |
| `derivedQuoteMidpoint`          | decimal string \| null                   | 同一 provider 兩側牌告價的數學中點；須帶 `isMarketRate: false` 與 `derivation` | 任一側缺報價 `null`                     | §18.3                                               |
| `derivedQuoteSpread`            | decimal string \| null                   | 兩側牌告價差                                                                   | 同上                                    | §18.3                                               |
| `marketMidCounterfactual`       | object \| **null**                       | 外部市場中價**對照**（非基準）；須帶 `purpose: "comparison_only"` 與來源出處   | **授權確認前恆 `null`**（§17 #1）       | Stripe `reference_rate` + `reference_rate_provider` |
| `providerReferenceRate`         | decimal string \| **null**               | **上游明示**的參考價；與 `marketMidCounterfactual` **不得混用**                | MoneyBox 結構性不提供 → `null`（§18.5） | Stripe `base_rate`                                  |
| `status`                        | ECB `CL_OBS_STATUS` 碼（見 §4.4）        | **每筆值自帶狀態碼**，說明缺值或品質；禁止用 `null` 代表語意                   | 必填                                    | **ECB `CL_OBS_STATUS`**                             |
| `observedAt`                    | ISO string                               | **我方抓取時間**                                                               | 必填                                    | ECB series 屬性 `COLLECTION`                        |
| `publishedAt`                   | ISO string \| null                       | **上游宣告的發布時間**；缺值時**不得回填**，以 `status` 說明                   | 上游未提供 `null`                       | ECB `TIME_PERIOD` 與屬性分離                        |

**`sourceDenominator` 移出公開 payload**，只留在轉換 manifest 供稽核。

> **為何用 `fromCurrency`/`toCurrency` 而非 Wise 的 `source`/`target`**：本專案 payload 既有頂層 `source: "MoneyBox"` 表示**資料提供者**，若再用 `source` 表示**來源幣別**會產生名稱碰撞。Wise 沒有此問題（其 payload 無 provider 欄位）。

### 4.3.1 payload 層級欄位（非 rate row）

| 欄位                                        | 定義                                                           | 依據                                  |
| ------------------------------------------- | -------------------------------------------------------------- | ------------------------------------- |
| `$schema`                                   | 指向 canonical contract URL（**取代** `semanticFieldMapping`） | §19.3                                 |
| `schemaVersion`                             | `"3.0"`                                                        | Google AIP-180：語意變更須 major 版本 |
| `nextSourceCheckAt`                         | **下次檢查時間**（依上游 `max-age` 排程，非每 5 分鐘）         | §18.2                                 |
| `calculationRule`                           | 供 LLM agent 直接套用的換算規則                                | §19.5                                 |
| `comparablePairs`                           | **強制且顯著**；目前僅 `TWD↔KRW` 一組                          | §13.3.4                               |
| `pricing.fee` / `pricing.pricingScope`      | `fee: 0` + `policy: "spread_only"` + 適用邊界宣告              | §15.1                                 |
| `provider` / `documentation` / `termsOfUse` | 出處與條款連結（指向 open-data 頁）                            | exchangerate-api payload 內建出處     |

> `nextSourceCheckAt` **不承諾上游必然更新**——我方能保證的只有下次檢查時間（§18.2）。

### 4.5 已汰換名稱對照

早期章節曾使用下列名稱，**均已汰換**。實作一律以 §4.3／§4.3.1 為準：

| 已汰換                  | 現行                                                              | 汰換原因                                    |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| `customerBuy.rate`      | `customerBuy.publishedRate`                                       | `rate` 過於中性，無法傳達「牌告實際成交價」 |
| `referenceRate`         | `marketMidCounterfactual`                                         | `reference` 暗示權威基準，實為**對照組**    |
| `referenceRateProvider` | 併入 `marketMidCounterfactual` 物件                               | 出處應與值同層，避免兩欄位失聯              |
| `referenceRateStatus`   | 通用 `status`（ECB `CL_OBS_STATUS`）                              | ECB `OBS_STATUS` 是每筆觀測值的通用狀態碼   |
| `nextUpdateAt`          | `nextSourceCheckAt`                                               | 前者暗示上游必然更新，是不誠實的承諾        |
| `midMarketRate`         | `derivedQuoteMidpoint`（自算）／`marketMidCounterfactual`（外部） | 算術中點不得冒充市場價                      |
| `grossReceivedAmount`   | `rateAppliedReceiveAmount` + `allInReceivedAmount`                | 會把 rate 層的誤導搬到 amount 層            |
| `semanticFieldMapping`  | `$schema`                                                         | 與 OpenAPI 重複，造成 payload 內第二份事實  |

### 4.4 `status` 受控詞彙：直接採用 ECB `CL_OBS_STATUS`

ECB 官方碼表（實測 `data-api.ecb.europa.eu/service/codelist/ECB/CL_OBS_STATUS`）共 **19 個碼**。**不自創字串**，取其子集：

| 碼  | ECB 定義                                         | 本專案使用情境                                              |
| --- | ------------------------------------------------ | ----------------------------------------------------------- |
| `A` | Normal value                                     | 正常值（預設）                                              |
| `M` | Missing value; data cannot exist                 | **此來源不提供該概念**——如新 MoneyBox API 無 reference rate |
| `L` | Missing value; data exist but were not collected | 上游有但本次未取得                                          |
| `H` | Missing value; holiday or weekend                | **換錢所休市**——實體店面非營業時段資料靜止（§2.3 情境）     |
| `Q` | Missing value; suppressed                        | **上游停供**——如 2026-08-22 起 `sell` 恆為 0 的事故         |
| `P` | Provisional value                                | 上游標示為暫定                                              |
| `U` | Low reliability                                  | 熔斷通過但落在可疑區間                                      |

> **正規化不使用 status 碼。** ECB 對「單位」另有 `UNIT_MULT` 屬性，與 `OBS_STATUS` 分開建模——狀態碼描述**資料品質／可得性**，不描述**單位換算**。本專案的 `rateUnit` 恆為 `TO_PER_1_FROM` 已自我描述，來源分母屬 provenance，留在 manifest 即可。
>
> 這修正了 v3.0 草案「以 `status: normalized` 標示正規化」的做法——那會讓一個欄位同時承載品質與單位兩種語意。

### 4.5 `spread` 對外輸出

**輸出。** schema.org 將 `exchangeRateSpread` 定義為一級屬性（「broker 買賣外幣的價差」），而我方 JSON-LD 目前未輸出（§2.10）。v3 一併補上，使 JSON-LD 成為資料模型的直接投影。

同向表示以避免符號歧義：`spread = customerSell.publishedRate − customerBuy.publishedRate`，恆為非負。

---

## 5. PR 切分（硬切版，3 個）

| PR    | 內容                                                 | 邊界                                        |
| ----- | ---------------------------------------------------- | ------------------------------------------- |
| **1** | MoneyBox ingest 安全切換                             | **不動**公開 schema，對外值零變化           |
| **2** | v3 canonical model + 全歷史轉換（419 檔 + manifest） | **尚不**切換公開入口                        |
| **3** | v3 硬切公開產物與文件                                | **唯一對外 breaking release，需原子化發布** |

> **PR 3 的前置條件（Codex 特別提醒）**：app 目前仍讀 MoneyBox legacy `getSellRate`。硬切前**必須**先改讀 v3 `customerBuy` 並驗證換算結果等價，否則硬切當下前端會取不到值。

---

## 6. 完整影響面清單

### 6.1 核心程式碼

- `apps/ratewise/src/config/api-semantics-v2.ts` → v3 schema
- `apps/ratewise/src/config/exchangeShopProviders.ts`（`getSellRate` / `getBuyRate`）
- `apps/ratewise/src/services/moneyboxRateService.ts`
- `scripts/fetch-moneybox-rates.js`
- 台銀抓取腳本（`fetch-taiwan-bank-rates*`）

### 6.2 資料檔

- `public/rates/latest.json`（台銀主檔）
- `public/rates/providers/moneybox/latest.json`
- `public/rates/history/*.json`（**314 檔**）
- `public/rates/providers/moneybox/history/*.json`（**105 檔**）
- `public/rates/history-30d.json`、`public/rates/providers/moneybox/history-30d.json`

### 6.3 衍生 API 與文件

- `apps/ratewise/public/api/latest.json`
- `apps/ratewise/public/api/pairs/*.json`（**17 檔**）
- `apps/ratewise/public/openapi.json`
- `apps/ratewise/public/llms.txt`、`llms-full.txt`
- `apps/ratewise/src/pages/OpenData.tsx`（**產品要求：必須同步到最新**）
- `apps/ratewise/src/config/seo-metadata/core.ts`

### 6.4 產生器

`generate-api-json.mjs`、`generate-pair-json.mjs`、`generate-openapi.mjs`、`generate-llms-txt.mjs`、`generate-history-aggregate.mjs`

### 6.5 測試

欄位反轉、per-100 正規化、乘法不變式、419 檔遷移完整性

---

## 7. 守門測試

| 測什麼                                                                                         | 防什麼                              |
| ---------------------------------------------------------------------------------------------- | ----------------------------------- |
| **跨 provider 換算不變式**：同一筆 `1000 TWD` 走台銀與換錢所，由**同一消費函式**計算並驗證數值 | §2.5 同名反運算（現行只驗公式字串） |
| 映射方向斷言（`customerBuy` 來自 `buyRate`）                                                   | 欄位反轉再次發生                    |
| JPY/IDR/VND 單位健全性（非 TWD 專屬區間）                                                      | 100 倍錯誤靜默通過                  |
| `marketMidCounterfactual` 不可由 buy/sell 平均生成                                             | 算術中點冒充市場價                  |
| 419 檔遷移完整性（逐檔 hash 比對 manifest）                                                    | 轉換遺漏或污染                      |
| `observedAt` / `publishedAt` 不可互相代入                                                      | 時間語意混用                        |

---

## 8. 回滾策略

| PR  | 回滾方式                                                   |
| --- | ---------------------------------------------------------- |
| 1   | 回退至最近有效快照，**僅動 ingest**——公開 schema 未變      |
| 2   | 依 migration manifest 反向還原，或回退至轉換前 release tag |
| 3   | 整包 revert；因原子化發布，不存在半套狀態                  |

---

## 9. 風險清單

### 9.1 已識別

| #   | 風險                            | 緩解                                                          |
| --- | ------------------------------- | ------------------------------------------------------------- |
| 1   | 欄位反轉取到價差錯誤側          | 映射方向守門測試 + §2.2 三重驗證                              |
| 2   | JPY/IDR/VND 100 倍錯誤          | 非 TWD 專屬的單位健全性檢查                                   |
| 3   | 算術中點誤稱市場價              | 移除 `midMarketRate`，改 `marketMidCounterfactual` + `status` |
| 4   | 上游再次改 schema 無人察覺      | 20 幣別快照 + manifest 分母守門                               |
| 5   | 兩軌混合發佈導致無法歸因        | 強制拆 PR（§3.2）                                             |
| 6   | v3 欄位再被「只驗文件」測試掩護 | 跨 provider 換算不變式數值測試                                |

### 9.2 Codex 補充（我未想到）

| #   | 風險                                                   | 緩解                                    |
| --- | ------------------------------------------------------ | --------------------------------------- |
| 7   | **CDN 混合版本快取**導致 schema 不一致                 | PR 3 原子化發布 + 發布後強制 purge      |
| 8   | 台銀 `rateType`（cash/spot）攤平時**遺失語意**         | v3 結構須保留 rateType 維度             |
| 9   | 歷史檔缺欄**不得補洞**                                 | 一律留 `null`，禁止推導填值             |
| 10  | `sell` 取倒數的**浮點精度／捨入漂移**                  | 轉換 manifest 記錄原值，比對容差        |
| 11  | 新 MoneyBox 無 `base` 時**不得用 `(buy+sell)/2` 冒充** | `status: "M"`（ECB：data cannot exist） |
| 12  | `publishedAt` 與 `observedAt` **混用**                 | 兩者皆為必填欄位，守門測試禁止互相代入  |
| 13  | **app 仍讀 legacy `getSellRate`**，PR 3 硬切會斷       | PR 3 前置：先改讀 v3 並驗證等價         |

---

## 10. 驗收標準

### PR 1（ingest 切換）

- [ ] 19 幣別 fixture 驗證 `buyRate→legacy sell`、`sellRate→legacy buy`
- [ ] JPY/IDR/VND 專項單位測試
- [ ] 切換前後 v2 JSON 逐欄位快照比對，證明**對外值零變化**
- [ ] workflow 恢復成功寫入，outage issue 自動關閉（PR #1039 機制）

### PR 2（v3 model + 歷史轉換）

- [ ] 419 檔全數轉換，manifest 含來源／輸出 hash、原始分母、正規化係數
- [ ] 台銀 314 檔**數值不變**（僅結構變動）逐檔驗證
- [ ] MoneyBox JPY/IDR/VND ÷100 後落在合理區間
- [ ] 跨 provider 換算不變式測試通過

### PR 3（硬切）

- [ ] app 已改讀 v3 `customerBuy` 且換算結果與 v2 等價
- [ ] 6.3 全部衍生產物重新生成且一致
- [ ] **OpenData 頁同步到最新**（產品硬性要求）
- [ ] 發布後 CDN purge 完成，無混合版本
- [ ] `openapi.json` 舊 schema 標 `deprecated: true`（Zalando #187）
- [ ] `security-headers` Worker 於舊路徑注入 `Deprecation` / `Sunset` / `Link` header（RFC 9745 / 8594）
- [ ] 切換後以 jsDelivr 逐檔流量監控舊路徑是否仍有拉取（Zalando #188）

---

## 11. 先前未解問題的裁決

| #   | 問題                              | 裁決                                                                      | 依據                                                                                    |
| --- | --------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | PR 2 → PR 3 是否留觀察期          | **不留，立即接續**                                                        | 產品裁決                                                                                |
| 2   | `rateType`（cash/spot）的結構位置 | **一級平行維度**，非巢狀於 `customerBuy` 之下；且為**受控詞彙**非自由字串 | ECB SDMX 將 `EXR_TYPE` 建模為 series 維度；ISO 20022 將 `SPOT` 定為標準碼（§2.9）       |
| 3   | 台銀歷史 314 檔缺 `publishedAt`   | **一律 `null`，不得以 `updateTime` 回填**；以 `status` 說明缺值原因       | ECB 以 `OBS_STATUS` 標示觀測值狀態，而非竄改觀測值本身；風險 #9「缺欄不得補洞」（§2.9） |

> 第 3 點的權威依據特別重要：官方統計資料的做法是**保留觀測值並標註狀態**，而不是用相鄰欄位推導填補。回填 `updateTime` 會讓「上游宣告的發布時間」與「我方記錄的更新時間」永久混淆，正是風險 #12 要防的事。

---

## 12. 尚待裁決

_無。§11 與 §4.4／§4.5 已裁決全部先前未決項目。_

實作前唯一需確認的是 §5 的 PR 3 前置條件：app 必須先改讀 v3 `customerBuy` 並驗證換算等價，才可硬切。

---

## 13. 權威匯率聚合器設計（延伸議題）

> 本節回答「如何成為權威匯率聚合網站 API」。結論影響 v3 的**擴充方向**，但**不阻擋** §5 的三段式遷移——v3 底座（固定方向、per-1、固定乘法）可先落地。

### 13.1 實測：Wise Comparison API

`GET api.wise.com/v4/comparisons?sourceCurrency=GBP&targetCurrency=EUR&sendAmount=1000` 實際回應（16 家 provider）：

```json
{ "amount": 1000.0, "amountType": "SEND",
  "sourceCurrency": "GBP", "targetCurrency": "EUR",
  "providerTypes": ["bank", "moneyTransferProvider"],
  "providers": [{ "alias": "wise", "id": 39, "name": "...", "type": "moneyTransferProvider",
    "logos": {...}, "partner": ...,
    "quotes": [{ "dateCollected": "2026-08-26T10:59:08Z", "rate": 1.16782, "fee": 3.81,
      "markup": 0.0, "receivedAmount": 1163.37, "sendAmount": null,
      "isConsideredMidMarketRate": true,
      "deliveryEstimation": { "duration": { "min": "PT0S", "max": "PT0S" } } }] }] }
```

**全份 payload 沒有任何 `buy` / `sell` / `bid` / `ask` 欄位。**

兩筆實測數據值得記錄：

| provider     | type | rate        | fee      | **receivedAmount** | dateCollected |
| ------------ | ---- | ----------- | -------- | ------------------ | ------------- |
| `barclays`   | bank | 1.13594     | 0.0      | 1135.94            | 08-25T13:13   |
| `nationwide` | bank | **1.14100** | **15.0** | **1123.88**        | 08-26T10:20   |
| `wise`       | mtp  | 1.16782     | 3.81     | 1163.37            | 08-26T10:59   |

- **只看 rate 會得出錯誤結論**：nationwide 匯率較好但 fee 15.0，實得反而最差
- **採集時間相差 21 小時仍並列呈現**，靠逐筆 `dateCollected` 讓消費端自行判斷，不隱藏也不強行對齊

### 13.2 我方提取原則的獨立評估（Codex）

送交獨立審查後，8 條原則中**僅 3 條完全成立**：

| #   | 原則                               | 裁定         | 未成立的前提                                             |
| --- | ---------------------------------- | ------------ | -------------------------------------------------------- |
| 2   | 方向是查詢屬性而非每筆匯率屬性     | **完全成立** | —                                                        |
| 3   | `amountType` 消除金額歧義          | **完全成立** | —                                                        |
| 5   | `fee` 與 `rate` 分離               | **完全成立** | —                                                        |
| 1   | provider 分類取代視角              | 部分成立     | RateWise 多了 Wise 沒有的實體換錢所維度                  |
| 4   | `receivedAmount` 是終極防錯        | 部分成立     | 依賴 query 帶金額；本專案為靜態預生成 CDN JSON           |
| 6   | `markup` 是聚合器核心價值          | 部分成立     | 需可信中價基準；本專案目前無                             |
| 7   | 逐筆 `dateCollected` 即可交付判斷  | 部分成立     | 需同時公開採集失敗與覆蓋率，否則沉默缺漏會被誤讀為無報價 |
| 8   | `isConsideredMidMarketRate` 標基準 | 部分成立     | Wise 標的是**自己**；第三方聚合器需說明基準來源與中立性  |

**不適合照搬之處**：RateWise 無 fee／國別／配送時間資訊，且多了實體換錢所這個 Wise 沒有的維度。

### 13.3 裁決（含第二輪推翻）

| 議題                         | 最終裁決                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| FIBO Party/Role vs Wise 分類 | **互補**。採 `provider.kind`（Wise 式分類）+ 最小 `providerRole`；**不導入完整 FIBO 本體** |
| cash / spot 與 provider.kind | **正交維度**。MoneyBox 未經驗證前填 **`unspecified`**，不得推測填 `cash`                   |
| `amountTiers`                | **納入**（第二輪推翻「靜態架構不可行」）                                                   |
| `grossReceivedAmount`        | **否決**（第二輪推翻自身提案）                                                             |
| `comparisonBenchmark`        | **延後**（第二輪由「另立」改為 deferred）                                                  |

#### 13.3.1 推翻一：`amountTiers` 納入

上一輪裁決「靜態 CDN 架構下 `receivedAmount` 不可行」是基於**不完整的前提**——本專案 `seo-paths.config.mjs` 早有 `INDEXABLE_FORWARD_AMOUNTS` / `INDEXABLE_REVERSE_TWD_AMOUNTS`，實際預生成 `/usd-twd/100/`、`/vnd-twd/5000000/` 等金額階梯頁。**既然已為 SEO 算過，技術上完全可行。**

納入 `api/pairs/{pair}.json`，但須嚴格分級：

| 欄位                       | 值域                                      | 規則                                       |
| -------------------------- | ----------------------------------------- | ------------------------------------------ |
| `feeCoverage`              | `complete` / `partial` / `unknown`        | 費用資料完整度                             |
| `comparisonEligibility`    | `all_in` / `rate_only` / `not_comparable` | 該 tier 可用於何種比較                     |
| `allInReceivedAmount`      | number \| **null**                        | **費用未知時必須為 `null`**                |
| `rateAppliedReceiveAmount` | number                                    | 僅套用匯率的結果                           |
| `rateSnapshotId`           | string                                    | 綁定 rate 快照，避免 rate 與 amount 不同步 |

**禁止**預設排名或任何「最佳／推薦」標籤。

#### 13.3.2 推翻二：`grossReceivedAmount` 否決

我方質疑「發布明知不含費用的 gross 金額，是否把 rate 層的誤導搬到 amount 層」——此質疑**成立**。

Wise 的教訓正是 nationwide 匯率較好但 fee 15.0 使實得最差（§13.1）。一個名為 `grossReceivedAmount` 的欄位會被讀成「我會拿到這麼多」，其誤導性**強於**原本只給 rate。改為上表的雙欄位設計：費用未知時 `allInReceivedAmount = null`，只給 `rateAppliedReceiveAmount` 並以 `comparisonEligibility: rate_only` 明示其限制。

#### 13.3.3 推翻三：`comparisonBenchmark` 延後

實測顯示真正可比的 provider-pair **只有一組**（§13.3.4）。在此前提下引入第三方中價的**邊際效益不足以抵消其可信度風險**。改列 deferred，前提是先解決費用覆蓋與 rateType 可比性。

#### 13.3.4 `comparablePairs`：強制且顯著

實測兩個 provider 的計價基準**不同**：

| provider | 幣別數 | 計價基準         |
| -------- | ------ | ---------------- |
| 台銀     | 17     | **TWD** per 外幣 |
| MoneyBox | 20     | **KRW** per 外幣 |
| 代碼交集 | 16     | —                |

**那 16 個代碼交集不可比**——台銀的 `USD` 是「1 USD 值多少 TWD」，MoneyBox 的 `USD` 是「1 USD 值多少 KRW」。

真正可比的只有 **TWD↔KRW 一組**：

```
台銀   details.KRW.cash = 0.02515 TWD/KRW  →  倒數 39.76 KRW/TWD
換錢所 rates.TWD        = 42.15   KRW/TWD  →  換錢所較優
```

`EXCHANGE_SHOP_PROVIDERS` 也確實只註冊 `KRW` 一組。

**規則**：`comparablePairs` 必須出現在 catalog／open-data 首頁與 `amountTiers` 的守門條件中，明列 TWD↔KRW 為唯一可比對象。**16 個代碼交集不得被列為可比較。**

### 13.4 成為權威聚合器的十項要素

欄位設計只是其一。Codex 列出的完整清單：

1. **涵蓋範圍聲明** — 明示納入哪些 provider、為何是這些
2. **方向與單位不變式** — `received = paid × rate`、恆 per-1（§4）
3. **逐筆時間透明** — 每筆報價自帶採集時間，不對齊、不隱藏
4. **採集失敗方法論** — 缺報價時明示原因（ECB `CL_OBS_STATUS`，§4.4），不得沉默省略
5. **可重現的比較方法** — markup 計算公式與基準來源公開且可複算
6. **費用與條件揭露** — 匯率之外的成本（本專案目前無 fee 資料，須明示 `feeStatus`）
7. **資料覆蓋一致性** — 不同 provider 的幣別覆蓋差異須可查
8. **歷史可稽核性** — 歷史資料可回溯、轉換過程有 manifest（§3.4）
9. **版本治理** — AIP-180 / RFC 9745 / 8594（§2.9.2）
10. **中立性與責任界面** — 說明本產品與各 provider 無商業關係、數字僅供參考

### 13.5 分階段路徑

| 階段  | 內容                                                                     | 與 §5 的關係           |
| ----- | ------------------------------------------------------------------------ | ---------------------- |
| **0** | v3 底座（固定方向、per-1、固定乘法、ECB status 碼）                      | 即 §5 的 PR 1–3        |
| **1** | 公開比較**方法論**（不做排名）：`comparisonBenchmark` + `feeStatus` 揭露 | v3 落地後              |
| **2** | markup 計算與排名                                                        | 方法論穩定且基準可信後 |
| **3** | 動態 `/comparisons` API（可帶金額、回 `receivedAmount`）                 | 需離開純靜態架構       |

---

## 14. 本產品是什麼／不是什麼

§13.3.4 證實真正可比的 provider-pair 只有一組。定位據此**降級**為誠實敘述：

> **RateWise 是「TWD↔KRW 的台銀與明洞換錢所報價比較資料服務」，外加多幣別匯率查詢。**

### 明確排除的宣稱

| 不是                   | 原因                                                     |
| ---------------------- | -------------------------------------------------------- |
| 全球匯率比較服務       | 只有 TWD↔KRW 一組可比對（§13.3.4）                       |
| all-in 實得金額保證    | 無費用資料，`allInReceivedAmount` 恆為 `null`（§13.3.1） |
| 市場中價的唯一權威來源 | 中價取自第三方且延後導入（§13.3.3）                      |
| 投資或交易建議         | 資料僅供參考，不含即時性保證                             |

> 定位降級不是退讓，而是**權威性的前提**。§13.4 第 10 項「中立性與責任界面」要求說清楚責任邊界；宣稱超出實際覆蓋範圍，正是最快失去權威的方式。

---

## 15. 聚合器議題的收斂結果

### 15.1 費用：`fee = 0` 是事實，不是未知

查證：**台銀換匯免收手續費**（線上結匯、外幣現鈔臨櫃與 ATM 提領皆免；僅非美歐旅行支票收 100 TWD）。明洞換錢所同樣只賺價差。

在「牌告匯率換現鈔」情境下，**價差就是全部成本**。先前「`feeCoverage` 恆為 `unknown`、`allInReceivedAmount` 必須為 `null`」的設計前提**不成立**——那是在「不知道有沒有費用」的假設下才對。

改為顯性表達費用**與其適用邊界**：

```json
"pricing": {
  "fee": {
    "amount": 0, "currency": "TWD", "coverage": "complete",
    "policy": "spread_only", "evidenceUrls": ["..."]
  },
  "pricingScope": {
    "settlementMethod": "cash_exchange",
    "rateBasis": "published_board_rate",
    "preferentialRateApplied": false,
    "excludedConditions": ["online_preferential_rate", "travellers_cheque"]
  }
}
```

`pricingScope` 是關鍵——我方資料是**牌告匯率**，不含台銀線上結匯的優惠匯率。不宣告這個邊界，就是另一次「宣稱超出實際覆蓋」（§14）。

### 15.2 `comparisonProfile`：不要用 rateType 字串判可比性

**這是本輪最重要的修正。** 我方原提案為「僅相同 `rateType` 可比、`unspecified` 不可比較」——但台銀是 `cash`、MoneyBox 是 `unspecified`（§13.3 裁決不得推測填 `cash`），該規則會**錯殺目前唯一已知可比的 TWD↔KRW**。

改為結構化的 `comparisonProfile` 相容性檢查：以**交割方式、報價基礎、費用政策**等結構欄位判斷兩筆報價是否可比，原始 `rateType` **降級為資料品質資訊**而非可比性判準。

### 15.3 十二項逐項裁決

| #   | 項目                 | 裁決     | 要點                                                                                                                                          |
| --- | -------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 比較覆蓋 SSOT        | **修正** | **不可**用 `EXCHANGE_SHOP_PROVIDERS`（那是 app routing 設定）當比較覆蓋 SSOT；需獨立 `comparison-coverage` 設定                               |
| 2   | 比較資格模型         | **修正** | all_in 條件改用 `comparisonProfile` 相容性，**不要求**原始 `rateType` 字串相同                                                                |
| 3   | 費用資料契約         | 採納     | `fee: 0` + `feePolicy` + `pricingScope`（§15.1）                                                                                              |
| 4   | amount tier 新鮮度   | 採納     | tier 綁 `rateSnapshotId`，逾期**降級不隱藏**                                                                                                  |
| 5   | SEO 階梯與 API tiers | 採納     | 分離 SSOT；CI 斷言禁止 import `seo-paths.config.mjs`                                                                                          |
| 6   | cash / unspecified   | **修正** | `unspecified` **不可自動判不可比**；靠 `comparisonProfile` 判斷                                                                               |
| 7   | freshness 門檻       | **修正** | payload 除門檻值外還須輸出 `collectedAt` / `maxAgeHours` / `freshUntil` / `freshnessStatus`                                                   |
| 8   | 資料完整性失敗策略   | **修正** | 缺報價保留 provider + `CL_OBS_STATUS`；但 `comparablePairs` **不因單次缺報價被移除**，改輸出 `comparisonAvailability: "unavailable"`          |
| 9   | 精度與捨入           | **修正** | ingest 只做一次倒數（採納），但「固定 8 位有效數字」**不足**——需 decimal 算術 + 明確 amount tier 捨入規則                                     |
| 10  | manifest 格式        | 採納     | JSONL，另補 `manifestVersion` / hash algorithm / `migrationId`                                                                                |
| 11  | CDN 原子發佈         | **修正** | pointer 須指向**具 hash 的完整 release manifest**，涵蓋 latest／pairs／history／OpenAPI／文件為同一 release；purge 後**全面驗證**而非單檔抽查 |
| 12  | 來源使用責任         | 採納     | 盤點條款，未確認前 `redistributionStatus: "unverified"`                                                                                       |

> **第 8 項的修正很重要**：若單次缺報價就把該對從 `comparablePairs` 移除，覆蓋範圍宣告會隨每次抓取結果閃爍。覆蓋範圍是**結構性事實**（哪些對在設計上可比），可得性是**當下狀態**——兩者必須分離。

### 15.4 新增：另外 8 項尚未對齊

獨立審查再次明確回覆「非『無』」：

| #   | 項目                                                   |
| --- | ------------------------------------------------------ |
| 13  | `comparisonProfile` 正式 schema 未定                   |
| 14  | all-in 與**現場可得性**邊界未區分（有匯率≠現場換得到） |
| 15  | 金額捨入規格未統一                                     |
| 16  | 費用證據**有效期**未定義（免手續費政策可能變更）       |
| 17  | 資料失效／跳價／欄位改名的**人工審核規則**未定         |
| 18  | 比較**排序規則**未定（不可用「最佳」標籤）             |
| 19  | `methodVersion` 版本可追溯機制缺失                     |
| 20  | 法律責任界面確認前仍是**發佈 blocker**                 |

### 15.5 阻塞分析與實作順序

| 階段       | 內容                                                                             | 涵蓋項目        |
| ---------- | -------------------------------------------------------------------------------- | --------------- |
| **PR 1**   | MoneyBox 欄位反轉／per-100／non-finite 防護／freshness 與缺報價狀態              | #7 #8           |
| **PR 2**   | coverage 設定／`comparisonProfile`／decimal 精度／419 檔 JSONL manifest 與完整性 | #1 #2 #6 #9 #10 |
| **PR 3**   | pointer + release manifest 原子發佈／文件同步／terms gate                        | #3 #11 #12 #20  |
| **遷移後** | amount tiers 與其獨立設定                                                        | #4 #5           |

**只有 #4 #5 可延後**；其餘貫穿三個 PR。

> **PR 1 可以立刻開始**——它只需要 #7 #8 的 freshness 與缺報價狀態設計，兩者已於 §4.4 與 §15.3 定案。CI 的修復不被聚合器議題阻塞。

---

## 16. v3 公開 API 最終定案

### 16.1 產品定位是設計的起點

> **本產品主打「比其他匯率工具精準」——別的工具顯示中間價，我們顯示實際可成交的牌告買賣價。**

repo 既有文案佐證：`DEFAULT_DESCRIPTION`「顯示臺灣銀行牌告的**實際買入賣出價（非中間價）**」；feature 條目「顯示實際買賣價（非中間價）——換匯金額更精準」。

**差異化模型早已完整實作於 `seo-rate-examples.ts`，卻只服務 SEO 文案、沒進 API**（`foreignAtCash` / `foreignAtMarketMid` / `diffForeign` / `diffTWD` / `diffPct`）。這與 §2.10「SEO 層比資料 API 層更正確」是同一個模式。

### 16.2 這推翻了中間價的先前裁決

§13.3.3 曾將 `comparisonBenchmark` 列為 deferred，理由是「升格即隱含本產品為此數字背書」。**該推論建立在「中間價是權威基準」的假設上。**

在此定位下，中間價的角色是**對照組**而非基準——它是本產品要糾正的東西。展示「中間價會讓你以為多換到 X、實際拿不到」正是**反向背書**。

### 16.3 命名裁決

| 概念             | 欄位名                        | 為何不用其他名稱                                                |
| ---------------- | ----------------------------- | --------------------------------------------------------------- |
| 中間價對照       | **`marketMidCounterfactual`** | 不用 `referenceRate`／`comparisonBenchmark`——兩者皆暗示權威基準 |
| 上游明示的參考價 | `providerReferenceRate`       | 與中間價對照**不得混用**                                        |
| 主匯率數值       | **`publishedRate`**           | 不用 `rate`——過於中性，無法傳達「這是牌告的實際成交價」         |
| 精準度落差       | **`marketMidExpectationGap`** | 只出現在 `amountTiers`，不進逐筆 rate row                       |

`marketMidCounterfactual` 須帶 `purpose: "comparison_only"`。

### 16.4 「傳達精準」與「不過度承諾」的平衡

主匯率結構保留 `customerBuy` / `customerSell`，但新增兩個限定欄位：

```json
"customerBuy": {
  "fromCurrency": "TWD", "toCurrency": "KRW",
  "publishedRate": 42.15,
  "rateUnit": "TO_PER_1_FROM",
  "quoteNature": "published_board_rate",
  "quoteAvailability": "indicative_not_transaction_guarantee"
}
```

- `quoteNature: "published_board_rate"` — **傳達精準**：這是牌告的實際買賣價，不是中間價
- `quoteAvailability: "indicative_not_transaction_guarantee"` — **防止過度承諾**：牌告價會變動、現場可得性不保證

兩者合起來正好落在 §14 排除清單（不保證 all-in 實得）與 §15.1 `pricingScope`（限定牌告匯率、排除線上優惠匯率）之間。

### 16.5 精準度落差欄位

升為一級 API 欄位，但**只依附於固定金額的 `amountTiers`**，不進逐筆 rate row（金額落差本質上需要金額）：

```json
"marketMidExpectationGap": {
  "receiveAmountShortfall": ...,              // 中間價高估的目標幣數量
  "additionalSendAmountAtPublishedRate": ..., // 要拿到中間價的數量需多付多少來源幣
  "shortfallPercent": ...
}
```

### 16.6 獨有價值主張 vs 業界標準對齊

| 分類             | 欄位                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **本產品獨有**   | `marketMidCounterfactual`、`marketMidExpectationGap`、`published_board_rate` scope                                        |
| **業界標準對齊** | `TO_PER_1_FROM`（FX per-1）、provider `type`（Wise）、freshness 欄位群、fee 與 rate 分離、`SEND` 語意（Wise `amountTyp`） |

---

## 17. 最終未定案清單（6 項）

獨立審查誠實列出**無法在此輪定案**的項目與原因：

| #   | 項目                              | 為何無法定案                          | 暫定行為                                        |
| --- | --------------------------------- | ------------------------------------- | ----------------------------------------------- |
| 1   | 中間價來源的授權與再散布條件      | `open.er-api.com` 公開資格未確認      | 確認前不得發佈 `marketMidCounterfactual`        |
| 2   | 中間價的獨立 freshness 門檻       | 需與台銀 36h／MoneyBox 24h 對齊或另定 | 待定                                            |
| 3   | 既有 SEO `diffTWD`/`diffPct` 公式 | 未比對 fixture，無法判斷可否沿用      | 若公式不同須 `methodVersion: "2.0"` 版控        |
| 4   | MoneyBox 正式 rate type           | 產品類型定義證據不足                  | **維持 `unspecified`**（§13.3 一致）            |
| 5   | 歷史中間價共時性                  | 未證實歷史期間存在共時 benchmark      | 歷史 gap **必須為 `null`**，不得用今日中價回填  |
| 6   | 兩個來源的再散布權利              | 台銀與 MoneyBox 條款盤點結果未提供    | `termsOfUse.redistributionStatus: "unverified"` |

> 第 5 項與 §11 第 3 點（`publishedAt` 不得回填）是同一原則：**缺的就是缺的，不用今天的數字填昨天的洞。**

---

## 18. 新 API 實測與最終修正（2026-08-26）

### 18.1 MoneyBox 新 API 的完整表面

端點探查：**只有 `/api/rates`**（`/api/rates/latest`、`/history`、`/currencies`、`/config`、`/branches` 皆 404）。

```
HTTP 200
cache-control: public, max-age=14400      ← 上游自宣可快取 4 小時
last-modified: Wed, 26 Aug 2026 13:05:24 GMT
cf-cache-status: HIT / age: 21
```

```json
{
  "success": true,
  "data": {
    "publishedAt": "2026-08-26T13:02:18.268Z",
    "rates": [{ "currencyCode": "TWD", "buyRate": 42.15, "sellRate": 42.3 }]
  }
}
```

19 幣別，每列**僅 3 欄位**。無 `base`、無 `spbuy`/`spsell`、無任何參考價。

> 這使 `providerReferenceRate` 對 MoneyBox **恆為 `null`**——是結構性事實，非暫時缺漏。

### 18.2 輪詢頻率：依上游快取契約，不依我方習慣

我方 cron 每 5 分鐘（288 次/日），是上游自宣 TTL 的 **48 倍**；實測平日僅 25–34 次實際變動。

**裁決：停用每 5 分鐘輪詢，改依 `max-age=14400` 排程，並帶 `If-Modified-Since` 條件式請求。**

> **精準主張不受影響**——「精準」指的是**價格語意正確**（實際牌告買賣價而非中間價），不是輪詢頻率。

欄位改名：`nextUpdateAt` → **`nextSourceCheckAt`**。前者暗示「上游必然會更新」，是不誠實的承諾；我方能保證的只有「下次檢查時間」。

### 18.3 推導中價：可以做，但**不能取代**外部市場中價

產品方向為「中價變成計算出來的參考」。可行，但有嚴格邊界：

| 欄位                      | 定義                                   | 標記                                                                                |
| ------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------- |
| `derivedQuoteMidpoint`    | 同一 provider 兩側牌告價的**數學中點** | `isMarketRate: false`、`derivation: "arithmetic_mean_of_published_two_sided_rates"` |
| `derivedQuoteSpread`      | 兩側牌告價差                           | 同上                                                                                |
| `marketMidCounterfactual` | 外部市場中價（Google/XE/Wise 顯示者）  | `purpose: "comparison_only"`（§16.3）                                               |

**兩者不可互換。** `derivedQuoteMidpoint` 是**該 provider 自己**兩側報價的中點；`marketMidCounterfactual` 是**市場**中價。差異化敘事對照的是後者。

既有 `seo-rate-examples.ts` 同時計算 `foreignAtBankMid`（雙重驗證）與 `foreignAtMarketMid`（對照敘事），**正說明兩者用途不同、都需要保留**。

> **§17 #1 的授權阻塞未解除。** 期望「改用推導中價即可繞過授權問題」**不成立**——若仍要公開市場中價對照，條款確認、來源方法論公開、獨立 freshness 門檻仍是發佈前必要條件。未確認前 `marketMidCounterfactual: null`，**不得用推導中點頂替**。

### 18.4 Decimal 精度規格

實例：`(42.15 + 42.3) / 2` 在 JS 得到 **`42.224999999999994`**。

| 項目           | 規格                                                            |
| -------------- | --------------------------------------------------------------- |
| 公開 JSON 表示 | **decimal string**（`"42.3"` 而非 `42.3`）                      |
| 算術           | 十進位算術（decimal.js 等），**禁止** binary float 進入公開產物 |
| 中點／spread   | 依輸入位數規則捨入，`ROUND_HALF_EVEN`                           |
| canonical 倒數 | 保留 **12 位小數**                                              |
| 金額           | 依幣別 **minor-unit** 捨入                                      |

守門測試須斷言：

- `mean("42.15", "42.3") === "42.225"`
- 公開 JSON **不得出現** `42.224999999999994`
- hash 可重建一致性
- per-100 正規化仍走 decimal path

### 18.5 上游只給 3 欄位下，必須為 null 的欄位

| 欄位                      | 值                                    |
| ------------------------- | ------------------------------------- |
| `providerReferenceRate`   | `null`（上游不提供）                  |
| `marketMidCounterfactual` | `null`（授權未確認前）                |
| `marketMidExpectationGap` | `null`（依賴上者）                    |
| `deliveryEstimation`      | `null`（無此資料）                    |
| 優惠匯率資訊              | `null`（§15.1 `pricingScope` 已排除） |
| `rateType`                | **`"unspecified"`** 而非 `null`       |

> 最後一列是刻意區分：**`"unspecified"` = 已知有此概念但無資料；`null` = 此概念不適用。** 兩者不可混用。

---

## 19. SSOT 架構與 AI／SEO 取用

### 19.1 問題：語意定義散落在 6 個表面

| #   | 位置                                           | 形式                                   |
| --- | ---------------------------------------------- | -------------------------------------- |
| 1   | `apps/ratewise/src/config/api-semantics-v2.ts` | 程式碼（型別＋enrich 函式）            |
| 2   | `openapi.json`                                 | 產生物（機器可讀契約）                 |
| 3   | `llms.txt`                                     | 產生物（**散文**描述欄位）             |
| 4   | `OpenData.tsx` / `open-data.md`                | 頁面說明表                             |
| 5   | `seo-metadata/core.ts` 的 JSON-LD              | schema.org `ExchangeRateSpecification` |
| 6   | payload 內的 `semanticFieldMapping`            | 隨資料送出的自述                       |

**已證實漂移**：§2.10（JSON-LD 語意比資料 API 更正確）、§2.7（v2 只套用在部分產物）。

**具體定時炸彈**：`llms.txt` 第 17 行是**專門寫給 LLM** 的散文，寫死 v2 欄位——

> 「回傳欄位包含 timestamp、updateTime、source、rates、details（各幣別完整四種報價：spot.buy, spot.sell, cash.buy, cash.sell）」

v3 上線後此段**立刻過期**，而 AI 爬蟲讀到的就是它，且不會知道自己讀到舊的。人類看 UI 會發現不對，LLM agent 只會照錯的欄位名解析。

### 19.2 SSOT 定案：版本化 JSON Schema

**SSOT 位置**：`apps/ratewise/src/api-contract/v3/ratewise-v3.contract.schema.json`（附 RateWise semantic metadata）。

**不用純 TS 型別**——執行期消失，無法供 OpenAPI／AI／JSON-LD 消費。

衍生鏈：

| 產物                      | 關係                           |
| ------------------------- | ------------------------------ |
| TS 型別                   | 由 contract 生成               |
| `openapi.json`            | `$ref` 指向 contract           |
| `llms.txt`                | 由 contract 生成               |
| OpenData 欄位表           | 由 contract 生成               |
| payload runtime validator | 以 contract 驗證               |
| JSON-LD                   | 由**已驗證的 v3 payload** 投影 |

### 19.3 `semanticFieldMapping` 於 v3 移除

與 OpenAPI 重複，且造成 payload 臃腫與**文案二次漂移**。改以 payload 內 **`$schema`** 欄位指向 canonical contract URL。

### 19.4 必須人工撰寫的例外

產品敘事／FAQ、比較方法論、§14「本產品是什麼／不是什麼」、風險提醒、來源條款、SEO 文案。

> **但引用欄位名或公式時必須連結 contract metadata，不得手寫第二份事實。**

### 19.5 AI 爬蟲取用

| 議題                      | 裁決                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `llms.txt` 散文 vs schema | **兩者都要**——純 schema 對 LLM agent 不夠好用，純散文會過期（第 17 行即實例）       |
| 散文內容                  | 生成式**短操作指引**，含 calculation rule 與**「不可做什麼」清單**                  |
| 匯率資料的 Markdown 表面  | **不需要**——JSON 是 canonical data surface；既有 9 個內容鏡像**不應擴展到即時資料** |

**payload 自述目前不足**，尚缺：

1. `$schema` 連結
2. `calculationRule` 欄位
3. 明確的禁止事項——告知 agent「`marketMidCounterfactual` **非可成交價**」「`derivedQuoteMidpoint` **非市場中價**」

### 19.6 SEO 一致性

**JSON-LD 必須是「已驗證 v3 payload」的投影**，不得自行讀 legacy 欄位或重算——這正是修正 §2.10 已證實的漂移。

**schema.org 表達力不足**：`ExchangeRateSpecification` 僅能表達 `currency` / `priceCurrency` / `price` / `exchangeRateSpread`，**無法表達** `customerBuy`/`customerSell` 雙向、`pricingScope`、`feeCoverage`、`comparisonEligibility`、`amountTiers`、`marketMidCounterfactual`。

處置：JSON-LD **只投影可表達部分**，其餘留在 canonical JSON API。**絕不把 `derivedQuoteMidpoint` 塞進任何暗示市場中價的欄位。**

### 19.7 金額階梯的 SSOT 分離

設定分離、計算核心共用：

```
seoAmountPathConfig  ─┐
                      ├─→ amountTierCalculator（共用）
apiAmountTierConfig  ─┘
```

CI 強制斷言 `apiAmountTierConfig` **不得 import** `seo-paths.config.mjs`（§15.3 #5）。

### 19.8 收斂檢查：尚未達成的 11 項

獨立審查明確回覆「非大致完成」：

| #   | 缺口                                                                            |
| --- | ------------------------------------------------------------------------------- |
| 1   | v3 canonical JSON Schema contract 檔案**本身未建立**                            |
| 2   | 生成鏈未證實存在                                                                |
| 3   | runtime schema validation 未證實覆蓋 latest／history／pairs／tiers              |
| 4   | 文件反漂移守門未實作（`llms.txt` 現況即反例）                                   |
| 5   | JSON-LD projection adapter 未建立                                               |
| 6   | AI operation guide 未含 v3 calculation rule                                     |
| 7   | `$schema` payload linkage 未定案                                                |
| 8   | 外部市場中價合法性未確認（§17 #1）                                              |
| 9   | `currencyMinorUnits` SSOT 位置未定                                              |
| 10  | MoneyBox 正式 rate type 證據仍缺（§17 #4）                                      |
| 11  | 台銀／MoneyBox 再散布條款仍是發佈 blocker（§17 #6）；CDN 原子發布機制未證實完成 |

**已達成**：10 項 v3 核心 schema 裁決（方向模型、decimal 精度、fee／pricingScope、comparablePairs、amount tiers、derived vs market mid 分離、source polling 等）。

---

## 20. 全域漂移稽核（2026-08-26）

### 20.1 確認漂移

| #   | 位置                                          | 問題                                                                                                                                                                                                  |
| --- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `CLAUDE.md` MoneyBox 故障排除條目             | 以 `cems.moneybox.or.kr` 為**現行**來源；PR #1051 合併後即過期                                                                                                                                        |
| 2   | `.github/workflows/update-moneybox-rates.yml` | outage issue body 與 step summary 指向**舊 API URL**——中斷時會把調查者導向錯誤端點                                                                                                                    |
| 3   | `CLAUDE.md` 排程節流條文                      | 記載「MoneyBox 每 5 分鐘」為 SSOT，與 §18.2 裁決衝突                                                                                                                                                  |
| 4   | `currency-landing.ts` 人民幣 FAQ              | 「線上結匯（如台銀 Easy 購）**匯率最優惠**」——與 §15.1 `pricingScope.excludedConditions: ["online_preferential_rate"]` **直接衝突**：文案推薦一個我方資料明確不涵蓋的管道，卻未標示顯示數字不適用於它 |
| 5   | `.github/workflows/update-latest-rates.yml`   | 台銀（**92% 流量**）有 staleness gate（6h）但**無 outage issue routing**——#1039 的節流機制只套用在較小的 MoneyBox，較大的來源仍會在中斷時每 5 分鐘失敗一次                                            |

> 第 5 項是我方自造：修了小來源的通知洪水，留下大來源的。

### 20.2 我判定「不是漂移」但被獨立審查推翻

| 項目                 | 我方判定     | 審查裁決                             | 我漏看了什麼                                                                                           |
| -------------------- | ------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| B1 台銀「每 5 分鐘」 | 適當，非漂移 | **部分同意，不同意「因此必然適當」** | `no-cache` 只是**重新驗證訊號**，不是頻率授權。我證明了「未被禁止」，不等於「已被證成」                |
| B2「18 種貨幣」      | 已 SSOT 驅動 | **不同意判為非漂移**                 | regex 掃 `constants.ts` 是脆弱實作；且未區分 configured／可發布／可比較／當期可用四種「18」            |
| B3「多幣別同時比較」 | app 內換算   | **部分同意，文案需修正**             | 「同時比較」對讀者與 AI 易誤讀為**跨 provider 比較**；應改為「以同一基準幣別同時檢視多種幣別換算結果」 |
| B4 換錢所比較 FAQ    | 已限定 KRW   | **部分同意，尚不能判非漂移**         | 「現場約可換 M 韓元」可能超出資料事實——**牌告價 ≠ 現場成交／庫存／營業時間保證**                       |

**B1 的正確判準**（非僅憑 `no-cache`）：

1. workflow cron 與**實際成功更新紀錄**核對
2. 台銀**實際變價頻率分布**觀測
3. 明確 SLO（如「牌告更新後 95% 在 10 分鐘內反映」）
4. 上游是否提供條件式請求，據以調整

### 20.3 §14 排除宣稱應落成可執行斷言

repo 已有「公開真相閘門」（`schema-truthfulness.test.ts`、`CurrencyLandingPage.truthfulness.test.tsx`），§14 四項排除宣稱應在此落地：

| 斷言                                                                                       |
| ------------------------------------------------------------------------------------------ |
| `comparablePairs` 須為明確 **allowlist**，非由幣別交集自動生成                             |
| `quoteAvailability` 固定枚舉，**禁止** guaranteed 類文案                                   |
| `pricingScope.rateBasis` 必為 `"published_board_rate"`                                     |
| `derivedQuoteMidpoint.isMarketRate` 必為 `false`                                           |
| `marketMidCounterfactual.purpose` 必為 `"comparison_only"`                                 |
| 非 `all_in` 時**禁止**輸出排名／最佳欄位                                                   |
| `feeCoverage="complete"` 時必須綁定 `fee.amount="0"` + `spread_only` + 完整 `pricingScope` |

> **§14 需重新定稿**：其「不保證 all-in 實得」的**絕對表述**已被 §15.1 的 `fee = 0` 新事實推翻，應改為**情境限定式**表述（限定牌告匯率換現鈔情境）。這是我方引入 fee=0 時未回頭修正 §14 造成的內部矛盾。

### 20.4 過渡期處置：`llms.txt` 與 `openapi.json`

**v3 發佈前不改 canonical 公開文件為 v3**，但**若現有描述與現行 endpoint 不一致必須立即修正**——不得以「快要 v3」為由保留錯誤。

v3 contract／OpenAPI／LLM 文件可在 feature branch 建立，**不連 canonical URL**。硬切時同一次 build 原子生成全部產物，並以 5 項 gate 守門：欄位反漂移、OpenAPI `$ref` 一致、OpenData 生成、`schemaVersion` 一致、CDN probe 驗證同 `releaseId`。

### 20.5 共識狀態：**否**

仍有 **7 項未決**，且**皆需外部事實而非更多討論**：

| #   | 未決項                              | 需要什麼                   |
| --- | ----------------------------------- | -------------------------- |
| 1   | 台銀 polling SLO                    | 變價頻率觀測資料           |
| 2   | 外部市場中價授權與方法論            | `open.er-api.com` 條款確認 |
| 3   | 既有 `diffTWD`／`diffPct` 精確公式  | 比對 fixture               |
| 4   | MoneyBox 正式 rate type             | 產品類型定義證據           |
| 5   | `currencyMinorUnits` SSOT 位置      | 內部決策                   |
| 6   | 台銀／MoneyBox 再散布條款           | 條款盤點                   |
| 7   | §14 四項文字因 `fee = 0` 需重新定稿 | 內部決策（可立即處理）     |

> 第 1、2、3、4、6 項**無法靠再跑幾輪對抗式審查收斂**——它們缺的是外部事實。繼續討論只會產出更多推測。

---

## 修訂紀錄

| 日期       | 版本  | 變更                                                                                                                                                                                                                                                                               |
| ---------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-26 | v11.0 | 新增 §20 全域漂移稽核：確認 5 項漂移（含台銀 workflow 缺 outage routing、人民幣 FAQ 推薦我方不涵蓋的管道）；記錄我方 4 項「非漂移」判定被推翻及正確判準；§14 因 fee=0 需重新定稿；共識狀態為否，7 項未決且 5 項需外部事實                                                          |
| 2026-08-26 | v10.1 | reconcile 早期章節欄位名：§4.3 回填 publishedRate／marketMidCounterfactual／derivedQuoteMidpoint／quoteNature／quoteAvailability，§4.3.1 回填 $schema／nextSourceCheckAt／calculationRule；新增 §4.5 已汰換名稱對照表                                                              |
| 2026-08-26 | v10.0 | 新增 §19 SSOT 架構：語意散落 6 表面且已證實漂移，llms.txt 散文欄位說明為定時炸彈；定案以版本化 JSON Schema 為 SSOT 並衍生全部產物；v3 移除 semanticFieldMapping 改用 $schema；llms.txt 散文與 schema 連結兩者都要；JSON-LD 改為已驗證 payload 的投影；誠實列出 11 項未達成         |
| 2026-08-26 | v9.0  | MoneyBox 新 API 完整實測（單一端點、3 欄位、max-age 4h）；輪詢改依上游快取契約並改名 nextSourceCheckAt；新增 derivedQuoteMidpoint 但裁定不可取代外部市場中價、授權阻塞未解除；decimal string 與十進位算術規格定案；列出上游僅 3 欄位下必須為 null 的欄位                           |
| 2026-08-26 | v8.0  | 產品定位揭露（主打實際牌告價非中間價）推翻中間價 deferred 裁決；中間價改名 marketMidCounterfactual 並定位為對照組；主匯率數值改名 publishedRate 並以 quoteNature + quoteAvailability 平衡精準與不過度承諾；精準度落差升為一級欄位但只依附 amountTiers；列出 6 項需外部資訊的未定案 |
| 2026-08-26 | v7.0  | 查證台銀免手續費推翻 feeCoverage=unknown，改 fee:0 + pricingScope；新增 comparisonProfile 取代 rateType 字串比對（避免錯殺唯一可比對）；十二項逐項裁決（5 採納 7 修正）；覆蓋範圍與可得性分離；新增 8 項續議與阻塞分析，確認 PR 1 不被阻塞                                         |
| 2026-08-26 | v6.0  | 第二輪獨立審查推翻三項裁決：`amountTiers` 改為納入、`grossReceivedAmount` 否決、`comparisonBenchmark` 延後；新增 `comparablePairs` 強制欄位與 §13.3.4 只有一組可比對的實測；新增 §14 產品定位界定與 §15 十二項待對齊清單                                                           |
| 2026-08-26 | v5.0  | 新增 §13 權威聚合器設計：Wise Comparison API 實測、8 條提取原則的獨立評估（僅 3 條完全成立）、provider.kind + providerRole、cash/spot 正交、中價不升格改立 comparisonBenchmark、grossReceivedAmount 折衷、十項要素與四階段路徑                                                     |
| 2026-08-26 | v4.0  | 補生產級 API 實測對照（Wise／Stripe／OANDA／exchangerate-api／ECB／schema.org）與版本治理標準（AIP-180、RFC 9745/8594、Zalando #185–#191）；新增 payload 層級欄位 `nextUpdateAt`／出處連結；補 PR 3 的棄用 header 與流量監控驗收                                                   |
| 2026-08-26 | v3.1  | `status` 改採 ECB `CL_OBS_STATUS` 官方碼表子集（不自創字串）；釐清正規化不屬 status 而由 `rateUnit` 自我描述；裁決 `spread` 對外輸出                                                                                                                                               |
| 2026-08-26 | v3.0  | 補 ECB SDMX／schema.org／ISO 20022 權威對照；裁決 rateType 為平行維度、publishedAt 不回填；`referenceRateStatus` 泛化為 `status`；新增 `spread`；記錄 JSON-LD 語意優於資料 API 的對比                                                                                              |
| 2026-08-26 | v2.0  | 產品裁決硬切、取消 sunset；v3 範圍擴大至台銀；歷史 419 檔全轉換；補 Codex 7 項風險；PR 由 4 收斂為 3                                                                                                                                                                               |
| 2026-08-26 | v1.0  | 初版：上游遷移調查、v2 命名方案失效判定、雙軌規劃                                                                                                                                                                                                                                  |
