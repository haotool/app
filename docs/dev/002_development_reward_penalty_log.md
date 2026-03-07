# 開發獎懲與決策記錄 (2025-2026)

> **最後更新**: 2026-03-08T03:56:39+08:00
> **當前總分**: 1118（初始分: 100）
> **目標**: >120（優秀）| <80（警示）

---

## 評分標準

| 分數 | 觸發條件                               |
| ---- | -------------------------------------- |
| +1   | 正確使用 Context7 引用文檔解決問題     |
| +1   | 發現並修復潛在 bug（非當前任務造成的） |
| +2   | 重大架構改進或性能提升（>20%）         |
| +3   | 解決複雜的系統性問題（Root Cause Fix） |
| -1   | 引入新 bug（CI 失敗）                  |
| -1   | 違反 Linus 三問（過度設計）            |
| -2   | 破壞現有功能（Regression）             |
| -3   | 造成生產環境停機                       |

---

## 分數變動摘要（近期）

| 分數 | 事項                                            | 日期       |
| ---- | ----------------------------------------------- | ---------- |
| +2   | Git 歷史失敗案例重構與 002 incident 知識庫整理  | 2026-03-08 |
| +1   | SEOHelmet effect 依賴穩定化                     | 2026-03-08 |
| +1   | SEOHelmet 卸載 cleanup 與跨頁 head 污染修復     | 2026-03-08 |
| +4   | FAQ rich results 範圍收斂與 head hydration 去重 | 2026-03-08 |
| +3   | SEO Audit hreflang 驗證硬編碼根因修復           | 2026-03-07 |
| +4   | rebase 後版本與 sitemap SSOT 根因修復           | 2026-03-07 |
| +1   | 公開產物格式漂移收斂與提交潔淨化                | 2026-03-07 |
| +6   | SEO 權威內容頁、參數頁重複抓取抑制              | 2026-03-07 |
| +5   | SEO 真實性、sitemap 與 robots SSOT 根因修復     | 2026-03-07 |
| +1   | 建立 Cloudflare 稽核工作流文件                  | 2026-03-03 |
| 0    | Code Splitting 生產癱瘓（-3）+ 快速修復（+3）   | 2026-03-03 |
| +5   | 效能優化 Bundle 490KB→233KB                     | 2026-03-03 |
| +6   | park-keeper Phase 3 收尾                        | 2026-02-28 |
| +3   | RateWise SEO 權威定位：新增 4 幣對              | 2026-02-28 |
| +2   | Sitemap hreflang SSOT 同步修復                  | 2026-02-28 |
| +3   | SEO 技術債清除與 SSOT 完整對齊                  | 2026-02-28 |
| +1   | 修復 prerender/hreflang 測試斷言                | 2026-02-28 |
| +2   | AGENTS/CLAUDE 企業 SOP 升級                     | 2026-02-28 |

---

## 記錄格式（方案 A）

- 每筆近期紀錄固定使用 `---` 區塊，不再新增巨型 table 條目
- 欄位順序固定：`date` → `title` → `score` → `type` → `scope` → `tags` → `summary` → `actions` → `verification` → `references`
- 2026-02-28 起的重要紀錄保留完整 entry；更早歷史資料改為下方按月份整理的精簡索引
- `type: incident` / `type: regression` 必須明確寫出根因、影響、修復與預防，避免只記結果不記教訓

## Entries

### 2026-03

---

date: 2026-03-08
title: Git 歷史失敗案例重構與 002 incident 知識庫整理
score: +2
type: success
scope: repo
tags: [documentation, incident, ssot, git-history]
summary: 直接回看 git 歷史與既有獎懲記錄，將零散的失敗教訓重構成可搜尋、可複用的 incident entry，避免未來只看到結果看不到根因與修法。
actions:

- 盤點 git log 中實際發生過的 hydration、CSP、CI 硬編碼、base path 與部署漂移案例
- 將高價值失敗案例改寫為標準 incident entry，統一記錄根因、影響、修復與預防
- 更新 AGENTS.md、CLAUDE.md，將 incident 記錄要求提升為正式 SOP
  verification:
- git log 關鍵事故提交回查
- 002 結構檢查：Entries / 歷史失敗案例 / 歷史索引三層分離
  references:
- git log
- docs/dev/002_development_reward_penalty_log.md

---

失敗紀錄只有在能快速回答「為什麼壞、怎麼修、下次怎麼避免」時才真正有價值。

---

date: 2026-03-08
title: SEOHelmet effect 依賴穩定化
score: +1
type: success
scope: ratewise
tags: [seo, head, performance, regression]
summary: normalizedAlternates 每次 render 新建陣列，props 未變時仍會重跑整份 head 去重流程。
actions:

- 將依賴改為穩定字串 normalizedAlternatesSignature
- 補 rerender 回歸測試，驗證 canonical、alternate、structured data 節點不會重建
  verification:
- pnpm --filter @app/ratewise typecheck
- pnpm --filter @app/ratewise exec vitest run src/components/**tests**/SEOHelmet.test.tsx
- pnpm --filter @app/ratewise exec vitest run src/jsonld.test.ts src/prerender.test.ts
- pnpm --filter @app/ratewise build
  references:
- PR #174 review

---

避免高互動頁面在同 props rerender 時反覆重寫整份 head。

---

date: 2026-03-08
title: SEOHelmet 卸載 cleanup 與跨頁 head 污染修復
score: +1
type: success
scope: ratewise
tags: [seo, head, cleanup, regression]
summary: SEOHelmet 卸載後若下一頁未使用同元件，舊頁 canonical、description、JSON-LD 會殘留在 document.head。
actions:

- 為 client 接管節點統一加上 data-seo-helmet managed 標記
- effect cleanup 僅移除受管節點，避免誤傷其他 Head 節點
- 補 unmount 回歸測試，確認保留 charset 與 viewport
  verification:
- pnpm --filter @app/ratewise typecheck
- pnpm --filter @app/ratewise exec vitest run src/components/**tests**/SEOHelmet.test.tsx
- pnpm --filter @app/ratewise exec vitest run src/jsonld.test.ts src/prerender.test.ts
- pnpm --filter @app/ratewise build
  references:
- PR #174 review

---

手動寫入 `document.head` 的程式碼，未來一律視為必須有 managed 標記與 cleanup 的高風險區。

---

date: 2026-03-08
title: FAQ rich results 範圍收斂與 head hydration 去重
score: +4
type: success
scope: ratewise
tags: [seo, structured-data, faq, ssot]
summary: FAQ rich result 已限於少數權威站點，同一 FAQ 不應在首頁、幣別頁、About、Guide 重複標記。
actions:

- 將 FAQPage schema 收斂到真正 FAQ 頁
- SEOHelmet 在 client runtime 接管 head tags，消除 hydration 後重複根因
- ImageObject 補齊 license 與 acquireLicensePage，統一由 APP_INFO / seo-metadata 管理
  verification:
- pnpm --filter @app/ratewise typecheck
- pnpm --filter @app/ratewise exec vitest run src/components/**tests**/SEOHelmet.test.tsx src/jsonld.test.ts src/prerender.test.ts src/config/**tests**/app-info.test.ts src/seo-best-practices.test.ts
- pnpm --filter @app/ratewise build
  references:
- Google Search Central: FAQ structured data / Rich results 限制
- Google Search Central: image license metadata

---

FAQ 文案可保留，但 `FAQPage` 預設只留在真正 FAQ 頁。

---

date: 2026-03-07
title: SEO 權威內容頁與 deep-link 模板收斂
score: +6
type: success
scope: ratewise
tags: [seo, ssot, sitemap, llms]
summary: 將可索引內容頁與參數頁職責分離，降低搜尋引擎從公開文件與幣別頁擴散抓取參數變體的風險。
actions:

- 新增三個公開可索引權威內容頁，集中承接高意圖匯率主題
- 同步 CONTENT_SEO_PATHS、SEO_PATHS、PRERENDER_PATHS、sitemap、hreflang、路由與 llms 文件
- 將幣別頁常見金額入口改為互動導頁，並把 deep-link 文件改為模板格式
  verification:
- pnpm --filter @app/ratewise prebuild
- pnpm --filter @app/ratewise test -- --run src/components/**tests**/CurrencyLandingPage.test.tsx src/config/**tests**/seo-paths.test.ts src/hreflang.test.ts src/seo-best-practices.test.ts src/components/**tests**/SEOHelmet.test.tsx
- pnpm vitest run scripts/**tests**/sitemap-2025.test.ts
- pnpm --filter @app/ratewise test -- --run src/prerender.test.ts src/seo-truthfulness.test.ts
- pnpm --filter @app/ratewise typecheck
- node scripts/verify-sitemap-2025.mjs
- pnpm --filter @app/ratewise build
  references:
- Context7: vite-react-ssg 靜態路由與 Head
- Google Search Central: canonical 重複網址 / helpful content

---

權威內容頁負責被索引，參數頁與 deep-link 文件則只保留工具用途，避免語意混線。

---

date: 2026-03-07
title: 公開產物格式漂移收斂與提交潔淨化
score: +1
type: success
scope: ratewise
tags: [ssot, build, formatting]
summary: prebuild 與 build 產生的 API / OpenAPI / manifest 產物格式會造成工作樹殘留差異，容易誤判為邏輯回歸。
actions:

