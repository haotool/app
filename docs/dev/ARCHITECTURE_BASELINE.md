# 架構基線與目標藍圖

> **最後更新**: 2026-02-11T00:00:00+08:00
> **版本**: v3.0 (全面更新：加入狀態機、流程圖、最新架構)
> **狀態**: ✅ 現況完整，已達成大部分藍圖目標

---

## Linus 架構哲學

> "Bad programmers worry about the code. Good programmers worry about data structures and their relationships."
> — Linus Torvalds

**核心原則**：

1. **資料結構優先**：設計正確的資料結構，代碼自然簡潔
2. **消除特殊情況**：用資料結構消除 if/else 分支
3. **簡單的設計**：<3 層縮排，每個函數只做一件事

---

## 1. 現況架構（2026-02-11）✅

### 完整目錄結構

```
apps/ratewise/src/
├── App.tsx                         # 根應用，路由提供者
├── main.tsx                        # 入口點，SSG 配置
├── sw.ts                           # Service Worker (Workbox)
├── routes.tsx                      # vite-react-ssg 路由定義（SSOT）
│
├── components/                     # 通用 UI 元件
│   ├── AppLayout.tsx               # 底部導覽容器
│   ├── Layout.tsx                  # SEO 落地頁容器（OG meta）
│   ├── SEOHelmet.tsx               # meta 標籤管理
│   ├── ErrorBoundary.tsx           # 錯誤邊界
│   ├── OfflineIndicator.tsx        # PWA 離線狀態指示
│   ├── UpdatePrompt.tsx            # 版本更新提示
│   └── Toast/                      # 通知系統
│       ├── ToastContext.tsx
│       ├── ToastContainer.tsx
│       └── index.ts
│
├── features/
│   ├── ratewise/                   # 匯率轉換核心功能
│   │   ├── RateWise.tsx            # 主容器（功能調度）
│   │   ├── types.ts                # 型別定義（CurrencyCode 等）
│   │   ├── constants.ts            # CURRENCY_DEFINITIONS（51 種）
│   │   ├── storage.ts              # localStorage 抽象工具
│   │   ├── storage-keys.ts         # STORAGE_KEYS SSOT
│   │   ├── components/             # 功能 UI 元件
│   │   │   ├── SingleConverter.tsx
│   │   │   ├── MultiConverter.tsx
│   │   │   ├── FavoritesList.tsx
│   │   │   ├── CurrencyList.tsx
│   │   │   ├── RateDisplay.tsx
│   │   │   ├── TrendChart.tsx
│   │   │   └── HistoricalRateChart.tsx
│   │   └── hooks/
│   │       ├── useCurrencyConverter.ts  # 主邏輯 hook（~400 行）
│   │       ├── useExchangeRates.ts      # 匯率資料 hook
│   │       └── useHistoricalRates.ts    # 歷史匯率 hook
│   │
│   └── calculator/                 # 計算機功能
│       ├── components/
│       │   ├── Calculator.tsx
│       │   ├── CalculatorDisplay.tsx
│       │   └── CalculatorKeypad.tsx
│       ├── hooks/
│       │   ├── useCalculator.ts
│       │   ├── useCalculatorSync.ts
│       │   ├── useKeyboard.ts
│       │   ├── useHapticFeedback.ts
│       │   └── useCalculatorHistory.ts
│       ├── easter-eggs/            # 聖誕節彩蛋
│       └── utils/
│           ├── calculate.ts
│           ├── validateExpression.ts
│           └── haptic.ts
│
├── services/                       # 資料服務層
│   ├── exchangeRateService.ts      # 匯率 API（多層快取）
│   └── exchangeRateHistoryService.ts  # 歷史匯率服務
│
├── stores/
│   └── converterStore.ts           # Zustand 全域狀態（持久化）
│
├── config/                         # 配置 SSOT
│   ├── seo-paths.ts                # SEO 路徑清單
│   ├── animations.ts               # 轉場動畫配置
│   ├── design-tokens.ts            # 設計系統 Token SSOT
│   ├── themes.ts                   # 主題定義（Light/Dark/December）
│   ├── footer-links.ts             # Footer 連結
│   └── version.ts                  # 版本管理 SSOT
│
├── utils/                          # 共用工具函數（23+）
│   ├── exchangeRateCalculation.ts  # 匯率計算純函數
│   ├── offlineStorage.ts           # IndexedDB 雙重儲存
│   ├── networkStatus.ts            # 網路狀態偵測
│   ├── versionManager.ts           # PWA 版本管理
│   ├── timeFormatter.ts            # 時間格式化
│   ├── interactionBudget.ts        # INP 效能預算
│   ├── reportWebVitals.ts          # Core Web Vitals 上報
│   ├── requestId.ts                # Request ID 追蹤
│   ├── logger.ts                   # 結構化日誌
│   └── ...
│
├── hooks/                          # 全局 Hooks
│   ├── useAppTheme.ts              # 主題切換
│   ├── usePullToRefresh.ts         # 拉動刷新（PWA）
│   └── useDecemberTheme.ts         # 聖誕主題自動切換
│
├── pages/                          # 頁面（20 個 SSG 預渲染）
│   ├── index.tsx                   # 首頁 /
│   ├── MultiConverterPage.tsx      # /multi/
│   ├── FavoritesPage.tsx           # /favorites/
│   ├── SettingsPage.tsx            # /settings/
│   ├── FAQPage.tsx                 # /faq/
│   ├── AboutPage.tsx               # /about/
│   ├── GuidePage.tsx               # /guide/
│   └── currency/                   # 13 個幣別落地頁
│       ├── UsdTwdPage.tsx          # /usd-twd/
│       ├── JpyTwdPage.tsx          # /jpy-twd/
│       └── ...（共 13 個）
│
└── i18n/                           # 國際化
    ├── locales/
    │   ├── zh-TW.ts                # 繁體中文（主要）
    │   ├── en.ts                   # 英文
    │   └── ja.ts                   # 日文
    └── index.ts                    # i18next 初始化
```

