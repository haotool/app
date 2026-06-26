# RateWise 行動 PWA 深度 QA 稽核 SPEC

## 文件控制

| 欄位                  | 內容                                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 文件名稱              | `2026-06-26-ratewise-mobile-pwa-qa-audit-spec.md`                                                                                                                          |
| 版本                  | v0.2.0-draft                                                                                                                                                               |
| 建立日期              | 2026-06-26                                                                                                                                                                 |
| 狀態                  | Draft — 12 個 QA 代理結果已合併；待修復 P1 後升 v1.0.0                                                                                                                     |
| 範圍                  | RateWise 行動 PWA（390×844 viewport）生產環境深度稽核                                                                                                                      |
| 環境 URL              | `https://app.haotool.org/ratewise/`                                                                                                                                        |
| 路由 SSOT             | `apps/ratewise/src/routes.tsx`                                                                                                                                             |
| 路徑 / Sitemap SSOT   | `apps/ratewise/seo-paths.config.mjs`                                                                                                                                       |
| Lighthouse smoke SSOT | `APP_CONFIG.lighthouseSmokePaths` → `['/', '/faq/', '/about/']`                                                                                                            |
| UX 對標基準           | `docs/superpowers/specs/2026-06-12-ratewise-2026-product-ux-spec.md`（**repo 尚未建立**；暫以 `AGENTS.md` Toss/Wowpass native 級對標與 production governance design 替代） |
| 稽核 Lead             | QA Lead Agent（本文件 smoke 基線）                                                                                                                                         |
| 並行代理              | 其他 QA 代理正在各頁面深度測試（結果待合併）                                                                                                                               |

### 路由 / Sitemap 數量 SSOT（2026-06-26 本地驗證）

| 類別                                        | 數量 | 說明                                   |
| ------------------------------------------- | ---: | -------------------------------------- |
| 可索引 SEO 路徑（`SEO_PATHS`）              |  249 | sitemap 收錄                           |
| 內容頁（`CONTENT_SEO_PATHS`）               |    9 | 含 `/seo-tech/`                        |
| 幣別落地頁（外幣→TWD）                      |   17 | 例 `/usd-twd/`                         |
| 反向幣別落地頁（TWD→外幣）                  |   17 | 例 `/twd-usd/`                         |
| 金額落地頁（外幣→TWD）                      |  104 | 例 `/usd-twd/500/`                     |
| 金額落地頁（TWD→外幣）                      |  102 | 例 `/twd-usd/10000/`                   |
| 法律頁（`LEGAL_SSG_PATHS`）                 |    1 | `/privacy/` — prerender + noindex      |
| App-only 功能頁（`APP_ONLY_NOINDEX_PATHS`） |    3 | `/multi/`、`/favorites/`、`/settings/` |
| 預渲染總計（`PRERENDER_PATHS`）             |  253 | 含 legal + app-only                    |
| 生產 sitemap `<loc>` 計數                   |  249 | curl 實測 2026-06-26                   |

---

## 測試方法論

### 裝置與視窗

| 項目                  | 設定                                            |
| --------------------- | ----------------------------------------------- |
| 主要 viewport         | 390×844（iPhone 14 級）                         |
| 次要 viewport（回歸） | 360×800、430×932                                |
| User-Agent            | Playwright 預設 Mobile Safari / Chromium mobile |
| 觸控                  | 模擬 touch；驗證 bottom nav 44px+ hit target    |

### PWA 模擬

| 檢查項         | 方法                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| Manifest       | `GET /ratewise/manifest.webmanifest` — 200、`application/manifest+json`         |
| Service Worker | `GET /ratewise/sw.js` — 200；DevTools Application → SW registered               |
| 離線 shell     | `GET /ratewise/offline.html` — 200                                              |
| SW 註冊腳本    | `GET /ratewise/registerSW.js` — **預期 200**（目前生產 404，見 P0）             |
| display-mode   | `window.matchMedia('(display-mode: standalone)')` — 瀏覽器模式為 `false` 屬預期 |
| 安裝提示       | 驗證 `beforeinstallprompt` / iOS Add to Home Screen 指引（Settings / FAQ）      |
| Precache       | 冷啟動後 Cache Storage ≥50 項（Workbox precache）                               |
| 版本更新       | `registerType: 'prompt'` — 更新提示不應造成 chunk Load failed                   |