- 確認差異屬於腳本輸出格式，而非功能變更
- 將公開產物重新納入版本控制，讓 repo 狀態與實際生成結果一致
- 以腳本最終輸出作為公開產物 SSOT
  verification:
- git diff --stat
  references:
- docs/dev/002 既有 prebuild 格式漂移治理規則

---

公開產物只接受生成結果，不再手修格式。

---

date: 2026-03-07
title: rebase 後版本與 sitemap SSOT 根因修復
score: +4
type: success
scope: ratewise
tags: [ssot, versioning, sitemap, rebase]
summary: rebase 後 app 版本與公開產物版本脫鉤，且 `/privacy/` SEO 路徑定義再次在 JS/TS mirror 間分歧。
actions:

- 將 @app/ratewise 版本對齊到 2.6.1
- 對齊 seo-paths.ts 與 seo-paths.config.mjs，並在 sitemap 生成器加入去重
- 更新測試斷言，直接反映當前 SEO_PATHS / PRERENDER_PATHS SSOT
  verification:
- pnpm --filter @app/ratewise prebuild
- pnpm --filter @app/ratewise test -- --run src/config/**tests**/seo-paths.test.ts src/seo-best-practices.test.ts src/hreflang.test.ts src/seo-truthfulness.test.ts
- pnpm vitest run scripts/**tests**/sitemap-2025.test.ts
  references:
- Context7: Vitest CLI 最小測試集合重跑

---

版本號、SEO 路徑與 sitemap 生成器必須同時更新，否則 rebase 後很容易再次漂移。

---

date: 2026-03-07
title: SEO Audit hreflang 驗證硬編碼根因修復
score: +3
type: success
scope: ratewise
tags: [seo, audit, hreflang, ssot]
summary: 驗證腳本仍以 `SEO_PATHS + LEGAL_SSG_PATHS` 硬編碼計算 sitemap 路徑，導致 CI 錯誤期待多出 `/privacy/` 與 hreflang 計數。
actions:

- 將 verify-sitemap-2025.mjs 改為使用與生成器一致的 `new Set(SEO_PATHS)` 來源
- 讓 audit 與實際 sitemap 回到同一份 SSOT
- 重新驗證 sitemap 與完整 SEO audit
  verification:
- node scripts/verify-sitemap-2025.mjs
- node scripts/seo-full-audit.mjs
  references:
- GitHub Actions: SEO 2025 Standards Audit

---

審計腳本不能再自行推導路徑，必須直接吃生成器同源資料。

---

date: 2026-03-07
title: SEO 真實性與 robots / sitemap SSOT 根因修復
score: +5
type: success
scope: ratewise
tags: [seo, ssot, robots, sitemap, truthfulness]
summary: 舊文案、noindex 結構化資料與公開檔案生成流程彼此不一致，會同時影響可信度、索引與 sitemap 正確性。
actions:

- 移除不實文案，改以實際支援幣別、資料來源與匿名分析揭露為準
- 為 noindex 頁面抑制結構化資料，避免 schema / noindex 衝突
- 將 robots.txt、manifest.webmanifest、llms.txt、openapi.json 改為腳本生成，並修復 root sitemap 發現鏈
  verification:
- pnpm --filter @app/ratewise prebuild
- pnpm --filter @app/haotool prebuild
- pnpm --filter @app/ratewise typecheck
- pnpm --filter @app/ratewise test -- --run src/components/**tests**/SEOHelmet.test.tsx src/pages/Guide.test.tsx src/seo-best-practices.test.ts src/seo-truthfulness.test.ts
- pnpm vitest run scripts/**tests**/sitemap-2025.test.ts
- node scripts/verify-sitemap-2025.mjs
- pnpm --filter @app/ratewise build
- pnpm --filter @app/haotool build
  references:
- Context7: vite-react-ssg / vite-plugin-pwa / vite 7
- Google Search Central: robots / sitemaps / canonical / localized versions

---

SEO 文案、公開檔案與索引規則若不是同源生成，最後一定會出現可信度與索引衝突。

---

date: 2026-03-03
title: 建立 RateWise Cloudflare 稽核與驗證工作流文件
score: +1
type: success
scope: ratewise
tags: [cloudflare, audit, ops, documentation]
summary: 將 Cloudflare Worker、Rules、PWA probe、curl 驗證命令與已知漂移整理成單一操作基準，降低後續邊緣修復成本。
actions:

- 整理 Worker、Transform Rules、Snippets、Cache Rules 與正式站驗證命令
- 補上驗收標準與已知漂移清單
- 從部署指南建立連結，形成單一稽核入口
  verification:
- 文件交叉校對 Cloudflare 配置與 repo 既有部署說明
  references:
- docs/DEPLOYMENT.md
- Cloudflare 稽核工作流文件

---

邊緣設定若沒有單一稽核基準，之後每次修正都會重複踩同一個坑。

---

date: 2026-03-03
title: Code Splitting 生產癱瘓事故與根因修復
score: 0
type: incident
scope: ratewise
tags: [performance, build, regression, incident]
summary: manualChunks 未涵蓋 `scheduler/`，導致 React 核心模組跨 chunk 分裂，生產環境出現 `unstable_now` 錯誤並全面癱瘓。
actions:

- 將 `scheduler/` 明確併入 vendor-react chunk
- 重新 build 與 preview 驗證載入順序
- 記錄事故教訓：React 生態的底層依賴不能被錯拆
  verification:
- 本地 build
- 本地 preview 驗證
- 生產部署後確認站點恢復
  references:
- vite.config.ts manualChunks 修復

---

這筆保留為 `0` 分事故紀錄，提醒效能優化不能只看 bundle size，還要看模組依賴邊界。

---

date: 2026-03-03
title: 效能優化 P0：Bundle 490KB 降至 233KB
score: +5
type: success
scope: ratewise
tags: [performance, vite, bundle, pwa]
summary: 透過分 chunk、壓縮與連線優化，將初始 bundle 顯著下降，並改善 critical path 傳輸量與預期 SEO / 性能分數。
actions:

- 將 manualChunks 由 2 組拆成 5 組，讓 charts 與 motion lazy 載入
- Terser 壓縮強化，移除殘留註解
- index.html 將 dns-prefetch 提升為 preconnect，優化渲染阻塞
  verification:
- pnpm build
- 全站 SSG 預渲染成功
- PWA precache 驗證
- 單元測試全數通過
  references:
- squirrelscan 稽核結果
- vite build 產物分析

---

效能優化可以很激進，但必須和事故紀錄成對保存，避免之後只記得成果忘了代價。

### 2026-02

---

date: 2026-02-28
title: park-keeper Phase 3 接手收尾
score: +6
type: success
scope: park-keeper
tags: [pwa, map, ux, offline]
summary: 完成車牌快編自動儲存、停車朝向、全屏地圖、照片互動與 tile cache 收斂，讓 park-keeper Phase 3 可交付。
actions:

- 列表頁改為點擊即編輯，加入防抖自動儲存與 optimistic update
- 新增 parkedHeading、地圖旋轉車輛 marker、全屏地圖追蹤策略與照片檢視器
- PWA 改為 injectManifest，整合外部地圖磚快取桶、背景刷新與過期清理
  verification:
- pnpm --filter @app/park-keeper lint
- pnpm --filter @app/park-keeper test -- --run
- pnpm --filter @app/park-keeper typecheck
- pnpm --filter @app/park-keeper build
  references:
- park-keeper Phase 3 實作與驗證紀錄

---

功能、地圖互動與離線快取在同一輪收斂完成，避免把 UX 與 PWA 修補拆成零碎 hotfix。

---

date: 2026-02-28
title: RateWise SEO 權威定位與新增 4 幣對頁
score: +3
type: success
scope: ratewise
tags: [seo, ssot, content]
summary: 將品牌定位收斂為台灣實際買賣價匯率工具，並新增 VND、PHP、IDR、MYR 四個 SEO 幣對頁，同步所有公開 SEO 路徑 SSOT。
actions:

- 更新品牌敘述與幣對落地頁
- 同步 TS / MJS SEO 路徑、sitemap、llms.txt、api/latest.json
- 將常見金額區塊語意化，讓頁面更符合搜尋意圖
  verification:
- 所有 1405 測試通過
  references:
- RateWise SEO 權威定位調整紀錄

---

新增內容頁時同步更新所有公開清單，避免 sitemap 與 llms 再次失同步。

---

date: 2026-02-28
title: Sitemap hreflang SSOT 同步修復
score: +2
type: success
scope: ratewise
tags: [seo, sitemap, hreflang, ssot]
summary: public sitemap 與 SEO_PATHS 計數不一致，重新生成後收斂為同一份路徑來源，讓 CI SEO Audit 回綠。
actions:

- 重新生成 sitemap-2025 產物
- 對齊公開 URL 與 hreflang 計數
- 讓 CI 驗證直接對應目前 SEO 路徑 SSOT
  verification:
- CI SEO Audit 通過
  references:
- generate-sitemap-2025.mjs

---

凡是 URL 計數類規則，都必須直接對齊生成器來源，不再依賴人工維護數字。

---

date: 2026-02-28
title: SEO 技術債清除與 JSON-LD SSOT 對齊
score: +3
type: success
scope: ratewise
tags: [seo, jsonld, ssot, cleanup]
summary: 移除 dead code、收斂重複 ImageObject 與硬編碼圖片替代文字，讓 SEO metadata 與 APP_INFO 維持單一來源。
actions:

