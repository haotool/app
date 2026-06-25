# CI E2E 速度優化（039）

## 文件控制

| 欄位     | 內容                       |
| -------- | -------------------------- |
| 建立日期 | 2026-06-26                 |
| 狀態     | Active                     |
| SSOT     | `.github/workflows/ci.yml` |

## 背景

PR CI 的 E2E job 原先每次執行完整 96 測試（desktop + mobile），含 Playwright 冷快取安裝時常超過 15 分鐘。`pre-push` hook 刻意不跑 E2E（見 `AGENTS.md` AGT-PP-01），因此 CI 是唯一自動化 E2E 閘門，必須在速度與覆蓋率間取得平衡。

## 策略摘要

| 情境                          | Job                        | 測試範圍                                   | 預估時間                     |
| ----------------------------- | -------------------------- | ------------------------------------------ | ---------------------------- |
| PR（無 E2E 相關變更）         | 跳過                       | —                                          | 0 min                        |
| PR（有 E2E 相關變更）         | `E2E Smoke (PR)`           | 3 核心 spec × desktop（~38 tests）         | 5–8 min                      |
| main push / workflow_dispatch | `E2E Full (1/2)` + `(2/2)` | desktop + mobile，2-way shard（~96 tests） | 6–10 min（wall clock，並行） |

## 實作要點

1. **Path filter**（`dorny/paths-filter@v3`）：僅在 `apps/ratewise/**`、`apps/nihonname/**`、`apps/shared/**`、`pnpm-lock.yaml`、`package.json`、CI workflow 變更時於 PR 觸發 E2E。
2. **Playwright 分層快取**（`.github/actions/setup-playwright`）：cache key 含 Playwright 版本 + OS；cache miss 跑 `install --with-deps chromium`；cache hit 僅 `install-deps chromium`。
3. **PR smoke**：`ratewise.spec.ts`、`calculator-fix-verification.spec.ts`、`mobile-parity.spec.ts`，僅 `chromium-desktop`。
4. **main 完整套件 + sharding**：`--shard=1/2` 與 `--shard=2/2`，blob reporter + `merge-reports` 合併 HTML。
5. **Concurrency**：`cancel-in-progress: false`，避免同一 PR 反覆 push 造成 cancel loop。

## 外部依據

- [Playwright CI 官方文件](https://playwright.dev/docs/ci)
- [Playwright Sharding](https://playwright.dev/docs/test-sharding)
- [Playwright 瀏覽器快取建議](https://playwright.dev/docs/ci#caching-browsers)
- [dorny/paths-filter](https://github.com/dorny/paths-filter)

## 驗收

- docs-only PR 不觸發 E2E job。
- ratewise 功能 PR 觸發 smoke，時間 < 15 min。
- main push 執行 sharded full suite，merge job 產出合併 HTML report。