---

## 2. 分層架構圖

```
┌─────────────────────────────────────────────────────┐
│                  Interface Layer                     │
│  pages/          components/        features/*/ui   │
│  ┌───────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ Pages │  │ AppLayout    │  │ SingleConverter│   │
│  │ (20)  │  │ Toast        │  │ MultiConverter │   │
│  │       │  │ Offline      │  │ FavoritesList  │   │
│  └───────┘  └──────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────┐
│                Application Layer                     │
│  stores/           features/*/hooks/                │
│  ┌──────────────┐  ┌─────────────────────────────┐  │
│  │converterStore│  │ useCurrencyConverter        │  │
│  │ (Zustand)    │  │ useExchangeRates             │  │
│  │              │  │ useHistoricalRates           │  │
│  └──────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────┐
│                  Service Layer                       │
│  services/                                          │
│  ┌─────────────────┐  ┌───────────────────────────┐ │
│  │exchangeRateService│  │exchangeRateHistoryService│ │
│  │ ├ localStorage  │  │ ├ GitHub raw CDN          │ │
│  │ ├ IndexedDB     │  │ └ 歷史數據快取             │ │
│  │ └ GitHub CDN    │  └───────────────────────────┘ │
│  └─────────────────┘                                │
└─────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────┐
│               Infrastructure Layer                   │
│  utils/            config/                          │
│  ┌──────────────┐  ┌───────────────────────────────┐ │
│  │offlineStorage│  │ design-tokens.ts (SSOT)       │ │
│  │networkStatus │  │ version.ts (SSOT)             │ │
│  │logger        │  │ seo-paths.ts (SSOT)           │ │
│  │requestId     │  │ animations.ts                 │ │
│  └──────────────┘  └───────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 3. 狀態管理架構

### 3.1 Zustand Store (`converterStore.ts`)

```
┌─────────────────────────────────────────────────────┐
│              useConverterStore (Zustand)             │
│                                                      │
│  State                   Actions                    │
│  ─────────────────────   ────────────────────────── │
│  fromCurrency: 'TWD'     setFromCurrency()          │
│  toCurrency:   'USD'     setToCurrency()            │
│  favorites:    []        swapCurrencies()           │
│  history:      []        addFavorite()              │
│                          removeFavorite()           │
│                          isFavorite()               │
│                          addToHistory()             │
│                          clearHistory()             │
│                                                      │
│  Persistence: localStorage ('ratewise-converter')   │
│  Partialize:  fromCurrency, toCurrency,             │
│               favorites, history                    │
└─────────────────────────────────────────────────────┘
```

### 3.2 Local State (`useCurrencyConverter.ts`)

```
┌─────────────────────────────────────────────────────┐
│           useCurrencyConverter Hook State            │
│                                                      │
│  UI State                Derived State              │
│  ──────────────────────  ──────────────────────────  │
│  mode: 'single'|'multi'  rate (計算值)               │
│  fromAmount: string      multiAmounts (Map)         │
│  toAmount: string        trends (歷史趨勢)           │
│  favorites: CurrencyCode[]                          │
│  history: ConversionHistoryEntry[]                  │
│  activeField: 'from'|'to'                           │
│                                                      │
│  localStorage: STORAGE_KEYS.* (6 個 keys)           │
└─────────────────────────────────────────────────────┘
```

### 3.3 狀態流向圖

```
User Action
    │
    ▼
