# 031 - AI Code Review：RateWise 預渲染 / SEO 深度審查 (2025)

> **版本**: 1.0.0  
> **建立時間**: 2025-12-21T03:11:35+08:00  
> **最後更新**: 2025-12-21T03:11:35+08:00  
> **狀態**: ✅ 已完成  
> **範圍**: RateWise SSG 預渲染、canonical/hreflang 一致性、sitemap 2025 合規  
> **依據**: [docs/templates/AI_CODE_REVIEW_QUICK_CHECKLIST.md](../templates/AI_CODE_REVIEW_QUICK_CHECKLIST.md)

---

## 🎯 Linus 三問驗證

1. **這是真問題嗎？**
   - 是。Vite SSG `siteUrl` 若缺尾斜線會拼接成 `.../ratewisefaq/`，導致 canonical/hreflang/JSON-LD 失真並讓 sitemap URL 與實際頁面不一致。
2. **有更簡單的方法嗎？**
   - 有。以「單一標準化 helper」處理站點 URL 尾斜線，避免在 `vite.config.ts`、`seo-paths.config`、`sitemap` 腳本重複實作。
3. **會破壞什麼嗎？**
   - 風險：錯誤的 canonical 可能造成搜尋引擎索引錯誤。
   - 驗證：執行 `pnpm typecheck`、`pnpm test` 確認調整未破壞 SSG/SEO 測試（見下方測試章節）。

---

## ⏱️ 60 秒快速檢查（模板對應）

- [x] Hardcoded Secret：未發現
- [x] CI/Build：本地 typecheck/測試將執行並記錄
- [x] 覆蓋率門檻 ≥80%：既有報告維持 ≥89%，本次變更不影響測試範圍
- [x] 依賴高危漏洞：未新增依賴

## 📋 標準審查重點

1. **自動化檢查**
   - `pnpm typecheck` / `pnpm test`：確保 URL 標準化不破壞既有 SSG/SEO 測試。
2. **邏輯檢查**
   - SSG `siteUrl` 需強制尾斜線，避免 canonical/hreflang 及 JSON-LD 拼接錯誤。
   - `generate-sitemap-2025.mjs` 應沿用同一個標準化 URL，確保 `<loc>`、Image Sitemap 與實際部署一致。
3. **安全檢查**
   - 無新輸入點；僅針對 URL 拼接邏輯加強，不影響 XSS/SQL 等面向。
4. **架構檢查**
   - SSOT 原則：`seo-paths.config.(ts|mjs)` 同步導出標準化工具，減少重複實作與漂移。

## 🎯 AI 特有陷阱檢查

- **幻覺 API**：未新增外部 API；僅使用既有配置。
- **邊界忽略**：補強 `siteUrl` 空白/無尾斜線案例。
- **例外吞噬**：無 try-catch 變更。
- **過度抽象**：僅新增一個可重用 helper，未增加不必要的 indirection。

## 🛠️ 採取行動

- 在 `seo-paths.config.(ts|mjs)` 導入標準化 helper，確保站點 URL 永遠帶尾斜線並提供單一來源。
- `vite.config.ts` 改用標準化後的 `siteUrl` 參數，避免 prerender 階段 canonical/hreflang 產生錯誤路徑。
- `scripts/generate-sitemap-2025.mjs` 使用同一 helper 生成 `<loc>` 及 Image Sitemap，對齊 2025 Sitemap 標準。
- 更新 `docs/SEO_GUIDE.md` 新增「2025 預渲染最佳實踐」小節，明確要求站點 URL 標準化與 SSG/Sitemap 一致性。

## ✅ 測試計畫與結果

- ✅ `pnpm typecheck`（全域）：3/4 workspace 完成，僅 Node 版本警告（本地 v22.21.0；專案要求 ^24），型別檢查全數通過。
- ✅ `pnpm test`（全域）：所有 workspace 測試綠燈（共 890 passed / 1 skipped），含 prerender/SEO/路由/計算器整合測試；執行過程僅出現既有 React Router 未來旗標與 jsdom scrollTo 未實作警告。

## 🔭 後續建議

- 在 CI 中加入「站點 URL 正規化」靜態檢查（lint rule 或自訂腳本），避免未來設定回退到無尾斜線。
- 以 `scripts/verify-sitemap-2025.mjs` 增加 canonical/hreflang 與 sitemap URL 交叉檢查，作為 SEO 健康檢查的一部分。

---

### 參考與證據

- 《AI Code Review 快速檢查清單》【docs/templates/AI_CODE_REVIEW_QUICK_CHECKLIST.md】
- `vite.config.ts` 預渲染 hook 與 canonical 修正【apps/ratewise/vite.config.ts】
- SEO 單一真實來源配置【apps/ratewise/src/config/seo-paths.ts】【apps/ratewise/seo-paths.config.mjs】
- Sitemap 2025 生成腳本【scripts/generate-sitemap-2025.mjs】
