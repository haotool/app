# 006 - 匯率計算 API 文檔

> **建立時間**: 2025-11-05T09:03:00+0800  
> **版本**: v1.0  
> **狀態**: ✅ 已完成  
> **作者**: Claude Code

---

## 概述

本文檔描述 RateWise 應用中的匯率計算邏輯，包括單幣別轉換、多幣別轉換和交叉匯率計算。

---

## API 數據結構

### 原始 API 格式

台灣銀行 API 提供的匯率格式為：

```typescript
interface RateDetails {
  spot: {
    buy: number;   // 即期買入
    sell: number;  // 即期賣出
  } | null;
  cash: {
    buy: number;   // 現金買入
    sell: number;  // 現金賣出
  } | null;
}

// 範例數據
{
  "USD": {
    "spot": { "buy": 30.87, "sell": 30.97 },
    "cash": { "buy": 30.40, "sell": 31.40 }
  },
  "JPY": {
    "spot": { "buy": 0.204, "sell": 0.208 },
    "cash": null
  },
  "KRW": {
    "spot": null,
    "cash": { "buy": 0.0226, "sell": 0.0240 }
  }
}
```

**關鍵概念**：

- API 提供的匯率都是**相對於 TWD** 的匯率
- `sell` 表示：1 外幣 = sell TWD（銀行賣出外幣的匯率）
- `buy` 表示：1 外幣 = buy TWD（銀行買入外幣的匯率）
- 部分貨幣只有 `spot` 或只有 `cash`（需 fallback 機制）

---

## 匯率計算公式

### 1. TWD 為基準貨幣

當 TWD 是基準貨幣時，需要**反向計算**：

```typescript
// API 提供：1 USD = 30.97 TWD (sell rate)
// 要顯示：1 TWD = ? USD

const twd_to_usd = 1 / 30.97; // = 0.0323 USD
// 結果：1 TWD = 0.0323 USD
```

**實作邏輯**：

```typescript
if (baseCurrency === 'TWD') {
  const rate = details[targetCurrency][rateType].sell;
  const reverseRate = 1 / rate;
  return `1 TWD = ${formatExchangeRate(reverseRate)} ${targetCurrency}`;
}
```

### 2. 外幣為基準貨幣（交叉匯率）

當基準貨幣不是 TWD 時，需要計算**交叉匯率**：

```typescript
// 已知：
// 1 USD = 30.97 TWD
// 1 JPY = 0.204 TWD

// 計算：1 USD = ? JPY
const usd_to_jpy = 30.97 / 0.204; // = 151.8 JPY
// 結果：1 USD = 151.8 JPY
```

**實作邏輯**：

```typescript
const baseRate = details[baseCurrency][rateType].sell; // 30.97
const targetRate = details[targetCurrency][rateType].sell; // 0.204
const crossRate = baseRate / targetRate; // 151.8

return `1 ${baseCurrency} = ${formatExchangeRate(crossRate)} ${targetCurrency}`;
```

### 3. 金額轉換

單幣別和多幣別的金額轉換使用相同公式：

```typescript
// 範例：將 1000 USD 轉換為 JPY
const usd_amount = 1000;
const usd_rate = 30.97; // 1 USD = 30.97 TWD
const jpy_rate = 0.204; // 1 JPY = 0.204 TWD

// 計算：
const jpy_amount = usd_amount * (usd_rate / jpy_rate);
// = 1000 * (30.97 / 0.204)
// = 151,814.7 JPY
```

---

## 格式化規範

### 匯率顯示

所有匯率統一格式化為 **4 位小數**：

```typescript
export function formatExchangeRate(value: number): string {
  return value.toLocaleString('zh-TW', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
    useGrouping: true,
  });
}

// 範例：
formatExchangeRate(0.0323); // "0.0323"
formatExchangeRate(151.8); // "151.8000"
formatExchangeRate(30.97); // "30.9700"
```

### 金額顯示

金額根據 ISO 4217 標準顯示不同小數位數：

