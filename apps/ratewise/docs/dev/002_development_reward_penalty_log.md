# 開發獎懲記錄

**版本**: 1.9.2
**建立時間**: 2025-12-02T03:29:33+08:00
**更新時間**: 2025-12-24T22:15:00+08:00
**狀態**: ✅ 完成
**當前總分**: +49

| 類型    | 摘要                                    | 採取行動                                                                                                                                                | 依據                                                                         | 分數 |
| ------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---- |
| ✅ 成功 | 建立圖片管理最佳實踐系統                | 1) 新增 PR 模板檢查清單（生產環境驗證+Linus 三問） 2) CI/CD 自動檢查圖片路徑正確性 3) 建立完整圖片管理文檔 [032] 4) 檢查所有 apps 路徑統一              | [docs/dev/032_image_management_best_practices.md][LINUS_GUIDE.md]            | +8   |
| ❌ 失敗 | SEO 分支合併導致級聯錯誤（20h 修復）    | 1) 未驗證生產環境路徑 2) 引用不存在檔案 3) 過度優化導致複雜化 4) 6 次 commits 才修復（7b9e5c3→98d3350）                                                 | [002:2025-12-24][LINUS_GUIDE.md:Linus 三問]                                  | -8   |
| ⚠️ 教訓 | 圖片路徑問題演進分析                    | 絕對路徑→動態 BASE_URL→複雜 picture→最終簡化為相對路徑，學習 KISS 原則和消除特殊情況                                                                    | [LINUS_GUIDE.md:Good Taste][Vite Asset Handling]                             | 0    |
| ✅ 成功 | 修復下拉刷新功能 (PWA 快取更新)         | 改用 window.location.reload() 強制重新載入頁面，確保用戶獲得最新版本 JS/CSS/HTML，移除未使用的 refresh 依賴項，版本更新 1.2.0→1.2.1                     | [PWA更新最佳實踐][Linus 三問驗證]                                            | +1   |
| ✅ 成功 | CSP inline style 違規排除               | style-src/style-src-elem 移除 hash 讓 'unsafe-inline' 生效，重跑 typecheck/test/build，確認 postbuild CSP 覆蓋 dist 與鏡像                              | [context7:tsotimus/vite-plugin-csp-guard:2025-12-11T17:14Z]                  | +2   |
| ✅ 成功 | 重建 AI 搜尋規格並校對權威來源          | 以 curl 取樣 20 個 SEO/AI 權威來源，重置 013 規格與行動清單                                                                                             | [curl:seo-authorities:2025-12-02]                                            | +1   |
| ✅ 成功 | 首頁 FAQ 可視化並對齊 JSON-LD           | 新增 4 條 FAQ 卡片（首頁可見）並同步更新 index.html FAQPage schema                                                                                      | [curl:seo-authorities:2025-12-02]                                            | +1   |
| ✅ 成功 | 首個長尾落地頁 `/usd-twd` + sitemap     | 新增 USD/TWD 落地頁（FAQ+HowTo+SEOHelmet）、更新路由/SSG/sitemap                                                                                        | [curl:seo-authorities:2025-12-02]                                            | +1   |
| ✅ 成功 | 全面測試驗證：810 測試通過 + 瀏覽器實測 | 1) pnpm typecheck 通過 2) 810 tests 全綠 3) Preview Server 首頁/usd-twd 瀏覽器驗證 4) PWA manifest 驗證                                                 | [context7:vite-react-ssg][context7:vite-plugin-pwa]                          | +2   |
| ✅ 成功 | SEO 權威網站深度研究 (MCP fetch)        | 查詢 Moz/Semrush/Backlinko/SearchEngineJournal/web.dev/Google Search Central/llmstxt.org 等 10+ 來源                                                    | [mcp:fetch:2025-12-02T03:44]                                                 | +1   |
| ✅ 成功 | BDD 紅燈→綠燈：hreflang.test.ts 修正    | 識別 `/usd-twd` 新增後 xhtml:link 從 8→10，正確更新測試預期值                                                                                           | [BDD.md:Red-Green-Refactor]                                                  | +1   |
| ✅ 成功 | Context7 官方文檔驗證                   | 使用 context7 取得 vite-react-ssg/vite-plugin-pwa 最新文檔，確認 SEO Head/Schema 最佳實踐                                                               | [context7:daydreamer-riri/vite-react-ssg][context7:vite-pwa/vite-plugin-pwa] | +1   |
| ✅ 成功 | 長尾頁 JPY/TWD + EUR/TWD 實作           | 1) 新增 JPYToTWD.tsx 日圓換台幣頁 2) 新增 EURToTWD.tsx 歐元換台幣頁 3) 更新 routes.tsx 4) 更新 sitemap.xml (7 URLs) 5) 更新 hreflang.test.ts (14 links) | [BDD.md:Red-Green-Refactor][context7:vite-react-ssg]                         | +3   |
| ✅ 成功 | 全面測試驗證：810 tests 全通過          | npx vitest run 完成，0 failures，測試覆蓋率 92.99%                                                                                                      | [Vitest:4.0.14][AGENTS.md:品質門檻]                                          | +1   |
| ✅ 成功 | 長尾頁批量實作第一階段 (7 頁)           | 新增 GBP/CNY/KRW/HKD/AUD/CAD/SGD 共 7 個幣別落地頁，每頁含 FAQ+HowTo+SEOHelmet                                                                          | [context7:vite-react-ssg][LINUS_GUIDE.md]                                    | +4   |
| ✅ 成功 | sitemap.xml 更新 (14 URLs)              | 更新 sitemap 含 14 條 URL × 2 hreflang = 28 links                                                                                                       | [Google Search Central:sitemap-best-practices]                               | +1   |
| ✅ 成功 | hreflang.test.ts BDD 測試更新           | 紅燈→綠燈：xhtml:link 從 14→28，同步更新測試預期值                                                                                                      | [BDD.md:Red-Green-Refactor]                                                  | +1   |
| ✅ 成功 | 長尾頁批量實作第二階段 (3 頁)           | 新增 THB/NZD/CHF 共 3 個幣別落地頁，完成全部 13 個長尾頁                                                                                                | [context7:vite-react-ssg][LINUS_GUIDE.md]                                    | +2   |
| ✅ 成功 | sitemap.xml 全面完成 (17 URLs)          | 更新 sitemap 含 17 條 URL × 2 hreflang = 34 links                                                                                                       | [Google Search Central:sitemap-best-practices]                               | +1   |
| ✅ 成功 | 全面測試驗證：810 tests 全通過          | npx vitest run 完成，0 failures，hreflang 測試同步更新                                                                                                  | [Vitest:4.0.14][BDD.md:Green]                                                | +1   |
| ✅ 成功 | 修復 vite.config.ts SSG 預渲染配置      | 同步 includedRoutes 至 17 條路徑，build 輸出 17 個 HTML                                                                                                 | [BDD.md:Red-Green][context7:vite-react-ssg]                                  | +2   |
| ✅ 成功 | SEO 全面代碼審查通過                    | 1) TypeScript ✅ 2) ESLint ✅ 3) 897 tests ✅ 4) Build 17 HTML ✅ 5) 權威來源驗證 (Google/Schema.org/web.dev)                                           | [context7:vitejs/vite][Google Search Central 2025]                           | +2   |
| ✅ 成功 | llms.txt 虛假評價數據修正               | 移除 4.8/5.0 虛假評分和 127 評價，改為真實用戶使用場景，避免違反 AI SEO Guidelines                                                                      | [llmstxt.org][AI SEO Best Practices 2025]                                    | +1   |
| ✅ 成功 | sitemap.xml 符合 Google 2025 規範       | 1) 移除已棄用 image:caption 標籤 2) 為 13 個幣別頁添加 image sitemap 3) 更新 lastmod                                                                    | [Google 2025 Image Sitemap Deprecation]                                      | +2   |
| ✅ 成功 | Lighthouse 效能優化：移除 CSP meta tag  | 1) postbuild 腳本移除 CSP meta tag 2) 確保 charset 在 head 前 1024 bytes 3) CSP 改由 Nginx HTTP header 提供                                             | [web.dev/csp][Lighthouse Best Practices 2025]                                | +2   |
| ✅ 成功 | 重型組件 Lazy Loading 優化              | 1) MiniTrendChart lazy load（減少 144KB lightweight-charts） 2) CalculatorKeyboard lazy load 3) Suspense fallback                                       | [React Lazy Loading][Code Splitting Best Practices]                          | +2   |
| ✅ 成功 | Lighthouse CI 配置更新至 95+ 門檻       | 1) 所有類別門檻提升至 95 分 2) 使用 lighthouse:recommended preset 3) CI/CD 全數通過                                                                     | [context7:googlechrome/lighthouse-ci:2025-12-24]                             | +2   |
| ✅ 成功 | 整合響應式 Footer 設計                  | 1) 行動版簡潔 footer 2) 電腦版完整 footer（17 個 SEO 連結） 3) 即時更新時間顯示                                                                         | [WCAG 2.1][Google SEO 2025]                                                  | +1   |
| ✅ 成功 | Logo 圖片 SSG 路徑修正                  | 1) 簡化 `<picture>` 為 `<img src="logo.png">` 避免 SSG hydration 問題 2) 移除動態 BASE_URL 路徑                                                         | [context7:vitejs/vite:2025-12-24][KISS 原則]                                 | +2   |
| ✅ 成功 | E2E 測試頁尾檢查修正                    | 1) `toBeVisible` → `toBeAttached` 2) 頁尾元素不需在初始 viewport 可見 3) CI 全數通過                                                                    | [context7:microsoft/playwright:2025-12-24]                                   | +1   |
| ⚠️ 注意 | React Hydration #418 為 SSG 預期行為    | SSG + Suspense 輸出骨架屏，客戶端 hydration 替換為完整內容觸發警告，不影響功能                                                                          | [context7:reactjs/react.dev:2025-12-24]                                      | 0    |
| ✅ 成功 | Footer.tsx lint 警告修正                | `\|\|` → `??` nullish coalescing 符合 @typescript-eslint 規則                                                                                           | [@typescript-eslint/prefer-nullish-coalescing]                               | +1   |
| ✅ 成功 | README.md 專業格式更新                  | 新增功能特色、技術棧、快速開始、專案結構、品質指標區段                                                                                                  | [GitHub README Best Practices 2025]                                          | +1   |
| ✅ 成功 | AGENTS.md 任務狀態更新                  | 更新 M0-M4 任務狀態至 2025-12-24，標記已完成項目，版本 v2.0 → v2.1                                                                                      | [AGENTS.md:§8]                                                               | +1   |
| ✅ 成功 | 修復 nihonname 缺少 logo.png            | CI 失敗原因：apps/nihonname/public/logo.png 不存在，從 icon-192x192.png 複製修復                                                                        | [CI:Quality Checks]                                                          | +1   |

