# RateWise E2E 測試指南

**建立時間**：2025-10-15T23:44:01+08:00

## 快速開始

### 1. 安裝依賴

```bash
# 在專案根目錄執行
pnpm install

# 安裝 Playwright 瀏覽器（首次執行）
pnpm --filter @app/ratewise exec playwright install
```

### 2. 執行測試

```bash
# 執行所有測試（headless 模式）
pnpm --filter @app/ratewise test:e2e

# 執行測試（UI 模式，推薦用於開發）
pnpm --filter @app/ratewise test:e2e:ui

# 執行測試（headed 模式，可看到瀏覽器）
pnpm --filter @app/ratewise test:e2e:headed

# 查看測試報告
pnpm --filter @app/ratewise test:e2e:report
```

### 3. 執行特定測試

```bash
# 僅執行核心流程測試
pnpm --filter @app/ratewise exec playwright test ratewise.spec.ts

# 僅執行無障礙性測試
pnpm --filter @app/ratewise exec playwright test accessibility.spec.ts

# 僅執行特定瀏覽器
pnpm --filter @app/ratewise exec playwright test --project=chromium-desktop
```

---

## 測試結構

```
tests/e2e/
├── README.md                  # 本文件
├── ratewise.spec.ts          # 核心功能測試
└── accessibility.spec.ts     # 無障礙性測試
```

---

## 測試矩陣

| 瀏覽器   | 裝置    | 視窗尺寸 | Project 名稱       |
| -------- | ------- | -------- | ------------------ |
| Chromium | Desktop | 1440×900 | `chromium-desktop` |
| Chromium | Mobile  | 375×667  | `chromium-mobile`  |
| Firefox  | Desktop | 1440×900 | `firefox-desktop`  |
| Firefox  | Mobile  | 375×667  | `firefox-mobile`   |

---

## 測試覆蓋範圍

### ratewise.spec.ts（核心功能）

- ✅ 首頁載入與基本元素
- ✅ 單幣別換算流程
- ✅ 貨幣交換功能
- ✅ 多幣別模式切換與換算
- ✅ 我的最愛功能
- ✅ 響應式設計（行動版點擊目標尺寸）
- ✅ 效能檢查（DOMContentLoaded ≤ 3 秒）
- ✅ 錯誤處理（網路錯誤降級 UI）
- ✅ 視覺穩定性（CLS 檢查）

### accessibility.spec.ts（無障礙性）

- ✅ WCAG 2.1 AA 標準掃描（使用 Axe-core）
- ✅ 表單元素標籤檢查
- ✅ 按鈕可識別名稱檢查
- ✅ 顏色對比度檢查
- ✅ 互動元素尺寸檢查（≥ 24×24px）
- ✅ 語義化 HTML 結構檢查
- ✅ 鍵盤導航檢查
- ✅ ARIA 屬性檢查

---

## CI/CD 整合

測試已整合至 GitHub Actions，每次 PR 與 main 分支推送時自動執行。

**工作流檔案**：`.github/workflows/lighthouse-ci.yml`

**報告產出**：

- HTML 測試報告：上傳至 GitHub Actions 工件
- Trace 檔案：僅在失敗時保留
- 截圖與影片：僅在失敗時保留

---

## 故障排除

### 問題：Playwright 瀏覽器未安裝

**錯誤訊息**：

```
Error: browserType.launch: Executable doesn't exist at ...
```

**解決方法**：

```bash
pnpm --filter @app/ratewise exec playwright install
```

---

### 問題：測試超時

**錯誤訊息**：

```
Error: Test timeout of 30000ms exceeded.
```

**解決方法**：

1. 確認應用程式正在執行（`pnpm --filter @app/ratewise preview`）
2. 檢查網路連線（測試需要載入匯率資料）
3. 增加超時時間（在 `playwright.config.ts` 中調整 `timeout`）

---

### 問題：無障礙性測試失敗

**錯誤訊息**：

```
expect(criticalViolations).toHaveLength(0)
```

**解決方法**：

1. 查看測試輸出，識別違規項目
2. 參考 `docs/dev/UX_AUDIT_REPORT.md` 的修復建議
3. 修復後重新執行測試

---

## 參考資源

- [Playwright 官方文件](https://playwright.dev/docs/intro)
- [Playwright 測試配置](https://playwright.dev/docs/test-configuration)
- [Axe-core Playwright 整合](https://playwright.dev/docs/accessibility-testing)
- [WCAG 2.1 快速參考](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 下一步

1. **執行測試**：`pnpm --filter @app/ratewise test:e2e:ui`
2. **查看報告**：識別失敗的測試案例
3. **修復問題**：參考 `docs/dev/UX_AUDIT_REPORT.md`
4. **重新測試**：確認修復有效
5. **提交 PR**：測試通過後提交變更

---

**維護者**：@s123104  
**最後更新**：2025-10-15T23:44:01+08:00
