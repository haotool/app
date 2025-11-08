# 歷史匯率實施指南

**建立時間**: 2025-10-13T22:59:32+08:00  
**版本**: 1.0.0  
**狀態**: ✅ 已實施（待部署）

---

## 📋 目錄

- [概述](#概述)
- [GitHub Actions 額度說明](#github-actions-額度說明)
- [技術架構](#技術架構)
- [實施步驟](#實施步驟)
- [使用指南](#使用指南)
- [未來趨勢圖功能](#未來趨勢圖功能)
- [常見問題](#常見問題)

---

## 概述

### 目標

1. ✅ **保持 main 分支乾淨** - 所有匯率 commits 隔離到 `data` 分支
2. ✅ **累積 25 天歷史資料** - 為未來趨勢圖功能做準備
3. ✅ **完全自動化** - 無需人工介入
4. ✅ **零成本運行** - 開源專案免費使用 GitHub Actions

### 解決方案

採用 **方案 2 改進版**：

- 使用獨立 `data` 分支存放匯率資料
- 每天保存一個歷史檔案（`YYYY-MM-DD.json`）
- 自動清理超過 25 天的舊資料
- 使用 `--amend` 避免 commit 歷史膨脹

---

## GitHub Actions 額度說明

### ✅ 開源專案完全免費

根據 [GitHub 官方文檔](https://docs.github.com/zh/actions/administering-github-actions/usage-limits-billing-and-administration)：

> **公共儲存庫中的 GitHub 託管運行器和自託管運行器可免費使用 GitHub Actions。**

#### 具體額度

| 項目           | 公共儲存庫（開源） | 私有儲存庫（免費帳戶） |
| -------------- | ------------------ | ---------------------- |
| **執行分鐘數** | ♾️ **無限制**      | 2,000 分鐘/月          |
| **儲存空間**   | ♾️ **無限制**      | 500 MB                 |
| **併發任務**   | 20 個              | 20 個                  |

#### 實際消耗

本專案每 30 分鐘執行一次：

- **每日執行次數**: 48 次
- **每月執行次數**: ~1,440 次
- **每次執行時間**: ~1 分鐘
- **每月總時間**: ~1,440 分鐘
- **實際費用**: **$0 USD** ✅

### 📊 監控使用量

可在以下位置查看使用量：

```
Settings → Actions → General → Usage this month
```

[查看使用統計](https://github.com/haotool/app/settings/billing/summary)

---

## 技術架構

### 分支策略

```
main (程式碼分支)
  ├─ src/
  ├─ docs/
  └─ .github/workflows/

data (資料分支) ← 完全隔離
  └─ public/rates/
      ├─ latest.json          # 最新匯率
      └─ history/
          ├─ 2025-10-13.json  # 每日歷史
          ├─ 2025-10-12.json
          └─ ...              # 最多 25 天
```

### CDN URLs

#### 最新匯率

```
https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json
https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json
```

#### 歷史匯率

```
https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/2025-10-13.json
https://raw.githubusercontent.com/haotool/app/data/public/rates/history/2025-10-12.json
```

### 資料結構

#### latest.json

```json
{
  "updateTime": "2025-10-13 22:30:00",
  "source": "台灣銀行 (https://rate.bot.com.tw/xrt)",
  "rates": {
    "TWD": 1,
    "USD": 30.775,
    "EUR": 33.52,
    "JPY": 0.2088,
    "CNY": 4.312,
    ...
  }
}
```

#### history/2025-10-13.json

```json
{
  "updateTime": "2025-10-13 23:00:00",
  "source": "台灣銀行 (https://rate.bot.com.tw/xrt)",
  "rates": {
    "TWD": 1,
    "USD": 30.775,
    ...
  }
}
```

---

## 實施步驟

### 1️⃣ 建立 data 分支

```bash
cd /Users/azlife.eth/Tools/app

# 基於 main 建立 data 分支
git checkout -b data main

# 確保目錄結構存在
mkdir -p public/rates/history

# 複製最新資料（如果存在）
cp public/rates/latest.json public/rates/history/2025-10-13.json || true

# 提交初始狀態
git add public/rates/
git commit -m "chore(data): initialize data branch for exchange rates

- Create isolated branch for rate updates
- Preserve 25-day historical data
- Keep main branch clean"

# 推送到遠端
git push -u origin data

# 切回 main 分支
git checkout main
```

### 2️⃣ 啟用新的 Workflow

```bash
# 停用舊的 workflow（保留做備份）
mv .github/workflows/update-exchange-rates.yml .github/workflows/update-exchange-rates.yml.backup

# 啟用新的歷史資料 workflow
cp .github/workflows/update-exchange-rates-historical.yml .github/workflows/update-exchange-rates.yml

# 提交變更
git add .github/workflows/
git commit -m "feat(ci): implement historical exchange rate tracking

- Use isolated data branch for rate updates
- Preserve 25-day historical data
- Auto-cleanup old files
- Keep main branch clean

Closes #issue-number"

git push origin main
```

### 3️⃣ 更新前端服務（可選 - 未來趨勢圖需要）

前端服務已建立 `exchangeRateHistoryService.ts`，包含：

- `fetchLatestRates()` - 獲取最新匯率
- `fetchHistoricalRates(date)` - 獲取指定日期匯率
- `fetchHistoricalRatesRange(days)` - 獲取過去 N 天匯率

當前不需要修改現有元件，未來實作趨勢圖時再使用。

### 4️⃣ 驗證部署

```bash
# 手動觸發 workflow 測試
gh workflow run update-exchange-rates.yml

# 或透過 GitHub 網頁介面
# https://github.com/haotool/app/actions/workflows/update-exchange-rates.yml
# 點擊 "Run workflow"

# 檢查 data 分支
git fetch origin data
git checkout data
ls -la public/rates/history/

# 驗證 CDN（需等待 workflow 執行完成）
curl https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json
curl https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/2025-10-13.json
```

---

## 使用指南

### 開發者

#### 讀取最新匯率

```typescript
import { fetchLatestRates } from '@/services/exchangeRateHistoryService';

const rates = await fetchLatestRates();
console.log(rates.updateTime);
console.log(rates.rates.USD);
```

#### 讀取歷史匯率

```typescript
import { fetchHistoricalRates } from '@/services/exchangeRateHistoryService';

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const historicalRates = await fetchHistoricalRates(yesterday);
console.log(historicalRates.rates.USD);
```

#### 讀取 25 天歷史資料

```typescript
import { fetchHistoricalRatesRange } from '@/services/exchangeRateHistoryService';

const last25Days = await fetchHistoricalRatesRange(25);
console.log(`Fetched ${last25Days.length} days of data`);

last25Days.forEach(({ date, data }) => {
  console.log(`${date}: USD ${data.rates.USD}`);
});
```

### 維運者

#### 監控 Workflow

```bash
# 查看最近執行記錄
gh run list --workflow=update-exchange-rates.yml --limit 10

# 查看特定執行詳情
gh run view <run-id>

# 查看日誌
gh run view <run-id> --log
```

#### 清理舊資料（如需要）

```bash
git checkout data
cd public/rates/history/

# 手動刪除特定日期
rm 2025-09-01.json

# 或批次刪除（超過 60 天）
find . -name "*.json" -type f -mtime +60 -delete

git add .
git commit -m "chore(data): cleanup old historical data"
git push origin data
```

#### 檢查分支大小

```bash
# 查看 data 分支大小
git checkout data
du -sh .git

# 如果太大，可以定期 squash
git checkout data
git reset --soft $(git rev-list --max-parents=0 HEAD)
git commit -m "chore(data): squash history"
git push --force-with-lease origin data
```

---

## 未來趨勢圖功能

### 設計草稿

```typescript
/**
 * 趨勢圖元件（未實作）
 *
 * 功能：
 * - 顯示過去 7/25 天匯率趨勢
 * - 支援多幣別對比
 * - 互動式圖表
 */
export const RateTrendChart = ({ currencyCode, days = 7 }) => {
  const [historicalData, setHistoricalData] = useState<HistoricalRateData[]>([]);

  useEffect(() => {
    fetchHistoricalRatesRange(days).then(setHistoricalData);
  }, [days]);

  return (
    <div>
      {/* 使用 recharts 或其他圖表庫 */}
      <LineChart data={historicalData}>
        {/* ... */}
      </LineChart>
    </div>
  );
};
```

### 建議圖表庫

1. **Recharts** - React 原生圖表庫

   ```bash
   pnpm add recharts
   ```

2. **Chart.js** - 輕量級圖表庫

   ```bash
   pnpm add chart.js react-chartjs-2
   ```

3. **Apache ECharts** - 功能強大
   ```bash
   pnpm add echarts echarts-for-react
   ```

---

## 常見問題

### Q1: 為什麼不用 GitHub Releases？

**A**: Releases 適合軟體版本發布，不適合高頻資料更新：

- 每 30 分鐘建立一個 Release 會產生大量垃圾
- GitHub API 有 rate limit (5000/hr)
- 管理複雜度高

### Q2: data 分支會影響部署嗎？

**A**: 不會：

- Zeabur/Vercel 仍從 `main` 分支部署程式碼
- `data` 分支僅供 CDN 讀取資料
- 兩者完全隔離

### Q3: 如果 CDN 失效怎麼辦？

**A**: 已實作 fallback 機制：

```typescript
const CDN_URLS = {
  latest: [
    'https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json', // 主要
    'https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json', // 備援
  ],
};
```

### Q4: 歷史資料會佔用多少空間？

**A**: 估算：

- 每個檔案 ~2 KB
- 25 天 × 2 KB = 60 KB
- 完全在免費額度內（500 MB）

### Q5: 可以保留更多天數嗎？

**A**: 可以，修改 workflow 中的清理邏輯：

```yaml
# 從 25 天改為 90 天
find public/rates/history/ -name "*.json" -type f -mtime +90 -delete
```

### Q6: 如何手動觸發更新？

**A**: 三種方式：

1. **GitHub 網頁介面**：

   ```
   Actions → Update Exchange Rates with History → Run workflow
   ```

2. **GitHub CLI**：

   ```bash
   gh workflow run update-exchange-rates.yml
   ```

3. **推送腳本變更**（自動觸發）：
   ```bash
   git add scripts/fetch-taiwan-bank-rates.js
   git commit -m "fix: update rate fetching logic"
   git push
   ```

---

## 參考資源

- [GitHub Actions 官方文檔](https://docs.github.com/actions) [context7:/actions/toolkit:2025-10-13T22:59:32+08:00]
- [GitHub Actions 額度說明](https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- [jsDelivr CDN 文檔](https://www.jsdelivr.com/documentation)
- [匯率更新策略文檔](./EXCHANGE_RATE_UPDATE_STRATEGIES.md)

---

**最後更新**: 2025-10-13T22:59:32+08:00  
**維護者**: @s123104  
**狀態**: ✅ 生產環境就緒