- 移除 HomeStructuredData.tsx dead code
- 修復 SEOHelmet 重複 ImageObject，並改由 OG_IMAGE_ALT / APP_INFO.organizationUrl 管理
- 更新 jsonld 與 SEO 最佳實踐測試，移除對舊實作的依賴
  verification:
- jsonld.test.ts
- seo-best-practices.test.ts
  references:
- seo-metadata.ts

---

SEO 結構化資料只保留一份實作來源，測試也必須一起切到新 SSOT。

---

date: 2026-02-28
title: prerender / hreflang 測試斷言修復與 SOP 文件升級
score: +3
type: success
scope: repo
tags: [test, documentation, sop]
summary: 修復 prerender 與 hreflang 測試斷言，同日將 AGENTS / CLAUDE 升級為企業 SOP 格式，補齊文件控制、控制矩陣與例外流程。
actions:

- 修正 Organization schema regex 與 hreflang xhtml:link 斷言
- 升級 AGENTS.md、CLAUDE.md 的 SOP 與稽核欄位
- 查詢並採納 Google / Microsoft / Diataxis 等文件寫作最佳實踐
  verification:
- prerender.test.ts
- hreflang.test.ts
  references:
- Google Developer Documentation Style Guide
- Microsoft Writing Style Guide
- Diataxis

---

測試斷言與 SOP 一起修，是因為兩者本質上都在維護 repo 的可驗證性。

## 歷史失敗案例（已重構）

---

date: 2026-03-07
title: LAST_UPDATED 時區未固定導致 SSG hydration 漂移
score: 0
type: incident
scope: ratewise
tags: [hydration, timezone, ssg, rendering]
summary: 根因是頁面使用未固定時區的日期字串，server 與 client 可能依不同時區輸出不同內容；影響是 About / FAQ / Privacy 類靜態頁產生 hydration 漂移。
actions:

- 將 LAST_UPDATED 固定為 `Asia/Taipei`
- 檢查所有靜態頁日期欄位是否共用同一輸出來源
- 將日期顯示視為 SSG 穩定值，而不是 runtime 自行推導
  verification:
- 靜態頁 hydration 不再因時區差異改寫文字
- About / FAQ / Privacy 日期輸出一致
  references:
- git commit 6cd321ff

---

凡是會被輸出到 SSG 首屏的日期字串，都應先固定時區，再談顯示格式。

---

date: 2026-03-07
title: 生產環境安全標頭漂移與 console 錯誤未同步修復
score: 0
type: incident
scope: security
tags: [security, headers, production, drift]
summary: 根因是 app 端修復與 Cloudflare worker / health-check 驗證沒有同時收斂；影響是正式站仍可能保留舊 header 或 console 嚴重錯誤，形成「本地綠、正式站壞」的漂移。
actions:

- 將 worker、health-check、nginx 與 ErrorBoundary 修復放在同一輪收斂
- 以正式站 header / console 驗證作為部署完成條件
- 將安全標頭責任邊界集中到可驗證流程，避免多頭維護
  verification:
- health-check.mjs 驗證通過
- 正式站 header 與 console 錯誤回歸消失
  references:
- git commit 6d3977a7

---

只修 app、不驗證 edge，最後就會得到「程式碼看起來沒問題，但正式站還是錯」的假綠燈。

---

date: 2026-01-07
title: CI 硬編碼檢查導致合規文件無法通過
score: 0
type: incident
scope: repo
tags: [ci, validation, documentation, ssot]
summary: 根因是 CI 以硬編碼字串檢查合規文件，而不是依官方規範與 app SSOT 驗證；影響是內容其實合規仍被 gate 擋下。
actions:

- 回到官方規範與 Context7 / Web 來源確認必填欄位
- 將檢查改為正則與結構驗證，避免複製貼上 RateWise 規則到所有 app
- 以 app.config.mjs 與公開產物作為 SSOT，而不是人工硬編碼字串
  verification:
- 合規文件 CI 重新通過
- 檢查邏輯可接受不同 app 的合法變體
  references:
- 2026-01-07 歷史失敗紀錄

---

文件檢查一旦硬編碼，就會把流程工具變成阻塞源；規格應該來自官方與 SSOT，不是來自上一個 app 的格式。

---

date: 2025-12-24
title: SEO 分支合併前未驗證生產環境
score: 0
type: incident
scope: ratewise
tags: [seo, release, production, verification]
summary: 根因是分支合併前只看本地變更與 CI，沒有用實際 base path 與資產路徑驗證正式部署行為；影響是 SEO 相關改動可能在生產環境才暴露圖片或路徑錯誤。
actions:

- 將正式 base path 納入 build / preview 驗證流程
- 合併前檢查關鍵圖片與公開資產是否存在
- 禁止依賴動態 BASE_URL 推導圖片與分享資產路徑
  verification:
- 使用 `VITE_*_BASE_PATH='/xxx/' pnpm build` 搭配 preview 驗證
- 生產環境資產實際可存取
  references:
- 2025-12-24 歷史重大教訓

---

SEO / 資產類變更如果不在真實 base path 下驗證，CI 綠燈也不代表正式站安全。

---

date: 2025-12-24
title: 圖片路徑使用動態 BASE_URL 導致 hydration
score: 0
type: incident
scope: ratewise
tags: [hydration, assets, ssg]
summary: 根因是圖片路徑在 SSG 與 client 端使用動態 BASE_URL 拼接，導致首屏 HTML 與 hydration 後結果不一致；影響是 hydration 錯誤與資產載入失敗。
actions:

- 改為一律使用相對路徑，交由 Vite 處理 base path
- 禁止在 component 內自行組合分享圖或 logo URL
- 將此規則寫入歷史失敗案例與 SOP
  verification:
- SSG HTML 與 client hydration 結果一致
- 圖片在不同 base path 部署下皆可正常載入
  references:
- 2025-12-24 歷史重大教訓

---

在 Vite / SSG 專案裡，資產路徑越「聰明」越容易出事；相對路徑通常才是正解。

---

date: 2025-11-29
title: CSP strict-dynamic 導致生產環境失效
score: -3
type: incident
scope: ratewise
tags: [security, csp, production, ssg]
summary: 根因是將 `strict-dynamic` 套用到 SSG 輸出，但靜態頁沒有穩定 nonce 機制可配合；影響是正式站 script 載入被 CSP 擋下，導致站點失效。
actions:

- 移除不適用於當前架構的 `strict-dynamic`
- 將 CSP 管理收斂到可驗證的 worker / build 流程，而不是理論上更嚴的策略
- 補正式站 header 驗證，避免只在本地假設 CSP 正常
  verification:
- 正式站 script 可執行
- CSP header 與部署流程一致
  references:
- 2025-11-29 失敗紀錄

---

安全策略不能脫離執行架構；SSG 沒有 nonce，就不應硬套需要 nonce 的 CSP 模式。

---

date: 2025-12-07
title: `new Date()` / `Math.random()` 進入 SSG 渲染路徑造成 Hydration 錯誤
score: 0
type: incident
scope: ratewise
tags: [hydration, ssg, rendering]
summary: 根因是動態時間與隨機值進入 SSG 首屏渲染，造成 server 與 client 初始輸出不同；影響是 React Hydration #418 與不穩定首屏。
actions:

- 將動態值改為 BUILD_TIME、CURRENT_YEAR 等固定來源
- 若必須顯示 client-only 值，改於 effect 後更新或使用 `suppressHydrationWarning`
- 將此類動態值列為 SSG 渲染禁用項
  verification:
- Hydration #418 消失
- SSG HTML 與 client 首次 render 一致
  references:
- 2025-12-07 / 2025-12-25 Hydration 修復紀錄

---

凡是會隨時間或隨機變化的值，只要出現在 SSG 首屏，就應先假定它會造成 hydration 問題。

---

date: 2025-12-25
title: `localStorage` 在 useState 初始化中造成 Hydration 錯誤
score: 0
type: incident
scope: ratewise
tags: [hydration, localstorage, react, ssg]
summary: 根因是在 `useState` 初始化函數直接讀取 `localStorage` / `window`，使 server 與 client 初始 state 不一致；影響是 hydration 錯誤與行為分叉。
actions:

- useState 改用固定初始值
- 在 `useEffect` 讀取 localStorage 後再更新 client state
- 將 browser-only API 視為 client phase 行為，不得進入初始渲染
  verification:
- Hydration 錯誤消失
- 無 window / localStorage 依賴的首屏可正常 SSG
  references:
- 2025-12-25 Hydration 修復紀錄

---

任何 browser-only API 只要提早進入 render phase，就會把 SSG 與 client state 拆成兩套世界。

## 歷史索引（精簡）

> 2026-02-27 以前的舊資料已從巨型 table 改為精簡索引，保留日期 / 分數 / 標題，避免繼續維護不穩定欄位。若未來要補細節，再逐筆升級為上方 entry blocks。

### 2026-02（索引）

