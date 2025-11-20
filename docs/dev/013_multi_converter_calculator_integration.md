# 013 多幣別計算機整合功能規格 (Multi Converter Calculator Integration)

**版本**: 1.0.0
**建立時間**: 2025-11-20T02:00:00+0800
**更新時間**: 2025-11-20T02:00:00+0800
**狀態**: ✅ 已完成

---

## 📋 Feature 概述

為多幣別轉換頁面（MultiConverter）的輸入框添加計算機按鈕，點擊後彈出計算機 Modal，實現與單幣別（SingleConverter）一致的 UX 體驗。

### 功能目標

1. **計算機按鈕整合**：每個貨幣輸入框右側添加計算機圖標按鈕
2. **Modal 彈出**：點擊按鈕彈出計算機 Modal（重用 CalculatorKeyboard 元件）
3. **計算結果應用**：計算完成後自動填入對應貨幣的輸入框
4. **基準貨幣優先**：基準貨幣（黃色背景）的計算機按鈕應有視覺區分
5. **無障礙支援**：獨特的 aria-label 標示每個計算機按鈕

### 使用者故事

```gherkin
作為 用戶
我想要 在多幣別轉換頁面點擊輸入框內的計算機按鈕
以便 使用計算機輸入複雜金額而不需手動輸入
```

---

## 🎯 BDD 測試場景

### Feature 1: 計算機按鈕顯示

#### Scenario 1.1: 每個貨幣輸入框都有計算機按鈕

```gherkin
場景：多幣別頁面顯示計算機按鈕
  假設 用戶在多幣別轉換頁面
  並且 頁面顯示 USD, JPY, EUR 三種貨幣
  當 頁面載入完成
  那麼 每個貨幣輸入框右側應該顯示計算機圖標按鈕
  並且 按鈕應該有唯一的 aria-label（如 "開啟計算機 (USD)"）
  並且 按鈕應該有 hover 效果
```

#### Scenario 1.2: 基準貨幣計算機按鈕有視覺區分

```gherkin
場景：基準貨幣計算機按鈕視覺區分
  假設 用戶在多幣別轉換頁面
  並且 基準貨幣為 TWD（黃色背景）
  當 頁面載入完成
  那麼 TWD 的計算機按鈕應該使用 yellow-600 色系
  並且 其他貨幣的計算機按鈕應該使用 purple-600 色系
  並且 hover 時應該有對應的高亮色系
```

### Feature 2: 計算機 Modal 彈出

#### Scenario 2.1: 點擊計算機按鈕彈出 Modal

```gherkin
場景：點擊計算機按鈕彈出 Modal
  假設 用戶在多幣別轉換頁面
  並且 USD 輸入框當前金額為 "100"
  當 用戶點擊 USD 輸入框右側的計算機按鈕
  那麼 計算機 Modal 應該彈出
  並且 計算機顯示值應該為 "100"
  並且 背景滾動應該被鎖定
  並且 Modal 標題應該顯示 "計算機"
```

#### Scenario 2.2: 不同貨幣點擊彈出對應的計算機

```gherkin
場景：點擊不同貨幣的計算機按鈕
  假設 用戶在多幣別轉換頁面
  並且 USD 輸入框金額為 "100"
  並且 EUR 輸入框金額為 "85"
  當 用戶點擊 EUR 計算機按鈕
  那麼 計算機 Modal 應該彈出
  並且 計算機顯示值應該為 "85"（EUR 的值，非 USD）
  並且 Modal 關閉時應該更新 EUR 金額
```

### Feature 3: 計算結果應用

#### Scenario 3.1: 計算完成後更新對應貨幣金額

```gherkin
場景：計算完成後更新金額
  假設 用戶在多幣別轉換頁面
  並且 JPY 輸入框當前金額為 "1000"
  當 用戶點擊 JPY 計算機按鈕
  並且 用戶在計算機中輸入 "500 + 300"
  並且 用戶點擊 "=" 計算結果
  並且 用戶確認計算結果（關閉 Modal）
  那麼 JPY 輸入框應該顯示 "800.00"（格式化後）
  並且 其他貨幣的金額應該自動重新計算
  並且 計算機 Modal 應該關閉
```

#### Scenario 3.2: 取消計算不更新金額

```gherkin
場景：取消計算不更新金額
  假設 用戶在多幣別轉換頁面
  並且 CNY 輸入框當前金額為 "500"
  當 用戶點擊 CNY 計算機按鈕
  並且 用戶在計算機中輸入 "1000"
  並且 用戶點擊背景或向下滑動關閉 Modal（未確認）
  那麼 CNY 輸入框應該保持原值 "500.00"
  並且 計算機 Modal 應該關閉
```

### Feature 4: 無障礙與可用性

#### Scenario 4.1: 鍵盤導航支援

