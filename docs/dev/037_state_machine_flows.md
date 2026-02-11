# RateWise 狀態機與流程圖完整規格

> **建立時間**: 2026-02-11T00:00:00+08:00
> **版本**: v1.0
> **狀態**: ✅ 現況映射
> **適用版本**: ratewise v2.4.4+

---

## 概述

本文件記錄 RateWise 應用中所有主要狀態機與資料流程圖，作為開發、除錯和維護的參考依據。

---

## 1. 應用層級狀態機

### 1.1 App 啟動序列

```
App 啟動 (main.tsx)
     │
     ├── [SSG 模式] HTML 預渲染結果已就位
     │       │
     │       ▼
     │  React Hydration
     │       │
     │       ▼
     │  ┌─────────────────────┐
     │  │ useEffect (hydration)│
     │  │ ├ 從 localStorage 恢復用戶設定
     │  │ ├ fromCurrency, toCurrency
     │  │ ├ mode (single/multi)
     │  │ └ favorites, history
     │  └─────────────────────┘
     │
     ├── [SPA 模式] 直接渲染
     │
     ▼
Service Worker 初始化
     │
     ├── 首次訪問? ──YES──► 安裝 SW → 預快取資源
     │
     └── 已安裝?  ──YES──► 檢查更新
             │
             ├── 有新版本? ──YES──► 顯示 UpdatePrompt
             └── 無更新    ────────► 正常啟動
                                         │
                                         ▼
                                   匯率數據載入
                                   (exchangeRateService)
```

---

## 2. 匯率資料狀態機

### 2.1 完整資料載入狀態機 (useExchangeRates)

```
狀態：
  IDLE        - 初始狀態，尚未請求
  LOADING     - 網路請求中
  FRESH       - 資料新鮮（< 5 分鐘）
  STALE       - 資料過期（> 5 分鐘），仍可用
  STALE_CACHE - 使用快取資料（網路失敗）
  FALLBACK    - 使用硬編碼備援匯率
  ERROR       - 所有資料源均失敗

轉換規則：

IDLE ──fetchRates()──► LOADING

LOADING ──成功──► FRESH
        ──失敗──►
          ├── localStorage 快取存在? ──YES──► STALE_CACHE
          └── IDB 快取存在? ──YES──► STALE_CACHE
              └── 無任何快取 ──────────────► FALLBACK

FRESH ──5分鐘計時器──► STALE
FRESH ──手動刷新────► LOADING

STALE ──fetchRates()──► LOADING（背景更新）
STALE ──用戶可見────► 正常使用（顯示 stale 標記）

STALE_CACHE ──網路恢復──► LOADING
FALLBACK    ──網路恢復──► LOADING
```

### 2.2 快取優先策略流程

```
                   請求匯率數據
                        │
                        ▼
            ┌───────────────────────┐
            │ localStorage 快取     │
            │ key: 'exchange-rates' │
            └──────────┬────────────┘
                       │
               快取存在且 < 5分鐘?
                  ╱              ╲
                YES               NO
                ╱                  ╲
               ▼                    ▼
         返回快取資料          發起網路請求
         (最快路徑)             │
                           ┌────┴─────────────┐
                           │ GitHub raw CDN   │
                           │ /data/public/    │
                           │ rates/latest.json│
                           └────┬─────────────┘
                                │
                    請求成功?
                   ╱           ╲
                 YES             NO
                 ╱               ╲
                ▼                 ▼
         更新兩個快取        讀取 IndexedDB 快取
         ┌──────────┐        (saveExchangeRatesToIDB)
         │localStorage│            │
         │+ IndexedDB │       IDB 有資料?
         └─────┬──────┘       ╱        ╲
               │            YES          NO
               ▼             ╱            ╲
         返回新鮮資料       ▼              ▼
                      返回 IDB 資料    FALLBACK_RATES
                      (離線保護)      (硬編碼近似值)
```

---

## 3. 貨幣轉換狀態機

### 3.1 SingleConverter 輸入狀態機

```
狀態：
  IDLE          - 初始，顯示預設金額
  FROM_FOCUSED  - 用戶在 from 欄位輸入
  TO_FOCUSED    - 用戶在 to 欄位輸入
  CALCULATING   - 計算中（同步，極快）
  DISPLAYING    - 顯示結果

輸入流程：

IDLE ──tap from field──► FROM_FOCUSED
IDLE ──tap to field────► TO_FOCUSED

FROM_FOCUSED ──input change──► CALCULATING
                                    │
                                    ▼
                             rate = rates[from] / rates[to]
                             toAmount = fromAmount * rate
                                    │
                                    ▼
                               DISPLAYING

TO_FOCUSED ──input change──► CALCULATING (反向計算)
                                    │
                                    ▼
                             rate = rates[to] / rates[from]
                             fromAmount = toAmount * rate
                                    │
                                    ▼
                               DISPLAYING

任意狀態 ──swap button──► 交換 from/to
                           重新計算
                           DISPLAYING
```

