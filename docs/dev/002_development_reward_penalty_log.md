# 002 開發獎懲記錄 LOG

**版本**: 1.6.0 (單幣別千分位與交叉匯率完善)
**建立時間**: 2025-10-31T03:06:28+0800
**更新時間**: 2025-11-05T09:06:00+0800
**狀態**: 🔄 進行中

---

## 流程守則

1. 遇到錯誤或不確定的決策時，必須先透過 Context7 查閱官方文件或權威來源，確認最佳實踐後再實作修正。[context7:changesets/action:2025-10-30T19:04:00Z]
2. 成功與失敗皆需紀錄，包含時間、摘要、引用來源與採取的行動。
3. 每次更新須調整分數，提醒後續 Agent 避免重複犯錯。
4. 本表為長期維運項，不得刪除。

---

## 本次紀錄（2025-10-31）

| 類型    | 摘要                                                                                   | 採取行動                                                                                       | 依據                                                                    | 分數 |
| ------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---- |
| ✅ 成功 | 趨勢圖整合 30 天歷史 + 今日即時匯率                                                    | `SingleConverter.tsx` 追加 `fetchLatestRates()`，並更新測試驗證                                | `docs/dev/001_exchange_rate_data_strategy.md`                           | +1   |
| ✅ 成功 | 修復版本標籤流程，統一由 `release.yml` 建立標籤與 GitHub Release                       | `changesets` 官方建議 + workflow 改寫                                                          | [context7:changesets/changesets:2025-10-30T19:04:30Z]                   | +1   |
| ⚠️ 注意 | `pnpm changeset tag` 會自動建立 `@app/ratewise@version` 標籤，若重複執行需先刪除舊標籤 | 文件化操作步驟，避免 pipeline 二度建立相同標籤                                                 | [context7:changesets/changesets:2025-10-30T19:04:30Z]                   | 0    |
| ✅ 成功 | 修正 MiniTrendChart 畫布縮放造成線條粗細跳動                                           | 移除 scale 動畫，僅保留位移漸進，維持像素對齊                                                  | [context7:tradingview/lightweight-charts:2025-10-31T03:05:00Z]          | +1   |
| ✅ 成功 | 版本號改用 Git 標籤/提交數生成，避免永遠停留在 1.0.0                                   | `vite.config.ts` 導入 `git describe` 與 commit count fallback                                  | [context7:git/git:2025-10-31T03:07:00Z]                                 | +1   |
| ✅ 成功 | 即時匯率即使數據未變也會刷新 UI 更新時間                                               | `useExchangeRates` 新增 `lastFetchedAt` 與 UI 雙時間標示                                       | `docs/dev/001_exchange_rate_data_strategy.md`                           | +1   |
| ✅ 成功 | 時間格式化邏輯重構（52行→5行，-90.4%）                                                 | 提取為獨立工具函數 `utils/timeFormatter.ts`，建立 21 個測試案例                                | [Linus KISS principle] + `docs/dev/003_ui_transparency_improvements.md` | +1   |
| ✅ 成功 | 版本生成邏輯簡化（nested try-catch → nullish coalescing）                              | 分離為 3 個獨立函數，使用 `??` 運算符串接 fallback 策略                                        | [TC39: Nullish Coalescing] + Linus 好品味原則                           | +1   |
| ✅ 成功 | 修正 `toLocaleTimeString` 使用錯誤（12小時制 → 24小時制）                              | 新增 `hour12: false` 參數，避免「上午」前綴                                                    | [MDN: toLocaleTimeString] + 測試驅動修復                                | +1   |
| ✅ 成功 | 新增前端刷新時間追蹤（lastFetchedAt），提升 UI 透明度                                  | 在 `useExchangeRates` hook 中記錄前端實際刷新時間                                              | `docs/dev/001_exchange_rate_data_strategy.md`                           | +1   |
| ✅ 成功 | 建立 4 項強制規範文檔（編號規則、獎懲流程、Context7、Linus三問）                       | 更新 `CLAUDE.md` 與 `AGENTS.md`，確保所有 Agent 遵守流程                                       | Linus 三問 + Context7 優先原則                                          | +1   |
| ✅ 成功 | 修復生產環境404錯誤（動態探測+Fallback機制）                                           | 實作 `detectAvailableDateRange()` 與 `fetchHistoricalRatesWithFallback()`，消除硬編碼30天限制  | `docs/dev/004_pwa_realtime_sync_architecture.md` + Linus 好品味原則     | +1   |
| ✅ 成功 | 趨勢圖數據整合優化（歷史+即時+排序）                                                   | 改進 `SingleConverter.tsx` 數據合併邏輯，確保時間順序正確                                      | `docs/dev/004_pwa_realtime_sync_architecture.md`                        | +1   |
| ✅ 成功 | 實作即期/現金匯率切換UI（用戶偏好持久化）                                              | 新增 `RateType` 狀態管理 + localStorage 持久化 + 切換按鈕UI                                    | `docs/dev/004_pwa_realtime_sync_architecture.md` + YAGNI 原則           | +1   |
| ✅ 成功 | 貨幣格式化增強（使用 Intl.NumberFormat API，零依賴）                                   | 建立 `currencyFormatter.ts` 工具，使用瀏覽器原生 API 處理千位分隔符和小數位數                  | `docs/dev/005_currency_formatting_enhancement.md` + [ISO 4217 標準]     | +1   |
| ✅ 成功 | UI 優化（切換按鈕置中 + 專業格式化顯示）                                               | 調整按鈕位置至 `top-2 left-1/2 -translate-x-1/2`，應用匯率格式化到所有顯示                     | `docs/dev/005_currency_formatting_enhancement.md` + UX 最佳實踐         | +1   |
| ✅ 成功 | 千位分隔符修正與 ISO 4217 全面對齊                                                     | 修正所有顯示層的千位分隔符，確保全部對齊 ISO 4217 標準                                         | [context7:mdn/intl-numberformat:2025-11-05]                             | +1   |
| ✅ 成功 | UI 佈局優化（切換按鈕與匯率顯示整合）                                                  | 調整單幣別匯率卡片 padding（pt-10 pb-5），確保切換按鈕與匯率顯示不重疊                         | UX 最佳實踐 + UI/UX 設計原則                                            | +1   |
| ✅ 成功 | 瀏覽器端完整測試驗證                                                                   | 完成單幣別與多幣別所有功能的瀏覽器測試，確認格式化、UI 佈局與全局切換功能正確                  | 品質保證流程 + E2E 測試                                                 | +1   |
| ✅ 成功 | ISO 4217 深度修正（TWD 小數位數從 0 改為 2）                                           | 根據用戶深度驗證回饋，修正 TWD 小數位數為 2 位，符合 ISO 4217 標準與實務慣例                   | [ISO 4217 標準](https://zh.wikipedia.org/wiki/ISO_4217)                 | +1   |
| ✅ 成功 | UI 配色融合優化（按鈕容器使用藍紫漸層 + 玻璃擬態）                                     | 將按鈕容器從 `bg-white/80` 改為 `from-blue-50/95 to-purple-50/95`，與背景完美融合              | 現代 UI 設計最佳實踐 + 玻璃擬態設計 (Glassmorphism)                     | +1   |
| ✅ 成功 | 模式切換按鈕現代化設計（降低高度 + 專業圖標 + 藍紫漸層）                               | 從通用圖標改為專業貨幣圖標，高度從 40px 降至 30px，添加玻璃擬態效果                            | Heroicons 圖標庫 + 現代 UI 最佳實踐                                     | +1   |
| ✅ 成功 | 匯率文字漸層方向修正（紫→藍 改為 藍→紫）                                               | 修正 `from-purple-600 to-blue-600` 為 `from-blue-600 to-purple-600`，與主色調一致              | 品牌一致性 + 視覺協調                                                   | +1   |
| ✅ 成功 | 輸入框編輯功能完全重構（雙狀態系統 + 編輯/顯示模式分離）                               | 使用 `useState` 追蹤編輯狀態，`onFocus` 顯示原始值，`onBlur` 格式化，完美解決 cursor 問題      | React 受控輸入最佳實踐 + UX 最佳化                                      | +2   |
| ✅ 成功 | 鍵盤輸入限制（只允許數字和導航鍵）                                                     | `onKeyDown` 限制只能輸入數字、小數點、導航鍵和組合鍵，禁止字母和特殊符號                       | 輸入驗證最佳實踐 + 用戶體驗優化                                         | +1   |
| ✅ 成功 | LOGO 品牌識別強化（響應式設計）                                                        | 在標題處添加 300x300 高清 LOGO，響應式大小（48px/64px），與標題完美對齊                        | 品牌 UI 設計最佳實踐 + Tailwind 響應式類                                | +1   |
| ✅ 成功 | 匯率顯示邏輯統一（基準貨幣修正）                                                       | 修正多幣別基準貨幣顯示「計算中...」問題，改為「基準貨幣」，統一匯率格式為 4 位小數             | 資料展示邏輯 + formatExchangeRate 統一格式化                            | +1   |
| ✅ 成功 | 收藏星星佈局穩定性修正（防止佈局跳動）                                                 | 使用 Tailwind `group` + `opacity-0` 技巧，星星始終占據空間，懸停時透明星星顯示                 | Tailwind CSS Group Hover + 佈局穩定性最佳實踐                           | +1   |
| ✅ 成功 | 基準貨幣快速切換功能（點擊貨幣行切換）                                                 | 實作 `onBaseCurrencyChange` 傳遞至 `MultiConverter`，為貨幣行添加 `onClick` 處理器             | React 事件處理最佳實踐 + 狀態管理模式                                   | +1   |
| ✅ 成功 | 基準貨幣視覺標示（紫色邊框 + 游標樣式）                                                | 基準貨幣以 `border-purple-400` 標示，並設為 `cursor-default` 防止誤點                          | UI 視覺回饋設計 + 用戶體驗優化                                          | +1   |
| ✅ 成功 | 匯率顯示邏輯分離（基準貨幣 UI 層判斷）                                                 | 將基準貨幣檢查從 `getRateDisplay` 移至 JSX 層，確保基準貨幣永遠顯示「基準貨幣」                | 關注點分離原則 + 單一職責原則                                           | +1   |
| ✅ 成功 | 多幣別輸入恢復即時換算且保留缺資料提示                                                 | `MultiConverter` 在 `onChange` 時即呼叫 `onAmountChange`，`formatAmountDisplay` 保留非數字字串 | [context7:reactjs/react.dev:2025-11-05T02:47:00Z]                       | +1   |
| ✅ 成功 | 修復 Changesets changelog GitHub token 錯誤（改用 git-based）                          | 修改 `.changeset/config.json` 使用 `@changesets/changelog-git` 替代 GitHub 版本                | [context7:changesets/changesets:2025-11-05]                             | +1   |
| ✅ 成功 | 版本號自動更新機制修復（1.0.0 → 1.1.0）                                                | 執行 `pnpm changeset version` 生成 CHANGELOG 並更新 package.json                               | [context7:changesets/changesets:2025-11-05]                             | +1   |
| ✅ 成功 | 測試修復（格式化值斷言更新）                                                           | 更新測試期望值以匹配千分位格式化後的字串（如 "5,000.00"）                                      | [CLAUDE.md] 測試最佳實踐                                                | +1   |
| ✅ 成功 | Skeleton 測試簡化（移除 snapshot）                                                     | 根據 Linus 哲學移除過度複雜的 snapshot 測試，改用直接驗證                                      | [LINUS_GUIDE.md] 簡單優於複雜                                           | +1   |
| ✅ 成功 | 透過 gh api 將最新 PWA 分支合併至 main                                                 | 使用 GitHub REST merges API 將 `claude/pwa-cache-update-fix-011CUpBYj7U4dCEoX6VpttQE` 合併至 main | [context7:github_en_rest:2025-11-05T16:30:21+08:00]                     | +1   |
| ✅ 成功 | Docker 建置自動注入 Git 資訊並修正 PWA start_url 指向 `/ratewise`                       | 增加 `VITE_BASE_PATH=/ratewise/` 預設並於 builder 安裝 `git`，確保版本號與 PWA 安裝入口正確     | [ref:mdn-start_url:2025-11-05]; [ref:w3c-appmanifest:2025-11-05]; [ref:web.dev-pwa-update:2025-11-05] | +1   |
| ✅ 成功 | Husky pre-commit UTF-8 支援                                                             | 將 pre-commit 改用 `pnpm lint-staged` 並設定 `LANG/LC_ALL=zh_TW.UTF-8`，解決繁體中文訊息亂碼問題 | Husky 官方文件 + lint-staged CLI 行為（2025-11-05 實測）                | +1   |
| ✅ 成功 | Nginx ratewise 符號連結避免 404                                                         | Dockerfile 建立 `ratewise -> /usr/share/nginx/html` 符號連結，確保 `/ratewise/assets/*` 可正常提供 | Nginx 官方子路徑部署指引 + 實測（2025-11-05）                          | +1   |

**當前總分**: +44

---

## 待追蹤事項

- 未來每次出現錯誤都需新增紀錄，並更新總分。
- 建議在 Release PR flow 中加入 Changeset 檢查，避免忘記撰寫。
- 4 項強制規範已加入 CLAUDE.md 與 AGENTS.md（2025-10-31），需持續監控遵守情況。

| ✅ 成功 | 單幣別輸入框千分位修復（編輯狀態管理統一） | 與 MultiConverter 統一架構，實現千分位顯示 | [context7:react/hooks:2025-11-05] | +1 |
| ✅ 成功 | 多幣別交叉匯率計算完善（支援任意基準貨幣） | 實現 TWD 反向計算與交叉匯率邏輯 | [context7:typescript/math:2025-11-05] | +2 |
| ✅ 成功 | API 文檔與 25 個單元測試（006_exchange_rate_calculation_api.md） | 完整匯率計算邏輯文檔與測試覆蓋 | [context7:vitest/docs:2025-11-05] | +2 |
