# @app/haotool

HaoTool 好工具 — haotool.org 根站（v2 重建）。免費、開源、不收集個資的台灣網頁工具集入口（Tool Hub）。

- PRD：`docs/superpowers/specs/2026-07-04-haotool-site-rebuild-prd.md`
- 設計 Brief：`docs/superpowers/specs/2026-07-05-haotool-site-design-brief.md`
- 內容盤點 SSOT：`docs/dev/046_haotool_site_content_inventory.md`

## 指令

```bash
pnpm --filter @app/haotool dev              # 開發伺服器（port 3003）
pnpm --filter @app/haotool build            # prebuild（sitemap/robots/llms）→ SSG build → postbuild
pnpm --filter @app/haotool typecheck        # tsc --noEmit
pnpm --filter @app/haotool test -- --run    # Vitest 單次執行
pnpm --filter @app/haotool test:coverage    # 覆蓋率報告
pnpm --filter @app/haotool generate:sitemap # 重新生成 sitemap/robots/llms
```

## 結構

```text
app.config.mjs        路徑/資源 SSOT（SEO_PATHS、resources、lighthouseSmokePaths）
src/config/           品牌原子（app-info.ts）與工具資料（tools.ts）SSOT
src/index.css         Tailwind v4 @theme tokens（色彩 SSOT：RateWise Zen）
src/routes.tsx        4 路由 + 404（vite-react-ssg RouteRecord）
src/pages/            Home / Tools / About / Contact / NotFound
src/seo/              meta-tags.ts + jsonld.ts（@graph，SSG 注入）
scripts/              generate-sitemap.js（prebuild）、postbuild.js
```

## 關鍵治理

- 路由統一尾斜線；SSG `dirStyle: 'nested'`，postbuild 產生 `{page}.html` 與根層 `404.html`。
- Root-scope Service Worker：`navigateFallbackAllowlist` 僅 4 路由，denylist 明列全部子 app（含 split-meow）；`registerType: 'prompt'`。
- SSG HTML 禁止輸出 `mailto:` href（Cloudflare Email Obfuscation 治理）。
- 扁平鐵律：全站禁止漸層與裝飾性陰影（設計 brief §1.1）。
