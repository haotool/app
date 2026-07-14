# 047 — StarPuff 遊戲 App（星噗噗）技術決策

| 欄位      | 內容                                                           |
| --------- | -------------------------------------------------------------- |
| 文件性質  | 長期決策 / 架構紀錄                                            |
| 適用對象  | `apps/starpuff`（星噗噗 StarPuff）                             |
| 文件狀態  | Active                                                         |
| 生效日期  | 2026-07-14                                                     |
| 上位文件  | `CLAUDE.md`、`AGENTS.md`                                       |
| SSOT 參照 | `apps/starpuff/app.config.mjs`、`apps/starpuff/vite.config.ts` |

## 1. 背景

StarPuff 是 monorepo 首個遊戲類 app：直向 Boss Rush 動作小遊戲（吸入果凍怪、化為星彈、擊敗果凍王），定位為 haotool 工具站的創意類產品。與既有 React 工具 app 不同，遊戲主迴圈需要逐幀渲染與物理碰撞，因此技術棧獨立決策。

## 2. 技術選型

| 決策     | 選擇                       | 理由                                                                   |
| -------- | -------------------------- | ---------------------------------------------------------------------- |
| 遊戲引擎 | Phaser 4                   | 2D arcade 物理、場景管理、輸入抽象內建；社群成熟，免自造遊戲迴圈       |
| UI 層    | Vanilla TS（無 React）     | 遊戲 UI 全在 Canvas 內；DOM 僅承載觸控按鍵與轉向提示，React 屬多餘依賴 |
| 音效     | ZzFX                       | 程序化生成音效，零音訊資產、零額外網路請求，符合離線優先               |
| PWA      | vite-plugin-pwa（Workbox） | 對齊 monorepo 既有模式；precache 全部遊戲資產，安裝後完全離線可玩      |
| 測試     | Vitest + Playwright        | 單元測試覆蓋遊戲邏輯（波次、狀態機），e2e 以手機視窗驗證觸控操作       |

## 3. 資產管線

- 美術資產為程式化生成的 spritesheet 與 SVG/PNG icon，置於 `public/icons/`（icon-192/512 PNG+SVG、favicon、og-image），生成紀錄見 epic 的 art-log。
- 音效由 ZzFX 參數即時合成，repo 不存音訊檔。
- Workbox `globPatterns` 涵蓋 `js/css/html/svg/png/webp/woff2`，單檔上限 5 MiB；新增大型資產前先確認 precache 體積。

## 4. 部署路徑

- 正式站：`https://app.haotool.org/starpuff/`（base `/starpuff/`，SSOT 為 `app.config.mjs` 的 `basePath`）。
- 部署管線鏡像 split-meow 模式（`docs` 參照 recon：discoverApps 只服務 CI/SEO 腳本，不會自動接入部署）：
  - `Dockerfile`：ARG、COPY package.json、`pnpm build:starpuff`、COPY dist → `starpuff-app` + symlink。
  - `nginx.conf`：SW/index.html no-cache regex、SEO 靜態檔 location、尾斜線 301、SPA `try_files … =404`。
  - root `package.json`：`build:starpuff` 並串入 `build:all`。
- haotool 根站整合：`tools.ts` 卡片註冊 + `sw-routes.ts` SIBLING_APP_DENYLIST（防根站 SW 劫持 `/starpuff/*` 導覽）。
- Cloudflare `security-headers` worker 的 starpuff CSP profile 為後續發版事項（Phaser 全資產同源，預期沿用預設 profile 即可，發版時驗證）。

## 5. 上線後驗證

```bash
curl -sI https://app.haotool.org/starpuff/ | head -5
curl -sI https://app.haotool.org/starpuff/sitemap.xml
node scripts/verify-production-resources.mjs starpuff
```
