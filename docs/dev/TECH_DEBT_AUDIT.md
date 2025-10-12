# 技術債總報告與檔案級建議

> **Linus 評語**：程式碼現在乾淨俐落，測試也夠硬；最大問題是資料與營運流程還在「玩具」階段。沒有真實匯率來源、沒有端對端驗證，再漂亮的 UI 也只是樣板。把最後幾個洞補上，這個專案就能穩定上線。

**審查日期**：2025-10-12  
**審查人**：Linus-Style Technical Debt Scanner  
**專案**：RateWise Currency Converter (Monorepo)

---

## 📊 執行摘要與分數卡

### 整體健康分數：86/100（🟢 穩定可交付）

| 維度           | 分數 | 等級  | 評語                                                              |
| -------------- | ---- | ----- | ----------------------------------------------------------------- |
| **可維護性**   | 88   | 🟢 好 | 元件已拆分、hooks 結構清晰，TypeScript 嚴格模式上線               |
| **測試品質**   | 92   | 🟢 好 | Vitest 覆蓋率：Lines 95.4%、Functions 92.5%，仍缺 E2E 自動化      |
| **資安成熟度** | 72   | 🟡 普 | 採最小安全標頭並交由 Cloudflare 管理，缺乏 Secrets 稽核流程       |
| **效能**       | 74   | 🟡 普 | Vite 使用預設打包；尚未拆 Vendor Chunk 或設定 Budget              |
| **觀測性**     | 68   | 🟡 普 | 具備 ErrorBoundary + logger，但尚未串接遠端追蹤或 request id      |
| **工程流程化** | 86   | 🟢 好 | CI (lint/typecheck/test/build) 已跑，Husky + lint-staged 正常運作 |

### Linus 三問

1. **這是實際問題還是臆測？**
   - 靜態匯率資料與隨機趨勢屬於實際問題，上線後會立即產生錯誤資訊。
   - 未自動化的 E2E 驗證是實際缺口，現在只能靠人工。

2. **有更簡單的方法嗎？**
   - 把匯率更新抽成服務，提供單一資料來源，就能移除多數 if/else。
   - 用 feature flag 控制趨勢模擬，避免在主要流程裡塞 `Math.random()`。

3. **會破壞什麼嗎？**
   - 目前尚未對外公開 API，重構與資料改動不會破壞 userspace。
   - 只要保留現有顯示格式與 localStorage key，就能做到零破壞。

---

## 🎯 風險矩陣 Top 10

| #   | 風險項目                                     | Impact    | Likelihood  | 總分 | 優先級 |
| --- | -------------------------------------------- | --------- | ----------- | ---- | ------ |
| 1   | 靜態匯率資料（無即時來源）                   | 🔴 High   | 🔴 Certain  | 25   | P0     |
| 2   | 無自動化 E2E（僅留 README 指南）             | 🔴 High   | 🟡 Likely   | 20   | P0     |
| 3   | logger 僅存記憶體，缺乏遠端追蹤              | 🟠 Medium | 🟡 Likely   | 15   | P1     |
| 4   | 趨勢模擬使用 `Math.random()` 每次重算        | 🟠 Medium | 🟡 Likely   | 15   | P1     |
| 5   | 依賴多為 major 差距（Tailwind 4、Vite 7）    | 🟠 Medium | 🟡 Likely   | 15   | P1     |
| 6   | Bundler 未拆 Vendor Chunk / 無 bundle budget | 🟠 Medium | 🟢 Possible | 9    | P2     |
| 7   | 無 Secrets 稽核與 `.env` 掃描                | 🟡 Low    | 🟡 Likely   | 6    | P2     |
| 8   | localStorage 無 schema version               | 🟡 Low    | 🟡 Likely   | 6    | P3     |
| 9   | Docker 映像未曝光 build artifact             | 🟡 Low    | 🟢 Possible | 3    | P3     |
| 10  | 無 Cloudflare 設定變更追蹤流程               | 🟡 Low    | 🟢 Possible | 3    | P3     |

---

## 🔍 類別發現與建議

### A. 前端品質（React + Vite + Tailwind）

