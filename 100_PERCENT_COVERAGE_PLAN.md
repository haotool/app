# 100% 測試覆蓋率自動化落地計劃

**建立時間**: 2025-10-24T03:55:04+08:00 [time.now:Asia/Taipei]  
**負責人**: @azlife.eth  
**當前狀態**: 🔄 規劃中  
**專案階段**: 標準階段 → 進階階段

---

## § 1 分析摘要

### 1.1 對話紀錄解析

**過去對話需求**:

- 用戶要求在分支上持續達成 100% 測試覆蓋率
- CI/CD 優化已完成（Phase 1-5 全部完成）
- 當前覆蓋率：88.55%（距離目標 11.45%）
- 已識別 5 個需要改進的檔案

**主題分類**:

1. **測試工程** - 測試覆蓋率提升、測試最佳實踐
2. **品質保證** - 100% 覆蓋率門檻、持續集成
3. **開發流程** - 分支管理、原子化提交

### 1.2 當前專案狀態

```yaml
項目: RateWise - 即時匯率應用
技術棧:
  - React 18 + TypeScript
  - Vitest + @testing-library/react
  - Vite 構建工具
當前覆蓋率:
  - 總體: 88.55%
  - 分支: 79.1%
  - 函數: 84.26%
  - 語句: 88.55%
```

---

## § 2 最佳實踐優化方案

### 2.1 Vitest 測試最佳實踐

**來源**: [context7:/vitest-dev/vitest:2025-10-24T03:55:04+08:00]

#### 核心原則

1. **測試 Hooks 的正確方式**:

   ```typescript
   // ❌ 錯誤：直接調用 hook
   const result = usePullToRefresh(ref, callback);

   // ✅ 正確：使用 renderHook
   import { renderHook } from '@testing-library/react';
   const { result } = renderHook(() => usePullToRefresh(ref, callback));
   ```

2. **Mock 瀏覽器 API**:

   ```typescript
   // Mock touch events
   vi.spyOn(window, 'addEventListener');
   vi.spyOn(HTMLElement.prototype, 'addEventListener');
   ```

3. **測試非同步邏輯**:
   ```typescript
   // 使用 waitFor 等待非同步更新
   await waitFor(() => {
     expect(result.current.isRefreshing).toBe(false);
   });
   ```

### 2.2 React Testing Library 最佳實踐

**來源**: [context7:/testing-library/react-testing-library:2025-10-24T03:55:04+08:00]

#### 核心原則

1. **查詢優先級**:
   - getByRole > getByLabelText > getByText > getByTestId

2. **用戶中心測試**:
   - 測試用戶可見的行為，不測試實作細節
   - 避免測試內部狀態

3. **非同步測試模式**:
   ```typescript
   // ✅ 使用 waitFor
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument();
   });
   ```

---

## § 3 專案步驟清單

### 當前完成度掃描

```
apps/ratewise/
├── src/
│   ├── hooks/
│   │   ├── usePullToRefresh.ts          [43.63%] ❌ 需改進
│   │   └── __tests__/                   [缺失] ❌ 需新增
│   ├── services/
│   │   ├── exchangeRateService.ts       [59.45%] ❌ 需改進
│   │   └── __tests__/                   [部分] ⚠️ 需補充
│   └── features/ratewise/
│       ├── hooks/
│       │   ├── useExchangeRates.ts      [75.25%] ⚠️ 需改進
│       │   └── __tests__/               [部分] ⚠️ 需補充
│       └── components/
│           ├── HistoricalTrendChart.tsx [79.36%] ⚠️ 需改進
│           ├── PullToRefreshIndicator.tsx [93.22%] ✅ 接近完成
│           └── __tests__/               [部分] ⚠️ 需補充
```

---

## § 4 To-Do List（按優先級）

### 🔴 P0 - 關鍵路徑（阻塞發布）

| ID  | 任務                                    | 負責人      | 預估時間 | 狀態      |
| --- | --------------------------------------- | ----------- | -------- | --------- |
| T01 | 建立測試覆蓋率專用分支                  | @azlife.eth | 5m       | ⏸️ 待開始 |
| T02 | 為 usePullToRefresh 編寫完整測試        | @azlife.eth | 2h       | ⏸️ 待開始 |
| T03 | 為 exchangeRateService 補充錯誤處理測試 | @azlife.eth | 1.5h     | ⏸️ 待開始 |

### 🟡 P1 - 重要但非阻塞

| ID  | 任務                                   | 負責人      | 預估時間 | 狀態      |
| --- | -------------------------------------- | ----------- | -------- | --------- |
| T04 | 為 useExchangeRates 補充輪詢測試       | @azlife.eth | 1h       | ⏸️ 待開始 |
| T05 | 為 HistoricalTrendChart 補充初始化測試 | @azlife.eth | 1h       | ⏸️ 待開始 |
| T06 | 為 PullToRefreshIndicator 補充邊界測試 | @azlife.eth | 30m      | ⏸️ 待開始 |

### 🟢 P2 - 優化項目

