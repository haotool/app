# 開發獎懲與決策記錄 (2025)

> **最後更新**: 2025-11-23T04:04:22+08:00
> **當前總分**: 100 (初始分: 100)
> **目標**: >120 (優秀) | <80 (警示)

---

## 評分標準

- **+1**: 正確使用 Context7 引用文檔解決問題
- **+1**: 發現並修復潛在 bug (非當前任務造成的)
- **+2**: 重大架構改進或性能提升 (>20%)
- **+3**: 解決複雜的系統性問題 (Root Cause Fix)
- **-1**: 引入新 bug (CI 失敗)
- **-1**: 違反 Linus 三問 (過度設計)
- **-2**: 破壞現有功能 (Regression)
- **-3**: 造成生產環境停機

---

## 記錄表

| 類型    | 摘要                                       | 採取行動                                                                                                                             | 依據                                                                                  | 分數 | 時間       |
| ------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ---- | ---------- |
| ✅ 成功 | 金額輸入框補 data-testid，穩定 E2E 定位    | 在 SingleConverter 金額輸入加 `data-testid=\"amount-input\"`，E2E/ARIA 測試改用 getByTestId 取代 placeholder 依賴                    | [context7:microsoft/playwright:2025-11-22]                                            | +1   | 2025-11-23 |
| ✅ 成功 | 修復 PWA Manifest 重複注入                 | 移除 `index.html` 中手動注入的 link，解決 E2E 測試 Strict Mode Violation                                                             | [Vite PWA Plugin Docs]                                                                | +2   | 2025-11-23 |
| ✅ 成功 | 修復 CI/CD 端口不一致與 Lighthouse CI 錯誤 | 1. 統一 Playwright/Lighthouse 端口為 4173<br>2. 使用 `--strictPort` 確保環境確定性<br>3. 優化 Lighthouse ready pattern 為 `"Local:"` | [context7:vitejs/vite:2025-11-23]<br>[context7:googlechrome/lighthouse-ci:2025-11-22] | +5   | 2025-11-23 |
| ❌ 失敗 | E2E 測試端口衝突導致 CI 失敗               | 發現 `tests/e2e/calculator-fix-verification.spec.ts` 硬編碼錯誤端口 4174，與系統配置 4173 不符                                       | [Log Analysis: Run 19599046780]                                                       | -2   | 2025-11-23 |
| ✅ 成功 | 修復 Playwright Client 端硬編碼端口問題    | 移除測試文件中的硬編碼 BASE_URL，改用 `page.goto('/')` 自動適配 `playwright.config.ts`                                               | [Playwright Docs: baseURL]                                                            | +2   | 2025-11-23 |
| ✅ 成功 | 修復 Vite Preview Server 端口隨機性        | 在 CI 流程中加入 `--strictPort`，防止端口 4173 被佔用時自動遞增導致測試失敗                                                          | [context7:vitejs/vite:2025-11-23]                                                     | +2   | 2025-11-23 |
| ✅ 成功 | 修復 Lighthouse CI NO_FCP                  | 恢復 `index.html` 靜態載入指示器，解決 React SPA 在 CI 環境下 FCP 超時問題                                                           | [GoogleChrome/lighthouse-ci#196]                                                      | +3   | 2025-10-25 |
| ✅ 成功 | 修復 CI 環境共享內存不足                   | 為 Chrome 添加 `--disable-dev-shm-usage` flag                                                                                        | [GoogleChrome/lighthouse-ci#766]                                                      | +2   | 2025-10-25 |
| ✅ 成功 | 修復 Headless Chrome 渲染問題              | 安裝 `xvfb` 並使用 `xvfb-run` 執行 Lighthouse CI                                                                                     | [GoogleChrome/lighthouse-ci#398]                                                      | +3   | 2025-10-25 |
| ✅ 成功 | SEO 文檔網址修正                           | 全局替換錯誤的 `ratewise.app` 為 `app.haotool.org/ratewise`                                                                          | [Manual Verification]                                                                 | +1   | 2025-10-25 |
| ❌ 失敗 | CI 端口配置漂移                            | 發現 Lighthouse CI 與 Playwright 使用不同端口 (4174 vs 4173)，導致配置漂移                                                           | [Self Audit]                                                                          | -1   | 2025-11-23 |

---

## 待追蹤事項 (若總分 < 80)

- [ ] 目前分數健康 (99 分)，持續保持。
- [ ] 下一步重點：監控 CI 穩定性，確保無 Flaky tests。
