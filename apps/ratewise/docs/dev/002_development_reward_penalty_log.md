# 開發獎懲記錄

**版本**: 1.5.0
**建立時間**: 2025-12-02T03:29:33+08:00
**更新時間**: 2025-12-13T14:39:00+08:00
**狀態**: ✅ 完成
**當前總分**: +27

| 類型    | 摘要                                    | 採取行動                                                                                                                                                | 依據                                                                         | 分數 |
| ------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---- |
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

---

## 歷史錯誤模式警告（防止重蹈覆轍）

| 類型    | 摘要                                     | 教訓                                             |
| ------- | ---------------------------------------- | ------------------------------------------------ |
| ❌ 歷史 | CSP strict-dynamic 導致生產環境失效      | SSG 無法生成 nonce，避免使用 strict-dynamic      |
| ❌ 歷史 | 文檔與程式碼實作狀態不符                 | 每次修改必須逐一驗證實際檔案                     |
| ❌ 歷史 | 測試預期值未同步更新（xhtml:link 數量）  | 新增路由後必須同步更新相關測試                   |
| ❌ 歷史 | vite.config.ts SSG 路徑未同步 routes.tsx | 新增路由後必須同步更新 ssgOptions.includedRoutes |

---

備註：MCP fetch 工具現已可用，本次使用 context7 MCP + fetch MCP 取得權威來源。
