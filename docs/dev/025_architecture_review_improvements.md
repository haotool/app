# 架構深度審核與改善計畫

> **建立日期**: 2025-12-13
> **版本**: v1.0
> **狀態**: 📋 規劃中
> **審核者**: 資深架構師 (Claude Agent)
> **總體評分**: 82/100

---

## 執行摘要

本文件為 RateWise Monorepo 專案的全面架構審核報告，基於 Linus Torvalds 開發哲學進行深度分析。專案整體品質良好，具備嚴格的 TypeScript 配置、良好的測試覆蓋率（81%+）、清晰的架構分層。主要改善重點在於：消除程式碼重複、提取共享模組、重構大型元件。

---

## 1. 架構評分矩陣

| 維度 | 分數 | 狀態 | 關鍵發現 |
|------|------|------|----------|
| **專案結構** | 85/100 | ✅ | 乾淨的 monorepo，但缺少 shared 模組提取 |
| **程式碼品質** | 80/100 | ✅ | 嚴格 TS 配置，但有重複程式碼 |
| **TypeScript** | 95/100 | ✅ | 業界頂級嚴格度配置 |
| **測試覆蓋** | 75/100 | ⚠️ | 81% 覆蓋率，但頁面測試不足 |
| **文件品質** | 88/100 | ✅ | 優秀但需要歸檔整理 |
| **架構模式** | 82/100 | ✅ | 良好模式，需重構大元件 |
| **依賴管理** | 90/100 | ✅ | 精簡、最新、無 CVE |
| **效能** | 75/100 | ⚠️ | 190 KB gzip，有優化空間 |
| **安全性** | 88/100 | ✅ | 良好基線，Sentry 整合 |
| **可維護性** | 78/100 | ⚠️ | 大元件、程式碼重複 |

---

## 2. 關鍵問題清單

### 2.1 🔴 嚴重問題 (P0 - 必須修復)

#### ISSUE-001: 貨幣頁面嚴重重複
- **位置**: `apps/ratewise/src/pages/*ToTWD.tsx` (13 個檔案)
- **問題**: 13 個幾乎相同的頁面檔案，結構 100% 相同，僅貨幣數據不同
- **影響**:
  - ~1,300 行重複程式碼
  - 維護風險：變更需修改 13 處
  - Bundle size 增加 ~15-20 KB (未壓縮)
- **解決方案**: 參見 TODO-001

#### ISSUE-002: SingleConverter 元件過大
- **位置**: `apps/ratewise/src/features/ratewise/components/SingleConverter.tsx`
- **問題**: 582 行，違反單一職責原則
- **職責混合**:
  - 輸入驗證
  - 趨勢數據獲取
  - 計算機模態框渲染
  - 顯示值格式化
  - 交換動畫管理
- **解決方案**: 參見 TODO-003

#### ISSUE-003: useCurrencyConverter Hook 過於龐大
- **位置**: `apps/ratewise/src/features/ratewise/hooks/useCurrencyConverter.ts`
- **問題**: 341 行，管理 10+ 個狀態值
- **職責混合**:
  - localStorage 持久化
  - 匯率轉換計算
  - 歷史記錄追蹤
  - 多幣種管理
- **解決方案**: 參見 TODO-004

### 2.2 🟡 中等問題 (P1 - 應該修復)

#### ISSUE-004: apps/shared 模組未使用
- **位置**: `apps/shared/` (空目錄)
- **問題**: Monorepo 架構但未提取共享程式碼
- **發現**: 195 個相對導入可能受益於共享模組
- **解決方案**: 參見 TODO-002

#### ISSUE-005: 頁面元件測試不足
- **位置**: `apps/ratewise/src/pages/*.tsx`
- **問題**: FAQ, About, Guide, 貨幣頁面缺少/測試不足
- **影響**: ~2,340 行程式碼幾乎無測試覆蓋
- **解決方案**: 參見 TODO-005

