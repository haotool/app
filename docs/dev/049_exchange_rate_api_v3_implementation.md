# 匯率 API v3 實作基準

狀態：Implemented in `codex/ratewise-api-v3`，待 PR review、data branch migration 與正式環境 gate。

## 目的

讓使用者以「支付幣別 → 取得幣別、地點、方式、分店」使用匯率，不必理解銀行或換錢所的買賣視角；新增來源只需實作來源轉接，不改共用試算公式。

## 契約 SSOT

- `apps/shared/fx/schema.json` 定義 SourceQuote、QuoteSnapshot、試算、ProviderSnapshot、release manifest 與 current pointer。
- `apps/shared/fx/index.ts` 使用十進位字串、明確方向、`EXACT_IN`／`EXACT_OUT`、幣別 minor unit 與條件適用性。
- `scripts/generate-fx-contract.mjs` 產生 TypeScript 型別、consumer validator（`validators.js`，tolerant reader）與 producer 嚴格 validator（`producer-validators.js`，只供發布端，拒絕未知欄位）；禁止手改產出物。Node 腳本以原生型別剝除直接匯入 `apps/shared/fx/index.ts`，不另產 runtime bundle。
- `rate = 每 1 fromCurrency 可取得的 toCurrency`；業者原始牌告保留為 `sourceQuote.providerBuyPrice`／`providerSellPrice`（主詞業者、受詞 subjectCurrency），不可由國家或欄位名稱猜方向。公開契約細節以 PRD 049 §4.3／§4.3.1／§16.7（v11.5，ADR B3）為準：`quoteSeriesId`／`quoteId` 短格式（≤256）、`unavailableReason` 完整 enum、`dataKind` 必填、倒數 12 位小數 ROUND_HALF_EVEN、EXACT_OUT 由來源原值計算，manifest 帶 `$schema`／`publisher`／`providers[]`／`calculationRule`／`quoteAvailability`。

## 來源與試算

台銀與 MoneyBox 先轉成同一 `SourceQuote`，缺側保持 `null`，不借用另一通路或另一買賣側。現鈔、帳戶、國家、分店、面額、資格與金額範圍都是報價適用條件；未知來源發布時間、未知費用、固定 fallback、參考價與中介幣別推算不進入自動推薦。牌告中點只作業者買賣價的數學參考，不宣稱外部市場價或成交價。

歷史轉換工具 `scripts/migrate-fx-history.mjs` 只接受固定 data commit，保存來源 bytes hash、轉換版本、輸出 hash、coverage 與隔離原因；路徑 provider 與 payload 的 `base`／`source`／schema identity 不一致時 quarantine。

## Release 與相容性

`public/rates/v3/` 使用 content-addressed objects、manifest 與 current pointer。publisher 在 pointer rename 前驗證所有 provider 與 history references 的存在、SHA-256、schema、provider 綁定；history date 是快照儲存的 provider 當地日曆日，因此允許週末／休市 carry-forward（來源牌告日 ≤ 儲存日 ≤ release 日，且延遲不超過 14 日），不把來源時間冒充檔案日期。carry-forward 只沿用已驗證 immutable object。瀏覽器先驗證 latest atomic unit，歷史 window 另行載入與快取，localStorage key 以 release ID 隔離。既有 v2 檔案由原始來源值投影，避免對 rounded v3 rate 取倒數；sunset 不早於啟用後 30 日及 2026-12-31。

provider `failed`／`carried_forward` 快照只可供明確手動選擇，不能進入 best 自動排名。

**公開切換 SSOT（expand–contract）**：`apps/shared/fx/public.ts` 的 `FX_V3_PUBLIC`（RateWise 經 `api-endpoints.ts` 重新匯出，split-meow 直接匯入）（預設 `false`）同時控制 App 是否讀取 v3，以及站台生成器（`api/latest.json`、`api/pairs/*`、`openapi.json`、`open-data`、`llms*.txt`、`about`／`index` 鏡像）是否宣告 v3。`false` 時 App 使用凍結的 `useLegacyCurrencyConverter`（與 main 等價：MoneyBox 手動換算、legacy 趨勢圖、不顯示 best 與 v3 新鮮度提示、不輪詢 v3 current），公開資料面維持 schemaVersion 2.0 與 openapi 2.1.0；`/ratewise/api/v3/contract.schema.json` 可預先存在但不被宣告為主要入口。S4 切換順序：先開 data workflow 的 `RATEWISE_FX_V3_ENABLED` 產出並驗證，再以一行 PR 將 `FX_V3_PUBLIC` 改為 `true`；回滾即翻回。守門：`fx-v3-inert.test.tsx`、`fx-v3-public-surface.test.ts`、split-meow `exchangeRate.test.ts`（false 時只請求 v2 MoneyBox CDN、不顯示參考值提示）。`useLegacyCurrencyConverter.ts` 是 expand–contract 的暫存副本，於 S4 切換 PR（`FX_V3_PUBLIC` 改為 `true` 並完成 contract 階段）刪除。

新鮮度只看來源發布時間：台銀 36 小時、MoneyBox 24 小時（`FRESHNESS_MAX_HOURS`）；`sourcePublishedAt=null` 為 `unknown`，UI 分別顯示「來源未提供發布時間」與「已超過更新門檻」。公開 contract 固定輸出至 `/ratewise/api/v3/contract.schema.json`，current pointer 更新後由工作流 purge mutable URL。

排程工作流預設不切換 v3；只有 repository variable `RATEWISE_FX_V3_ENABLED=true` 才由獨立 `publish-v3` job 提交 v3 pointer 與 objects。v2 job（fetch → commit → purge）不安裝依賴、不跑 `generate:fx`、不發布 v3；`publish-v3` 失敗會標紅但不阻斷 v2，也不改寫 v2 `latest.json`。provider `checkStatus` 取自身最後一次檢查結果，內容與狀態未變時不產生新 release；牌價未變時 fetch 腳本不改寫 `latest.json`，避免每輪 commit／purge。此 flag、data branch migration、provider redistribution 條款、UAT 與正式部署仍是 release gate，不由綠色單元測試代替。

## 公開表面與驗證

`api/latest.json`、pair JSON、OpenAPI、SEO 快照與頁面共用 v3 投影；來源發布時間為未知時不補成今天。最小驗證：

```bash
pnpm generate:fx -- --check
pnpm test:fx
pnpm --filter @app/ratewise exec vitest run
pnpm typecheck
pnpm build:ratewise
```

正式切換前仍需在 data branch 以固定 commit 執行歷史 migration、完成 provider／授權／部署／瀏覽器與人工產品 gate，並重新核對 current pointer 的 live hash chain。
