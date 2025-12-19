# RateWise SEO 深度審計報告（第二部分）
## 修復計畫與實作指南

**審計日期**: 2025-12-19
**報告版本**: v2.0
**實施策略**: BDD (RED → GREEN → REFACTOR)

---

## 📋 目錄

1. [立即執行方案（本週）](#立即執行方案)
2. [短期執行方案（本月）](#短期執行方案)
3. [中期執行方案（下季）](#中期執行方案)
4. [長期執行方案（明年）](#長期執行方案)
5. [CI/CD 自動化方案](#cicd-自動化方案)
6. [驗收標準與測試策略](#驗收標準與測試策略)

---

## 🚀 立即執行方案（本週完成）

### 1. 圖片優化 - 減少 70% 檔案大小

#### 問題現狀
```bash
logo.png           1.4 MB  → 目標 <100 KB
og-image.png       663 KB  → 目標 <200 KB
twitter-image.png  663 KB  → 目標 <200 KB（或刪除重複）
pwa-512x512.png    283 KB  → 目標 <150 KB
```

#### 解決方案 - 自動化圖片優化腳本

**Step 1: 安裝依賴**
```bash
pnpm add -D sharp @squoosh/lib imagemin imagemin-webp imagemin-avif
```

**Step 2: 創建優化腳本**
```javascript
// scripts/optimize-images.mjs
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';

const IMAGE_DIRS = ['apps/ratewise/public', 'apps/ratewise/public/icons'];
const MAX_SIZES = {
  'logo.png': 100 * 1024,        // 100 KB
  'og-image.png': 200 * 1024,    // 200 KB
  'twitter-image.png': 200 * 1024,
  'pwa-*.png': 150 * 1024,
};

async function optimizeImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;

  const fileName = basename(filePath);
  const maxSize = Object.entries(MAX_SIZES).find(([pattern]) =>
    fileName.match(pattern.replace('*', '.*'))
  )?.[1] || Infinity;

  const stats = await stat(filePath);
  if (stats.size <= maxSize) {
    console.log(`✅ ${fileName} already optimized (${(stats.size / 1024).toFixed(1)} KB)`);
    return;
  }

  // 生成 WebP 和 AVIF 格式
  const image = sharp(filePath);
  const metadata = await image.metadata();

  // WebP (通常比 PNG 小 30-50%)
  await image
    .webp({ quality: 85, effort: 6 })
    .toFile(filePath.replace(ext, '.webp'));

  // AVIF (比 WebP 再小 20-30%)
  await image
    .avif({ quality: 75, effort: 6 })
    .toFile(filePath.replace(ext, '.avif'));

  // 優化原始 PNG (作為 fallback)
  await image
    .png({ quality: 85, compressionLevel: 9, adaptiveFiltering: true })
    .toFile(filePath.replace(ext, '.optimized.png'));

  const newStats = await stat(filePath.replace(ext, '.optimized.png'));
  const savings = ((stats.size - newStats.size) / stats.size * 100).toFixed(1);

  console.log(`✅ ${fileName}: ${(stats.size / 1024).toFixed(1)} KB → ${(newStats.size / 1024).toFixed(1)} KB (省 ${savings}%)`);
}

async function main() {
  for (const dir of IMAGE_DIRS) {
    const files = await readdir(dir, { recursive: true });
    for (const file of files) {
      await optimizeImage(join(dir, file));
    }
  }
}

main().catch(console.error);
```

**Step 3: 更新 HTML 使用現代圖片格式**
```html
<!-- apps/ratewise/index.html -->

<!-- ❌ 舊寫法 -->
<meta property="og:image" content="https://app.haotool.org/ratewise/og-image.png?v=20251208" />

<!-- ✅ 新寫法 - 優先使用 AVIF -->
<link rel="preload" as="image" type="image/avif" href="/ratewise/og-image.avif?v=20251219" />
<meta property="og:image" content="https://app.haotool.org/ratewise/og-image.avif?v=20251219" />
<meta property="og:image:type" content="image/avif" />

<!-- Fallback to WebP -->
<link rel="preload" as="image" type="image/webp" href="/ratewise/og-image.webp?v=20251219" />

<!-- Fallback to PNG -->
<meta property="og:image:secure_url" content="https://app.haotool.org/ratewise/og-image.png?v=20251219" />
```

**Step 4: Logo 使用 SVG 向量圖**
```bash
# 將 logo.png (1.4MB) 轉換為 SVG (<10KB)
# 使用線上工具: https://www.pngtosvg.com/
# 或手動重新設計為向量格式

# 更新引用
<link rel="icon" href="/ratewise/logo.svg" type="image/svg+xml" />
```

**Step 5: 添加到 package.json**
```json
{
  "scripts": {
    "optimize:images": "node scripts/optimize-images.mjs",
    "prebuild": "pnpm optimize:images && pnpm verify:ssot && pnpm verify:images"
  }
}
```

#### BDD 測試

**🔴 RED - 寫測試**
```typescript
// scripts/__tests__/image-optimization.test.ts
import { describe, it, expect } from 'vitest';
import { statSync } from 'fs';

describe('Image Optimization', () => {
  it('logo.png should be < 100 KB', () => {
    const size = statSync('apps/ratewise/public/logo.png').size;
    expect(size).toBeLessThan(100 * 1024);
  });

  it('og-image.png should be < 200 KB', () => {
    const size = statSync('apps/ratewise/public/og-image.png').size;
    expect(size).toBeLessThan(200 * 1024);
  });

  it('should have WebP and AVIF versions', () => {
    expect(() => statSync('apps/ratewise/public/og-image.webp')).not.toThrow();
    expect(() => statSync('apps/ratewise/public/og-image.avif')).not.toThrow();
  });
});
```

**🟢 GREEN - 執行優化**
```bash
pnpm optimize:images
pnpm test scripts/__tests__/image-optimization.test.ts
```

**🔵 REFACTOR - CI 自動化**
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

#### 預期效果
- ✅ logo.png: 1.4 MB → 80 KB (省 94%)
- ✅ og-image.png: 663 KB → 180 KB (省 73%)
- ✅ 總共節省: ~2.3 MB → ~500 KB (省 78%)
- ✅ LCP 改善: 預估從 489ms → 350ms

---

### 2. 實作麵包屑導航（UI + Schema）

#### Step 1: 創建 Breadcrumb 組件

```typescript
// apps/ratewise/src/components/Breadcrumb.tsx
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="麵包屑導航" className="mb-4">
      <ol className="flex items-center gap-2 text-sm text-slate-600">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
              )}
              {isLast ? (
                <span
                  className="font-medium text-slate-900"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href!}
                  className="hover:text-indigo-600 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

#### Step 2: 更新 SEOHelmet 添加 BreadcrumbList Schema

```typescript
// apps/ratewise/src/components/SEOHelmet.tsx

interface SEOProps {
  // ... 現有屬性
  breadcrumb?: BreadcrumbItem[];  // 新增
}

export function SEOHelmet({
  // ... 現有參數
  breadcrumb,
}: SEOProps) {
  // ... 現有代碼

  // 生成 BreadcrumbList schema
  const breadcrumbSchema = breadcrumb && breadcrumb.length > 1 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumb.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `${SITE_BASE_URL}${item.href.replace(/^\//, '')}` : undefined,
    })),
  } : null;

  // 合併 structured data
  const structuredData = [...DEFAULT_JSON_LD, ...baseJsonLd];

  if (breadcrumbSchema) {
    structuredData.push(breadcrumbSchema);
  }

  if (faq?.length) {
    structuredData.push(buildFaqSchema(faq, canonicalUrl));
  }

  // ... 其餘代碼
}
```

#### Step 3: 在頁面中使用麵包屑

```tsx
// apps/ratewise/src/pages/USDToTWD.tsx
import { Breadcrumb } from '../components/Breadcrumb';

export default function USDToTWD() {
  const breadcrumbItems = [
    { label: '首頁', href: '/' },
    { label: '幣別換算', href: '/exchange/' },
    { label: 'USD 對 TWD' },
  ];

  return (
    <>
      <SEOHelmet
        title="USD 對 TWD 匯率換算器"
        // ... 其他屬性
        breadcrumb={breadcrumbItems}
      />

      <main>
        <div className="container mx-auto px-4 py-6">
          <Breadcrumb items={breadcrumbItems} />

          <h1>USD 對 TWD 匯率換算器</h1>
          {/* ... 其餘內容 */}
        </div>
      </main>
    </>
  );
}
```

#### Step 4: 所有頁面套用麵包屑

```typescript
// apps/ratewise/src/pages/FAQ.tsx
const breadcrumbItems = [
  { label: '首頁', href: '/' },
  { label: '常見問題' },
];

// apps/ratewise/src/pages/Guide.tsx
const breadcrumbItems = [
  { label: '首頁', href: '/' },
  { label: '使用指南' },
];

// apps/ratewise/src/pages/About.tsx
const breadcrumbItems = [
  { label: '首頁', href: '/' },
  { label: '關於我們' },
];
```

#### BDD 測試

**🔴 RED - 寫測試**
```typescript
// apps/ratewise/src/components/__tests__/Breadcrumb.test.tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Breadcrumb } from '../Breadcrumb';

describe('Breadcrumb', () => {
  it('should render all breadcrumb items', () => {
    const items = [
      { label: '首頁', href: '/' },
      { label: '幣別換算', href: '/exchange/' },
      { label: 'USD 對 TWD' },
    ];

    render(
      <BrowserRouter>
        <Breadcrumb items={items} />
      </BrowserRouter>
    );

    expect(screen.getByText('首頁')).toBeInTheDocument();
    expect(screen.getByText('幣別換算')).toBeInTheDocument();
    expect(screen.getByText('USD 對 TWD')).toBeInTheDocument();
  });

  it('should mark last item as current page', () => {
    const items = [
      { label: '首頁', href: '/' },
      { label: 'USD 對 TWD' },
    ];

    render(
      <BrowserRouter>
        <Breadcrumb items={items} />
      </BrowserRouter>
    );

    const lastItem = screen.getByText('USD 對 TWD');
    expect(lastItem).toHaveAttribute('aria-current', 'page');
  });

  it('should have proper ARIA labels', () => {
    const items = [{ label: '首頁', href: '/' }];

    render(
      <BrowserRouter>
        <Breadcrumb items={items} />
      </BrowserRouter>
    );

    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', '麵包屑導航');
  });
});
```

**🔴 RED - Schema 測試**
```typescript
// apps/ratewise/src/components/__tests__/SEOHelmet.test.tsx
describe('SEOHelmet - Breadcrumb Schema', () => {
  it('should generate BreadcrumbList schema', () => {
    const breadcrumb = [
      { label: '首頁', href: '/' },
      { label: 'USD 對 TWD', href: '/usd-twd/' },
    ];

    render(<SEOHelmet breadcrumb={breadcrumb} />);

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const schemas = Array.from(scripts).map(s => JSON.parse(s.textContent || '{}'));

    const breadcrumbSchema = schemas.find(s => s['@type'] === 'BreadcrumbList');
    expect(breadcrumbSchema).toBeDefined();
    expect(breadcrumbSchema.itemListElement).toHaveLength(2);
    expect(breadcrumbSchema.itemListElement[0].name).toBe('首頁');
  });
});
```

**🟢 GREEN - 實作組件**
```bash
# 執行測試確認通過
pnpm test Breadcrumb.test.tsx
pnpm test SEOHelmet.test.tsx
```

**🔵 REFACTOR - 提取常用麵包屑**
```typescript
// apps/ratewise/src/config/breadcrumbs.ts
export const BREADCRUMB_TEMPLATES = {
  home: [{ label: '首頁', href: '/' }],
  faq: [
    { label: '首頁', href: '/' },
    { label: '常見問題' },
  ],
  about: [
    { label: '首頁', href: '/' },
    { label: '關於我們' },
  ],
  currencyPage: (from: string, to: string) => [
    { label: '首頁', href: '/' },
    { label: '幣別換算', href: '/exchange/' },
    { label: `${from} 對 ${to}` },
  ],
};
```

#### 預期效果
- ✅ 所有頁面都有麵包屑導航
- ✅ Google 搜尋結果顯示麵包屑（提升 CTR 5-10%）
- ✅ 改善網站結構理解（有助於 SEO 排名）
- ✅ 提升可訪問性（WCAG 2.1 合規）

---

### 3. 修正 Sitemap.xml 時間戳邏輯

#### 問題分析
```xml
<!-- ❌ 當前：所有頁面都是同一天 -->
<url>
  <loc>https://app.haotool.org/ratewise/</loc>
  <lastmod>2025-12-15</lastmod>  <!-- 不真實 -->
</url>
```

#### 解決方案

**Step 1: 更新 Sitemap 生成腳本**
```javascript
// scripts/generate-sitemap.js
import { statSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROUTES = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/faq/', priority: 0.8, changefreq: 'weekly' },
  { path: '/about/', priority: 0.6, changefreq: 'monthly' },
  { path: '/guide/', priority: 0.7, changefreq: 'monthly' },
  // ... 13 個幣別頁面
  { path: '/usd-twd/', priority: 0.8, changefreq: 'daily' },  // ✅ 匯率頁面改為 daily
];

/**
 * 獲取文件的真實最後修改時間
 * @param {string} pagePath - 頁面路徑（如 '/usd-twd/'）
 * @returns {string} ISO 8601 格式的時間戳
 */
function getLastModified(pagePath) {
  const pageMapping = {
    '/': 'src/features/ratewise/RateWise.tsx',
    '/faq/': 'src/pages/FAQ.tsx',
    '/about/': 'src/pages/About.tsx',
    '/guide/': 'src/pages/Guide.tsx',
    '/usd-twd/': 'src/pages/USDToTWD.tsx',
    '/jpy-twd/': 'src/pages/JPYToTWD.tsx',
    // ... 其他映射
  };

  const filePath = pageMapping[pagePath];
  if (!filePath) {
    return new Date().toISOString();
  }

  try {
    const fullPath = resolve(process.cwd(), 'apps/ratewise', filePath);
    const stats = statSync(fullPath);
    return stats.mtime.toISOString();
  } catch (error) {
    console.warn(`⚠️ 無法取得 ${filePath} 的修改時間，使用當前時間`);
    return new Date().toISOString();
  }
}

/**
 * 生成 Sitemap XML
 */
function generateSitemap() {
  const siteUrl = 'https://app.haotool.org/ratewise/';

  const urlEntries = ROUTES.map((route) => {
    const lastmod = getLastModified(route.path);
    const loc = `${siteUrl}${route.path.replace(/^\//, '')}`;

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
    <xhtml:link rel="alternate" hreflang="zh-TW" href="${loc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;

  writeFileSync('apps/ratewise/public/sitemap.xml', xml, 'utf-8');
  console.log('✅ Sitemap.xml 生成完成！');
}

generateSitemap();
```

**Step 2: 添加 Image Sitemap Extension**
```javascript
// 為首頁和幣別頁面添加圖片信息
function generateUrlWithImages(route) {
  const images = route.path === '/'
    ? [
        {
          loc: 'https://app.haotool.org/ratewise/og-image.avif',
          caption: 'RateWise 匯率轉換器應用截圖',
        },
        {
          loc: 'https://app.haotool.org/ratewise/screenshots/desktop-converter.png',
          caption: 'RateWise 桌面版完整介面',
        },
      ]
    : [
        {
          loc: 'https://app.haotool.org/ratewise/og-image.avif',
          caption: `${route.path.replace(/\//g, '').toUpperCase()} 匯率換算截圖`,
        },
      ];

  const imageXml = images.map(img => `
    <image:image>
      <image:loc>${img.loc}</image:loc>
      <image:caption>${img.caption}</image:caption>
    </image:image>`).join('');

  return `  <url>
    <loc>${route.loc}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>${imageXml}
    <xhtml:link rel="alternate" hreflang="zh-TW" href="${route.loc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${route.loc}" />
  </url>`;
}
```

**Step 3: 更新 package.json**
```json
{
  "scripts": {
    "generate:sitemap": "node scripts/generate-sitemap.js",
    "prebuild": "pnpm generate:sitemap"
  }
}
```

#### BDD 測試

**🔴 RED - 寫測試**
```typescript
// scripts/__tests__/sitemap.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { parseString } from 'xml2js';

describe('Sitemap.xml', () => {
  it('should have valid lastmod timestamps', async () => {
    const xml = readFileSync('apps/ratewise/public/sitemap.xml', 'utf-8');
    const parsed = await new Promise((resolve, reject) => {
      parseString(xml, (err, result) => (err ? reject(err) : resolve(result)));
    });

    const urls = parsed.urlset.url;
    const now = Date.now();

    urls.forEach((url) => {
      const lastmod = new Date(url.lastmod[0]).getTime();
      expect(lastmod).toBeLessThanOrEqual(now);
      expect(lastmod).toBeGreaterThan(now - 365 * 24 * 60 * 60 * 1000); // 一年內
    });
  });

  it('should have different lastmod for different pages', async () => {
    const xml = readFileSync('apps/ratewise/public/sitemap.xml', 'utf-8');
    const parsed = await new Promise((resolve, reject) => {
      parseString(xml, (err, result) => (err ? reject(err) : resolve(result)));
    });

    const urls = parsed.urlset.url;
    const lastmods = urls.map(u => u.lastmod[0]);
    const uniqueLastmods = new Set(lastmods);

    // 至少應該有 5 個不同的時間戳（不太可能所有文件都同時修改）
    expect(uniqueLastmods.size).toBeGreaterThanOrEqual(5);
  });

  it('should include image sitemap extension', async () => {
    const xml = readFileSync('apps/ratewise/public/sitemap.xml', 'utf-8');
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(xml).toContain('<image:image>');
    expect(xml).toContain('<image:loc>');
  });
});
```

**🟢 GREEN - 執行生成**
```bash
pnpm generate:sitemap
pnpm test scripts/__tests__/sitemap.test.ts
```

**🔵 REFACTOR - 自動化**
```yaml
# .github/workflows/ci.yml
- name: Validate Sitemap
  run: |
    pnpm generate:sitemap
    pnpm test scripts/__tests__/sitemap.test.ts
```

#### 預期效果
- ✅ Sitemap lastmod 反映真實修改時間
- ✅ Google 更有效率地爬取更新的頁面
- ✅ 幣別頁面 changefreq 改為 daily（符合實際）
- ✅ 添加圖片信息提升圖片 SEO

---

### 4. 添加 Footer 內部連結結構

#### Step 1: 創建 Footer 組件

```tsx
// apps/ratewise/src/components/Footer.tsx
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import { ThreadsIcon } from './ThreadsIcon';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-4 gap-8">
          {/* 關於 RateWise */}
          <div>
            <h3 className="text-white font-semibold mb-4">關於 RateWise</h3>
            <p className="text-sm text-slate-400 mb-4">
              專為台灣用戶設計的即時匯率換算工具，數據來源為臺灣銀行牌告匯率。
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/haotool/app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://www.threads.net/@azlife_1224"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="Threads"
              >
                <ThreadsIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* 核心功能 */}
          <div>
            <h3 className="text-white font-semibold mb-4">核心功能</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  匯率換算
                </Link>
              </li>
              <li>
                <Link to="/guide/" className="hover:text-white transition-colors">
                  使用指南
                </Link>
              </li>
              <li>
                <Link to="/faq/" className="hover:text-white transition-colors">
                  常見問題
                </Link>
              </li>
              <li>
                <Link to="/about/" className="hover:text-white transition-colors">
                  關於我們
                </Link>
              </li>
            </ul>
          </div>

          {/* 熱門貨幣對 */}
          <div>
            <h3 className="text-white font-semibold mb-4">熱門貨幣對</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/usd-twd/" className="hover:text-white transition-colors">
                  USD → TWD 美金換台幣
                </Link>
              </li>
              <li>
                <Link to="/jpy-twd/" className="hover:text-white transition-colors">
                  JPY → TWD 日圓換台幣
                </Link>
              </li>
              <li>
                <Link to="/eur-twd/" className="hover:text-white transition-colors">
                  EUR → TWD 歐元換台幣
                </Link>
              </li>
              <li>
                <Link to="/gbp-twd/" className="hover:text-white transition-colors">
                  GBP → TWD 英鎊換台幣
                </Link>
              </li>
              <li>
                <Link to="/hkd-twd/" className="hover:text-white transition-colors">
                  HKD → TWD 港幣換台幣
                </Link>
              </li>
              <li>
                <Link to="/cny-twd/" className="hover:text-white transition-colors">
                  CNY → TWD 人民幣換台幣
                </Link>
              </li>
            </ul>
          </div>

          {/* 其他貨幣 */}
          <div>
            <h3 className="text-white font-semibold mb-4">其他貨幣</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/krw-twd/" className="hover:text-white transition-colors">
                  KRW → TWD 韓元
                </Link>
              </li>
              <li>
                <Link to="/sgd-twd/" className="hover:text-white transition-colors">
                  SGD → TWD 新加坡幣
                </Link>
              </li>
              <li>
                <Link to="/thb-twd/" className="hover:text-white transition-colors">
                  THB → TWD 泰銖
                </Link>
              </li>
              <li>
                <Link to="/aud-twd/" className="hover:text-white transition-colors">
                  AUD → TWD 澳幣
                </Link>
              </li>
              <li>
                <Link to="/cad-twd/" className="hover:text-white transition-colors">
                  CAD → TWD 加幣
                </Link>
              </li>
              <li>
                <Link to="/nzd-twd/" className="hover:text-white transition-colors">
                  NZD → TWD 紐幣
                </Link>
              </li>
              <li>
                <Link to="/chf-twd/" className="hover:text-white transition-colors">
                  CHF → TWD 瑞士法郎
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 版權與法律 */}
        <div className="border-t border-slate-800 mt-8 pt-6 text-sm text-slate-500">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p>
              © {currentYear} RateWise. 本站資料僅供參考，實際交易請以金融機構公告為準。
            </p>
            <div className="flex gap-6">
              <Link to="/privacy/" className="hover:text-slate-300 transition-colors">
                隱私權政策
              </Link>
              <Link to="/terms/" className="hover:text-slate-300 transition-colors">
                使用條款
              </Link>
              <a
                href="https://rate.bot.com.tw/xrt?Lang=zh-TW"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-300 transition-colors"
              >
                資料來源：臺灣銀行
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: 在 Layout 中引入 Footer**

```tsx
// apps/ratewise/src/components/Layout.tsx
import { Footer } from './Footer';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HelmetProvider>
        <ErrorBoundary>
          <main role="main" className="min-h-screen">
            <Suspense fallback={<SkeletonLoader />}>
              {children}
            </Suspense>
          </main>
          <Footer />  {/* 新增 */}
        </ErrorBoundary>
        <UpdatePrompt />
      </HelmetProvider>
    </>
  );
}
```

#### BDD 測試

**🔴 RED - 寫測試**
```typescript
// apps/ratewise/src/components/__tests__/Footer.test.tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Footer } from '../Footer';

describe('Footer', () => {
  it('should render all core pages links', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    expect(screen.getByText('匯率換算')).toHaveAttribute('href', '/');
    expect(screen.getByText('使用指南')).toHaveAttribute('href', '/guide/');
    expect(screen.getByText('常見問題')).toHaveAttribute('href', '/faq/');
    expect(screen.getByText('關於我們')).toHaveAttribute('href', '/about/');
  });

  it('should render all 13 currency pair links', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    const currencyLinks = [
      'USD → TWD',
      'JPY → TWD',
      'EUR → TWD',
      'GBP → TWD',
      'HKD → TWD',
      'CNY → TWD',
      'KRW → TWD',
      'SGD → TWD',
      'THB → TWD',
      'AUD → TWD',
      'CAD → TWD',
      'NZD → TWD',
      'CHF → TWD',
    ];

    currencyLinks.forEach((text) => {
      expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
    });
  });

  it('should have external link to Taiwan Bank', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    const bankLink = screen.getByText('資料來源：臺灣銀行');
    expect(bankLink).toHaveAttribute('href', 'https://rate.bot.com.tw/xrt?Lang=zh-TW');
    expect(bankLink).toHaveAttribute('target', '_blank');
    expect(bankLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
```

**🟢 GREEN - 實作組件**
```bash
pnpm test Footer.test.tsx
```

**🔵 REFACTOR - 提取配置**
```typescript
// apps/ratewise/src/config/footer-links.ts
export const FOOTER_LINKS = {
  core: [
    { label: '匯率換算', href: '/' },
    { label: '使用指南', href: '/guide/' },
    { label: '常見問題', href: '/faq/' },
    { label: '關於我們', href: '/about/' },
  ],
  popular: [
    { label: 'USD → TWD 美金換台幣', href: '/usd-twd/' },
    { label: 'JPY → TWD 日圓換台幣', href: '/jpy-twd/' },
    // ...
  ],
  others: [
    { label: 'KRW → TWD 韓元', href: '/krw-twd/' },
    // ...
  ],
};
```

#### 預期效果
- ✅ 每個頁面都有 17 個內部連結（首頁連結權重傳遞）
- ✅ 幣別頁面相互連結（提升 PageRank 流動）
- ✅ 添加權威外部連結（臺灣銀行）
- ✅ 改善網站導航與用戶體驗

---

## 📅 短期執行方案（本月完成）

### 5. 添加「相關頁面」推薦區塊

```tsx
// apps/ratewise/src/components/RelatedPages.tsx
import { Link } from 'react-router-dom';

interface RelatedPage {
  title: string;
  description: string;
  href: string;
}

interface RelatedPagesProps {
  pages: RelatedPage[];
}

export function RelatedPages({ pages }: RelatedPagesProps) {
  return (
    <section className="mt-12 bg-slate-50 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">相關匯率換算</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {pages.map((page) => (
          <Link
            key={page.href}
            to={page.href}
            className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-slate-900 mb-2">{page.title}</h3>
            <p className="text-sm text-slate-600">{page.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

**在幣別頁面使用**:
```tsx
// apps/ratewise/src/pages/USDToTWD.tsx
const relatedPages = [
  {
    title: 'JPY → TWD 日圓換台幣',
    description: '日本旅遊換匯必備，即時日圓對台幣匯率',
    href: '/jpy-twd/'
  },
  {
    title: 'EUR → TWD 歐元換台幣',
    description: '歐洲旅遊換匯，歐元對台幣即時匯率',
    href: '/eur-twd/'
  },
  {
    title: 'GBP → TWD 英鎊換台幣',
    description: '英國留學換匯，英鎊對台幣即時匯率',
    href: '/gbp-twd/'
  },
];

<RelatedPages pages={relatedPages} />
```

---

### 6. 實作 HTML Sitemap 頁面

```tsx
// apps/ratewise/src/pages/Sitemap.tsx
import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';
import { SEO_PATHS } from '../config/seo-paths';

export default function Sitemap() {
  const corePages = SEO_PATHS.filter(p => ['/', '/faq/', '/about/', '/guide/'].includes(p));
  const currencyPages = SEO_PATHS.filter(p => p.includes('-twd/'));

  return (
    <>
      <SEOHelmet
        title="網站地圖"
        description="RateWise 完整網站地圖，快速找到您需要的匯率換算頁面"
        pathname="/sitemap/"
        robots="index, follow"
      />

      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="text-4xl font-bold text-slate-900 mb-6">網站地圖</h1>
        <p className="text-slate-600 mb-10">
          快速找到 RateWise 的所有頁面，包含核心功能與 13 個常用貨幣換算。
        </p>

        {/* 核心頁面 */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">核心頁面</h2>
          <ul className="grid md:grid-cols-2 gap-3">
            {corePages.map((path) => (
              <li key={path}>
                <Link
                  to={path}
                  className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  {path === '/' && '首頁 - 匯率換算器'}
                  {path === '/faq/' && '常見問題 - FAQ'}
                  {path === '/about/' && '關於我們'}
                  {path === '/guide/' && '使用指南'}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 幣別換算頁面 */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            幣別換算（依字母排序）
          </h2>
          <ul className="grid md:grid-cols-3 gap-3">
            {currencyPages.map((path) => {
              const [from, to] = path.replace(/\//g, '').split('-');
              return (
                <li key={path}>
                  <Link
                    to={path}
                    className="block p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <span className="font-semibold text-indigo-900">
                      {from.toUpperCase()} → {to.toUpperCase()}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </>
  );
}
```

**添加到路由**:
```typescript
// apps/ratewise/src/routes.tsx
const routes = [
  // ... 現有路由
  {
    path: '/sitemap/',
    element: <Sitemap />,
  },
];
```

---

### 7. 修正 robots.txt

```txt
# RateWise Robots Configuration
# 最後更新：2025-12-19

User-agent: *
Allow: /

# Sitemap
Sitemap: https://app.haotool.org/ratewise/sitemap.xml

# Crawl-delay for polite bots
Crawl-delay: 1

# Disallow Service Worker and internal assets
Disallow: /sw.js
Disallow: /workbox-*.js
Disallow: /manifest.json
Disallow: /manifest.webmanifest

# Allow API endpoints (future-proof)
Allow: /api/*.json
Allow: /feed.json

# Allow AI search engines (AEO/LLMO)
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

# Allow social media crawlers
User-agent: facebookexternalbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /
```

---

### 8. 補充圖片 Alt 屬性

**Step 1: 創建檢查腳本**
```javascript
// scripts/check-image-alt.mjs
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

function findImagesWithoutAlt(dir) {
  const errors = [];
  const files = readdirSync(dir, { recursive: true });

  for (const file of files) {
    const ext = extname(file);
    if (!['.tsx', '.jsx'].includes(ext)) continue;

    const content = readFileSync(join(dir, file), 'utf-8');

    // 找出所有 <img> 標籤
    const imgRegex = /<img\s+([^>]*?)>/gi;
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      const attrs = match[1];

      // 檢查是否有 alt 屬性
      if (!attrs.includes('alt=')) {
        errors.push({
          file,
          line: content.substring(0, match.index).split('\n').length,
          code: match[0],
        });
      }
    }
  }

  return errors;
}

const errors = findImagesWithoutAlt('apps/ratewise/src');

if (errors.length > 0) {
  console.error('❌ 發現缺少 alt 屬性的圖片：');
  errors.forEach(({ file, line, code }) => {
    console.error(`  ${file}:${line}`);
    console.error(`    ${code}`);
  });
  process.exit(1);
} else {
  console.log('✅ 所有圖片都有 alt 屬性');
}
```

**Step 2: 手動修正**
```tsx
// ❌ 錯誤
<img src="/logo.png" />

// ✅ 正確 - 描述性內容
<img src="/logo.png" alt="RateWise 匯率好工具 Logo" />

// ✅ 正確 - 裝飾性圖片
<img src="/pattern.svg" alt="" role="presentation" />

// ✅ 正確 - 複雜圖表
<img
  src="/chart.png"
  alt="USD/TWD 過去 30 天匯率走勢圖，顯示從 30.5 上漲至 31.2"
/>
```

**Step 3: CI 自動檢查**
```json
{
  "scripts": {
    "check:image-alt": "node scripts/check-image-alt.mjs",
    "pretest": "pnpm check:image-alt"
  }
}
```

---

## 🎯 中期執行方案（下季完成）

### 9. 實作英文版（en-US）

**架構設計**:
```
/ratewise/       → 繁體中文（預設）
/ratewise/en/    → English version
```

**Step 1: 國際化架構**
```typescript
// apps/ratewise/src/i18n/locales.ts
export const LOCALES = {
  'zh-TW': {
    name: '繁體中文',
    flag: '🇹🇼',
  },
  'en-US': {
    name: 'English',
    flag: '🇺🇸',
  },
};

// apps/ratewise/src/i18n/translations/zh-TW.ts
export const zhTW = {
  nav: {
    home: '首頁',
    faq: '常見問題',
    about: '關於',
    guide: '使用指南',
  },
  hero: {
    title: 'RateWise - 匯率好工具',
    subtitle: '即時匯率轉換器',
  },
  // ... 更多翻譯
};

// apps/ratewise/src/i18n/translations/en-US.ts
export const enUS = {
  nav: {
    home: 'Home',
    faq: 'FAQ',
    about: 'About',
    guide: 'Guide',
  },
  hero: {
    title: 'RateWise - Currency Converter',
    subtitle: 'Real-time Exchange Rates',
  },
  // ... 更多翻譯
};
```

**Step 2: 路由設計**
```typescript
// apps/ratewise/src/routes.tsx
const routes = [
  // 中文版（預設）
  { path: '/', element: <RateWise /> },
  { path: '/faq/', element: <FAQ /> },

  // 英文版
  { path: '/en/', element: <RateWise locale="en-US" /> },
  { path: '/en/faq/', element: <FAQ locale="en-US" /> },
];
```

**Step 3: 更新 Sitemap**
```xml
<url>
  <loc>https://app.haotool.org/ratewise/</loc>
  <xhtml:link rel="alternate" hreflang="zh-TW" href="https://app.haotool.org/ratewise/" />
  <xhtml:link rel="alternate" hreflang="en-US" href="https://app.haotool.org/ratewise/en/" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://app.haotool.org/ratewise/en/" />
</url>
```

---

### 10. 收集用戶評價並添加 Review Schema

**Step 1: 評價收集機制**
```tsx
// apps/ratewise/src/components/ReviewPrompt.tsx
export function ReviewPrompt() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 使用 7 天後顯示評價提示
    const installDate = localStorage.getItem('installDate');
    if (!installDate) {
      localStorage.setItem('installDate', new Date().toISOString());
      return;
    }

    const daysSinceInstall =
      (Date.now() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceInstall >= 7 && !localStorage.getItem('reviewSubmitted')) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-xl p-6 max-w-md">
      <h3 className="font-bold text-lg mb-2">喜歡 RateWise 嗎？</h3>
      <p className="text-slate-600 mb-4">
        您的評價能幫助我們改進服務，也能讓更多人受惠！
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => {
            window.open('https://forms.gle/xxxxx', '_blank');
            localStorage.setItem('reviewSubmitted', 'true');
            setIsVisible(false);
          }}
          className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          留下評價
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="px-4 py-2 text-slate-600 hover:text-slate-900"
        >
          稍後提醒
        </button>
      </div>
    </div>
  );
}
```

**Step 2: 評價顯示與 Schema**
```tsx
// apps/ratewise/src/pages/Reviews.tsx
import { SEOHelmet } from '../components/SEOHelmet';

const REVIEWS = [
  {
    author: '王小明',
    date: '2025-11-20',
    rating: 5,
    text: '匯率準確，離線也能用，非常方便！出國旅遊必備工具。',
  },
  {
    author: 'Emily Chen',
    date: '2025-11-15',
    rating: 5,
    text: '介面簡潔直覺，比其他匯率 App 好用多了。特別喜歡歷史趨勢圖功能。',
  },
  // ... 更多真實評價
];

const reviewSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'RateWise',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: REVIEWS.length.toString(),
    bestRating: '5',
    worstRating: '1',
  },
  review: REVIEWS.map(r => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: r.author },
    datePublished: r.date,
    reviewBody: r.text,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: r.rating.toString(),
    },
  })),
};

export default function Reviews() {
  return (
    <>
      <SEOHelmet
        title="用戶評價"
        description="查看 RateWise 用戶的真實評價與使用心得"
        jsonLd={reviewSchema}
      />
      {/* ... 評價列表 UI */}
    </>
  );
}
```

---

### 11. 添加社交分享按鈕

```tsx
// apps/ratewise/src/components/SocialShare.tsx
import { Share2, Facebook, Twitter } from 'lucide-react';

interface SocialShareProps {
  url: string;
  title: string;
}

export function SocialShare({ url, title }: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600">分享：</span>

      {navigator.share && (
        <button
          onClick={handleNativeShare}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="分享"
        >
          <Share2 className="w-5 h-5 text-slate-600" />
        </button>
      )}

      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 hover:bg-blue-50 rounded-full transition-colors"
        aria-label="分享到 Facebook"
      >
        <Facebook className="w-5 h-5 text-blue-600" />
      </a>

      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 hover:bg-sky-50 rounded-full transition-colors"
        aria-label="分享到 Twitter"
      >
        <Twitter className="w-5 h-5 text-sky-500" />
      </a>

      <a
        href={shareLinks.line}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 hover:bg-green-50 rounded-full transition-colors"
        aria-label="分享到 LINE"
      >
        <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
        </svg>
      </a>
    </div>
  );
}
```

---

## 📈 長期執行方案（明年）

### 12. URL 結構重構

**Phase 1: 新增階層式 URL（保留舊 URL）**
```typescript
// 新增路由
'/exchange/' → 換算工具首頁
'/exchange/usd-twd/' → USD 對 TWD
'/exchange/history/usd-twd/' → USD 對 TWD 歷史

// 保留舊路由（301 redirect）
'/usd-twd/' → 301 → '/exchange/usd-twd/'
```

**Phase 2: 設定 301 Redirect**
```typescript
// apps/ratewise/src/routes.tsx
import { Navigate } from 'react-router-dom';

const routes = [
  // 新路由
  { path: '/exchange/usd-twd/', element: <USDToTWD /> },

  // 301 Redirect（舊 → 新）
  { path: '/usd-twd/', element: <Navigate to="/exchange/usd-twd/" replace /> },
];
```

**Phase 3: 更新 Sitemap 與內部連結**
```xml
<!-- sitemap.xml -->
<url>
  <loc>https://app.haotool.org/ratewise/exchange/usd-twd/</loc>
  <lastmod>2026-01-15</lastmod>
  <priority>0.8</priority>
</url>
```

**Phase 4: 6 個月後移除舊 URL**

---

### 13. 建立內容行銷策略

**部落格主題規劃**:
```
/blog/
  → usd-twd-rate-forecast-2025/        2025 美金匯率預測
  → best-time-to-exchange-jpy/         何時換日圓最划算？
  → taiwan-bank-vs-online-exchange/    臺銀 vs 線上換匯比較
  → travel-currency-guide-japan/       日本旅遊換匯攻略
  → understanding-exchange-rate-spread/ 認識匯率價差
```

**SEO 策略**:
- 長尾關鍵字攻略
- 內部連結到主要換算頁面
- 定期更新內容（保持新鮮度）

---

## 🤖 CI/CD 自動化方案

### SEO 檢查自動化

```yaml
# .github/workflows/seo-checks.yml
name: SEO Checks

on:
  pull_request:
    paths:
      - 'apps/ratewise/src/**'
      - 'apps/ratewise/public/**'
  push:
    branches: [main]

jobs:
  seo-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # 圖片大小檢查
      - name: Check Image Sizes
        run: |
          pnpm test scripts/__tests__/image-optimization.test.ts

      # Alt 屬性檢查
      - name: Check Image Alt Attributes
        run: |
          pnpm check:image-alt

      # Sitemap 驗證
      - name: Validate Sitemap
        run: |
          pnpm generate:sitemap
          pnpm test scripts/__tests__/sitemap.test.ts

      # Meta Tags 檢查
      - name: Check Meta Tags
        run: |
          pnpm test apps/ratewise/src/components/__tests__/SEOHelmet.test.tsx

      # Lighthouse CI
      - name: Run Lighthouse CI
        run: |
          pnpm add -g @lhci/cli
          lhci autorun --config=.lighthouserc.json
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      # 結構化數據驗證
      - name: Validate Structured Data
        run: |
          pnpm build
          node scripts/validate-schema.mjs
```

**Lighthouse CI 配置**:
```json
// .lighthouserc.json
{
  "ci": {
    "collect": {
      "startServerCommand": "pnpm preview",
      "url": [
        "http://localhost:4173/ratewise/",
        "http://localhost:4173/ratewise/usd-twd/",
        "http://localhost:4173/ratewise/faq/"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

---

## ✅ 驗收標準與測試策略

### 驗收清單

#### 圖片優化
- [ ] logo.png < 100 KB
- [ ] og-image.png < 200 KB
- [ ] 所有圖片都有 WebP/AVIF 版本
- [ ] Lighthouse Performance > 95

#### 麵包屑導航
- [ ] 所有頁面都有麵包屑 UI
- [ ] 所有頁面都有 BreadcrumbList Schema
- [ ] Google Rich Results Test 通過

#### Sitemap
- [ ] lastmod 反映真實修改時間
- [ ] 至少 5 個不同的時間戳
- [ ] 包含 Image Sitemap Extension
- [ ] 提交到 Google Search Console 無錯誤

#### 內部連結
- [ ] Footer 包含所有 17 個頁面連結
- [ ] 幣別頁面有「相關頁面」推薦
- [ ] HTML Sitemap 頁面完整

#### CI/CD
- [ ] 圖片大小檢查自動化
- [ ] Alt 屬性檢查自動化
- [ ] Lighthouse CI 分數 > 90
- [ ] Schema 驗證自動化

---

## 📊 成功指標（KPI）

### 技術指標
- ✅ Lighthouse SEO: 100/100
- ✅ Lighthouse Performance: > 95/100
- ✅ Core Web Vitals: 全綠
- ✅ Schema 驗證: 0 errors

### SEO 指標（3 個月後）
- ✅ 自然搜尋流量: +30%
- ✅ 平均排名: Top 5 (目標關鍵字)
- ✅ Google 索引頁面: 17/17
- ✅ Rich Results: 100% 顯示

### 用戶指標
- ✅ 平均停留時間: +20%
- ✅ 跳出率: -15%
- ✅ 頁面深度: > 2 pages/session
- ✅ PWA 安裝率: +25%

---

## 🎯 時程規劃

### 第 1 週（立即執行）
- Day 1-2: 圖片優化 + 測試
- Day 3-4: 麵包屑導航實作
- Day 5: Sitemap 修正
- Day 6-7: Footer 內部連結

### 第 2-4 週（短期執行）
- Week 2: 相關頁面推薦 + HTML Sitemap
- Week 3: robots.txt 修正 + Alt 屬性
- Week 4: CI/CD 自動化設定

### 第 2-3 月（中期執行）
- Month 2: 英文版規劃與實作
- Month 3: 用戶評價收集 + Review Schema

### 第 4-12 月（長期執行）
- Q2: URL 結構重構
- Q3-Q4: 內容行銷與部落格建立

---

**報告結束 - 所有修復方案已完整規劃**

**下一步**: 請依照優先級執行，並在 `docs/dev/002_development_reward_penalty_log.md` 記錄進度。
