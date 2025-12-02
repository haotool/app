# Lighthouse CI 監測腳本使用指南

> **建立日期**: 2025-12-02
> **版本**: v1.0.0
> **用途**: 監測 RateWise SEO 與效能分數，確保不下降

---

## 📋 目錄

1. [快速開始](#快速開始)
2. [腳本說明](#腳本說明)
3. [使用範例](#使用範例)
4. [CI/CD 整合](#cicd-整合)
5. [故障排除](#故障排除)

---

## 🚀 快速開始

### 前置需求

```bash
# 1. 安裝 Node.js (v20+)
node --version

# 2. 安裝 Lighthouse CLI
npm install -g lighthouse

# 3. 驗證安裝
lighthouse --version
```

### 基本使用

```bash
# 執行完整掃描
./scripts/lighthouse-ci.sh

# 分析最近的報告
python3 scripts/analyze-lighthouse-scores.py

# 列出所有可用報告
python3 scripts/analyze-lighthouse-scores.py --list
```

---

## 📝 腳本說明

### 1. `lighthouse-ci.sh`

**主要功能**:

- 掃描 4 個主要頁面 (/, /faq/, /about/, /guide/)
- 比對 baseline 分數 (v1.2.0)
- 自動偵測分數下降並發出警告
- 生成 JSON + HTML 報告

**Baseline 分數** (v1.2.0):
| 類別 | 分數 |
|------|------|
| Performance | 97/100 |
| Accessibility | 100/100 |
| Best Practices | 100/100 |
| SEO | 100/100 |

**警告機制**:

- 分數下降 ≥5 分 → 🚨 警告並建議回滾
- 分數下降 1-4 分 → ⚠️ 提醒但可接受
- 分數維持或提升 → ✅ 通過

**輸出位置**:

```
./reports/lighthouse/YYYYMMDD_HHMMSS/
├── lighthouse-home.report.html
├── lighthouse-home.report.json
├── lighthouse-faq.report.html
├── lighthouse-faq.report.json
├── lighthouse-about.report.html
├── lighthouse-about.report.json
├── lighthouse-guide.report.html
└── lighthouse-guide.report.json
```

---

### 2. `analyze-lighthouse-scores.py`

**主要功能**:

- 分析歷史 Lighthouse 報告
- 比較兩次掃描結果
- 追蹤效能趨勢
- 識別性能退化模式

**命令列參數**:

```bash
# 顯示幫助
python3 scripts/analyze-lighthouse-scores.py --help

# 分析特定報告
python3 scripts/analyze-lighthouse-scores.py --timestamp 20251202_120000

# 比較兩次掃描
python3 scripts/analyze-lighthouse-scores.py --compare 20251201_120000 20251202_120000

# 列出所有報告
python3 scripts/analyze-lighthouse-scores.py --list

# 自訂報告目錄
python3 scripts/analyze-lighthouse-scores.py --report-dir ./custom/path
```

---

## 💡 使用範例

### 範例 1: 每週定期掃描

```bash
#!/bin/bash
# weekly-lighthouse-scan.sh

# 執行掃描
./scripts/lighthouse-ci.sh

# 如果失敗，發送通知
if [ $? -ne 0 ]; then
  echo "⚠️  Lighthouse 掃描發現問題" | mail -s "RateWise SEO Alert" dev@example.com
fi

# 分析最近 5 次報告
python3 scripts/analyze-lighthouse-scores.py
```

### 範例 2: PR 前檢查

```bash
#!/bin/bash
# pre-pr-check.sh

# 記錄當前分數
BEFORE=$(date +%Y%m%d_%H%M%S)
./scripts/lighthouse-ci.sh

# 切換到 PR 分支
git checkout feature/new-feature

# 重新建置並測試
pnpm build
pnpm preview &
PREVIEW_PID=$!

# 等待伺服器啟動
sleep 5

# 執行掃描
AFTER=$(date +%Y%m%d_%H%M%S)
./scripts/lighthouse-ci.sh

# 比較結果
python3 scripts/analyze-lighthouse-scores.py --compare $BEFORE $AFTER

# 關閉預覽伺服器
kill $PREVIEW_PID
```

### 範例 3: 自動化 Cron Job

```bash
# 新增到 crontab
crontab -e

# 每週一早上 9:00 執行掃描
0 9 * * 1 cd /path/to/app && ./scripts/lighthouse-ci.sh >> ./logs/lighthouse-$(date +\%Y\%m\%d).log 2>&1
```

---

## 🔧 CI/CD 整合

### GitHub Actions 範例

```yaml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 9 * * 1' # 每週一 9:00

jobs:
  lighthouse:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          npm install -g lighthouse
          npm install -g pnpm
          pnpm install

      - name: Build
        run: pnpm build

      - name: Run Lighthouse CI
        run: ./scripts/lighthouse-ci.sh

      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-reports
          path: ./reports/lighthouse/

      - name: Analyze results
        run: python3 scripts/analyze-lighthouse-scores.py
```

---

## 🐛 故障排除

### 問題 1: `lighthouse: command not found`

**解決方案**:

```bash
npm install -g lighthouse
```

### 問題 2: Chrome 無法啟動 (CI 環境)

**解決方案**:

```bash
# 安裝 Chrome 依賴
sudo apt-get install -y chromium-browser

# 或使用 Docker
docker run --rm -v $(pwd):/app lighthouse lighthouse https://app.haotool.org/ratewise/
```

### 問題 3: 掃描超時

**解決方案**:

```bash
# 增加 timeout (在 lighthouse-ci.sh 中)
lighthouse "$url" --max-wait-for-load 60000 ...
```

### 問題 4: 分數不穩定

**可能原因**:

- 網路狀況波動
- CDN 快取未命中
- 伺服器負載過高

**建議**:

- 執行多次掃描取平均值
- 在穩定的網路環境下測試
- 使用 CI 環境的固定節點

---

## 📊 分數下降處理流程

根據 `AI_SEARCH_OPTIMIZATION_SPEC.md` 定義的流程：

1. **記錄下降的 category 與分數**
   - 查看 HTML 報告詳細診斷
   - 記錄具體下降數值

2. **比對 git diff，找出可能原因**

   ```bash
   git log --oneline --since="1 week ago"
   git diff HEAD~5..HEAD
   ```

3. **使用 Context7 查詢官方最佳實踐**

   ```bash
   # 範例：查詢 Lighthouse 性能優化
   resolve-library-id --libraryName "Lighthouse"
   get-library-docs --context7CompatibleLibraryID "/GoogleChrome/lighthouse" --topic "performance"
   ```

4. **修正問題**
   - 根據診斷建議進行優化
   - 重新執行 Lighthouse CI 驗證

5. **如無法修正 → 回滾變更**

   ```bash
   git revert HEAD
   ./scripts/lighthouse-ci.sh  # 驗證回滾後分數恢復
   ```

6. **記錄於獎懲記錄**
   - 更新 `docs/dev/002_development_reward_penalty_log.md`
   - 如成功修復: +1 分
   - 如需回滾: -1 分

---

## 📖 相關文檔

- [AI_SEARCH_OPTIMIZATION_SPEC.md](../docs/dev/AI_SEARCH_OPTIMIZATION_SPEC.md) - SEO 優化規格
- [SEO_TODO.md](../docs/dev/SEO_TODO.md) - SEO 任務清單
- [002_development_reward_penalty_log.md](../docs/dev/002_development_reward_penalty_log.md) - 開發獎懲記錄

---

## 🤝 貢獻

發現 bug 或有改進建議？歡迎提交 Issue 或 PR！

---

**最後更新**: 2025-12-02
**維護者**: Claude Code
**授權**: GPL-3.0