### 生產 vs main

| 維度     | 生產（本 SPEC 基線）                      | main / PR preview                    |
| -------- | ----------------------------------------- | ------------------------------------ |
| URL      | `https://app.haotool.org/ratewise/`       | Zeabur preview / 本地 `pnpm preview` |
| Edge     | Cloudflare Worker `security-headers` v5.4 | 可能缺 Worker 標頭                   |
| 匯率資料 | live `data` branch / CDN                  | 可能為 fallback snapshot             |
| 判定優先 | **使用者可感知 bug 以生產為準**           | 修復驗證後再比對                     |

### Smoke 工具鏈（Lead 執行紀錄）

- Playwright MCP：390×844 viewport；首頁、FAQ 互動快照；console error 收集
- curl：全路由 HTTP 200 探測；sitemap 計數；manifest / SW 標頭
- 限制：並行 QA 代理共用 Playwright session，部分頁面批次腳本中斷；curl 補齊 HTTP 基線

### 測試區塊代碼（覆蓋矩陣「負責測試區塊」欄）

| 代碼 | 區塊                                       |
| ---- | ------------------------------------------ |
| A    | App Shell / Bottom Nav / 路由切換          |
| B    | 匯率換算核心互動（輸入、幣別切換、買賣價） |
| C    | 趨勢圖 / 歷史 / 下拉更新                   |
| D    | PWA / 離線 / SW / 安裝                     |
| E    | SEO / Head / JSON-LD / canonical / robots  |
| F    | 無障礙（VoiceOver、focus、aria、對比）     |
| G    | 效能（LCP、CLS、INP、bundle）              |
| H    | 內容正確性 / template-bleed                |
| I    | 分享 / OG / 深連結                         |

---

## 頁面覆蓋矩陣

> **圖例 — Smoke 狀態：** ✅ Pass · ⚠️ Pass with issues · ❌ Fail · ⏳ 待測 · 🔀 代理進行中  
> **索引狀態：** index = sitemap 收錄；noindex = 刻意不索引；N/A = 非 HTML 資產

### A. App Shell（底部導覽）

| 路徑          | 完整 URL               | 索引    | 測試區塊      | Smoke 摘要（Lead）                                                 |
| ------------- | ---------------------- | ------- | ------------- | ------------------------------------------------------------------ |
| `/`           | `/ratewise/`           | index   | A B C D E F G | ⚠️ HTTP 200；hydration #418；manifest 404 資源；bottom nav 8 links |
| `/multi/`     | `/ratewise/multi/`     | noindex | A B F G       | ✅ HTTP 200；robots noindex；h1 正確；bottom nav 存在              |
| `/favorites/` | `/ratewise/favorites/` | noindex | A B F         | ✅ HTTP 200（curl）；Playwright 批次中斷，待代理深測               |
| `/settings/`  | `/ratewise/settings/`  | noindex | A D F         | ✅ HTTP 200（curl）；PWA 安裝指引待驗                              |

### B. 內容 SEO 頁（`CONTENT_SEO_PATHS`）

| 路徑                      | 完整 URL                           | 索引  | 測試區塊 | Smoke 摘要（Lead）                                     |
| ------------------------- | ---------------------------------- | ----- | -------- | ------------------------------------------------------ |
| `/faq/`                   | `/ratewise/faq/`                   | index | E F H    | ✅ HTTP 200；accordion 20+ 組；麵包屑；MailtoLink 按鈕 |
| `/about/`                 | `/ratewise/about/`                 | index | E F H    | ✅ HTTP 200（curl + 並行 tab）；Lighthouse smoke 頁    |
| `/guide/`                 | `/ratewise/guide/`                 | index | E F H I  | ✅ HTTP 200（curl）；HowTo schema 待代理驗             |
| `/sell-rate-vs-mid-rate/` | `/ratewise/sell-rate-vs-mid-rate/` | index | E H      | ✅ HTTP 200（curl）                                    |
| `/cash-vs-spot-rate/`     | `/ratewise/cash-vs-spot-rate/`     | index | E H      | ⏳ curl 未抽測；SSOT 存在                              |
| `/card-rate-guide/`       | `/ratewise/card-rate-guide/`       | index | E H      | ⏳ curl 未抽測                                         |
| `/open-data/`             | `/ratewise/open-data/`             | index | E H      | ✅ HTTP 200（curl）                                    |
| `/seo-tech/`              | `/ratewise/seo-tech/`              | index | E H      | ✅ HTTP 200（curl）                                    |

