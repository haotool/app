# SEO 完整審計檢核清單

> **最後更新**: 2025-12-07T03:00:00+08:00  
> **適用專案**: NihonName 皇民化改姓生成器  
> **版本**: v1.0.0

---

## 📋 檢核清單總覽

| 分類            | 完成度 | 狀態      |
| --------------- | ------ | --------- |
| A. 技術 SEO     | 95%    | 🟢 優秀   |
| B. On-page SEO  | 90%    | 🟢 優秀   |
| C. 內容策略     | 85%    | 🟢 優秀   |
| D. Off-page SEO | 50%    | 🟡 進行中 |
| E. 國際化 SEO   | 80%    | 🟢 優秀   |
| F. 監控與驗收   | 75%    | 🟡 進行中 |

---

## A. 技術 SEO（Technical SEO）

### A1. 可爬取、可索引、可理解（P0）✅

| 項目             | 狀態 | 驗證方式                                             | 備註               |
| ---------------- | ---- | ---------------------------------------------------- | ------------------ |
| 重要頁面返回 200 | ✅   | `curl -s -o /dev/null -w "%{http_code}" URL`         | 8/8 頁面通過       |
| robots.txt 正確  | ✅   | `curl https://app.haotool.org/nihonname/robots.txt`  | 允許所有爬蟲       |
| XML sitemap 存在 | ✅   | `curl https://app.haotool.org/nihonname/sitemap.xml` | 8 個 URL           |
| canonical 正確   | ✅   | 檢查 `<link rel="canonical">`                        | SEOHelmet 自動生成 |
| llms.txt 存在    | ✅   | `curl https://app.haotool.org/nihonname/llms.txt`    | AI 搜尋優化        |

**驗證指令**：

```bash
# 批次驗證所有頁面
for url in "https://app.haotool.org/nihonname/" \
           "https://app.haotool.org/nihonname/about" \
           "https://app.haotool.org/nihonname/guide" \
           "https://app.haotool.org/nihonname/faq" \
           "https://app.haotool.org/nihonname/history" \
           "https://app.haotool.org/nihonname/history/kominka" \
           "https://app.haotool.org/nihonname/history/shimonoseki" \
           "https://app.haotool.org/nihonname/history/san-francisco"; do
  echo -n "$url: "
  curl -s -o /dev/null -w "%{http_code}" "$url"
  echo ""
done
```

### A2. 網站架構與內鏈（P0-P1）✅

| 項目             | 狀態 | 備註                                 |
| ---------------- | ---- | ------------------------------------ |
| 資訊架構明確     | ✅   | 首頁 → 關於/指南/FAQ/歷史專區        |
| URL 結構短且可讀 | ✅   | `/guide`, `/faq`, `/history/kominka` |
| 麵包屑導航       | ✅   | BreadcrumbList JSON-LD               |
| 內鏈完整         | ✅   | 所有頁面互相連結                     |

### A3. 重複內容與參數治理（P1）✅

| 項目               | 狀態 | 備註                   |
| ------------------ | ---- | ---------------------- |
| canonical 自我指向 | ✅   | 每頁設置正確 canonical |
| 無重複內容         | ✅   | SSG 生成唯一頁面       |
| 無參數炸裂         | ✅   | 純靜態路由             |

### A4. 行動版與渲染（P0-P2）✅

| 項目           | 狀態 | 備註                             |
| -------------- | ---- | -------------------------------- |
| RWD 響應式設計 | ✅   | Tailwind CSS                     |
| SSG 預渲染     | ✅   | vite-react-ssg                   |
| 首屏內容可見   | ✅   | 無需 JavaScript 即可看到主要內容 |
| Service Worker | ✅   | PWA 離線支援                     |

### A5. Page Experience 與 Core Web Vitals（P1）🔄

| 指標           | 目標   | 當前狀態 | 驗證方式      |
| -------------- | ------ | -------- | ------------- |
| LCP            | <2.5s  | 🟢 通過  | Lighthouse CI |
| INP            | <200ms | 🟢 通過  | Lighthouse CI |
| CLS            | <0.1   | 🟢 通過  | Lighthouse CI |
| Performance    | >90    | 🟢 97+   | Lighthouse CI |
| Accessibility  | >90    | 🟢 97+   | Lighthouse CI |
| Best Practices | >90    | 🟢 100   | Lighthouse CI |
| SEO            | 100    | 🟢 100   | Lighthouse CI |

### A6. 結構化資料（Structured Data, P1-P2）✅

| Schema 類型    | 狀態 | 頁面        | 驗證方式          |
| -------------- | ---- | ----------- | ----------------- |
| WebApplication | ✅   | 所有頁面    | Rich Results Test |
| Organization   | ✅   | 所有頁面    | Rich Results Test |
| WebSite        | ✅   | 所有頁面    | Rich Results Test |
| BreadcrumbList | ✅   | 所有頁面    | Rich Results Test |
| FAQPage        | ✅   | /faq        | Rich Results Test |
| HowTo          | ✅   | /guide      | Rich Results Test |
| Article        | ✅   | /history/\* | Rich Results Test |
| ImageObject    | ✅   | 所有頁面    | Rich Results Test |