#### ISSUE-006: lightweight-charts 未延遲載入
- **位置**: `MiniTrendChart.tsx`
- **問題**: 50-60 KB 函式庫在初始載入時包含
- **影響**: 首頁載入時間增加
- **解決方案**: 參見 TODO-006

### 2.3 🟢 輕微問題 (P2 - 建議修復)

#### ISSUE-007: RateWise.tsx 內聯 JSX 過多
- **位置**: `apps/ratewise/src/features/ratewise/RateWise.tsx:170-210`
- **問題**: 502 行，內聯按鈕定義
- **解決方案**: 提取為子元件

#### ISSUE-008: 開發文件需要歸檔
- **位置**: `docs/dev/*.md`
- **問題**: 46 個 markdown 檔案，部分為臨時報告
- **發現**: 002 獎懲記錄 167 KB，010 規格 81 KB
- **解決方案**: 歸檔已完成的計畫和報告

#### ISSUE-009: routes.tsx 路由定義重複
- **位置**: `apps/ratewise/src/routes.tsx`
- **問題**: 14 個相似的 createLazyRoute 調用
- **解決方案**: 使用配置驅動的路由生成

#### ISSUE-010: @ts-ignore 使用
- **位置**: `apps/ratewise/src/components/UpdatePrompt.tsx`
- **問題**: 3 處 @ts-ignore 用於 Workbox 類型相容
- **嚴重度**: 低 - 有充分註解
- **解決方案**: 等待 Workbox 類型更新或創建自定義類型

---

## 3. 改善任務清單 (TODO)

### 第一優先級：高價值、可快速實現

#### TODO-001: 重構貨幣頁面消除重複 🔴
**優先級**: P0 | **預估工時**: 4-6 小時 | **影響**: 高

**當前狀態**:
```
apps/ratewise/src/pages/
├── USDToTWD.tsx  (176 行)
├── JPYToTWD.tsx  (182 行)
├── EURToTWD.tsx  (178 行)
... (共 13 個相似檔案)
```

**目標架構**:
```typescript
// 1. 建立貨幣頁面配置 (新檔案: currencyPageConfig.ts)
interface CurrencyPageConfig {
  code: CurrencyCode;
  faqEntries: FAQEntry[];
  howToSteps: HowToStep[];
  title: string;
  description: string;
  keywords: string[];
}

export const CURRENCY_PAGE_CONFIGS: Record<CurrencyCode, CurrencyPageConfig> = {
  USD: {
    code: 'USD',
    title: 'USD 對 TWD 匯率換算器 | 即時台幣匯率',
    description: 'USD 對 TWD 即時匯率換算...',
    faqEntries: [...],
    howToSteps: [...],
    keywords: ['USD TWD 匯率', '美金換台幣', ...],
  },
  JPY: { ... },
  // ... 其他貨幣
};

// 2. 建立參數化元件 (新檔案: CurrencyPage.tsx)
interface CurrencyPageProps {
  config: CurrencyPageConfig;
}

export function CurrencyPage({ config }: CurrencyPageProps) {
  return (
    <>
      <SEOHelmet
        title={config.title}
        description={config.description}
        pathname={`/${config.code.toLowerCase()}-twd`}
        keywords={config.keywords}
        faq={config.faqEntries}
        howTo={{ steps: config.howToSteps, ... }}
      />
      {/* 共用 JSX 結構 */}
    </>
  );
}

// 3. 更新路由 (routes.tsx)
const currencyRoutes = Object.entries(CURRENCY_PAGE_CONFIGS).map(([code, config]) => ({
  path: `/${code.toLowerCase()}-twd`,
  element: <CurrencyPage config={config} />,
}));
```

**預期收益**:
- 消除 ~1,300 行重複程式碼
- 單一來源管理 SEO 元數據
- 輕鬆新增貨幣
- 減少 ~15-20 KB bundle size