```gherkin
場景：鍵盤導航計算機按鈕
  假設 用戶在多幣別轉換頁面
  當 用戶使用 Tab 鍵導航
  那麼 計算機按鈕應該可以被聚焦
  並且 按下 Enter 或 Space 應該彈出計算機 Modal
  並且 聚焦時應該顯示視覺指示（focus ring）
```

#### Scenario 4.2: 螢幕閱讀器支援

```gherkin
場景：螢幕閱讀器識別計算機按鈕
  假設 用戶使用螢幕閱讀器
  當 用戶導航到 USD 計算機按鈕
  那麼 螢幕閱讀器應該讀出 "開啟計算機 (USD)"
  並且 按鈕應該有正確的 role 和 aria 屬性
```

---

## 🏗️ 架構設計

### 元件結構

```
MultiConverter.tsx (修改)
  ├── useState: showCalculator (是否顯示計算機)
  ├── useState: activeCalculatorCurrency (當前計算機對應的貨幣)
  └── CalculatorKeyboard (重用現有元件)
      ├── isOpen={showCalculator}
      ├── onClose={() => setShowCalculator(false)}
      ├── onConfirm={(result) => handleCalculatorConfirm(result)}
      └── initialValue={multiAmounts[activeCalculatorCurrency]}
```

### 狀態管理

```typescript
// 新增狀態
const [showCalculator, setShowCalculator] = useState(false);
const [activeCalculatorCurrency, setActiveCalculatorCurrency] = useState<CurrencyCode | null>(null);

// 計算機確認處理
const handleCalculatorConfirm = (result: number) => {
  if (activeCalculatorCurrency) {
    onAmountChange(activeCalculatorCurrency, result.toString());
    setShowCalculator(false);
    setActiveCalculatorCurrency(null);
  }
};
```

### UI 佈局調整

```typescript
// 輸入框區域增加計算機按鈕
<div className="flex-grow ml-3 relative">
  <input {...existingProps} className="pr-12" /> {/* 增加右側 padding */}
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation(); // 防止觸發行 onClick（切換基準貨幣）
      setActiveCalculatorCurrency(code);
      setShowCalculator(true);
    }}
    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
      code === baseCurrency
        ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
        : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
    }`}
    aria-label={`開啟計算機 (${code})`}
  >
    <Calculator className="w-5 h-5" />
  </button>
  {/* 匯率顯示 */}
</div>
```

---

## 🧪 測試策略

### 單元測試 (Unit Tests)

**檔案**: `MultiConverter.calculator.test.tsx`

**測試案例**:

1. **UI 渲染測試** (5 tests)
   - 應該為每個貨幣渲染計算機按鈕
   - 基準貨幣按鈕應該使用黃色色系
   - 非基準貨幣按鈕應該使用紫色色系
   - 按鈕應該有唯一的 aria-label
   - 按鈕應該有正確的 hover 樣式

2. **互動測試** (8 tests)
   - 點擊計算機按鈕應該彈出 Modal
   - Modal 應該顯示當前貨幣的金額
   - 點擊不同貨幣的按鈕應該顯示對應的金額
   - 計算完成後應該更新對應貨幣的金額
   - 取消計算不應該更新金額
   - 點擊基準貨幣的按鈕應該正常工作
   - 計算機按鈕不應該觸發行點擊（切換基準貨幣）
   - 關閉 Modal 應該清空 activeCalculatorCurrency

3. **無障礙測試** (3 tests)
   - 按鈕應該可以被鍵盤聚焦
   - 按 Enter 或 Space 應該彈出 Modal
   - 螢幕閱讀器應該讀出正確的 aria-label

**預期總測試數**: 16 tests

**覆蓋率目標**: ≥85%

### E2E 測試 (End-to-End Tests)

**檔案**: `multi-converter-calculator.spec.ts` (Playwright)

**測試場景**:

1. 用戶在多幣別頁面使用計算機輸入金額
2. 基準貨幣計算機按鈕視覺區分驗證
3. 計算結果自動更新其他貨幣金額

---

## 📊 成功標準

### 功能性

- ✅ 每個貨幣輸入框都有計算機按鈕
- ✅ 點擊按鈕彈出計算機 Modal
- ✅ 計算結果正確更新對應貨幣金額
- ✅ 取消計算不影響原金額
- ✅ 計算機按鈕不觸發行點擊事件

### 可用性

- ✅ 按鈕位置合理，不遮擋輸入框內容
- ✅ 基準貨幣按鈕有視覺區分
- ✅ Hover 效果清晰
- ✅ 鍵盤導航支援

### 品質

- ✅ 16 個單元測試全通過
- ✅ 覆蓋率 ≥85%
- ✅ TypeScript 零錯誤
- ✅ ESLint 零警告

### 效能

- ✅ 計算機彈出無延遲（<100ms）
- ✅ 金額更新即時反應（<50ms）
- ✅ 無記憶體洩漏

---

## 🔧 技術實作細節

### 重用現有元件

**CalculatorKeyboard**: 已完成的計算機 Modal 元件

- 支援 `initialValue` 屬性
- 支援 `onConfirm` 回調
- 支援背景滾動鎖定（useBodyScrollLock）
- 支援向下滑動關閉

**優勢**:

- 零重複程式碼（DRY 原則）
- 一致的 UX 體驗
- 已測試的穩定元件

### CSS 調整

```css
/* 輸入框右側增加 padding 容納計算機按鈕 */
.currency-input {
  padding-right: 3rem; /* 48px，容納按鈕 + 間距 */
}

