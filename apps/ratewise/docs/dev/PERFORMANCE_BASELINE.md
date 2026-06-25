# Performance Baseline（效能基準）

本文件記錄 RateWise 的效能基準與監控 SOP。

## 版本資訊

- **基準版本**：v2.22.15
- **建立日期**：2026-05-05
- **最後更新**：2026-05-05

## 效能指標基準（Local Development）

| 指標                   | 目標          | 當前實測                                | 狀態 |
| ---------------------- | ------------- | --------------------------------------- | ---- |
| **趨勢圖首次可見時間** | ≤ 2,500ms     | 828ms                                   | ✅   |
| **LCP**                | ≤ 2,500ms     | 待實測（首個 production baseline 回填） | -    |
| **INP**                | ≤ 200ms       | 待實測（首個 production baseline 回填） | -    |
| **CLS**                | ≤ 0.1         | 待實測（首個 production baseline 回填） | -    |
| **歷史 API 請求數**    | 1 (aggregate) | 1                                       | ✅   |
| **fetch 總耗時**       | ≤ 500ms       | ~10ms                                   | ✅   |

## 效能指標基準（Production）

| 指標                       | 目標      | 當前實測                                | 狀態 |
| -------------------------- | --------- | --------------------------------------- | ---- |
| **LCP (4G median)**        | ≤ 2,500ms | 待實測（首個 production baseline 回填） | -    |
| **INP**                    | ≤ 200ms   | 待實測（首個 production baseline 回填） | -    |
| **CLS**                    | ≤ 0.1     | 待實測（首個 production baseline 回填） | -    |
| **Lighthouse Performance** | ≥ 90      | 待實測（首個 production baseline 回填） | -    |

## 優化歷史

### PR1: Aggregate Trend History Fetch（2026-05-05）

- **問題**：30 個 JSON 並行 fetch（N+1 問題）
- **解法**：新增 `history-30d.json` 聚合 endpoint，30 fetch → 1 fetch
- **效果**：fetch 耗時從 ~3,000ms 降至 ~10ms（-99%）

### PR2: Drop 10s Defer（2026-05-05）

- **問題**：`TREND_CHART_DEFER_MS` 硬延遲 10 秒
- **解法**：改為 `requestIdleCallback` 直接載入（無硬延遲）
- **效果**：趨勢圖可見時間從 10,937ms 降至 828ms（-92%）

### PR3: PWA Navigation Timeout（2026-05-05）

- **問題**：iOS Safari 冷啟動離線白屏
- **解法**：NavigationRoute 改用 `NetworkFirst` + 3 秒 timeout + fallback
- **效果**：網路超時自動 fallback 到 precache，避免無限等待

### PR4: Cache Budget Guard（2026-05-05）

- **問題**：iOS Safari 50MB cache 上限可能觸發 eviction
- **解法**：install 時檢查使用量，超過 40MB 清理非關鍵快取
- **效果**：預防 cache eviction 導致的白屏

## 退化偵測 SOP

### 漂移門檻（Production Baseline SSOT）

Production baseline 比較採**相對 + 絕對雙門檻**：兩者同時超過才判定退化（`scripts/lighthouse-drift.mjs`）。

| 指標        | 相對退化門檻 | 絕對漂移容忍（DRIFT_ABSOLUTE_TOLERANCE） | 硬性門檻   |
| ----------- | ------------ | ---------------------------------------- | ---------- |
| Performance | 5%           | 1 分                                     | ≥ 90       |
| LCP         | 5%           | 500 ms                                   | ≤ 2,500 ms |
| INP         | 5%           | 30 ms                                    | ≤ 200 ms   |
| CLS         | 5%           | 0.01                                     | ≤ 0.1      |

範例：INP baseline 34 ms → 實測 60 ms（+26 ms）在 30 ms 絕對容忍內，即使相對漂移 >5% 也不 fail；34 → 66 ms（+32 ms）才 fail。

> **CI 觸發範圍**：Production Lighthouse workflow 掃描**正式站 live URL**，結果受 CDN/排程/第三方腳本影響，與 PR 程式碼無直接因果。一般 `apps/ratewise/**` PR **不觸發**此 workflow；僅在每日 cron 或 `workflow_dispatch` 時執行。**PR 合併 gate 使用 ci.yml 的 Lighthouse CI（本地 build + LHCI）**，非 production 掃描。

### 自動偵測

1. **趨勢圖 E2E 測試**：`tests/e2e/trend-chart-latency.spec.ts`
   - CI 每次 PR 執行
   - 門檻：趨勢圖可見時間 ≤ 2,500ms
   - 失敗自動阻擋合併

2. **Lighthouse Production Baseline**
   - 每日 cron 執行 production URL（一般 ratewise PR 不觸發，見上方 CI 觸發範圍）
   - 腳本：`scripts/lighthouse-production.mjs`（漂移邏輯：`scripts/lighthouse-drift.mjs`）
   - 每頁 3 次取中位數，持續更新 `scripts/lighthouse-baseline.production.json`
   - 硬性門檻：LCP ≤ 2,500ms、INP ≤ 200ms、CLS ≤ 0.1、Performance ≥ 90
   - 退化：相對 >5% **且** 絕對漂移超過 DRIFT_ABSOLUTE_TOLERANCE 才 fail

3. **RUM（Real User Monitoring）**（待啟用）
   - `web-vitals` → `VITE_VITALS_ENDPOINT`
   - 可選：GA4 Measurement Protocol 或 Cloudflare Worker collector

4. **RUM + Lighthouse 綜合查核**
   - PR 每次合併前：本地執行 `pnpm lighthouse:production`，確認 `.json` 摘要可讀
   - Production：每日固定 `workflow_dispatch/schedule` 上傳 `lighthouse-reports/production/summary.json`

### 手動驗證

```bash
# 運行趨勢圖效能測試
pnpm --filter @app/ratewise exec playwright test trend-chart-latency --grep "baseline"
pnpm lighthouse:production
cat scripts/lighthouse-baseline.production.json

# 預期輸出：
# 總載入時間：<1000ms
# 歷史 API 請求數：1
# 使用 aggregate endpoint：✅ 是
```

### 退化處理流程

1. **CI 失敗**
   - 檢查 E2E 測試輸出
   - 比對與基準的差異
   - 回退或修復後重新提交

2. **Production 退化**
   - 檢查 Lighthouse CI 報告
   - 比對 RUM 數據
   - 建立緊急修復 PR

## 相關文件

- [AGENTS.md](../../../AGENTS.md) - Agent SOP
- [CLAUDE.md](../../../CLAUDE.md) - Claude 開發指南
- [sw.ts](../../src/sw.ts) - Service Worker 實作
- [performance.ts](../../src/config/performance.ts) - 效能配置
