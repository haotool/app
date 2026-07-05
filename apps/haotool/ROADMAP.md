# ROADMAP — haotool.org 官網 v2（產品級重建）

> Scope：本路線圖聚焦 `app.haotool.org` 根站（haotool 官網）重建任務；各子 app 路線圖見各自文件。
> SSOT：PRD `docs/superpowers/specs/2026-07-04-haotool-site-rebuild-prd.md`、設計 brief `docs/superpowers/specs/2026-07-05-haotool-site-design-brief.md`、內容盤點 `docs/dev/046_haotool_site_content_inventory.md`。
> 工作分支：`feat/haotool-site-e3`（基於 `experiment/ratewise-product-2026h2`）。合併與正式部署需使用者明確批准。

## Now — Epic E3：行動首頁美感升級（Codex LOGO/素材、美學研究驅動設計迭代）

- Codex imagegen 產製 LOGO 與視覺素材 v2（吉祥物/插圖/OG 模板精修）
- 美學研究驅動的行動首頁設計迭代（多視口截圖 QA 與體感驗收）

## Done — Epic E1：haotool-site v2 MVP（韓系扁平、產品級）

| 序  | 工作項                                                                  | 狀態 |
| --- | ----------------------------------------------------------------------- | ---- |
| 1   | PRD v2 定稿（Fable critic 審查 + 設計深化 + 技術棧/SEO 研究回饋收斂）   | 完成 |
| 2   | `apps/haotool` 腳手架（SSOT 配置、路由、測試、SSG/PWA 管線）            | 完成 |
| 3   | 設計系統實作（tokens、元件庫、動效系統；全站無漸層扁平規範）            | 完成 |
| 4   | 四頁 + 404 實作（Home/Tools/About/Contact，含文案與素材）               | 完成 |
| 5   | SEO/AEO 全配置（JSON-LD @graph、llms.txt、index.md、sitemap、noscript） | 完成 |
| 6   | 素材管線（wordmark SVG、icon/OG 產生腳本、Playwright 截圖 pipeline）    | 完成 |
| 7   | 測試齊備（109 unit + QA 實測 + Lighthouse P98/A100）                    | 完成 |
| 8   | 部署整合（root scripts/Dockerfile/nginx/Worker v5.6 原始碼）            | 完成 |
| 9   | gh issues（#546-550）→ PR #552 ready（merge 待使用者批准）              | 完成 |

> E1+E2 已於 2026-07-06 併入 `experiment/ratewise-product-2026h2`（PR #552）。

## Next — Epic E4：main 合併與正式部署（需使用者批准）

## Later — Epic E5+：擴充候選（過 ROI 閘才立案）

- 英文版 i18n、深色模式（`prefers-color-scheme`）
- HaoRate 即時匯率預覽 chip（build-time 資料，零 runtime 成本）
- 「正在打造」動態（由 CHANGELOG/git 資料驅動）
- 工具卡 hover 預覽影格、案例研究頁（case study per app）

## 追蹤

- 進度 SSOT：`.claude/state/progress.json`（不入版控）+ GitHub Issues（建立後回填連結）
- 品質關卡：Fable 八鏡頭 review、100 分評分卡、drift sentinel（版本/文件/schema 一致）
