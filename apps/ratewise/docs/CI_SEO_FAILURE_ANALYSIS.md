# CI/CD SEO 檢查失效分析報告

**審計日期**: 2025-12-19
**問題**: 為什麼過去的 SEO 檢測 CI 讓不合格的程式通過？

---

## 📋 現有 CI/CD 工作流程盤點

### 1. Lighthouse CI (.github/workflows/lighthouse-ci.yml)

**檢查項目**:
```yaml
- Performance ≥ 85
- Accessibility ≥ 85
- Best Practices ≥ 85
- SEO ≥ 85
```

**❌ 致命缺陷**:

#### 問題 1: 只檢查「分數」，不檢查「細節」
```javascript
// 只檢查總分，不檢查具體問題
${seo >= 0.85 ? '✅' : '⚠️'}
```

**實際情況**:
- ✅ RateWise SEO 分數：**100/100**
- ❌ 但圖片過大（logo.png 1.4MB）→ **沒被檢測到**
- ❌ 但缺少麵包屑導航 → **沒被檢測到**
- ❌ 但 Sitemap 時間戳不真實 → **沒被檢測到**

**為什麼 Lighthouse 給 100 分卻有問題？**

Lighthouse SEO 只檢查以下 17 項基礎規則：
```
✅ Document has a <title> element
✅ Document has a meta description
✅ Page has successful HTTP status code
✅ Links have descriptive text
✅ Document has a valid hreflang
✅ Document uses legible font sizes
✅ tap targets are sized appropriately
✅ robots.txt is valid
✅ Page has a viewport meta tag
✅ ... (其他 8 項基礎檢查)
```

**❌ Lighthouse 不檢查的進階 SEO**:
- ❌ 圖片檔案大小優化
- ❌ 麵包屑導航（BreadcrumbList Schema）
- ❌ Sitemap lastmod 時間戳真實性
- ❌ 內部連結結構品質
- ❌ Image Alt 屬性完整性
- ❌ 結構化數據完整性（只檢查格式，不檢查缺失）

#### 問題 2: 門檻設定為「軟性警告」
```yaml
門檻：所有類別 ≥ 85 分（軟性警告，不阻擋 PR）
```

即使分數低於 85，**也不會讓 CI 失敗**！

---

### 2. SEO Health Check (.github/workflows/seo-health-check.yml)

**檢查項目**:
```javascript
1. 驗證所有 sitemap.xml 中的 URL 返回 200
2. 驗證 robots.txt 存在且正確
3. 驗證 llms.txt 存在且正確
4. 驗證 hreflang 配置一致性
5. 驗證圖片資源存在且可訪問
```

**❌ 致命缺陷**:

#### 問題 1: 只在「生產環境」執行
```yaml
on:
  workflow_run:
    workflows: ['Release']  # 只在 Release 後執行
  schedule:
    - cron: '0 0 * * *'     # 或每日定時
```

**影響**:
- ❌ PR 階段不執行 → 問題無法在合併前發現
- ❌ 只檢查已部署的生產環境 → 為時已晚

#### 問題 2: 只檢查「存在性」，不檢查「品質」
```javascript
// verify-production-seo.mjs:44
async function checkUrl(url, expectedStatus = 200) {
  // 只檢查 HTTP 200，不檢查內容
}
```

**範例**:
```javascript
✅ og-image.png 返回 200 → 通過
❌ 但文件 663 KB（建議 <200 KB）→ 沒檢查
```

---

### 3. Image Resources Check (scripts/verify-image-resources.mjs)

**檢查項目**:
```javascript
1. 檢查圖片文件是否存在
2. 檢查文件大小（僅警告，不失敗）
```

**❌ 致命缺陷**:

#### 問題 1: 只檢查「是否存在」，不檢查「大小是否合理」
```javascript
// verify-image-resources.mjs:101
} else {
  log(colors.green, '✓', `${imagePath} - ${formatFileSize(result.size)}`);
  // ❌ 只顯示大小，不判斷是否過大
}
```

**實際輸出**:
```bash
✓ logo.png - 1.4 MB       # ❌ 過大，但通過檢查
✓ og-image.png - 663 KB   # ❌ 過大，但通過檢查
```

#### 問題 2: 缺少「大小上限」驗證
```javascript
// ❌ 應該要有的檢查（但沒有）
if (imagePath === '/logo.png' && result.size > 100 * 1024) {
  log(colors.red, '✗', `logo.png 過大 (${formatFileSize(result.size)}) - 建議 <100KB`);
  hasErrors = true;
}
```