- `apps/ratewise/src/features/ratewise/RateWise.tsx` 現在保持在 130 行內，Provider + 子元件拆分符合 React 19 建議的「state 靠近使用者」原則 [ref: #1][ref: #2]。
- `useCurrencyConverter` 的 `seedTrends()` 每次 render 都隨機生成，會在 dev 模式造成 UI 閃動與測試不穩（apps/ratewise/src/features/ratewise/hooks/useCurrencyConverter.ts:40）。建議改為 deterministic PRNG 或由背景排程更新。
- `vite.config.ts` 仍採預設 build；依 Vite 官方建議加入手動分 chunk 與 `build.target = 'es2022'` 可以降低初始包 [ref: #3]。

### B. 觀測性與營運

- `ErrorBoundary` + `logger` 已補齊最小防護，但 `logger` 目前只把資料留在記憶體（apps/ratewise/src/utils/logger.ts:62），遇到致命錯誤無法追蹤。建議：
  1. 從 `.env` 控制 log level（已在 `.env.example` 預留 `VITE_LOG_LEVEL`）。
  2. 在 `sendToExternalService` 內串接 Cloudflare Workers 或 Sentry，至少把 error 級別上傳 [ref: #11]。
- 缺少 `X-Request-ID`；可在 `apps/ratewise/src/main.tsx` 初始化時建立 UUID 並注入到 logger context，以便後端串查。

### C. 測試與品質門檻

- 單元測試覆蓋率 95% 已達 P0 目標，但缺 Puppeteer 腳本與 CI 步驟。建議建立 `tests/e2e/ratewise.smoke.spec.ts` 並在 workflow 內啟動 `pnpm preview` 後跑 smoke 測試 [ref: #7][ref: #15]。
- 建議加入 coverage gate（例如要求 Lines ≥ 90%）並把報告上傳 Codecov 以利 PR 審查。

### D. DevOps / 部署

- `Dockerfile` 是正確的雙階段（node:24-alpine → nginx:alpine），並新增 non-root user 與健康檢查 [ref: #8]。
- 建議補一個 `docker-compose.yml` 方便本地 smoke 測試，並在 CI 中保存 `dist/` 作為 artifact，以對照 docker 內容。

### E. 資安與合規

- `nginx.conf` 僅保留 `X-Content-Type-Options` 與 `X-Frame-Options`，其餘交由 Cloudflare 設定，符合 OWASP 與 Cloudflare 官方建議 [ref: #10][ref: #11]。
- 仍需補上 Secrets 掃描流程（git-secrets 或 TruffleHog）及例行的 `pnpm audit` 報表。

### F. 資料與狀態管理

- localStorage 使用固定 key（`currencyConverterMode` 等），但沒有 schema version。建議在寫入時加入 `version` 欄位，未來升級時可以向後相容。
- 匯率資料目前硬編碼於 `constants.ts`，之後若導入 API，建議建立 `apps/shared` 模組負責資料獲取與快取，以免 UI 層重複計算。

---

## 📂 檔案級審查清單（含修正建議）

| 檔案                                                                   | 問題                                                    | 建議修正 (片段)                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/ratewise/src/features/ratewise/hooks/useCurrencyConverter.ts:36` | 趨勢資料以 `Math.random()` 產生，導致每次 render 都改變 | `ts\nconst seedTrends = (seed = Date.now()) => {\n  const rng = createPRNG(seed);\n  return CURRENCY_CODES.reduce<TrendState>((acc, code) => {\n    acc[code] = rng() > 0.5 ? 'up' : 'down';\n    return acc;\n  }, {} as TrendState);\n};\n` |
| `apps/ratewise/src/utils/logger.ts:68`                                 | 遠端日誌未實作                                          | `ts\nif (!this.isDevelopment && entry.level === 'error') {\n  queueMicrotask(() => navigator.sendBeacon('/analytics/logs', JSON.stringify(entry)));\n}\n`                                                                                     |
| `apps/ratewise/vite.config.ts:18`                                      | Bundler 未拆 vendor chunk                               | `ts\nbuild: {\n  target: 'es2022',\n  sourcemap: true,\n  rollupOptions: {\n    output: {\n      manualChunks: {\n        'react-vendor': ['react', 'react-dom'],\n        ui: ['lucide-react'],\n      },\n    },\n  },\n},\n`               |
| `apps/ratewise/src/main.tsx:8`                                         | 無 request id                                           | `ts\nconst requestId = crypto.randomUUID();\nlogger.info('Application starting', { requestId });\n`                                                                                                                                           |

---

## 依賴升級與驗證計畫（pnpm）

- `pnpm -r outdated` 顯示 15 個套件落後，其中 Tailwind 4、Vite 7、eslint 9 與 @typescript-eslint 8 為 major 升級，需獨立分支驗證。
- 建議流程：
  1. `pnpm -w up --interactive` 先處理 patch/minor。
  2. Major 版本（Tailwind 4、Vite 7）依 `docs/dev/DEPENDENCY_UPGRADE_PLAN.md` 的回滾腳本進行，[ref: #5][ref: #6][ref: #3]。
  3. 升級後執行 `pnpm lint && pnpm typecheck && pnpm --filter @app/ratewise test:coverage && pnpm build`，並更新 Codecov。

---

## 引用來源

完整引用清單及摘要請參考 `docs/dev/CITATIONS.md`。
