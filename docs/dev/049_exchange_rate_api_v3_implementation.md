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

**公開切換 SSOT（expand–contract）**：`apps/shared/fx/public.ts` 的 `FX_V3_PUBLIC`（RateWise 經 `api-endpoints.ts` 重新匯出，split-meow 直接匯入）（預設 `false`）同時控制 App 是否讀取 v3，以及站台生成器（`api/latest.json`、`api/pairs/*`、`openapi.json`、`open-data`、`llms*.txt`、`about`／`index` 鏡像）是否宣告 v3。`false` 時 App 使用凍結的 `useLegacyCurrencyConverter`（與 main 等價：MoneyBox 手動換算、legacy 趨勢圖、不顯示 best 與 v3 新鮮度提示、不輪詢 v3 current），公開資料面維持 schemaVersion 2.0 與 openapi 2.1.0；`/ratewise/api/v3/contract.schema.json` 可預先存在但不被宣告為主要入口。S4 切換順序：先開 data workflow 的 `RATEWISE_FX_V3_ENABLED` 產出並驗證，再以一行 PR 將 `FX_V3_PUBLIC` 改為 `true`；回滾即翻回。守門：`fx-v3-inert.test.tsx`、`fx-v3-public-surface.test.ts`、split-meow `exchangeRate.test.ts`（false 時只請求 v2 MoneyBox CDN、不顯示參考值提示，未來時間不判過期）。

**建置期閘門與 bundle 惰性**：App 程式碼一律以 `isFxV3Public()`（`apps/shared/fx/public.ts`，`typeof __FX_V3_PUBLIC_BUILD__` 守護，無 define 的 vitest／Node 環境回落可 mock 的 `FX_V3_PUBLIC`）判斷。rolldown 不內聯函式也不跨模組折疊常數，因此共用的 `apps/shared/fx/vite-plugin.mjs`（RateWise 與 split-meow 皆載入）負責：define `__FX_V3_PUBLIC_BUILD__`、將 App 原始碼中的 `isFxV3Public()` 呼叫改寫為字面值、以 `treeshake.moduleSideEffects` 宣告 `shared/fx` 無副作用；RateWise 另將 `decimal.js` 拆為 `vendor-decimal` chunk。實測 gzip（`gzip -9`，gen2 round 3 @3005479b4）：RateWise 首頁 initial JS main 331,192／head 333,023（+1,831 B；reviewer 以其量法測得 +1,893 B）；split-meow 全部 app JS main 161,644／head 161,677。守門：`prerender.test.ts`（`dist/index.html` 不預載 `fx`／`release`／`vendor-decimal`）、`public.test.ts`（plugin 改寫與 define）。Service worker 的歷史快取策略與清理清單在 flag off 時與 main 相同。

**SEO 頁惰性**：`FX_V3_PUBLIC=false` 時幣別頁（title／meta／FAQ／JSON-LD 含 price 與 validFrom）、首頁、about 鏡像與幣別頁 CTA 沿用 main 的 `update-seo-rate-examples.mjs` 生成器與文案；v3 方向化 SEO 文案（雙向搜尋意圖改寫）移至 S3 SEO PR。以 main 與本分支 dist 逐頁比對（時間戳與資產雜湊正規化）驗證：264 頁 0 差異，僅 `open-data` 頁／鏡像與 `llms*.txt` 授權文案不同。

`useLegacyCurrencyConverter.ts` 是 expand–contract 的暫存副本，於 S4 切換 PR（`FX_V3_PUBLIC` 改為 `true` 並完成 contract 階段）刪除。

新鮮度只看來源發布時間：台銀 36 小時、MoneyBox 24 小時（`FRESHNESS_MAX_HOURS`）；`sourcePublishedAt=null` 為 `unknown`，UI 分別顯示「來源未提供發布時間」與「已超過更新門檻」。公開 contract 固定輸出至 `/ratewise/api/v3/contract.schema.json`，current pointer 更新後由工作流 purge mutable URL。

排程工作流預設不切換 v3；只有 repository variable `RATEWISE_FX_V3_ENABLED=true` 才由 `publish-v3` job 呼叫共用 reusable workflow `.github/workflows/publish-fx-v3.yml`（`workflow_call`，`timeout-minutes`、`!cancelled()`）提交 v3 pointer 與 objects。v3 使用獨立 concurrency group `fx-v3-publish`，`data-branch-push` 鎖只在 v2 job 層級，v3 的安裝與發布時間不延長 v2 鎖、不致排隊中的 v2 run 被取代；data checkout 皆 `persist-credentials: false`，push 時才由 `commit-fx-v3-release.sh` 以 `http.extraheader` 注入 token。v2 job（fetch → commit → purge）不安裝依賴、不跑 `generate:fx`、不發布 v3；`publish-v3` 失敗會標紅但不阻斷 v2，也不改寫 v2 `latest.json`。v2 抓取遇壞列、未映射幣別或無時區 `publishedAt` 只跳過該列並警示，不中止 v2（與 main 一致）；v2 `latest.json` 不輸出 `lastSuccessfulCheckAt`（牌價未變不改寫檔案，最後成功檢查由 v3 manifest 記錄）；台銀掛牌時間只採信擷取前 7 天至後 10 分鐘內的值。rate workflows 只由排程、手動與既有腳本／workflow 路徑觸發，不因 `pnpm-lock.yaml` 或 `apps/shared/fx/**` push 觸發。