### 3.2 MultiConverter 計算流程

```
選擇基準貨幣 (from)
     │
     ▼
輸入金額 (baseAmount)
     │
     ▼
CURRENCY_CODES.forEach(targetCode => {
    if (targetCode === from) return baseAmount;
    rate = rates[from] / rates[targetCode];
    display[targetCode] = baseAmount * rate;
})
     │
     ▼
渲染 CurrencyList（所有貨幣並行顯示）
     │
     ├── 已收藏貨幣 ──► 置頂顯示（橙色星星）
     └── 其他貨幣  ──► 依字母排序
```

### 3.3 收藏管理狀態機

```
狀態：
  UNFAVORITED - 未收藏
  FAVORITED   - 已收藏

操作：

UNFAVORITED ──點擊星星──► addFavorite(pair)
                              │
                          避免重複檢查
                          exists = favorites.some(...)
                              │
                          FAVORITED (存入 localStorage)

FAVORITED ──點擊星星──► removeFavorite(from, to)
                            │
                        過濾移除
                            │
                        UNFAVORITED (更新 localStorage)

收藏列表排序：
  - 按 timestamp 倒序（最近收藏在前）
  - 最多顯示無限量（無上限）

localStorage 持久化：
  key: 'ratewise-converter' (Zustand persist)
  fields: favorites[]
```

---

## 4. PWA 離線狀態機

### 4.1 網路連線狀態機

```
狀態：
  ONLINE   - 網路正常
  OFFLINE  - 離線
  UNKNOWN  - 初始化中

轉換：

UNKNOWN ──navigator.onLine check──► ONLINE | OFFLINE

ONLINE ──offline 事件──► OFFLINE
            │
            ▼
        顯示 OfflineIndicator
        ├─ 10 秒後自動消失
        └─ 同次 session 不再顯示（sessionStorage flag）

OFFLINE ──online 事件──► ONLINE
            │
            ▼
        觸發匯率自動刷新（背景）
        OfflineIndicator 自動消失
```

### 4.2 Service Worker 更新流程

```
頁面載入
     │
     ▼
navigator.serviceWorker.register('/sw.js')
     │
     │
     ├── registration.waiting (有新 SW 等待)?
     │       │
     │       ▼
     │   顯示 UpdatePrompt
     │   "新版本已就緒，點擊更新"
     │       │
     │       ▼
     │   用戶點擊更新
     │       │
     │       ▼
     │   postMessage({ type: 'SKIP_WAITING' })
     │       │
     │       ▼
     │   controllerchange 事件
     │       │
     │       ▼
     │   window.location.reload()
     │   (套用新版本)
     │
     └── registration.onupdatefound
             │
             ▼
         installingWorker.statechange
             │
         state === 'installed' && navigator.serviceWorker.controller
             │
             ▼
         觸發更新流程（同上）
```

### 4.3 離線資料可用性矩陣

```
場景                     | localStorage | IndexedDB | FALLBACK | 結果
─────────────────────────┼──────────────┼───────────┼──────────┼──────────
首次訪問（線上）         |      -       |    -      |    -     | 網路獲取
首次訪問（離線）         |      -       |    -      |    ✓     | FALLBACK
二次訪問（線上，<5min）  |      ✓       |    -      |    -     | localStorage
二次訪問（線上，>5min）  |      -       |    -      |    -     | 網路更新
二次訪問（離線）         |      ✓       |    ✓      |    -     | 快取資料
長期離線（清除 localStorage）|   -      |    ✓      |    -     | IDB 資料
完全重置（清除所有快取）  |      -       |    -      |    ✓     | FALLBACK
```

---

## 5. 計算機狀態機

### 5.1 計算機主狀態機 (useCalculator)