**驗證指令**：

```bash
# 檢查 JSON-LD 數量
curl -s "https://app.haotool.org/nihonname/" | grep -c 'application/ld+json'
# 預期結果: 5 (WebApplication, Organization, WebSite, BreadcrumbList, ImageObject)

curl -s "https://app.haotool.org/nihonname/faq" | grep -c 'application/ld+json'
# 預期結果: 6 (含 FAQPage)
```

### A7. 安全與品質（P0-P1）✅

| 項目       | 狀態 | 備註           |
| ---------- | ---- | -------------- |
| HTTPS      | ✅   | Cloudflare SSL |
| HSTS       | ✅   | Nginx 配置     |
| CSP        | ✅   | 安全標頭       |
| 無垃圾頁面 | ✅   | 純靜態內容     |

---

## B. On-page SEO（頁面層級）

### B1. 版面語意與可讀性（P0）✅

| 頁面       | H1                       | H2 數量 | 狀態 |
| ---------- | ------------------------ | ------- | ---- |
| 首頁       | 皇民化改姓運動姓名変換所 | 2       | ✅   |
| 關於       | 關於本站                 | 4       | ✅   |
| 指南       | 使用指南                 | 3       | ✅   |
| FAQ        | 常見問題                 | 4       | ✅   |
| 歷史專區   | 台灣歷史專區             | 3       | ✅   |
| 皇民化運動 | 皇民化運動               | 10+     | ✅   |
| 馬關條約   | 馬關條約                 | 10+     | ✅   |
| 舊金山和約 | 舊金山和約               | 10+     | ✅   |

### B2. Title / Meta（P0）✅

| 項目             | 狀態 | 範例                                           |
| ---------------- | ---- | ---------------------------------------------- |
| Title 唯一       | ✅   | "NihonName - 皇民化改姓生成器 \| 日式姓名查詢" |
| Meta description | ✅   | 每頁獨立描述，150-160 字元                     |
| OG Title         | ✅   | 社群分享優化                                   |
| OG Description   | ✅   | 社群分享優化                                   |
| OG Image         | ✅   | 1200x630 標準尺寸                              |
| Twitter Card     | ✅   | summary_large_image                            |

### B3. 內容品質與搜尋意圖（P0-P1）✅

| 意圖類型 | 頁面     | 狀態            |
| -------- | -------- | --------------- |
| 資訊型   | 歷史專區 | ✅ 完整歷史背景 |
| 工具型   | 首頁     | ✅ 姓氏轉換功能 |
| 導航型   | 關於/FAQ | ✅ 清楚的導航   |

### B4. 媒體與資產（P1）✅

| 項目             | 狀態 | 備註                      |
| ---------------- | ---- | ------------------------- |
| OG Image         | ✅   | 1200x630 PNG              |
| Favicon          | ✅   | 多尺寸 (16, 32, 192, 512) |
| Apple Touch Icon | ✅   | 180x180                   |
| 圖片 alt         | ✅   | 所有圖片含描述            |

---

## C. 內容策略（Content Strategy）

### C1. 關鍵字與主題地圖（P0）✅

**主題樹**：

```
皇民化改姓生成器 (Hub)
├── 姓氏查詢 (首頁)
├── 使用指南 (/guide)
├── 常見問題 (/faq)
├── 關於本站 (/about)
└── 歷史專區 (/history) (Hub)
    ├── 皇民化運動 (/history/kominka)
    ├── 馬關條約 (/history/shimonoseki)
    └── 舊金山和約 (/history/san-francisco)
```

**目標關鍵字**：
| 關鍵字 | 意圖 | 對應頁面 |
|--------|------|----------|
| 皇民化改姓 | 資訊型 | 首頁 |
| 日本名字生成器 | 工具型 | 首頁 |
| 日治時期改姓 | 資訊型 | 歷史專區 |
| 台灣日本姓氏 | 資訊型 | 首頁/歷史專區 |

### C2. 內容更新與佈局（P1）🔄

| 項目         | 狀態                    | 下次更新 |
| ------------ | ----------------------- | -------- |
| 姓氏資料庫   | ✅ 90+ 漢姓, 1700+ 記錄 | 持續擴充 |
| 諧音梗資料庫 | ✅ 500+ 筆              | 持續擴充 |
| FAQ 更新     | ✅ 17 個問題            | 按需更新 |
| 歷史專區     | ✅ 3 篇專文             | 可擴充   |

### C3. 品牌與信任（P1-P2）✅

| 項目         | 狀態 | 備註                  |
| ------------ | ---- | --------------------- |
| 關於我們     | ✅   | /about 頁面           |
| 作者資訊     | ✅   | haotool, @azlife_1224 |
| 聯絡方式     | ✅   | Email, Threads        |
| 資料來源引用 | ✅   | 歷史文獻標註          |

---

## D. Off-page SEO（外部信號）

### D1. 連結與數位公關（P1）🔄

