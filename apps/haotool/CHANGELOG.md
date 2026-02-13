# @app/haotool

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
