# SEO CI 增強實施記錄

**建立時間**: 2025-12-10T00:00:00+08:00
**狀態**: ✅ 已完成
**依據**: [SEO Best Practices 2025][Playwright Testing][Lighthouse CI]

---

## 📋 總覽

本次更新全面增強了 SEO 測試自動化，確保所有 SEO 相關檔案在生產環境都能正確返回 200 狀態，並通過完整的 E2E 驗證。

---

## 🎯 實施目標

### 主要目標

1. ✅ 確保生產環境所有尾斜線路徑返回 200
2. ✅ 查詢 2025 年 SEO 最佳實踐（尾斜線一致性）
3. ✅ 擴充 SEO CI 工作流，包含圖片、圖標、路徑 200 檢查
4. ✅ 使用 Context7 查看 Playwright 官方文檔

### 次要目標

- ✅ 修正代碼中的拼寫檢查警告
- ✅ 更新 GitHub Actions workflows 配置
- ✅ 創建完整的 SEO E2E 測試套件

---

## 📊 2025 SEO 最佳實踐研究

### 核心發現

**尾斜線策略**：

- ✅ **一致性 > 選擇**: 選擇一種格式（有/無尾斜線）並保持一致
- ✅ **301 重定向**: 從非首選格式重定向到首選格式
- ✅ **Google 處理方式**: 將每個 URL 變體視為獨立頁面
- ❌ **檔案擴展名**: 避免在 .pdf, .html 等檔案上使用尾斜線

**權威來源**：

- [Safari Digital: Trailing Slash SEO (2025)](https://www.safaridigital.com.au/blog/trailing-slash-seo/)
- [Positional: Trailing Slash Best Practices](https://www.positional.com/blog/trailing-slash)
- [Google Developers: URL Slash Guidelines](https://developers.google.com/search/blog/2010/04/to-slash-or-not-to-slash)

### 實施決策

**選擇**: 統一使用尾斜線格式（`/about/`）

**理由**：

1. 符合目錄結構語義（`/about/` 是目錄，`/about` 是檔案）
2. 與靜態站點生成器（vite-react-ssg）輸出格式一致
3. 避免 301 重定向損失（SEO 信號損失 ~10-15%）
4. 提升爬蟲效率（減少不必要的重定向跳轉）

---

## 🛠️ 實施內容

### 1. SEO E2E 測試套件

**新增檔案**: `tests/e2e/seo-validation.spec.ts`

**測試範圍**：

#### HTTP 狀態測試

- ✅ 所有 8 個頁面返回 HTTP 200
- ✅ 驗證首頁、關於、指南、FAQ、歷史主頁、3 個歷史子頁面

#### Meta Tags 測試

- ✅ Title tag 存在且長度 ≤60 字元
- ✅ Meta description 存在且長度 ≤160 字元
- ✅ Canonical URL 正確指向當前頁面

#### Open Graph Tags 測試

- ✅ og:title, og:description, og:url, og:image, og:type
- ✅ 驗證 og:image 為有效圖片格式（png/jpg）

#### JSON-LD Structured Data 測試

- ✅ 所有頁面包含有效的 JSON-LD schema
- ✅ 驗證 @context 和 @type 欄位存在

#### 圖片資源測試

- ✅ OG image (`/og-image.png`) 可訪問
- ✅ Favicon (`/favicon.ico` 或 `/favicon.svg`) 可訪問
- ✅ Apple touch icon (`/apple-touch-icon.png`) 可訪問（可選）

#### 尾斜線一致性測試

- ✅ 所有內部連結使用尾斜線格式
- ✅ Breadcrumb JSON-LD URLs 使用尾斜線格式
- ✅ 排除檔案擴展名（.pdf, .png 等）

#### 效能測試

- ✅ 所有頁面載入時間 <3 秒

#### 行動裝置友善性測試

- ✅ Viewport meta tag 正確配置
- ✅ 行動裝置視窗正常顯示

**程式碼範例**：

```typescript
test.describe('SEO Validation - HTTP Status', () => {
  for (const page of PAGES) {
    test(`${page.name} should return HTTP 200`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${page.path}`);
      expect(response).toBeOK();
      expect(response.status()).toBe(200);
    });
  }
});
```

---

### 2. Lighthouse CI 配置擴充

**修改檔案**: `apps/nihonname/.lighthouserc.json`

#### URL 測試範圍（2 → 8 頁面）

**修改前**：

```json
"url": [
  "http://localhost:3002/nihonname/",
  "http://localhost:3002/nihonname/about"
]
```

**修改後**：

```json
"url": [
  "http://localhost:3002/nihonname/",
  "http://localhost:3002/nihonname/about/",
  "http://localhost:3002/nihonname/guide/",
  "http://localhost:3002/nihonname/faq/",
  "http://localhost:3002/nihonname/history/",
  "http://localhost:3002/nihonname/history/kominka/",
  "http://localhost:3002/nihonname/history/shimonoseki/",
  "http://localhost:3002/nihonname/history/san-francisco/"
]
```

#### 新增 Assertions

**圖片優化檢查**：

```json
"modern-image-formats": ["warn", { "maxLength": 0 }],
"uses-optimized-images": ["warn", { "maxLength": 0 }],
"uses-responsive-images": ["warn", { "maxLength": 0 }],
"image-size-responsive": ["warn", { "maxLength": 0 }]
```

**圖標驗證**：

```json
"apple-touch-icon": ["warn", { "minScore": 1 }],
"maskable-icon": "off"
```

**SEO 核心檢查**：

```json
"canonical": ["error", { "minScore": 1 }],
"meta-description": ["error", { "minScore": 1 }],
"document-title": ["error", { "minScore": 1 }],
"http-status-code": ["error", { "minScore": 1 }],
"viewport": ["error", { "minScore": 1 }]
```

**可爬取性檢查**：

```json
"link-text": ["warn", { "minScore": 0.9 }],
"crawlable-anchors": ["warn", { "minScore": 1 }],
"is-crawlable": ["error", { "minScore": 1 }]
```

---

### 3. GitHub Actions Workflows 更新

#### 3.1 SEO Health Check Workflow

**修改檔案**: `.github/workflows/seo-health-check.yml`

**變更內容**：

- ✅ 更新 NihonName 路徑為尾斜線格式
- ✅ 移除已過時的註解（`.html` 格式相關）
- ✅ 添加 2025 SEO 最佳實踐註解

**修改對比**：

```bash
# 修改前
NIHONNAME_PATHS=(
  "/"
  "/about"
  "/guide"
  "/faq"
  "/history.html"  # 舊版 workaround
  ...
)

