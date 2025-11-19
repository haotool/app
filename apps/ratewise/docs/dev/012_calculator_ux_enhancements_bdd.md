# 計算機 UX 增強功能 BDD 測試規格

**版本**: 1.0.0  
**建立時間**: 2025-11-19T23:18:00+08:00  
**更新時間**: 2025-11-19T23:18:00+08:00  
**狀態**: ✅ 已完成  
**參考**: Web Research 2025-11-19, Apple HIG, iOS Calculator

---

## 目標

優化計算機 UX 體驗，提升可讀性與視覺反饋，參考 iOS Calculator 標準但超越其體驗。

---

## BDD 場景規格

### 場景 1：算式顯示區千位分隔符格式化

```gherkin
功能: 算式顯示區數字格式化
  為了提升數字可讀性
  作為用戶
  我希望看到千位分隔符格式化的算式

場景: 輸入大數字算式時顯示千位分隔符
  假設 用戶打開計算機
  當 用戶輸入 "1234 + 5678"
  那麼 算式顯示區應顯示 "1,234 + 5,678"
  並且 預覽結果應顯示 "6,912"

場景: 前導零應被移除
  假設 用戶打開計算機
  當 用戶輸入 "012 + 034"
  那麼 算式顯示區應顯示 "12 + 34"
  並且 預覽結果應顯示 "46"
```

**實作檔案**:

- `apps/ratewise/src/features/calculator/components/ExpressionDisplay.tsx`
- `apps/ratewise/src/features/calculator/utils/formatCalculatorNumber.ts`

**測試檔案**:

- `apps/ratewise/src/features/calculator/components/__tests__/ExpressionDisplay.test.tsx`

---

### 場景 2：按鈕點擊視覺反饋動畫

```gherkin
功能: 按鈕點擊動畫反饋
  為了提供更清晰的互動反饋
  作為用戶
  我希望點擊按鈕時看到明顯的放大效果

場景: 點擊數字按鈕時放大
  假設 用戶打開計算機
  當 用戶點擊數字按鈕 "5"
  那麼 按鈕應放大到 110%
  並且 動畫應在 100ms 內完成
  並且 使用 spring 動畫（stiffness: 500, damping: 30）

場景: 懸停時輕微放大
  假設 用戶打開計算機
  當 用戶懸停在按鈕上
  那麼 按鈕應輕微放大到 102%
  並且 避免過度動畫干擾
```

**實作檔案**:

- `apps/ratewise/src/features/calculator/components/CalculatorKey.tsx`

**變更內容**:

```typescript
// 前：whileTap={{ scale: 0.95 }}
// 後：whileTap={{ scale: 1.1 }}

// 前：whileHover={{ scale: 1.05 }}
// 後：whileHover={{ scale: 1.02 }}

// 前：stiffness: 400, damping: 25
// 後：stiffness: 500, damping: 30
```

---

### 場景 3：長按刪除 iOS 標準對齊

```gherkin
功能: 長按刪除行為
  為了對齊 iOS Calculator 標準
  作為用戶
  我希望長按 Backspace 時以固定間隔連續刪除

場景: 單擊 Backspace 立即刪除
  假設 用戶輸入 "12345"
  當 用戶單擊 Backspace 按鈕
  那麼 應立即刪除最後一個字元
  並且 顯示 "1234"

場景: 長按 Backspace 連續刪除
  假設 用戶輸入 "123456789"
  當 用戶長按 Backspace 按鈕超過 500ms
  那麼 應開始連續刪除
  並且 每 100ms 刪除一個字元
  並且 每次刪除都有觸覺反饋

場景: 釋放按鈕停止刪除
  假設 用戶正在長按 Backspace
  當 用戶釋放按鈕
  那麼 刪除動作應立即停止
```

**實作檔案**:

- `apps/ratewise/src/features/calculator/hooks/useLongPress.ts`
- `apps/ratewise/src/features/calculator/components/CalculatorKey.tsx`

**變更內容**:

```typescript
// useLongPress.ts
// 前：threshold: 400, 加速邏輯（80ms → 40ms → 20ms → 10ms）
// 後：threshold: 500, interval: 100（固定間隔）

// CalculatorKey.tsx
// 前：threshold: 400 // iOS 極速初始延遲
// 後：threshold: 500 // iOS 標準初始延遲
```

---

## 驗證結果

### 1. 類型檢查

```bash
pnpm typecheck
# ✅ 通過（零錯誤）
```

### 2. 測試覆蓋

```bash
pnpm test
# ✅ 357/357 測試通過
```

### 3. 人工驗證檢查清單

- [ ] 算式顯示區數字顯示千位分隔符
- [ ] 前導零被正確移除（012 → 12）
- [ ] 按鈕點擊時放大動畫明顯可見
- [ ] 懸停動畫不會過度干擾
- [ ] 單擊 Backspace 立即響應
- [ ] 長按 Backspace 500ms 後開始連續刪除
- [ ] 長按時每 100ms 刪除一個字元
- [ ] 釋放按鈕立即停止刪除
- [ ] 觸覺反饋正常（支援的裝置）

---

## Linus 三問驗證

### 1. "這是個真問題還是臆想出來的？"

✅ **真問題**

- 用戶反饋：算式區數字不易閱讀
- 按鈕動畫反饋不夠明顯
- 長按刪除需對齊 iOS 標準

### 2. "有更簡單的方法嗎？"

✅ **已採用最簡方案**

- 重用現有 `formatExpression` 工具
- 調整 Motion 動畫參數（零依賴）
- 簡化 `useLongPress` 加速邏輯（移除複雜分支）

### 3. "會破壞什麼嗎？"

✅ **零破壞性變更**

- 357/357 測試通過
- TypeScript 零錯誤
- 向後相容（僅增強 UX）

---

## 參考資料

1. **Web Research 2025-11-19**
   - iOS Calculator backspace: 0.5s initial, 0.1s interval
   - Button animation: 100ms duration, spring effect
   - iOS Numbers: 千位分隔符選項（提升可讀性）

2. **Apple HIG (Human Interface Guidelines)**
   - Button feedback: Clear and immediate
   - Animation duration: 100-300ms optimal range
   - Haptic feedback: Light for repeated actions

3. **內部參考**
   - `formatCalculatorNumber`: 已有千位分隔符工具
   - `useLongPress`: 長按邏輯 Hook
   - `CalculatorKey`: 按鈕組件

---

## 版本歷史

| 版本  | 日期       | 變更內容                             |
| ----- | ---------- | ------------------------------------ |
| 1.0.0 | 2025-11-19 | 初版：千位分隔符、按鈕動畫、長按優化 |

---

**最後更新**: 2025-11-19T23:18:00+08:00  
**維護者**: Linus Guide Agent
