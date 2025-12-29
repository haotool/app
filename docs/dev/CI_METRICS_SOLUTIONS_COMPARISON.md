# CI Metrics 污染問題解決方案比較

**問題**: `chore(ci): record CI metrics - XXXs` 類型的自動提交污染 git history，造成本地與遠端分支分歧，需要頻繁同步。

**建立時間**: 2025-12-30
**依據**: [GitHub Actions Best Practices 2025][Git Orphan Branches Guide][Datree CI/CD Optimization]

---

## 方案比較表

| 項目             | Option A: Artifacts | Option B: Orphan Branch | 現況 (Git Commit)    |
| ---------------- | ------------------- | ----------------------- | -------------------- |
| **Commit 污染**  | ✅ 零污染           | ✅ 零污染（隔離分支）   | ❌ 每次 CI 都 commit |
| **分支分歧問題** | ✅ 完全消除         | ✅ 完全消除             | ❌ 頻繁發生          |
| **查看便利性**   | ⚠️ 需下載或 API     | ✅ git clone 即可       | ✅ 直接在 repo       |
| **保留期限**     | ✅ 可調整 (90天)    | ✅ 永久保留             | ✅ 永久保留          |
| **額外維護成本** | ✅ 零成本           | ⚠️ 需管理 orphan branch | ❌ 高（衝突處理）    |
| **權限需求**     | ✅ 只需 read        | ⚠️ 需 write             | ⚠️ 需 write          |
| **實作複雜度**   | ✅ 簡單             | ⚠️ 中等                 | ✅ 簡單              |
| **業界標準**     | ✅ GitHub 官方推薦  | ⚠️ 較少使用             | ❌ 不建議            |

---

## Option A: GitHub Actions Artifacts（推薦）

### 📊 實作方式

**變更檔案**: `.github/workflows/ci-metrics.yml`

**關鍵修改**:

```yaml
# 移除這段（造成污染的部分）
- name: Commit metrics
  run: |
    git commit -m "chore(ci): record CI metrics - ${DURATION}s"
    git push

# 改用這段
- name: Upload metrics artifact
  uses: actions/upload-artifact@v4
  with:
    name: ci-metrics
    path: ci-metrics/*.json
    retention-days: 90 # 保留 90 天
```

**完整實作**: 見 `.github/workflows/ci-metrics-artifacts.yml.proposed`

### ✅ 優點

1. **零 Commit 污染**: 完全消除 `chore(ci)` 類型的自動提交
2. **GitHub 原生支援**: 無需額外工具或服務
3. **自動清理**: 可設定保留期限（建議 90 天）
4. **降級權限**: `permissions.contents` 從 `write` 降為 `read`
5. **業界標準**: GitHub 官方推薦做法

### ⚠️ 注意事項

1. **查看方式**: 需到 Actions → Workflow → Artifacts 下載
2. **自動化查詢**: 可用 GitHub API 自動分析（若需要）
3. **歷史數據**: 需在每次執行時下載前 10 次 artifacts 做比較

### 📖 使用指南

**下載 Metrics**:

```bash
# 方法 1: GitHub UI
# 進入 Actions → CI Metrics Tracking → 選擇 run → Download artifacts

# 方法 2: GitHub CLI
gh run download <run-id> --name ci-metrics

# 方法 3: GitHub API
curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/artifacts/ARTIFACT_ID/zip
```

**分析 Metrics**:

```bash
# 下載後本地分析
jq '[.runs[-10:][].duration_seconds] | add / length' ci-metrics/*.json
```

---

## Option B: Orphan Branch

### 📊 實作方式

**變更檔案**: `.github/workflows/ci-metrics.yml`

**關鍵修改**:

```yaml
# Checkout 改為 metrics orphan branch
- name: Checkout metrics branch
  uses: actions/checkout@v4
  with:
    ref: metrics # 獨立歷史分支

# Commit 到 metrics branch（不污染 main）
- name: Commit metrics to orphan branch
  run: |
    git commit -m "metrics: ${DURATION}s [${BRANCH}@${COMMIT}]"
    git push origin metrics  # Push 到 metrics，不影響 main
```

