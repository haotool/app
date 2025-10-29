# 版本管理指南

**最後更新**: 2025-10-21
**版本**: v1.0
**狀態**: ✅ 已完成

---

## 概述

本專案採用 **生產級版本管理系統**，整合以下最佳實踐：

- ✅ [Semantic Versioning 2.0.0](https://semver.org/) - 語義化版本規範
- ✅ [Changesets](https://github.com/changesets/changesets) - Monorepo 版本管理
- ✅ [GitHub Actions](https://github.com/features/actions) - 自動化工作流
- ✅ [Conventional Commits](https://www.conventionalcommits.org/) - 提交訊息規範

---

## 版本號規範 (Semantic Versioning)

### 格式：MAJOR.MINOR.PATCH

```
1.0.0
│ │ │
│ │ └─ PATCH: 向後相容的 Bug 修復
│ └─── MINOR: 向後相容的新功能
└───── MAJOR: 破壞性變更 (Breaking Changes)
```

### 範例

- `1.0.0` → `1.0.1`: 修復匯率計算錯誤 (PATCH)
- `1.0.1` → `1.1.0`: 新增歷史匯率功能 (MINOR)
- `1.1.0` → `2.0.0`: 重新設計 API 接口 (MAJOR)

---

## 工作流程

### 1. 開發新功能或修復

```bash
# 1. 建立功能分支
git checkout -b feat/new-feature

# 2. 進行開發
# ...

# 3. 提交變更（遵循 Conventional Commits）
git add .
git commit -m "feat(converter): add historical rates chart"
```

### 2. 建立 Changeset

```bash
# 執行 changeset CLI
pnpm changeset

# 互動式選擇：
# - 選擇要變更的 package (@app/ratewise)
# - 選擇版本類型 (major/minor/patch)
# - 撰寫變更摘要（將顯示在 CHANGELOG）
```

**Changeset 範例**：

```markdown
---
'@app/ratewise': minor
---

新增歷史匯率圖表功能，使用者可查看過去 30 天的匯率趨勢。
```

### 3. 提交 PR

```bash
git add .changeset/
git commit -m "chore: add changeset for historical rates feature"
git push origin feat/new-feature

# 建立 Pull Request 到 main
```

### 4. 自動化發版流程

當 PR 合併到 `main` 分支後：

1. **GitHub Actions** 自動偵測 changeset
2. 自動建立 **Version PR**（標題：`Version Packages`）
3. Version PR 包含：
   - 更新版本號（`package.json`）
   - 自動生成 `CHANGELOG.md`
   - 整合所有 changeset 內容

### 5. 發布新版本

```bash
# Maintainer 審核並合併 Version PR
# → 版本號自動更新
# → CHANGELOG 自動生成
# → Git Tag 自動建立（如需發布到 npm）
```

---

## Changesets 指令

### 常用指令

```bash
# 建立新的 changeset
pnpm changeset

# 查看當前 changeset 狀態
pnpm changeset:status

# 更新版本號（通常由 CI 執行）
pnpm changeset:version

# 發布到 npm（如需）
pnpm changeset:publish
```

### Changeset 類型選擇

| 變更類型  | 版本號影響    | 範例                         |
| --------- | ------------- | ---------------------------- |
| **patch** | 1.0.0 → 1.0.1 | Bug 修復、文件更新、效能優化 |
| **minor** | 1.0.0 → 1.1.0 | 新功能、向後相容的變更       |
| **major** | 1.0.0 → 2.0.0 | 破壞性變更、API 重構         |

---

## CI/CD 整合

### GitHub Actions 工作流

**檔案位置**: `.github/workflows/release.yml`

**觸發條件**:

- 推送到 `main` 分支
- 包含 changeset 檔案

**執行步驟**:

1. 檢查 changeset 狀態
2. 建立 Version PR（如有 changeset）
3. 自動更新版本號、`apps/ratewise/public/sitemap.xml`（更新 `lastmod`）與 CHANGELOG
4. 提交變更到 Version PR（Commit: `chore: Version Packages`）

### 自動標記（Git tags）

- Workflow: `.github/workflows/auto-tag.yml`
- 觸發：當 `main` 推送包含版本號變更 (`apps/ratewise/package.json`) 時
- 行為：建立 `ratewise-vX.Y.Z` 標籤並推送到遠端（避免重複 tag）
- 目的：提供 PWA 更新版本資訊與部署追蹤依據

---

## 版本資訊顯示

### UI 顯示位置

根據 **UX 最佳實踐研究** (UX Stack Exchange)：

- **位置**: Footer 右下角
- **格式**: `v1.0.0 • Built on 2025-10-21 12:34`
- **樣式**: 小字體、低對比度（不干擾主要內容）

### 實作方式

**1. Vite 配置注入版本號** (`vite.config.ts`):

```typescript
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
const appVersion = packageJson.version;
const buildTime = new Date().toISOString();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  // ...
});
```

**2. TypeScript 聲明** (`src/vite-env.d.ts`):

```typescript
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
```

**3. React 組件** (`src/components/VersionDisplay.tsx`):

```tsx
export function VersionDisplay() {
  const version = __APP_VERSION__;
  const buildTime = new Date(__BUILD_TIME__);
  // ...
}
```

---

## 最佳實踐

### ✅ Do

- ✅ 每個 PR 都包含對應的 changeset
- ✅ Changeset 摘要簡潔明確（<200 字）
- ✅ 破壞性變更必須詳細說明遷移指南
- ✅ 定期合併 Version PR（每週或每次 Sprint）
- ✅ 遵循 Semantic Versioning 規範

### ❌ Don't

- ❌ 直接修改 `package.json` 版本號
- ❌ 手動編輯 `CHANGELOG.md`
- ❌ 在功能分支上執行 `changeset version`
- ❌ 跳過 changeset 直接合併 PR
- ❌ 使用不明確的 changeset 摘要

---

## 故障排除

### Q: Changeset 建立失敗

**A**: 確保在專案根目錄執行 `pnpm changeset`

### Q: Version PR 沒有自動建立

**A**: 檢查以下項目：

1. `.changeset/` 目錄中是否有 changeset 檔案
2. GitHub Actions 是否有權限建立 PR
3. 查看 Actions 執行日誌

### Q: 版本號顯示錯誤

**A**: 確認以下步驟：

1. 執行 `pnpm build:ratewise` 重新構建
2. 檢查 `vite.config.ts` 配置是否正確
3. 清除瀏覽器快取

---

## 參考資源

### 官方文檔

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [Changesets GitHub Action](https://github.com/changesets/action)
- [Conventional Commits](https://www.conventionalcommits.org/)

### 專案文件

- `CLAUDE.md` - 開發指南與 commit 規範
- `ARCHITECTURE_BASELINE.md` - 架構藍圖
- `.changeset/config.json` - Changesets 配置
- `.github/workflows/release.yml` - 發版工作流

---

## 版本歷史範例

### v1.0.0 (2025-10-21)

**重大更新**:

- 🚀 建立完整的版本管理系統
- ✅ 整合 Changesets + GitHub Actions
- 🎨 實作版本號 UI 顯示
- 📚 完整的版本管理文檔

**技術決策**:

- 選擇 Changesets 而非 semantic-release（更適合 Monorepo）
- Footer 顯示版本號（基於 UX 最佳實踐研究）
- 自動化工作流整合 pnpm workspace

---

**維護者**: haotool (haotool.org@gmail.com)
**Repository**: https://github.com/haotool/app