[UI Component]
    │ dispatch action
    ▼
[useCurrencyConverter Hook]
    │                    │
    ├─ UI State ─────────┤
    │  (local useState)  │
    │                    │
    ├─ Persist ──────────► localStorage (6 keys)
    │
    ▼
[useConverterStore (Zustand)]
    │
    └─ Persist ──────────► localStorage ('ratewise-converter')
```

---

## 4. 匯率數據狀態機

### 4.1 資料載入狀態機

```
                        初始化
                          │
                          ▼
                    ┌─────────────┐
                    │   IDLE      │
                    └──────┬──────┘
                           │ fetchRates()
                           ▼
            ┌──────────────────────────────┐
            │         LOADING              │
            └──────┬───────────────────────┘
                   │                │
         成功      │                │ 失敗
                   ▼                ▼
         ┌─────────────┐    ┌──────────────┐
         │   FRESH     │    │ STALE_CACHE  │
         │ (< 5 分鐘)  │    │ (localStorage│
         └──────┬──────┘    │  或 IDB 快取)│
                │            └──────┬───────┘
        5 分鐘後 │                   │ 無快取
                ▼                   ▼
         ┌─────────────┐    ┌──────────────┐
         │    STALE    │    │   FALLBACK   │
         │  (需更新)   │    │  (硬編碼匯率) │
         └─────────────┘    └──────────────┘
```

### 4.2 快取層級狀態

```
請求匯率
   │
   ├── 1. localStorage 快取 (<5分鐘)? ──YES──► 返回快取
   │                                            (最快，~0ms)
   │   NO
   │
   ├── 2. 發出網路請求 (GitHub raw CDN)
   │       │
   │       ├── 成功 ──► 更新 localStorage + IndexedDB
   │       │            ► 返回新鮮數據
   │       │
   │       └── 失敗
   │           │
   │           ├── 3. IndexedDB 快取有資料? ──YES──► 返回 IDB 資料
   │           │                                    （離線保護）
   │           │   NO
   │           │
   │           └── 4. 使用 FALLBACK_RATES
   │                   （硬編碼近似值）
   │
   ▼
最終資料（不論來源）→ 更新 UI
```

### 4.3 網路狀態機

```
              App 啟動
                 │
                 ▼
          ┌─────────────┐
          │   ONLINE    │◄────── 網路恢復
          └──────┬──────┘
                 │ 失去網路
                 ▼
          ┌─────────────┐
          │   OFFLINE   │
          └──────┬──────┘
                 │ 顯示 OfflineIndicator
                 │ 10 秒後自動關閉
                 │ 同次 session 不重複顯示
                 ▼
          ┌─────────────┐
          │  INDICATOR  │
          │  DISMISSED  │
          └─────────────┘
```

---

## 5. PWA 生命週期狀態機

```
                        Service Worker 安裝
                                │
                    ┌───────────┴──────────────┐
                    │                          │
                    ▼                          ▼
             ┌────────────┐           ┌────────────────┐
             │  INSTALLED │           │  WAITING       │
             │  (首次安裝) │           │  (有舊版 SW)   │
             └─────┬──────┘           └────────┬───────┘
                   │                            │ skipWaiting()
                   │                            │ 用戶確認更新
                   ▼                            ▼
             ┌────────────┐           ┌────────────────┐
             │  ACTIVATED │           │  CONTROLLING   │
             │  (控制頁面) │           │  (新版接管)     │
             └─────┬──────┘           └────────┬───────┘
                   │                            │
                   └────────────┬───────────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │    READY            │
                     │  ├ 預快取完成        │
                     │  ├ 離線可用          │
                     │  └ 更新提示顯示      │
                     └─────────────────────┘
