# 036 SEO 迭代執行協議（RateWise）

## 目的

建立「可回滾、可對照、可量化」的 SEO 迭代流程，滿足：

- 20 輪以上可重複驗證（`pnpm seo:iterate`）
- 每輪都有腳本輸出紀錄
- Codex comment 監控與 checks 狀態可追蹤
- 未達改善時可據結果回滾

## 目前執行入口

- `pnpm seo:iterate:dry`：先列出 20 輪預設步驟
- `pnpm seo:iterate --iterations 20`：執行 20 輪迭代
- `pnpm seo:collect-metrics`：產生 `.cache/seo-iteration-metrics/` KPI 快照（Lighthouse SEO 分數、Sitemap 健康度、200 命中率）
- `pnpm seo:iterate --pr <PR_NUMBER>`：加入 PR 監控步驟
- `pnpm seo:iterate:ab --iterations 10`：套用 `scripts/seo-iteration-ab.example.json` 的 A/B 範例
- `pnpm review:codex:once`：快照式列出近來的 Codex 留言
- `pnpm review:codex:watch -- --pr <PR_NUMBER> --interval 30`：持續監控 unresolved / resolved / checks 變化

## 目前預設 20 步清單（第一版）

1. `pnpm -r build`
2. `pnpm lint`
3. `pnpm format`
4. `pnpm typecheck`
5. `pnpm test:unit`
6. `pnpm test:integration`
7. `pnpm seo:health-check`
8. `pnpm verify:sitemap`
9. `pnpm verify:sitemap-2026`
10. `pnpm verify:breadcrumb`
11. `pnpm verify:structured-data`
12. `pnpm verify:production-resources`
13. `pnpm verify:production-seo ratewise --base-url=https://app.haotool.org/ratewise`
14. `pnpm verify:precache`
15. `pnpm seo:audit`
16. `pnpm verify:seo-docs`
17. `pnpm lighthouse:ci`
18. `pnpm test`（可選，需確認時間窗）
19. `pnpm review:codex:once`
20. `python3 scripts/analyze-lighthouse-scores.py --list`

## KPI 門檻（可控）

- `--require-improvement`：在每輪完成後比較 KPI，未達門檻將判定失敗並停止（可配合回退）。
- `--min-seo-delta <number>`：Lighthouse SEO 分數門檻（預設 0，可自訂）。
- `--min-pass-rate-delta <number>`：生產資源 200 命中率門檻（預設 0，可自訂）。
- `--metrics-dir`：指定 KPI 輸出目錄（預設 `.cache/seo-iteration-metrics`）。

## A/B 建議執行模式

1. `pnpm seo:iterate --ab-config scripts/seo-iteration-ab.example.json --iterations 20 --require-improvement`
2. 每輪都呼叫 `collect seo metrics`，比較前一輪 KPI：
   - 主要看：`health.seoScore`、`productionResources.passRate`、Sitemap `missingExpectedCount`
3. 若某輪未提升且低於門檻，不再硬推 commit，先回退到上個已證明基線並修正。

> 第 19 步會依環境提供 PR 編號；若未指定可移除或改走 `--pr` 參數。

## A/B 策略（最小責任）

- 每個 AB step 定義 control / variant command。
- 預設僅做「成功率與時間」比較；若要做效益比較，需補上外部 score 解析步驟（例如 Lighthouse JSON diff），再把結果接到分析腳本。

## 最近實際執行紀錄

- 2026-05-02：以 `--ab-config scripts/seo-iteration-ab.example.json --iterations 20` 完成 20 輪測試（搭配 `--require-improvement --min-seo-delta 1 --min-pass-rate-delta 1 --auto-rollback --rollback-command "echo ..."`，並啟用 `--continue-on-failure`）。
- KPI 狀態：每輪 `seoScore=100`、`passRate=100`，故從第 2 輪起皆判定未達「明確改善」門檻，觸發回退 hook（本次僅 noop）。
- 結論：基線已為 100/100，未見可持續提升空間，下一步須先引入實質 SEO 變更/實驗項目再啟動新一輪 `require-improvement` 門檻。
- 2026-05-02（續）：補做 `pnpm seo:collect-metrics --app ratewise --output .cache/seo-metrics-final-2.json`。
- KPI 狀態：`SEO=100, 200=100%`、`performance=100`、`accessibility=100`、`best-practices=96`。
- 結論：在既有規則下，SEO 健康度不變（無法由 AB 假設量測到改善），繼續以新優化假設前提下迭代。

## SEO 相關 Skills 補齊（本輪）

- 已透過 `npx skills find seo` 查到可用 SEO 方向技能，並全數補裝：
  - `~/.agents/skills/search-engine-optimization-seo`
  - `~/.agents/skills/seo-strategy`
  - `~/.agents/skills/content-strategy`
  - `~/.agents/skills/copywriting`
  - `~/.agents/skills/backlink-analyzer`
- 既有技能（repo 內建）已在規劃中啟用並覆蓋：`seo`, `seo-audit`, `programmatic-seo`, `seo-geo`, `ai-seo`, `search-engine-optimization-seo`。
- `pnpm review:codex:once` 顯示 `unresolvedThreads=0`（已解決 `PRRT_kwDOQBI8k85_C1fN`）。

## 2026 年標準化調整

- 相關腳本訊息改以 `SEO_STANDARD_YEAR=2026` 集中管理（`scripts/lib/seo-year-metadata.mjs`）。
- 對外命令統一使用 `pnpm verify:sitemap-2026` / `scripts/verify-sitemap-2026.mjs`；`verify-sitemap-2025.mjs` 與 `generate-sitemap-2025.mjs` 僅作相容入口，避免破壞既有 CI 與歷史引用。

## Skills 與資源載入（持續優化）

- 此流程搭配 `seo` / `verification-loop` / `playwright-e2e-testing` / `requesting-code-review` / `receiving-code-review` 系列技能可加速規劃與回歸。
- 若需要跨域資安與可及性驗證，可按需載入 `security-review`, `wcag-compliance`, `web-design-guidelines` 等技能。