### C. 法律頁

| 路徑        | 完整 URL             | 索引    | 測試區塊 | Smoke 摘要（Lead）                             |
| ----------- | -------------------- | ------- | -------- | ---------------------------------------------- |
| `/privacy/` | `/ratewise/privacy/` | noindex | E F      | ✅ HTTP 200（curl）；不在 sitemap（SSOT 正確） |

### D. 幣別落地頁 — 外幣→TWD（17）

| 路徑        | 索引  | 測試區塊 | Smoke 摘要          |
| ----------- | ----- | -------- | ------------------- |
| `/aud-twd/` | index | B E H I  | ⏳                  |
| `/cad-twd/` | index | B E H I  | ⏳                  |
| `/chf-twd/` | index | B E H I  | ⏳                  |
| `/cny-twd/` | index | B E H I  | 🔀 並行代理已開 tab |
| `/eur-twd/` | index | B E H I  | ⏳                  |
| `/gbp-twd/` | index | B E H I  | ⏳                  |
| `/hkd-twd/` | index | B E H I  | 🔀 並行代理已開 tab |
| `/idr-twd/` | index | B E H I  | 🔀 並行代理已開 tab |
| `/jpy-twd/` | index | B E H I  | ✅ HTTP 200（curl） |
| `/krw-twd/` | index | B E H I  | ⏳                  |
| `/myr-twd/` | index | B E H I  | 🔀                  |
| `/nzd-twd/` | index | B E H I  | 🔀                  |
| `/php-twd/` | index | B E H I  | ⏳                  |
| `/sgd-twd/` | index | B E H I  | ⏳                  |
| `/thb-twd/` | index | B E H I  | ⏳                  |
| `/usd-twd/` | index | B E H I  | ✅ HTTP 200（curl） |
| `/vnd-twd/` | index | B E H I  | ⏳                  |

### E. 幣別落地頁 — TWD→外幣（17）

| 路徑                               | 索引  | 測試區塊 | Smoke 摘要                         |
| ---------------------------------- | ----- | -------- | ---------------------------------- |
| `/twd-aud/` … `/twd-vnd/`（17 條） | index | B E H I  | ⏳ 待代理抽樣；SSOT 全收錄 sitemap |

### F. 金額落地頁（206 條 — 抽樣矩陣）

| 代表 URL                     | 索引  | 測試區塊 | Smoke 摘要                           |
| ---------------------------- | ----- | -------- | ------------------------------------ |
| `/usd-twd/500/`              | index | B E H    | ✅ HTTP 200（curl）                  |
| `/jpy-twd/10000/`            | index | B E H    | ⏳                                   |
| `/vnd-twd/1000000/`          | index | B E H    | ⏳                                   |
| `/twd-usd/10000/`            | index | B E H    | ⏳                                   |
| 其餘 202 條 canonical 金額頁 | index | B E H    | ⏳ 代理依 `INDEXABLE_*_AMOUNTS` 抽樣 |

### G. PWA / 系統資產

| 路徑                    | 索引 | 測試區塊 | Smoke 摘要（Lead）                  |
| ----------------------- | ---- | -------- | ----------------------------------- |
| `/manifest.webmanifest` | N/A  | D        | ✅ 200；`no-cache, must-revalidate` |
| `/sw.js`                | N/A  | D        | ✅ 200                              |
| `/registerSW.js`        | N/A  | D        | ❌ **404** — P0                     |
| `/offline.html`         | N/A  | D        | ✅ 200                              |
| `/sitemap.xml`          | N/A  | E        | ✅ 200；249 URLs                    |
| `/robots.txt`           | N/A  | E        | ⏳                                  |
| `/llms.txt`             | N/A  | E        | ⏳                                  |