```

---

## 6. 頁面路由流程圖

### 6.1 路由結構

```
/ (AppLayout)
├── / ──────────────────── RateWise (主頁，SingleConverter)
├── /multi/ ─────────────── MultiConverter 多幣別
├── /favorites/ ─────────── FavoritesList 收藏管理
├── /settings/ ──────────── Settings 設定
├── /faq/ ───────────────── FAQ 常見問題
├── /about/ ─────────────── About 關於
├── /guide/ ─────────────── Guide 使用指南
│
└── Currency Landing Pages (Layout - SEO Only)
    ├── /usd-twd/ ──────── USD/TWD 落地頁
    ├── /jpy-twd/ ──────── JPY/TWD 落地頁
    ├── /eur-twd/ ──────── EUR/TWD 落地頁
    └── ...（共 13 個幣別對）
```

### 6.2 頁面切換動畫狀態機

```
當前頁面 (VISIBLE)
     │
     │ 用戶點擊導覽
     ▼
EXIT_ANIMATION (離開動畫，~200ms)
     │
     ▼
ENTER_ANIMATION (進入動畫，~200ms)
     │
     ▼
新頁面 (VISIBLE)

動畫配置來源：src/config/animations.ts (SSOT)
```

---

## 7. 轉換計算流程圖

```
用戶輸入金額 (fromAmount)
        │
        ▼
  ┌───────────────────────────────┐
  │  useCurrencyConverter Hook    │
  │                               │
  │  1. 取得匯率 getExchangeRate() │
  │     fromCurrency → TWD (基準) │
  │     toCurrency   → TWD (基準) │
  │                               │
  │  2. 計算換算率                 │
  │     rate = rates[from] /      │
  │            rates[to]          │
  │                               │
  │  3. 計算換算結果               │
  │     result = amount * rate    │
  │                               │
  │  4. 更新 toAmount             │
  └───────────────────────────────┘
        │
        ▼
  顯示結果 (toAmount)
        │
        ├── SingleConverter: 雙向計算
        └── MultiConverter: 一對多並行計算
              │
              └── CURRENCY_CODES.map(code =>
                    amount * (rates[from] / rates[code]))
```

---

## 8. SSG 建置流程

```
pnpm build
    │
    ▼
Vite 8 + vite-react-ssg
    │
    ├── 1. 讀取 seo-paths.config.mjs (SSOT)
    │      ► 20 條 SEO 路徑
    │
    ├── 2. 每條路徑渲染靜態 HTML
    │      ► React 元件 → HTML 字串
    │      ► 注入 meta 標籤 (SEOHelmet)
    │      ► 生成 JSON-LD 結構化資料
    │
    ├── 3. 生成輔助文件
    │      ► sitemap.xml（從 seo-paths 自動）
    │      ► robots.txt
    │      ► llms.txt（AI 搜尋優化）
    │      ► og-image.png
    │
    ├── 4. 資源優化
    │      ► gzip + brotli 壓縮
    │      ► 圖片優化 (sharp)
    │      ► 程式碼拆分 (code splitting)
    │
    └── 5. Service Worker 生成
           ► Workbox (injectManifest 策略)
           ► 預快取清單 (包含 *.json)
           ► 離線 fallback 設定
```

---

## 9. 設計系統架構

### 9.1 Token 層級

```
design-tokens.ts (SSOT)
        │
        ├── colorTokens
        │   ├── surface.*      (背景色)
        │   ├── text.*         (文字色)
        │   ├── primary.*      (主色)
        │   ├── destructive.*  (危險操作)
        │   └── success.*      (成功狀態)
        │
        ├── spacingTokens     (間距系統)
        ├── typographyTokens  (字型系統)
        ├── breakpointTokens  (斷點系統)
        └── calculatorColors  (計算機按鍵色系)
            ├── digit         (數字鍵)
            ├── operator      (運算符)
            └── confirm       (確認鍵)
```

### 9.2 主題切換狀態機

```
              App 啟動
                 │
                 ├── 12月1日至1月6日? ──YES──► DECEMBER_THEME
                 │                             (雪花動畫+聖誕色)
                 │   NO
                 │
                 ├── 用戶設定 = 'dark'? ──YES──► DARK_THEME
                 │
                 ├── 用戶設定 = 'light'? ──YES──► LIGHT_THEME
                 │
                 └── 系統偏好? ──────────────► SYSTEM_THEME
                     (prefers-color-scheme)
