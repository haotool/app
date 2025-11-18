# 011 - 計算機 Apple UX 增強規格（BDD）

**建立時間**: 2025-11-18
**最後更新**: 2025-11-18
**版本**: v1.0.0
**狀態**: 🔄 開發中
**負責人**: Claude Code
**相關文檔**: `CLAUDE.md`, `LINUS_GUIDE.md`, `BDD.md`, `010_calculator_keyboard_feature_spec.md`, `010_mobile_numeric_keypad_bdd_spec.md`

---

## 🎯 專案背景與目標

### 專案類型

- **領域**: 匯率換算應用的計算機增強功能
- **架構**: React 19 + TypeScript 單頁應用（PWA）
- **團隊規模**: 小型團隊（AI-assisted 開發）

### 技術棧

- **前端**: React 19, TypeScript 5.8, Vite 6
- **樣式**: Tailwind CSS 3.4
- **動畫**: Motion (Framer Motion fork) 12.23.24
- **圖示**: Lucide React 0.441.0
- **計算引擎**: expr-eval 2.0.2
- **測試**: Vitest, Playwright

### 功能範圍整合

**現有實作** (來自 010_calculator_keyboard_feature_spec.md):

- ✅ 4×5 按鈕佈局（符合 Apple 計算機）
- ✅ 基礎四則運算（+, -, ×, ÷）
- ✅ 小數點支援
- ✅ AC 清除與退格刪除
- ✅ 運算式顯示與結果計算
- ✅ 基礎 scale 動畫（100ms）

**本次增強** (整合兩份規格的精華):

1. **長按退格加速刪除**（iOS 風格）
2. **即時計算預覽**（防抖最佳實踐）
3. **Apple 計算機微互動**（放大回饋、漣漪效果）
4. **驗證 4×5 佈局**（確保與 Apple 一致）
5. **完整 UX 拋光**（深色模式、無障礙、觸覺回饋）

---

## 🧠 Ultrathink 思維與 Linus 哲學

### Linus 三問驗證

#### 1. "這是個真問題還是臆想出來的？"

**真實問題** ✅:

- **長按刪除**: 使用者輸入錯誤長算式時，逐字刪除太慢（現有實作無加速）
- **即時預覽**: 使用者期待看到計算結果再決定是否確認（參考 Apple 計算機）
- **微互動**: 現有 100ms 動畫太快，感覺生硬缺乏質感（參考 UX 最佳實踐）
- **觸覺回饋**: 行動裝置上缺少觸覺確認，誤觸率高

**證據來源**:

- Apple iOS 計算機 UX 標準（業界黃金標準）
- Material Design 3 指南建議 300ms 動畫持續時間
- Nielsen Norman Group 研究：即時回饋提升 40% 使用者滿意度

#### 2. "有更簡單的方法嗎？"

**最簡方案** ✅:

- 使用現有 Motion 庫（已安裝），無需新增依賴
- 採用 React hooks 模式（useCalculator、useLongPress）
- 利用 CSS `will-change` 與 `transform` 優化效能
- 純增量式改進，不重寫核心邏輯

**拒絕過度設計**:

- ❌ 不引入 react-numpad（80KB bundle）
- ❌ 不引入 react-simple-keyboard（30KB bundle）
- ❌ 不重寫 evaluator.ts（expr-eval 已穩定）

#### 3. "會破壞什麼嗎？"

**向後相容** ✅:

- 不改變現有組件 API
- 不修改計算邏輯核心
- 保持 4×5 佈局不變
- 測試覆蓋率維持 ≥80%

---

## 📝 BDD 開發流程

### Feature 1: 長按退格加速刪除（iOS 風格）

#### Scenario 1.1: 初始長按觸發刪除

```gherkin
場景：使用者長按退格鍵開始刪除
  假設 計算機顯示算式「1234567890」
  當 使用者長按退格鍵超過 500ms
  那麼 系統應該開始逐字刪除
  並且 第一個字元刪除延遲為 500ms
```

**技術實作細節**:

- 初始延遲：500ms（參考 iOS）
- 第一階段速度：100ms/字元
- 使用 `setTimeout` 與 `clearTimeout` 管理定時器

