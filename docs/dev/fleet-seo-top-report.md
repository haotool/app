# Fleet SEO Top — RateWise SEO 頂級化改動報告

- 日期：2026-07-06
- 分支：`feat/fleet-seo-top`（獨立 worktree，未 commit，待 PM review）
- 驗證：`cd apps/ratewise && pnpm vitest run` → **177 files / 4012 tests 全綠**（含新增 12 條守門測試）

## 改動清單

| #   | 檔案                                                        | 類型                                                          |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | `apps/ratewise/src/config/seo-metadata/currency-landing.ts` | title/description 重寫、WebPage+speakable schema、正反向互鏈  |
| 2   | `apps/ratewise/src/components/CurrencyLandingPage.tsx`      | 金額頁 WebPage 節點過濾、資料來源標示用語對齊 SSOT            |
| 3   | `apps/ratewise/scripts/generate-llms-txt.mjs`               | llms.txt 注入每日匯率快照、修正漂移的 title 範例、主題數 6→7  |
| 4   | `apps/ratewise/public/llms.txt` / `llms-full.txt`           | 由 #3 重新生成（prebuild 產物）                               |
| 5   | `apps/ratewise/src/config/__tests__/seo-ssot.test.ts`       | 新增 12 條守門測試（title 新鮮度、答案密度、speakable、互鏈） |
| 6   | `apps/ratewise/src/llms-txt.spec.ts`                        | 更新金額頁 title 範例斷言、新增數據新鮮度斷言                 |

## 任務 1：42 頁 title/description 審查

### 正向幣別頁（17 頁，如 /usd-twd/）

- Title：`即時${幣名}匯率 — 台銀實際賣出價 | ${code}/TWD` → `即時${幣名}對台幣匯率 — 今日台銀實際賣出價 | ${code}/TWD`
  - **依據**：補上「對台幣」對齊「美金 台幣匯率」類 head query；「今日」是匯率查詢最高頻新鮮度修飾詞，直接提升 SERP 意圖匹配與 CTR。
- Description：改為 answer-first——首句直接給即時賣出價數字與牌告日期：
  `台銀美金現金賣出 1 USD = 32.215 TWD（2026-07-04 牌告，每日更新）。換匯前先確認實際要付多少台幣（非中間價）。…`
  - **依據**：SERP snippet 出現具體數字可顯著提升 CTR（數字型 meta description）；數字由 `SEO_RATE_EXAMPLES`（每日 GitHub Actions 更新）注入，非寫死，通過既有 hardcoded-rate linter。
  - 無匯率快照時 fallback 原文案；`spotAvailable: false` 幣別（KRW/PHP/IDR/MYR/VND）不出現「即期切換」宣稱（守門測試維持全綠）。

### 反向幣別頁（17 頁，如 /twd-usd/）

- Title：`台幣換${幣名}匯率 — 出國換匯實際費率 | TWD/${code}` → `台幣換${幣名}即時匯率 — 今日台銀現金賣出價 | TWD/${code}`
  - **依據**：「出國換匯實際費率」模糊且無搜尋量；改為「即時／今日／現金賣出價」三個高意圖修飾詞，保留「台幣換」方向關鍵字（既有測試強制）。
- Description：首句給賣出價＋常見金額換算答案：
  `台銀現金賣出 1 USD = 32.215 TWD（2026-07-04 牌告），30,000 台幣約可換 931 USD。出國換美金前先用實際賣出價（非中間價）估算預算。…`
  - **依據**：反向頁搜尋意圖是「N 台幣能換多少」，直接在 snippet 回答；與正向頁 description 明確差異化，降低雙向頁 near-duplicate 風險。

### 核心內容頁（9 頁）

審查結果：FAQ／Guide／About／攻略頁等 title 24 字以上、description 80 字以上（既有守門測試把關），意圖匹配與差異化良好，**不改動**（避免無依據的 churn）。

## 任務 2：結構化資料擴充

- 幣別頁（34 頁）新增 `WebPage` JSON-LD，`speakable` 嵌套 `SpeakableSpecification`（`cssSelector: ['h1', 'h3']`），對準 `CurrencyAnswerHero` 的 answer-first h1 與快速答案 h3。
  - **依據**：schema.org / Google speakable 規範要求嵌套於 WebPage/Article；幣別頁已有可直接朗讀的 Answer Capsule 內容，補上標記可支援語音搜尋與 AI 摘要抽取。