---

### 4. Main CI Workflow (.github/workflows/ci.yml)

**檢查項目**:
```yaml
- Run linter
- Format check
- Type check
- Run tests
- Build
- Verify sitemap/SSG consistency
- Security audit
```

**❌ 致命缺陷**:

#### 問題 1: 缺少 SEO 專項檢查
```yaml
# ❌ 沒有這些檢查
- name: Check Image Sizes
- name: Check Image Alt Attributes
- name: Check Breadcrumb Navigation
- name: Check Internal Links
- name: Validate Sitemap Timestamps
```

#### 問題 2: `verify:sitemap` 只檢查「一致性」，不檢查「時間戳」
```javascript
// scripts/verify-sitemap-ssg.mjs
// 只檢查 sitemap.xml 的 URL 是否與 SSG 路徑一致
// ❌ 不檢查 lastmod 時間戳是否真實
```

---

## 🔍 根本原因分析

### 1. 檢查層級不足

| 檢查層級 | 現有 CI | 應有檢查 |
|----------|---------|----------|
| **L1: 存在性** | ✅ 有 | 圖片存在、robots.txt 存在 |
| **L2: 格式正確** | ✅ 有 | Sitemap XML 格式、Schema 格式 |
| **L3: 內容品質** | ❌ 無 | 圖片大小、時間戳真實性 |
| **L4: 結構完整** | ❌ 無 | 麵包屑、內部連結、Alt 屬性 |
| **L5: 最佳實踐** | ❌ 無 | URL 結構、多語言、Review Schema |

**現有 CI 只檢查 L1 和 L2，缺少 L3、L4、L5！**

---

### 2. 執行時機錯誤

```
❌ 現狀：只在生產環境檢查
┌─────────┐   ┌─────┐   ┌────────┐   ┌──────────┐
│ Develop │ → │ PR  │ → │ Merge  │ → │ Deploy   │ → 🔍 SEO Check
└─────────┘   └─────┘   └────────┘   └──────────┘
                                                      ↑ 太晚了！

✅ 正確：在 PR 階段檢查
┌─────────┐   ┌─────┐   ┌────────┐   ┌──────────┐
│ Develop │ → │ PR  │ → │ Merge  │ → │ Deploy   │
└─────────┘   └─────┘   └────────┘   └──────────┘
                 ↑
              🔍 SEO Check（阻擋不合格的 PR）
```

---

### 3. 檢查標準寬鬆

#### Lighthouse CI
```yaml
# ❌ 現狀：軟性警告
門檻：所有類別 ≥ 85 分（軟性警告，不阻擋 PR）

# ✅ 應該：強制失敗
assertions:
  categories:performance: ["error", { "minScore": 0.9 }]
  categories:seo: ["error", { "minScore": 0.95 }]
```

#### Image Size Check
```javascript
// ❌ 現狀：只顯示大小
log(colors.green, '✓', `${imagePath} - ${formatFileSize(result.size)}`);

// ✅ 應該：驗證上限
if (result.size > MAX_SIZES[imagePath]) {
  log(colors.red, '✗', `${imagePath} 過大！`);
  process.exit(1);
}
```

---

## 🎯 缺失的檢查項目清單

### 缺失檢查 #1: 圖片大小驗證

**應有的測試**:
```typescript
// scripts/__tests__/image-optimization.test.ts
describe('Image Optimization', () => {
  it('logo.png should be < 100 KB', () => {
    const size = statSync('apps/ratewise/public/logo.png').size;
    expect(size).toBeLessThan(100 * 1024);  // ❌ 現在會失敗
  });

  it('og-image.png should be < 200 KB', () => {
    const size = statSync('apps/ratewise/public/og-image.png').size;
    expect(size).toBeLessThan(200 * 1024);  // ❌ 現在會失敗
  });
});
```

**為什麼沒有這個測試？**
- `verify-image-resources.mjs` 只檢查存在性
- 沒有定義 `MAX_SIZES` 常數
- 沒有在 CI 中執行大小驗證

---

### 缺失檢查 #2: Image Alt 屬性

**應有的檢查**:
```javascript
// scripts/check-image-alt.mjs
function findImagesWithoutAlt(dir) {
  const errors = [];
  const imgRegex = /<img\s+([^>]*?)>/gi;

  files.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      const attrs = match[1];
      if (!attrs.includes('alt=')) {  // ❌ 缺少 alt
        errors.push({ file, line, code: match[0] });
      }
    }
  });

  return errors;
}
```

