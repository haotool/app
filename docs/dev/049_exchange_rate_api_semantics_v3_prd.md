# 匯率 API 語意 v3 正名與 MoneyBox 上游遷移 PRD

> **建立時間**: 2026-08-26T14:00:00+08:00
> **版本**: v4.0
> **狀態**: ✅ 已裁決，待實作
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

1. **輪詢契約**：exchangerate-api 提供 `time_next_update_*`，明確告訴消費端何時再拉。本專案排程為每 5 分鐘，可直接換算為 `nextUpdateAt`，同時降低 CDN 負載。
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

每筆 rate row 的維度與量值（維度對齊 ECB SDMX，語彙對齊 schema.org）：

| 欄位                       | 型別                              | 定義                                                         | 缺值行為          | 權威依據                                    |
| -------------------------- | --------------------------------- | ------------------------------------------------------------ | ----------------- | ------------------------------------------- |
| `rateType`                 | `"cash"` \| `"spot"`              | **一級平行維度**，非巢狀於 rate 之下（受控詞彙）             | 必填              | ECB `EXR_TYPE`；ISO 20022 SPOT              |
| `customerBuy.fromCurrency` | string                            | 客戶付出的幣別                                               | 必填              | ECB `CURRENCY_DENOM`；schema.org `currency` |
| `customerBuy.toCurrency`   | string                            | 客戶取得的幣別                                               | 必填              | ECB `CURRENCY`；schema.org `priceCurrency`  |
| `customerBuy.rate`         | number                            | `received = paid × rate`                                     | 必填              | schema.org `UnitPriceSpecification.price`   |
| `customerBuy.rateUnit`     | `"TO_PER_1_FROM"`                 | 固定值，明示「每 1 單位來源幣換多少目標幣」                  | 必填              | FX `CCY1/CCY2 = X` 恆 per-1                 |
| `customerSell.*`           | 同上                              | 反方向                                                       | 必填              | —                                           |
| `spread`                   | number \| null                    | `customerSell.rate − customerBuy.rate`（同向表示）           | 無法計算時 `null` | schema.org `exchangeRateSpread`             |
| `referenceRate`            | number \| null                    | 外部市場基準價                                               | 上游未提供 `null` | Stripe `reference_rate`                     |
| `referenceRateProvider`    | string \| null                    | 基準價出處                                                   | 無基準時 `null`   | Stripe `reference_rate_provider`            |
| `status`                   | ECB `CL_OBS_STATUS` 碼（見 §4.4） | **每筆值自帶狀態碼**，說明缺值或品質；禁止用 `null` 代表語意 | 必填              | **ECB `CL_OBS_STATUS`**                     |
| `observedAt`               | ISO string                        | **我方抓取時間**                                             | 必填              | ECB series 屬性 `COLLECTION`                |
| `publishedAt`              | ISO string \| null                | **上游宣告的發布時間**；缺值時**不得回填**，以 `status` 說明 | 上游未提供 `null` | ECB `TIME_PERIOD` 與屬性分離                |

**`sourceDenominator` 移出公開 payload**，只留在轉換 manifest 供稽核。

> **為何用 `fromCurrency`/`toCurrency` 而非 Wise 的 `source`/`target`**：本專案 payload 既有頂層 `source: "MoneyBox"` 表示**資料提供者**，若再用 `source` 表示**來源幣別**會產生名稱碰撞。Wise 沒有此問題（其 payload 無 provider 欄位）。

### 4.3.1 payload 層級欄位（非 rate row）

生產級 API 普遍具備、本專案應補上（依據 §2.9.1）：

| 欄位                                        | 定義                                    | 依據                                    |
| ------------------------------------------- | --------------------------------------- | --------------------------------------- |
| `schemaVersion`                             | `"3.0"`                                 | Google AIP-180：語意變更須 major 版本   |
| `nextUpdateAt`                              | 下次排程更新時間（本專案排程每 5 分鐘） | exchangerate-api `time_next_update_utc` |
| `provider` / `documentation` / `termsOfUse` | 出處與條款連結（指向 open-data 頁）     | exchangerate-api payload 內建出處       |

