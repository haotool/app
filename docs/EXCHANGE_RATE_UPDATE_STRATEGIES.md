# 匯率更新策略比較

**建立時間**: 2025-10-13T22:52:21+08:00  
**目的**: 解決自動匯率更新產生大量 commit 的問題

---

## 問題描述

當前設定每 30 分鐘自動更新匯率，導致：

- ❌ 每天產生 48 個 commit
- ❌ Git 歷史被大量 `chore(rates)` commit 淹沒
- ❌ 難以追蹤真正的程式碼變更

---

## ✅ 已實施方案（2025-10-13）

**方案 2 改進版：歷史資料追蹤**

- ✅ 使用獨立 `data` 分支存放匯率資料
- ✅ 累積保留 30 天歷史資料（支援未來趨勢圖）
- ✅ 每天一個歷史檔案（`YYYY-MM-DD.json`）
- ✅ 自動清理超過 30 天的舊資料
- ✅ Main 分支完全乾淨
- ✅ 開源專案 GitHub Actions 完全免費（無限分鐘數）

**詳細文檔**: [歷史匯率實施指南](./HISTORICAL_RATES_IMPLEMENTATION.md)

---

## 原始方案比較（參考用）

## 解決方案比較

### 方案 1：使用 `--amend` 覆蓋 Commit ⭐⭐⭐

**實施難度**: 🟢 簡單  
**推薦指數**: ⭐⭐⭐

#### 優點

- ✅ 最簡單，只需修改 workflow
- ✅ 始終只有一個匯率更新 commit
- ✅ 不需要修改前端程式碼
- ✅ CDN URLs 不變

#### 缺點

- ⚠️ 使用 `--force-with-lease`（相對安全）
- ⚠️ 無法追蹤歷史匯率變化

#### 實施方式

```yaml
# .github/workflows/update-exchange-rates.yml
# 檢查上一個 commit 是否也是匯率更新
LAST_COMMIT_MSG=$(git log -1 --pretty=%B)
if [[ "$LAST_COMMIT_MSG" == *"chore(rates): update exchange rates"* ]]; then
  # 覆蓋上一個 commit
  git commit --amend --no-edit -m "chore(rates): update exchange rates - ${UPDATE_TIME}"
  git push --force-with-lease
else
  # 建立新 commit
  git commit -m "chore(rates): update exchange rates - ${UPDATE_TIME}"
  git push
fi
```

#### 結果

- Git 歷史中始終只有 **1 個**匯率更新 commit
- 每次更新覆蓋上一次的時間戳記

---

### 方案 2：使用獨立分支 (rates) ⭐⭐⭐⭐⭐

**實施難度**: 🟡 中等  
**推薦指數**: ⭐⭐⭐⭐⭐（**最推薦**）

#### 優點

- ✅ **main 分支完全乾淨**，無匯率 commits
- ✅ 匯率更新隔離在 `rates` 分支
- ✅ 可以定期 squash `rates` 分支
- ✅ CDN 可同時讀取兩個分支

#### 缺點

- ⚠️ 需要修改前端 CDN URLs
- ⚠️ 需要管理兩個分支

#### 實施方式

**步驟 1**: 建立 `rates` 分支

```bash
git checkout -b rates
git push -u origin rates
```

**步驟 2**: 修改 workflow

```yaml
# 使用 .github/workflows/update-exchange-rates-branch.yml.example
# 切換到 rates 分支
git checkout rates
# 覆蓋上一個 commit
git commit --amend --no-edit
git push --force-with-lease origin rates
```

**步驟 3**: 更新前端 CDN URLs

```typescript
// apps/ratewise/src/services/exchangeRateService.ts
const CDN_URLS = [
  // 從 rates 分支讀取
  'https://cdn.jsdelivr.net/gh/haotool/app@rates/public/rates/latest.json',
  'https://raw.githubusercontent.com/haotool/app/rates/public/rates/latest.json',
];
```

#### 結果

- `main` 分支: 只有程式碼變更 ✅
- `rates` 分支: 只有 1 個不斷更新的匯率 commit ✅

---

### 方案 3：使用 GitHub Release Assets ⭐⭐⭐⭐

**實施難度**: 🟡 中等  
**推薦指數**: ⭐⭐⭐⭐

#### 優點

- ✅ **完全不污染任何分支**
- ✅ Release assets 可追溯歷史
- ✅ 可以保留多個版本的匯率資料
- ✅ GitHub CDN 自動快取

#### 缺點

- ⚠️ 需要修改前端 CDN URLs
- ⚠️ GitHub API 有 rate limit (5000/hr)
- ⚠️ Release 數量可能累積

#### 實施方式

**步驟 1**: 使用 Release workflow

```yaml
# 使用 .github/workflows/update-exchange-rates-release.yml.example
uses: softprops/action-gh-release@v1
with:
  tag_name: latest-rates
  files: public/rates/latest.json
```

**步驟 2**: 更新前端 CDN URLs

