# 測試覆蓋率最佳實踐

> 基於 Linus Torvalds 開發哲學與 Vitest 官方建議

**建立時間**: 2025-10-31
**維護者**: Claude Code
**狀態**: ✅ 已完成

---

## 📊 當前覆蓋率狀態

| 指標           | 當前值 | 業界標準 | 狀態                |
| -------------- | ------ | -------- | ------------------- |
| **Statements** | 94.59% | 80%      | ✅ **超越 +14.59%** |
| **Branches**   | 83.6%  | 70%      | ✅ **超越 +13.6%**  |
| **Functions**  | 91.26% | 90%      | ✅ **超越 +1.26%**  |
| **Lines**      | 94.59% | 80%      | ✅ **超越 +14.59%** |

**總測試數**: 161 個測試
**測試覆蓋**: 關鍵業務邏輯 95%+

---

## 🎯 核心原則

### 1. Linus Torvalds 的 "Good Taste" 原則

**知道何時停止比知道何時開始更重要**

```typescript
// ✅ 好品味：測試關鍵行為
it('應該在匯率過期時自動刷新', async () => {
  // 測試實際業務邏輯
});

// ❌ 過度工程化：測試實作細節
it('應該調用 useState 3 次', () => {
  // 測試框架內部行為，脆弱且無意義
});
```

### 2. 業界標準對照

基於 Vitest 官方文檔和 Google Testing 標準：

| 程式碼類型                     | 建議覆蓋率 | 我們的實踐 |
| ------------------------------ | ---------- | ---------- |
| **關鍵業務邏輯** (支付、認證)  | 90-95%     | ✅ 95.12%  |
| **業務邏輯** (services, hooks) | 80-85%     | ✅ 94.06%  |
| **UI 組件**                    | 70-75%     | ✅ 90.5%   |
| **工具函數**                   | 85-90%     | ✅ 95.92%  |

---

## ⚙️ 設定說明

### Coverage Thresholds 設定

```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    // 基於 Linus Torvalds 哲學設置實用且可維護的門檻
    statements: 90,   // 當前: 94.59% (留 4.59% 緩衝)
    branches: 80,     // 當前: 83.6%  (留 3.6% 緩衝)
    functions: 88,    // 當前: 91.26% (留 3.26% 緩衝)
    lines: 90,        // 當前: 94.59% (留 4.59% 緩衝)
  }
}
```

**為何不設定 95%+？**

1. 避免為了數字而增加低價值測試
2. 允許合理的重構空間
3. 防止過度工程化
4. 遵循 Linus "實用主義" 原則

---

## 🚫 不應該做的事

### 1. 不要為了 100% 而測試第三方庫

```typescript
// ❌ 錯誤：測試 Recharts 內部邏輯
it('應該正確渲染 SVG path 元素', () => {
  const { container } = render(<TrendChart data={mockData} />);
  expect(container.querySelector('svg path')).toBeInTheDocument();
  // 這是測試 Recharts，不是我們的程式碼
});

// ✅ 正確：測試我們的業務邏輯
it('應該正確計算趨勢方向', () => {
  const trend = calculateTrend(mockData);
  expect(trend.direction).toBe('up');
  // 測試我們的計算邏輯
});
```

### 2. 不要模擬極端罕見的錯誤場景

```typescript
// ❌ 過度工程化：模擬 JavaScript 引擎崩潰
it('應該在 V8 heap 溢出時優雅降級', () => {
  // 這種場景幾乎不可能發生，且無法可靠測試
});

// ✅ 實用主義：測試合理的錯誤情況
it('應該在網路錯誤時使用快取', async () => {
  mockFetch.mockRejectedValue(new Error('Network error'));
  const result = await getExchangeRates();
  expect(result).toEqual(cachedData);
});
```

### 3. 不要測試純視覺效果

```typescript
// ❌ 低價值：測試 CSS 動畫
it('骨架載入器應該有淡入動畫', () => {
  const { container } = render(<SkeletonLoader />);
  expect(container.firstChild).toHaveClass('animate-pulse');
  // CSS 類別存在不代表動畫正確
});

// ✅ 高價值：測試可見性邏輯
it('載入時應該顯示骨架載入器', () => {
  const { getByRole } = render(<App loading={true} />);
  expect(getByRole('status')).toBeInTheDocument();
});
```