> `nextUpdateAt` 對本專案有額外效益：明確的輪詢契約可降低 CDN 拉取次數（現況主匯率檔 69,487 hits/月）。

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

同向表示以避免符號歧義：`spread = customerSell.rate − customerBuy.rate`，恆為非負。

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
| `referenceRate` 不可由 buy/sell 平均生成                                                       | 算術中點冒充市場價                  |
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

| #   | 風險                            | 緩解                                              |
| --- | ------------------------------- | ------------------------------------------------- |
| 1   | 欄位反轉取到價差錯誤側          | 映射方向守門測試 + §2.2 三重驗證                  |
| 2   | JPY/IDR/VND 100 倍錯誤          | 非 TWD 專屬的單位健全性檢查                       |
| 3   | 算術中點誤稱市場價              | 移除 `midMarketRate`，改 `referenceRate` + status |
| 4   | 上游再次改 schema 無人察覺      | 20 幣別快照 + manifest 分母守門                   |
| 5   | 兩軌混合發佈導致無法歸因        | 強制拆 PR（§3.2）                                 |
| 6   | v3 欄位再被「只驗文件」測試掩護 | 跨 provider 換算不變式數值測試                    |

### 9.2 Codex 補充（我未想到）

| #   | 風險                                                   | 緩解                                          |
| --- | ------------------------------------------------------ | --------------------------------------------- |
| 7   | **CDN 混合版本快取**導致 schema 不一致                 | PR 3 原子化發布 + 發布後強制 purge            |
| 8   | 台銀 `rateType`（cash/spot）攤平時**遺失語意**         | v3 結構須保留 rateType 維度                   |
| 9   | 歷史檔缺欄**不得補洞**                                 | 一律留 `null`，禁止推導填值                   |
| 10  | `sell` 取倒數的**浮點精度／捨入漂移**                  | 轉換 manifest 記錄原值，比對容差              |
| 11  | 新 MoneyBox 無 `base` 時**不得用 `(buy+sell)/2` 冒充** | `referenceRateStatus: not_provided_by_source` |
| 12  | `publishedAt` 與 `observedAt` **混用**                 | 兩者皆為必填欄位，守門測試禁止互相代入        |
| 13  | **app 仍讀 legacy `getSellRate`**，PR 3 硬切會斷       | PR 3 前置：先改讀 v3 並驗證等價               |

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

## 修訂紀錄

| 日期       | 版本 | 變更                                                                                                                                                                                                                             |
| ---------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-26 | v4.0 | 補生產級 API 實測對照（Wise／Stripe／OANDA／exchangerate-api／ECB／schema.org）與版本治理標準（AIP-180、RFC 9745/8594、Zalando #185–#191）；新增 payload 層級欄位 `nextUpdateAt`／出處連結；補 PR 3 的棄用 header 與流量監控驗收 |
| 2026-08-26 | v3.1 | `status` 改採 ECB `CL_OBS_STATUS` 官方碼表子集（不自創字串）；釐清正規化不屬 status 而由 `rateUnit` 自我描述；裁決 `spread` 對外輸出                                                                                             |
| 2026-08-26 | v3.0 | 補 ECB SDMX／schema.org／ISO 20022 權威對照；裁決 rateType 為平行維度、publishedAt 不回填；`referenceRateStatus` 泛化為 `status`；新增 `spread`；記錄 JSON-LD 語意優於資料 API 的對比                                            |
| 2026-08-26 | v2.0 | 產品裁決硬切、取消 sunset；v3 範圍擴大至台銀；歷史 419 檔全轉換；補 Codex 7 項風險；PR 由 4 收斂為 3                                                                                                                             |
| 2026-08-26 | v1.0 | 初版：上游遷移調查、v2 命名方案失效判定、雙軌規劃                                                                                                                                                                                |