```typescript
export function formatCurrency(value: number, currencyCode: CurrencyCode): string {
  const decimals = getCurrencyDecimalPlaces(currencyCode);

  return value.toLocaleString('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });
}

// 範例：
formatCurrency(1000, 'USD'); // "1,000.00"
formatCurrency(1000, 'JPY'); // "1,000"
formatCurrency(1000.5, 'TWD'); // "1,000.50"
```

**小數位數標準**：

```typescript
const CURRENCY_DECIMALS: Record<CurrencyCode, number> = {
  TWD: 2, // 新台幣（ISO 4217 標準 + 實務慣例）
  USD: 2, // 美元
  EUR: 2, // 歐元
  JPY: 0, // 日圓（無小數）
  KRW: 0, // 韓元（無小數）
  // ...
};
```

---

## Fallback 機制

處理部分貨幣只有 `spot` 或只有 `cash` 的情況：

```typescript
let rate = detail[rateType]?.sell;

// Fallback: 如果當前類型沒有資料，嘗試另一種類型
if (rate == null) {
  const fallbackType = rateType === 'spot' ? 'cash' : 'spot';
  rate = detail[fallbackType]?.sell;

  if (rate == null) {
    return '無資料';
  }
}
```

**範例**：

- 用戶選擇「即期匯率」但 KRW 只有現金匯率 → 自動 fallback 到現金匯率
- 兩種類型都沒有資料 → 顯示「無資料」

---

## 使用範例

### 單幣別轉換（SingleConverter）

```typescript
// 計算 1000 USD = ? TWD
const fromAmount = 1000;
const fromCurrency = 'USD';
const toCurrency = 'TWD';
const rate = details['USD'].spot.sell; // 30.97

const toAmount = fromAmount * rate;
// = 1000 * 30.97 = 30,970 TWD
```

### 多幣別轉換（MultiConverter）

```typescript
// 基準貨幣：USD
// 輸入：1000 USD
// 計算其他貨幣金額

const baseAmount = 1000;
const baseCurrency = 'USD';
const baseRate = details['USD'].spot.sell; // 30.97

// 計算 TWD
const twdRate = 1; // TWD 本身
const twdAmount = baseAmount * (baseRate / twdRate);
// = 1000 * (30.97 / 1) = 30,970 TWD

// 計算 JPY
const jpyRate = details['JPY'].spot.sell; // 0.204
const jpyAmount = baseAmount * (baseRate / jpyRate);
// = 1000 * (30.97 / 0.204) = 151,814.7 JPY
```

---

## 錯誤處理

### 1. 缺少匯率數據

```typescript
if (!detail) return '計算中...';
```

### 2. Fallback 後仍無數據

```typescript
if (rate == null) return '無資料';
```

### 3. 無效輸入

```typescript
const numValue = parseFloat(value);
if (!Number.isFinite(numValue) || Number.isNaN(numValue)) {
  return ''; // 返回空字串
}
```

---

## 測試案例

### 基本轉換

```typescript
// API 數據
const details = {
  USD: { spot: { sell: 30.97 } },
  JPY: { spot: { sell: 0.204 } },
};

// 測試 1：TWD → USD
expect(calculateRate('TWD', 'USD', details)).toBe(0.0323);

// 測試 2：USD → JPY
expect(calculateRate('USD', 'JPY', details)).toBe(151.8);

// 測試 3：金額轉換
expect(convertAmount(1000, 'USD', 'TWD', details)).toBe(30970);
```

### Fallback 測試

```typescript
const details = {
  KRW: { spot: null, cash: { sell: 0.024 } },
};

// 測試：選擇即期但只有現金 → fallback
expect(getRateDisplay('KRW', 'spot', details)).toContain('0.0240');
```

---

## 參考資料

- **ISO 4217**: 貨幣代碼與小數位數標準
- **台灣銀行匯率 API**: [https://rate.bot.com.tw/](https://rate.bot.com.tw/)
- **MDN Intl.NumberFormat**: [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)

---

## 版本歷史

| 版本 | 日期       | 變更內容                       |
| ---- | ---------- | ------------------------------ |
| v1.0 | 2025-11-05 | 初始版本：完整匯率計算邏輯文檔 |

---

**最後更新**: 2025-11-05T09:03:00+0800