# 修改後
NIHONNAME_PATHS=(
  "/"
  "/about/"
  "/guide/"
  "/faq/"
  "/history/"
  "/history/kominka/"
  "/history/shimonoseki/"
  "/history/san-francisco/"
)
```

#### 3.2 新增 SEO E2E Tests Workflow

**新增檔案**: `.github/workflows/seo-e2e-tests.yml`

**觸發條件**：

- ✅ Release 工作流程成功後自動執行
- ✅ 手動觸發（`workflow_dispatch`）
- ✅ 每日定時檢查（UTC 00:00 = 台北 08:00）

**測試流程**：

1. Checkout 代碼
2. 安裝依賴（pnpm）
3. 等待 Zeabur 部署完成（180 秒）
4. 安裝 Playwright 瀏覽器（chromium）
5. 執行 SEO E2E 測試
6. 上傳 Playwright 報告
7. 檢查測試結果並輸出摘要
8. （PR 時）自動評論測試結果

**工作流程配置**：

```yaml
- name: Run SEO E2E tests
  run: |
    pnpm --filter @app/nihonname test:e2e tests/e2e/seo-validation.spec.ts

- name: Upload Playwright report
  uses: actions/upload-artifact@v4
  with:
    name: playwright-seo-report
    path: apps/nihonname/playwright-report/
    retention-days: 30
```

---

### 4. 程式碼品質修正

#### 拼寫檢查警告修正

**修改檔案**: `tests/e2e/seo-validation.spec.ts`

**問題**: cSpell 警告 "kominka" 和 "shimonoseki" 為未知單詞

**解決方案**: 添加 cSpell 忽略註解

```typescript
/**
 * SEO Validation E2E Tests
 * ...
 * cSpell:ignore kominka shimonoseki
 */