**完整實作**: 見 `.github/workflows/ci-metrics-orphan.yml.proposed`

### ✅ 優點

1. **Metrics 在 Git 中**: 熟悉的 git 工具即可查看
2. **完全隔離**: metrics branch 與 main 歷史獨立
3. **永久保留**: 不受保留期限限制
4. **易於 Clone**: `git clone -b metrics` 即可

### ⚠️ 注意事項

1. **額外分支**: 需管理 `metrics` orphan branch
2. **Clone 時間**: 完整 clone 會包含兩個獨立歷史
3. **初次設定**: 需手動建立 orphan branch（workflow 會自動處理）

### 📖 使用指南

**查看 Metrics**:

```bash
# Clone metrics branch
git clone -b metrics https://github.com/USER/REPO metrics-data
cd metrics-data

# 查看歷史
git log --oneline  # 查看所有 metrics commits

# 分析數據
jq '[.runs[-10:][].duration_seconds] | add / length' ci-metrics/metrics.json
```

---

## 推薦決策

### ✅ 推薦 Option A (Artifacts)

**理由**:

1. **業界標準**: GitHub 官方推薦做法
2. **零維護成本**: 不需管理額外分支
3. **權限最小化**: 降級為 read-only
4. **自動清理**: 避免無限膨脹
5. **簡單實作**: 改動最小

**適用場景**:

- ✅ 主要用途是效能趨勢監控
- ✅ 不需頻繁手動查看 metrics
- ✅ 偏好 GitHub 原生功能

### ⚠️ 考慮 Option B (Orphan Branch) 的情況

**適用場景**:

- 需要長期保留所有歷史數據
- 需要頻繁手動查看 metrics
- 團隊偏好 git-based 解決方案
- 需要 metrics 版本控制

---

## 實施步驟（Option A - Artifacts）

### 1. 備份現有數據

```bash
# 備份當前 metrics 到獨立分支（可選）
git checkout -b archive/ci-metrics-backup
git add docs/dev/ci-metrics.json
git commit -m "archive: backup CI metrics before migration"
git push origin archive/ci-metrics-backup
```

### 2. 替換 Workflow

```bash
# 刪除舊 workflow
rm .github/workflows/ci-metrics.yml

# 啟用新 workflow
mv .github/workflows/ci-metrics-artifacts.yml.proposed \
   .github/workflows/ci-metrics.yml

# 移除舊 metrics 文件（已不需要）
git rm docs/dev/ci-metrics.json
```

### 3. 提交變更

```bash
git add .github/workflows/ci-metrics.yml
git commit -m "refactor(ci): migrate metrics to artifacts

- 移除 git commit 污染問題
- 改用 GitHub Actions Artifacts 儲存 metrics
- 降級權限為 read-only
- 保留 90 天歷史記錄

依據: [GitHub Actions Best Practices 2025]
"

git push origin main
```

### 4. 驗證

```bash
# 觸發 CI 並檢查
# 1. 進入 GitHub Actions
# 2. 等待 CI 完成
# 3. 檢查 CI Metrics Tracking workflow
# 4. 下載 artifacts 驗證數據
```

---

## 回滾計畫

如果新方案有問題，可快速回滾：

```bash
# 恢復舊 workflow
git revert HEAD
git push origin main

# 或從備份恢復
git checkout archive/ci-metrics-backup -- docs/dev/ci-metrics.json
git checkout archive/ci-metrics-backup -- .github/workflows/ci-metrics.yml
git commit -m "revert: restore original CI metrics workflow"
git push origin main
```

---

## 相關資源

**官方文件**:

- [GitHub Actions - Storing workflow data as artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
- [GitHub Actions - Metrics for Actions](https://docs.github.com/en/actions/how-tos/administer/view-metrics)
- [Git Orphan Branches Guide](https://graphite.com/guides/git-orphan-branches)

**最佳實踐**:

- [Datree - GitHub Actions Best Practices](https://www.datree.io/resources/github-actions-best-practices)
- [Avoid Environment Pollution in CI/CD](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)

---

**建議**: 採用 **Option A (Artifacts)** 方案，立即消除 commit 污染問題。