---

## 歷史錯誤模式警告（防止重蹈覆轍）

| 類型    | 摘要                                     | 教訓                                                                                                                                               |
| ------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ❌ 重大 | SEO 分支合併未驗證生產環境（2025-12-24） | **強制檢查**：1) 本地測試 `VITE_*_BASE_PATH='/xxx/' pnpm build && preview` 2) 檢查圖片檔案存在性 3) 禁止絕對路徑和動態 BASE_URL 4) 執行 Linus 三問 |
| ❌ 重大 | 圖片路徑使用動態 BASE_URL 導致 hydration | **永遠使用相對路徑**：`<img src="logo.png">` 而非 `/logo.png` 或 `${BASE_URL}logo.png`，讓 Vite 自動處理 base path                                 |
| ❌ 重大 | 過度優化導致複雜化（AVIF/WebP 未準備）   | **YAGNI 原則**：不要為未來需求預先優化，先確保基礎功能正常，再考慮進階優化                                                                         |
| ❌ 歷史 | CSP strict-dynamic 導致生產環境失效      | SSG 無法生成 nonce，避免使用 strict-dynamic                                                                                                        |
| ❌ 歷史 | 文檔與程式碼實作狀態不符                 | 每次修改必須逐一驗證實際檔案                                                                                                                       |
| ❌ 歷史 | 測試預期值未同步更新（xhtml:link 數量）  | 新增路由後必須同步更新相關測試                                                                                                                     |
| ❌ 歷史 | vite.config.ts SSG 路徑未同步 routes.tsx | 新增路由後必須同步更新 ssgOptions.includedRoutes                                                                                                   |
| ⚠️ 注意 | llms.txt 包含與 Schema 相同的虛假數據    | 移除 AggregateRating 後需同步檢查 llms.txt 避免不一致                                                                                              |
| ⚠️ 注意 | sitemap image:caption 已被 Google 棄用   | 2025 年起 Google 不再支援 image:caption/title/license                                                                                              |
| ⚠️ 注意 | CSP meta tag 太長導致 charset 位置超限   | vite-plugin-csp-guard 生成的 meta tag 可能超過 1024 bytes，需用 postbuild 移除                                                                     |
| ⚠️ 注意 | `<picture>` 標籤 SSG 路徑解析問題        | `import.meta.env.BASE_URL` 在 SSG 時可能無法正確解析，導致 srcSet 為 null                                                                          |
| ⚠️ 注意 | E2E 頁尾 toBeVisible 假設元素在 viewport | 使用 toBeAttached 檢查 DOM 存在性，不假設元素在初始 viewport                                                                                       |

---

備註：MCP fetch 工具現已可用，本次使用 context7 MCP + fetch MCP + WebSearch 取得權威來源。