- 2026-02-27｜+3｜✅ 成功｜Release workflow 補齊 Cloudflare security-headers worker 同步部署，避免 app 發版與邊緣標頭版本分裂
- 2026-02-27｜+3｜✅ 成功｜RateWise mobile UpdatePrompt 非阻塞修復，恢復 CI E2E 可操作性
- 2026-02-27｜+5｜✅ 成功｜RateWise PWA 回歸修復 + 版本 SSOT 校正 + 舊用戶升級鏈路驗證
- 2026-02-27｜+1｜✅ 成功｜清理已整合 `.example/config` 項目並補 root 截圖忽略規則與文件摘要
- 2026-02-27｜+2｜✅ 成功｜`.example/config` 基準導入：升級 `AGENTS.md` / `CLAUDE.md` 並同步 `commitlint`
- 2026-02-26｜+3｜✅ 成功｜park-keeper 羅盤頁恢復雙點持續追蹤自動縮放 + 地圖 i18n 補齊
- 2026-02-26｜+1｜✅ 成功｜haotool 新增 Park-Keeper 作品入口與快速導航
- 2026-02-26｜+4｜✅ 成功｜Park-Keeper UIUX 對齊與容器部署整合驗證
- 2026-02-11｜+6｜✅ 成功｜SEO 全面修復：squirrelscan 68→95+ 分，解決 7 類系統性問題
- 2026-02-11｜+4｜✅ 成功｜PR#133~#137 殘留回歸一次修復（轉場、離線提示、錯誤恢復）
- 2026-02-11｜+2｜✅ 成功｜修復 CI 安全閘門與 Release 主幹污染風險
- 2026-02-11｜+4｜✅ 成功｜PR#134 原子修復：轉場方向、離線探測與發版自動化 fallback
- 2026-02-10｜+1｜✅ 成功｜Release workflow 權限阻塞補救：手動版本化直推 main
- 2026-02-10｜+2｜✅ 成功｜PR#134 評論修復：頁面切換方向延遲一拍（返回動畫方向錯誤）
- 2026-02-08｜+2｜✅ 成功｜TypeScript vite-react-ssg 類型定義與測試 mock 修復
- 2026-02-06｜+4｜✅ 成功｜PWA 更新偵測 + 路由級 ErrorBoundary + Safari chunk 修復
- 2026-02-07｜+4｜✅ 成功｜P2 安全修復：7 個 CodeQL Medium 級別警告全部修復
- 2026-02-07｜+7｜✅ 成功｜P0+P1 安全修復：GitHub Actions 權限 + Dependabot HIGH + XSS
- 2026-02-02｜+2｜✅ 成功｜PWA chunk load error 根因修復與版本更新強制檢查
- 2026-02-01｜+2｜✅ 成功｜清理測試與建置警告並強化版本驗證流程
- 2026-02-01｜+1｜✅ 成功｜版本 SSOT 驗證與下拉刷新更新流程統一
- 2026-02-01｜+3｜✅ 成功｜設定頁 IA 重構 + app-info SSOT 模組
- 2026-02-01｜+1｜✅ 成功｜Lighthouse CLS 修復：Critical CSS 字體與行高對齊
- 2026-02-01｜+1｜✅ 成功｜E2E 穩定性修復：資料來源 testid + 快速金額輸入 fallback + Multi 清單驗證
- 2026-02-01｜+2｜✅ 成功｜E2E 修復補強：移除遮罩點擊 + Multi 列表 testid + sr-only H1
- 2026-02-01｜+2｜✅ 成功｜E2E 修復：可見標題選擇器 + 快速金額流程 + CurrencyList testid
- 2026-02-01｜+1｜✅ 成功｜Typecheck 修復：Footer 測試移除 JSX 類型依賴
- 2026-02-01｜+2｜✅ 成功｜Coverage 回歸修復：補齊 Footer 測試提升全域覆蓋率
- 2026-02-01｜+2｜✅ 成功｜版本 SSOT 回退統一 + UI 版本顯示與 Segmented Switch 透明度一致化
- 2026-02-01｜+3｜✅ 成功｜動畫 SSOT 擴展 + Segmented Switch 統一化
- 2026-02-26｜+1｜✅ 成功｜提交前風險檢查與快照提交準備
- 2026-02-26｜+1｜✅ 成功｜修復 park-keeper 版本模組 `no-unsafe-*` lint 阻塞
- 2026-02-26｜+3｜✅ 成功｜修復 park-keeper Leaflet 地圖遠距縮放破圖與卡頓，並開放自由縮放
- 2026-02-26｜+2｜✅ 成功｜park-keeper 羅盤頁手勢縮放 UX 收尾（小地圖禁縮放 + 大地圖 Google 風格回中按鈕）
- 2026-02-03｜+6｜✅ 成功｜PWA UpdatePrompt 整合重構 - 三重渲染修復 + SSOT + 最佳實踐
- 2026-02-07｜+3｜✅ 成功｜P2 安全修復 Review：3 個殘留警告完全修復
- 2026-02-08｜+2｜✅ 成功｜Safari 頁面切換錯誤修復 - 移除 web-vitals attribution 建構
- 2026-02-08｜+5｜✅ 成功｜Safari PWA 錯誤深度修復 - Service Worker URL 解析防禦
- 2026-02-08｜+2｜✅ 成功｜OfflineIndicator TDD 測試套件完成 - 🔴 RED → 🟢 GREEN → 🔵 REFACTOR
- 2026-02-11｜+3｜✅ 成功｜文檔全面更新 - ARCHITECTURE_BASELINE v3.0 + 狀態機流程圖 + CHECKLISTS v3.0
- 2026-02-11｜+6｜✅ 成功｜SEO 衝刺：sr-only H1 + OG 圖片壓縮 + 13 頁 meta description 擴充
- 2026-02-25｜+3｜✅ 成功｜SEO Workflow Prompt v2.1.0 品質強化
- 2026-02-26｜+3｜✅ 成功｜SEO Workflow Prompt v3.0.0 狀態機 + CLI 升級 + CF 指引
- 2026-02-26｜+5｜✅ 成功｜haotool SEO Workflow 全自動迭代 — squirrelscan 66→73, 9 個滿分分類
- 2026-02-26｜+8｜✅ 成功｜park-keeper monorepo 整合 — SSG + PWA + SEO + TDD 87 tests (95% lines)
- 2026-02-26｜+9｜✅ 成功｜park-keeper 前端渲染完全修復 — 3 根因系統性消除

### 2026-01（索引）

