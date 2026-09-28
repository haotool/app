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

歷史轉換工具 `scripts/migrate-fx-history.mjs` 需要在安裝依賴的 Git checkout 執行，保存來源 bytes hash、轉換版本、輸出 hash、coverage 與隔離原因；路徑 provider 與 payload 的 `base`／`source`／schema identity 不一致時 quarantine。MoneyBox 檔名日期與 legacy Seoul snapshot 日期不符時也會隔離；若來源已超出 30 日保留視窗，保留 evidence 並排除於發布歷史即可接受，不阻斷其餘有效資料遷移。

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

### S3 API attribution

`apps/shared/fx/publisher-metadata.mjs` 是 v2／v3 共用發布者標示 SSOT。v2 `api/latest.json`、`api/pairs/*.json` 與 OpenAPI additive publisher 從此來源產生；terms URL 指向 `/ratewise/open-data/#api-terms`。OpenData 條款內容位於 RateWise SEO metadata SSOT，Markdown 與 `llms*.txt` 由生成器輸出。`security-headers/src/worker.js` 從同一 SSOT 為 `/ratewise/api/*` 與 `/ratewise/openapi.json` 回應附加 Terms Link；FAQ Markdown alternate Link 也由此 Worker 產生。Dataset JSON-LD 由 SEO metadata builder 產生，以 `usageInfo` 指向條款並以 `isBasedOn` 列出 provider metadata 的來源 URL。此工作不變更 `FX_V3_PUBLIC=false`。

消費者若直接從 jsDelivr CDN（`cdn.jsdelivr.net/gh/haotool/app@data/...`）抓取資料，不會經過 security-headers Worker；其條款由 JSON 的 `publisher.termsUrl` 與 Open Data 頁傳達，不會附在 Link header。

`api/latest.json`、pair JSON 與 OpenAPI 在 `FX_V3_PUBLIC=false` 時維持 schemaVersion 2.0，只新增 additive／deprecated metadata；來源發布時間為未知時不補成今天。最小驗證：

```bash
pnpm generate:fx --check
pnpm test:fx
pnpm --filter @app/ratewise exec vitest run
pnpm typecheck
pnpm build:ratewise
```

正式切換前仍需由啟用後的 data publisher workflow 全量遷移 data branch 歷史，完成 provider／授權／部署／瀏覽器與人工產品 gate，並重新核對 current pointer 的 live hash chain。

## S4 啟用檢查清單

R5 裁決延後至 S4（`FX_V3_PUBLIC` 改為 `true` 的切換 PR）處理，切換前逐項確認：

- [x] v3 `manifest.history` 接線：publisher 每輪從 data branch 全量重算日快照遷移結果，再引用 30 日內成功轉換的 content-addressed objects；發佈前驗證 SHA-256 與 snapshot schema（`scripts/publish-fx-release.mjs`, `scripts/migrate-fx-history.mjs`, `apps/shared/fx/history.mjs`）。MoneyBox 檔名日期以 `extractSeoulSnapshotDate` 對帳，沿用 v2 `updateTime` 首爾日曆日；超出保留視窗的日期不符項目可帶 evidence 隔離。
- v3 多幣模式每鍵 16–31ms：驗證前移與 memo，回到 INP 預算內。
- rollback（`FX_V3_PUBLIC` 翻回 `false`）後清理 localStorage `ratewise.fx.v3.active` 與 `ratewise.fx.v3.history:*`。
- manifest per-currency denominator（`unitAmount`）揭露評估。
- provider 再散布條款 human gate（PRD §17 #6、§21 F8）；S3 條款頁已上線至程式與靜態產物，仍須確認正式站部署，且不解除上游再散布 gate。
- MoneyBox 9 位有效數字倒數（如 KRW→GBP）是否需提高倒數精度（PRD §18.4）。
- 刪除 `S4-DELETE` 標記項目：`exportLegacyRates`、`apps/ratewise/src/config/api-semantics-v2.ts`、`useLegacyCurrencyConverter.ts`，以及 `isFxV3Public()` 建置期 plugin 改寫與 legacy SW 歷史路由。
- v3 的 minor changeset 於 S4 切換 PR 提出（本 PR 僅 patch）。
- [x] v2 保留既有 job-level `data-branch-push` 鎖與 cadence；所有 v2 push 改為 fast-forward、rebase 失敗不再吞錯，v3 維持獨立鎖。競態時 v2 push 會安全失敗或 rebase 保留 v3 commit（`.github/workflows/update-latest-rates.yml`, `update-moneybox-rates.yml`, `update-historical-rates.yml`, `publish-fx-v3.yml`）。
- [x] data checkout 關閉持久憑證，push 時才注入 token；各資料 job 均有 timeout。
- [x] `update-historical-rates.yml` 以 Actions jobs API 計算 `update-latest` v2 job 的成功結論；publish-v3 失敗不會影響 v2 liveness。三個資料 workflow 與 reusable publisher job 均設 timeout。
- `fxSnapshotService` 的 localStorage LRU 與 `ratewise.fx.v3.*` 前綴清理。
- [x] MoneyBox `publishedAt` 加入未來時間、回退與 response-time 判定；response-time／不合理時間在 v3 provider snapshot 設為 `null`（unknown），v2 latest/history 保留原值（`scripts/fetch-moneybox-rates.js`, `scripts/publish-fx-release.mjs`, `scripts/__tests__/fetch-moneybox-rates.test.ts`）。現有 repo fixture 僅記錄單筆有效時間，未提供重複樣本或 data branch 歷史檔；不宣稱上游語意已由多樣本證實，判定採保守未知。
- [x] 歷史遷移 CLI：`node scripts/migrate-fx-history.mjs --data-root <data-checkout>/public/rates`；需 Git checkout 與已安裝依賴。每次 publish job 會自動全量重算遷移結果，不需手動先遷移。
- 啟用後的 runtime kill switch（data 端降級）；SW `history-validated-v2` 快取於回滾時清理。
- split-meow v3 fallback 參考值（`isFallback`）的 UI 標示：final round 已還原 flag off 可達文案為 main，S4 需重新設計提示文案。