---

## ✅ 應該做的事

### 1. 測試行為而非實作

```typescript
// ✅ 測試使用者可見的行為
it('應該在匯率更新時顯示新數值', async () => {
  const { getByText } = render(<RateWise />);
  await waitFor(() => {
    expect(getByText('30.5')).toBeInTheDocument();
  });
});
```

### 2. 關注關鍵路徑

```typescript
// ✅ 測試關鍵業務流程
describe('匯率轉換核心流程', () => {
  it('應該正確計算雙向匯率');
  it('應該在匯率過期時自動刷新');
  it('應該在離線時使用快取');
  it('應該正確處理貨幣交換');
});
```

### 3. 保持測試簡單易讀

```typescript
// ✅ AAA 模式：Arrange-Act-Assert
it('應該正確清除過期快取', () => {
  // Arrange
  const staleData = createStaleCache(20); // 20 分鐘前
  localStorage.setItem('exchangeRates', JSON.stringify(staleData));

  // Act
  clearExpiredCache();

  // Assert
  expect(localStorage.getItem('exchangeRates')).toBeNull();
});
```

---

## 📝 未覆蓋程式碼分析

### 為什麼剩餘 5.41% 不需要測試？

#### 1. ErrorBoundary 錯誤恢復 (56-65 行)

**原因**: React 錯誤邊界的極端場景，難以可靠模擬
**風險**: 低 - React 自身已充分測試
**替代方案**: 依賴 E2E 測試和 Sentry 監控

#### 2. TrendChart 圖表細節 (150-178 行)

**原因**: Recharts 庫的內部渲染邏輯
**風險**: 低 - 視覺問題易於發現
**替代方案**: 視覺回歸測試 (Playwright)

#### 3. VersionIndicator UI 邏輯 (43,45,50,52 行)

**原因**: 簡單的條件渲染，低業務風險
**風險**: 極低 - 不影響核心功能
**替代方案**: 手動測試即可

---

## 🔍 質量監控

### 1. 使用 Coverage Thresholds 防止退化

```bash
# 每次 CI 都會檢查
pnpm test:coverage

# 如果低於門檻會失敗
ERROR: Coverage for statements (89.5%) does not meet threshold (90%)
```

### 2. 定期 Review 測試品質

**每月檢查清單**：

- [ ] 有沒有脆弱的測試（經常因重構失敗）？
- [ ] 有沒有測試實作細節而非行為？
- [ ] 有沒有過度複雜的 mock？
- [ ] 測試執行速度是否合理？

### 3. 關注測試維護成本

```typescript
// ⚠️ 警訊：測試比被測程式碼還複雜
// 測試程式碼: 150 行
// 被測程式碼: 50 行
// → 可能是過度工程化
```

---

## 📚 參考資料

### 官方文檔

- [Vitest Coverage Guide](https://vitest.dev/guide/coverage.html)
- [Vitest Coverage Config](https://vitest.dev/config/#coverage)
- [React Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro/)

### 業界標準

- **Google Testing Blog**: Critical code 90-95%, Business logic 80-85%
- **Martin Fowler Test Pyramid**: 重點是測試關鍵路徑，而非追求數字
- **Vitest Watermarks**: [50, 80] 表示 80% 已是高覆蓋率

### Linus Torvalds 哲學

- **Good Taste**: 消除特殊情況而非增加條件判斷
- **實用主義**: 解決實際問題而非假想威脅
- **簡潔執念**: 簡單的解決方案永遠優於複雜的

---

## 🎓 總結

### 核心信念

> "完美是好的敵人" - Voltaire
> "過早優化是萬惡之源" - Donald Knuth
> "簡單比複雜好" - Python Zen

### 行動準則

1. ✅ **測試行為，不測試實作**
2. ✅ **關注關鍵路徑，忽略邊緣情況**
3. ✅ **保持測試簡單易讀**
4. ✅ **設定合理門檻，防止退化**
5. ❌ **不追求 100% 覆蓋率**
6. ❌ **不為了數字而測試**

### 當前狀態

**94.59%** 覆蓋率 = **優秀且可維護**
不需要繼續提升 ✅

---

**最後更新**: 2025-10-31
**下次 Review**: 2025-11-30