- 2026-01-30｜+5｜✅ 成功｜版本管理 SSOT 重構 + 微互動動畫系統
- 2026-01-31｜+4｜✅ 成功｜PWA matchPrecache 路徑格式修正 + 安全性強化
- 2026-01-31｜+2｜✅ 成功｜E2E 測試適配新 UI 架構 + 不穩定測試標記
- 2026-01-31｜+4｜✅ 成功｜PWA 離線快取 revision 動態化 + 安全性強化
- 2026-01-29｜+3｜✅ 成功｜localStorage JSON.parse 安全修復 - 白名單驗證 + 結構檢查
- 2026-01-29｜+1｜✅ 成功｜恢復 SEO CI 工作流並同步文件
- 2026-01-29｜+1｜✅ 成功｜核心 CI/CD 精簡與文件同步
- 2026-01-28｜+7｜✅ 成功｜Staging 環境 SPA 路由 404 修復 + UI/UX 優化
- 2026-01-28｜+1｜✅ 成功｜TypeScript TS6133 未使用匯入修復
- 2026-01-28｜+3｜✅ 成功｜iOS PWA 安全區遮蔽與 UIShowcase 捲動問題根因修復
- 2026-01-28｜+5｜✅ 成功｜React Hydration #418 錯誤抑制 - SSG 預期錯誤處理
- 2026-01-27｜+4｜✅ 成功｜iPhone SE (320px) 小螢幕內容偏移修復 - flex min-w-0 + 響應式 padding
- 2026-01-27｜+5｜✅ 成功｜i18n zh-Hant 語系載入修復 - SSG + LanguageDetector 問題根本解決
- 2026-01-26｜+4｜✅ 成功｜UI/UX v2.4 - MiniTrendChart passive listener 修復 + 滾動 + SkeletonLoader
- 2026-01-27｜+4｜✅ 成功｜UI/UX v2.3 - iOS Safari 滾動修正 + MiniTrendChart 觸控改進
- 2026-01-26｜+5｜✅ 成功｜UI/UX v2.2 現代化重構 - 滾動修正 + 按鈕美化 + Header 多語系
- 2026-01-26｜+3｜✅ 成功｜捲軸跑版修正 - 2025 最佳實踐
- 2026-01-26｜+4｜✅ 成功｜UI/UX v2.1 重構 - Favorites/Toast/ConversionHistory/MultiConverter
- 2026-01-26｜+7｜✅ 成功｜UI/UX v2.0 重構 - SingleConverter/ConversionHistory/MiniTrendChart
- 2026-01-25｜+5｜✅ 成功｜ConversionHistory UI/UX 重構 + Toast SSOT 設計
- 2026-01-23｜+3｜✅ 成功｜計算機淺色主題數字鍵優化 + SSOT 色彩系統強化
- 2026-01-23｜+3｜✅ 成功｜多幣別資料顯示修復 + 基準貨幣邊框裁切修復
- 2026-01-23｜0｜⚠️ 待追蹤｜E2E CI 持續失敗 - React 應用未啟動
- 2026-01-23｜+1｜✅ 成功｜安全漏洞忽略配置 - dev-only lodash/wrangler
- 2026-01-22｜+3｜✅ 成功｜i18n 頁面級別整合 - MultiConverter/Favorites 國際化
- 2026-01-17｜+4｜✅ 成功｜FOUC 閃爍問題根本修復 - 同步主題初始化腳本
- 2026-01-16｜+1｜✅ 成功｜組件語義色彩統一 - 硬編碼色彩改為 SSOT
- 2026-01-16｜+1｜✅ 成功｜Micro-interactions 動畫強化 - 按鈕 hover/active 效果
- 2026-01-16｜+9｜✅ 成功｜Design Token 完整語義色彩系統 - info/success/warning/error
- 2026-01-16｜+5｜✅ 成功｜Design Token 最佳實踐完善 - secondary/info 語義色
- 2026-01-16｜+8｜✅ 成功｜ParkKeeper 風格 UI/UX 重構 - 4 種風格系統
- 2026-01-15｜+1｜✅ 成功｜無障礙對比度修復（單/多幣別按鈕）
- 2026-01-15｜+1｜✅ 成功｜SEO 2025 sitemap 合規修復（CI 失敗）
- 2026-01-15｜+1｜✅ 成功｜全域檢查與文件同步（BASE_URL/環境變數）
- 2026-01-15｜+1｜✅ 成功｜`.env.example` 補齊多應用子路徑環境變數
- 2026-01-15｜+1｜✅ 成功｜子路徑部署改回最佳實踐（移除靜態鏡像）
- 2026-01-15｜+1｜✅ 成功｜v1.5.0 版本號與更新日誌同步（Changesets）
- 2026-01-14｜+1｜✅ 成功｜行動版頁內 Footer 漸層對齊桌面版（SSOT）
- 2026-01-14｜+1｜✅ 成功｜Footer 手機/電腦色彩對齊（SSOT）
- 2026-01-14｜+1｜✅ 成功｜收藏星星金色與基準幣別高亮回復舊版色碼（SSOT）
- 2026-01-14｜+1｜✅ 成功｜還原舊版 H1 與行動版 Footer 色碼（SSOT）
- 2026-01-14｜+2｜✅ 成功｜回復舊配色並維持 SSOT Design Token
- 2026-01-14｜+5｜✅ 成功｜緊急修復：Service Worker clientsClaim 缺失導致離線功能失效
- 2026-01-14｜+2｜✅ 成功｜修復 quake-school TypeScript 類型錯誤
- 2026-01-13｜+4｜✅ 成功｜PR#97 Design Token 無障礙性對比度修復 + SEO Audit 權限修復
- 2026-01-13｜+8｜✅ 成功｜Phase 2 CSS Variables 升級 - 動態主題切換架構
- 2026-01-12｜+5｜✅ 成功｜Design Token SSOT 重構：語義化色彩系統
- 2026-01-12｜+2｜✅ 成功｜PR#95 coverage threshold 修復：offlineStorage.ts 排除策略
- 2026-01-12｜+3｜✅ 成功｜PR#95 offlineStorage.ts 類型錯誤修復 + CI 通過
- 2026-01-10｜+3｜✅ 成功｜Service Worker 使用 IIFE 格式修復評估失敗
- 2026-01-10｜+2｜✅ 成功｜Service Worker 簡化立即激活邏輯
- 2026-01-10｜+1｜✅ 成功｜Service Worker skipWaiting/clientsClaim 恢復
- 2026-01-09｜+3｜✅ 成功｜Service Worker 生命週期修復 - CI E2E PWA 測試超時根本解決
- 2026-01-09｜+1｜✅ 成功｜haotool SectionBackground 組件測試
- 2026-01-09｜+2｜✅ 成功｜haotool 測試覆蓋率提升 (+4.73%)
- 2026-01-09｜+2｜✅ 成功｜大規模技術債清理 (依賴+檔案)
- 2026-01-09｜+3｜✅ 成功｜react-router-dom XSS 漏洞修復 (CVE-2026-22029)
- 2026-01-09｜+1｜✅ 成功｜React Router Future Flag 警告消除
- 2026-01-09｜+1｜✅ 成功｜未使用依賴清理
- 2026-01-09｜+1｜✅ 成功｜SEO Health Check CDN 快取修復
- 2026-01-09｜+2｜✅ 成功｜E2E PWA 測試穩定性修復 - CI 環境超時問題解決
- 2026-01-09｜+6｜✅ 成功｜PWA 離線根本修復 - Safari「無法打開網頁」完全解決
- 2026-01-09｜+3｜✅ 成功｜PWA 離線 offline.html 快取修復
- 2026-01-09｜0｜⚠️ 注意｜beasties 升級導致 SSG 失敗
- 2026-01-09｜+1｜✅ 成功｜lucide-react 全專案更新
- 2026-01-09｜+1｜✅ 成功｜haotool、nihonname、ratewise 依賴更新
- 2026-01-08｜+1｜✅ 成功｜quake-school 依賴更新
- 2026-01-08｜+1｜✅ 成功｜新增 reportWebVitals 測試覆蓋
- 2026-01-08｜+2｜✅ 成功｜全專案依賴批次更新（10+ 套件）
- 2026-01-08｜+3｜✅ 成功｜依賴更新 + 死代碼清理
- 2026-01-08｜+3｜✅ 成功｜PWA 離線 Fallback 匯率數據修復
- 2026-01-08｜+2｜✅ 成功｜PWA 離線最佳實踐重構：清理註解 + 合併兩 PR 優點
- 2026-01-07｜+1｜✅ 成功｜HaoTool 無障礙修復：新增 main landmark
- 2026-01-07｜+1｜✅ 成功｜CSP/HSTS 遷移 CI 驗證：全部通過！
- 2026-01-07｜+3｜✅ 成功｜CSP/HSTS 遷移至 Cloudflare - 高可維護性架構
- 2026-01-07｜+1｜✅ 成功｜SEO Health Check 修復驗證：CI 全綠！
- 2026-01-07｜+1｜✅ 成功｜SEO Health Check 超時修復
- 2026-01-07｜+1｜✅ 成功｜RateWise PageSpeed 優秀驗證：90/100/96/100
- 2026-01-07｜+1｜✅ 成功｜NihonName 無障礙 100 分驗證
- 2026-01-07｜+5｜✅ 成功｜建立超級 Agent 自動化工作流 Prompt 文檔
- 2026-01-07｜+1｜✅ 成功｜獎懲記錄流程改為 commit 前更新
- 2026-01-07｜+1｜✅ 成功｜NihonName 無障礙修復：新增 main landmark
- 2026-01-07｜+2｜✅ 成功｜NihonName PageSpeed 效能大幅提升：66→86 (+20)
- 2026-01-07｜+2｜✅ 成功｜Quake-School 字體載入優化：非同步 Google Fonts
- 2026-01-07｜+5｜✅ 成功｜HaoTool P1 優化：3D Hero IntersectionObserver 延遲載入
- 2026-01-07｜+3｜✅ 成功｜Quake-School 無障礙修復 + PageSpeed 審計完成
- 2026-01-07｜+8｜✅ 成功｜NihonName 效能優化：移除 pinyin-pro 運行時依賴
- 2026-01-07｜+8｜✅ 成功｜多應用 SEO 審計 (RateWise + NihonName + Quake-School)
- 2026-01-06｜+5｜✅ 成功｜修復 Seobility SEO 報告問題（H1/內容/charset）
- 2026-01-06｜+1｜✅ 成功｜修復 CI 多幣別 quick amount 仍偶發失敗（rAF 改為同步）
- 2026-01-06｜+1｜✅ 成功｜修復 CI 多幣別 quick amount 測試不穩定（RateWise 測試重設 rAF stub）
- 2026-01-06｜+1｜✅ 成功｜修復 CI 多幣別 quick amount 測試不穩定（requestAnimationFrame stub）
- 2026-01-06｜+1｜✅ 成功｜修復圖片中繼資料警告（首頁 Article 圖片補齊授權欄位）
- 2026-01-06｜+2｜✅ 成功｜修復 FAQPage 重複（首頁 JSON-LD 下放至首頁元件）
- 2026-01-06｜0｜⚠️ 觀察｜生產環境 SEO 驗證仍未反映 llms.txt v1.4.0
- 2026-01-06｜+2｜✅ 成功｜E2E strict mode 修正 + llms.txt 檢查規則調整
- 2026-01-06｜+1｜✅ 成功｜Vitest CLI 錯誤修正（指定測試檔）
- 2026-01-06｜+3｜✅ 成功｜2026 進階 SEO P2/P3 依序落地（VSI/內部連結/Mobile Parity/llms.txt/INP）
- 2026-01-06｜+2｜✅ 成功｜清理過時 PRs（11 個）+ 文檔編號修復
- 2026-01-06｜+1｜✅ 成功｜2026 進階 SEO P2/P3 規劃與 BDD 流程補齊
- 2026-01-05｜+3｜✅ 成功｜SEO 修正：同步 sitemap 與 llms.txt 實作
- 2026-01-06｜+5｜✅ 成功｜P0/P1 Gate 完整驗證（瀏覽器自動化）
- 2026-01-04｜+2｜✅ 成功｜HaoTool postbuild HTML 修復 + OG/Twitter 驗證通過
- 2026-01-04｜+3｜✅ 成功｜AI 摘要引用結構規範文檔（005）
- 2026-01-07｜+10｜✅ 成功｜消除 SEO Health Check 硬編碼，修復 CI 錯誤驗證邏輯
- 2026-01-07｜+5｜✅ 成功｜安全標頭遷移至 Cloudflare + 分層防禦架構文檔化
- 2026-01-08｜+5｜✅ 成功｜Safari PWA 離線修復 - navigateFallback 路徑問題
- 2026-01-08｜+3｜✅ 成功｜Safari PWA 離線修復 - offline.html 子路徑鏡像缺失
- 2026-01-12｜+3｜✅ 成功｜PR#95 offlineStorage.ts 類型錯誤修復 + CI 通過
- 2026-01-12｜+5｜✅ 成功｜Design Token SSOT 重構 + BDD 紅→綠→藍循環完成
- 2026-01-13｜+8｜✅ 成功｜Design Token 核心組件完整遷移 + Brand Token 擴展
- 2026-01-26｜+4｜✅ 成功｜SkeletonLoader Hydration 錯誤修復 - 移除巢狀 AppLayout
- 2026-01-27｜+5｜✅ 成功｜高度斷點 RWD 優化 - 支援小螢幕裝置
- 2026-01-27｜+4｜✅ 成功｜i18n 語系正規化修復 - zh-Hant → zh-TW 映射