```

---

## 10. CI/CD 流程圖

```
git push (main)
    │
    ▼
GitHub Actions
    │
    ├── ci.yml (並行執行)
    │   ├── lint (ESLint 9)
    │   ├── typecheck (TypeScript 5.6)
    │   ├── test (Vitest 4 + Playwright)
    │   └── build (Vite 8 SSG)
    │         │
    │         ▼
    │   build artifacts
    │         │
    │   ├── seo-production.yml
    │   │   └── 驗證 29 條路由的 SEO 指標
    │   │
    │   └── release.yml (tag push)
    │       ├── changeset version
    │       ├── CHANGELOG 生成
    │       └── GitHub Release
    │
    ├── update-latest-rates.yml (每日定時)
    │   └── 更新 data 分支 /public/rates/latest.json
    │
    └── update-historical-rates.yml (每日定時)
        └── 更新 data 分支 /public/rates/history/*.json
```

---

## 11. 里程碑狀態（更新版）

| 里程碑 | 內容                                   | 產出                     | 狀態      |
| ------ | -------------------------------------- | ------------------------ | --------- |
| M0     | 清理與基礎強化                         | 刪除死代碼、提升門檻     | ✅ 完成   |
| M1     | 建立 logger + Request ID 追蹤          | 結構化日誌               | ✅ 完成   |
| M2     | 依賴升級（Vite 8, Vitest 4, React 19） | 安全升級完成             | ✅ 完成   |
| M3     | 測試強化與 BDD 流程                    | 覆蓋率 ≥80%，E2E 穩定    | ✅ 完成   |
| M4     | 架構演進：多頁 SSG + 落地頁            | 20 頁 SSG 預渲染         | ✅ 完成   |
| M5     | PWA 離線優化（Safari 雙重儲存）        | IndexedDB + localStorage | ✅ 完成   |
| M6     | 計算機功能集成                         | Apple UX 風格計算機      | ✅ 完成   |
| M7     | 歷史匯率功能                           | 趨勢圖、歷史查詢         | ✅ 完成   |
| M8     | 多語言支援 (i18n)                      | zh-TW / en / ja          | ✅ 完成   |
| M9     | 設計系統 Token SSOT                    | design-tokens.ts         | ✅ 完成   |
| Next   | useCurrencyConverter 拆分（可選）      | 多個小 hook              | 📋 規劃中 |

---

## 12. 品質評分（2026-02-11）

| 維度             | 分數   | 評語                                          |
| ---------------- | ------ | --------------------------------------------- |
| **資料結構**     | 90/100 | 🟢 SSOT 設計完整，Zustand + localStorage 分層 |
| **特殊情況消除** | 85/100 | 🟢 CURRENCY_DEFINITIONS 消除大量 if/else      |
| **函數長度**     | 70/100 | 🟡 useCurrencyConverter ~400 行仍偏長         |
| **命名克制**     | 92/100 | 🟢 清晰、一致，無縮寫歧義                     |
| **測試覆蓋率**   | 80/100 | 🟢 達標 ≥80% 目標                             |
| **SSG/SEO**      | 95/100 | 🟢 20 頁 SSG，完整 sitemap + JSON-LD          |
| **PWA**          | 88/100 | 🟢 Safari 離線優化，雙重儲存                  |
| **CI/CD**        | 90/100 | 🟢 6 個 workflow，自動化程度高                |

---

## 13. Context7 架構參考

- [React 19 Hooks 最佳實踐](https://react.dev/reference/rules/rules-of-hooks) [ref: context7]
- [Zustand 持久化中間件](https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md) [ref: context7]
- [Vite SSG 最佳實踐](https://vite-react-ssg.netlify.app/) [ref: context7]
- [Workbox injectManifest 策略](https://developer.chrome.com/docs/workbox/modules/workbox-build/) [ref: context7]
- [Clean Code TypeScript](https://github.com/labs42io/clean-code-typescript) [業界最佳實踐]

---

更多細節請參考：

- [037_state_machine_flows.md](./037_state_machine_flows.md) - 完整狀態機規格
- [004_pwa_realtime_sync_architecture.md](./004_pwa_realtime_sync_architecture.md) - PWA 架構
- [001_exchange_rate_data_strategy.md](./001_exchange_rate_data_strategy.md) - 匯率數據策略

_本架構藍圖依照 Linus Torvalds 開發哲學產生，專注資料結構與簡潔設計。_