歷史 aggregate（`generate-history-aggregate.mjs`）以「應有視窗」（前 30 個臺北日）計算覆蓋率：缺日或壞檔逐檔跳過並警示，只有視窗全空才拒寫；台銀 `history-30d.json` 保留 main 的 TWD 首欄。`update-historical-rates.yml` 與 `update-moneybox-rates.yml` 的 aggregate 步驟 `continue-on-error`，當日快照與 v2 latest 照常 commit，run 結尾再以 `::error::` 標紅。台銀 `sourcePublishedAt` 取自 CSV 回應 `Content-Disposition` 檔名 `ExchangeRate@YYYYMMDDHHmm.csv`（與牌告頁「牌價最新掛牌時間」一致，臺北時間）；瀏覽器 fallback 另存該 header，無法取得時為 `null`，不以擷取時間回填。上游 `0` 以原文保留並正規化為 `suppressed`。provider `checkStatus` 取自身最後一次檢查結果，內容與狀態未變時不產生新 release；牌價未變時 fetch 腳本不改寫 `latest.json`，避免每輪 commit／purge。此 flag、data branch migration、provider redistribution 條款、UAT 與正式部署仍是 release gate，不由綠色單元測試代替。

## 公開表面與驗證

`api/latest.json`、pair JSON 與 OpenAPI 在 `FX_V3_PUBLIC=false` 時維持 schemaVersion 2.0，只新增 additive／deprecated metadata；來源發布時間為未知時不補成今天。最小驗證：

```bash
pnpm generate:fx --check
pnpm test:fx
pnpm --filter @app/ratewise exec vitest run
pnpm typecheck
pnpm build:ratewise
```

正式切換前仍需在 data branch 以固定 commit 執行歷史 migration、完成 provider／授權／部署／瀏覽器與人工產品 gate，並重新核對 current pointer 的 live hash chain。

## S4 啟用檢查清單

R5 裁決延後至 S4（`FX_V3_PUBLIC` 改為 `true` 的切換 PR）處理，切換前逐項確認：

- v3 `manifest.history` 尚未填入：趨勢圖需接線 v3 歷史發佈並做首爾日期（MoneyBox 當地日曆日）檢查。
- v3 多幣模式每鍵 16–31ms：驗證前移與 memo，回到 INP 預算內。
- rollback（`FX_V3_PUBLIC` 翻回 `false`）後清理 localStorage `ratewise.fx.v3.active` 與 `ratewise.fx.v3.history:*`。
- manifest per-currency denominator（`unitAmount`）揭露評估。
- provider 再散布條款 human gate（PRD §17 #6、§21 F8）；`publisher.termsUrl` 改指 S3 條款頁。
- MoneyBox 9 位有效數字倒數（如 KRW→GBP）是否需提高倒數精度（PRD §18.4）。
- 刪除 `S4-DELETE` 標記項目：`exportLegacyRates`、`apps/ratewise/src/config/api-semantics-v2.ts`、`useLegacyCurrencyConverter.ts`，以及 `isFxV3Public()` 建置期 plugin 改寫與 legacy SW 歷史路由。
- v3 的 minor changeset 於 S4 切換 PR 提出（本 PR 僅 patch）。
- v2 amend `--force-with-lease` 與 v3 push 競態：`update-latest-rates.yml` commit 步驟的 `git pull --rebase ... || true` 會吞掉 rebase 衝突；若恰與 v3 push 交錯可能覆蓋 v3 commit（`current.json` 回到前一版仍自洽），啟用 `RATEWISE_FX_V3_ENABLED` 前改用共用 concurrency group 或 v2 不 force push。
- `update-historical-rates.yml` 上游存活守門改看 v2 job 結論，而非 run 層結論（v3 job 失敗不應影響快照判斷）。
- `fxSnapshotService` 的 localStorage LRU 與 `ratewise.fx.v3.*` 前綴清理。
- MoneyBox `publishedAt` 語意以第二個樣本確認，並加單調性檢查。
- 啟用後的 runtime kill switch（data 端降級）；SW `history-validated-v2` 快取於回滾時清理。
- split-meow v3 fallback 參考值（`isFallback`）的 UI 標示：final round 已還原 flag off 可達文案為 main，S4 需重新設計提示文案。
