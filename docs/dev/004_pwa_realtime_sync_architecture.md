# 004 PWA 即時同步架構優化

**版本**: 1.0.0
**建立時間**: 2025-11-04
**狀態**: 🔄 進行中
**負責人**: Claude Code

---

## 問題根因

### 核心問題

生產環境出現大量404錯誤：

```
GET https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/2025-10-13.json 404
```

### 根本原因

1. **硬編碼30天限制**：`exchangeRateHistoryService.ts` 固定請求最近30天數據
2. **data分支數據不足**：實際只有7天歷史數據（2025-10-14 ~ 2025-10-20）
3. **缺乏動態探測**：未檢查數據可用性即直接請求

### 影響範圍

- 趨勢圖無法顯示（404中斷渲染）
- Console充滿錯誤日誌
- 用戶體驗受損

---

## Linus 三問驗證

### 1. "這是個真問題還是臆想出來的？"

✅ **真問題**

- **證據1**: 生產環境Console出現404錯誤
- **證據2**: data分支只有7天數據（2025-10-14 ~ 2025-10-20）
- **證據3**: 用戶無法看到完整趨勢圖

### 2. "有更簡單的方法嗎？"

✅ **當前方案最簡**

- **方案1**: 動態探測數據範圍 ✅ 最簡潔
- **方案2**: 補齊30天數據 ❌ 需手動維護
- **方案3**: 禁用趨勢圖 ❌ 功能降級

**決策**: 採用方案1（動態探測）

### 3. "會破壞什麼嗎？"

✅ **零破壞性**

- 向後相容（預設行為不變）
- Fallback機制（失敗時優雅降級）
- 無API變更（純前端邏輯優化）

---

## 技術方案設計

### Phase 0: 修復404錯誤

#### 1. 動態探測數據範圍

```typescript
// exchangeRateHistoryService.ts
export async function detectAvailableDateRange(): Promise<{
  startDate: Date;
  endDate: Date;
  availableDays: number;
}> {
  const today = new Date();
  let oldestDate = today;

  // 從今天往前探測，最多30天
  for (let i = 1; i <= 30; i++) {
    const testDate = new Date(today);
    testDate.setDate(today.getDate() - i);

    try {
      await fetchHistoricalRates(testDate);
      oldestDate = testDate; // 更新最舊可用日期
    } catch {
      break; // 遇到404停止探測
    }
  }

  return {
    startDate: oldestDate,
    endDate: today,
    availableDays: Math.ceil((today - oldestDate) / (1000 * 60 * 60 * 24)),
  };
}
```

#### 2. Fallback機制

```typescript
export async function fetchHistoricalRatesWithFallback(
  date: Date,
  maxRetries: number = 7,
): Promise<ExchangeRateData | null> {
  for (let i = 0; i < maxRetries; i++) {
    const retryDate = new Date(date);
    retryDate.setDate(date.getDate() - i);

    try {
      return await fetchHistoricalRates(retryDate);
    } catch {
      if (i === maxRetries - 1) {
        logger.warn(`No historical data available within ${maxRetries} days`);
        return null;
      }
      continue;
    }
  }
}
```

#### 3. 快取探測結果

```typescript
const RANGE_CACHE_KEY = 'exchangeRates:dateRange';
const RANGE_CACHE_DURATION = 60 * 60 * 1000; // 1小時

function getCachedDateRange(): DateRange | null {
  const cached = readJSON<DateRange>(RANGE_CACHE_KEY, null);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  return age < RANGE_CACHE_DURATION ? cached : null;
}
```

---

### Phase 1: 趨勢圖整合即時匯率

#### 數據整合邏輯

```typescript
export function mergeHistoricalAndLiveRates(
  historical: ExchangeRateData[],
  liveRate: ExchangeRateData,
): ExchangeRateData[] {
  const merged = [...historical];
  const today = new Date().toISOString().split('T')[0];

  // 檢查是否已有今天的數據
  const todayExists = merged.some((item) => item.timestamp.startsWith(today));

  if (!todayExists) {
    merged.push(liveRate); // 添加即時匯率
  }

  return merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
```

---

### Phase 2: 即期/現金切換UI

#### 數據結構

```typescript
type RateType = 'spot' | 'cash';
type TransactionType = 'buy' | 'sell';

interface RateDisplayConfig {
  rateType: RateType;
  transactionType: TransactionType;
  label: string;
}

const DEFAULT_CONFIG: RateDisplayConfig = {
  rateType: 'spot',
  transactionType: 'sell',
  label: '即期賣出',
};
```

#### UI組件設計

