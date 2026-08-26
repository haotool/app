# CI E2E 速度優化（039）

## 文件控制

| 欄位     | 內容                                                      |
| -------- | --------------------------------------------------------- |
| 建立日期 | 2026-06-26                                                |
| 最後更新 | 2026-08-27（PR 受影響 app smoke／主幹 nightly full 分流） |
| 狀態     | Active                                                    |
| SSOT     | `.github/workflows/ci.yml`                                |

## 背景

PR CI 的 E2E job 若每次執行完整套件，會把互動迭代拉長到 15 分鐘以上。`pre-push` hook 刻意不跑 E2E（見 `AGENTS.md` AGT-PP-01），因此 CI 必須把快速回饋與主幹完整覆蓋拆成兩層，而不是犧牲任一層。

2026-07-29（#918）補記：上述取捨原本只覆蓋 ratewise。實查發現 `starpuff`／`park-keeper`／`papertrade`／`split-meow` 四個 app 共 35 個 spec **從未在 CI 執行過**——既不在 PR smoke、也不在 main push 的 full 套件中，全 `.github/workflows/` 搜尋這四個 app 名稱為零匹配。同時 `apps/starpuff` 缺 `test:coverage`，其 1300+ 單元測試被 `pnpm -r` 靜默跳過。本文件的策略自此涵蓋全部 app。

## 現行策略摘要（2026-08-27）

| 情境                                 | Job                                          | 測試範圍                                                                                 | 設計目的                            |
| ------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------- |
| PR（無 E2E 相關變更）                | E2E jobs skipped                             | —                                                                                        | 不浪費瀏覽器資源                    |
| PR（StarPuff 受影響）                | `E2E starpuff`                               | `pr-smoke.spec.ts` × Desktop + Mobile landscape                                          | 穩定 required check、快速驗真實操作 |
| PR（其他 app 受影響）                | `E2E smoke (<app>)`                          | 各 app 的核心 smoke spec／可用 Chromium project                                          | 只驗受影響 app                      |
| main push／nightly／release dispatch | `E2E Full (1/2)` + `E2E starpuff full (1/2)` | RateWise + StarPuff 各 2-way shard；StarPuff 保留 Desktop、landscape、portrait、完整教學 | 完整回歸與發版證據                  |
| main push／nightly／release dispatch | `E2E <app>`                                  | park-keeper／papertrade／split-meow 完整 matrix                                          | 主幹不留下 app 覆蓋缺口             |

`release` 的 full E2E 由 release workflow 合併後補派的 `ci.yml` main dispatch（或 main push）
執行；release PR 本身仍只走受影響檔案的 PR smoke／Quality Checks，避免把版本機器人的等待路徑
與主幹完整回歸混在一起。

## 各 app E2E 涵蓋策略（#918）

| App            | 單元測試閘門                  | E2E specs | E2E job                                                    | 瀏覽器                              |
| -------------- | ----------------------------- | --------- | ---------------------------------------------------------- | ----------------------------------- |
| `ratewise`     | `test:coverage` ✅            | 多數      | smoke + full                                               | chromium                            |
| `starpuff`     | `test:coverage` ✅（#918 補） | 19        | PR `E2E starpuff` smoke；主幹 `E2E starpuff full` 2 shards | chromium（含 landscape／portrait）  |
| `park-keeper`  | `test:coverage` ✅            | 10        | PR core smoke；主幹完整 matrix                             | chromium                            |
| `papertrade`   | `test:coverage` ✅            | 5         | PR core smoke；主幹完整 matrix                             | PR chromium；主幹 chromium + webkit |
| `split-meow`   | `test:coverage` ✅            | 3         | PR core smoke；主幹完整 matrix                             | PR chromium；主幹 chromium + webkit |
| `nihonname`    | `test:coverage` ✅            | 0         | —（無 spec）                                               | —                                   |
| `quake-school` | `test:coverage` ✅            | 0         | —（無 spec）                                               | —                                   |
| `haotool`      | `test:coverage` ✅            | 0         | —（無 spec）                                               | —                                   |
| `shared`       | **豁免**                      | 0         | —                                                          | —                                   |

**`shared` 豁免理由**：`apps/shared` 為純共用邏輯/元件庫，無自有測試檔，補 `test:coverage` 只會產生空報告。其行為由各消費端 app 的測試覆蓋；`e2e-filter` 已把 `apps/shared/**` 列入 ratewise、park-keeper、papertrade、split-meow 四者的觸發路徑，改動 shared 會連帶觸發下游 e2e。

**`nihonname` 說明**：長期列在 `e2e-filter` 的觸發路徑中，但 `apps/nihonname/e2e/` 無任何 spec——實際只是讓 ratewise 的 e2e 在 nihonname 變更時一併重跑，不代表 nihonname 自身有 e2e 閘門。

### CI 隔離清單（quarantine）

閘門接上後，以下案在 CI runner 上**穩定失敗**（retry ×2 亦然）而本機穩定通過，經判定為環境時序臨界而非產品回歸，暫以 `test.fixme(!!process.env['CI'], …)` 隔離：

