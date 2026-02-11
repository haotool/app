---
'@app/haotool': patch
---

fix(seo): 修復 haotool 多項 SEO 問題

- 延長 4 個頁面 meta description 至 120+ 字元
- 修復重複 meta description：onPageRendered 移除 index.html 原有 description
- 修復重複 title：onPageRendered 移除 index.html 原有 title，注入每頁專屬標題
- 壓縮 ratewise-og.jpg：124KB → 78KB（低於 100KB 限制）
- Home.tsx 新增 <main id="main-content"> landmark（修復 landmark-one-main 違規）
- Contact.tsx 新增 displayValue 欄位，隱藏原始 email 文字防止 Cloudflare obfuscation
- 首頁 footer 社交連結新增 sr-only 文字（修復 anchor text 警告）
