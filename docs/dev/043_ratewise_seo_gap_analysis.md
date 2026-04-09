# RateWise SEO Gap Analysis

> 文件性質：開發審查 / SEO 缺口分析
> 建立日期：2026-04-09
> 狀態：Active
> 適用範圍：`apps/ratewise`

---

## 一、審查目的

整理 `RateWise` 當前 SEO 完成度、距離「頂級 SEO」仍缺的能力，以及 2026-04-09 依最近 GitHub PR 評論補上的最佳實踐修復。

---

## 二、當前已完成的 SEO 能力

### 2.1 技術 SEO 基礎

- 已建立 `SEOHelmet` 集中管理 `title`、`description`、`canonical`、Open Graph、Twitter Card、JSON-LD。
- 已建立 `robots.txt`、`sitemap.xml`、`llms.txt`、`openapi.json` 自動生成流程。
- 已建立 `SEO_PATHS` / `PRERENDER_PATHS` 單一真實來源，避免 sitemap、SSG、noindex 規則分裂。
- 已使用 `vite-react-ssg` 對公開索引頁與金額落地頁做預渲染，提升無 JS 首屏可爬性。

### 2.2 程序化 SEO 與索引控制

- 已建立正向幣別頁、反向幣別頁與代表性金額頁的路徑型落地頁策略。
- 任意金額 URL 皆可訪問並輸出專屬 title / description / canonical。
- 非索引金額頁已採 `noindex, follow + canonical` 合併訊號，避免無限金額 URL 稀釋索引品質。
- app-only 功能頁與開發展示頁已分流為 `noindex` 或 `Disallow`，控制 crawl budget。

### 2.3 金額頁索引策略定義

- `全金額 SEO 支援` 的正確意思是：任意金額 URL 都有可訪問頁面與 SEO-aware head，不代表任意金額都應成為獨立索引頁。
- `SEO_PATHS` / `sitemap.xml` 只收錄 canonical 索引頁。
- 代表性金額頁保留獨立索引與預渲染。
- 其餘任意金額頁維持可訪問，但以 `noindex, follow` 與 canonical 回基礎幣對頁。
- 這符合 Google 對 sitemap、canonical 與重複 URL 集管理的做法。

### 2.4 結構化資料與 E-E-A-T

- 已建立 `SoftwareApplication`、`Organization`、`Person`、`Article`、`BreadcrumbList`、`HowTo`、`FAQPage`、`ImageObject`。
- 已補作者 Person schema、`sameAs`、聯絡資訊與 About 頁可見作者訊號。
- 已建立 `llms.txt` / `llms-full.txt`，對 AI crawler 與 AEO 場景提供可引用入口。

### 2.5 驗證與回歸測試

- SEO 相關測試已具規模化覆蓋。
- 2026-04-09 抽跑：
  - `src/seo-best-practices.test.ts`
  - `src/config/__tests__/seo-ssot.test.ts`
  - `src/components/__tests__/SEOHelmet.test.tsx`
  - `src/seo-truthfulness.test.ts`
  - `src/llms-txt.spec.ts`
- 結果：`5` 個測試檔、`179` 個測試全數通過。

---

## 三、距離頂級 SEO 仍缺的能力

### 3.1 P0：多語索引策略

- 目前可索引語系仍以 `zh-TW` 為主。
- UI 雖有多語，但尚未形成可索引的英文 / 日文內容體系與完整 hreflang 網狀關係。
- 若目標包含國際流量，這是最大缺口。

### 3.2 P0：SEO 觀測與營運化

- 目前已有 build / test / verify，但尚未形成持續性的 SEO observability。
- 缺：
  - Search Console query / CTR / coverage 週期監控。
  - Core Web Vitals / CrUX 趨勢檢查。
  - 新頁索引速度與 sitemap 收錄率監測。
  - SERP title / description CTR 迭代機制。

### 3.3 P0：內容主題群擴張

- 現有內容強項為幣對頁與匯率解釋頁。
- 若要衝到頂級 SEO，仍需擴張主題群：
  - 刷卡匯率 / DCC / 海外手續費。
  - 機場換匯 vs 市區換匯。
  - 各銀行 / 各換匯通路差異。
  - 旅遊國家 / 城市換匯指南。
  - 匯款 / 外幣帳戶 / 臨櫃換鈔情境頁。

### 3.4 P1：站外權威訊號