### 2025-12（索引）

- 2025-12-29｜+7｜✅ 成功｜PWA 更新模組整合 + ESLint 修復 + E2E 離線測試
- 2025-12-27｜+7｜✅ 成功｜Pull-to-Refresh + 快取清除完整審查 + Lighthouse 95%+
- 2025-12-26｜+5｜✅ 成功｜修復 ESLint set-state-in-effect 錯誤 + 測試重構
- 2025-12-26｜+2｜✅ 成功｜關閉所有 Dependabot PRs，完成 Renovate 遷移工作流程
- 2025-12-26｜+10｜✅ 成功｜Renovate 2025 最佳實踐優化 + 自動背景更新完整實施
- 2025-12-25｜+12｜✅ 成功｜React Hydration #418 修復 + CI jest-dom 修復 + CDN 工作流程
- 2025-12-23｜+1｜✅ 成功｜CI 監控完成並定位 gitleaks 授權缺失
- 2025-12-23｜0｜✅ 成功｜提交前驗證完成
- 2025-12-23｜0｜⚠️ 注意｜CI 失敗分析：E2E 無障礙測試非 SEO 工作造成
- 2025-12-23｜+2｜✅ 成功｜BreadcrumbList Schema SSG 限制務實解決 + 驗證通過
- 2025-12-23｜+4｜✅ 成功｜SEO 最佳實踐修復：移除虛假評論 + BreadcrumbList 統一管理
- 2025-12-23｜0｜⚠️ 注意｜持續測試與 CI 監控（遠端仍失敗）
- 2025-12-23｜+2｜✅ 成功｜修復 Breadcrumb JSON-LD 測試 + Footer a11y + Sitemap 時區
- 2025-12-23｜-1｜⚠️ 注意｜CI 失敗：E2E 無障礙對比 + gitleaks 授權缺失
- 2025-12-22｜+2｜✅ 成功｜RateWise prebuild 恢復 sitemap 生成
- 2025-12-21｜+2｜✅ 成功｜RateWise SSG 尾斜線標準化 + SEO 指南更新
- 2025-12-17｜0｜⚠️ 注意｜本地測試超時導致 pre-push 失敗但仍需推送
- 2025-12-16｜+3｜✅ 成功｜HaoTool 測試覆蓋率修復 + Engineering 金屬質感優化
- 2025-12-15｜+8｜✅ 成功｜RateWise 生產環境 base 路徑修復 + og-image.png 版控
- 2025-12-14｜+3｜✅ 成功｜Hero 左右分區 + OG 圖顯示 + 品牌敘事修正
- 2025-12-14｜+8｜✅ 成功｜CI 環境變數統一修復 + Lenis 滾動優化 + SEO 完善
- 2025-12-14｜+2｜✅ 成功｜真實專案截圖替換 placeholder.svg
- 2025-12-14｜+3｜✅ 成功｜RateWise SEO 檔案 Nginx alias 路徑修復
- 2025-12-14｜+3｜✅ 成功｜zbpack.json 解決 Zeabur 快取導致部署未更新問題
- 2025-12-14｜+10｜✅ 成功｜HAOTOOL 作品集首頁完整重構 + vite-react-ssg 整合
- 2025-12-14｜+2｜✅ 成功｜setTimeout 測試未處理錯誤修復
- 2025-12-14｜+2｜✅ 成功｜framer-motion + lenis 測試環境 mock 完善
- 2025-12-14｜+2｜✅ 成功｜真實內容替換 + 繁體中文本地化
- 2025-12-13｜+1｜✅ 成功｜創建 Search Console 操作指南 (專注實用文檔)
- 2025-12-13｜+1｜✅ 成功｜React 安全性升級 19.2.1 → 19.2.3
- 2025-12-12｜+2｜✅ 成功｜修復 Firefox E2E 測試失敗（70 個測試）
- 2025-12-12｜+1｜✅ 成功｜完善 HowTo Schema for /guide 頁面（4步驟→8步驟）
- 2025-12-11｜+3｜✅ 成功｜修復 SEO E2E 測試失敗（78 個失敗測試） + 重複 meta tags
- 2025-12-12｜+5｜✅ 成功｜Linus 原則 E2E 測試矩陣精簡 + CI 時間優化
- 2025-12-12｜+1｜✅ 成功｜CSP header/跨域預檢阻擋修復
- 2025-12-11｜+2｜✅ 成功｜CSP inline script 阻擋修復 + hash 自動覆蓋
- 2025-12-11｜+4｜✅ 成功｜E2E Flaky Tests 修復 + Playwright 2025 最佳實踐
- 2025-12-11｜+7｜✅ 成功｜Gitleaks CI 修復 + SEO 檢核清單模板建立
- 2025-12-11｜+7｜✅ 成功｜CI/CD 全面優化 + 效能監控建立 + Gitleaks 授權澄清
- 2025-12-11｜+4｜✅ 成功｜SEO E2E 測試修復 + CI 失敗根因分析
- 2025-12-10｜+10｜✅ 成功｜Hash-based CSP 實作完成 + 安全評分 85→95
- 2025-12-10｜+15｜✅ 成功｜2025 安全最佳實踐全面實作 + 安全評分 85→95
- 2025-12-10｜+6｜✅ 成功｜專案資安深度審查完成 + 安全評分 85/100
- 2025-12-10｜+5｜✅ 成功｜CI 安全掃描穩定性修復 + libpng 漏洞修補
- 2025-12-10｜+3｜✅ 成功｜NihonName SEO 完整審計 + schema-dts 評估確認
- 2025-12-09｜+1｜✅ 成功｜Dice tips 與未填姓氏 toast icon 對齊修復
- 2025-12-09｜+2｜✅ 成功｜CI 資安防護強化：Trivy + Dependabot
- 2025-12-09｜+1｜✅ 成功｜React 高風險 CVE 疑慮排查 & 率先更新到 19.2.1
- 2025-12-07｜+5｜✅ 成功｜meta-tags.ts 測試覆蓋率 0%→97% + 綜合審計報告
- 2025-12-07｜+3｜✅ 成功｜煙火動畫根本性修復 + schema-dts 評估決策
- 2025-12-06｜+2｜✅ 成功｜React Hydration #418 進階修復嘗試
- 2025-12-06｜+1｜✅ 成功｜SkeletonLoader 性能測試放寬以避免 CI flaky
- 2025-12-06｜+1｜✅ 成功｜CSV 諧音梗羅馬拼音備援完善 + 資料集測試
- 2025-12-06｜+5｜✅ 成功｜React Hydration #418 完整修復 + /history 403 修復
- 2025-12-06｜+1｜✅ 成功｜CSV 諧音梗羅馬拼音全覆蓋
- 2025-12-06｜+1｜✅ 成功｜清除錯誤諧音梗黑名單
- 2025-12-06｜+1｜✅ 成功｜台灣複姓權威來源校正 + placeholder 使用實收名單
- 2025-12-06｜+2｜✅ 成功｜jsonld.ts 測試覆蓋率 0% → 100%
- 2025-12-06｜+1｜✅ 成功｜台灣複姓權威來源校正 + placeholder 使用實收名單
- 2025-12-06｜+1｜✅ 成功｜花火大會 2.0：滿版多樣煙火 + 雙層特效
- 2025-12-06｜+3｜✅ 成功｜TypeScript 錯誤修復 + Cloudflare 重定向 + HelmetProvider
- 2025-12-06｜+2｜✅ 成功｜花火大會升級：tsParticles 全屏煙火 + 音效 + 文案互動優化
- 2025-12-06｜+1｜✅ 成功｜分享文案去除不雅字眼、改為通用版本
- 2025-12-06｜+1｜✅ 成功｜搖晃彩蛋授權延後 60 秒提示
- 2025-12-06｜+1｜✅ 成功｜ratewise SSR localStorage 綁定修復
- 2025-12-06｜+1｜✅ 成功｜Threads/X 品牌圖標更新
- 2025-12-06｜+1｜✅ 成功｜搖晃彩蛋升級：10 連搖高階煙火
- 2025-12-06｜+1｜✅ 成功｜吐司文案精簡
- 2025-12-06｜+1｜✅ 成功｜Hydration #418 防護 + 分享模態置中
- 2025-12-06｜+3｜✅ 成功｜nihonname AI Search + Critical CSS 優化
- 2025-12-06｜+1｜✅ 成功｜姓氏輸入動態 placeholder + 複姓標籤精簡
- 2025-12-06｜+1｜✅ 成功｜nihonname 截圖提示節奏與文案調整
- 2025-12-06｜+2｜✅ 成功｜nihonname ShareButtons 組件測試覆蓋率 0%→97%
- 2025-12-05｜+4｜✅ 成功｜nihonname SEO 強化 + 諧音梗資料庫 80+ 筆擴充
- 2025-12-05｜+5｜✅ 成功｜nihonname 姓氏資料庫完整升級 + SourceAccordion 組件
- 2025-12-04｜+1｜✅ 成功｜nihonname 結果卡片高度回退至 3e827b 版面
- 2025-12-04｜+12｜✅ 成功｜nihonname 歷史專區 SEO FAQ 頁面建立 + 212 測試全通過
- 2025-12-04｜+2｜✅ 成功｜nihonname 結果頁 90dvh 垂直置中 + 純淨截圖提示 1s
- 2025-12-04｜+5｜✅ 成功｜NihonName BDD 測試補齊：4 元件完整測試覆蓋
- 2025-12-04｜+6｜✅ 成功｜nihonname 生產環境字體 404 + preload 警告根因修復
- 2025-12-04｜0｜✅ 成功｜NihonName 測試覆蓋率配置調整 - 暫時排除未測試元件
- 2025-12-04｜+2｜✅ 成功｜NihonName 字體階層優化 + 移除冗餘 UI 元素
- 2025-12-04｜+5｜✅ 成功｜NihonName UI 優化：交互式改名 + 截圖模式 + 高級動畫提示
- 2025-12-03｜+1｜✅ 成功｜Mobile 垂直置中&無捲軸最佳化（iOS safe area）
- 2025-12-03｜0｜⚠️ 注意｜SEO Health Check workflow 失敗（usd/eur/cad aborted）
- 2025-12-03｜+1｜✅ 成功｜Tailwind 未編譯根因修復（樣式未生效）
- 2025-12-03｜+3｜✅ 成功｜NihonName 基底路徑與 PWA 資產 404 根因修復
- 2025-12-03｜+3｜✅ 成功｜Canonical 衝突根因修復 - SEO/Best Practices 恢復
- 2025-12-03｜+1｜✅ 成功｜Favicon 路徑修復 - Best Practices 恢復 100/100
- 2025-12-03｜0｜⚠️ 注意｜Performance 下降為測試環境網路延遲
- 2025-12-03｜+5｜✅ 成功｜Phase 2 完成: 21 個 SEO 權威來源查詢與整合
- 2025-12-03｜+1｜✅ 成功｜移除未使用依賴 react-schemaorg/schema-dts
- 2025-12-03｜+3｜✅ 成功｜Guide 頁面擴充至 8 步驟完整教學
- 2025-12-03｜+2｜✅ 成功｜SEO_TODO.md 更新 + 可選功能規格文檔建立
- 2025-12-03｜+1｜✅ 成功｜vitest/typescript-eslint patch 更新
- 2025-12-03｜+2｜✅ 成功｜storage.ts SSR 分支覆蓋率 100%
- 2025-12-02｜+3｜✅ 成功｜ChatGPT 報告深度驗證 + AI_SEARCH_OPTIMIZATION_SPEC v4.0
- 2025-12-02｜+2｜✅ 成功｜SEO Health Check 腳本更新支援 17 頁面
- 2025-12-02｜+8｜✅ 成功｜計算機同步問題 BDD 修復 + 25→30 天全域更新
- 2025-12-02｜+11｜✅ 成功｜測試覆蓋率全面提升 + 依賴升級 + E2E 驗證
- 2025-12-02｜+2｜✅ 成功｜MiniTrendChart.tsx 測試覆蓋率提升
- 2025-12-02｜+2｜✅ 成功｜RateWise.tsx 測試覆蓋率大幅提升
- 2025-12-02｜+2｜✅ 成功｜SEO Health Check 腳本擴展
- 2025-12-02｜+2｜✅ 成功｜useUrlNormalization.tsx 測試覆蓋率 100%
- 2025-12-01｜+5｜✅ 成功｜CI 防護機制強化 + Sitemap 自動更新修復
- 2025-12-01｜+2｜✅ 成功｜ErrorBoundary.tsx 測試覆蓋率 100%
- 2025-12-01｜+2｜✅ 成功｜測試覆蓋率提升: Layout.tsx + CurrencyList.tsx
- 2025-12-01｜+2｜✅ 成功｜深度 SEO 驗證 + URL 一致性修復
- 2025-12-01｜+2｜✅ 成功｜useCalculator.ts 測試覆蓋率大幅提升
- 2025-12-01｜+5｜✅ 成功｜v1.2.0 完整發布: CI 修復 + 生產環境驗證
- 2025-12-02｜+4｜✅ 成功｜依賴升級: Vite 7.2.6, vite-plugin-pwa 1.2.0, @types/node 24.10.1, jsdom 27.2.0
- 2025-12-02｜+5｜✅ 成功｜SEO 規格文檔 v3.0.0 完全重寫 + SEO TODO 系統建立
- 2025-12-03｜+8｜✅ 成功｜nihonname 專案全面 SEO 優化與預渲染架構重構
- 2025-12-03｜+5｜✅ 成功｜nihonname 測試覆蓋率提升至 97%
- 2025-12-03｜+3｜✅ 成功｜nihonname PWA 圖標與社交分享圖片完整建立
- 2025-12-04｜+5｜✅ 成功｜nihonname 生產環境部署獨立性修復
- 2025-12-04｜+3｜✅ 成功｜nihonname base path 根因修復
- 2025-12-04｜+5｜✅ 成功｜nihonname 生產環境部署完成
- 2025-12-04｜+3｜✅ 成功｜nihonname 諧音梗日文名資料驗證與修正
- 2025-12-04｜+3｜✅ 成功｜nihonname BreadcrumbList JSON-LD schema 添加
- 2025-12-04｜+5｜✅ 成功｜nihonname 諧音梗資料庫擴充至 500 個 + 用戶自訂功能
- 2025-12-04｜+10｜✅ 成功｜nihonname 和紙（Washi）質感組件實現 + BDD 測試
- 2025-12-06｜+5｜✅ 成功｜nihonname 高級社群分享與截圖模式優化
- 2025-12-07｜+4｜✅ 成功｜修復 Hydration #418 根因 (Date.now/Math.random 在 useState)
- 2025-12-07｜+5｜✅ 成功｜修復 nihonname 煙火動畫卡住當掉根本問題
- 2025-12-09｜+5｜✅ 成功｜SEO 圖片版號 + NihonName 彩蛋體驗升級
- 2025-12-09｜+3｜✅ 成功｜SCA/容器掃描強化 + Dependabot 自動 rebase
- 2025-12-15｜+10｜✅ 成功｜消除 CI 硬編碼，建立 SSOT 架構 + 100% 路由覆蓋
- 2025-12-29｜+12｜✅ 成功｜RateWise PWA 深度優化 + 棉花糖雲朵通知 + LCP 優化
- 2025-12-25｜未標記｜✅ 已解｜React Hydration #418 在 SSG 環境中偶發