```
狀態：
  IDLE        - 等待輸入，顯示 '0'
  ENTERING    - 用戶輸入數字/小數點
  OPERATOR    - 輸入了運算符
  RESULT      - 顯示計算結果
  ERROR       - 錯誤（除以零等）
  HISTORY     - 顯示歷史記錄模式

轉換：

IDLE ──數字輸入──► ENTERING

ENTERING ──數字──► ENTERING (追加)
         ──小數點──► ENTERING (如無小數點)
         ──運算符──► OPERATOR
         ──=────► RESULT

OPERATOR ──數字──► ENTERING (新數字)
         ──=────► RESULT (使用前一次操作數)

RESULT ──數字──► ENTERING (清除前一結果)
       ──運算符──► OPERATOR (繼續計算)
       ──AC───► IDLE

ERROR ──AC───► IDLE

任意狀態 ──AC──► IDLE (清除全部)
         ──C───► 清除最後輸入 (Backspace)
         ──±──► 正負號切換
         ──%──► 百分比計算
```

### 5.2 計算機與匯率同步狀態機 (useCalculatorSync)

```
計算機模式開啟
     │
     ▼
用戶在計算機輸入數字
     │
     ▼
calculate(expression)
     │
     ▼
結果更新 (calculatorResult)
     │
     ▼
useEffect 監聽 calculatorResult 變化
     │
     ├── 值有效 (非 null/NaN)?
     │       │
     │       ▼
     │   setFromAmount(calculatorResult.toString())
     │   觸發匯率重新計算
     │
     └── 值無效 ──► 不更新匯率欄位
```

---

## 6. 主題系統狀態機

### 6.1 完整主題決策樹

```
App 初始化
     │
     ▼
讀取月份 (new Date().getMonth())
     │
     ├── 12月 (11) 或 1月 (0, ≤6日)?
     │       │
     │       ▼
     │   DECEMBER_THEME 啟動
     │   ├── 雪花粒子動畫
     │   ├── 聖誕節配色（紅綠金）
     │   ├── 特殊 emoji 元素
     │   └── 可手動關閉
     │
     └── 一般時期
             │
             ▼
         讀取 localStorage ('theme')
             │
             ├── 'dark'  ──► DARK_THEME
             ├── 'light' ──► LIGHT_THEME
             └── 未設定  ──► 跟隨系統
                              │
                              ▼
                     prefers-color-scheme?
                     ├── 'dark'  ──► DARK_THEME
                     └── 'light' ──► LIGHT_THEME (預設)
```

### 6.2 主題切換流程

```
用戶點擊主題切換
     │
     ▼
useAppTheme.toggle()
     │
     ▼
更新 localStorage ('theme')
     │
     ▼
document.documentElement.className 切換
     │
     ▼
Tailwind CSS dark: 前綴生效
     │
     ▼
所有 UI 元件響應（CSS 變數自動更新）
     │
     ▼
design-tokens.ts 色彩 token 切換
（無需重新渲染 React 元件，純 CSS）
```

---

## 7. 頁面導覽狀態機

### 7.1 底部導覽 (AppLayout)

```
當前頁面狀態：
  HOME      - /
  MULTI     - /multi/
  FAVORITES - /favorites/
  SETTINGS  - /settings/

導覽標籤：
  ┌────┬─────┬──────────┬──────────┐
  │ 首頁│ 多幣│  收藏    │  設定    │
  │ /  │/multi│/favorites│/settings │
  └────┴─────┴──────────┴──────────┘

狀態轉換：
  任意頁面 ──點擊導覽標籤──► 對應頁面
                              │
                              ▼
                        AnimatePresence (Framer Motion)
                        ├── 舊頁面: EXIT_ANIMATION (~150ms)
                        └── 新頁面: ENTER_ANIMATION (~150ms)
```

### 7.2 頁面切換動畫流程

```
動畫配置 (src/config/animations.ts SSOT):
  pageTransition:
    initial:  { opacity: 0, y: 8 }
    animate:  { opacity: 1, y: 0 }
    exit:     { opacity: 0, y: -8 }
    duration: 0.15s
    easing:   'ease-in-out'

初始化問題防止（解決閃爍）:
  isInitialized flag 確保首次渲染無動畫
  只有用戶主動導覽才觸發動畫
```

---

## 8. 版本管理流程

### 8.1 版本號生成流程 (build time)

```
pnpm build 觸發
     │
     ▼
vite.config.ts 執行
     │
     ▼
版本號生成策略（優先順序）：
     │
     ├── 1. git tag --describe --tags --match "@app/ratewise@*"
     │       │
     │       ├── 有精確 tag match?
     │       │   ──YES──► 使用 tag 版本 "2.4.4"
     │       └── 無精確 match?
     │               ├── 有最近 tag?
     │               │   ──YES──► "2.4.4+{commitCount}.{sha}"
     │               └── 無任何 tag
     │                   ──YES──► package.json version
     │
     ├── 2. 開發環境附加 dirty flag
     │       "2.4.4+sha.abc1234-dirty" (有未提交變更)
     │       "2.4.4+sha.abc1234"       (無未提交變更)
     │
     └── 3. 注入環境變數 VITE_APP_VERSION
             ► src/config/version.ts 讀取
             ► 所有元件從此 SSOT 導入
```