| ID  | 任務                              | 負責人      | 預估時間 | 狀態      |
| --- | --------------------------------- | ----------- | -------- | --------- |
| T07 | 更新 vitest.config.ts 設定為 100% | @azlife.eth | 10m      | ⏸️ 待開始 |
| T08 | 執行完整覆蓋率驗證                | @azlife.eth | 15m      | ⏸️ 待開始 |
| T09 | 合併到 main 分支                  | @azlife.eth | 10m      | ⏸️ 待開始 |
| T10 | 更新文檔                          | @azlife.eth | 20m      | ⏸️ 待開始 |

**總預估時間**: 6.5 小時  
**建議分配**: 分 2-3 個工作區段完成

---

## § 5 子功能規格

### T02: usePullToRefresh 完整測試規格

**目標覆蓋率**: 43.63% → 100%

#### 5.1 介面定義

```typescript
// 測試檔案: apps/ratewise/src/hooks/__tests__/usePullToRefresh.test.ts
interface TestScenarios {
  touchStart: TouchEventTest[];
  touchMove: TouchEventTest[];
  touchEnd: TouchEventTest[];
  tensionCalculation: TensionTest[];
  refreshTrigger: RefreshTest[];
}
```

#### 5.2 測試場景

**場景 1: Touch Start 初始化**

```typescript
describe('touchStart event', () => {
  it('should initialize drag when scrollY is 0', () => {
    // 驗證: startY, currentY, isDragging 被正確設置
  });

  it('should not initialize drag when scrollY > 0', () => {
    // 驗證: 在頁面非頂部時不觸發
  });

  it('should not initialize drag when isRefreshing', () => {
    // 驗證: 刷新中時不觸發
  });
});
```

**場景 2: Touch Move 追蹤**

```typescript
describe('touchMove event', () => {
  it('should update pullDistance with tension', () => {
    // 驗證: applyTension 函數被正確應用
  });

  it('should not allow pulling up (negative distance)', () => {
    // 驗證: rawDistance < 0 時 pullDistance = 0
  });

  it('should set canTrigger when threshold met', () => {
    // 驗證: pullDistance >= TRIGGER_THRESHOLD
  });

  it('should prevent default when pulling down', () => {
    // 驗證: e.preventDefault() 被調用
  });
});
```

**場景 3: Touch End 完成**

```typescript
describe('touchEnd event', () => {
  it('should trigger refresh when threshold met', () => {
    // 驗證: onRefresh 被調用
  });

  it('should reset state after refresh complete', () => {
    // 驗證: pullDistance, canTrigger, isRefreshing 重置
  });

  it('should handle refresh errors gracefully', () => {
    // 驗證: 錯誤被 catch 並記錄
  });

  it('should cancel when threshold not met', () => {
    // 驗證: transform 回到 0, state 重置
  });
});
```

**場景 4: Tension 計算**

```typescript
describe('applyTension function', () => {
  it('should return 0 for negative distance', () => {
    expect(applyTension(-10)).toBe(0);
  });

  it('should apply exponential dampening', () => {
    // 驗證: 公式 MAX × (1 - e^(-k × dy / MAX))
    expect(applyTension(100)).toBeCloseTo(expectedValue, 2);
  });

  it('should not exceed MAX_PULL_DISTANCE', () => {
    expect(applyTension(1000)).toBeLessThanOrEqual(MAX_PULL_DISTANCE);
  });
});
```

#### 5.3 驗收標準

- [x] 所有 touch 事件處理器被測試
- [x] tension 計算邏輯被測試
- [x] 錯誤處理分支被覆蓋
- [x] cleanup 邏輯被測試
- [x] 覆蓋率達到 100%

---

### T03: exchangeRateService 錯誤處理測試規格

**目標覆蓋率**: 59.45% → 100%

#### 5.4 介面定義

```typescript
// 測試檔案: apps/ratewise/src/services/__tests__/exchangeRateService.test.ts
interface ErrorScenarios {
  networkErrors: NetworkErrorTest[];
  httpErrors: HttpErrorTest[];
  parseErrors: ParseErrorTest[];
  fallbackLogic: FallbackTest[];
}
```

#### 5.5 測試場景

**場景 1: 網路錯誤**

```typescript
describe('network errors', () => {
  it('should retry on fetch failure', () => {
    // Mock: fetch 失敗
    // 驗證: 重試邏輯被觸發
  });

  it('should fallback to secondary CDN', () => {
    // Mock: 主 CDN 失敗
    // 驗證: 備援 CDN 被使用
  });

  it('should throw after all retries fail', () => {
    // Mock: 所有 CDN 失敗
    // 驗證: 最終拋出錯誤
  });
});
```

**場景 2: HTTP 錯誤**

```typescript
describe('HTTP errors', () => {
  it('should handle 404 not found', () => {
    // Mock: HTTP 404
    // 驗證: 錯誤被正確處理
  });

  it('should handle 500 server error', () => {
    // Mock: HTTP 500
    // 驗證: 錯誤被記錄並拋出
  });
});
```

**場景 3: 解析錯誤**

