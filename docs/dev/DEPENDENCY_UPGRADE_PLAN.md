# pnpm 依賴升級與鎖版策略

> **最後更新**: 2025-10-26T03:43:36+08:00  
> **依據**: `pnpm -w outdated`（2025-10-26）、TECH_DEBT_AUDIT.md、Context7 官方文檔  
> **執行者**: LINUS_GUIDE Agent (Linus Torvalds 風格)  
> **版本**: v2.0 (完整超級技術債掃描產出)

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

## 1. 現況快照（2025-10-26）

### 1.1 Patch 安全升級 (P0 - 立即執行)

| 套件                          | 目前版本 | 最新版本   | 類別 | 優先級 | 破壞性 | 備註            |
| ----------------------------- | -------- | ---------- | ---- | ------ | ------ | --------------- |
| `vite`                        | 7.1.9    | **7.1.12** | dev  | P0     | ✅ 否  | patch，安全升級 |
| `@playwright/test`            | 1.56.0   | **1.56.1** | dev  | P0     | ✅ 否  | patch，安全升級 |
| `typescript-eslint`           | 8.46.1   | **8.46.2** | dev  | P0     | ✅ 否  | patch，安全升級 |
| `eslint-plugin-react-refresh` | 0.4.23   | **0.4.24** | dev  | P0     | ✅ 否  | patch，安全升級 |

**Context7 參考**：

- [Vite 7 Release Notes](https://vitejs.dev/) [ref: #3]
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) [官方]

### 1.2 Minor 版本升級 (P1 - 低風險)

| 套件                       | 目前版本 | 最新版本   | 類別 | 優先級 | 破壞性 | 備註            |
| -------------------------- | -------- | ---------- | ---- | ------ | ------ | --------------- |
| `@eslint/js`               | 9.37.0   | **9.38.0** | dev  | P1     | ✅ 否  | minor，安全升級 |
| `@vitejs/plugin-react-swc` | 4.1.0    | **4.2.0**  | dev  | P1     | ✅ 否  | minor，安全升級 |
| `eslint`                   | 9.37.0   | **9.38.0** | dev  | P1     | ✅ 否  | minor，安全升級 |

### 1.3 Major 版本升級 (P1/P2 - 需驗證)

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
