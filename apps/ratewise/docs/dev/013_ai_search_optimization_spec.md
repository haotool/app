# RateWise AI 搜尋優化規格（重置版）

**版本**: 2.0.0  
**建立時間**: 2025-12-02T03:29:33+08:00  
**更新時間**: 2025-12-02T04:07:44+08:00  
**狀態**: ✅ 主要完成（13 個長尾頁全數上線、17 URLs 已納入 sitemap）  
**依據**: 以 curl 取樣 20 個權威 SEO/AI 搜尋來源（Google Search Central/Developers、web.dev、Bing Webmaster、Ahrefs、Moz、Semrush、Backlinko、Search Engine Journal、Search Engine Land、Yoast、HubSpot、Screaming Frog、ContentKing 等）

---

## 目標

- 讓首頁 / FAQ / Guide 在 Google 傳統 SERP 與 AI Overviews/Answer Engine 中取得可視化摘要（FAQ/HowTo/Article/WebApplication schema 完整且不衝突）。
- 針對主要匯率長尾（USD/TWD、JPY/TWD 等）建立可索引落地頁，提升 Featured Snippet / People Also Ask 佔位率。
- 建立 AI/LLM 友善素材（llms.txt、結構化資料、語意明確的靜態 HTML），降低對 JS 的依賴。
- 建立可追蹤的 SEO/AI 觀測指標（Core Web Vitals、Rich Results、AI Overviews 可見度）。

---

## Linus 三問驗證

1. 這是真問題嗎？  
   ✅ 是。原有 AI 搜尋規格文件缺失，且缺乏長尾頁面與 AI Overviews 觀測，直接影響自然流量與 AEO。

2. 有更簡單的方法嗎？  
   ✅ 有。沿用現有 SSG + 靜態 JSON-LD、既有 FAQ/HowTo 模組，優先補文檔與落地頁模板，避免新增複雜框架。

3. 會破壞什麼嗎？  
   🟡 不動程式邏輯僅更新規格，但未來落地頁需驗證 sitemap/robots/SSG 一致性與 Core Web Vitals，不可犧牲 LCP/CLS。

---

## 現況盤點（2025-12-02 04:07）

### 技術/結構

- 首頁 `index.html` 已具備 WebApplication/Organization/WebSite + HowTo + FAQ + Article JSON-LD，靜態 meta 標籤完整（title/description/OG/Twitter/keywords/canonical/hreflang）。
- 子頁以 vite-react-ssg 預渲染，`SEOHelmet` 提供 canonical/alternates/faq/howTo/robots，自訂 `VITE_SITE_URL` 作 canonical 基準。
- `public/sitemap.xml` 覆蓋 **17 條 URL**（/, /faq, /about, /guide + 13 個幣別落地頁）並含 **34 個 hreflang link**。
- `public/robots.txt` 允許主要爬蟲與 AI bots，含 `sitemap` 聲明與 `llms.txt`。
- `llms.txt` 已提供品牌敘述、關鍵字、核心連結。

### 內容/頁面（✅ 已完成 13 個長尾落地頁）

| 路由       | 幣別            | 狀態      |
| ---------- | --------------- | --------- |
| `/usd-twd` | 美金 → 台幣     | ✅ 已完成 |
| `/jpy-twd` | 日圓 → 台幣     | ✅ 已完成 |
| `/eur-twd` | 歐元 → 台幣     | ✅ 已完成 |
| `/gbp-twd` | 英鎊 → 台幣     | ✅ 已完成 |
| `/cny-twd` | 人民幣 → 台幣   | ✅ 已完成 |
| `/krw-twd` | 韓元 → 台幣     | ✅ 已完成 |
| `/hkd-twd` | 港幣 → 台幣     | ✅ 已完成 |
| `/aud-twd` | 澳幣 → 台幣     | ✅ 已完成 |
| `/cad-twd` | 加幣 → 台幣     | ✅ 已完成 |
| `/sgd-twd` | 新加坡幣 → 台幣 | ✅ 已完成 |
| `/thb-twd` | 泰銖 → 台幣     | ✅ 已完成 |
| `/nzd-twd` | 紐幣 → 台幣     | ✅ 已完成 |
| `/chf-twd` | 瑞士法郎 → 台幣 | ✅ 已完成 |

- 每個落地頁均含：H1 標題、摘要文案、FAQ（4 題）、HowTo（3 步驟）、SEOHelmet（canonical/alternates）、內鏈。
- 首頁已補 4 條 FAQ 並同步 FAQPage schema；FAQ/Guide 已含 FAQPage/HowTo 結構化資料。

### 速度/Core Web Vitals

- Lighthouse Performance 0.97（2025-10-20 本地報告），首頁內聯骨架、資源預連接。
- `robots.txt` 禁止 `/*.json$`（避免 API 被索引）。
- 仍需 GSC/CrUX 真實數據驗證 LCP/CLS/INP。

### 站外/權威

- 尚未在文件中記錄 Search Console / Bing Webmaster 送審狀態，無外鏈或品牌提及追蹤基線。

---

## 主要缺口與風險

- ✅ ~~**長尾覆蓋不足**~~：已完成 13 個幣別落地頁，覆蓋主要貨幣對。
- 🟡 **AI Overviews / Answer Engine 觀測缺失**：無 AI SERP 可見度追蹤（GSC AIO 報告、第三方監測）。
- ✅ ~~**結構化資料覆蓋面**~~：每個落地頁已含 FAQ（4 題）+ HowTo（3 步驟）schema。
- 🔴 **外部訊號不足**：尚無外鏈策略與品牌提及監控，無法佐證 E-E-A-T。
- 🟡 **GSC/Bing 索引狀態未確認**：sitemap 已準備但尚未確認提交與索引覆蓋率。