```typescript
const CDN_URLS = [
  'https://github.com/haotool/app/releases/download/latest-rates/latest.json',
  'https://cdn.jsdelivr.net/gh/haotool/app@latest-rates/public/rates/latest.json',
];
```

#### 結果

- 所有分支都乾淨 ✅
- 匯率資料在 GitHub Releases ✅
- 可追蹤歷史版本 ✅

---

## 方案選擇建議

### 快速決策表

| 需求                 | 推薦方案      |
| -------------------- | ------------- |
| 最簡單，不想改程式碼 | **方案 1**    |
| 保持 main 分支乾淨   | **方案 2** ⭐ |
| 需要追蹤歷史匯率     | **方案 3**    |
| 長期維護專案         | **方案 2** ⭐ |

### 詳細比較

| 特性            | 方案 1      | 方案 2              | 方案 3          |
| --------------- | ----------- | ------------------- | --------------- |
| 實施難度        | 🟢 簡單     | 🟡 中等             | 🟡 中等         |
| main 分支乾淨度 | 🟡 1 commit | 🟢 完全乾淨         | 🟢 完全乾淨     |
| 需要改前端      | ❌ 不需要   | ✅ 需要             | ✅ 需要         |
| 歷史追蹤        | ❌ 無       | ⚠️ 分支可見         | ✅ Release 歷史 |
| CDN 支援        | ✅ 完整     | ✅ 完整             | ✅ 完整         |
| force push      | ⚠️ 需要     | ⚠️ 需要（僅 rates） | ❌ 不需要       |

---

## 實施步驟（方案 2 - 推薦）

### 1. 建立 rates 分支

```bash
git checkout -b rates
git push -u origin rates
```

### 2. 替換 workflow 檔案

```bash
# 備份當前 workflow
cp .github/workflows/update-exchange-rates.yml .github/workflows/update-exchange-rates.yml.backup

# 使用分支策略 workflow
cp .github/workflows/update-exchange-rates-branch.yml.example .github/workflows/update-exchange-rates.yml

# 提交變更
git add .github/workflows/
git commit -m "feat(ci): switch to branch strategy for exchange rate updates"
git push
```

### 3. 更新前端 CDN URLs

```typescript
// apps/ratewise/src/services/exchangeRateService.ts
const CDN_URLS = [
  () => {
    const timestamp = Math.floor(Date.now() / (5 * 60 * 1000));
    return `https://cdn.jsdelivr.net/gh/haotool/app@rates/public/rates/latest.json?t=${timestamp}`;
  },
  'https://cdn.jsdelivr.net/gh/haotool/app@rates/public/rates/latest.json',
  'https://raw.githubusercontent.com/haotool/app/rates/public/rates/latest.json',
];
```

### 4. 測試驗證

```bash
# 手動觸發 workflow 測試
# GitHub → Actions → Update Exchange Rates → Run workflow

# 檢查 rates 分支
git fetch origin rates
git log origin/rates --oneline -5

# 應該只看到 1-2 個 commit
```

### 5. 清理舊的匯率 commits（可選）

```bash
# 回到 main 分支
git checkout main

# 使用 interactive rebase 清理歷史
git rebase -i HEAD~50  # 檢查最近 50 個 commits

# 刪除所有 chore(rates) commits
# 保存並推送（需要 force push）
git push --force-with-lease
```

---

## 監控與維護

### 檢查 rates 分支大小

```bash
# 如果 rates 分支累積太大，定期 squash
git checkout rates
git reset --soft main
git commit -m "chore(rates): reset rates branch with latest data"
git push --force
```

### 設定 GitHub Actions 快取

```yaml
# 在 workflow 中加入快取
- uses: actions/cache@v3
  with:
    path: public/rates/
    key: exchange-rates-${{ runner.os }}
```

---

## 常見問題

### Q1: 方案 1 的 `--force-with-lease` 安全嗎？

✅ 是的，`--force-with-lease` 比 `--force` 安全：

- 只有在遠端分支沒有新 commits 時才會 push
- 避免覆蓋其他人的變更
- 適合自動化場景

### Q2: 使用分支策略會影響部署嗎？

❌ 不會：

- Zeabur/Vercel 仍從 `main` 分支部署
- 只有 CDN 讀取從 `rates` 分支
- 兩者完全獨立

### Q3: 如何切換回原始方案？

```bash
# 恢復原始 workflow
git checkout .github/workflows/update-exchange-rates.yml.backup
mv .github/workflows/update-exchange-rates.yml.backup .github/workflows/update-exchange-rates.yml

# 恢復 CDN URLs
# 改回原始的 @main URLs

git commit -m "revert: back to original rate update strategy"
git push
```

---

## 總結

**最佳實踐推薦**: 使用**方案 2（分支策略）**

理由：

1. ✅ Main 分支完全乾淨，便於追蹤程式碼變更
2. ✅ 匯率更新隔離，不影響開發流程
3. ✅ 實施難度適中，長期維護簡單
4. ✅ 符合 Git 最佳實踐（功能分支隔離）

---

**最後更新**: 2025-10-13T22:52:21+08:00  
**狀態**: 📋 待實施