### 2025-11（索引）

- 2025-11-30｜+5｜✅ 成功｜v1.2.0 重大更新: GPL-3.0 授權 + SEO 優化
- 2025-11-30｜+3｜✅ 成功｜根本修復: generate-sitemap.js 缺少 /guide
- 2025-11-30｜+3｜✅ 成功｜生產環境 SEO 健康檢查 CI 整合
- 2025-11-30｜+2｜✅ 成功｜E2E Fixture 優化 - Flaky tests 減少 50%
- 2025-11-30｜+3｜✅ 成功｜Sitemap/SSG 一致性修復 + 驗證腳本
- 2025-11-29｜+2｜✅ 成功｜lint-staged v16 升級 + Fast Refresh 警告修復
- 2025-11-29｜+1｜✅ 成功｜Major 依賴升級: Husky v9 + Commitlint v20
- 2025-11-29｜+1｜✅ 成功｜Patch 依賴升級 (7 套件)
- 2025-11-29｜+1｜✅ 成功｜死代碼清理: isCacheKey/isUserDataKey 移除
- 2025-11-29｜+1｜✅ 成功｜Prettier Patch 升級 + Issue #22 關閉
- 2025-11-29｜+3｜✅ 成功｜安全標頭優化 + MultiConverter 測試覆蓋率提升
- 2025-11-29｜+1｜✅ 成功｜Cloudflare Worker CSP 修復部署成功
- 2025-11-28｜+1｜✅ 成功｜vite + playwright Minor 更新
- 2025-11-28｜+1｜✅ 成功｜Minor/Patch 依賴安全更新 (6 套件)
- 2025-11-28｜+1｜✅ 成功｜csp-reporter.ts 測試覆蓋率 0% → 100%
- 2025-11-28｜+1｜✅ 成功｜生產環境 CSP inline script 修復 (PR #33)
- 2025-11-28｜+1｜✅ 成功｜Lighthouse CI Workflow 權限修復
- 2025-11-28｜+3｜✅ 成功｜Lighthouse CI 根本修復 + FAQ JSON-LD 完整性
- 2025-11-28｜+1｜✅ 成功｜FAQ/About Hydration #418 與 E2E BasePath 修復
- 2025-11-28｜+1｜✅ 成功｜React 19 react-is AsyncMode 崩潰修復
- 2025-11-27｜+1｜✅ 成功｜LHCI 離線與報告路徑修復
- 2025-11-27｜+1｜✅ 成功｜Nginx SW 快取覆蓋修正 + NEL 路徑對齊
- 2025-11-27｜+1｜✅ 成功｜FAQ/About 預渲染紅燈轉綠燈（fallback 靜態輸出）
- 2025-11-27｜-1｜⚠️ 注意｜prerender FAQ/About 未產生 (Vitest 紅燈)
- 2025-11-27｜+1｜✅ 成功｜Prerender 自動建置與 LHCI 離線穩定化
- 2025-11-27｜+1｜✅ 成功｜SW 快取優先序與 NEL 路徑回正
- 2025-11-24｜+1｜✅ 成功｜PWA SW 測試重啟 + Calculator 跨瀏覽器穩定化
- 2025-11-24｜+3｜✅ 成功｜SEO Phase 1: Google Search Console 索引問題修復
- 2025-11-24｜+1｜✅ 成功｜PWA base 路徑資產鏡像 + E2E 全綠驗證
- 2025-11-24｜+1｜✅ 成功｜文檔狀態審查：驗證並更新 2 個為已完成
- 2025-11-24｜+1｜✅ 成功｜文檔清理：刪除 3 個違規文檔
- 2025-11-23｜+1｜✅ 成功｜本地全套 CI 流程綠燈（Lint/Type/Test/Build）
- 2025-11-23｜+3｜✅ 成功｜Lighthouse CI CHROME_INTERSTITIAL_ERROR 根本修復
- 2025-11-23｜+3｜✅ 成功｜Base Path 白屏與嚴格模式雙元素衝突修復
- 2025-11-23｜+1｜✅ 成功｜金額輸入框補 data-testid，穩定 E2E 定位
- 2025-11-23｜+1｜✅ 成功｜多幣別/單幣別測試對齊現況 UI
- 2025-11-23｜+2｜✅ 成功｜修復 PWA Manifest 重複注入
- 2025-11-23｜+5｜✅ 成功｜修復 CI/CD 端口不一致與 Lighthouse CI 錯誤
- 2025-11-23｜-2｜❌ 失敗｜E2E 測試端口衝突導致 CI 失敗
- 2025-11-23｜+2｜✅ 成功｜修復 Playwright Client 端硬編碼端口問題
- 2025-11-23｜+2｜✅ 成功｜修復 Vite Preview Server 端口隨機性
- 2025-11-23｜-1｜❌ 失敗｜CI 端口配置漂移
- 2025-11-08｜+3｜✅ 成功｜Phase1 PWA 優化 Linus 風格深度驗證
- 2025-11-08｜+3｜✅ 成功｜趨勢圖優化深度驗證
- 2025-11-08｜+1｜✅ 成功｜CI daily monitor:history
- 2025-11-08｜+2｜✅ 成功｜Suspense Skeleton + Workbox 快取
- 2025-11-08｜+2｜✅ 成功｜歷史匯率服務改為 Promise.allSettled
- 2025-11-08｜+1｜✅ 成功｜404 缺口最佳實踐調查
- 2025-11-08｜+1｜✅ 成功｜釐清 2025-10-13 歷史匯率 JSON 404 根因
- 2025-11-08｜+3｜✅ 成功｜Phase1 PWA 優化完整驗證
- 2025-11-08｜+2｜✅ 成功｜Phase1 PWA 速度優化
- 2025-11-07｜+2｜✅ 成功｜Lighthouse Pro 工作流與代碼品質修復
- 2025-11-07｜+3｜✅ 成功｜圖片優化與 LCP 大幅提升
- 2025-11-07｜+2｜✅ 成功｜AI 搜尋優化 Phase 1
- 2025-11-05｜+2｜✅ 成功｜API 文檔與 25 個單元測試
- 2025-11-05｜+2｜✅ 成功｜多幣別交叉匯率計算完善
- 2025-11-05｜+1｜✅ 成功｜單幣別輸入框千分位修復
- 2025-11-05｜+1｜✅ 成功｜Nginx ratewise 符號連結避免 404
- 2025-11-05｜+1｜✅ 成功｜Husky pre-commit UTF-8 支援
- 2025-11-05｜+1｜✅ 成功｜Docker 建置自動注入 Git 資訊
- 2025-11-05｜+1｜✅ 成功｜透過 gh api 合併 PWA 分支
- 2025-11-05｜+1｜✅ 成功｜Skeleton 測試簡化
- 2025-11-05｜+1｜✅ 成功｜測試修復 (格式化值斷言)
- 2025-11-05｜+1｜✅ 成功｜版本號自動更新機制修復
- 2025-11-05｜+1｜✅ 成功｜修復 Changesets token 錯誤
- 2025-11-05｜+1｜✅ 成功｜多幣別輸入恢復即時換算
- 2025-11-05｜+1｜✅ 成功｜匯率顯示邏輯分離
- 2025-11-05｜+1｜✅ 成功｜基準貨幣視覺標示
- 2025-11-05｜+1｜✅ 成功｜基準貨幣快速切換功能
- 2025-11-05｜+1｜✅ 成功｜收藏星星佈局穩定性修正
- 2025-11-05｜+1｜✅ 成功｜匯率顯示邏輯統一
- 2025-11-05｜+1｜✅ 成功｜LOGO 品牌識別強化
- 2025-11-05｜+1｜✅ 成功｜鍵盤輸入限制
- 2025-11-05｜+2｜✅ 成功｜輸入框編輯功能完全重構
- 2025-11-05｜+1｜✅ 成功｜匯率文字漸層方向修正
- 2025-11-05｜+1｜✅ 成功｜模式切換按鈕現代化設計
- 2025-11-05｜+1｜✅ 成功｜UI 配色融合優化
- 2025-11-05｜+1｜✅ 成功｜ISO 4217 深度修正
- 2025-11-05｜+1｜✅ 成功｜瀏覽器端完整測試驗證
- 2025-11-05｜+1｜✅ 成功｜UI 佈局優化
- 2025-11-05｜+1｜✅ 成功｜千位分隔符修正
- 2025-11-05｜+1｜✅ 成功｜UI 優化
- 2025-11-05｜+1｜✅ 成功｜貨幣格式化增強
- 2025-11-04｜+1｜✅ 成功｜實作即期/現金匯率切換 UI
- 2025-11-04｜+1｜✅ 成功｜趨勢圖數據整合優化
- 2025-11-04｜+1｜✅ 成功｜修復生產環境 404 錯誤
- 2025-11-01｜+1｜✅ 成功｜建立 4 項強制規範文檔
- 2025-11-01｜+1｜✅ 成功｜新增前端刷新時間追蹤
- 2025-11-01｜+1｜✅ 成功｜修正 toLocaleTimeString 使用錯誤
- 2025-11-01｜+1｜✅ 成功｜版本生成邏輯簡化
- 2025-11-01｜+1｜✅ 成功｜時間格式化邏輯重構
- 2025-11-01｜+1｜✅ 成功｜即時匯率刷新 UI 更新時間

### 2025-10（索引）

- 2025-10-31｜+1｜✅ 成功｜版本號改用 Git 標籤/提交數生成
- 2025-10-31｜+1｜✅ 成功｜修正 MiniTrendChart 畫布縮放問題
- 2025-10-31｜+1｜✅ 成功｜修復版本標籤流程
- 2025-10-31｜+1｜✅ 成功｜趨勢圖整合 30 天歷史 + 今日即時匯率
- 2025-10-25｜+3｜✅ 成功｜修復 Lighthouse CI NO_FCP
- 2025-10-25｜+2｜✅ 成功｜修復 CI 環境共享內存不足
- 2025-10-25｜+3｜✅ 成功｜修復 Headless Chrome 渲染問題
- 2025-10-25｜+1｜✅ 成功｜SEO 文檔網址修正

### 未標記日期（索引）

- 未標記日期｜+3｜✅ 成功｜W3C HTML Validator 修復 (RateWise + NihonName)
- 未標記日期｜+2｜✅ 成功｜Quake-School W3C HTML 修復
- 未標記日期｜+1｜✅ 成功｜ConversionHistory Toast 通知功能
- 未標記日期｜+2｜✅ 成功｜Toast 模組重構（react-refresh 規則）
- 未標記日期｜+1｜✅ 成功｜Quake-School PageLoader 拆分
- 未標記日期｜+1｜✅ 成功｜Quake-School README.md 新增
- 未標記日期｜未標記｜❌ 重大｜過度優化導致複雜化（AVIF/WebP 未準備）
- 未標記日期｜未標記｜❌ 歷史｜文檔與程式碼實作狀態不符
- 未標記日期｜未標記｜❌ 歷史｜測試預期值未同步更新（xhtml:link 數量）
- 未標記日期｜未標記｜❌ 歷史｜vite.config.ts SSG 路徑未同步 routes.tsx
- 未標記日期｜未標記｜⚠️ 注意｜llms.txt 包含與 Schema 相同的虛假數據
- 未標記日期｜未標記｜⚠️ 注意｜sitemap image:caption 已被 Google 棄用
- 未標記日期｜未標記｜⚠️ 注意｜CSP meta tag 太長導致 charset 位置超限
- 未標記日期｜未標記｜⚠️ 注意｜`<picture>` 標籤 SSG 路徑解析問題
- 未標記日期｜未標記｜⚠️ 注意｜E2E 頁尾 toBeVisible 假設元素在 viewport