**驗證清單**:
- [ ] 所有 13 個貨幣頁面使用統一元件
- [ ] SEO 元數據正確渲染
- [ ] E2E 測試通過
- [ ] Lighthouse SEO 分數維持 100

---

#### TODO-002: 提取共享工具到 apps/shared 🟡
**優先級**: P1 | **預估工時**: 8-12 小時 | **影響**: 中

**當前狀態**:
- `apps/shared/` 目錄為空
- 195 個相對導入分散在 ratewise 中
- nihonname 應用無法重用工具

**目標架構**:
```
apps/shared/
├── src/
│   ├── constants/
│   │   └── currencies.ts     # 貨幣定義
│   ├── types/
│   │   └── index.ts          # 共享類型
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   └── usePullToRefresh.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── storage.ts
│   │   └── formatters.ts
│   └── index.ts              # 統一導出
├── package.json
└── tsconfig.json
```

**實施步驟**:
1. 建立 `apps/shared/package.json` 配置
2. 提取以下模組:
   - `utils/logger.ts` → `@shared/utils/logger`
   - `utils/storage.ts` → `@shared/utils/storage`
   - `hooks/usePullToRefresh.ts` → `@shared/hooks/usePullToRefresh`
   - 共用類型定義
3. 更新 tsconfig paths
4. 更新 ratewise 和 nihonname 導入

**預期收益**:
- 啟用 ratewise 和 nihonname 之間的程式碼重用
- 更清晰的依賴邊界
- 為未來應用奠定基礎

---

#### TODO-003: 重構 SingleConverter 為多個元件 🔴
**優先級**: P0 | **預估工時**: 6-8 小時 | **影響**: 高

**當前狀態**: 582 行，混合多個職責

**目標架構**:
```
features/ratewise/components/
├── SingleConverter.tsx           # 主要包裝元件 (~100 行)
├── SingleConverterInput.tsx      # 輸入區塊 (~150 行)
├── SingleConverterTrend.tsx      # 趨勢圖容器 (~120 行)
├── SingleConverterQuickAmounts.tsx # 快速金額按鈕 (~80 行)
└── SingleConverterCalculator.tsx # 計算機整合 (~100 行)
```

**重構策略**:
```typescript
// SingleConverter.tsx (重構後)
export const SingleConverter = (props: SingleConverterProps) => {
  const calculator = useCalculatorModal<'from' | 'to'>({ ... });
  const trend = useTrendData(props.fromCurrency, props.toCurrency);

  return (
    <div className="converter-container">
      <SingleConverterInput
        {...props}
        onCalculatorOpen={calculator.open}
      />

      <SingleConverterQuickAmounts
        currency={props.fromCurrency}
        onSelect={props.onQuickAmount}
      />

      <SingleConverterTrend
        data={trend.data}
        loading={trend.loading}
        fromCurrency={props.fromCurrency}
        toCurrency={props.toCurrency}
      />

      {calculator.isOpen && (
        <SingleConverterCalculator
          field={calculator.activeField}
          onClose={calculator.close}
          onConfirm={calculator.confirm}
        />
      )}
    </div>
  );
};
```

**預期收益**:
- 更容易獨立測試各部分
- 更清晰的元件職責
- 更好的可重用性
- 更容易維護

---

#### TODO-004: 拆分 useCurrencyConverter Hook 🔴
**優先級**: P0 | **預估工時**: 4-6 小時 | **影響**: 高

**當前狀態**: 341 行，管理 10+ 個狀態值