---

## 改進方向（優先級）

### ✅ 已完成

- **P1**：維持現有靜態 meta + JSON-LD；避免新增會破壞 LCP/CLS 的腳本。
- **P1**：首頁補充 4 條常見問題，保持純文字答案以利 FAQ Rich Results。
- **P2**：生成 13 個貨幣對落地頁，每頁包含 H1、摘要、FAQ 4 題、HowTo 3 步、內鏈、canonical。

### 🔄 待完成

- **P1**：提交/確認 `sitemap.xml` 與 `robots.txt` 於 Google Search Console、Bing Webmaster，並記錄索引覆蓋率。（使用者責任）
- **P2**：建立 AI/AEO 觀測清單：AI Overviews 呈現率、FAQ/HowTo Rich Results 成功率、Brand/URL 提及次數（每月）。
- **P2**：站外信號：提交開源專案/工具目錄、技術/旅遊/財經部落格投稿，增加高相關 nofollow/ugc 引薦。
- **P3**：考慮新增 `Sitelinks SearchAction`（已在 WebSite schema）與 `SoftwareApplication` 延伸屬性（作業系統、安裝提示）以利 AI 解析。
- **P3**：英文國際化 `/en/` 版本（預估工時 2hr）。

---

## BDD 驗收草案（Red → Green → Refactor）

### ✅ 已驗收

- **場景：FAQ Rich Result**  
  假設 首頁含 FAQ JSON-LD (≥4 題、純文字答案)  
  當 Google 測試工具驗證 schema 時  
  那麼 FAQPage 應顯示「符合富摘要」且沒有警告。  
  **結果：✅ 通過**

- **場景：長尾落地頁模板**  
  假設 生成 13 個幣別頁面（含 H1、FAQ、HowTo、canonical、內鏈回首頁/FAQ）  
  當 執行 `pnpm build` 與 SSG 預渲染  
  那麼 頁面產出靜態 HTML，並在 `sitemap.xml` 中列出（17 URLs），LCP/CLS 未顯著上升。  
  **結果：✅ 通過（810 測試全綠，Preview Server 驗證通過）**

- **場景：hreflang 完整性**  
  假設 sitemap.xml 含 17 條 URL  
  當 執行 hreflang.test.ts  
  那麼 應有 34 個 xhtml:link 元素（每 URL × 2 語言）。  
  **結果：✅ 通過**

### 🔄 待驗收

- **場景：AI Overviews 可見度監測**  
  假設 設定 GSC AIO 報告與第三方監測關鍵詞（例如「匯率換算」、「美元換台幣」、「離線匯率工具」）  
  當 每週匯出報告  
  那麼 可見度趨勢應被記錄並納入版本變更備註。  
  **狀態：待使用者設定 GSC**

---

## 來源清單（以 curl 取樣，2025-12-02）

1. Google Search Central – SEO Starter Guide
2. Google Search Central – Creating helpful, reliable, people-first content
3. Google Search Central – AI Overviews & web results
4. Google Search Central – Featured snippets 文檔
5. Google Search Central – FAQPage 結構化資料
6. Google Search Central – HowTo 結構化資料
7. Google Search Central – Sitemaps 基礎
8. Google Search Central – Robots.txt 入門
9. web.dev – Core Web Vitals 概要
10. Bing Webmaster Guidelines
11. Ahrefs – Featured Snippets Guide
12. Moz – Featured Snippets 資源
13. Semrush – Featured Snippets 最佳實踐
14. Backlinko – AI Optimization / Answer Engine Optimization
15. Search Engine Journal – Google AI Overviews 觀測與優化
16. Search Engine Land – AI Overviews SEO 指南
17. Yoast – Structured Data for SEO
18. HubSpot – SEO Techniques 文章
19. Screaming Frog – Technical SEO Audit 流程
20. ContentKing – SEO Audit 檢查清單

（備註：MCP fetch 工具當前無法使用，以上來源以 curl 取得頁面 HTML 作查證。）

---

## 待觀測指標與量測

- Core Web Vitals（LCP/CLS/INP）— GSC + CrUX；首頁保持 LCP < 1s、CLS < 0.01。
- Rich Results 覆蓋率（FAQ/HowTo/WebApp/Article）— 使用 Search Console 測試工具與報告。
- AI Overviews / Answer Engine 呈現率 — 每週手動抽樣 + 監測工具記錄。
- 索引覆蓋率 — sitemap 提交後的有效/排除頁面數。
- Brand/外鏈 — 提及數、引用來源數（目標：每月 ≥3 個高相關提及）。

---

## 版本歷史

| 版本  | 日期             | 說明                                                                      |
| ----- | ---------------- | ------------------------------------------------------------------------- |
| 2.0.0 | 2025-12-02 04:07 | 🎉 完成全部 13 個長尾頁、sitemap 17 URLs、hreflang 34 links、810 測試全綠 |
| 1.2.0 | 2025-12-02 03:44 | 整合 20+ 權威 SEO 來源研究、驗證瀏覽器測試通過、更新優化路線圖            |
| 1.1.0 | 2025-12-02 03:38 | 完成首頁 FAQ 擴充、首個長尾頁 `/usd-twd`、同步 sitemap/路由               |
| 1.0.0 | 2025-12-02 03:29 | 重置文件，重新定義目標                                                    |