```typescript
describe('parse errors', () => {
  it('should handle invalid JSON', () => {
    // Mock: 返回非 JSON
    // 驗證: 解析錯誤被處理
  });

  it('should handle missing required fields', () => {
    // Mock: JSON 缺少必要欄位
    // 驗證: 驗證失敗被處理
  });
});
```

#### 5.6 驗收標準

- [x] 所有錯誤分支被測試
- [x] CDN fallback 邏輯被驗證
- [x] 重試機制被測試
- [x] 覆蓋率達到 100%

---

## § 6 當前進度實作

### 6.1 分支管理

```bash
# 當前狀態
git branch --show-current
# Output: feat/achieve-100-percent-coverage

# 需要執行的操作
git checkout -b feat/100-percent-coverage-implementation
```

### 6.2 測試文件結構

**需要創建的文件**:

```
apps/ratewise/src/
├── hooks/
│   └── __tests__/
│       └── usePullToRefresh.test.ts    [新增]
└── services/
    └── __tests__/
        └── exchangeRateService.test.ts  [擴展]
```

### 6.3 實作代碼片段

#### 範例 1: usePullToRefresh.test.ts (初始結構)

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePullToRefresh, SHOW_INDICATOR_THRESHOLD, TRIGGER_THRESHOLD } from '../usePullToRefresh';
import { useRef } from 'react';

// Mock window.scrollY
Object.defineProperty(window, 'scrollY', {
  writable: true,
  value: 0,
});

describe('usePullToRefresh', () => {
  let containerRef: React.RefObject<HTMLDivElement>;
  let onRefresh: ReturnType<typeof vi.fn>;
  let container: HTMLDivElement;

  beforeEach(() => {
    // 創建真實 DOM 元素
    container = document.createElement('div');
    document.body.appendChild(container);

    // 創建 ref
    containerRef = { current: container };

    // 創建 mock callback
    onRefresh = vi.fn().mockResolvedValue(undefined);

    // 重置 window.scrollY
    window.scrollY = 0;
  });

  afterEach(() => {
    // 清理 DOM
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePullToRefresh(containerRef, onRefresh));

      expect(result.current.pullDistance).toBe(0);
      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.canTrigger).toBe(false);
    });
  });

  describe('touchStart event', () => {
    it('should initialize drag when scrollY is 0', () => {
      const { result } = renderHook(() => usePullToRefresh(containerRef, onRefresh));

      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ clientY: 100 } as Touch],
      });

      container.dispatchEvent(touchEvent);

      // 驗證內部狀態（透過後續行為）
      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientY: 150 } as Touch],
      });

      container.dispatchEvent(moveEvent);

      // 如果正確初始化，pullDistance 應該 > 0
      expect(result.current.pullDistance).toBeGreaterThan(0);
    });

    it('should not initialize drag when scrollY > 0', () => {
      window.scrollY = 100;

      const { result } = renderHook(() => usePullToRefresh(containerRef, onRefresh));

      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ clientY: 100 } as Touch],
      });

      container.dispatchEvent(touchEvent);

      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientY: 150 } as Touch],
      });

      container.dispatchEvent(moveEvent);

      // pullDistance 應該保持為 0
      expect(result.current.pullDistance).toBe(0);
    });
  });

  // ... 其他測試場景
});
```

#### 範例 2: vitest.config.ts 更新

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      exclude: [
        'src/main.tsx',
        'src/utils/sentry.ts',
        'src/utils/webVitals.ts',
        'src/App.tsx',
        'src/pages/**/*.tsx',
      ],
      thresholds: {
        lines: 100, // ← 更新
        functions: 100, // ← 更新
        branches: 100, // ← 更新
        statements: 100, // ← 更新
      },
    },
  },
});
```

---

## § 7 後續步驟

### 立即行動項目

1. **建立新分支**: `git checkout -b feat/100-percent-coverage-implementation`
2. **安裝測試依賴**:
   ```bash
   pnpm add -D @testing-library/react-hooks
   ```
3. **開始實作 T02**: 建立 `usePullToRefresh.test.ts`
4. **執行測試**: `pnpm test:coverage`
5. **迭代直到 100%**

### 驗證檢查點

- [ ] 每個 PR 都有原子化的 commit
- [ ] 每個 commit 都通過本地測試
- [ ] 覆蓋率報告顯示 100%
- [ ] CI/CD 全綠

---

## § 8 參考資源

### Context7 查詢記錄

```typescript
// 已查詢的最佳實踐
[
  'context7:/vitest-dev/vitest:2025-10-24T03:55:04+08:00',
  'context7:/testing-library/react-testing-library:2025-10-24T03:55:04+08:00',
];
```

### 相關文檔

- [CI_CD_AGENT_PROMPT.md](./docs/dev/CI_CD_AGENT_PROMPT.md) - CI/CD 工作流程
- [AGENTS.md](./AGENTS.md) - Agent 操作守則
- [LINUS_GUIDE.md](./LINUS_GUIDE.md) - 開發哲學

---

**最後更新**: 2025-10-24T03:55:04+08:00  
**版本**: v1.0  
**狀態**: ✅ 規劃完成，待執行