```typescript
<Tabs defaultValue="spot">
  <TabsList>
    <TabsTrigger value="spot">即期匯率</TabsTrigger>
    <TabsTrigger value="cash">現金匯率</TabsTrigger>
  </TabsList>

  <TabsContent value="spot">
    {/* 顯示 details[currency].spot.sell */}
  </TabsContent>

  <TabsContent value="cash">
    {/* 顯示 details[currency].cash.sell */}
  </TabsContent>
</Tabs>
```

---

### Phase 3: 版本自動更新機制

#### Git Tag自動生成

```yaml
# .github/workflows/release.yml
name: Release & Tag
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Read version from package.json
        id: version
        run: |
          VERSION=$(node -p "require('./package.json').version")
          echo "version=v$VERSION" >> $GITHUB_OUTPUT

      - name: Create git tag
        run: |
          git tag ${{ steps.version.outputs.version }}
          git push origin ${{ steps.version.outputs.version }}
```

#### PWA更新通知

```typescript
// vite.config.ts
VitePWA({
  registerType: 'prompt', // 改為prompt模式
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'exchange-rates',
          expiration: {
            maxAgeSeconds: 5 * 60, // 5分鐘
          },
        },
      },
    ],
  },
});
```

---

## 零硬編碼檢查

### 移除的硬編碼

- ❌ ~~`const DAYS_TO_FETCH = 25;`~~
- ❌ ~~固定日期範圍循環~~
- ❌ ~~hardcoded CDN URLs~~

### 替代方案

- ✅ 動態探測數據範圍
- ✅ 環境變數配置API URL
- ✅ 常數定義（可配置）

```typescript
// config/constants.ts
export const RATE_CONFIG = {
  MAX_HISTORY_DAYS: 25,
  FALLBACK_RETRIES: 7,
  CACHE_DURATION: 5 * 60 * 1000,
  RANGE_CACHE_DURATION: 60 * 60 * 1000,
} as const;
```

---

## 技術依據

### Context7 引用

- [VitePWA Documentation](https://context7.com/vite-pwa) - PWA配置最佳實踐
- [SWR Documentation](https://context7.com/vercel/swr) - 數據重驗證策略

### 業界最佳實踐

1. **動態探測** > 硬編碼（靈活性）
2. **Graceful Degradation** > 失敗即中斷（用戶體驗）
3. **NetworkFirst** > CacheFirst（即時性）

---

## 實作檢查清單

### Phase 0

- [ ] 實作 `detectAvailableDateRange()`
- [ ] 實作 `fetchHistoricalRatesWithFallback()`
- [ ] 快取探測結果
- [ ] 更新 `useExchangeRateHistory` hook

### Phase 1

- [ ] 實作 `mergeHistoricalAndLiveRates()`
- [ ] 更新 `ExchangeRateChart` 組件
- [ ] 動態X軸標籤
- [ ] 測試數據整合

### Phase 2

- [ ] 建立 `RateSwitcher` 組件
- [ ] 更新 `useExchangeRates` hook
- [ ] localStorage記憶用戶選擇
- [ ] 更新趨勢圖數據源

### Phase 3

- [ ] 建立 `release.yml` workflow
- [ ] 配置 PWA prompt 模式
- [ ] 實作更新通知UI
- [ ] 清除舊快取邏輯

### Phase 4

- [ ] 更新 `Footer` 組件（動態版本號）
- [ ] 更新 `README.md`
- [ ] 更新 `002_development_reward_penalty_log.md`

---

## 測試策略

### 單元測試

```typescript
describe('detectAvailableDateRange', () => {
  it('should detect available date range', async () => {
    const range = await detectAvailableDateRange();
    expect(range.availableDays).toBeGreaterThan(0);
    expect(range.availableDays).toBeLessThanOrEqual(30);
  });
});

describe('fetchHistoricalRatesWithFallback', () => {
  it('should fallback to earlier date on 404', async () => {
    const date = new Date('2025-10-15'); // 假設不存在
    const result = await fetchHistoricalRatesWithFallback(date);
    expect(result).not.toBeNull(); // 應回退到可用日期
  });
});
```

### 整合測試

- [ ] 驗證404時的Fallback行為
- [ ] 驗證歷史+即時數據合併
- [ ] 驗證即期/現金切換正確性
- [ ] 驗證PWA更新通知

---

## 效能指標

### 優化前

- 404錯誤：~20個請求
- 趨勢圖載入：失敗
- 快取命中率：0%

### 優化後（預期）

- 404錯誤：0個
- 趨勢圖載入：<500ms
- 快取命中率：>80%

---

**最後更新**: 2025-11-04
**下一步**: 建立feature分支並開始Phase 0實作
