# RateWise SEO 深度審計報告（第一部分）

## 問題與缺陷清單

**審計日期**: 2025-12-19
**審計範圍**: apps/ratewise/
**目標**: 找出所有 SEO 缺點、不符合 Google 規範的問題及技術債

---

## 🔴 嚴重問題（Critical Issues）

### 1. 圖片優化問題 - 嚴重影響性能與 SEO

**問題描述**:

- `og-image.png`: 663 KB（建議 <300 KB）
- `twitter-image.png`: 663 KB（與 og-image 重複，建議 <300 KB）
- `logo.png`: 1.4 MB（**嚴重過大**，建議 <100 KB）
- `pwa-512x512.png`: 283 KB（建議 <150 KB）

**違反規範**:

- ❌ Google PageSpeed Insights: "Properly size images"
- ❌ Core Web Vitals: 影響 LCP (Largest Contentful Paint)
- ❌ SEO Best Practice: 圖片檔案過大影響爬蟲預算 (Crawl Budget)

**影響**:

- 社交媒體分享時載入緩慢，降低點擊率
- 搜尋引擎爬蟲可能因檔案過大而跳過索引
- 移動裝置使用者體驗差

**建議解決方案**:

```bash
# 1. 轉換為現代格式
og-image.png (663KB) → og-image.webp (<200KB) + og-image.avif (<150KB)
logo.png (1.4MB) → logo.webp (<50KB) + logo.svg (向量圖)

# 2. 使用響應式圖片
<picture>
  <source srcset="og-image.avif" type="image/avif">
  <source srcset="og-image.webp" type="image/webp">
  <img src="og-image.png" alt="RateWise 匯率轉換器">
</picture>

# 3. 自動化優化流程
pnpm add -D imagemin imagemin-webp imagemin-avif
```

**技術債**:

- 缺少圖片優化腳本（scripts/optimize-images.js 存在但未完整實作）
- 缺少 CI/CD 自動檢查圖片大小

---

### 2. 缺少麵包屑導航（BreadcrumbList Schema）

**問題描述**:

- 所有頁面都缺少麵包屑導航 UI
- `BreadcrumbList` schema 只出現在測試代碼中（src/components/SEOHelmet.test.tsx:145），但未實際部署

**違反規範**:

- ❌ Google Search Central: "Use breadcrumbs to show hierarchy"
- ❌ Schema.org: 缺少 BreadcrumbList 結構化數據
- ❌ UX Best Practice: 用戶無法快速理解頁面層級

**影響**:

- Google 無法理解網站結構層級
- 搜尋結果中不會顯示麵包屑（降低 CTR）
- 用戶導航困難，增加跳出率

**建議實作**:

```typescript
// src/components/Breadcrumb.tsx
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex gap-2 text-sm">
        {items.map((item, idx) => (
          <li key={idx}>
            {idx > 0 && <span className="mx-2">/</span>}
            {item.href ? (
              <Link to={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// SEOHelmet.tsx 新增
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: item.label,
    item: item.href ? `${SITE_BASE_URL}${item.href}` : undefined,
  })),
};
```

**範例實作**:

```tsx
// apps/ratewise/src/pages/USDToTWD.tsx
<Breadcrumb
  items={[
    { label: '首頁', href: '/' },
    { label: '幣別換算', href: '/exchange/' },
    { label: 'USD 對 TWD', href: '/usd-twd/' },
  ]}
/>
```

---

### 3. Sitemap.xml 時間戳不真實

**問題描述**:

- 所有 17 個 URL 的 `<lastmod>` 都是 `2025-12-15`
- `<changefreq>` 設定不符合實際更新頻率
- 缺少 `<image:image>` 標籤（Image Sitemap Extension）

**違反規範**:

- ❌ Google Search Console: "Sitemap lastmod should reflect actual changes"
- ❌ Sitemap Protocol 0.9: lastmod 應該是真實的最後修改時間

**當前錯誤配置**:

```xml
<!-- ❌ 錯誤：所有頁面都是同一天 -->
<url>
  <loc>https://app.haotool.org/ratewise/</loc>
  <lastmod>2025-12-15</lastmod>
  <changefreq>daily</changefreq>  <!-- ❌ 首頁不是每天改 -->
</url>
<url>
  <loc>https://app.haotool.org/ratewise/usd-twd/</loc>
  <lastmod>2025-12-15</lastmod>
  <changefreq>monthly</changefreq>  <!-- ❌ 匯率頁面應該是 daily -->
</url>
```

**正確配置**:

```xml
<!-- ✅ 正確：根據實際修改時間 -->
<url>
  <loc>https://app.haotool.org/ratewise/</loc>
  <lastmod>2025-12-19T08:30:00+08:00</lastmod>
  <changefreq>daily</changefreq>
  <priority>1.0</priority>
  <image:image>
    <image:loc>https://app.haotool.org/ratewise/og-image.webp</image:loc>
    <image:caption>RateWise 匯率轉換器截圖</image:caption>
  </image:image>
</url>
<url>
  <loc>https://app.haotool.org/ratewise/usd-twd/</loc>
  <lastmod>2025-12-18T14:20:00+08:00</lastmod>
  <changefreq>daily</changefreq>  <!-- ✅ 匯率每日更新 -->
  <priority>0.8</priority>
</url>
```

**建議解決方案**:

```javascript
// scripts/generate-sitemap.js 修正
import { statSync } from 'fs';

function getLastModified(filePath) {
  try {
    const stats = statSync(filePath);
    return stats.mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// 根據實際文件修改時間
const lastmod = getLastModified(`src/pages/${pageName}.tsx`);
```

---

### 4. robots.txt 阻擋 JSON 文件

**問題描述**:

```txt
# ❌ 可能阻擋 JSON-LD 結構化數據
Disallow: /*.json$
```

**違反規範**:

- ⚠️ 可能阻擋 `/api/rates.json` 等動態數據
- ⚠️ 可能影響 JSON Feed (如果未來實作)

**影響**:

- 雖然 HTML 內嵌的 JSON-LD 不受影響，但外部 JSON 資源會被阻擋
- 如果未來實作 JSON Feed，將無法被索引

**建議修正**:

```txt
# ✅ 更精確的規則
Disallow: /sw.js
Disallow: /workbox-*.js
Disallow: /manifest.json  # 只阻擋 PWA manifest
Allow: /api/*.json       # 允許 API JSON
Allow: /feed.json        # 允許 JSON Feed
```

---

### 5. 缺少內部連結策略

**問題描述**:

- Grep 搜尋 `<a href=` 和 `<Link to=` 結果為 **0**（除了測試文件）
- 頁面之間缺少相互連結
- 沒有「相關頁面」推薦區塊

**違反規範**:

- ❌ Google SEO Starter Guide: "Use internal links to help Google find content"
- ❌ PageRank Flow: 沒有內部連結無法傳遞權重

**影響**:

- Google 爬蟲難以發現深層頁面
- 頁面權重無法傳遞
- 用戶跳出率高

**建議實作**:

```tsx
// 1. 在首頁添加「熱門貨幣對」區塊
<section className="grid md:grid-cols-3 gap-4">
  <h2>熱門貨幣換算</h2>
  <Link to="/usd-twd/">USD → TWD 美金換台幣</Link>
  <Link to="/jpy-twd/">JPY → TWD 日圓換台幣</Link>
  <Link to="/eur-twd/">EUR → TWD 歐元換台幣</Link>
</section>

// 2. 在幣別頁面添加「相關換算」
<aside className="related-links">
  <h3>相關匯率換算</h3>
  <ul>
    <li><Link to="/jpy-twd/">日圓對台幣</Link></li>
    <li><Link to="/eur-twd/">歐元對台幣</Link></li>
    <li><Link to="/gbp-twd/">英鎊對台幣</Link></li>
  </ul>
</aside>

// 3. Footer 添加完整站點地圖
<footer>
  <nav aria-label="Footer Navigation">
    <div className="grid grid-cols-4">
      <div>
        <h4>核心功能</h4>
        <ul>
          <li><Link to="/">匯率換算</Link></li>
          <li><Link to="/guide/">使用指南</Link></li>
          <li><Link to="/faq/">常見問題</Link></li>
        </ul>
      </div>
      <div>
        <h4>熱門貨幣</h4>
        <ul>
          <li><Link to="/usd-twd/">美金</Link></li>
          <li><Link to="/jpy-twd/">日圓</Link></li>
          <li><Link to="/eur-twd/">歐元</Link></li>
        </ul>
      </div>
    </div>
  </nav>
</footer>
```