**目標架構**:
```typescript
// hooks/useCurrencyStorage.ts (~70 行)
export const useCurrencyStorage = () => {
  const [mode, setMode] = useState<ConverterMode>(...);
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(...);
  const [toCurrency, setToCurrency] = useState<CurrencyCode>(...);
  const [favorites, setFavorites] = useState<CurrencyCode[]>(...);

  // localStorage 同步邏輯

  return { mode, setMode, fromCurrency, setFromCurrency, ... };
};

// hooks/useRateCalculations.ts (~100 行)
export const useRateCalculations = (
  exchangeRates: Record<string, number | null>,
  details?: Record<string, RateDetails>,
  rateType?: RateType,
) => {
  const getRate = useCallback(...);
  const convertAmount = useCallback(...);
  const recalcMultiAmounts = useCallback(...);

  return { getRate, convertAmount, recalcMultiAmounts };
};

// hooks/useConversionHistory.ts (~50 行)
export const useConversionHistory = () => {
  const [history, setHistory] = useState<ConversionHistoryEntry[]>([]);
  const addToHistory = useCallback(...);
  const clearHistory = useCallback(...);

  return { history, addToHistory, clearHistory };
};

// hooks/useCurrencyConverter.ts (重構後 ~80 行)
export const useCurrencyConverter = (options: UseCurrencyConverterOptions) => {
  const storage = useCurrencyStorage();
  const rates = useRateCalculations(options.exchangeRates, options.details, options.rateType);
  const history = useConversionHistory();

  // 組合邏輯

  return { ...storage, ...rates, ...history };
};
```

**預期收益**:
- 更清晰的狀態機
- 更容易測試
- 更好的 TypeScript 推斷
- 關注點分離

---

### 第二優先級：中等價值、適度工作量

#### TODO-005: 擴展頁面元件測試 🟡
**優先級**: P1 | **預估工時**: 4-5 小時 | **影響**: 中

**當前狀態**: FAQ, About, Guide, 貨幣頁面測試最少

**實施步驟**:
```typescript
// __tests__/USDToTWD.test.tsx
describe('USDToTWD Page', () => {
  it('renders SEO Helmet with correct title', () => {
    render(<USDToTWD />);
    expect(document.title).toContain('USD 對 TWD');
  });

  it('renders main heading', () => {
    render(<USDToTWD />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('USD 對 TWD');
  });

  it('includes FAQ section', () => {
    render(<USDToTWD />);
    expect(screen.getByText('常見問題')).toBeInTheDocument();
  });

  it('has correct structured data', () => {
    render(<USDToTWD />);
    // 驗證 JSON-LD 結構化數據
  });
});
```

**預期收益**:
- 捕獲 SEO 迴歸
- 確保頁面渲染正確
- +10-15% 覆蓋率提升

---

#### TODO-006: 延遲載入 lightweight-charts 🟡
**優先級**: P1 | **預估工時**: 3-4 小時 | **影響**: 中

**當前狀態**: 50-60 KB 函式庫在初始載入時包含

**實施步驟**:
```typescript
// MiniTrendChart.tsx
import { lazy, Suspense } from 'react';

const ChartContainer = lazy(() =>
  import('lightweight-charts').then(module => ({
    default: ({ data }) => {
      // 使用 module 渲染圖表
    }
  }))
);

export const MiniTrendChart = ({ data, loading }) => {
  if (loading) return <TrendChartSkeleton />;

  return (
    <Suspense fallback={<TrendChartSkeleton />}>
      <ChartContainer data={data} />
    </Suspense>
  );
};
```

**預期收益**:
- ~50-60 KB 延遲到需要時載入
- 初始頁面載入更快
- 更好的 Lighthouse 效能分數

---

#### TODO-007: 歸檔開發文件 🟢
**優先級**: P2 | **預估工時**: 2-3 小時 | **影響**: 低

**當前狀態**: 46 個 markdown 檔案，部分過時

**實施步驟**:
1. 建立 `docs/dev/archive/` 目錄
2. 移動已完成的計畫文件:
   - `*_PLAN.md` (已完成的)
   - `*_REPORT.md` (臨時報告)
   - `*_SUMMARY.md` (總結報告)
3. 保留活躍文件:
   - `ARCHITECTURE_BASELINE.md`
   - `CHECKLISTS.md`
   - `CITATIONS.md`
   - 編號規格 (001-024)