---

## 發現摘要

### 跨代理總評（2026-06-26 合併）

| 維度                 | 判定                                                                     |
| -------------------- | ------------------------------------------------------------------------ |
| **核心換算功能**     | ✅ 通過（首頁 / Multi / 幣別頁 CTA → 首頁）                              |
| **Tab bar 四頁導航** | ✅ 通過（28 步 journey、7 深連結 back）                                  |
| **SEO 治理**         | ✅ 通過（noindex 三功能頁、FAQPage 唯一、MailtoLink、無 template-bleed） |
| **PWA steady-state** | ✅ 通過（SW activated 後離線、426 precache、prompt 模式）                |
| **Console = 0**      | ❌ **未達標**（全站 React #418 hydration）                               |
| **正式站版本**       | ⚠️ 2.24.1（repo 2.25.0）                                                 |

**簽核建議**：功能可上線；若 console=0 為 hard gate，需先修 P1-001 再簽核。

### P0 — 阻斷 / 生產信任

| ID  | 發現               | 證據                      | 影響                      |
| --- | ------------------ | ------------------------- | ------------------------- |
| —   | **無 P0 功能阻斷** | SW activated 後全路由可用 | steady-state 使用者不受阻 |

> **降級說明**：`registerSW.js` 404 為 `injectRegister: 'inline'` 設計，SW 透過 index.html 內嵌註冊正常運作 → 改列 P2-004。

### P1 — 高優先

| ID     | 發現                                                 | 證據                                                 | 影響                           |
| ------ | ---------------------------------------------------- | ---------------------------------------------------- | ------------------------------ |
| P1-001 | **全站 React Hydration #418**                        | 首頁、Settings、Multi、Favorites、幣別頁、多數資訊頁 | console≠0；可能首屏閃爍        |
| P1-002 | **`static-loader-data-manifest-undefined.json` 404** | 首頁、Privacy、長 session                            | vite-react-ssg loader 路徑異常 |
| P1-003 | **首次離線冷啟動失敗窗口**                           | SW installing 60–80s 內斷網 → chrome-error           | 新使用者 PWA 離線體驗差        |
| P1-004 | **`favorites.baseCurrency` i18n 漏譯**               | UI 顯示字面 key                                      | Favorites 頁使用者可見 bug     |

### P2 — 中優先

| ID     | 發現                                    | 證據                                                                | 影響                |
| ------ | --------------------------------------- | ------------------------------------------------------------------- | ------------------- |
| P2-001 | 2026 UX Spec 文件缺失                   | repo 無 `2026-06-12-ratewise-2026-product-ux-spec.md`               | 差距分析無正式 SSOT |
| P2-002 | GA4 `www.google.com/g/collect` CSP 阻擋 | 多頁 console                                                        | analytics 漏送      |
| P2-003 | 正式站 v2.24.1 落後 repo 2.25.0         | cache-bust probe                                                    | 部署未追平          |
| P2-004 | `registerSW.js` 404 + 測試 SSOT 漂移    | inline 註冊屬預期；`ratewise-production-release.test.ts` 仍預期 200 | QA 假陽性           |
| P2-005 | 快速金額 chip 觸控 32px                 | 首頁實測 h=32                                                       | 低於 WCAG 44px      |
| P2-006 | `/seo-tech/` 行動版無可見回首頁連結     | footer `hidden md:block`                                            | 行動導覽缺口        |
| P2-007 | Privacy 頁無 JSON-LD                    | curl 驗證                                                           | 結構化資料缺口      |

### P3 — 低優先 / 追蹤

| ID     | 發現                                  | 證據             | 影響               |
| ------ | ------------------------------------- | ---------------- | ------------------ |
| P3-001 | 全站缺 skip-to-main 連結              | FAQ/About/Guide  | 鍵盤導覽           |
| P3-002 | 首頁 LCP ~2.08s                       | Playwright       | 距 native 級 <1.8s |
| P3-003 | 首頁無「複製連結」按鈕                | 僅 deep link URL | 分享 UX            |
| P3-004 | Settings 僅「重置主題」無完整清除資料 | 產品預期落差     | 需 PM 決策         |
| P3-005 | 404 頁為 Nginx 預設樣式               | `/not-exist/`    | 品牌化機會         |

