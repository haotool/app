---
'@app/ratewise': patch
---

修復 root `test:unit` / `test:integration` script 對 Vitest 4 的相容性：移除 Jest 風格的 `--testPathIgnorePatterns=e2e` / `--testPathPattern=integration`（Vitest 4 已不支援），改由各 app 的 `vitest.config.ts` 既有 `test.exclude` 處理 e2e 隔離；`test:integration` 改為直接掃描 ratewise 唯一 integration 測試檔。SEO iteration orchestrator 此後不再因 unit/integration step 失敗誤判 round failed。
