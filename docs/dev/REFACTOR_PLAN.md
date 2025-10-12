# 完美重構路線圖與回滾方案

> **Linus 原則**：保持簡單、隨時可回滾、一次只解一個真問題。

**依據**： [TECH_DEBT_AUDIT.md](./TECH_DEBT_AUDIT.md)  
**目標**：把健康分數從 86 → 92，補上資料真實性、觀測性與自動化缺口。  
**時程**：3 週（每週 2~3 個重點 PR）

---

## Phase 0：資料真實性與觀測性（Week 1）

**目標**：確保顯示資料可信，並能追蹤錯誤。

### PR 0.1 – 重新設計趨勢資料來源（1.5d）

- 抽離 `seedTrends()`，改成可注入的 PRNG，並預留 HTTP/Worker 更新管道。
- 新增 `VITE_ENABLE_TREND_SIMULATION` flag（已在 `.env.example` 內）控制是否使用假資料。
- 覆蓋測試：mock PRNG，驗證趨勢穩定。

```bash
# 驗收
pnpm --filter @app/ratewise test
pnpm --filter @app/ratewise test:coverage
```

**回滾**：`git revert <commit>` 即可，因為新程式碼僅在 hook 內。

### PR 0.2 – 遠端日誌與 Request ID（1d）

- 在 `apps/ratewise/src/main.tsx` 產生 `requestId`，傳入 logger context。
- 實作 `navigator.sendBeacon` fallback 將 error 級別傳到 `/analytics/logs`。
- 新增 `apps/shared/telemetry/logTransport.ts` 抽象化 HTTP 寫入，利於日後改成 Workers。

驗收腳本：

```bash
pnpm --filter @app/ratewise test logger.test.ts --runInBand
pnpm dev # 手動觸發 error，觀察 network beacon
```

回滾：`git revert` 或刪除 `logTransport.ts` 並還原 logger。

---

## Phase 1：端到端自動化與部署證明（Week 2）

**目標**：把目前手動程序自動化，交付可驗證的構建。

### PR 1.1 – Puppeteer Smoke 測試與 Docker Compose（2d）

- 新增 `tests/e2e/ratewise.smoke.spec.ts`，情境：單幣別、切換多幣別、加入最愛、健康檢查。
- 建立 `docker-compose.smoke.yml`（preview + e2e runner）。
- `package.json` 加入 `test:e2e` 指令。

驗收：

```bash
pnpm build:ratewise
docker compose -f docker-compose.smoke.yml up --abort-on-container-exit
```

回滾：刪除新增的測試與 compose 檔案。

### PR 1.2 – CI 整合與 Artifact（1d）

- `ci.yml` 增加 coverage gate、upload dist artifact、於 `main` 分支觸發 E2E smoke。
- 加入 `CODECOV_TOKEN` secret；若失敗則標紅。

回滾：`git revert` 新增的 workflow 變更。

---

## Phase 2：效能與構建最佳化（Week 3 上半）

**目標**：減少初始載入與 bundle 大小。

### PR 2.1 – Vite 手動分 chunk + Bundle Budget（1d）

- `vite.config.ts` 設定 `manualChunks`、`build.target = 'es2022'`、`build.sourcemap = true`。
- 新增 `pnpm build:analyze`（使用 `rollup-plugin-visualizer`）並產出報告。
- 設定 bundle budget（例如 main chunk ≤ 180KB Gzip）。

驗收：

```bash
pnpm --filter @app/ratewise build
pnpm --filter @app/ratewise build:analyze
```

回滾：保留現有 config 備份，`git revert` 即可。

### PR 2.2 – Tailwind 基礎優化（0.5d）

- 升級 `tailwind.config.ts`，補 `future.hoverOnlyWhenSupported`、字型 fallback。
- 加入 `@tailwindcss/container-queries`（若需求）並調整檔案大小。

---

## Phase 3：Major 依賴升級（Week 3 下半）

**目標**：處理積欠的 major 版本，確保未來兩季內穩定。

### PR 3.1 – Vite 7 + SWC 4（1.5d）

- 依 `docs/dev/DEPENDENCY_UPGRADE_PLAN.md` 安排，先 `pnpm up vite@latest @vitejs/plugin-react-swc@latest --filter @app/ratewise`。
- 修正 `tsconfig` 與 `vitest` 相容性（Vite 7 從 Rollup 4 → 5）。
- 驗收：`pnpm lint && pnpm typecheck && pnpm --filter @app/ratewise test:coverage && pnpm build`.

### PR 3.2 – Tailwind 4 → 4.x（1d）

- 依官方遷移指南 [ref: #6]，啟用新 token 系統。
- 重跑 UI regression（可使用 Percy/Chromatic，或手動截圖）。

如遇重大破壞：使用 `git revert` 回退到上一個 minor 版本，並在 `DEPENDENCY_UPGRADE_PLAN.md` 記錄阻擋原因。

---

## 後續排程（Backlog）

- 導入真實匯率 API（ex: ExchangeRate-API 或自建 Cloudflare Worker 快取）。
- 新增 Secrets 掃描與 Renovate bot。
- 設定 Cloudflare 變更治理流程（IaC 或 `wrangler` scripts）。
- 補齊觀測性儀表板（Grafana/Cloudflare Analytics）。

---

## 驗收總表

| 階段    | 主要指標               | 驗收腳本                                                 |
| ------- | ---------------------- | -------------------------------------------------------- |
| Phase 0 | 觀測性可控｜趨勢可重現 | `pnpm --filter @app/ratewise test:coverage`              |
| Phase 1 | E2E 自動化             | `pnpm build:ratewise && pnpm test:e2e`                   |
| Phase 2 | 首屏 bundle ≤ 180KB gz | `pnpm --filter @app/ratewise build:analyze`              |
| Phase 3 | 主要依賴升級通過       | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` |

**回滾原則**：所有 PR 必須保留 `git revert` 即可還原的狀態。更動 Cloudflare 或外部服務時，另附 Terraform/Wrangler Script 以便快速回復。