---

## 分頁詳細發現

> 每頁含：**Lead Smoke**（已執行）+ **代理回填區**（待合併）

---

### `/` — 首頁（單幣別換算器）

**URL：** `https://app.haotool.org/ratewise/`  
**索引：** index, follow  
**負責區塊：** A B C D E F G  
**Lighthouse smoke：** ✅ SSOT 收錄

#### Lead Smoke（2026-06-26）

| 項目          | 結果                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- |
| HTTP          | 200                                                                                         |
| Title         | HaoRate 匯率好工具 — 台灣最精準匯率換算器…                                                  |
| H1            | HaoRate 匯率好工具 即時匯率換算                                                             |
| robots        | `index, follow, max-image-preview:large…`                                                   |
| canonical     | `https://app.haotool.org/ratewise/`                                                         |
| manifest link | `/ratewise/manifest.webmanifest`                                                            |
| Bottom nav    | 8 個 nav links（AppLayout）                                                                 |
| Console       | ⚠️ resource 404；React #418 hydration                                                       |
| 互動          | Playwright 1.2s 後 `inputCount: 0` — converter 可能 ClientOnly 延遲 mount，需延長 wait 重測 |

#### 代理回填區

```
代理 ID：
測試日期：
深度結果：
- A Bottom Nav：
- B 換算互動：
- C 趨勢圖：
- D PWA：
- E SEO/Head：
- F A11y：
- G 效能：
缺陷 ID：
截圖：screenshots/<name>.png
```

---

### `/multi/` — 多幣別換算

**URL：** `https://app.haotool.org/ratewise/multi/`  
**索引：** noindex, follow  
**負責區塊：** A B F G

#### Lead Smoke（2026-06-26）

| 項目       | 結果                                     |
| ---------- | ---------------------------------------- |
| HTTP       | 200                                      |
| Title      | 多幣別同時換算 - 一次比較 18 種即時匯率… |
| H1         | 多幣別同時換算 - 一次比較 18 種即時匯率  |
| robots     | noindex, follow（HTML 含 noindex）       |
| Bottom nav | 8 links                                  |
| Console    | 0 errors（本頁單獨 smoke）               |
| body 長度  | ~902 chars                               |

#### 代理回填區

```
代理 ID：
測試日期：
深度結果：
- 18 幣別列表載入：
- 捲動效能：
- 現金/即期切換：
缺陷 ID：
```

---

### `/favorites/` — 收藏與歷史

**URL：** `https://app.haotool.org/ratewise/favorites/`  
**索引：** noindex  
**負責區塊：** A B F

#### Lead Smoke（2026-06-26）

| 項目       | 結果             |
| ---------- | ---------------- |
| HTTP       | 200（curl）      |
| Playwright | 批次中斷，待深測 |

#### 代理回填區

```
代理 ID：
測試日期：
深度結果：
- 收藏拖曳排序：
- 歷史紀錄：
- 空狀態：
缺陷 ID：
```

---

### `/settings/` — 應用程式設定

**URL：** `https://app.haotool.org/ratewise/settings/`  
**索引：** noindex  
**負責區塊：** A D F

#### Lead Smoke（2026-06-26）

| 項目          | 結果                                       |
| ------------- | ------------------------------------------ |
| HTTP          | 200（curl）                                |
| Title（曾測） | 應用程式設定 - 介面風格切換與語言偏好管理… |

#### 代理回填區

```
代理 ID：
測試日期：
深度結果：
- 主題切換：
- PWA 安裝指引：
- 語言偏好：
缺陷 ID：
```

---

### `/faq/` — 常見問題

**URL：** `https://app.haotool.org/ratewise/faq/`  
**索引：** index  
**負責區塊：** E F H  
**Lighthouse smoke：** ✅

#### Lead Smoke（2026-06-26）

| 項目         | 結果                                                |
| ------------ | --------------------------------------------------- |
| HTTP         | 200                                                 |
| 結構         | H1、快速答案 3 則、accordion 20 組、麵包屑          |
| MailtoLink   | `button "haotool.org@gmail.com"` — 非 raw mailto ✅ |
| 返回         | 「返回」+ 麵包屑「首頁」                            |
| lastmod 顯示 | 2026年6月25日                                       |

