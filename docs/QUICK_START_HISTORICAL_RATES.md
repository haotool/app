# 歷史匯率功能 - 快速開始指南

**建立時間**: 2025-10-13T22:59:32+08:00  
**預計時間**: 5 分鐘  
**難度**: 🟢 簡單

---

## 🚀 一鍵部署（推薦）

```bash
# 給予執行權限（首次）
chmod +x scripts/setup-historical-rates.sh

# 執行部署腳本
./scripts/setup-historical-rates.sh
```

腳本會自動完成：

- ✅ 建立 data 分支
- ✅ 啟用歷史資料 workflow
- ✅ 觸發首次執行
- ✅ 顯示驗證步驟

---

## 📖 手動部署

### 步驟 1：建立 data 分支（2 分鐘）

```bash
# 1. 確保在專案根目錄
cd /Users/azlife.eth/Tools/app

# 2. 確保 main 分支最新
git checkout main
git pull origin main

# 3. 建立 data 分支
git checkout -b data main

# 4. 建立目錄結構
mkdir -p public/rates/history

# 5. 複製最新資料（如果存在）
CURRENT_DATE=$(TZ=Asia/Taipei date +%Y-%m-%d)
cp public/rates/latest.json public/rates/history/${CURRENT_DATE}.json || true

# 6. 提交並推送
git add public/rates/
git commit -m "chore(data): initialize data branch for exchange rates"
git push -u origin data

# 7. 切回 main
git checkout main
```

### 步驟 2：啟用 Workflow（1 分鐘）

```bash
# 1. 備份舊 workflow
mv .github/workflows/update-exchange-rates.yml \
   .github/workflows/update-exchange-rates.yml.backup

# 2. 啟用新 workflow
cp .github/workflows/update-exchange-rates-historical.yml \
   .github/workflows/update-exchange-rates.yml

# 3. 提交並推送
git add .github/workflows/
git commit -m "chore(ci): activate historical rate tracking workflow"
git push origin main
```

### 步驟 3：觸發測試（2 分鐘）

```bash
# 方法 1：使用 GitHub CLI（推薦）
gh workflow run update-exchange-rates.yml

# 方法 2：GitHub 網頁介面
# 前往：https://github.com/haotool/app/actions/workflows/update-exchange-rates.yml
# 點擊 "Run workflow"
```

---

## ✅ 驗證部署

### 1. 檢查 Workflow 執行

```bash
# 查看最近執行記錄
gh run list --workflow=update-exchange-rates.yml --limit 5

# 即時監控（等待完成）
gh run watch
```

### 2. 檢查 data 分支

```bash
# 切換到 data 分支
git checkout data
git pull origin data

# 檢查檔案結構
tree public/rates/

# 應該看到：
# public/rates/
# ├── latest.json
# └── history/
#     └── 2025-10-13.json

# 檢查內容
cat public/rates/latest.json | jq .
```

### 3. 測試 CDN（需等待 2-5 分鐘）

```bash
# 測試最新匯率
curl -s https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json | jq .

# 測試歷史匯率
CURRENT_DATE=$(TZ=Asia/Taipei date +%Y-%m-%d)
curl -s https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/history/${CURRENT_DATE}.json | jq .

# 測試備援 CDN
curl -s https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json | jq .
```

### 4. 驗證資料正確性

```bash
# 檢查更新時間
curl -s https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json | \
  jq -r .updateTime

# 檢查匯率數量（應為 12）
curl -s https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json | \
  jq '.rates | length'

# 檢查 USD 匯率
curl -s https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json | \
  jq -r '.rates.USD'
```

---

## 🎯 成功標準

部署成功後，你應該看到：

- ✅ data 分支已建立並包含 `public/rates/` 目錄
- ✅ Workflow 執行成功（綠色勾勾）
- ✅ `latest.json` 存在且包含最新匯率
- ✅ `history/YYYY-MM-DD.json` 已建立
- ✅ CDN 可正常存取所有檔案
- ✅ main 分支沒有匯率相關 commit

---

## 🆘 常見問題

### Q1: Workflow 執行失敗

**錯誤訊息**：

```
Error: failed to push some refs
```

**解決方案**：

```bash
# 確認 data 分支已建立
git fetch origin
git branch -a | grep data

# 如果沒有，手動建立
git checkout -b data main
git push -u origin data
```

### Q2: CDN 404 錯誤

**解決方案**：

```bash
# 1. 確認 workflow 已執行成功
gh run list --workflow=update-exchange-rates.yml --limit 1

# 2. 等待 2-5 分鐘讓 CDN 快取更新

# 3. 使用備援 CDN（無快取延遲）
curl https://raw.githubusercontent.com/haotool/app/data/public/rates/latest.json
```

### Q3: jq 指令找不到

**解決方案**：

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# 或直接查看原始 JSON
curl https://cdn.jsdelivr.net/gh/haotool/app@data/public/rates/latest.json
```

---

## 📚 進階文檔

- [完整實施指南](./HISTORICAL_RATES_IMPLEMENTATION.md) - 技術細節與架構說明
- [部署計畫](./dev/HISTORICAL_RATES_DEPLOYMENT_PLAN.md) - 詳細檢查清單
- [策略比較](./EXCHANGE_RATE_UPDATE_STRATEGIES.md) - 為什麼選擇這個方案

---

## 💡 下一步

1. **監控運行狀況**

   ```bash
   # 每天檢查一次
   gh run list --workflow=update-exchange-rates.yml --limit 10
   ```

2. **等待歷史資料累積**
   - 7 天後可嘗試實作簡單趨勢圖
   - 30 天後資料完整，可實作完整功能

3. **實作趨勢圖功能**（未來）
   - 參考 `apps/ratewise/src/services/exchangeRateHistoryService.ts`
   - 使用 Recharts/Chart.js/ECharts 繪製圖表

---

**需要協助？**

- 📖 查看完整文檔：`docs/HISTORICAL_RATES_IMPLEMENTATION.md`
- 🐛 回報問題：GitHub Issues
- 💬 討論功能：GitHub Discussions

---

**最後更新**: 2025-10-13T22:59:32+08:00  
**維護者**: @s123104