| 項目        | 狀態 | 備註             |
| ----------- | ---- | ---------------- |
| GitHub 開源 | ✅   | haotool/app      |
| 社群連結    | ✅   | Threads, Twitter |
| 外部連結    | 🔄   | 持續建立         |

### D2. 品牌搜尋需求（P1-P2）🔄

| 項目              | 狀態 | 備註            |
| ----------------- | ---- | --------------- |
| 品牌詞: NihonName | 🔄   | 建立中          |
| 品牌詞: haotool   | 🔄   | 建立中          |
| 社群分發          | ✅   | ShareModal 組件 |

---

## E. 國際化 SEO（多語系）

### hreflang 配置（P1）✅

| 項目       | 狀態 | 備註     |
| ---------- | ---- | -------- |
| zh-TW 標記 | ✅   | 主要語言 |
| x-default  | ✅   | 預設版本 |

---

## F. 數據、監控與驗收

### F1. 指標體系（P0）✅

| 指標            | 工具                  | 狀態        |
| --------------- | --------------------- | ----------- |
| 收錄數          | Google Search Console | 🔄 待驗證   |
| 曝光/點擊       | Google Search Console | 🔄 待驗證   |
| Lighthouse 分數 | GitHub Actions CI     | ✅ 自動監控 |
| 頁面 HTTP 狀態  | SEO Health Check CI   | ✅ 自動監控 |

### F2. 監控清單（P1）✅

| 項目             | 頻率            | 自動化 |
| ---------------- | --------------- | ------ |
| Lighthouse CI    | 每次 PR         | ✅     |
| SEO Health Check | 每次部署 + 每日 | ✅     |
| sitemap 驗證     | 每次建置        | ✅     |

### F3. 實驗與迭代（P2）📋

| 實驗項目              | 狀態      | 優先級 |
| --------------------- | --------- | ------ |
| Title A/B 測試        | 📋 規劃中 | P2     |
| Meta Description 優化 | 📋 規劃中 | P2     |
| 內鏈錨文字測試        | 📋 規劃中 | P2     |

---

## 🛠️ 開發環境測試方法

### 煙火動畫測試

**方法 1：Chrome DevTools Sensors**

1. 開啟 DevTools (F12)
2. 點擊 More tools > Sensors
3. 選擇 Orientation 標籤
4. 快速改變 Alpha/Beta/Gamma 值模擬搖晃

**方法 2：Console 直接觸發**

```javascript
// 在開發環境的 Console 執行
// 需要先取得 React DevTools 中的 setActiveEgg 函數
// 或臨時修改 useEasterEggs.ts 降低觸發門檻
```

**方法 3：臨時降低觸發門檻**

```typescript
// 在 useEasterEggs.ts 中臨時修改
if (shakeCountRef.current >= 2 && !activeEgg) {
  // 原本是 10
  shakeCountRef.current = 0;
  triggerEgg('fireworks', 12000);
}
```

### JSON-LD 驗證

**方法 1：瀏覽器開發者工具**

```javascript
// 在 Console 執行
Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
  .map((s) => JSON.parse(s.textContent))
  .forEach((j) => console.log(j['@type'], j));
```

**方法 2：Google Rich Results Test**

- URL: https://search.google.com/test/rich-results
- 輸入頁面 URL 進行驗證

**方法 3：Schema.org Validator**

- URL: https://validator.schema.org/
- 貼上 JSON-LD 內容驗證

---

## 📊 schema-dts vs 手動 JSON-LD 評估

### 當前決策：不引入 schema-dts

**原因**：

1. ✅ 當前手動實現已足夠，34 個測試案例覆蓋所有 schema
2. ✅ 無額外依賴，bundle size 更小
3. ✅ 符合 Linus KISS 原則
4. ✅ vite.config.ts onPageRendered hook 是 2025 最佳實踐

**未來考量**：

- 若需要複雜 Graph 結構，可考慮引入 schema-dts
- 若 Schema.org 頻繁更新，類型安全更重要

### schema-dts 優點（備參）

```typescript
import type { WebApplication, WithContext } from 'schema-dts';

const app: WithContext<WebApplication> = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NihonName',
  // IDE 自動補全 + 類型檢查
};
```

---

## 🔄 待辦事項

### P0 - 立即執行

- [x] 所有頁面返回 200
- [x] JSON-LD 結構正確
- [x] Lighthouse SEO 100/100

### P1 - 本週完成

- [ ] 提交 sitemap 到 Google Search Console
- [ ] 驗證 Google 收錄狀態
- [ ] 添加 Google Analytics 4

### P2 - 下週規劃

- [ ] Title/Meta A/B 測試
- [ ] 建立外部連結
- [ ] 擴充歷史專區內容

---

## 📚 參考資源

- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org)
- [Web.dev](https://web.dev)
- [vite-react-ssg 文檔](https://github.com/daydreamer-riri/vite-react-ssg)
- [context7:/google/schema-dts](https://github.com/google/schema-dts)

---

**文檔維護者**: Agent (Linus 風格)  
**審核狀態**: ✅ 通過