#### 代理回填區

```
代理 ID：
測試日期：
深度結果：
- FAQPage JSON-LD（僅此頁）：
- accordion 鍵盤操作：
- 內部連結 /guide/ /about/：
缺陷 ID：
```

---

### `/about/` — 關於

**URL：** `https://app.haotool.org/ratewise/about/`  
**索引：** index  
**負責區塊：** E F H  
**Lighthouse smoke：** ✅

#### Lead Smoke（2026-06-26）

| 項目 | 結果                            |
| ---- | ------------------------------- |
| HTTP | 200（curl + 並行 tab 載入成功） |

#### 代理回填區

```
代理 ID：
測試日期：
深度結果：
- E-E-A-T schema：
- Organization / author：
缺陷 ID：
```

---

### `/guide/` — 使用指南

**URL：** `https://app.haotool.org/ratewise/guide/`  
**索引：** index  
**負責區塊：** E F H I

#### Lead Smoke（2026-06-26）

| 項目 | 結果        |
| ---- | ----------- |
| HTTP | 200（curl） |

#### 代理回填區

```
代理 ID：
測試日期：
深度結果：
- HowTo JSON-LD：
- 步驟可讀性：
缺陷 ID：
```

---

### `/privacy/` — 隱私政策

**URL：** `https://app.haotool.org/ratewise/privacy/`  
**索引：** noindex（不在 sitemap）  
**負責區塊：** E F

#### Lead Smoke（2026-06-26）

| 項目 | 結果        |
| ---- | ----------- |
| HTTP | 200（curl） |

#### 代理回填區

```
代理 ID：
測試日期：
深度結果：
- noindex meta：
- Footer 連結可達：
缺陷 ID：
```

---

### 內容長尾頁（`/sell-rate-vs-mid-rate/`、`/cash-vs-spot-rate/`、`/card-rate-guide/`、`/open-data/`、`/seo-tech/`）

#### Lead Smoke（2026-06-26）

| 路徑                      | HTTP |
| ------------------------- | ---- |
| `/sell-rate-vs-mid-rate/` | 200  |
| `/open-data/`             | 200  |
| `/seo-tech/`              | 200  |
| `/cash-vs-spot-rate/`     | ⏳   |
| `/card-rate-guide/`       | ⏳   |

#### 代理回填區（每頁複製）

```
路徑：
代理 ID：
測試日期：
- 內容 template-bleed：
- Article JSON-LD：
- 行動版閱讀體驗：
缺陷 ID：
```

---

### 幣別落地頁 — 代表頁 `/usd-twd/`

**URL：** `https://app.haotool.org/ratewise/usd-twd/`  
**索引：** index  
**負責區塊：** B E H I

#### Lead Smoke（2026-06-26）

| 項目 | 結果 |
| ---- | ---- |
| HTTP | 200  |

#### 代理回填區

```
代理 ID：
測試日期：
- 匯率數值與 API 一致：
- ExchangeRateSpecification JSON-LD：
- 無其他幣別 template-bleed：
- 金額快捷連結：
缺陷 ID：
```

---

### 金額落地頁 — 代表頁 `/usd-twd/500/`

**URL：** `https://app.haotool.org/ratewise/usd-twd/500/`  
**索引：** index  
**負責區塊：** B E H

#### Lead Smoke（2026-06-26）

| 項目 | 結果 |
| ---- | ---- |
| HTTP | 200  |

#### 代理回填區

```
代理 ID：
測試日期：
- 500 USD → TWD 計算正確：
- canonical 自指：
- 麵包屑：
缺陷 ID：
```

---

### 幣別 / 金額頁 — 批量代理模板（剩餘 240+ URL）

```
代理 ID：
測試日期：
覆蓋清單：（貼上負責的 path 列表）
抽樣策略：每幣別 1 base + 2 amount（min/max canonical）
共同檢查項：
- [ ] HTTP 200
- [ ] 幣別專有名詞無 bleed
- [ ] JSON-LD 無重複 FAQPage
- [ ] 行動版 LCP < 2.5s
- [ ] 分享 OG 圖 200
匯總缺陷 ID：
```

