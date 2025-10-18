# Ultrathink Execution TODO

> 建立時間：2025-10-19T02:54:31+08:00  
> 維護人：Ultrathink Agent  
> 指引：依 `LINUS_GUIDE.md` 要求，以最小可行修復逐項完成，結束後更新此檔。

## 當前任務

- [x] 套用 `PATCHES/seo-foundation.patch` 並完成 Search Console 更新（參照 `TECH_DEBT_AUDIT.md`）。
- [ ] 建立 `refactor/m0-seo-foundation` 分支並更新 `docs/dev/CHECKLISTS.md`。
- [ ] 套用 `PATCHES/service-worker-timeout-fix.patch` 與 `PATCHES/ci-split.patch`，完成後執行 `pnpm lint && pnpm typecheck && pnpm --filter @app/ratewise test:coverage && pnpm --filter @app/ratewise build`。（目前 coverage 為 77.21%，低於 80% 門檻）

## 備註

- 每一步皆需透過 Context7 驗證相關最佳實踐。
- 變更需保持最小、可回滾且通過所有既有檢查。
- Git 分支操作在當前環境因權限限制失敗，需於本機手動建立 `refactor/m0-seo-foundation`。