- 金額頁（如 /usd-twd/500/）canonical 與幣對頁不同，於 `CurrencyLandingPage.tsx` 過濾幣對層 `WebPage` 節點，避免多個金額頁共用同一 `@id`。
- **不加** `Dataset`：頁面本體是即時工具頁而非資料集下載頁，強行標記有 spam 風險；資料開放語意已由 `/open-data/` 與 OpenAPI 承載。
- dist 驗證（build 後 grep）：
  - `"@type":"FAQPage"` 全站僅 `dist/faq/index.html` 1 處 ✅
  - `dist/usd-twd/index.html` 含 `WebPage` + `speakable` 節點 ✅
  - 同頁無重複 `@type`（金額頁 ExchangeRateSpecification 替換邏輯沿用）✅

## 任務 3：AI SEO（llms.txt / llms-full.txt）

- **修正文件漂移**：金額頁 title 範例仍是已淘汰的 v1 格式「買 500 美元要多少新台幣（USD/TWD）…」，與 `buildPairAmountSeo` 實際輸出不符；更正為 v2 格式「500 美金（USD）換台幣是多少？今日台銀實際價 | HaoRate」（llms.txt 與 llms-full.txt 各 1 處），並更新 spec 斷言防止回歸。
  - **依據**：AI agent 依文件描述比對實頁，格式不符降低可信度與引用意願。
- **數據新鮮度**：Popular Rates／TWD→外幣清單每行注入台銀現金賣出快照與日期（`（台銀現金賣出 1 USD = 32.215 TWD，2026-07-04）`）；Key Metrics 新增「匯率快照日期」行。數據來自 `SEO_RATE_EXAMPLES` SSOT，每日排程自動更新後 prebuild 重新生成。
  - **依據**：LLM 引用時偏好帶日期的具體數字（可驗證性）；llms.txt 從純連結目錄升級為可直接引用的答案來源。
- **事實修正**：主題風格數 6 → 7（補 Violet），對齊 `core.ts` FAQ SSOT（4 處）。
- Answer Capsule 句式審查：既有 Q/A 均為「一句話直接答案＋來源＋差異化」結構，可被直接引用，不需改動。

## 任務 4：內部連結（幣別頁互鏈）

- 審查發現：正反向幣對頁（/usd-twd/ ↔ /twd-usd/）**互不相鏈**，僅各自連到攻略頁。
- 修正：`relatedGuides` 首位加入對向幣對頁連結，label 帶方向關鍵字錨文字（正向頁→「台幣換美金」；反向頁→「美金換台幣」），其後保留攻略連結。
  - **依據**：雙向頁互鏈可互相傳遞相關性信號、降低孤島風險；錨文字即目標頁主關鍵字。34 頁 × 1 條新內鏈，dist 已驗證輸出。

## 任務 5：E-E-A-T 一致性

- 審查：Organization（sitewide `knowsAbout`）、About 頁 `Person` schema、`buildShareImageJsonLd` 的 `dateModified=BUILD_TIME` 均一致，無需改動。
- 修正 1 處資料來源標示不一致：幣別頁 footer「每 5 分鐘自動更新」→「約每 5 分鐘檢查更新」，對齊全站 SSOT 用語（首頁 eyebrow、llms.txt、FAQ 均為後者）。
  - **依據**：更新頻率宣稱不一致會被視為可信度雜訊；「約…檢查更新」也是更誠實的表述。
- 已知殘留（不在本次範圍）：`i18n/locales/zh-TW.ts` 的 `updateNote` 仍為「每 5 分鐘自動更新」，屬 i18n 層文案，建議後續統一。

## 預期影響

- **CTR**：34 個幣別頁 title 補「今日」、description 首句給即時數字，預期匯率類 query 的 SERP 點擊率提升。
- **AEO/GEO**：speakable 標記 + llms.txt 帶日期匯率快照，提升 AI 引擎直接引用密度與可驗證性。
- **抓取/相關性**：34 條新雙向內鏈補齊幣對叢集閉環。
- **風險控制**：全部文字走 SSOT 模板注入，無寫死匯率／年份；cash-only 幣別分支、template-bleed、phrase budget 守門測試全數通過。

## 驗證證據

```
Test Files  177 passed | 1 skipped (178)
Tests       4012 passed | 3 skipped | 1 todo (4016)
```

- dist grep：FAQPage 僅 1 頁；usd-twd 頁含新 title、meta description（含 32.215 數字）、WebPage speakable、/twd-usd/ 互鏈。
- `node scripts/generate-llms-txt.mjs` 重新生成成功（v2.27.1，17+17 幣別頁）。