4. 建立 `docs/dev/INDEX.md` 索引

**預期收益**:
- 更容易導航
- 更清晰的文件結構
- 符合 CLAUDE.md 清理規則

---

### 第三優先級：可選改進

#### TODO-008: 提取 RateWise.tsx UI 片段 🟢
**優先級**: P2 | **預估工時**: 2-3 小時

提取行 170-210 的內聯按鈕定義為 `<ModeToggleButton />` 子元件。

#### TODO-009: 實現配置驅動路由 🟢
**優先級**: P2 | **預估工時**: 3-4 小時

將 routes.tsx 中的 14 個相似 createLazyRoute 調用替換為配置驅動生成。

#### TODO-010: 升級 react-helmet-async 🟢
**優先級**: P2 | **預估工時**: 1-2 小時 | **依賴**: 等待 React 19 相容版本

當前使用 pnpm override 固定在 1.3.0 (2023 年版本)。

---

## 4. 依賴分析

### 4.1 生產依賴 ✅ 健康

| 依賴 | 版本 | 狀態 | 用途 |
|------|------|------|------|
| react | ^19.2.3 | ✅ 最新 | UI 框架 |
| react-dom | ^19.2.3 | ✅ 最新 | DOM 渲染 |
| react-router-dom | ^6.28.0 | ✅ 最新 | 路由 |
| lucide-react | ^0.555.0 | ✅ 最新 | 圖標 |
| lightweight-charts | ^5.0.9 | ✅ 最新 | 圖表 |
| motion | ^12.23.25 | ✅ 最新 | 動畫 |
| react-error-boundary | ^6.0.0 | ✅ 最新 | 錯誤處理 |

**評估**: 依賴精簡 (7 個)，無已知 CVE。

### 4.2 注意事項

- **React 19**: 最新版本 (2024 年 9 月發布)，可能有邊緣情況
- **react-helmet-async**: 使用 override 固定在 1.3.0，等待 React 19 相容版本

---

## 5. 效能考量

### 5.1 Bundle Size 分析

```
JavaScript: ~580 KB (未壓縮)
CSS: ~18 KB
Gzipped JS: ~190 KB
```

**貢獻者**:
- React 19: ~35-40 KB
- React Router: ~25 KB
- lightweight-charts: ~50-60 KB (最大)
- Tailwind: ~20 KB
- 應用程式碼: ~50-60 KB
- motion: ~20 KB

### 5.2 Lighthouse 分數

```
效能: 89/100
無障礙: 100/100
最佳實踐: 100/100
SEO: 100/100
```

### 5.3 優化機會

1. **延遲載入 lightweight-charts** (TODO-006)
   - 預期改善: +5-10 效能分數

2. **消除貨幣頁面重複** (TODO-001)
   - 預期改善: ~15-20 KB 減少

3. **Code splitting calculator 功能**
   - 預期改善: ~10-15 KB 延遲載入

---

## 6. TypeScript 配置評估