**技術債**: 缺少 Footer 組件

---

## 🟡 中等問題（Medium Priority）

### 6. 缺少 HTML Sitemap（用戶友善的站點地圖）

**問題描述**:

- 只有 `sitemap.xml`（給搜尋引擎）
- 缺少 `/sitemap/` 頁面（給用戶）

**建議實作**:

```tsx
// apps/ratewise/src/pages/Sitemap.tsx
export default function Sitemap() {
  return (
    <main>
      <h1>網站地圖</h1>
      <section>
        <h2>核心頁面</h2>
        <ul>
          <li>
            <Link to="/">首頁</Link>
          </li>
          <li>
            <Link to="/guide/">使用指南</Link>
          </li>
          <li>
            <Link to="/faq/">常見問題</Link>
          </li>
          <li>
            <Link to="/about/">關於我們</Link>
          </li>
        </ul>
      </section>
      <section>
        <h2>幣別換算（依字母排序）</h2>
        <div className="grid grid-cols-3">
          <Link to="/aud-twd/">AUD → TWD</Link>
          <Link to="/cad-twd/">CAD → TWD</Link>
          {/* ... 其他 11 個幣別 */}
        </div>
      </section>
    </main>
  );
}
```

**SEO 價值**:

- 提供額外的內部連結入口
- 幫助用戶快速找到所有頁面
- 改善網站可訪問性（Accessibility）

---

### 7. 缺少多語言版本

**問題描述**:

- 只有繁體中文（zh-TW）
- hreflang 只有自己指向自己（無實質多語言）
- 錯失國際用戶流量

**當前配置**:

```xml
<!-- sitemap.xml - 只有自己指向自己 -->
<xhtml:link rel="alternate" hreflang="zh-TW" href="https://app.haotool.org/ratewise/" />
<xhtml:link rel="alternate" hreflang="x-default" href="https://app.haotool.org/ratewise/" />
```

**建議實作**:

```tsx
// 1. 添加英文版 (en-US)
/ratewise/en/ → English version
/ratewise/ → 繁體中文版（預設）

// 2. sitemap.xml 更新
<url>
  <loc>https://app.haotool.org/ratewise/</loc>
  <xhtml:link rel="alternate" hreflang="zh-TW" href="https://app.haotool.org/ratewise/" />
  <xhtml:link rel="alternate" hreflang="en-US" href="https://app.haotool.org/ratewise/en/" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://app.haotool.org/ratewise/en/" />
</url>

// 3. SEOHelmet 動態 hreflang
<link rel="alternate" hreflang="zh-TW" href="https://app.haotool.org/ratewise/" />
<link rel="alternate" hreflang="en-US" href="https://app.haotool.org/ratewise/en/" />
```

**SEO 價值**:

- 觸及國際用戶（特別是使用 USD、JPY、EUR 的用戶）
- 提升 Google 多語言搜尋排名
- 增加自然流量來源

---

### 8. 缺少結構化數據：Review、AggregateRating

**問題描述**:

- 有 WebApplication、Organization、FAQPage、HowTo schema
- 缺少用戶評價相關的 schema