| Spec                          | 案                                         | 根因                                                                                                      | 追蹤 |
| ----------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ---- |
| `starpuff/e2e/hotfix.spec.ts` | flick 下滑抬指再點跳（drop-intent 緩衝窗） | 驗的是**真實時鐘窗口**；CDP 事件派發與 evaluate 往返在 CI 上各需數十至數百 ms，窗口在測試動作抵達前即過期 | #915 |
| 同上                          | 斜下 45 度滑動蹲住不被帶出平台             | 同上                                                                                                      | #915 |
| 同上                          | 反向側貼身暈眩殼殼可吞下（#844）           | 同上（暈眩窗）                                                                                            | #915 |

**紀律**：

- 隔離**不等於**問題消失。本機仍照跑，守門責任明確移交 #915（方向是減少窗內往返或讓窗口可控，**不是**放寬產品行為）。
- 新增隔離必須同時：標記處寫明根因、更新本表、連結追蹤 issue。三者缺一不可——否則隔離會演變成靜默關閉閘門。
- 隔離前必須以 A/B 對照（有／無本次改動）確認非新引入，證據留在追蹤 issue。

## 實作要點

1. **Path filter**（`dorny/paths-filter@v4`）：RateWise／NihonName 的既有 PR smoke 由各自 app、`apps/shared/**`、root `package.json`、lockfile 與 Playwright setup action 觸發；StarPuff 由自身路徑或 lockfile 觸發，park-keeper／papertrade／split-meow 另加 `apps/shared/**`。CI workflow 本身不把所有 app 標成受影響，docs-only PR 不建立 smoke matrix。
2. **Playwright 分層快取**（`.github/actions/setup-playwright`）：cache key 含 Playwright 版本 + OS + **瀏覽器組合 slug**；cache miss 跑 `install <browsers>`；cache hit 僅 `install-deps <browsers>`。slug 納入 key 是必要的——同版本不同組合共用 key 會讓需要 webkit 的 job 命中只有 chromium 的 cache，於執行期才炸。
3. **PR smoke**：StarPuff 使用獨立 `e2e/pr-smoke.spec.ts`，同一個 `E2E starpuff` check 同時跑 Desktop 與 Mobile landscape；不執行 portrait 或完整 app suite。
4. **主幹完整套件 + sharding**：RateWise 與 StarPuff 各使用 `--shard=1/2`、`--shard=2/2`，blob reporter + `merge-reports` 合併 HTML；StarPuff 的 config 不排除 portrait、方向提示或 `guided-tutorial.spec.ts`。
5. **Concurrency**：workflow-level `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`；PR 只保留最新 head，main/nightly/release dispatch 保留完整執行訊號。
6. **Per-app filter／job**：PR 的 `e2e-starpuff-smoke` 固定名稱且只在 StarPuff 受影響時跑；其他受影響 app 進 `e2e-app-smoke` 核心 spec。CI workflow 本身不視為所有 app 都受影響，避免一次流程調整觸發無關 smoke；main/nightly/release dispatch 由 `e2e-starpuff-full` 及 `e2e-apps` 跑完整 matrix。
7. **瀏覽器最小安裝**：StarPuff smoke/full 均只安裝 Chromium；其他 app 的 PR smoke 也只安裝實際使用的 Chromium，只有主幹需要 WebKit 的 full matrix 才加裝 WebKit。pnpm cache 維持由 `setup-node` 與共用 Playwright action 管理。

## 外部依據

- [Playwright CI 官方文件](https://playwright.dev/docs/ci)
- [Playwright Sharding](https://playwright.dev/docs/test-sharding)
- [Playwright 最佳實踐：只安裝需要的瀏覽器與 sharding](https://playwright.dev/docs/best-practices)
- [Playwright 瀏覽器快取建議](https://playwright.dev/docs/ci#caching-browsers)
- [GitHub Actions concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
- [GitHub Actions dependency caching](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)
- [dorny/paths-filter](https://github.com/dorny/paths-filter)

## 驗收

- docs-only PR 不觸發 E2E job。
- StarPuff 功能 PR 觸發固定 `E2E starpuff`，同時覆蓋 Desktop + Mobile landscape，且不被 full app job 取代。
- PR workflow 的 `cancel-in-progress` 為 true；main、nightly、release dispatch 為 false。
- main／nightly／release dispatch 執行 RateWise 與 StarPuff 2-way sharded full suite，StarPuff 保留 portrait、方向提示與完整教學，merge job 產出合併 HTML report。
- park-keeper／papertrade／split-meow 受影響 PR 只跑各自核心 smoke，主幹再跑完整 matrix。
- StarPuff smoke/full 不下載 WebKit；pnpm 與 browser cache key 仍按瀏覽器組合隔離。
- `pnpm test:coverage` 的 workspace scope 為 **10 of 10**（`shared` 無測試檔屬明文豁免，見上表）。
- 反證：在 starpuff 植入必失敗的單元測試後，CI `Quality Checks` 確實轉紅（證明閘門真的接上，而非設定看起來對）。
