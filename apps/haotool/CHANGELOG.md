# @app/haotool

## 1.0.5

### Patch Changes

- 83769aa: 修正 Release workflow 的 tag 建立與快取設定，避免發版卡在 tag 推送並移除 Node 20 action warning。

## 1.0.4

### Patch Changes

- 0b6364b: 品牌改名：RateWise → HaoRate（網址與功能維持不變）。
  - `app-info.ts` SSOT 改 `BRAND_SHORT_NAME = 'HaoRate'`，全站 title / manifest / llms.txt / openapi / offline / Markdown mirrors 透過 prebuild 自動跟隨
  - `scripts/generate-sitemap-2025.mjs` 改從 `APP_INFO` 取品牌，sitemap image captions 不再硬寫舊名
  - `scripts/verify-production-seo.mjs` llms.txt 熱門匯率驗證的 display-name 門檻改為 `HaoRate`
  - `apps/haotool` 首頁 / meta / jsonld / llms.txt 對本站的作品集標籤同步改為「HaoRate 匯率計算機」
  - Brand SSOT 哨兵（`build-scripts.test.ts`）改鎖 `HaoRate`，維持「禁止在 SSOT 以外寫死品牌字串」契約

  網址保持 `/ratewise/` 不變（工作區代號、component 檔名、套件名均為 permanent technical identifier），link equity 與 PWA identity 完全保留，使用者體驗零中斷。

- 62bbcf9: 修正 release PR 自動建立流程，刷新 README / root hygiene，並對齊 Vite 8 React plugin 與版本基線，避免 changeset 已累積但版本與 CHANGELOG 未更新。

## 1.0.3

### Patch Changes

- 795f7ce: 修復 haotool 首頁 3D Hero 的 CSP / SSG hydration 問題，並補強 RateWise basename 導航與離線 chunk recovery 保護。

## 1.0.2

### Patch Changes

- 6377a0c: fix(a11y): resolve WCAG accessibility violations in haotool portfolio
  - Fix dlitem: wrap dt/dd stats in <dl> element (was in <div>)
  - Fix label-content-name-mismatch: aria-label now matches visible text
  - Fix landmark-one-main: Projects/Contact/About pages use <div> not <main>
    (Layout already provides the single <main> landmark)

- 13caae8: fix(perf): compress ratewise-og.png 663KB → ratewise-og.jpg 124KB

  Convert project OG image from PNG to JPEG at 85% quality
  to reduce page weight by 81% (663KB → 124KB).

- 31dc40b: fix(seo): 修復 haotool 多項 SEO 問題
  - 延長 4 個頁面 meta description 至 120+ 字元
  - 修復重複 meta description：onPageRendered 移除 index.html 原有 description
  - 修復重複 title：onPageRendered 移除 index.html 原有 title，注入每頁專屬標題
  - 壓縮 ratewise-og.jpg：124KB → 78KB（低於 100KB 限制）
  - Home.tsx 新增 <main id="main-content"> landmark（修復 landmark-one-main 違規）
  - Contact.tsx 新增 displayValue 欄位，隱藏原始 email 文字防止 Cloudflare obfuscation
  - 首頁 footer 社交連結新增 sr-only 文字（修復 anchor text 警告）

## 1.0.1

### Patch Changes

- 6107b69: fix(security): P2 安全修復 - 7 個 CodeQL Medium 級別警告全部修復
  - URL Sanitization: 使用 URL 對象驗證域名替代 .includes() 檢查
  - Shell Injection: 添加白名單驗證與 resolve() 路徑安全
  - Identity Replacement: 修正無效字串替換邏輯