**建議實作**:

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "RateWise",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1250",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "王小明"
      },
      "datePublished": "2025-11-20",
      "reviewBody": "匯率準確，離線也能用，非常方便！",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5"
      }
    }
  ]
}
```

**前置條件**: 需要先收集真實用戶評價

---

### 9. URL 結構缺少語義化層級

**問題描述**:

- 當前: `/usd-twd/`（扁平結構）
- 建議: `/exchange/usd-twd/` 或 `/rates/usd-twd/`（階層結構）

**優點**:

- 更清晰的網站架構
- 更好的 URL 語義
- 更容易擴展（未來可加 `/exchange/history/usd-twd/`）

**缺點**:

- ⚠️ 需要設定 301 重定向（避免破壞已索引的 URL）

**建議方案**:

```typescript
// 階段性遷移計畫
Phase 1: 新增 /exchange/usd-twd/（保留舊 URL）
Phase 2: 設定 301 redirect: /usd-twd/ → /exchange/usd-twd/
Phase 3: 更新 sitemap.xml 和內部連結
Phase 4: 6 個月後移除舊 URL（確保 Google 完全重新索引）
```

---

### 10. 缺少 FinancialProduct / Service Schema

**問題描述**:

- 使用 `WebApplication`，但更精確的類型是 `FinancialProduct` 或 `Service`

**建議實作**:

```json
{
  "@context": "https://schema.org",
  "@type": "FinancialProduct",
  "name": "RateWise Currency Converter",
  "category": "Currency Exchange Service",
  "provider": {
    "@type": "Organization",
    "name": "haotool"
  },
  "audience": {
    "@type": "Audience",
    "audienceType": "台灣用戶、出國旅客、外匯交易者"
  },
  "featureList": ["即時匯率", "離線使用", "歷史趨勢"],
  "isAccessibleForFree": true
}
```

---

## 🟢 低優先級問題（Nice to Have）

### 11. 缺少社交分享按鈕

**問題描述**:

- 無法快速分享到 Facebook、Twitter、LINE

**建議實作**:

```tsx
// src/components/SocialShare.tsx
export function SocialShare({ url, title }: { url: string; title: string }) {
  return (
    <div className="flex gap-3">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${url}`}
        target="_blank"
        rel="noopener"
      >
        Facebook
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${url}&text=${title}`}
        target="_blank"
        rel="noopener"
      >
        Twitter
      </a>
      <a
        href={`https://social-plugins.line.me/lineit/share?url=${url}`}
        target="_blank"
        rel="noopener"
      >
        LINE
      </a>
    </div>
  );
}
```

---

### 12. 缺少權威外部連結

**問題描述**:

- 缺少指向臺灣銀行官網的連結
- 缺少引用來源標註

**建議實作**:

```tsx
<p>
  匯率數據來源：
  <a href="https://rate.bot.com.tw/xrt?Lang=zh-TW" target="_blank" rel="noopener noreferrer">
    臺灣銀行牌告匯率
  </a>
  （每 5 分鐘更新）
</p>
```

**SEO 價值**:

- 提供權威來源增加可信度
- Google E-E-A-T 信號（Expertise, Authoritativeness, Trustworthiness）

---

### 13. 缺少部落格/資源中心

**問題描述**:

- 沒有內容行銷策略
- 無法透過長尾關鍵字獲取流量

**建議實作**:

```
/ratewise/blog/ → 部落格首頁
/ratewise/blog/usd-twd-rate-forecast-2025/ → 「2025 美金匯率預測」
/ratewise/blog/best-time-to-exchange-jpy/ → 「何時換日圓最划算？」
/ratewise/blog/taiwan-bank-vs-online-exchange/ → 「臺銀 vs 線上換匯平台比較」
```

**SEO 價值**:

- 攻佔長尾關鍵字
- 建立領域權威
- 提高回訪率

---

### 14. 缺少 Image Alt 屬性完整性檢查

**問題描述**:

- `grep -r "alt=" src/ | wc -l` 只有 **1** 個結果
- 大部分圖片可能缺少 alt 屬性

**建議實作**:

```tsx
// ❌ 錯誤
<img src="/logo.png" />

// ✅ 正確
<img src="/logo.png" alt="RateWise 匯率好工具 Logo" />