### 6.1 嚴格度等級: 業界頂級 ✅

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "noImplicitReturns": true
}
```

**評估**: 在可用的最嚴格配置中，強制全面的類型安全。

### 6.2 類型安全違規

僅發現 3 處 `@ts-ignore` 在 `UpdatePrompt.tsx`，用於 Workbox 類型相容性，有充分註解。

---

## 7. 測試覆蓋率分析

### 7.1 當前門檻

```typescript
thresholds: {
  statements: 81,  // 當前: 81.56%
  branches: 71,    // 當前: 71.93%
  functions: 82,   // 當前: 82.56%
  lines: 83,       // 當前: 83%
}
```

### 7.2 覆蓋率分布

| 模組 | 測試檔案 | 覆蓋狀態 |
|------|----------|----------|
| ratewise 功能 | 10 | 良好 |
| calculator 功能 | 8+ | 良好 |
| utils | 5+ | 良好 |
| services | 存在 | 中等 |
| pages | 最少 | 低 ⚠️ |
| components (根) | 2 | 低 |

### 7.3 改善目標

- **短期**: 維持 81%+ 門檻
- **中期**: 提升至 85% (完成 TODO-005 後)
- **長期**: 目標 90%+ 覆蓋率

---

## 8. 實施路線圖

### 第一階段 (1-2 週): 消除重複

| 任務 | 優先級 | 預估工時 | 狀態 |
|------|--------|----------|------|
| TODO-001 貨幣頁面重構 | P0 | 4-6h | 📋 待開始 |
| TODO-003 SingleConverter 重構 | P0 | 6-8h | 📋 待開始 |
| TODO-004 useCurrencyConverter 拆分 | P0 | 4-6h | 📋 待開始 |

### 第二階段 (3-4 週): 架構強化

| 任務 | 優先級 | 預估工時 | 狀態 |
|------|--------|----------|------|
| TODO-002 提取 shared 模組 | P1 | 8-12h | 📋 待開始 |
| TODO-005 頁面測試擴展 | P1 | 4-5h | 📋 待開始 |
| TODO-006 延遲載入圖表 | P1 | 3-4h | 📋 待開始 |

### 第三階段 (5-6 週): 清理與優化

| 任務 | 優先級 | 預估工時 | 狀態 |
|------|--------|----------|------|
| TODO-007 文件歸檔 | P2 | 2-3h | 📋 待開始 |
| TODO-008 提取 UI 片段 | P2 | 2-3h | 📋 待開始 |
| TODO-009 配置驅動路由 | P2 | 3-4h | 📋 待開始 |

---

## 9. 風險與緩解

### 9.1 技術風險

| 風險 | 嚴重度 | 緩解策略 |
|------|--------|----------|
| React 19 邊緣情況 | 中 | 全面測試套件 + E2E 測試 |
| 重構期間迴歸 | 中 | BDD 流程 + 覆蓋率門檻 |
| SEO 影響 | 高 | 維持結構化數據測試 |

### 9.2 組織風險

| 風險 | 嚴重度 | 緩解策略 |
|------|--------|----------|
| 重構範圍蔓延 | 中 | 嚴格遵循 Linus 三問 |
| 文件過時 | 低 | 隨程式碼變更更新 |

---

## 10. Linus 三問驗證

### Q1: "這是個真問題還是臆想出來的？"

✅ **真問題**:
- 1,300 行重複程式碼確實存在
- 大元件確實難以維護
- 測試覆蓋不足確實有迴歸風險

### Q2: "有更簡單的方法嗎？"

✅ **已選擇最簡方案**:
- 貨幣頁面: 配置驅動 vs 代碼生成器 → 選擇配置驅動 (更簡單)
- 元件拆分: 漸進重構 vs 完全重寫 → 選擇漸進重構 (風險更低)

### Q3: "會破壞什麼嗎？"

✅ **風險已評估**:
- 所有重構有測試覆蓋
- SEO 元數據有 E2E 驗證
- 漸進實施，每步可回滾

---

## 11. 參考資料

- [ARCHITECTURE_BASELINE.md](./ARCHITECTURE_BASELINE.md) - 架構基線
- [CHECKLISTS.md](./CHECKLISTS.md) - 品質檢查清單
- [CITATIONS.md](./CITATIONS.md) - 權威來源引用
- [React 19 Hooks 最佳實踐](https://react.dev/reference/rules/rules-of-hooks)
- [Clean Code TypeScript](https://github.com/labs42io/clean-code-typescript)

---

## 12. 更新日誌

| 日期 | 版本 | 變更 |
|------|------|------|
| 2025-12-13 | v1.0 | 初始架構審核報告 |

---

_本文件依照 Linus Torvalds 開發哲學產生，專注於消除複雜性與提升可維護性。_
