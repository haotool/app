# Next.js 遷移計劃（301 重定向策略）

**建立時間**: 2025-10-18  
**狀態**: 📋 規劃中（Spike Phase）  
**Linus 判斷**: 暫不全量遷移，僅針對內容 SEO 需求建立 Next.js App Router spike

---

## 決策摘要

### ❌ 不建議立即全量遷移的原因

1. **現況已優化**: Vite 7 + React 19 + PWA 已達生產就緒
2. **工具型應用**: RateWise 主體是單頁工具，SSR/ISR 邊際效益有限
3. **遷移成本 > 收益**: 路由、資料抓取、RSC 邊界、PWA 行為差異需全面重構
4. **風險高**: URL 變更、SEO 波動、用戶體驗中斷風險

### ✅ 適用場景（觸發遷移門檻）

僅當滿足以下任一條件時，才啟動遷移：

- **多頁內容需求**: 需要部落格/文件/FAQ 等內容頁面，SEO 為核心流量來源
- **SSR/ISR 需求**: 個人化內容、A/B 測試、敏感 token 代理需要 Edge 中介層
- **App Router RSC**: 明確的 TTI/LCP 收益證據（需 Lighthouse 對比測試）

---

## 共存策略（推薦）

採用「絞殺者模式」（Strangler Fig Pattern）逐步遷移：

```
ratewise.app/           → Vite App (主應用，工具功能)
ratewise.app/blog/*     → Next.js App (內容頁面)
ratewise.app/docs/*     → Next.js App (文檔頁面)
ratewise.app/about      → Next.js App (靜態頁面)
```

### 技術架構

```
┌─────────────────────────────────────────┐
│  Cloudflare (CDN + Workers)             │
│  ├─ WAF / DDoS / Rate Limiting          │
│  └─ Routing Rules:                      │
│     ├─ / → ratewise-vite (主應用)       │
│     └─ /blog/* → ratewise-next (內容)   │
└─────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼────┐          ┌─────▼─────┐
   │ Vite    │          │ Next.js   │
   │ (Tool)  │◄────────►│ (Content) │
   │ Port:80 │  iframe/ │ Port:3000 │
   └─────────┘  API call└───────────┘
```

### 部署配置

#### Cloudflare Workers 路由

```javascript
// cloudflare-router.js
export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Route to Next.js for content paths
    if (
      url.pathname.startsWith('/blog') ||
      url.pathname.startsWith('/docs') ||
      url.pathname === '/about'
    ) {
      return fetch('https://ratewise-next.vercel.app' + url.pathname);
    }

    // Default to Vite app
    return fetch('https://ratewise-vite.pages.dev' + url.pathname);
  },
};
```

---

## 301 重定向計劃

### 如果未來決定全量遷移

#### 階段一：內容頁先行（無風險）

新增頁面，無需 301：

```
/blog/*     (新增)
/docs/*     (新增)
/about      (新增)
```

#### 階段二：主應用遷移（高風險）

需要 301 重定向的路徑：

| 原 URL（Vite）          | 新 URL（Next.js）       | 狀態碼           | 優先級 |
| ----------------------- | ----------------------- | ---------------- | ------ |
| `/`                     | `/`                     | 200 (直接遷移)   | P0     |
| `/?mode=multi`          | `/?mode=multi`          | 200 (保留 query) | P0     |
| `/favicon.ico`          | `/favicon.ico`          | 200 (靜態資源)   | P1     |
| `/pwa-*.png`            | `/pwa-*.png`            | 200 (PWA icons)  | P1     |
| `/manifest.webmanifest` | `/manifest.webmanifest` | 200 (PWA)        | P0     |

#### Next.js 重定向配置

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 保留 Vite app 的舊路徑（如果有變更）
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true, // 301
      },
    ];
  },
};