### 8.2 版本更新發布流程

```
開發完成
     │
     ▼
pnpm changeset
  (填寫變更說明：patch/minor/major)
     │
     ▼
git commit + push
     │
     ▼
release.yml (GitHub Actions)
     │
     ├── pnpm changeset version
     │   ├── 更新 package.json
     │   └── 生成 CHANGELOG.md 條目
     │
     └── pnpm changeset publish
         ├── 建立 git tag "@app/ratewise@x.y.z"
         └── 觸發 GitHub Release 頁面
```

---

## 9. 測試流程狀態機

### 9.1 BDD 開發循環

```
需求確認
     │
     ▼
┌─────────────────────────────────┐
│        🔴 RED 階段              │
│                                 │
│  1. 建立 *.test.ts(x)           │
│  2. 描述 Given-When-Then        │
│  3. pnpm test → 確認紅燈        │
└──────────────┬──────────────────┘
               │ 紅燈確認
               ▼
┌─────────────────────────────────┐
│        🟢 GREEN 階段            │
│                                 │
│  1. 寫最小實作代碼              │
│  2. pnpm test → 確認綠燈        │
└──────────────┬──────────────────┘
               │ 綠燈確認
               ▼
┌─────────────────────────────────┐
│        🔵 REFACTOR 階段         │
│                                 │
│  1. 重構優化                    │
│  2. pnpm test → 確認仍然通過    │
│  3. pnpm lint + typecheck       │
│  4. 驗證覆蓋率 ≥80%            │
└──────────────┬──────────────────┘
               │ 全部通過
               ▼
         git commit
```

### 9.2 CI 測試流程

```
git push
     │
     ▼
GitHub Actions ci.yml
     │
     ├── [並行執行]
     │   ├── ESLint 9 檢查
     │   │   └── 失敗 ──► 阻塞合併
     │   │
     │   ├── TypeScript 5.6 型別檢查
     │   │   └── 失敗 ──► 阻塞合併
     │   │
     │   ├── Vitest 4 單元測試
     │   │   ├── 覆蓋率 < 80%? ──► 警告
     │   │   └── 測試失敗? ──► 阻塞合併
     │   │
     │   └── Playwright E2E 測試
     │       └── 失敗 ──► 阻塞合併
     │
     └── 全部通過 ──► build 觸發
                         │
                         ▼
                     Vite SSG 建置
                         │
                     seo-production.yml 驗證
                         │
                     ├── 29 條路由存在?
                     ├── meta 標籤完整?
                     ├── sitemap.xml 正確?
                     └── Core Web Vitals 達標?
```

---

## 10. 歷史匯率查詢流程

### 10.1 歷史數據載入狀態機 (useHistoricalRates)

```
狀態：
  IDLE      - 尚未查詢
  LOADING   - 載入中
  LOADED    - 資料已載入
  CACHED    - 使用快取資料
  ERROR     - 載入失敗

查詢流程：

用戶切換到歷史匯率頁面
     │
     ▼
useHistoricalRates({
  fromCurrency,
  toCurrency,
  period: '7d' | '30d' | '90d'
})
     │
     ▼
exchangeRateHistoryService.fetchHistory()
     │
     ├── 有快取 (且 < 1 小時)?
     │   ──YES──► CACHED，直接使用
     │
     └── NO
           │
           ▼
       請求 GitHub raw CDN
       /data/public/rates/history/
       {fromCurrency}-{toCurrency}.json
           │
           ├── 成功 ──► LOADED，更新快取
           └── 失敗 ──► ERROR，顯示錯誤提示
```

### 10.2 趨勢圖渲染流程

```
歷史數據 LOADED
     │
     ▼
計算趨勢方向
  ├── 最後一天 > 第一天? ──► RISING (綠色 ↑)
  ├── 最後一天 < 第一天? ──► FALLING (紅色 ↓)
  └── 相等              ──► FLAT (灰色 →)
     │
     ▼
渲染 TrendChart / HistoricalRateChart
  ├── x 軸：日期
  ├── y 軸：匯率
  ├── 趨勢線：漸層色
  └── 工具提示：hover 顯示詳情
```

---

## 11. i18n 語言切換流程

