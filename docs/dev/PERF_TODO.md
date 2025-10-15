# RateWise 效能優化 TODO 清單

**建立時間**：2025-10-15T23:44:01+08:00  
**目標**：達成 Core Web Vitals「Good」門檻 + Lighthouse 四大分數 ≥ 90  
**方法論**：以 LCP、CLS、INP 三大主軸分組，逐項優化並驗證

---

## Core Web Vitals 目標

| 指標                                | 當前狀態    | 目標    | 門檻來源                                    |
| ----------------------------------- | ----------- | ------- | ------------------------------------------- |
| **LCP** (Largest Contentful Paint)  | 待測量      | ≤ 2.5s  | [web.dev/lcp](https://web.dev/articles/lcp) |
| **CLS** (Cumulative Layout Shift)   | 預估 < 0.05 | ≤ 0.1   | [web.dev/cls](https://web.dev/articles/cls) |
| **INP** (Interaction to Next Paint) | 待測量      | ≤ 200ms | [web.dev/inp](https://web.dev/articles/inp) |

**測量方法**：

1. **實驗室資料**：Lighthouse CI（每次 PR 自動執行）
2. **真實使用者資料**：PageSpeed Insights API（手動或定期執行）
3. **本地測試**：Chrome DevTools Performance 面板

---

## 📊 LCP 優化工單

### LCP-001：識別並優化 LCP 元素

**描述**：  
使用 Lighthouse 與 Chrome DevTools 識別頁面的 LCP 元素（通常是首屏最大的文字區塊或圖片），並針對性優化其載入速度。

**預估 LCP 元素**：

- 主標題 `<h1>匯率好工具</h1>`（文字）
- 或主要換算卡片（白色背景區塊）

**優化策略**：

1. ✅ 已完成：字體使用 `font-display: swap`
2. ✅ 已完成：無圖片元素，避免圖片載入延遲
3. ⏳ 待執行：確認關鍵 CSS 是否內聯或預載
4. ⏳ 待執行：測量實際 LCP 時間

**驗收標準**：

- Lighthouse LCP ≤ 2.5s（Good）
- Chrome DevTools Performance 面板顯示 LCP 時間戳記 < 2.5s

**預估效益**：LCP 改善 0.5-1.0 秒  
**風險評估**：低（僅調整資源載入順序）  
**預估工時**：2 小時  
**優先級**：P1（重要）

**參考資源**：

- [Optimize LCP](https://web.dev/articles/optimize-lcp)
- [Preload critical assets](https://web.dev/articles/preload-critical-assets)

---

### LCP-002：優化關鍵 CSS 載入

**描述**：  
分析 Tailwind 生成的 CSS 檔案大小，考慮將首屏關鍵 CSS 內聯到 `<head>`，或使用 `<link rel="preload">` 提高優先度。

**當前狀態**：

- Vite 自動產生 CSS 檔案並注入 `<link>` 標籤
- Tailwind 已配置 purge，生產環境 CSS 應該很小

**優化策略**：

1. 測量生產環境 CSS 檔案大小
2. 如果 < 14KB，考慮內聯到 HTML
3. 如果 > 14KB，使用 `<link rel="preload" as="style">`

**實作範例**：

```html
<!-- 方案 1：內聯關鍵 CSS（如果 < 14KB） -->
<head>
  <style>
    /* 內聯 Tailwind 關鍵 CSS */
  </style>
</head>

<!-- 方案 2：預載 CSS（如果 > 14KB） -->
<head>
  <link rel="preload" href="/assets/index-[hash].css" as="style" />
  <link rel="stylesheet" href="/assets/index-[hash].css" />
</head>
```

**驗收標準**：

- Lighthouse 不顯示「Eliminate render-blocking resources」警告
- LCP 時間改善

**預估效益**：LCP 改善 0.2-0.5 秒  
**風險評估**：低（Vite 已處理大部分優化）  
**預估工時**：2 小時  
**優先級**：P2（優化）

**參考資源**：

- [Critical CSS](https://web.dev/articles/extract-critical-css)
- [Vite CSS Code Splitting](https://vitejs.dev/guide/features.html#css-code-splitting)

---

### LCP-003：優化 Web 字體載入（如使用外部字體）

**描述**：  
如果未來引入 Google Fonts 或其他外部字體，需優化載入策略以避免 FOIT（Flash of Invisible Text）或 FOUT（Flash of Unstyled Text）。

**當前狀態**：

- ✅ 已新增 `preconnect` 到 `fonts.googleapis.com` 和 `fonts.gstatic.com`
- ✅ 已在 CSS 中設定 `font-display: swap`
- ⚠️ 實際未使用外部字體（Tailwind 配置使用 Noto Sans TC，但未明確載入）

**優化策略**：

1. 確認是否真的需要外部字體（系統字體堆疊更快）
2. 如需外部字體，使用 `font-display: optional` 而非 `swap`（避免佈局偏移）
3. 考慮自行託管字體檔案（避免第三方請求）

**實作範例**：

```css
/* 方案 1：使用系統字體堆疊（最快） */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif;

/* 方案 2：自行託管 + font-display: optional */
@font-face {
  font-family: 'Noto Sans TC';
  src: url('/fonts/NotoSansTC-Regular.woff2') format('woff2');
  font-display: optional;
  font-weight: 400;
}
```

**驗收標準**：

- 無 FOIT（文字不應該隱藏）
- 無 FOUT 導致的 CLS（佈局不應該跳動）
- Lighthouse 不顯示字體相關警告

**預估效益**：LCP 改善 0.1-0.3 秒，CLS 改善  
**風險評估**：低  
**預估工時**：1 小時  
**優先級**：P2（優化）

**參考資源**：

- [Font Best Practices](https://web.dev/articles/font-best-practices)
- [font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)

---

### LCP-004：實作資源優先度提示（Resource Hints）

**描述**：  
針對關鍵資源（如 API 端點、CDN）使用 `preconnect`、`dns-prefetch` 或 `prefetch` 提示，減少網路延遲。

**當前狀態**：

- ✅ 已新增 `preconnect` 到字體域名
- ⏳ 待執行：識別 API 端點並新增 `preconnect`

**優化策略**：

1. 識別臺灣銀行匯率 API 的域名
2. 新增 `<link rel="preconnect">` 到 `<head>`
3. 考慮對歷史匯率 API 使用 `dns-prefetch`（非關鍵路徑）

**實作範例**：

```html
<head>
  <!-- 關鍵 API：使用 preconnect -->
  <link rel="preconnect" href="https://rate.bot.com.tw" />

  <!-- 非關鍵 API：使用 dns-prefetch -->
  <link rel="dns-prefetch" href="https://api.example.com" />
</head>
```

**驗收標準**：

- Lighthouse 不顯示「Preconnect to required origins」警告
- Network 面板顯示 DNS 與 TCP 連線時間減少

**預估效益**：LCP 改善 0.1-0.2 秒  
**風險評估**：極低  
**預估工時**：30 分鐘  
**優先級**：P1（重要）

**參考資源**：

- [Resource Hints](https://web.dev/articles/preconnect-and-dns-prefetch)

---

## 📐 CLS 優化工單

### CLS-001：確保所有圖片有明確尺寸

**描述**：  
為所有 `<img>` 元素設定 `width` 和 `height` 屬性，或使用 CSS `aspect-ratio`，避免圖片載入時導致佈局偏移。

**當前狀態**：

- ✅ 無圖片元素，此項 N/A

**未來注意事項**：

- 如果新增貨幣國旗圖示，必須設定尺寸
- 如果新增使用者頭像或品牌 logo，必須設定尺寸

**實作範例**：

```tsx
// 方案 1：明確設定 width 和 height
<img
  src="/flags/usd.png"
  alt="USD"
  width={24}
  height={24}
/>

// 方案 2：使用 aspect-ratio（現代瀏覽器）
<img
  src="/flags/usd.png"
  alt="USD"
  className="w-6 aspect-square"
/>
```

**驗收標準**：

- Lighthouse CLS ≤ 0.1
- 無「Image elements do not have explicit width and height」警告

**預估效益**：CLS 保持 < 0.05  
**風險評估**：極低  
**預估工時**：N/A（當前無圖片）  
**優先級**：P0（必做，如新增圖片）

**參考資源**：

- [Optimize CLS](https://web.dev/articles/optimize-cls)
- [Image aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio)

---

### CLS-002：避免動態內容插入導致佈局偏移

**描述**：  
確保動態載入的內容（如匯率資料、廣告、通知橫幅）不會導致現有內容位移。

**當前狀態**：

- ✅ 匯率載入時顯示「載入中」文字，不會導致佈局偏移
- ✅ 無廣告或第三方嵌入內容
- ⚠️ 如果未來新增通知橫幅，需預留空間

**優化策略**：

1. 為動態內容預留固定高度的容器
2. 使用 CSS `min-height` 確保容器不會塌陷
3. 使用 loading skeleton 而非空白區域

**實作範例**：

```tsx
// 方案 1：預留固定高度
<div className="min-h-[200px]">{isLoading ? <Skeleton /> : <Content />}</div>;

// 方案 2：使用 loading skeleton
{
  isLoading ? (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  ) : (
    <Content />
  );
}
```

**驗收標準**：

- Playwright 視覺穩定性測試通過（標題位置偏移 < 50px）
- Lighthouse CLS ≤ 0.1

**預估效益**：CLS 保持 < 0.05  
**風險評估**：低  
**預估工時**：1 小時  
**優先級**：P1（重要）

**參考資源**：

- [Avoid layout shifts](https://web.dev/articles/optimize-cls#avoid-layout-shifts)

---

### CLS-003：優化字體載入策略（避免 FOUT）

**描述**：  
使用 `font-display: optional` 而非 `swap`，避免字體載入後文字重新渲染導致佈局偏移。

**當前狀態**：

- ✅ 已設定 `font-display: swap`
- ⚠️ 如果字體檔案較大，可能導致 FOUT 與 CLS

**優化策略**：

1. 改用 `font-display: optional`（字體載入失敗時使用系統字體）
2. 或使用 `font-display: swap` + `size-adjust` 確保字體尺寸一致

**實作範例**：

```css
/* 方案 1：optional（推薦） */
@font-face {
  font-family: 'Noto Sans TC';
  font-display: optional;
}

/* 方案 2：swap + size-adjust */
@font-face {
  font-family: 'Noto Sans TC';
  font-display: swap;
  size-adjust: 100%; /* 根據實際字體調整 */
}
```

**驗收標準**：

- Lighthouse CLS ≤ 0.1
- 無明顯的文字閃爍或位移

**預估效益**：CLS 改善 0.01-0.05  
**風險評估**：低  
**預估工時**：30 分鐘  
**優先級**：P2（優化）

**參考資源**：

- [font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
- [size-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust)

---

## ⚡ INP 優化工單

### INP-001：優化輸入框即時換算效能

**描述**：  
當使用者在輸入框輸入金額時，即時換算可能導致大量計算與 re-render，影響 INP。需使用 debounce 或節流優化。

**當前狀態**：

- ⚠️ 每次輸入都觸發換算（`onChange` 事件）
- ⚠️ 未使用 debounce 或節流

**優化策略**：

1. 使用 `useDeferredValue` 或 `useTransition`（React 19）延遲非緊急更新
2. 或使用 lodash `debounce` 延遲 300ms 執行換算
3. 考慮使用 Web Worker 執行複雜計算（如多幣別換算）

**實作範例**：

```tsx
// 方案 1：useDeferredValue（React 19）
const deferredAmount = useDeferredValue(fromAmount);
const result = calculateExchange(deferredAmount, rate);

// 方案 2：debounce
import { debounce } from 'lodash-es';

const debouncedCalculate = useMemo(
  () =>
    debounce((amount) => {
      setToAmount(calculateExchange(amount, rate));
    }, 300),
  [rate],
);

const handleFromAmountChange = (e) => {
  setFromAmount(e.target.value);
  debouncedCalculate(e.target.value);
};
```

**驗收標準**：

- Lighthouse INP ≤ 200ms
- Chrome DevTools Performance 面板顯示 Long Tasks < 50ms

**預估效益**：INP 改善 50-100ms  
**風險評估**：低（需測試使用者體驗是否受影響）  
**預估工時**：2 小時  
**優先級**：P1（重要）

**參考資源**：

- [Optimize INP](https://web.dev/articles/optimize-inp)
- [useDeferredValue](https://react.dev/reference/react/useDeferredValue)

---

### INP-002：減少不必要的 re-render

**描述**：  
使用 React DevTools Profiler 識別不必要的 re-render，並使用 `React.memo`、`useMemo`、`useCallback` 優化。

**當前狀態**：

- ⚠️ 未進行 re-render 分析
- ⚠️ 部分組件可能因父組件狀態變更而不必要地 re-render

**優化策略**：

1. 使用 React DevTools Profiler 記錄互動過程
2. 識別 re-render 次數過多的組件
3. 使用 `React.memo` 包裹純展示組件
4. 使用 `useMemo` 快取計算結果
5. 使用 `useCallback` 穩定函數引用

**實作範例**：

```tsx
// 方案 1：React.memo
const CurrencyItem = React.memo(({ currency, rate, onToggleFavorite }) => {
  return (
    <div>
      {currency}: {rate}
      <button onClick={() => onToggleFavorite(currency)}>★</button>
    </div>
  );
});

// 方案 2：useMemo
const sortedCurrencies = useMemo(() => {
  return currencies.sort((a, b) => a.name.localeCompare(b.name));
}, [currencies]);

// 方案 3：useCallback
const handleToggleFavorite = useCallback((currency) => {
  setFavorites((prev) =>
    prev.includes(currency) ? prev.filter((c) => c !== currency) : [...prev, currency],
  );
}, []);
```

**驗收標準**：

- React DevTools Profiler 顯示 re-render 次數減少 50%
- INP 改善

**預估效益**：INP 改善 20-50ms  
**風險評估**：低（需謹慎使用，避免過度優化）  
**預估工時**：3 小時  
**優先級**：P2（優化）

**參考資源**：

- [React.memo](https://react.dev/reference/react/memo)
- [useMemo](https://react.dev/reference/react/useMemo)
- [useCallback](https://react.dev/reference/react/useCallback)

---

### INP-003：避免長時間執行的 JavaScript 任務

**描述**：  
使用 Chrome DevTools Performance 面板識別 Long Tasks（> 50ms），並拆分為較小的任務或移至 Web Worker。

**當前狀態**：

- ⚠️ 未進行 Long Tasks 分析
- ⚠️ 多幣別換算可能涉及大量計算

**優化策略**：

1. 使用 `requestIdleCallback` 延遲非緊急任務
2. 使用 `setTimeout` 拆分長任務
3. 使用 Web Worker 執行複雜計算

**實作範例**：

```tsx
// 方案 1：requestIdleCallback
requestIdleCallback(() => {
  // 非緊急計算
  generateTrends();
});

// 方案 2：Web Worker
// worker.js
self.onmessage = (e) => {
  const { amount, rates } = e.data;
  const results = Object.entries(rates).map(([currency, rate]) => ({
    currency,
    amount: amount * rate,
  }));
  self.postMessage(results);
};

// 主執行緒
const worker = new Worker('/worker.js');
worker.postMessage({ amount, rates });
worker.onmessage = (e) => {
  setResults(e.data);
};
```

**驗收標準**：

- Chrome DevTools Performance 面板無 Long Tasks > 50ms
- Lighthouse INP ≤ 200ms

**預估效益**：INP 改善 50-150ms  
**風險評估**：中（Web Worker 增加複雜度）  
**預估工時**：4 小時  
**優先級**：P2（優化）

**參考資源**：

- [Optimize long tasks](https://web.dev/articles/optimize-long-tasks)
- [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

---

### INP-004：優化事件處理器效能

**描述**：  
確保所有事件處理器（如 `onClick`、`onChange`）執行時間 < 50ms，避免阻塞主執行緒。

**當前狀態**：

- ⚠️ 未測量事件處理器執行時間
- ⚠️ 部分處理器可能包含同步計算

**優化策略**：

1. 使用 Chrome DevTools Performance 面板測量
2. 將複雜計算移至 `useEffect` 或 `useMemo`
3. 使用 `startTransition` 標記非緊急更新

**實作範例**：

```tsx
// 方案 1：startTransition
import { startTransition } from 'react';

const handleModeChange = (newMode) => {
  // 緊急更新：立即執行
  setMode(newMode);

  // 非緊急更新：延遲執行
  startTransition(() => {
    generateTrends();
  });
};

// 方案 2：將計算移至 useEffect
const handleAmountChange = (e) => {
  setAmount(e.target.value); // 僅更新狀態
};

useEffect(() => {
  // 在下一個 render 週期計算
  const result = calculateExchange(amount, rate);
  setResult(result);
}, [amount, rate]);
```

**驗收標準**：

- 所有事件處理器執行時間 < 50ms
- Lighthouse INP ≤ 200ms

**預估效益**：INP 改善 20-50ms  
**風險評估**：低  
**預估工時**：2 小時  
**優先級**：P1（重要）

**參考資源**：

- [Optimize event handlers](https://web.dev/articles/optimize-inp#optimize-event-callbacks)
- [startTransition](https://react.dev/reference/react/startTransition)

---

## 🚀 其他效能優化工單

### PERF-001：實作 Code Splitting 與 Lazy Loading

**描述**：  
使用 React `lazy` 與 `Suspense` 延遲載入非首屏組件，減少初始 bundle 大小。

**當前狀態**：

- ✅ Vite 已配置 manualChunks 分離 vendor 與 UI
- ⏳ 待執行：識別可延遲載入的組件

**優化策略**：

1. 歷史匯率圖表（如有）使用 lazy loading
2. 設定頁面（如有）使用 lazy loading
3. 非關鍵的第三方庫（如 lightweight-charts）延遲載入

**實作範例**：

```tsx
// 延遲載入圖表組件
const MiniTrendChart = lazy(() => import('./components/MiniTrendChart'));

// 使用 Suspense 包裹
<Suspense fallback={<div>載入中...</div>}>
  <MiniTrendChart data={trend} />
</Suspense>;
```

**驗收標準**：

- 初始 bundle 大小減少 20%
- Lighthouse Performance 分數提升

**預估效益**：LCP 改善 0.3-0.5 秒  
**風險評估**：低  
**預估工時**：2 小時  
**優先級**：P2（優化）

**參考資源**：

- [Code Splitting](https://react.dev/reference/react/lazy)
- [Vite Code Splitting](https://vitejs.dev/guide/features.html#async-chunk-loading-optimization)

---

### PERF-002：實作 Service Worker 與快取策略

**描述**：  
使用 Service Worker 快取靜態資源與 API 回應，實現離線支援與更快的重複訪問。

**當前狀態**：

- ❌ 未實作 Service Worker
- ❌ 無快取策略

**優化策略**：

1. 使用 Vite PWA Plugin 自動產生 Service Worker
2. 快取策略：
   - 靜態資源（JS、CSS、字體）：Cache First
   - API 回應（匯率資料）：Network First with Cache Fallback
   - HTML：Network First
3. 實作「更新可用」通知

**實作範例**：

```ts
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/rate\.bot\.com\.tw\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'exchange-rates',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 小時
              },
            },
          },
        ],
      },
    }),
  ],
});
```

**驗收標準**：

- 離線時仍可顯示上次快取的匯率
- 重複訪問時載入時間 < 1 秒
- Lighthouse PWA 分數 > 90

**預估效益**：重複訪問 LCP 改善 1-2 秒  
**風險評估**：中（需測試快取策略）  
**預估工時**：8 小時  
**優先級**：P2（優化）

**參考資源**：

- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developer.chrome.com/docs/workbox)

---

### PERF-003：優化第三方腳本載入

**描述**：  
如果使用第三方腳本（如 Google Analytics、錯誤追蹤），需優化載入策略避免阻塞主執行緒。

**當前狀態**：

- ✅ 無第三方腳本（當前）
- ⏳ 待執行：如未來新增，需使用 `async` 或 `defer`

**優化策略**：

1. 使用 `<script async>` 或 `<script defer>`
2. 使用 Partytown 將第三方腳本移至 Web Worker
3. 延遲載入非關鍵腳本（如社群分享按鈕）

**實作範例**：

```html
<!-- 方案 1：async（不依賴 DOM） -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>

<!-- 方案 2：defer（依賴 DOM） -->
<script defer src="/analytics.js"></script>

<!-- 方案 3：Partytown -->
<script type="text/partytown" src="https://www.googletagmanager.com/gtag/js"></script>
```

**驗收標準**：

- Lighthouse 不顯示「Reduce the impact of third-party code」警告
- 第三方腳本不影響 LCP 與 INP

**預估效益**：LCP 改善 0.2-0.5 秒  
**風險評估**：低  
**預估工時**：1 小時  
**優先級**：P1（重要，如新增第三方腳本）

**參考資源**：

- [Efficiently load third-party JavaScript](https://web.dev/articles/efficiently-load-third-party-javascript)
- [Partytown](https://partytown.builder.io/)

---

### PERF-004：實作 RUM（Real User Monitoring）

**描述**：  
整合真實使用者監控工具（如 Google Analytics 4、Vercel Analytics），追蹤實際使用者的 Core Web Vitals。

**當前狀態**：

- ❌ 無 RUM 監控
- ❌ 僅依賴 Lighthouse 實驗室資料

**優化策略**：

1. 使用 `web-vitals` 庫收集 CWV 資料
2. 發送至 Google Analytics 4 或自訂後端
3. 建立 Dashboard 追蹤 75 分位數趨勢

**實作範例**：

```tsx
// main.tsx
import { onCLS, onINP, onLCP } from 'web-vitals';

function sendToAnalytics(metric) {
  // 發送至 GA4
  gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    metric_id: metric.id,
    metric_value: metric.value,
    metric_delta: metric.delta,
  });
}

onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
```

**驗收標準**：

- Dashboard 顯示 CWV 75 分位數資料
- 可追蹤不同裝置、瀏覽器、地區的效能差異

**預估效益**：提供持續優化依據  
**風險評估**：低  
**預估工時**：4 小時  
**優先級**：P2（優化）

**參考資源**：

- [web-vitals](https://github.com/GoogleChrome/web-vitals)
- [Send CWV to GA4](https://web.dev/articles/vitals-ga4)

---

## 📋 優化優先級總結

### Phase 1：立即執行（P0 + P1）

| 工單 ID  | 描述                         | 預估工時 | 預估效益        |
| -------- | ---------------------------- | -------- | --------------- |
| LCP-001  | 識別並優化 LCP 元素          | 2h       | LCP -0.5~1.0s   |
| LCP-004  | 實作資源優先度提示           | 0.5h     | LCP -0.1~0.2s   |
| INP-001  | 優化輸入框即時換算效能       | 2h       | INP -50~100ms   |
| INP-004  | 優化事件處理器效能           | 2h       | INP -20~50ms    |
| CLS-002  | 避免動態內容插入導致佈局偏移 | 1h       | CLS 保持 < 0.05 |
| PERF-003 | 優化第三方腳本載入（如有）   | 1h       | LCP -0.2~0.5s   |

**Phase 1 總工時**：8.5 小時  
**預期成果**：LCP ≤ 2.5s、CLS ≤ 0.1、INP ≤ 200ms

---

### Phase 2：持續優化（P2）

| 工單 ID  | 描述                                | 預估工時 | 預估效益           |
| -------- | ----------------------------------- | -------- | ------------------ |
| LCP-002  | 優化關鍵 CSS 載入                   | 2h       | LCP -0.2~0.5s      |
| LCP-003  | 優化 Web 字體載入                   | 1h       | LCP -0.1~0.3s      |
| CLS-003  | 優化字體載入策略                    | 0.5h     | CLS -0.01~0.05     |
| INP-002  | 減少不必要的 re-render              | 3h       | INP -20~50ms       |
| INP-003  | 避免長時間執行的 JavaScript 任務    | 4h       | INP -50~150ms      |
| PERF-001 | 實作 Code Splitting 與 Lazy Loading | 2h       | LCP -0.3~0.5s      |
| PERF-002 | 實作 Service Worker 與快取策略      | 8h       | 重複訪問 LCP -1~2s |
| PERF-004 | 實作 RUM 監控                       | 4h       | 持續優化依據       |

**Phase 2 總工時**：24.5 小時  
**預期成果**：Lighthouse 四大分數 ≥ 95、極致效能體驗

---

## 🔍 測量與驗證方法

### 1. Lighthouse CI（自動化）

```bash
# 本地執行
pnpm build
lhci autorun

# CI 環境（已配置）
# 每次 PR 自動執行，報告上傳至 GitHub Actions 工件
```

**門檻**：

- Performance ≥ 85
- Accessibility ≥ 85
- Best Practices ≥ 85
- SEO ≥ 85

---

### 2. Chrome DevTools Performance

```
1. 開啟 Chrome DevTools → Performance 面板
2. 點擊「Record」並執行關鍵操作（如輸入金額）
3. 停止錄製，分析：
   - LCP 時間戳記
   - Long Tasks（> 50ms）
   - Layout Shifts
   - Event Handler 執行時間
```

---

### 3. PageSpeed Insights（真實使用者資料）

```bash
# 手動測試
https://pagespeed.web.dev/

# API 批量測試
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://your-domain.com&key=YOUR_API_KEY"
```

---

### 4. Web Vitals 庫（RUM）

```tsx
import { onCLS, onINP, onLCP } from 'web-vitals';

onCLS(console.log);
onINP(console.log);
onLCP(console.log);
```

---

## 📊 效能基準線（待測量）

| 指標        | 目標    | 當前        | 差距 | 狀態      |
| ----------- | ------- | ----------- | ---- | --------- |
| LCP         | ≤ 2.5s  | TBD         | TBD  | ⏳ 待測量 |
| CLS         | ≤ 0.1   | 預估 < 0.05 | ✅   | ⏳ 待驗證 |
| INP         | ≤ 200ms | TBD         | TBD  | ⏳ 待測量 |
| FCP         | ≤ 1.8s  | TBD         | TBD  | ⏳ 待測量 |
| TTI         | ≤ 3.8s  | TBD         | TBD  | ⏳ 待測量 |
| TBT         | ≤ 200ms | TBD         | TBD  | ⏳ 待測量 |
| Speed Index | ≤ 3.4s  | TBD         | TBD  | ⏳ 待測量 |

**下一步**：執行 Lighthouse CI 建立基準線，並更新此表格。

---

## 📚 參考資源

### 官方文件

- [Core Web Vitals](https://web.dev/articles/vitals)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance)

### 優化指南

- [Optimize LCP](https://web.dev/articles/optimize-lcp)
- [Optimize CLS](https://web.dev/articles/optimize-cls)
- [Optimize INP](https://web.dev/articles/optimize-inp)
- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)

### 工具與庫

- [web-vitals](https://github.com/GoogleChrome/web-vitals)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [React Performance](https://react.dev/learn/render-and-commit)

---

**文件版本**：v1.0  
**下次更新**：執行 Lighthouse CI 後更新基準線與優先級  
**負責人**：@s123104
