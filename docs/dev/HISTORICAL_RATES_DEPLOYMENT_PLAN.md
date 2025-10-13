# 歷史匯率功能部署計畫

**建立時間**: 2025-10-13T22:59:32+08:00  
**負責人**: @s123104  
**狀態**: 📋 待執行

---

## 📋 部署檢查清單

### 階段 1：建立 Data 分支（5 分鐘）

- [ ] **1.1** 切換到本地專案目錄

  ```bash
  cd /Users/azlife.eth/Tools/app
  ```

- [ ] **1.2** 確保 main 分支是最新的

  ```bash
  git checkout main
  git pull origin main
  ```

- [ ] **1.3** 基於 main 建立 data 分支

  ```bash
  git checkout -b data main
  ```

- [ ] **1.4** 確保目錄結構存在

  ```bash
  mkdir -p public/rates/history
  ```

- [ ] **1.5** 建立初始歷史檔案（如果 latest.json 存在）

  ```bash
  CURRENT_DATE=$(TZ=Asia/Taipei date +%Y-%m-%d)
  cp public/rates/latest.json public/rates/history/${CURRENT_DATE}.json || echo "No latest.json found, will be created by workflow"
  ```

- [ ] **1.6** 提交並推送 data 分支

  ```bash
  git add public/rates/
  git commit -m "chore(data): initialize data branch for exchange rates

  - Create isolated branch for rate updates
  - Preserve 30-day historical data
  - Keep main branch clean"

  git push -u origin data
  ```

- [ ] **1.7** 切回 main 分支
  ```bash
  git checkout main
  ```

### 階段 2：啟用新的 Workflow（2 分鐘）

- [ ] **2.1** 停用舊的 workflow（保留備份）

  ```bash
  git mv .github/workflows/update-exchange-rates.yml .github/workflows/update-exchange-rates.yml.backup
  ```

- [ ] **2.2** 啟用新的歷史資料 workflow

  ```bash
  cp .github/workflows/update-exchange-rates-historical.yml .github/workflows/update-exchange-rates.yml
  ```

- [ ] **2.3** 提交變更

  ```bash
  git add .github/workflows/
  git commit -m "chore(ci): activate historical rate tracking workflow

  - Replace old workflow with historical version
  - Backup old workflow for reference
  - Enable 30-day data retention"

  git push origin main
  ```

### 階段 3：測試與驗證（10 分鐘）

- [ ] **3.1** 手動觸發 workflow（首次執行）

  ```bash
  gh workflow run update-exchange-rates.yml
  ```

  或透過 GitHub 網頁：
  - 前往 https://github.com/haotool/app/actions/workflows/update-exchange-rates.yml
  - 點擊 "Run workflow"
  - 選擇 "Branch: main"
  - 點擊 "Run workflow"

- [ ] **3.2** 監控執行狀態

  ```bash
  # 查看最近的執行
  gh run list --workflow=update-exchange-rates.yml --limit 5

  # 查看執行詳情（替換 RUN_ID）
  gh run view <RUN_ID>

  # 即時查看日誌
  gh run watch
  ```

- [ ] **3.3** 檢查 data 分支

  ```bash
  git fetch origin data
  git checkout data
  git pull origin data

  # 檢查檔案結構
  tree public/rates/

  # 應該看到：
  # public/rates/
  # ├── latest.json
  # └── history/
  #     └── 2025-10-13.json
  ```

- [ ] **3.4** 驗證 CDN 可用性（需等待 2-5 分鐘 CDN 快取更新）

  ```bash
  # 測試最新匯率
  curl -s https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json | jq .

  # 測試歷史匯率
  CURRENT_DATE=$(TZ=Asia/Taipei date +%Y-%m-%d)
  curl -s https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/${CURRENT_DATE}.json | jq .

  # 備援 CDN
  curl -s https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json | jq .
  ```

- [ ] **3.5** 驗證資料正確性

  ```bash
  # 檢查更新時間
  curl -s https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json | jq -r .updateTime

  # 檢查匯率數量（應為 12 種貨幣）
  curl -s https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json | jq '.rates | length'

  # 檢查 USD 匯率（範例）
  curl -s https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json | jq -r .rates.USD
  ```

- [ ] **3.6** 切回 main 分支
  ```bash
  git checkout main
  ```

### 階段 4：前端整合測試（可選 - 未來趨勢圖需要）

> **注意**：當前前端不需要修改，歷史資料服務已準備就緒，未來實作趨勢圖時再使用。

- [ ] **4.1** 本地測試歷史資料服務

  ```bash
  cd apps/ratewise
  pnpm dev
  ```

- [ ] **4.2** 開啟瀏覽器開發者工具
  - 前往 http://localhost:4173
  - 開啟 Console

- [ ] **4.3** 測試 API（在 Console 中執行）

  ```javascript
  // 測試最新匯率
  const { fetchLatestRates } = await import('./src/services/exchangeRateHistoryService');
  const latest = await fetchLatestRates();
  console.log('Latest rates:', latest);

  // 測試歷史匯率
  const { fetchHistoricalRatesRange } = await import('./src/services/exchangeRateHistoryService');
  const history = await fetchHistoricalRatesRange(7);
  console.log(`Fetched ${history.length} days of historical data`);
  ```

