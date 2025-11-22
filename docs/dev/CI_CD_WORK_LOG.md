## 2025-11-23 CI/CD 端口與配置修復記錄

### 1. 問題：Lighthouse CI 與 Playwright 端口不一致

- **症狀**: Lighthouse CI 報錯 `CHROME_INTERSTITIAL_ERROR`，嘗試連接 4174；Playwright 測試部分失敗。
- **原因**: `.lighthouserc.json` 配置了端口 4174，但 `ci.yml` 中的 preview server 使用 `--strictPort 4173`。
- **解決**: 統一所有端口配置為 `4173`。

### 2. 問題：Playwright 客戶端硬編碼端口

- **症狀**: E2E 測試失敗，顯示 `net::ERR_CONNECTION_REFUSED` 連接 4174。
- **原因**: `tests/e2e/calculator-fix-verification.spec.ts` 硬編碼了 `http://localhost:4174`。
- **解決**: 移除硬編碼，改用 `page.goto('/')`，依賴 `playwright.config.ts` 的 `baseURL`。

### 3. 問題：Lighthouse CI Server Ready Pattern 不穩定

- **症狀**: `Runtime error encountered: The server is not ready within 120000ms`.
- **原因**: `startServerReadyPattern` 設為 `Local: http://localhost:4174/` 太過具體，容易因 IP (127.0.0.1 vs localhost) 或格式差異失敗。
- **解決**: 放寬匹配模式為 `"Local:"`。

### 4. 問題：Vite PWA Manifest 重複注入 (Strict Mode Violation)

- **症狀**: E2E 測試報錯 `Error: strict mode violation: locator('link[rel="manifest"]') resolved to 2 elements`。
- **原因**: `index.html` 中手動包含了 `<link rel="manifest" ...>`，而 `vite-plugin-pwa` 也自動注入了一個。
- **解決**: 移除 `index.html` 中的手動標籤，完全交由插件管理。

### 5. 問題：金額輸入框 locator 失配導致 E2E Timeout（2025-11-23）

- **Run ID**: 19599307173 (End-to-End)
- **症狀**: `TimeoutError: page.click: Timeout 10000ms exceeded`，locator `input[placeholder*="金額"]` 找不到元素；ARIA 測試 `input[type="number"]` 計數為 0。
- **原因**: UI 已改為 text input（無 placeholder「金額」），且非 number type；測試仍依賴舊 selector。
- **解決**:
  1. 在金額輸入框新增 `data-testid="amount-input"` 並保留 aria-label
  2. Playwright 測試改用 `getByTestId('amount-input')`，避免 placeholder/型別耦合
  3. ARIA 檢查改用同一 test id，確保有可計數的輸入框
- **狀態**: 🔄 已修正代碼，待下一輪 CI 驗證
- **依據**: [context7:microsoft/playwright:2025-11-22]（使用 data-testid 做穩定定位）

### 待觀察：E2E Timeout Error（舊）

- **症狀**: `TimeoutError: page.click: Timeout 10000ms exceeded` (waiting for input)。
- **分析**: 可能是頁面加載緩慢或 React Hydration 失敗。
- **行動**: 先修復 Manifest 重複問題，若 Timeout 持續，需在 CI 中啟用 Console Log 進行除錯。

---