- repo 內已具 E-E-A-T 技術訊號，但仍無法從程式碼證明外部權威。
- 頂級 SEO 通常仍需要：
  - 品牌 mention / 引用。
  - 高品質反向連結。
  - 真實評論或媒體提及。
  - 可辨識的 entity footprint。

---

## 四、2026-04-09 GitHub 最近評論審查摘要

### 4.1 查詢範圍

- Repo：`haotool/app`
- 分支對應 PR：`#235 feat(ratewise): Vite SSG 全金額路由預渲染架構`
- 使用 `gh pr view --comments` 與 `gh api graphql` 讀取 review threads。

### 4.2 最近評論中仍有價值的最佳實踐缺口

1. `prebuild` 不應因第三方 API 暫時失敗而硬阻斷整個 build。
2. `prebuild-fetch-rates.mjs` 在 CDN 失敗時，若直接採用過舊 `public/rates.json`，可能把 stale 匯率靜默寫入 SSG 頁面。

---

## 五、本次原子修復

### 5.1 修復：prebuild 的外部 API 硬依賴

**問題**

- `apps/ratewise/package.json` 的 `prebuild` 直接執行 `update-seo-rate-examples.mjs`。
- 該腳本若無法取得外部 API，會直接 `process.exit(1)`。
- 結果是第三方 API 短暫失敗時，整個 `build:ratewise` 被外部依賴阻斷。

**修法**

- 僅在 `prebuild` 情境注入 `SEO_RATE_EXAMPLES_OPTIONAL=1`。
- `update-seo-rate-examples.mjs` 在 optional 模式下，若 API 失敗則保留既有生成檔並繼續建置。
- 每日 GitHub Actions 的正式刷新仍保持嚴格模式，避免靜默吞掉資料品質問題。

**結果**

- 本地與 CI build 對短暫外部 API 更具韌性。
- 定期資料刷新工作流仍維持嚴格資料品質控制。

### 5.2 修復：fallback 匯率快照新鮮度檢查

**問題**

- `prebuild-fetch-rates.mjs` 在 CDN 失敗時會直接讀取 `public/rates.json`。
- 若該快照已過舊，可能把 stale 匯率靜默寫入金額頁。

**修法**

- 加入快照時間戳解析。
- 僅在 `public/rates.json` 年齡 `<= 24h` 時允許當作 fallback 使用。
- 若快照缺少可解析時間戳或已超過門檻，則忽略該 cache，退回明確標記的 default fallback。

**結果**

- 避免把多日過期的 repo 快照誤當成可信 SSG 匯率來源。
- 將 fallback 行為從「盲目接受 cache」收斂為「有條件接受 cache」。

---

## 六、後續建議

### P0

- 決定單語 SEO 或多語 SEO 正式戰略。
- 建立 Search Console / CrUX / coverage 的常態監控。
- 擴張主題群內容而非只擴 URL 數量。

### P1

- 只在有真實搜尋需求時，才把更多金額頁提升為 canonical 索引頁。
- 將 SEO 觀測結果納入 CI 或週期審查報表。
- 強化站外品牌與權威訊號。

---

## 七、2026-04-10 最終策略

- 不採用「所有金額頁都獨立可索引」。
- 採用「有限 canonical 集 + 任意金額可訪問頁」。
- 代表性金額頁保留 sitemap 與預渲染。
- 任意其他金額頁保留功能頁與 SEO-aware head，但不作為獨立索引目標。
- 結構化資料僅保留在可索引頁，避免 duplicate URL 擴散 schema 訊號。

### 依據

- Google Search Central：Sitemap 應只包含希望出現在搜尋結果中的 URL。
- Google Search Central：canonical 與其他 canonicalization 訊號不可互相衝突。
- Google Search Central：robots.txt 不用於 canonicalization。
- Google Search Central：JavaScript 生成的內容與 metadata 必須在渲染後可被讀取，但能在原始 HTML 正確提供時更穩定。
- Google Search Central：`noindex` 頁面不應同時被當作獨立索引目標。

## 八、結論

`RateWise` 已具備高成熟度的技術 SEO 基礎，現階段最需要補的不是更多 meta tag，而是：

- 多語索引戰略。
- 內容主題群擴張。
- SEO 觀測營運化。
- 站外權威建設。

本次則額外把最近 GitHub review comments 中仍有價值的兩個 build/資料新鮮度缺口，收斂成最小且可回歸驗證的原子修復。