### 階段 5：監控與維護（持續）

- [ ] **5.1** 設定 GitHub Actions 通知
  - 前往 https://github.com/haotool/app/settings/notifications
  - 啟用 "Actions" 通知
  - 選擇接收失敗通知

- [ ] **5.2** 每週檢查一次

  ```bash
  # 檢查最近 7 天的執行狀況
  gh run list --workflow=update-exchange-rates.yml --created '>2025-10-06' --limit 50

  # 檢查失敗的執行
  gh run list --workflow=update-exchange-rates.yml --status failure --limit 10
  ```

- [ ] **5.3** 每月檢查 data 分支大小

  ```bash
  git checkout data
  du -sh .git

  # 如果超過 10 MB，考慮 squash
  git reset --soft $(git rev-list --max-parents=0 HEAD)
  git commit -m "chore(data): squash history to reduce branch size"
  git push --force-with-lease origin data
  ```

- [ ] **5.4** 監控 GitHub Actions 使用量
  - 前往 https://github.com/haotool/app/settings/billing/summary
  - 確認 Actions 使用量（開源專案應為 ♾️ 無限）

---

## 🚨 潛在問題與解決方案

### 問題 1：Workflow 執行失敗

**症狀**：

```
Error: failed to push some refs to 'https://github.com/haotool/app.git'
```

**原因**：data 分支不存在或權限問題

**解決方案**：

```bash
# 確保 data 分支已建立並推送
git checkout -b data main
git push -u origin data
```

### 問題 2：CDN 404 錯誤

**症狀**：

```
curl: (22) The requested URL returned error: 404
```

**原因**：Workflow 尚未執行或 CDN 快取尚未更新

**解決方案**：

```bash
# 1. 確認 workflow 已執行成功
gh run list --workflow=update-exchange-rates.yml --limit 1

# 2. 等待 2-5 分鐘讓 CDN 快取更新

# 3. 使用備援 CDN（無快取）
curl https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json
```

### 問題 3：歷史檔案未建立

**症狀**：`public/rates/history/` 目錄為空

**原因**：Workflow 中的日期判斷邏輯錯誤

**解決方案**：

```bash
# 手動建立歷史檔案
git checkout data
CURRENT_DATE=$(TZ=Asia/Taipei date +%Y-%m-%d)
cp public/rates/latest.json public/rates/history/${CURRENT_DATE}.json
git add public/rates/history/
git commit -m "chore(data): manually create historical file for ${CURRENT_DATE}"
git push origin data
```

### 問題 4：Git 權限錯誤

**症狀**：

```
remote: Permission to haotool/app.git denied to github-actions[bot]
```

**原因**：Workflow permissions 設定不正確

**解決方案**：
確認 `.github/workflows/update-exchange-rates.yml` 中有：

```yaml
permissions:
  contents: write
```

---

## 📊 成功指標

### 部署後第一天

- ✅ Workflow 成功執行至少 48 次（每 30 分鐘一次）
- ✅ data 分支只有 1 個 commit（使用 --amend）
- ✅ main 分支完全沒有匯率相關 commit
- ✅ CDN 可正常存取最新匯率
- ✅ 歷史檔案正確建立（1 個 YYYY-MM-DD.json）

### 部署後第 7 天

- ✅ data 分支依然只有 1 個 commit
- ✅ 歷史檔案累積到 7 個
- ✅ CDN 可正常存取所有歷史檔案
- ✅ 無 Workflow 失敗記錄

### 部署後第 30 天

- ✅ data 分支依然只有 1 個 commit
- ✅ 歷史檔案維持在 30 個（自動清理生效）
- ✅ 最舊的檔案日期是 30 天前
- ✅ GitHub Actions 使用量在預期範圍內

---

## 🎯 下一步（未來功能）

### 短期（1-2 週）

- [ ] 監控系統穩定性
- [ ] 收集使用者回饋
- [ ] 優化快取策略

### 中期（1-3 個月）

- [ ] 實作趨勢圖功能
  - [ ] 選擇圖表庫（Recharts / Chart.js / ECharts）
  - [ ] 設計趨勢圖 UI
  - [ ] 實作 7 天 / 30 天趨勢圖
  - [ ] 支援多幣別對比

- [ ] 效能優化
  - [ ] 實作 Service Worker 快取
  - [ ] 優化歷史資料載入策略
  - [ ] 實作資料預載

### 長期（3-6 個月）

- [ ] 進階功能
  - [ ] 匯率通知（漲跌提醒）
  - [ ] 歷史資料匯出（CSV / JSON）
  - [ ] 自訂時間範圍查詢
  - [ ] 匯率走勢預測（ML）

---

## 📚 參考文檔

- [歷史匯率實施指南](./HISTORICAL_RATES_IMPLEMENTATION.md)
- [匯率更新策略比較](./EXCHANGE_RATE_UPDATE_STRATEGIES.md)
- [GitHub Actions 官方文檔](https://docs.github.com/actions)
- [Context7 最佳實踐](https://context7.com) [context7:/actions/toolkit:2025-10-13T22:59:32+08:00]

---

**建立者**: AI Assistant  
**審查者**: @s123104  
**最後更新**: 2025-10-13T22:59:32+08:00  
**狀態**: ✅ 準備就緒，等待部署
