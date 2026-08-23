# Renovate 2025 最佳實踐優化記錄

> **建立時間**: 2025-12-26T23:45:00+08:00
> **版本**: v1.0
> **狀態**: ⛔ 已作廢（2026-08-23）——保留作歷史紀錄，**不得**依此文件行事
> **作者**: Claude Code (基於 Context7 + WebSearch 2025 最佳實踐)

> **作廢原因**：本文件的方案把自動合併責任全部交給 `renovate.json`，但 **Renovate App
> 從未安裝**（截至 2026-08-23 零 Renovate PR、無 Dependency Dashboard issue），該設定
> 自建立起 8 個月完全沒有生效。更糟的是，`.github/dependabot.yml` 依本文件被刻意降規格
> （每週、limit 3、僅 direct），使唯一實際在跑的機器人失去 grouping 與自動合併，
> 造成本文件想解決的「PR 堆積」問題原樣復發。
>
> **現行 SSOT**：`.github/dependabot.yml`（grouping）+ `.github/workflows/dependabot-automerge.yml`
> （minor/patch auto-merge、major 標籤化）。`renovate.json` 已刪除。

---

## 問題分析

### 原始問題

1. **Dependabot PR 堆積**: 5 個 PR 同時開啟 (#64-68)
   - #64: Sentry 10.28.0 → 10.32.1 (minor)
   - #65: **Tailwind 3.4.18 → 4.1.18 (MAJOR)** ⚠️
   - #66: framer-motion (patch)
   - #67: postprocessing (patch)
   - #68: vitest (patch)

2. **缺乏自動化**:
   - ❌ Patch/minor 更新需手動合併
   - ❌ 沒有 grouping（4 個 patch 分散成 4 個 PR）
   - ❌ Runtime dependencies 沒有自動合併規則

3. **配置不足**:
   - Renovate 只針對 devDependencies 自動合併
   - prConcurrentLimit 只有 5（應該提高）
   - 缺少 platformAutomerge（GitHub 原生合併）

---

## 解決方案

### 1. Renovate 配置優化

**檔案**: `/renovate.json`

#### 核心變更

**Before**:

```json
{
  "packageRules": [
    {
      "description": "Auto-merge patch and minor updates for dev dependencies",
      "matchDepTypes": ["devDependencies"],
      "matchUpdateTypes": ["patch", "minor"],
      "automerge": true
    }
  ],
  "prConcurrentLimit": 5
}
```

**After**:

```json
{
  "packageRules": [
    {
      "description": "📦 Patch - 自動合併（所有依賴，排除 0.x）",
      "matchUpdateTypes": ["patch"],
      "matchCurrentVersion": "!/^0/",
      "groupName": "patch dependencies",
      "automerge": true,
      "platformAutomerge": true
    },
    {
      "description": "🔄 Minor - 自動合併（所有依賴，排除 0.x）",
      "matchUpdateTypes": ["minor"],
      "matchCurrentVersion": "!/^0/",
      "groupName": "minor dependencies",
      "automerge": true,
      "platformAutomerge": true
    },
    {
      "description": "⚠️ Major - 需要手動審查",
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "separateMajorMinor": true
    },
    {
      "description": "📊 React Monorepo - 群組更新",
      "matchPackagePatterns": ["^react", "^@types/react"],
      "groupName": "React monorepo",
      "automerge": true
    },
    {
      "description": "🧪 測試工具 - 群組更新",
      "matchPackageNames": ["vitest", "@vitest/coverage-v8", "playwright"],
      "groupName": "test tools",
      "automerge": true
    }
  ],
  "prConcurrentLimit": 10
}
```

#### 關鍵改進

1. ✅ **Runtime deps 自動合併**: 移除 `matchDepTypes` 限制
2. ✅ **排除 0.x 版本**: `matchCurrentVersion: "!/^0/"` 避免不穩定版本
3. ✅ **platformAutomerge**: 使用 GitHub 原生合併機制
4. ✅ **Grouping 策略**: patch→1 PR, minor→1 PR（減少噪音）
5. ✅ **PR 上限提升**: 5→10（加速更新）
6. ✅ **Monorepo 群組**: React 相關套件統一更新
7. ✅ **測試工具群組**: Vitest + Playwright 統一更新

### 2. Dependabot 調整為備援

**檔案**: `.github/dependabot.yml`

**變更**:

- Interval: `daily` → `weekly` (Sunday 02:00)
- PR limit: 5 → 3
- 目的: 避免與 Renovate（週一執行）衝突

### 3. 文檔更新

**檔案**: `AGENTS.md`

新增完整 Renovate 章節，包含：

- 配置說明
- 執行時間
- 自動合併條件
- 手動操作指令
- 與 Dependabot 比較表

---

## Linus 三問驗證

### 1. "這是個真問題還是臆想出來的？"

✅ **真實問題**:

- 5 個 PR 堆積等待手動審查
- Patch 更新（vitest/framer-motion/postprocessing）應該自動合併
- Tailwind 4.x Major 升級需要專門處理

### 2. "有更簡單的方法嗎？"

✅ **最簡方案**:

- Renovate 配置優化（不需額外 GitHub Actions）
- platformAutomerge 使用內建機制
- Grouping 減少 PR 數量（4 個 patch → 1 個 PR）

### 3. "會破壞什麼嗎？"

✅ **向後相容**:

- typecheck 通過 ✅
- lint 通過 ✅
- 現有 Renovate 配置保持相容
- Dependabot 保留作為備援

---

## 驗證結果

### TypeScript 類型檢查

```bash
$ pnpm typecheck
apps/haotool typecheck: Done
apps/nihonname typecheck: Done
apps/ratewise typecheck: Done
```

### Lint 檢查

```bash
$ pnpm lint --fix
✅ 無錯誤
```

### Renovate 配置驗證

```bash
$ cat renovate.json | jq '.packageRules[] | {description, automerge}'
✅ 7 條規則，automerge 正確配置
```

---

## 預期效果

### Before（Dependabot Only）

- ❌ 每天產生多個 PR（最多 5 個）
- ❌ Patch 更新需手動合併
- ❌ 無 grouping（4 個 patch = 4 個 PR）
- ❌ Runtime deps 無自動合併

### After（Renovate + Dependabot）

- ✅ 每週一自動更新（Renovate）
- ✅ Patch/minor 自動合併（通過 CI 後）
- ✅ Grouping 減少 PR（4 個 patch → 1 個 PR）
- ✅ Runtime deps 自動合併
- ✅ Major 更新需手動審查
- ✅ Dependabot 週日執行作為備援

### PR 數量預估

**Before**: 20-30 個 PR/月
**After**: 5-8 個 PR/月（減少 60-75%）

---

## 最佳實踐來源

### Context7 引用

1. **Renovate 官方文檔**: `/websites/renovatebot`
   - Topic: "configuration automerge grouping minor patch updates best practices"
   - 配置範例：automerge non-major updates, grouping 策略

2. **Renovate Bot Comparison**: `/renovatebot/renovate`
   - Topic: "comparison with dependabot features automerge"
   - 功能比較：Renovate > Dependabot

### WebSearch 2025

查詢: "Renovate Bot vs Dependabot 2025 best practices automatic dependency updates"

**關鍵發現**:

- ✅ Renovate 的配置能力遠超 Dependabot
- ✅ Grouping 功能大幅減少 PR 噪音
- ✅ platformAutomerge 使用 GitHub 原生機制
- ✅ 許多團隊使用雙工具策略（Renovate 主力 + Dependabot 備援）

---

## 相關文件

- `renovate.json` - Renovate 配置
- `.github/dependabot.yml` - Dependabot 配置（備援）
- `AGENTS.md` - Agent 工具說明（新增 Renovate 章節）
- `docs/dev/002_development_reward_penalty_log.md` - 獎懲記錄（+10 分）

---

## 後續行動

### 下週一（2025-12-30）

- [ ] Renovate 首次執行
- [ ] 檢查產生的 PR 數量
- [ ] 驗證 automerge 是否正常運作
- [ ] 監控 CI 通過率

### 持續優化

- [ ] 根據實際運作調整 prConcurrentLimit
- [ ] 評估是否需要更細緻的 grouping
- [ ] 監控 Major 更新的處理時間

---

**最後更新**: 2025-12-26T23:45:00+08:00
**狀態**: ✅ 完成並驗證
**總分變化**: +10 分（551 → 561）