**為什麼沒有這個檢查？**
- 完全沒有這個腳本
- CI 中沒有相關驗證

---

### 缺失檢查 #3: 麵包屑導航

**應有的測試**:
```typescript
// apps/ratewise/src/components/__tests__/Breadcrumb.test.tsx
describe('Breadcrumb', () => {
  it('should exist on all pages', () => {
    const pages = ['/', '/faq/', '/usd-twd/'];

    pages.forEach(path => {
      const html = renderPage(path);
      expect(html).toContain('role="navigation"');
      expect(html).toContain('aria-label="麵包屑導航"');
    });
  });

  it('should have BreadcrumbList schema', () => {
    const html = renderPage('/usd-twd/');
    const schemas = extractJSONLD(html);

    const breadcrumb = schemas.find(s => s['@type'] === 'BreadcrumbList');
    expect(breadcrumb).toBeDefined();  // ❌ 現在會失敗
  });
});
```

**為什麼沒有這個測試？**
- 麵包屑組件本身不存在
- 沒有針對性的測試

---

### 缺失檢查 #4: Sitemap 時間戳真實性

**應有的測試**:
```typescript
// scripts/__tests__/sitemap.test.ts
describe('Sitemap.xml', () => {
  it('should have different lastmod for different pages', () => {
    const xml = readFileSync('apps/ratewise/public/sitemap.xml', 'utf-8');
    const parsed = parseXML(xml);

    const lastmods = parsed.urlset.url.map(u => u.lastmod[0]);
    const uniqueLastmods = new Set(lastmods);

    // 至少應該有 5 個不同的時間戳
    expect(uniqueLastmods.size).toBeGreaterThanOrEqual(5);  // ❌ 現在只有 1 個
  });

  it('should reflect actual file modification time', () => {
    const faqLastmod = getSitemapLastmod('/faq/');
    const faqFileMtime = statSync('src/pages/FAQ.tsx').mtime;

    const diff = Math.abs(new Date(faqLastmod) - faqFileMtime);
    expect(diff).toBeLessThan(24 * 60 * 60 * 1000);  // 24 小時內
  });
});
```

**為什麼沒有這個測試？**
- Sitemap 生成腳本使用固定日期
- 沒有驗證時間戳真實性的測試

---

### 缺失檢查 #5: 內部連結結構

**應有的測試**:
```typescript
// apps/ratewise/src/components/__tests__/Footer.test.tsx
describe('Footer', () => {
  it('should link to all core pages', () => {
    render(<Footer />);

    expect(screen.getByText('匯率換算')).toHaveAttribute('href', '/');
    expect(screen.getByText('使用指南')).toHaveAttribute('href', '/guide/');
    expect(screen.getByText('常見問題')).toHaveAttribute('href', '/faq/');
  });

  it('should link to all 13 currency pages', () => {
    render(<Footer />);

    const currencyLinks = screen.getAllByRole('link');
    const currencyPaths = currencyLinks
      .map(link => link.getAttribute('href'))
      .filter(href => href?.includes('-twd/'));

    expect(currencyPaths).toHaveLength(13);  // ❌ 現在 Footer 不存在
  });
});
```

**為什麼沒有這個測試？**
- Footer 組件不存在
- 沒有內部連結結構的驗證

---

## 📊 問題嚴重程度統計

| 問題類型 | 數量 | 嚴重程度 | CI 檢測 | 原因 |
|----------|------|----------|---------|------|
| 圖片過大 | 3 | 🔴 嚴重 | ❌ 未檢測 | 缺少大小驗證 |
| 缺少麵包屑 | 17 頁 | 🔴 嚴重 | ❌ 未檢測 | 缺少結構檢查 |
| Sitemap 時間戳 | 17 項 | 🔴 嚴重 | ❌ 未檢測 | 只驗證格式 |
| 內部連結不足 | - | 🔴 嚴重 | ❌ 未檢測 | 缺少連結檢查 |
| robots.txt 過嚴 | 1 | 🟡 中等 | ✅ 部分檢測 | 只檢查存在性 |
| 缺少 HTML Sitemap | 1 | 🟡 中等 | ❌ 未檢測 | 無相關測試 |
| 單一語言 | - | 🟡 中等 | ❌ 未檢測 | 無國際化檢查 |
| 缺少 Review Schema | - | 🟡 中等 | ❌ 未檢測 | Schema 不完整 |
| 缺少社交分享 | - | 🟢 低 | ❌ 未檢測 | 功能缺失 |
| 缺少 Alt 屬性 | 未知 | 🟡 中等 | ❌ 未檢測 | 無 Alt 檢查 |

