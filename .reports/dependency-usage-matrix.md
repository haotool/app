# 依賴使用矩陣分析報告

**生成日期**: 2026-02-08
**分析目標**: Phase 2 依賴清理

---

## 📊 Root package.json devDependencies 分析

### ✅ 正在使用（保留）

| 依賴                              | 版本    | 使用位置                                    | 用途                      | 狀態    |
| --------------------------------- | ------- | ------------------------------------------- | ------------------------- | ------- |
| `@changesets/cli`                 | ^2.29.8 | package.json scripts, release.yml           | 版本管理 CLI              | ✅ 保留 |
| `@changesets/changelog-github`    | ^0.5.2  | release.yml (changesets action)             | Changeset GitHub 格式化器 | ✅ 保留 |
| `@commitlint/cli`                 | ^20.3.1 | husky pre-commit                            | Commit message 驗證       | ✅ 保留 |
| `@commitlint/config-conventional` | ^20.3.1 | commitlint.config.js                        | Conventional commits 配置 | ✅ 保留 |
| `@eslint/js`                      | ^9.39.2 | eslint.config.js                            | ESLint 核心               | ✅ 保留 |
| `@lhci/cli`                       | ^0.15.1 | ci.yml (Lighthouse CI job)                  | Lighthouse CI 工具        | ✅ 保留 |
| `@playwright/test`                | ^1.57.0 | package.json scripts, ci.yml (e2e job)      | E2E 測試框架              | ✅ 保留 |
| `@vitejs/plugin-react-swc`        | ^4.2.2  | apps/\*/vite.config.ts (所有 4 個 apps)     | Vite React 插件           | ✅ 保留 |
| `eslint`                          | ^9.39.2 | package.json scripts, eslint.config.js      | 代碼檢查工具              | ✅ 保留 |
| `eslint-config-prettier`          | ^10.1.8 | eslint.config.js                            | Prettier + ESLint 整合    | ✅ 保留 |
| `eslint-plugin-react`             | ^7.37.5 | eslint.config.js                            | React ESLint 規則         | ✅ 保留 |
| `eslint-plugin-react-hooks`       | ^7.0.1  | eslint.config.js                            | React Hooks ESLint 規則   | ✅ 保留 |
| `eslint-plugin-react-refresh`     | ^0.4.26 | eslint.config.js                            | React Refresh ESLint 規則 | ✅ 保留 |
| `husky`                           | ^9.1.7  | package.json prepare script                 | Git hooks 管理            | ✅ 保留 |
| `jsdom`                           | ^27.4.0 | scripts/\*.mjs (DOM 解析), vitest           | DOM 模擬環境              | ✅ 保留 |
| `lighthouse`                      | ^13.0.1 | package.json scripts (lighthouse, seo:test) | 效能審計工具              | ✅ 保留 |
| `lint-staged`                     | ^16.2.7 | package.json, husky pre-commit              | Git staged 檔案檢查       | ✅ 保留 |
| `pa11y`                           | ^9.0.1  | package.json scripts (pa11y, seo:test)      | 可訪問性測試              | ✅ 保留 |
| `prettier`                        | ^3.8.1  | package.json scripts, lint-staged           | 代碼格式化                | ✅ 保留 |
| `typescript`                      | ^5.6.2  | eslint.config.js, tsconfig 編譯             | TypeScript 編譯器         | ✅ 保留 |
| `typescript-eslint`               | ^8.53.1 | eslint.config.js                            | TypeScript ESLint 支援    | ✅ 保留 |
| `unlighthouse`                    | ^0.17.4 | package.json scripts (unlighthouse)         | 批次網站審計              | ✅ 保留 |
| `vite`                            | ^7.3.1  | apps/\*/vite.config.ts, tsconfig.base.json  | 建置工具                  | ✅ 保留 |
| `vitest`                          | ^4.0.17 | scripts/**tests**, apps/\* tests            | 測試框架                  | ✅ 保留 |
| `xml2js`                          | ^0.6.2  | scripts/**tests**/sitemap-2025.test.ts      | XML 解析                  | ✅ 保留 |

---

### ❌ 重複聲明（可移除 - 已在子 package 聲明）

| 依賴                  | 版本    | 重複位置                              | 原因       | 建議            |
| --------------------- | ------- | ------------------------------------- | ---------- | --------------- |
| `@vitest/coverage-v8` | ^4.0.17 | apps/\*/package.json (所有 4 個 apps) | 子包已聲明 | ❌ 從 root 移除 |

**說明**: 所有 4 個 apps (ratewise, nihonname, haotool, quake-school) 的 package.json 都已經聲明了 `@vitest/coverage-v8`，root 的聲明是多餘的。

---

### ⚠️ 未使用或有疑問（需驗證）

