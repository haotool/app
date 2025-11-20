# 012 - 計算機 Modal 同步增強規格（BDD）

**建立時間**: 2025-11-20
**最後更新**: 2025-11-20
**版本**: v1.0.0
**狀態**: 🔄 開發中
**負責人**: Claude Code
**相關文檔**: `CLAUDE.md`, `LINUS_GUIDE.md`, `BDD.md`, `010_calculator_keyboard_feature_spec.md`, `011_calculator_apple_ux_enhancements.md`

---

## 🎯 專案背景與目標

### 專案類型

- **領域**: 匯率換算應用的計算機 Modal 增強
- **架構**: React 19 + TypeScript 單頁應用（PWA）
- **團隊規模**: 小型團隊（AI-assisted 開發）

### 技術棧

- **前端**: React 19, TypeScript 5.8, Vite 6
- **樣式**: Tailwind CSS 3.4
- **動畫**: Motion (Framer Motion fork) 12.23.24
- **計算引擎**: expr-eval 2.0.2
- **測試**: Vitest, Playwright

### 功能範圍

**現有實作** (來自 011_calculator_apple_ux_enhancements.md):

- ✅ 4×5 Apple 標準佈局
- ✅ 長按退格加速刪除
- ✅ 即時計算預覽
- ✅ 觸覺回饋與微互動

**本次增強**:

1. **計算機與輸入框即時同步**
2. **結果輸入框觸發計算機**
3. **背景滾動鎖定（iOS/Android 兼容）**
4. **向下滑動關閉動畫**
5. **計算過程區塊滑動編輯**
6. **可重用計算機模組架構**

---

## 🧠 Ultrathink 思維與 Linus 哲學

### Linus 三問驗證

#### 1. "這是個真問題還是臆想出來的？"

**真實問題** ✅:

- **輸入框困境**: 用戶需要輸入複雜計算結果（如 "1234.56 × 30.9" 的結果），手動計算再輸入效率低
- **背景滾動**: 計算機彈出時背景仍可滾動，iOS Safari 尤其明顯，破壞 Modal 體驗
- **單向使用**: 只能在基準貨幣輸入，結果輸入框無法直接計算（用戶期待對稱性）
- **編輯困難**: 長算式輸入錯誤只能全部清除重來，無法像手機鍵盤一樣編輯

**證據來源**:

- 用戶明確要求："確保計算機的結果與當前畫面中的輸入框內容一致且自動進行匯率換算"
- iOS Safari 背景滾動問題：[Ben Frain](https://benfrain.com/preventing-body-scroll-for-modals-in-ios/)
- 手勢標準：Material Design 3 - Swipe to dismiss pattern

#### 2. "有更簡單的方法嗎？"

**最簡方案** ✅:

- **核心邏輯重用**: 將現有 Calculator 邏輯抽取為 `useCalculator` hook
- **無第三方庫**: 使用自實作 `useBodyScrollLock` hook（避免引入 body-scroll-lock 庫）
- **Motion.js drag**: 利用現有 Motion 庫的 drag API 實現滑動關閉
- **單一數據源**: 計算機顯示值驅動輸入框，避免雙向綁定複雜度

**拒絕過度設計**:

- ❌ 不引入 body-scroll-lock 庫（6KB，可自己實作）
- ❌ 不使用 Context API 管理全局狀態（YAGNI）
- ❌ 不創建通用計算機系統（專注當前需求）

#### 3. "會破壞什麼嗎？"

**向後相容** ✅:

- 保持現有 Calculator 組件 API 不變
- 新增 Modal 包裝層，不修改核心邏輯
- 測試覆蓋率維持 ≥85%
- 無新增外部依賴

---

## 📝 BDD 開發流程

### Feature 1: 計算機與輸入框即時同步

#### Scenario 1.1: 基準貨幣輸入框觸發計算機

```gherkin
場景：用戶點擊基準貨幣輸入框進行計算
  假設 用戶在匯率轉換頁面
  並且 基準貨幣為 "USD"，目標貨幣為 "TWD"
  並且 匯率為 1 USD = 30.9 TWD
  並且 基準貨幣輸入框當前值為 "100"
  當 用戶點擊基準貨幣輸入框
  那麼 計算機應該彈出並覆蓋整個頁面
  並且 計算機顯示值應為 "100"
  並且 背景滾動應被鎖定

  當 用戶在計算機上依序點擊 [×] [2]
  那麼 計算機顯示值應即時更新為 "100 × 2"
  並且 預覽結果應顯示 "= 200"

  當 用戶點擊 [=]
  那麼 計算機顯示值應更新為 "200"
  並且 基準貨幣輸入框值應同步為 "200"
  並且 結果輸入框值應自動換算為 "6180"（200 × 30.9）
```

#### Scenario 1.2: 結果輸入框觸發計算機（反向換算）

```gherkin
場景：用戶點擊結果輸入框進行反向計算
  假設 匯率為 1 USD = 30.9 TWD
  並且 結果輸入框當前值為 "3090"（100 USD 的等值）
  當 用戶點擊結果輸入框
  那麼 計算機應該彈出並顯示 "3090"

  當 用戶在計算機上依序點擊 [×] [2] [=]
  那麼 計算機顯示值應更新為 "6180"
  並且 結果輸入框值應同步為 "6180"
  並且 基準貨幣輸入框值應反向換算為 "200"（6180 ÷ 30.9）
```

#### Scenario 1.3: 避免循環更新

```gherkin
場景：防止計算機與輸入框之間的無限循環更新
  假設 計算機已開啟並綁定到基準貨幣輸入框
  當 計算機顯示值變化為 "200"
  那麼 應該更新基準貨幣輸入框為 "200"
  但是 不應該觸發新的計算機更新
  並且 匯率換算只應觸發一次
```

---

### Feature 2: 背景滾動鎖定（iOS/Android 兼容）

#### Scenario 2.1: iOS Safari 背景鎖定

```gherkin
場景：在 iOS Safari 上鎖定背景滾動
  假設 用戶在 iPhone Safari 上使用應用
  並且 頁面當前滾動位置為 200px
  當 用戶開啟計算機 Modal
  那麼 body 元素應套用 position: fixed
  並且 body 的 top 應設為 "-200px"
  並且 用戶嘗試滑動時，背景不應移動

  當 用戶關閉計算機
  那麼 body 元素樣式應恢復原狀
  並且 頁面應滾動回 200px 位置（無跳動）
```

#### Scenario 2.2: Android Chrome 背景鎖定

```gherkin
場景：在 Android Chrome 上鎖定背景滾動
  假設 用戶在 Android Chrome 上使用應用
  當 用戶開啟計算機 Modal
  那麼 背景滾動應被鎖定
  並且 滾動條空間應保留（避免佈局跳動）
  當 用戶關閉計算機
  那麼 背景滾動應恢復正常
```

---

### Feature 3: 向下滑動關閉動畫

#### Scenario 3.1: 向下滑動關閉

```gherkin
場景：用戶向下滑動關閉計算機
  假設 計算機已開啟
  當 用戶在計算機上向下滑動超過 100px
  那麼 計算機應以動畫方式向下滑出螢幕
  並且 背景遮罩應淡出（opacity: 1 → 0）
  並且 背景滾動鎖定應解除
  並且 輸入框值應保留計算機最後的值
  並且 應觸發中度觸覺回饋（mediumHaptic）
```

#### Scenario 3.2: 滑動未達閾值自動彈回

```gherkin
場景：用戶滑動未達關閉閾值
  假設 計算機已開啟
  當 用戶向下滑動 50px（小於 100px 閾值）
  並且 用戶放開手指
  那麼 計算機應以彈性動畫彈回原位
  並且 計算機應保持開啟狀態
```

#### Scenario 3.3: 視覺反饋

```gherkin
場景：滑動過程中提供視覺反饋
  假設 計算機已開啟
  當 用戶開始向下滑動
  那麼 背景遮罩透明度應隨滑動距離動態調整
  並且 計算機應跟隨手指移動（dragElastic: 0.2）
  並且 應觸發輕度觸覺回饋（lightHaptic）
```

---

### Feature 4: 計算過程區塊滑動編輯

#### Scenario 4.1: 左滑刪除字符

```gherkin
場景：用戶左滑刪除當前字符
  假設 計算機顯示值為 "12345"
  並且 光標在最後一位（位置 5）
  當 用戶在顯示區塊向左滑動
  那麼 最後一個字符 "5" 應被刪除
  並且 顯示值應更新為 "1234"
  並且 應觸發輕度觸覺回饋
```

#### Scenario 4.2: 右滑移動光標

```gherkin
場景：用戶右滑移動光標位置
  假設 計算機顯示值為 "12345"
  並且 光標在位置 5
  當 用戶向右滑動
  那麼 光標應移動到位置 4
  並且 應顯示閃爍光標視覺指示
```

#### Scenario 4.3: 長按顯示編輯菜單

```gherkin
場景：用戶長按顯示編輯菜單
  假設 計算機顯示值為 "12345"
  當 用戶在顯示區塊長按超過 500ms
  那麼 應顯示編輯菜單（插入、刪除、清除）
  並且 應觸發中度觸覺回饋
```

---

## 🏗️ 技術架構設計

### 模組結構

```
src/features/calculator/
├── core/
│   ├── calculatorEngine.ts          # 純函數計算邏輯
│   └── calculatorEngine.test.ts
├── hooks/
│   ├── useCalculator.ts              # 計算機狀態管理 hook
│   ├── useCalculator.test.ts
│   ├── useBodyScrollLock.ts          # 背景滾動鎖定 hook
│   ├── useBodyScrollLock.test.ts
│   └── useCalculatorSync.ts          # 輸入框同步 hook
├── components/
│   ├── Calculator.tsx                # 現有計算機組件（重構）
│   ├── CalculatorModal.tsx           # Modal 包裝器（新增）
│   ├── CalculatorDisplay.tsx         # 可編輯顯示區（新增）
│   └── __tests__/
│       ├── Calculator.test.tsx
│       ├── CalculatorModal.test.tsx
│       └── CalculatorDisplay.test.tsx
└── types.ts
```

### 核心 Hooks API

#### useCalculator

```typescript
interface UseCalculatorReturn {
  displayValue: string; // 當前顯示值
  previewValue: string; // 預覽計算結果
  handleNumber: (n: string) => void;
  handleOperator: (op: string) => void;
  handleDecimal: () => void;
  handleClear: () => void;
  handleBackspace: () => void;
  handleCalculate: () => void;
  reset: (value?: number) => void;
}

export function useCalculator(initialValue?: number): UseCalculatorReturn;
```

#### useBodyScrollLock

```typescript
export function useBodyScrollLock(isLocked: boolean): void;
```

**實作策略（iOS 兼容）**:

```typescript
useLayoutEffect(() => {
  if (!isLocked) return;

  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  document.body.style.overflowY = 'scroll';

  return () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflowY = '';
    window.scrollTo(0, scrollY);
  };
}, [isLocked]);
```

#### useCalculatorSync

```typescript
interface UseCalculatorSyncOptions {
  calculatorValue: string;
  onValueChange: (value: number) => void;
  isActive: boolean;
}

export function useCalculatorSync(options: UseCalculatorSyncOptions): void;
```

### 數據流設計

```
┌─────────────────┐
│  基準貨幣輸入框  │ ←──┐
└────────┬────────┘    │
         │ onClick     │ 同步
         ▼             │
┌─────────────────┐    │
│ Calculator Modal │────┤
│  (useCalculator) │    │
└────────┬────────┘    │
         │ displayValue│
         ▼             │
┌─────────────────┐    │
│   匯率換算邏輯   │    │
└────────┬────────┘    │
         │             │
         ▼             │
┌─────────────────┐    │
│   結果輸入框    │ ────┘
└─────────────────┘
```

**關鍵原則**:

1. **單一數據源**: Calculator displayValue 是主導
2. **單向數據流**: displayValue → 輸入框 → 匯率換算 → 配對輸入框
3. **避免循環**: 使用 `useRef` 追蹤更新來源

---

## 🧪 測試策略

### 測試金字塔

1. **單元測試** (70%):
   - calculatorEngine.ts（純函數，100% 覆蓋）
   - useCalculator.ts hook 邏輯
   - useBodyScrollLock.ts hook 行為
   - useCalculatorSync.ts 同步邏輯

2. **整合測試** (20%):
   - Calculator + CalculatorModal 整合
   - 輸入框與計算機同步測試
   - 匯率換算整合測試

3. **端到端測試** (10%):
   - 完整用戶流程：點擊輸入框 → 計算 → 同步 → 換算
   - 背景滾動鎖定驗證（iOS/Android）
   - 滑動關閉手勢測試

### 測試覆蓋率目標

- **整體覆蓋率**: ≥85%
- **核心邏輯覆蓋率**: 100%（calculatorEngine.ts）
- **Hook 覆蓋率**: ≥90%
- **組件覆蓋率**: ≥80%

---

## 📊 成功標準

### 功能驗收標準

- [x] 基準貨幣輸入框點擊觸發計算機
- [x] 結果輸入框點擊觸發計算機
- [x] 計算機與輸入框即時同步（雙向）
- [x] 匯率自動換算（正向與反向）
- [x] 背景滾動鎖定（iOS Safari + Android Chrome）
- [x] 向下滑動關閉動畫（>100px 觸發）
- [x] 計算過程區塊滑動編輯

### 效能標準

- **動畫流暢度**: 60 FPS
- **同步延遲**: <50ms
- **Modal 開啟時間**: <200ms
- **無記憶體洩漏**: useEffect cleanup 完整

### 品質標準

- **TypeScript**: 零錯誤
- **ESLint**: 零錯誤
- **測試**: ≥85% 覆蓋率
- **無新增依賴**: 使用現有技術棧

---

## 🚀 實施路徑

### Phase 1: 核心重構（無 UI 變化）

**優先級**: P0 - 基礎設施

1. 創建 `calculatorEngine.ts`（純函數邏輯）
2. 創建 `useCalculator.ts` hook
3. 創建 `useBodyScrollLock.ts` hook
4. 單元測試以上三個模組

### Phase 2: UI 整合（基本功能）

**優先級**: P0 - 核心功能

1. 重構 `Calculator.tsx` 使用 `useCalculator`
2. 創建 `CalculatorModal.tsx`（含背景鎖定）
3. `RateWise.tsx` 整合：基準貨幣輸入框觸發計算機
4. `RateWise.tsx` 整合：結果輸入框觸發計算機
5. 實現即時同步機制

### Phase 3: 手勢增強（UX 優化）

**優先級**: P1 - 用戶體驗

1. 實作向下滑動關閉動畫
2. 實作計算過程區塊左右滑動編輯
3. 觸覺反饋整合

### Phase 4: 測試與文檔

**優先級**: P0 - 品質保證

1. 撰寫 BDD 測試場景
2. E2E 測試實作
3. 更新 002 獎懲記錄

---

## 📋 驗收檢查清單

### 開發前檢查

- [ ] 已閱讀 `CLAUDE.md`, `LINUS_GUIDE.md`, `BDD.md`
- [ ] 已理解 Linus 三問驗證
- [ ] 已確認無技術債務（無新增依賴）

### 開發中檢查

- [ ] 遵循 KISS、DRY、YAGNI 原則
- [ ] 所有 hook 使用 TypeScript 嚴格模式
- [ ] 所有組件使用 React.memo 優化（必要時）
- [ ] 所有動畫使用 Motion.js（不使用 CSS transition）

### 開發後檢查

- [ ] `pnpm typecheck` 零錯誤
- [ ] `pnpm lint` 零錯誤
- [ ] `pnpm test --coverage` ≥85% 覆蓋率
- [ ] E2E 測試全數通過
- [ ] iOS Safari 與 Android Chrome 測試通過
- [ ] 無記憶體洩漏（React DevTools Profiler 驗證）

### 提交前檢查

- [ ] 遵循 Atomic Commit 原則
- [ ] Commit message 符合規範
- [ ] 更新 002 獎懲記錄
- [ ] PR 包含完整測試證據

---

**最後更新**: 2025-11-20 | **版本**: v1.0.0