---

## 改善建議 Roadmap

### Quick wins（1–3 天）

| 項目                           | 對應發現 | 行動                                                                                        |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------- |
| 修復 `registerSW.js` 404       | P0-001   | 確認 Vite PWA plugin 產出路径；Zeabur 部署含 `registerSW.js`；release 後 live precache 驗證 |
| 調查 hydration #418            | P1-001   | 定位 SSR/Client 文字 diff（匯率數值、日期、locale）；移除全域 error suppression             |
| 修復 loader manifest undefined | P1-002   | 查 vite-react-ssg static loader manifest 建置配置                                           |
| 建立 2026 UX Spec 文件         | P2-001   | 補齊 `2026-06-12-ratewise-2026-product-ux-spec.md`                                          |

### Medium（1–2 週）

| 項目            | 行動                                                                           |
| --------------- | ------------------------------------------------------------------------------ |
| 行動 E2E 套件   | 新增 `e2e/mobile-pwa-smoke.spec.ts`：390×844、bottom nav 四頁、console 0 error |
| Lighthouse 擴充 | 評估是否將 `/guide/` 或 `/usd-twd/` 納入 smoke（仍從 SSOT 讀取）               |
| 並行 QA 編排    | 每代理獨立 Playwright context；結果 PR 合併回本文「待合併」章                  |

### Strategic（對標 Toss / Wowpass native 級）

| 項目           | 行動                                                                    |
| -------------- | ----------------------------------------------------------------------- |
| 首屏 native 感 | 依 first-screen performance plan：LCP 預算、idle gate、route transition |
| 離線體驗       | precache ≥50、offline 換算 fallback、更新 prompt 不撕裂 chunk           |
| 無障礙         | VoiceOver 完整走查 bottom nav + 計算機鍵盤                              |
| 治理           | 對齊 production governance design：internal routes 不進 production      |

---

## 對照 2026 UX Spec 差距分析

> **阻塞：** `docs/superpowers/specs/2026-06-12-ratewise-2026-product-ux-spec.md` 尚未入 repo。以下暫以 `AGENTS.md` 與既有 plan 推導。

| UX 維度（預期）            | 當前生產觀察                               | 差距                          | 優先級 |
| -------------------------- | ------------------------------------------ | ----------------------------- | ------ |
| Native 級首屏（Toss 對標） | 首頁 hydration error；converter 延遲 mount | SSR/Client 不一致影響首屏信任 | P1     |
| 底部導覽四頁流暢切換       | multi 頁正常；全路徑深測未完成             | 需 E2E 覆蓋 transition        | P1     |
| PWA 可安裝 / 可更新        | registerSW 404；manifest/sw 200            | 安裝/更新路徑斷裂             | P0     |
| 離線可用                   | offline.html 200；precache 未實測          | 需 DevTools 計數驗證          | P1     |
| 韓系 fintech 視覺密度      | 待 UX spec                                 | 無 SSOT 可對照                | P2     |
| 計算機鍵盤 UX              | 待代理                                     | —                             | ⏳     |
| 趨勢圖觸控                 | 待代理                                     | —                             | ⏳     |
| 下拉更新                   | FAQ 有說明；實機待測                       | —                             | ⏳     |

**待 UX Spec 入 repo 後：** 逐條映射 spec 章節 ID → 本 SPEC 缺陷 ID → 驗收標準。

---

## 驗收標準與回歸清單

### 發版前必過（Mobile PWA）

- [ ] 全部 `APP_ONLY_NOINDEX_PATHS` + `CONTENT_SEO_PATHS` + 代表幣別頁 HTTP 200
- [ ] `/registerSW.js`、`/sw.js`、`/manifest.webmanifest`、`/offline.html` 全部 200
- [ ] 首頁 + FAQ + About console **0 error**（390×844）
- [ ] 首頁無 React hydration mismatch
- [ ] Bottom nav 四頁切換無白屏 / chunk Load failed
- [ ] `VERIFY_PRECACHE_SOURCE=live` precache 驗證通過
- [ ] sitemap URL 數 = `SEO_PATHS.length`（目前 249）