| 依賴               | 版本    | Depcheck 結果 | 實際使用情況                              | 建議                |
| ------------------ | ------- | ------------- | ----------------------------------------- | ------------------- |
| `vite-ssg-sitemap` | ^0.10.0 | 未使用        | 僅在測試註解中提到，實際 sitemap 手動維護 | ❌ 可移除           |
| `depcheck`         | ^1.4.7  | 剛安裝        | Phase 1 分析工具                          | ⚠️ 保留（持續使用） |
| `knip`             | ^5.83.1 | 剛安裝        | Phase 1 分析工具                          | ⚠️ 保留（持續使用） |
| `ts-prune`         | ^0.10.3 | 剛安裝        | Phase 1 分析工具                          | ⚠️ 保留（持續使用） |

---

## 📦 apps/ratewise/package.json 依賴分析

### ⚠️ 需驗證的依賴

根據 depcheck 報告，以下依賴在 apps/ratewise/package.json 中未被檢測到使用：

| 依賴                         | 類型          | Depcheck 結果 | 實際調查                    | 建議      |
| ---------------------------- | ------------- | ------------- | --------------------------- | --------- |
| `zustand`                    | dependency    | 未檢測到使用  | 需搜索 import/require       | 🔍 待驗證 |
| `lighthouse`                 | devDependency | 未檢測到使用  | Root 已有，重複             | ❌ 移除   |
| `workbox-cacheable-response` | devDependency | 未檢測到使用  | 需檢查 SW 配置              | 🔍 待驗證 |
| `workbox-cli`                | devDependency | 未檢測到使用  | 需檢查 package.json scripts | 🔍 待驗證 |
| `workbox-core`               | devDependency | 未檢測到使用  | 需檢查 SW 代碼              | 🔍 待驗證 |
| `workbox-expiration`         | devDependency | 未檢測到使用  | 需檢查 SW 代碼              | 🔍 待驗證 |
| `workbox-precaching`         | devDependency | 未檢測到使用  | 需檢查 SW 代碼              | 🔍 待驗證 |
| `workbox-routing`            | devDependency | 未檢測到使用  | 需檢查 SW 代碼              | 🔍 待驗證 |
| `workbox-strategies`         | devDependency | 未檢測到使用  | 需檢查 SW 代碼              | 🔍 待驗證 |

---

## 🔍 深度驗證計畫

### Step 1: 搜索 zustand 使用

```bash
rg "zustand" apps/ratewise/src --type ts --type tsx
rg "import.*zustand" apps/ratewise --type ts --type tsx
```

### Step 2: 搜索 workbox 使用

```bash
rg "workbox" apps/ratewise/src --type ts --type js
rg "import.*workbox" apps/ratewise --type ts --type js
grep -r "workbox" apps/ratewise/vite.config.ts
```

### Step 3: 檢查 Service Worker

```bash
cat apps/ratewise/src/sw.ts | grep -i workbox
cat apps/ratewise/vite-plugins/*.ts | grep -i workbox
```

### Step 4: 檢查 package.json scripts

```bash
grep "workbox" apps/ratewise/package.json
```

---

## 📋 總結

### 可以立即移除的依賴

1. **Root package.json**:
   - `@vitest/coverage-v8` - 重複（子包已聲明）
   - `vite-ssg-sitemap` - 未實際使用

2. **apps/ratewise/package.json**:
   - `lighthouse` - Root 已有，重複

**預期影響**:

- 移除 3 個重複/未使用依賴
- 減少約 10-20MB node_modules 大小

### 需要進一步驗證的依賴

1. **apps/ratewise**:
   - `zustand` - 狀態管理庫
   - `workbox-*` (7 個包) - Service Worker 工具集

**驗證方法**:

- 代碼搜索 (rg/grep)
- Service Worker 配置檢查
- 測試刪除後 build 是否成功

### 保留的分析工具

- `depcheck`, `knip`, `ts-prune` - 持續用於代碼品質維護

---

## ⏭️ 執行計畫

### Phase 2a: 立即清理（低風險）✅

```bash
# 1. 移除重複的 @vitest/coverage-v8 (root)
pnpm remove -D -w @vitest/coverage-v8

# 2. 移除未使用的 vite-ssg-sitemap (root)
pnpm remove -D -w vite-ssg-sitemap

# 3. 移除重複的 lighthouse (ratewise)
pnpm --filter @app/ratewise remove -D lighthouse
```

**驗證**:

```bash
pnpm test          # 確認測試通過
pnpm build         # 確認建置成功
pnpm typecheck     # 確認類型檢查通過
```

### Phase 2b: 深度驗證後清理（中風險）🔍

1. 搜索 zustand 使用
2. 搜索 workbox 使用
3. 根據結果決定是否移除

---

**分析完成時間**: 2026-02-08
**下一步**: 執行 Phase 2a 立即清理
