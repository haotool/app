# 002 開發獎懲記錄 LOG

**版本**: 1.0.0  
**建立時間**: 2025-10-31T03:06:28+0800  
**更新時間**: 2025-10-31T03:32:04+0800  
**狀態**: 🔄 進行中

---

## 流程守則

1. 遇到錯誤或不確定的決策時，必須先透過 Context7 查閱官方文件或權威來源，確認最佳實踐後再實作修正。[context7:changesets/action:2025-10-30T19:04:00Z]
2. 成功與失敗皆需紀錄，包含時間、摘要、引用來源與採取的行動。
3. 每次更新須調整分數，提醒後續 Agent 避免重複犯錯。
4. 本表為長期維運項，不得刪除。

---

## 本次紀錄（2025-10-31）

| 類型    | 摘要                                                                                   | 採取行動                                                        | 依據                                                                    | 分數 |
| ------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- | ---- |
| ✅ 成功 | 趨勢圖整合 30 天歷史 + 今日即時匯率                                                    | `SingleConverter.tsx` 追加 `fetchLatestRates()`，並更新測試驗證 | `docs/dev/001_exchange_rate_data_strategy.md`                           | +1   |
| ✅ 成功 | 修復版本標籤流程，統一由 `release.yml` 建立標籤與 GitHub Release                       | `changesets` 官方建議 + workflow 改寫                           | [context7:changesets/changesets:2025-10-30T19:04:30Z]                   | +1   |
| ⚠️ 注意 | `pnpm changeset tag` 會自動建立 `@app/ratewise@version` 標籤，若重複執行需先刪除舊標籤 | 文件化操作步驟，避免 pipeline 二度建立相同標籤                  | [context7:changesets/changesets:2025-10-30T19:04:30Z]                   | 0    |
| ✅ 成功 | 修正 MiniTrendChart 畫布縮放造成線條粗細跳動                                           | 移除 scale 動畫，僅保留位移漸進，維持像素對齊                   | [context7:tradingview/lightweight-charts:2025-10-31T03:05:00Z]          | +1   |
| ✅ 成功 | 版本號改用 Git 標籤/提交數生成，避免永遠停留在 1.0.0                                   | `vite.config.ts` 導入 `git describe` 與 commit count fallback   | [context7:git/git:2025-10-31T03:07:00Z]                                 | +1   |
| ✅ 成功 | 即時匯率即使數據未變也會刷新 UI 更新時間                                               | `useExchangeRates` 新增 `lastFetchedAt` 與 UI 雙時間標示        | `docs/dev/001_exchange_rate_data_strategy.md`                           | +1   |
| ✅ 成功 | 時間格式化邏輯重構（52行→5行，-90.4%）                                                 | 提取為獨立工具函數 `utils/timeFormatter.ts`，建立 21 個測試案例 | [Linus KISS principle] + `docs/dev/003_ui_transparency_improvements.md` | +1   |
| ✅ 成功 | 版本生成邏輯簡化（nested try-catch → nullish coalescing）                              | 分離為 3 個獨立函數，使用 `??` 運算符串接 fallback 策略         | [TC39: Nullish Coalescing] + Linus 好品味原則                           | +1   |
| ✅ 成功 | 修正 `toLocaleTimeString` 使用錯誤（12小時制 → 24小時制）                              | 新增 `hour12: false` 參數，避免「上午」前綴                     | [MDN: toLocaleTimeString] + 測試驅動修復                                | +1   |
| ✅ 成功 | 新增前端刷新時間追蹤（lastFetchedAt），提升 UI 透明度                                  | 在 `useExchangeRates` hook 中記錄前端實際刷新時間               | `docs/dev/001_exchange_rate_data_strategy.md`                           | +1   |
| ✅ 成功 | 建立 4 項強制規範文檔（編號規則、獎懲流程、Context7、Linus三問）                       | 更新 `CLAUDE.md` 與 `AGENTS.md`，確保所有 Agent 遵守流程        | Linus 三問 + Context7 優先原則                                          | +1   |

**當前總分**: +10

---

## 待追蹤事項

- 未來每次出現錯誤都需新增紀錄，並更新總分。
- 建議在 Release PR flow 中加入 Changeset 檢查，避免忘記撰寫。
- 4 項強制規範已加入 CLAUDE.md 與 AGENTS.md（2025-10-31），需持續監控遵守情況。