export default nextConfig;
```

---

## SEO 保護策略

### Pre-Migration 檢查清單

- [ ] Google Search Console 驗證所有權
- [ ] 記錄當前 SEO 指標（排名/流量/索引數）
- [ ] 備份 Sitemap 與 robots.txt
- [ ] 設定 Google Analytics 4 事件追蹤

### During Migration

- [ ] 實施 301 重定向（避免 302）
- [ ] 保留原 URL 結構（避免變更）
- [ ] 提交新 Sitemap 到 Search Console
- [ ] 監控 Search Console「覆蓋範圍」報告

### Post-Migration 監控（30 天）

- [ ] 每日檢查流量變化（允許 ±10% 波動）
- [ ] 監控 404 錯誤率（應 ≤ 1%）
- [ ] 檢查索引狀態（新 URL 被索引）
- [ ] Core Web Vitals 無顯著退化

---

## 回滾計劃

### Cloudflare Workers 快速回滾

```javascript
// 一鍵回滾：移除 Next.js 路由
export default {
  async fetch(request) {
    // Route all traffic back to Vite
    return fetch('https://ratewise-vite.pages.dev' + new URL(request.url).pathname);
  },
};
```

### DNS 回滾（慢速，TTL 依賴）

```
A record: ratewise.app → Vite server IP (原始)
```

---

## 成本效益分析

### 全量遷移成本

| 項目             | 估計工時 | 風險等級   |
| ---------------- | -------- | ---------- |
| 路由遷移         | 16h      | 🟠 Medium  |
| 資料抓取改寫     | 24h      | 🔴 High    |
| PWA 重新配置     | 16h      | 🔴 High    |
| 測試（E2E/Unit） | 32h      | 🟡 Low     |
| SEO 驗證與監控   | 16h      | 🟠 Medium  |
| **總計**         | **104h** | **高風險** |

### 共存策略成本

| 項目                    | 估計工時 | 風險等級   |
| ----------------------- | -------- | ---------- |
| Next.js 內容頁 scaffold | 8h       | 🟢 Low     |
| Cloudflare routing      | 4h       | 🟢 Low     |
| 部署設定                | 4h       | 🟢 Low     |
| **總計**                | **16h**  | **低風險** |

**Linus 建議**: 共存策略工時僅 15%，風險可控，ROI 更高。

---

## Spike 驗證項目

### 技術驗證

- [ ] Next.js 15 App Router SSG 頁面
- [ ] Metadata API（title/description/og）
- [ ] ISR 範例（revalidate: 3600）
- [ ] Sitemap.xml 與 robots.txt 生成
- [ ] Lighthouse SEO ≥ 95

### 整合驗證

- [ ] Vite app 嵌入 Next.js 內容（iframe 或 API）
- [ ] Cloudflare Workers 路由正確分流
- [ ] 無跨域問題（CORS）
- [ ] 共享 analytics（GA4 同一 property）

---

## 時間軸

### Phase 0: Spike（1 週）

- Day 1-2: 建立 `apps/ratewise-next` scaffold
- Day 3-4: 實作 SSG/ISR 範例頁面
- Day 5: Lighthouse 驗證 + 整合測試
- Day 6-7: 文檔與 demo 部署

### Phase 1: 內容頁上線（2 週）

- Week 1: 部落格/文件頁面開發
- Week 2: Cloudflare 路由 + 生產部署

### Phase 2: 全量遷移（僅當觸發門檻）

- **不建議**，除非滿足以下條件：
  - 內容頁流量佔 > 50%
  - SEO 排名證實 Next.js 效益顯著
  - 團隊已完全熟悉 App Router/RSC

---

## 參考資料

- [Next.js Incremental Migration](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [Strangler Fig Pattern](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Google SEO Migration Guide](https://developers.google.com/search/docs/advanced/crawling/site-move-with-url-changes)
- [Cloudflare Workers Routing](https://developers.cloudflare.com/workers/examples/route-requests/)

---

**結論**: 採用共存策略，針對內容 SEO 需求使用 Next.js，保留 Vite 主應用不動。避免不必要的全量重構風險。

**維護者**: Architecture Team  
**下次審查**: 2025-11-18