// ✅ 裝飾性圖片
<img src="/pattern.svg" alt="" role="presentation" />
```

**CI 自動檢查**:

```javascript
// scripts/check-image-alt.js
const missingAlt = findImagesWithoutAlt('src/');
if (missingAlt.length > 0) {
  console.error('❌ 以下圖片缺少 alt 屬性:', missingAlt);
  process.exit(1);
}
```

---

### 15. 缺少 Video Schema（如果有教學影片）

**問題描述**:

- 如果未來添加教學影片，需要 VideoObject schema

**建議實作**:

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "如何使用 RateWise 換算匯率",
  "description": "3 分鐘學會使用 RateWise 進行即時匯率換算",
  "thumbnailUrl": "https://app.haotool.org/ratewise/video-thumbnail.jpg",
  "uploadDate": "2025-12-01",
  "duration": "PT3M15S",
  "contentUrl": "https://youtu.be/xxxxx"
}
```

---

## 📊 技術債總結

### 高優先級技術債

1. ✅ **圖片優化流程未完善** - scripts/optimize-images.js 存在但未使用
2. ✅ **Sitemap 生成腳本時間戳邏輯錯誤** - 都是同一天
3. ✅ **缺少 BreadcrumbList 實作** - 只有測試代碼
4. ✅ **缺少內部連結結構** - Footer、相關頁面推薦

### 中優先級技術債

5. ✅ **缺少多語言支援** - 只有 zh-TW
6. ✅ **URL 結構不夠語義化** - 扁平結構
7. ✅ **缺少用戶評價機制** - Review/Rating schema

### 低優先級技術債

8. ✅ **缺少社交分享組件**
9. ✅ **缺少部落格/內容行銷**
10. ✅ **缺少 CI 自動化 SEO 檢查**

---

## 🎯 不符合 Google 規範的項目清單

| 項目                   | 規範來源             | 違反程度 | 影響               |
| ---------------------- | -------------------- | -------- | ------------------ |
| 圖片過大 (1.4MB logo)  | PageSpeed Insights   | ⚠️ 嚴重  | 性能、爬蟲預算     |
| 缺少麵包屑導航         | Search Central       | ⚠️ 嚠重  | CTR、結構理解      |
| Sitemap lastmod 不真實 | Sitemap Protocol     | ⚠️ 中等  | 索引效率           |
| robots.txt 阻擋 JSON   | SEO Best Practice    | ⚠️ 中等  | 未來擴展性         |
| 缺少內部連結           | SEO Starter Guide    | ⚠️ 嚴重  | PageRank、爬蟲發現 |
| 缺少 HTML Sitemap      | Accessibility        | ⚠️ 低    | 用戶體驗           |
| 單一語言 (zh-TW)       | Internationalization | ⚠️ 中等  | 國際流量           |
| 缺少 Image Alt         | WCAG 2.1             | ⚠️ 中等  | 可訪問性、圖片 SEO |

---

## ✅ 下一步行動（Action Items）

### 立即執行（本週完成）

1. [ ] 優化所有圖片（logo.png 1.4MB → <100KB）
2. [ ] 實作麵包屑導航（UI + Schema）
3. [ ] 修正 sitemap.xml 時間戳邏輯
4. [ ] 添加 Footer 內部連結結構

### 短期執行（本月完成）

5. [ ] 添加「相關頁面」推薦區塊
6. [ ] 實作 HTML Sitemap 頁面
7. [ ] 修正 robots.txt（允許必要的 JSON）
8. [ ] 補充所有圖片的 alt 屬性

### 中期執行（下季完成）

9. [ ] 實作英文版（en-US）
10. [ ] 收集用戶評價並添加 Review Schema
11. [ ] 添加社交分享按鈕
12. [ ] 規劃部落格內容策略

### 長期執行（明年）

13. [ ] URL 結構重構（/exchange/ 層級）
14. [ ] 建立內容行銷團隊
15. [ ] 擴展更多語言版本（ja, en, ko）

---

**報告結束 - 第二部分將提供詳細的修復計畫與代碼實作**