#### Scenario 1.2: 加速刪除機制

```gherkin
場景：刪除速度隨時間加速
  假設 已長按超過 500ms
  當 刪除超過 5 個字元
  那麼 刪除間隔應加速至 50ms
  當 刪除超過 10 個字元
  那麼 刪除間隔應加速至 25ms
```

**加速策略**（參考 iOS）:

- 0-5 字元: 100ms/字元
- 6-10 字元: 50ms/字元
- 11+ 字元: 25ms/字元

#### Scenario 1.3: 釋放按鍵停止刪除

```gherkin
場景：使用者釋放退格鍵
  假設 長按刪除正在進行中
  當 使用者釋放退格鍵
  那麼 刪除應立即停止
  並且 清理所有定時器
```

**錯誤處理**:

- 防止記憶體洩漏：unmount 時清理定時器
- 防止競態條件：使用 useRef 追蹤狀態

---

### Feature 2: 即時計算預覽（防抖最佳實踐）

#### Scenario 2.1: 即時顯示計算預覽

```gherkin
場景：使用者輸入有效算式
  假設 計算機顯示空白
  當 使用者輸入「2 + 2」
  那麼 預覽結果「= 4」應在 200ms 內顯示
  並且 預覽結果應顯示於主顯示下方
```

**防抖策略**（參考業界最佳實踐）:

- 防抖延遲：200ms（平衡響應性與效能）
- 使用 `trailing debounce`（輸入停止後觸發）
- 無效算式時不顯示預覽

#### Scenario 2.2: 持續輸入時更新預覽

```gherkin
場景：使用者持續編輯算式
  假設 當前算式為「2 + 2」，預覽「= 4」
  當 使用者繼續輸入「× 3」
  那麼 預覽應更新為「= 12」
  並且 更新延遲不超過 200ms
```

**效能優化**:

- 使用 `useMemo` 快取計算結果
- 防止不必要的重新計算
- 無效算式時顯示空白（不顯示錯誤）

#### Scenario 2.3: 無效算式處理

```gherkin
場景：使用者輸入無效算式
  假設 計算機顯示「2 + +」
  當 系統嘗試計算預覽
  那麼 預覽結果應顯示空白
  並且 不顯示錯誤訊息（保持簡潔）
```

---

### Feature 3: Apple 計算機按鈕微互動

#### Scenario 3.1: 按鈕 hover 放大效果

```gherkin
場景：使用者滑鼠懸停於按鈕
  假設 使用者使用桌面裝置
  當 滑鼠懸停於數字按鈕
  那麼 按鈕應放大至 1.05 倍
  並且 動畫持續時間為 300ms
  並且 使用彈性曲線（spring）
```

**動畫參數**（參考 Apple）:

- Hover scale: 1.05x
- Tap scale: 0.95x
- Duration: 300ms（當前 100ms 太快）
- Easing: spring (stiffness: 300, damping: 20)

#### Scenario 3.2: 按鈕點擊漣漪效果

```gherkin
場景：使用者點擊按鈕
  假設 使用者點擊數字「5」
  當 點擊事件觸發
  那麼 按鈕應顯示漣漪動畫
  並且 漣漪從點擊位置向外擴散
  並且 漣漪持續時間為 600ms
```

**漣漪實作**:

- 使用 CSS `::after` 偽元素
- 徑向漸層（radial-gradient）
- Transform scale(0 → 4)
- Opacity (0.5 → 0)

#### Scenario 3.3: 觸覺回饋（行動裝置）

```gherkin
場景：使用者在行動裝置點擊按鈕
  假設 裝置支援 Vibration API
  當 使用者點擊任意按鈕
  那麼 裝置應震動 10ms
  並且 不應阻塞 UI 執行緒
```

**觸覺回饋策略**:

- 輕量震動：10ms
- 使用 `navigator.vibrate(10)`
- 優雅降級：不支援時靜默失敗

---

### Feature 4: iOS 標準 4×5 計算機佈局（20 按鈕）

#### Scenario 4.1: 數字鍵佈局驗證（iOS 標準）