## ACTIVATION RUNBOOK

以下步驟只啟用 data plane；`FX_V3_PUBLIC` 保持 `false`，App 與公開站台切換另走 S4 PR。

1. 啟用 v3 data publisher：

   ```bash
   gh variable set RATEWISE_FX_V3_ENABLED --body true
   ```

2. 依序 dispatch `Update Latest Exchange Rates`、`Update MoneyBox Exchange Rates`，讓兩個 provider 都有 release；publisher 會自行全量重算歷史遷移，不需手動執行 migration CLI：

   ```bash
   LATEST_DISPATCHED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   gh workflow run update-latest-rates.yml --ref main
   LATEST_RUN_ID=$(gh run list --workflow update-latest-rates.yml --event workflow_dispatch --json databaseId,createdAt --jq "[.[] | select(.createdAt >= \"$LATEST_DISPATCHED_AT\")] | max_by(.createdAt).databaseId")
   gh run watch "$LATEST_RUN_ID" --exit-status

   MONEYBOX_DISPATCHED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   gh workflow run update-moneybox-rates.yml --ref main
   MONEYBOX_RUN_ID=$(gh run list --workflow update-moneybox-rates.yml --event workflow_dispatch --json databaseId,createdAt --jq "[.[] | select(.createdAt >= \"$MONEYBOX_DISPATCHED_AT\")] | max_by(.createdAt).databaseId")
   gh run watch "$MONEYBOX_RUN_ID" --exit-status
   ```

   `publish-v3` 可能因 `fx-v3-publish` concurrency group 取消較早的 pending run；若任一 run 被取消，重新 dispatch 該 workflow。兩個 workflow 都成功後才驗證。

   `migration.json` 中，超出 30 日保留視窗的 MoneyBox Seoul 日期不符項目可接受 quarantine，前提是來源 evidence 與原因均存在、其餘有效歷史轉換成功，且最後 release 驗證通過。

3. checkout 最新 `data` branch，驗證 pointer、manifest、provider/history objects 的 hash 與 schema：

   ```bash
   DATA_CHECKOUT=/path/to/data-checkout
   git -C "$DATA_CHECKOUT" pull --ff-only origin data
   node scripts/verify-fx-v3-release.mjs --data-root "$DATA_CHECKOUT/public/rates"
   ```

   輸出需列出每個 provider 的 `history`、`dateGaps`、`quarantined`，例如 `{"providers":{"bot":{"history":30},"moneybox":{"history":30}}}`；每個 provider 必須有 1 至 30 筆 history。`dateGaps` 回報不連續日期，不會單獨令驗證失敗。再確認 `current.json` 的 `releaseId` 等於 manifest SHA，history 日期在最近 30 日。公開 pointer：`https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/v3/current.json`。

4. 回滾 data plane，停用後保留 v3 objects/current 作診斷，不改 v2 `latest.json`：

   ```bash
   gh variable set RATEWISE_FX_V3_ENABLED --body false
   ```

   若 `FX_V3_PUBLIC` 已在另一次 S4 PR 開啟，先以獨立 PR 翻回 `false`，再清除 `ratewise.fx.v3.active`、`ratewise.fx.v3.history:*` localStorage keys 與對應 SW history cache。