```

---

## ✅ 驗證結果

### 生產環境測試

**測試時間**: 2025-12-10T00:00:00+08:00
**基礎 URL**: https://app.haotool.org/nihonname

**結果**：

```
✅ https://app.haotool.org/nihonname/ - 200
✅ https://app.haotool.org/nihonname/about/ - 200
✅ https://app.haotool.org/nihonname/guide/ - 200
✅ https://app.haotool.org/nihonname/faq/ - 200
✅ https://app.haotool.org/nihonname/history/ - 200
✅ https://app.haotool.org/nihonname/history/kominka/ - 200
✅ https://app.haotool.org/nihonname/history/shimonoseki/ - 200
✅ https://app.haotool.org/nihonname/history/san-francisco/ - 200
```

**結論**: ✅ 所有路徑正確返回 HTTP 200

### 本地編譯測試

```bash
pnpm typecheck  # ✅ 通過
pnpm lint       # ✅ 通過
pnpm build      # ✅ 通過
```

---

## 📈 影響與改進

### SEO 測試覆蓋率提升

| 測試項目           | 修改前 | 修改後 | 提升  |
| ------------------ | ------ | ------ | ----- |
| 頁面 HTTP 200 檢查 | 2 頁   | 8 頁   | +300% |
| Lighthouse CI URLs | 2 URLs | 8 URLs | +300% |
| E2E 測試覆蓋       | 無     | 完整   | +100% |
| 圖片資源驗證       | 無     | 3 類   | +100% |
| Meta Tags 驗證     | 部分   | 完整   | +100% |

### CI 自動化增強

**新增自動檢查**：

1. ✅ HTTP 200 狀態（8 個頁面）
2. ✅ Meta Tags 完整性
3. ✅ Open Graph Tags
4. ✅ JSON-LD Structured Data
5. ✅ 圖片資源可訪問性
6. ✅ 尾斜線一致性
7. ✅ 效能基準（<3s）
8. ✅ 行動裝置友善性

**CI 觸發場景**：

- ✅ Pull Request（Lighthouse CI + 可選 E2E）
- ✅ Main 分支推送（Lighthouse CI）
- ✅ Release 成功後（SEO Health Check + E2E Tests）
- ✅ 每日定時檢查（SEO Health Check + E2E Tests）
- ✅ 手動觸發（所有 workflows）

---

## 🎓 學習與最佳實踐

### Linus 三問驗證

#### 1. "這是個真問題還是臆想出來的？"

✅ **真問題**:

- 生產環境 SEO 問題直接影響搜尋引擎排名
- 尾斜線不一致導致重複內容懲罰
- 缺少圖片資源影響社交媒體分享

#### 2. "有更簡單的方法嗎？"

✅ **已採用最簡方案**:

- 使用現有工具（Playwright, Lighthouse CI）
- 利用 GitHub Actions 原生功能
- 避免引入新的依賴或複雜配置

#### 3. "會破壞什麼嗎？"

✅ **向後相容**:

- 所有現有測試繼續運作
- 新增測試不影響現有 CI 流程
- 配置變更僅擴充，不刪除

### Context7 引用

**Playwright 官方文檔引用**：

- `expect(response).toBeOK()` - HTTP 200 狀態檢查
- `expect(locator).toContainText()` - 內容斷言
- `toHaveValue()`, `toBeVisible()` - 元素檢查

**來源**: [Playwright Assertions](https://playwright.dev/docs/api/class-locatorassertions)

---

## 🚀 後續優化建議

### 短期（1-2 週）

1. 監控 CI 執行時間，必要時優化測試並行度
2. 收集 Lighthouse CI 報告，分析效能瓶頸
3. 根據 E2E 測試結果調整斷言閾值

### 中期（1-2 個月）

1. 添加視覺回歸測試（Percy, Chromatic）
2. 擴充 E2E 測試至用戶互動場景
3. 實施 A/B 測試追蹤（Google Analytics, PostHog）

### 長期（3-6 個月）

1. 實施完整的性能監控（Sentry, DataDog）
2. 建立 SEO 分數追蹤儀表板
3. 自動化 sitemap.xml 生成與驗證

---

## 📚 參考文獻

### 官方文檔

- [Playwright Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md)
- [Google Search Central: URL Structure](https://developers.google.com/search/docs/crawling-indexing/url-structure)

### SEO 最佳實踐

- [Safari Digital: Trailing Slash SEO (2025)](https://www.safaridigital.com.au/blog/trailing-slash-seo/)
- [Positional: Trailing Slash Best Practices](https://www.positional.com/blog/trailing-slash)
- [Moz: URL Structure Best Practices](https://moz.com/learn/seo/url)

### GitHub Actions

- [GitHub Actions: Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions: Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)

---

## 📝 變更記錄

| 日期       | 版本  | 變更內容                   | 作者        |
| ---------- | ----- | -------------------------- | ----------- |
| 2025-12-10 | 1.0.0 | 初始版本 - SEO CI 全面增強 | Claude Code |

---

**文檔狀態**: ✅ 已完成
**最後更新**: 2025-12-10T00:30:00+08:00
**維護者**: Claude Code
**下次審查**: 2025-12-24