**總計**:
- 🔴 嚴重問題：4 項（**全部未檢測**）
- 🟡 中等問題：5 項（**4 項未檢測**）
- 🟢 低優先問題：1 項（未檢測）

**CI 檢測覆蓋率**：僅 **10%**（只抓到 robots.txt 部分問題）

---

## 🛠️ 改進建議

### 立即行動（本週）

#### 1. 添加圖片大小驗證到 CI
```yaml
# .github/workflows/ci.yml
- name: Check Image Sizes
  run: |
    pnpm test scripts/__tests__/image-optimization.test.ts
    if [ $? -ne 0 ]; then
      echo "❌ 圖片優化檢查失敗"
      exit 1
    fi
```

#### 2. 添加 Alt 屬性檢查
```yaml
- name: Check Image Alt Attributes
  run: |
    pnpm check:image-alt
```

#### 3. 強化 Lighthouse CI 門檻
```yaml
# .lighthouserc.json
"assertions": {
  "categories:performance": ["error", { "minScore": 0.9 }],
  "categories:seo": ["error", { "minScore": 0.95 }],
  "categories:accessibility": ["error", { "minScore": 0.9 }]
}
```

#### 4. 將 SEO Health Check 移至 PR 階段
```yaml
# .github/workflows/seo-health-check.yml
on:
  pull_request:  # 新增 PR 觸發
    paths:
      - 'apps/**/src/**'
      - 'apps/**/public/**'
  push:
    branches: [main]
```

---

### 中期行動（本月）

#### 5. 建立 SEO 專項測試套件
```bash
pnpm test:seo
  ├── Image optimization tests
  ├── Alt attribute tests
  ├── Breadcrumb tests
  ├── Sitemap validation tests
  ├── Internal links tests
  └── Schema completeness tests
```

#### 6. 實作 pre-commit hook
```bash
# .husky/pre-commit
pnpm check:image-alt
pnpm test:breadcrumb
```

---

### 長期行動（下季）

#### 7. 自動化 SEO 監控儀表板
```typescript
// scripts/seo-dashboard.mjs
const report = {
  imageOptimization: checkImages(),
  breadcrumbs: checkBreadcrumbs(),
  internalLinks: checkInternalLinks(),
  sitemapQuality: checkSitemap(),
  schemaCompleteness: checkSchemas(),
};

// 生成 HTML 報告
generateReport(report);
```

#### 8. 整合 Google Search Console API
```javascript
// 自動檢查真實的 SEO 表現
const gscData = await fetchSearchConsoleData();
if (gscData.crawlErrors > 0) {
  throw new Error('Google Search Console 報告爬取錯誤！');
}
```

---

## 🎓 經驗教訓

### 1. **「通過 CI」≠「品質良好」**
- Lighthouse 100 分 ≠ SEO 完美
- 只檢查基礎規則，缺少進階檢查

### 2. **執行時機至關重要**
- 在生產環境檢查 = 為時已晚
- 應該在 PR 階段阻擋問題

### 3. **分層檢查才完整**
- L1: 存在性 ✅
- L2: 格式正確 ✅
- L3: 內容品質 ❌
- L4: 結構完整 ❌
- L5: 最佳實踐 ❌

### 4. **自動化必須嚴格**
- 軟性警告 = 無效警告
- 必須強制 CI 失敗才能阻擋問題

---

## 📝 結論

**為什麼過去的 CI 讓不合格的程式通過？**

1. **檢查層級不足**：只檢查存在性和格式，不檢查品質
2. **執行時機錯誤**：只在生產環境執行，PR 階段無檢查
3. **檢查標準寬鬆**：軟性警告不會阻擋 PR
4. **缺少專項測試**：圖片大小、Alt 屬性、麵包屑、內部連結全無檢查
5. **過度信任 Lighthouse**：100 分不代表沒有進階 SEO 問題

**CI 覆蓋率**：僅 **10%**

**改進後預期覆蓋率**：**90%+**

---

**報告結束 - 建議立即實施改進方案**