### 回歸清單（每次 mobile QA）

```bash
# HTTP smoke
BASE=https://app.haotool.org/ratewise
for p in / /multi/ /favorites/ /settings/ /faq/ /about/ /usd-twd/; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "${BASE}${p}"
done

# PWA assets
for a in manifest.webmanifest sw.js registerSW.js offline.html; do
  curl -s -o /dev/null -w "%{http_code} $a\n" "${BASE}/${a}"
done

# Sitemap count
curl -s "${BASE}/sitemap.xml" | rg -c "<loc>"

# Playwright mobile（待 e2e 腳本）
pnpm --filter @app/ratewise test:e2e --grep mobile-pwa
```

### 缺陷關閉準則

| 嚴重度 | 關閉條件                              |
| ------ | ------------------------------------- |
| P0     | 生產重測 Pass + release 流程驗證      |
| P1     | 生產重測 Pass + 自動化測試覆蓋        |
| P2     | 排程 sprint 修復或 accepted risk 記錄 |
| P3     | backlog 或 wontfix 註記               |

---

## 待其他代理合併

### 合併程序

1. 各代理在對應「代理回填區」填入結果（含代理 ID、日期、缺陷 ID、截圖路徑）。
2. 新增缺陷統一登錄至「發現摘要」P0–P3 表（避免重複 ID）。
3. 更新「頁面覆蓋矩陣」Smoke 摘要欄與狀態 emoji。
4. Lead 審核後將文件版本升至 `v1.0.0` 並標記 Status: Active。

### 合併欄位模板

```markdown
### 代理合併紀錄 — <代理 ID>

- 日期：YYYY-MM-DD
- 覆蓋頁面：（列表）
- 新增缺陷：（P?-???）
- 已關閉缺陷：
- 截圖：screenshots/
- 備註：
```

### 當前合併狀態

| 代理                                                   | 狀態 | 覆蓋範圍                     |
| ------------------------------------------------------ | ---- | ---------------------------- |
| [QA SPEC 統整](a39dad4f-8c42-4e18-ad5c-2d1a176e6ceb)   | ✅   | 框架、路由 SSOT、HTTP smoke  |
| [首頁 PWA 測試](cd42c01e-809a-44ee-b633-466c77fb4706)  | ✅   | `/` 換算、Tab、離線首頁、LCP |
| [幣別頁測試](0fe65a65-dfb2-4054-88af-284a4242c3e7)     | ✅   | 17 幣別頁 + template-bleed   |
| [FAQ/About 測試](f7b5879a-9965-41c5-941f-9a9c55c8ccc5) | ✅   | 9 資訊頁、MailtoLink、schema |
| [功能頁測試](b941ab5e-8de5-49d8-a136-541aebd55a6f)     | ✅   | Settings / Favorites / Multi |
| [PWA 離線測試](b2caa484-fc0c-4e69-b400-43e6d4efe953)   | ✅   | SW、precache、離線、版本     |
| [全站導航](e9503923-d42c-442f-9640-dc610857b8e7)       | ✅   | 28 步 journey、head、404     |
| [首頁換算器重測](67707610-c28d-4296-9079-8c355d6240a0) | ✅   | iPhone 14 Pro 深度           |
| [Multi 重測](f7c62b9b-d066-4e30-ac36-3fb0d134acb8)     | ✅   | 多幣別、輸入驗證             |
| [Settings 重測](35fb7749-ffa3-47a7-8863-8545eb753ba0)  | ✅   | 主題、語言、PWA              |
| [FAQ About 重測](8b55ee44-12a7-46df-b3ae-a17bd24b1eed) | ✅   | FAQ/About/Guide PASS         |
| [Favorites 重測](435f5817-8041-496c-8976-d0332cb8379d) | ✅   | 收藏持久化、noindex          |

### 已知合併風險

- 多代理共用 Playwright MCP session 造成間歇性 console 假陽性 — CI 應每頁獨立 context。
- UX Spec 缺失 — 差距分析需在 spec 入 repo 後第二次修訂。

---

**最後更新：** 2026-06-26（12 代理合併完成）  
**下次審查：** P1-001 修復後升 v1.0.0