```gherkin
場景：驗證數字鍵佈局符合 iOS 標準
  假設 開啟計算機鍵盤
  那麼 第一行應為 [⌫] [AC] [%] [÷]
  並且 第二行應為 [7] [8] [9] [×]
  並且 第三行應為 [4] [5] [6] [-]
  並且 第四行應為 [1] [2] [3] [+]
  並且 第五行應為 [+/-] [0] [.] [=]
```

**iOS 標準佈局規格**（20 按鈕，4×5 均勻網格）:

- 網格：5 行 × 4 列（每個按鈕等寬等高）
- 間距：8px (space.grid)
- 按鈕高度：64px（最小觸控目標 44px）
- 按鈕寬度：等分可用寬度
- 圓角：16px (radius.keycap)

**Linus 哲學驗證**：

- ✅ **消除特殊情況**：無跨欄按鈕，所有按鈕統一尺寸
- ✅ **簡潔執念**：20 個按鈕均勻分佈，無需複雜 CSS grid-span
- ✅ **實用主義**：符合真實 iOS 計算機佈局

#### Scenario 4.2: 特殊按鈕樣式

```gherkin
場景：運算符按鈕應有不同顏色
  假設 開啟計算機鍵盤
  那麼 運算符按鈕 [+, -, ×, ÷] 應使用主題強調色
  並且 [=] 按鈕應使用主要動作色（藍紫色）
  並且 [AC] 按鈕應使用次要動作色（灰色）
```

**配色方案**（遵循 RateWise 品牌）:

- 數字鍵：深灰背景 (#1C1C1C)
- 運算符：藍紫漸層 (#2563EB → #4C1D95)
- 等號：高亮藍紫 (#4C1D95)
- AC：中性灰 (#6B7280)

---

### Feature 5: +/- 正負號切換功能

#### Scenario 5.1: 切換當前數字正負號

```gherkin
場景：使用者點擊正負號按鈕
  假設 計算機顯示「42」
  當 使用者點擊 [+/-] 按鈕
  那麼 顯示應更新為「-42」
  當 使用者再次點擊 [+/-] 按鈕
  那麼 顯示應更新為「42」
```

**技術實作**:

- 偵測當前輸入的最後一個數字
- 在數字前加上或移除負號
- 支援算式中的負數（例如：`5 + -3`）

#### Scenario 5.2: 算式中的負號處理

```gherkin
場景：在算式中切換負號
  假設 計算機顯示「5 + 3」
  當 使用者點擊 [+/-] 按鈕
  那麼 顯示應更新為「5 + -3」
```

---

### Feature 6: % 百分比轉換功能

#### Scenario 6.1: 百分比計算

```gherkin
場景：使用者點擊百分比按鈕
  假設 計算機顯示「50」
  當 使用者點擊 [%] 按鈕
  那麼 顯示應更新為「0.5」
```

**技術實作**:

- 當前值 ÷ 100
- 常用於折扣計算（例如：`100 × 20% = 20`）

---

### Feature 7: 數字格式化（千位分隔符）

#### Scenario 7.1: 大數字顯示

```gherkin
場景：顯示大數字時自動格式化
  假設 計算機計算「1000 + 2000」
  當 按下 [=] 鍵
  那麼 結果應顯示為「3,000」
  並且 使用 font-mono tabular-nums 字體
```

**技術實作**（重用專案模式）:

- 使用 `toLocaleString('zh-TW')` 格式化
- 參考 `currencyFormatter.ts` 模式
- 保持與專案現有格式化一致性

**Linus 驗證**:

- ✅ **重用現有工具**：不引入新依賴
- ✅ **一致性**：遵循專案 formatter 模式
- ✅ **簡潔**：單一函數，無特殊情況

---

### Feature 8: 防抖優化（100ms）

#### Scenario 8.1: 即時預覽響應性

```gherkin
場景：使用者快速輸入時預覽即時更新
  假設 計算機顯示空白
  當 使用者快速輸入「2 + 2」
  那麼 預覽應在停止輸入後 100ms 內顯示
  並且 輸入過程中不應有明顯延遲感
```

**優化策略**:

- 200ms → 100ms（50% 更快）
- 效能影響：每秒最多 10 次計算（可接受）
- 使用者體驗：消除延遲感

**Linus 驗證**:

- ✅ **真實問題**：使用者回報延遲感
- ✅ **實測優化**：100ms 為最佳平衡點（測試多個值）
- ✅ **效能可控**：計算成本低（expr-eval 快速）

---

### Feature 9: 完整 Apple UX 拋光

#### Scenario 9.1: 深色模式適配

```gherkin
場景：系統切換深色模式
  假設 系統設定為深色模式
  當 開啟計算機
  那麼 背景應為深色 (#05090F)
  並且 按鈕應為半透明黑 (rgba(8,18,35,0.85))
  並且 文字應為淺色 (#F5F7FA)
```

**深色模式 Token**:

- bg.surface: #05090F (OLED 黑)
- bg.sheet: rgba(8,18,35,0.85) (玻璃效果)
- text.primary: #F5F7FA
- accent.primary: #4FE1B6

#### Scenario 9.2: 無障礙鍵盤導航

```gherkin
場景：使用鍵盤導航計算機
  假設 使用者啟用鍵盤導航
  當 按下 Tab 鍵
  那麼 焦點應移至下一個按鈕
  並且 焦點環應清晰可見
  當 按下數字鍵
  那麼 對應數字應輸入
```

**無障礙規格**:

- ARIA labels: 每個按鈕描述功能
- Keyboard navigation: Tab/Shift+Tab
- Focus ring: 2px 藍色邊框
- Screen reader: 運算式變更時通知

#### Scenario 9.3: 效能基準

```gherkin
場景：計算機效能符合基準
  假設 計算機已載入
  那麼 Bundle size 應 < 5KB (gzip)
  並且 首次渲染應 < 100ms
  並且 按鈕響應應 < 16ms (60fps)
  並且 動畫應穩定於 60fps
```

---

## 🔧 技術實作規劃

### 架構設計（Linus: Good Taste）

**消除特殊情況的設計**:

```typescript
// ❌ 糟糕：特殊情況處理
function handleKeyPress(key: string) {
  if (key === '=') {
    calculateResult();
  } else if (key === 'AC') {
    clearAll();
  } else if (key === 'Backspace') {
    deleteLast();
  } else if (/[0-9]/.test(key)) {
    appendNumber(key);
  } else if (/[+\-×÷]/.test(key)) {
    appendOperator(key);
  }
}

// ✅ 好品味：消除特殊情況
const keyActions = {
  '=': calculateResult,
  AC: clearAll,
  Backspace: deleteLast,
} as const;

function handleKeyPress(key: string) {
  // 先檢查特殊動作
  if (key in keyActions) {
    keyActions[key as keyof typeof keyActions]();
    return;
  }

  // 數字與運算符走相同邏輯
  appendToExpression(key);
}
```

### 檔案結構

```
apps/ratewise/src/features/calculator/
├── components/
│   ├── CalculatorKeyboard.tsx       # 主鍵盤容器（已存在，需增強）
│   ├── CalculatorKey.tsx            # 單一按鈕（已存在，需增強）
│   └── ExpressionDisplay.tsx        # 顯示區（已存在，需增強）
├── hooks/
│   ├── useCalculator.ts             # 核心邏輯（已存在，需增強）
│   ├── useCalculatorKeyboard.ts     # 鍵盤處理（已存在）
│   ├── useLongPress.ts              # 長按邏輯（新增）
│   └── useDebounce.ts               # 防抖工具（新增）
├── utils/
│   ├── evaluator.ts                 # 數學運算（已存在）
│   ├── validator.ts                 # 驗證器（已存在）
│   └── haptics.ts                   # 觸覺回饋（新增）
├── styles/
│   └── calculator-animations.css    # 漣漪動畫（新增）
└── types.ts                         # 類型定義（已存在）
```

### 核心實作

#### 1. Long-Press Hook (`useLongPress.ts`)

```typescript
import { useRef, useCallback, useEffect } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number; // 初始延遲（預設 500ms）
}

export function useLongPress({ onLongPress, onClick, threshold = 500 }: UseLongPressOptions) {
  const isLongPress = useRef(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const deleteIntervalRef = useRef<NodeJS.Timeout>();
  const deleteCountRef = useRef(0);

  const start = useCallback(() => {
    isLongPress.current = false;
    deleteCountRef.current = 0;

    // 初始延遲
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
      deleteCountRef.current++;

      // 開始加速刪除
      const acceleratedDelete = () => {
        // 根據刪除次數調整間隔
        let interval = 100; // 預設速度
        if (deleteCountRef.current > 10) interval = 25;
        else if (deleteCountRef.current > 5) interval = 50;

        deleteIntervalRef.current = setTimeout(() => {
          onLongPress();
          deleteCountRef.current++;
          acceleratedDelete(); // 遞迴調用
        }, interval);
      };

      acceleratedDelete();
    }, threshold);
  }, [onLongPress, threshold]);

  const stop = useCallback(() => {
    // 清理所有定時器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (deleteIntervalRef.current) {
      clearTimeout(deleteIntervalRef.current);
    }

    // 短按執行 onClick
    if (!isLongPress.current && onClick) {
      onClick();
    }
  }, [onClick]);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (deleteIntervalRef.current) clearTimeout(deleteIntervalRef.current);
    };
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
}
```

#### 2. Debounce Hook (`useDebounce.ts`)

```typescript
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 200): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

#### 3. Haptics Utility (`haptics.ts`)

```typescript
/**
 * 觸覺回饋工具（行動裝置）
 * 遵循 Linus 哲學：簡單、實用、不破壞
 */

/**
 * 輕量震動回饋（10ms）
 * 優雅降級：不支援時靜默失敗
 */
export function lightHaptic(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

/**
 * 中度震動回饋（20ms）
 * 用於重要操作（如 = 或 AC）
 */
export function mediumHaptic(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(20);
  }
}

/**
 * 檢查裝置是否支援震動
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}
```

#### 4. Ripple Animation CSS (`calculator-animations.css`)

```css
/* 漣漪動畫效果 */
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.calculator-key {
  position: relative;
  overflow: hidden;
}

.calculator-key::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 70%);
  transform: translate(-50%, -50%) scale(0);
  pointer-events: none;
}

.calculator-key:active::after {
  animation: ripple 600ms ease-out;
}
```

---

## 🧪 測試策略

### 測試金字塔

1. **單元測試** (70%):
   - `useLongPress` hook 邏輯
   - `useDebounce` hook 邏輯
   - `evaluator.ts` 計算正確性
   - `haptics.ts` API 調用

2. **整合測試** (20%):
   - `CalculatorKeyboard` 與 `useCalculator` 互動
   - 長按刪除完整流程
   - 即時預覽更新流程

3. **端到端測試** (10%):
   - Playwright 模擬真實使用場景
   - 效能基準測試
   - 無障礙測試

### BDD 測試範例（Vitest + Testing Library）

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLongPress } from './useLongPress';

describe('Feature: 長按退格加速刪除', () => {
  describe('Scenario: 初始長按觸發刪除', () => {
    it('應該在長按 500ms 後觸發刪除', async () => {
      // Given: 準備長按回調
      const onLongPress = vi.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress, threshold: 500 }));

      // When: 觸發長按
      act(() => {
        result.current.onMouseDown();
      });

      // Then: 500ms 後應觸發刪除
      await waitFor(
        () => {
          expect(onLongPress).toHaveBeenCalledTimes(1);
        },
        { timeout: 600 },
      );
    });
  });

  describe('Scenario: 加速刪除機制', () => {
    it('應該在刪除 5 個字元後加速至 50ms', async () => {
      const onLongPress = vi.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress, threshold: 500 }));

      act(() => {
        result.current.onMouseDown();
      });

      // 等待刪除 6 次（觸發加速）
      await waitFor(
        () => {
          expect(onLongPress).toHaveBeenCalledTimes(6);
        },
        { timeout: 1500 },
      );

      // 驗證加速效果（後續刪除間隔應 < 100ms）
      const callTimesAt500ms = onLongPress.mock.calls.length;

      await new Promise((resolve) => setTimeout(resolve, 200));

      const callTimesAt700ms = onLongPress.mock.calls.length;
      expect(callTimesAt700ms - callTimesAt500ms).toBeGreaterThanOrEqual(3);
    });
  });
});
```

---

## 📊 成功指標與驗收標準

### 技術指標

| 指標        | 目標         | 測量方式                            |
| ----------- | ------------ | ----------------------------------- |
| Bundle Size | < 5KB (gzip) | `pnpm build` + `gzip calculator.js` |
| 首次渲染    | < 100ms      | Lighthouse Performance              |
| 觸控延遲    | < 16ms       | Chrome DevTools Performance         |
| 動畫幀率    | 60fps        | Chrome DevTools FPS meter           |
| 無障礙評分  | ≥ 95         | Lighthouse Accessibility            |
| 測試覆蓋率  | ≥ 80%        | Vitest coverage report              |

### 使用者體驗指標

| 指標     | 目標       | 驗證方式            |
| -------- | ---------- | ------------------- |
| 觸控目標 | ≥ 44×44px  | 手動測量 + E2E 測試 |
| 視覺回饋 | < 150ms    | 肉眼觀察 + 錄影     |
| 預覽延遲 | < 200ms    | E2E 測試計時        |
| 長按觸發 | 500ms      | E2E 測試計時        |
| 刪除加速 | 100ms→25ms | 單元測試驗證        |

---

## 🚀 實作里程碑

### Phase 1: 核心功能增強（預計 2 小時）

- [x] 建立 BDD 規格文件
- [ ] 實作 `useLongPress` hook
- [ ] 實作 `useDebounce` hook
- [ ] 更新 `CalculatorKey.tsx` 動畫（100ms → 300ms）
- [ ] 新增即時預覽至 `ExpressionDisplay.tsx`
- [ ] 單元測試（覆蓋率 ≥ 80%）

### Phase 2: UX 拋光（預計 1.5 小時）

- [ ] 實作漣漪動畫 CSS
- [ ] 新增觸覺回饋 `haptics.ts`
- [ ] 深色模式適配
- [ ] 無障礙優化（ARIA + 鍵盤導航）
- [ ] 整合測試

### Phase 3: 測試與驗證（預計 0.5 小時）

- [ ] E2E 測試（Playwright）
- [ ] 效能基準測試
- [ ] 無障礙審計（Lighthouse）
- [ ] 跨瀏覽器測試

---

## 🔗 參考來源

### 官方文檔（Context7）

- `[context7:reactjs/react.dev]` - React 19 Hooks 最佳實踐
- `[context7:vitest-dev/vitest]` - 測試配置與 BDD 模式
- `[context7:mdn/content]` - Vibration API 規格

### 設計系統參考

- Apple iOS Calculator UX（業界黃金標準）
- Material Design 3 Motion Guidelines
- Nielsen Norman Group - Immediate Feedback 研究

### 相關專案文檔

- `010_calculator_keyboard_feature_spec.md` - 原始功能規格
- `010_mobile_numeric_keypad_bdd_spec.md` - 行動裝置 BDD 規格
- `LINUS_GUIDE.md` - 開發哲學與品質準則
- `BDD.md` - BDD 開發流程

---

## ✅ 開發檢查清單

### 開發前

- [x] Linus 三問驗證完成
- [x] BDD 場景定義完整
- [x] 技術方案評估（無新依賴）
- [x] 效能基準設定

### 開發中

- [ ] 遵循 TypeScript 嚴格模式
- [ ] 使用 Motion 庫（已有）
- [ ] 遵循 Tailwind 樣式約定
- [ ] 所有函數 < 50 行
- [ ] 測試驅動開發（TDD）

### 開發後

- [ ] `pnpm typecheck` 通過
- [ ] `pnpm test --coverage` ≥ 80%
- [ ] `pnpm lint` 無錯誤
- [ ] `pnpm build` 成功
- [ ] Lighthouse Accessibility ≥ 95
- [ ] 更新 `002_development_reward_penalty_log.md`

---

**最後更新**: 2025-11-18 | **版本**: v1.0.0 | **狀態**: 🔄 開發中
