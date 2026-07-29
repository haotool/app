# CI E2E 速度優化（039）

## 文件控制

| 欄位     | 內容                                          |
| -------- | --------------------------------------------- |
| 建立日期 | 2026-06-26                                    |
| 最後更新 | 2026-07-29（#918 補齊非 ratewise app 的閘門） |
| 狀態     | Active                                        |
| SSOT     | `.github/workflows/ci.yml`                    |

## 背景

PR CI 的 E2E job 原先每次執行完整 96 測試（desktop + mobile），含 Playwright 冷快取安裝時常超過 15 分鐘。`pre-push` hook 刻意不跑 E2E（見 `AGENTS.md` AGT-PP-01），因此 CI 是唯一自動化 E2E 閘門，必須在速度與覆蓋率間取得平衡。

2026-07-29（#918）補記：上述取捨原本只覆蓋 ratewise。實查發現 `starpuff`／`park-keeper`／`papertrade`／`split-meow` 四個 app 共 35 個 spec **從未在 CI 執行過**——既不在 PR smoke、也不在 main push 的 full 套件中，全 `.github/workflows/` 搜尋這四個 app 名稱為零匹配。同時 `apps/starpuff` 缺 `test:coverage`，其 1300+ 單元測試被 `pnpm -r` 靜默跳過。本文件的策略自此涵蓋全部 app。

## 策略摘要

| 情境                          | Job                        | 測試範圍                                   | 預估時間                     |
| ----------------------------- | -------------------------- | ------------------------------------------ | ---------------------------- |
| PR（無 E2E 相關變更）         | 跳過                       | —                                          | 0 min                        |
| PR（有 E2E 相關變更）         | `E2E Smoke (PR)`           | 3 核心 spec × desktop（~38 tests）         | 5–8 min                      |
| main push / workflow_dispatch | `E2E Full (1/2)` + `(2/2)` | desktop + mobile，2-way shard（~96 tests） | 6–10 min（wall clock，並行） |
| PR（單一 app 變更）           | `E2E <app>`                | 該 app 全套（自帶 webServer）              | 3–15 min                     |
| main push / workflow_dispatch | `E2E <app>` × 4            | 四個 app 全跑，matrix 並行                 | 同上（wall clock，並行）     |

## 各 app E2E 涵蓋策略（#918）

| App            | 單元測試閘門                  | E2E specs | E2E job           | 瀏覽器            |
| -------------- | ----------------------------- | --------- | ----------------- | ----------------- |
| `ratewise`     | `test:coverage` ✅            | 多數      | smoke + full      | chromium          |
| `starpuff`     | `test:coverage` ✅（#918 補） | 17        | `E2E starpuff`    | chromium          |
| `park-keeper`  | `test:coverage` ✅            | 10        | `E2E park-keeper` | chromium          |
| `papertrade`   | `test:coverage` ✅            | 5         | `E2E papertrade`  | chromium + webkit |
| `split-meow`   | `test:coverage` ✅            | 3         | `E2E split-meow`  | chromium + webkit |
| `nihonname`    | `test:coverage` ✅            | 0         | —（無 spec）      | —                 |
| `quake-school` | `test:coverage` ✅            | 0         | —（無 spec）      | —                 |
| `haotool`      | `test:coverage` ✅            | 0         | —（無 spec）      | —                 |
| `shared`       | **豁免**                      | 0         | —                 | —                 |

**`shared` 豁免理由**：`apps/shared` 為純共用邏輯/元件庫，無自有測試檔，補 `test:coverage` 只會產生空報告。其行為由各消費端 app 的測試覆蓋；`e2e-filter` 已把 `apps/shared/**` 列入 ratewise、park-keeper、papertrade、split-meow 四者的觸發路徑，改動 shared 會連帶觸發下游 e2e。

**`nihonname` 說明**：長期列在 `e2e-filter` 的觸發路徑中，但 `apps/nihonname/e2e/` 無任何 spec——實際只是讓 ratewise 的 e2e 在 nihonname 變更時一併重跑，不代表 nihonname 自身有 e2e 閘門。

## 實作要點

1. **Path filter**（`dorny/paths-filter@v4`）：僅在 `apps/ratewise/**`、`apps/nihonname/**`、`apps/shared/**`、`pnpm-lock.yaml`、`package.json`、CI workflow 變更時於 PR 觸發 ratewise E2E。
2. **Playwright 分層快取**（`.github/actions/setup-playwright`）：cache key 含 Playwright 版本 + OS + **瀏覽器組合 slug**；cache miss 跑 `install <browsers>`；cache hit 僅 `install-deps <browsers>`。slug 納入 key 是必要的——同版本不同組合共用 key 會讓需要 webkit 的 job 命中只有 chromium 的 cache，於執行期才炸。
3. **PR smoke**：`ratewise.spec.ts`、`calculator-fix-verification.spec.ts`、`mobile-parity.spec.ts`，僅 `chromium-desktop`。
4. **main 完整套件 + sharding**：`--shard=1/2` 與 `--shard=2/2`，blob reporter + `merge-reports` 合併 HTML。
5. **Concurrency**：`cancel-in-progress: false`，避免同一 PR 反覆 push 造成 cancel loop。
6. **Per-app E2E matrix**（`e2e-apps`，#918）：`e2e-filter` 第二個 paths-filter step 以「filter 名稱＝pnpm package 後綴」輸出 `changes` JSON，直接餵給 `matrix.app`。PR 只跑變更到的 app；main push／`workflow_dispatch` 一律全跑（硬編四個 app），確保不留「PR 與 main 兩者皆無」的缺口。各 app 的 `playwright.config` 自帶 webServer，job 不需自行起 server。

## 外部依據

- [Playwright CI 官方文件](https://playwright.dev/docs/ci)
- [Playwright Sharding](https://playwright.dev/docs/test-sharding)
- [Playwright 瀏覽器快取建議](https://playwright.dev/docs/ci#caching-browsers)
- [dorny/paths-filter](https://github.com/dorny/paths-filter)

## 驗收

- docs-only PR 不觸發 E2E job。
- ratewise 功能 PR 觸發 smoke，時間 < 15 min。
- main push 執行 sharded full suite，merge job 產出合併 HTML report。
- starpuff 變更的 PR 觸發 `E2E starpuff`；park-keeper／papertrade／split-meow 同理（#918）。
- `pnpm test:coverage` 的 workspace scope 為 **10 of 10**（`shared` 無測試檔屬明文豁免，見上表）。
- 反證：在 starpuff 植入必失敗的單元測試後，CI `Quality Checks` 確實轉紅（證明閘門真的接上，而非設定看起來對）。
