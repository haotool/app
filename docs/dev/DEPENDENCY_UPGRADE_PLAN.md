# pnpm 依賴升級與鎖版策略

> **最後更新**: 2026-04-28T01:51:43+08:00
> **依據**: `pnpm info`（2026-04-28）、Vite 官方 v7 → v8 migration、TECH_DEBT_AUDIT.md、Context7 官方文檔
> **執行者**: LINUS_GUIDE Agent (Linus Torvalds 風格)
> **版本**: v2.1 (Vite 8 / Vitest 4.1 現況對齊)

---

## Linus 三問

在升級任何依賴前，先問自己：

1. **"這是個真問題還是臆想出來的？"**
   → Patch 版本有安全修復嗎？Major 版本有破壞性變更嗎？

2. **"有更簡單的方法嗎？"**
   → 能用 `pnpm up --latest` 一次升級嗎？還是需要分批測試？

3. **"會破壞什麼嗎？"**
   → 升級後 localStorage、API、測試會受影響嗎？

---

## 1. 現況快照（2026-04-28）

### 1.1 已對齊基線

| 套件                   | 目前版本 | 最新確認 | 類別 | 狀態      | 備註                          |
| ---------------------- | -------- | -------- | ---- | --------- | ----------------------------- |
| `vite`                 | 8.0.10   | 8.0.10   | dev  | ✅ 已對齊 | 直接依賴與 override 同步      |
| `@vitejs/plugin-react` | 6.0.1    | 6.0.1    | dev  | ✅ 已對齊 | 取代 `plugin-react-swc`       |
| `vitest`               | 4.1.5    | 4.1.5    | dev  | ✅ 已對齊 | 與 coverage provider 同步     |
| `@vitest/coverage-v8`  | 4.1.5    | 4.1.5    | dev  | ✅ 已對齊 | 避免 Vitest peer mismatch     |
| `@playwright/test`     | 1.57.0   | 1.59.1   | dev  | 🔄 待評估 | 需另開 PR 跑 E2E / screenshot |
| `typescript`           | 5.6/5.9  | 6.0.3    | dev  | 🔄 待評估 | TS 6 major，需獨立驗證        |

**Context7 參考**：

- [Vite v7 → v8 Migration](https://vite.dev/guide/migration.html) [官方]
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) [官方]

### 1.2 Major 版本升級 (P1/P2 - 需驗證)

| 套件                              | 目前版本 | 最新版本   | 類別 | 優先級 | 破壞性 | 備註                    |
| --------------------------------- | -------- | ---------- | ---- | ------ | ------ | ----------------------- |
| `@commitlint/cli`                 | 18.6.1   | **20.1.0** | dev  | P1     | ⚠️ 是  | major，需驗證           |
| `@commitlint/config-conventional` | 18.6.3   | **20.0.0** | dev  | P1     | ⚠️ 是  | major，需驗證           |
| `@vitest/coverage-v8`             | 3.2.4    | **4.0.3**  | dev  | P1     | ⚠️ 是  | major，需分支驗證       |
| `vitest`                          | 3.2.4    | **4.0.3**  | dev  | P1     | ⚠️ 是  | major，同步升級         |
| `eslint-plugin-react-hooks`       | 5.2.0    | **7.0.1**  | dev  | P1     | ⚠️ 是  | major，需驗證           |
| `husky`                           | 8.0.3    | **9.1.7**  | dev  | P1     | ⚠️ 是  | major，需驗證           |
| `lint-staged`                     | 15.5.2   | **16.2.6** | dev  | P1     | ⚠️ 是  | major，需驗證           |
| `eslint-config-prettier`          | 9.1.2    | **10.1.8** | dev  | P2     | ⚠️ 是  | major，低優先級         |
| `tailwindcss`                     | 3.4.14   | **4.1.14** | dep  | P2     | ⚠️ 是  | major，可選，需視覺測試 |

**Context7 參考**：

- [Vitest 4.0 Breaking Changes](https://vitest.dev/) [ref: #7]
- [React 19 Hooks Rules](https://react.dev/reference/rules/rules-of-hooks) [ref: #1]
- [Tailwind CSS 4.0](https://tailwindcss.com/blog/tailwindcss-v4) [ref: #6]

## 2. 總體策略（Linus 風格）

1. **Patch 優先，Never Break**：patch 版本立即升級，minor 版本經驗證後升級，major 版本建立分支驗證。
2. **原子化升級**：每個 major 版本獨立 PR，附完整驗收腳本與回滾策略。
3. **鎖版嚴格**：保持 `packageManager: "pnpm@9.10.0"` 與 `engines.node: ">=24.0.0"`。
4. **記錄與回滾**：每次升級完成後，更新本文件、`CHANGELOG.md` 與 `TECH_DEBT_AUDIT.md`。
5. **自動化**：使用 Renovate 或 Dependabot 自動監控，patch 版本自動合併。

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

### Step C — Vite 8 / Vitest 4（2d）

```bash
pnpm -r up vite@latest vitest@latest @vitest/coverage-v8@latest @vitejs/plugin-react@latest
pnpm --filter @app/ratewise test:coverage
pnpm --filter @app/ratewise build
```

重點檢查：

- `vite.config.ts` 是否需要調整 `defineConfig` 型別。
- `vite.config.ts` 不得保留 `@vitejs/plugin-react-swc`、`optimizeDeps.esbuildOptions` 或無效的 Rollup output key。
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
pnpm up vite@8.0.10 @vitejs/plugin-react@6.0.1 --filter @app/ratewise
```

---

> 追蹤與補充資料請更新於 `CHANGELOG.md` 與 `docs/dev/CITATIONS.md`。