/* 計算機按鈕絕對定位 */
.calculator-button {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
}
```

### 事件處理優化

**防止事件冒泡**: 計算機按鈕使用 `e.stopPropagation()` 防止觸發行的 `onClick`（切換基準貨幣）

```typescript
onClick={(e) => {
  e.stopPropagation(); // 關鍵！防止觸發行的點擊事件
  setActiveCalculatorCurrency(code);
  setShowCalculator(true);
}}
```

---

## 🎨 視覺設計

### 計算機按鈕樣式

**基準貨幣（黃色背景行）**:

```css
text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50
```

**非基準貨幣（藍紫漸層行）**:

```css
text-purple-600 hover:text-purple-700 hover:bg-purple-50
```

### 佈局示意

```
┌──────────────────────────────────────────────────────┐
│ [⭐] 🇺🇸 USD                      [100.00] [📱]     │ ← 基準貨幣（黃色背景）
│      美元                         即期 · 基準貨幣    │
├──────────────────────────────────────────────────────┤
│ [⭐] 🇯🇵 JPY                    [15,180.00] [📱]   │ ← 非基準貨幣（藍紫漸層）
│      日圓                         即期 · 1 USD = ... │
└──────────────────────────────────────────────────────┘
                                            ↑
                                    計算機按鈕（右側）
```

---

## 🚦 Linus 三問驗證

### 1. "這是個真問題還是臆想出來的？"

✅ **真問題**

- 用戶回報：多幣別頁面需要計算機功能（與單幣別一致）
- 實際需求：用戶經常需要在多幣別頁面輸入複雜金額
- UX 一致性：單幣別已有計算機，多幣別應該也要有

### 2. "有更簡單的方法嗎？"

✅ **最簡方案**

- 重用 CalculatorKeyboard 元件（零重複程式碼）
- 只需新增 2 個狀態變數
- 只需修改 1 個檔案（MultiConverter.tsx）
- 使用現有的 useCalculator hook（無新依賴）

### 3. "會破壞什麼嗎？"

✅ **不破壞**

- 向後相容：不影響現有的輸入框編輯功能
- 事件隔離：使用 stopPropagation 防止衝突
- 測試覆蓋：16 個新測試確保品質
- 無新依賴：重用現有元件和 hooks

---

## 📝 實作檢查清單

### 開發階段

- [x] 創建 BDD 文檔（本文件）
- [ ] 撰寫單元測試（16 tests）
- [ ] 實作計算機按鈕 UI
- [ ] 實作 Modal 彈出邏輯
- [ ] 實作計算結果更新
- [ ] 修復所有 TypeScript 錯誤
- [ ] 修復所有 ESLint 警告

### 測試階段

- [ ] 執行單元測試（16/16 通過）
- [ ] 執行覆蓋率測試（≥85%）
- [ ] 執行 E2E 測試（Playwright）
- [ ] 手動測試各種瀏覽器（Chrome, Safari, Firefox）
- [ ] 手動測試移動裝置（iOS, Android）

### 品質保證

- [ ] 無障礙測試（鍵盤導航、螢幕閱讀器）
- [ ] 效能測試（彈出速度、記憶體使用）
- [ ] 視覺回歸測試（對比截圖）
- [ ] Code Review 通過

### 文檔更新

- [ ] 更新 002 獎懲記錄
- [ ] 更新 CHANGELOG.md
- [ ] Git 提交與推送

---

## 🔗 相關文件

- `docs/dev/012_calculator_modal_sync_enhancement.md` - 計算機 Modal 基礎實作
- `apps/ratewise/src/features/calculator/components/CalculatorKeyboard.tsx` - 計算機元件
- `apps/ratewise/src/features/calculator/hooks/useCalculator.ts` - 計算機 hook
- `apps/ratewise/src/features/ratewise/components/MultiConverter.tsx` - 多幣別元件

---

**最後更新**: 2025-11-20T02:00:00+0800
**版本**: 1.0.0
**維護者**: Claude Code