```
App 初始化
     │
     ▼
i18next 初始化
     │
     ├── 讀取 localStorage ('i18nextLng')
     │   ├── 有設定? ──► 使用設定語言
     │   └── 無設定? ──► 偵測 navigator.language
     │               ├── 'zh-TW' | 'zh' ──► 繁體中文
     │               ├── 'ja' | 'ja-JP' ──► 日文
     │               └── 其他            ──► 英文（預設）
     │
     ▼
載入對應語言包
  ├── zh-TW.ts (繁體中文)
  ├── en.ts    (英文)
  └── ja.ts    (日文)
     │
     ▼
用戶切換語言（Settings 頁面）
     │
     ▼
i18n.changeLanguage(lang)
     │
     ▼
localStorage 更新
     │
     ▼
所有使用 useTranslation() 的元件自動重新渲染
```

---

## 12. 錯誤處理狀態機

### 12.1 全局錯誤邊界

```
正常渲染狀態 (NORMAL)
     │
     │ 子元件拋出未捕獲錯誤
     ▼
ERROR_BOUNDARY_CAUGHT
     │
     ▼
顯示 fallback UI
  ├── 錯誤訊息（開發環境詳細，生產環境簡化）
  ├── "重新整理" 按鈕
  └── Logger 記錄 (logger.error)
     │
     │ 用戶點擊重新整理
     ▼
window.location.reload()
     │
     ▼
NORMAL（重置）
```

### 12.2 網路請求錯誤分級

```
請求失敗
     │
     ├── 網路超時 (>10s)
     │   ──► 顯示 Toast "網路不穩定，使用快取數據"
     │
     ├── HTTP 4xx
     │   ──► logger.warn + 使用快取
     │
     ├── HTTP 5xx
     │   ──► logger.error + 使用快取
     │
     └── 完全離線
         ──► OfflineIndicator 顯示
             使用 IndexedDB / FALLBACK
```

---

## 13. localStorage 鍵值管理 (SSOT)

```
storage-keys.ts 定義：

STORAGE_KEYS = {
  EXCHANGE_RATES:           'exchange-rates',        // 匯率快取（5分鐘）
  CURRENCY_CONVERTER_MODE:  'currency-converter-mode', // 'single' | 'multi'
  FROM_CURRENCY:            'from-currency',          // 貨幣代碼
  TO_CURRENCY:              'to-currency',            // 貨幣代碼
  FAVORITES:                'favorites',              // CurrencyCode[]
  THEME:                    'theme',                  // 'dark' | 'light' | 'system'
}

Zustand persist key: 'ratewise-converter'
  包含: fromCurrency, toCurrency, favorites, history

clearExchangeRateCache():
  只清除 EXCHANGE_RATES 鍵
  不影響其他用戶數據鍵

離線 Session 標記:
  sessionStorage: 'offline-indicator-shown'
  (同次 session 只顯示一次離線提示)
```

---

## 14. 性能優化狀態機

### 14.1 INP (Interaction to Next Paint) 預算

```
用戶互動 (點擊/輸入)
     │
     ▼
互動預算檢查 (interactionBudget.ts)
  threshold: INP_LONG_TASK_THRESHOLD_MS (200ms)
     │
     ├── 任務 < 200ms ──► 正常執行
     │
     └── 任務 ≥ 200ms ──► 觸發 Long Task 警告
                           logger.warn('Long interaction detected')
                           Web Vitals 上報
```

### 14.2 Core Web Vitals 監控流程

```
頁面載入
     │
     ▼
reportWebVitals.ts
     │
     ├── LCP (Largest Contentful Paint)
     │   目標: < 2.5s
     │
     ├── FID (First Input Delay) → INP
     │   目標: < 100ms
     │
     ├── CLS (Cumulative Layout Shift)
     │   目標: < 0.1
     │
     ├── TTFB (Time to First Byte)
     │   目標: < 800ms
     │
     └── FCP (First Contentful Paint)
         目標: < 1.8s
             │
             ▼
         logger.info({ metric, value })
         (未來可接 Analytics 平台)
```

---

## 附錄：狀態機符號說明

```
符號     含義
────────────────────────────────
┌─┐     狀態節點
│ │
└─┘
───►    狀態轉換（單向）
◄──►    狀態轉換（雙向）
──YES──► 條件判斷（真）
──NO──►  條件判斷（假）
╱   ╲   分支點
│       流程線
├──     分支
└──     最後分支
▼       向下流向
```

---

_本文件記錄 RateWise v2.4.4 版本的狀態機規格，隨功能更新應同步修改。_
_最後更新：2026-02-11_
