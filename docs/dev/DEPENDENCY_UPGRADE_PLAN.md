# pnpm 依賴升級與鎖版策略

> 依據 `pnpm -r outdated`（2025-10-12）與 [TECH_DEBT_AUDIT.md](./TECH_DEBT_AUDIT.md)。

## 1. 現況快照

| 套件                                         | 目前版本 | 最新版本   | 類別 | 備註                                         |
| -------------------------------------------- | -------- | ---------- | ---- | -------------------------------------------- |
| `vite`                                       | 5.4.20   | **7.1.9**  | dev  | major，需同步升級 `@vitejs/plugin-react-swc` |
| `@vitejs/plugin-react-swc`                   | 3.11.0   | **4.1.0**  | dev  | 與 Vite 7 綁定                               |
| `tailwindcss`                                | 3.4.18   | **4.1.14** | dev  | major，需採用新 token 系統 [ref: #6]         |
| `vitest`                                     | 2.1.9    | 3.2.4      | dev  | major，與 Vite 7 一併處理 [ref: #7]          |
| `eslint`                                     | 8.57.1   | 9.37.0     | dev  | major，需搭配 `@typescript-eslint` 8         |
| `@typescript-eslint/*`                       | 6.21.0   | 8.46.0     | dev  | major                                        |
| `husky`                                      | 8.0.3    | 9.1.7      | dev  | minor，需 Node ≥18                           |
| `lint-staged`                                | 15.5.2   | 16.2.4     | dev  | major（Node 18+）                            |
| `@types/node`                                | 22.18.9  | 24.7.2     | dev  | minor，可先升級                              |
| 其他（lucide-react、@vitest/coverage-v8 等） | -        | -          | -    | patch/minor                                  |

## 2. 總體策略

1. **Patch / Minor 優先**：每週安排一次 `pnpm -w up --interactive`，只選 patch/minor，確保 CI 維持綠燈。
2. **Major 分支驗證**：Vite 7、Tailwind 4、ESLint 9 均需建立專屬分支，搭配 `pnpm store prune` 清理快取後測試。
3. **鎖版**：保持 `packageManager: "pnpm@9.10.0"` 與 `engines`（Node ≥20）。Major 升級通過後記得更新此欄位。
4. **記錄與回滾**：每次升級完成後，更新本文件與 `CHANGELOG.md`，並寫下回滾腳本。

## 3. 升級順序

### Step A — 基礎 Patch/Minor（0.5d）

```bash
pnpm -w up --latest --filter @app/ratewise lucide-react @types/node
pnpm -w up --latest --filter ratewise-monorepo husky lint-staged
pnpm lint && pnpm typecheck && pnpm --filter @app/ratewise test:coverage
```

**回滾**：`git revert` 對應 commit；若發現鎖檔有問題，執行 `pnpm install --frozen-lockfile` 還原。

### Step B — ESLint / TypeScript-ESLint major（1d）

```bash
pnpm -w up eslint@^9 @typescript-eslint/parser@^8 @typescript-eslint/eslint-plugin@^8
pnpm lint
```

- 若遇到新規則破壞，可暫時在 `.eslintrc.cjs` 內關閉並記錄 TODO。
- **回滾**：`git revert` 或將版本鎖回 `^8`，在 `package.json` 記錄阻擋原因。

### Step C — Vite 7 / Vitest 3（2d）

```bash
pnpm --filter @app/ratewise up vite@latest vitest@latest @vitejs/plugin-react-swc@latest
pnpm --filter @app/ratewise test:coverage
pnpm --filter @app/ratewise build
```

重點檢查：

- `vite.config.ts` 是否需要調整 `defineConfig` 型別。
- `vitest.config.ts` 是否需加入 `test.environmentOptions` 以相容 Vite 7。
- 若 `jsdom` 需升級到 27，記得同步調整。

**回滾**：`git revert`；若 build 失敗，立即將版本鎖回 5.x，並在 `DEPENDENCY_UPGRADE_PLAN.md` 標註阻擋。

### Step D — Tailwind CSS 4（2d）

流程：

1. 依官方指南建立 `tailwind.config.ts` 新格式（content 改為 `safelist` 模式、字型 token）。
2. 運行 `pnpm --filter @app/ratewise build` 並檢查 `dist/assets/*.css` 體積。
3. 實際手動驗證 UI（或使用 Puppeteer 截圖比對）。

**回滾**：`git revert` Tailwind 升級 PR，並還原 `postcss.config.js / tailwind.config.ts`。

## 4. 驗證腳本總表

| 階段                       | 指令                                                                       |
| -------------------------- | -------------------------------------------------------------------------- |
| 快速驗證                   | `pnpm lint && pnpm typecheck && pnpm --filter @app/ratewise test:coverage` |
| 打包驗證                   | `pnpm --filter @app/ratewise build`                                        |
| E2E（完成 Phase 1 後啟用） | `pnpm test:e2e`                                                            |

## 5. 回滾守則

- 所有升級 PR 必須附上 `git revert <sha>` 可完全還原。
- 若需要更動 Docker / Cloudflare，須以同一 PR 提供對應的復原指令。
- 若升級造成不可接受的破壞，立即建立 issue 記錄阻擋項並將版本鎖回原值：

```bash
pnpm up vite@5.4.20 @vitejs/plugin-react-swc@3.11.0 --filter @app/ratewise
```

---

> 追蹤與補充資料請更新於 `CHANGELOG.md` 與 `docs/dev/CITATIONS.md`。
