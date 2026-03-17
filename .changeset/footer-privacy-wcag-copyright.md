---
'@app/ratewise': patch
---

fix(footer): 隱私政策連結、版權年份動態化、WCAG aria 修復、sitemap 更新

- `footer-links.ts`：核心頁面 grid section 加入「隱私政策」連結（`/privacy/`）
  - 符合 CalOPPA / GDPR / CCPA 業界標準：Privacy Policy 必須出現在所有頁面 Footer 的 SEO 連結區
- `Footer.tsx`：版權年份 `CURRENT_YEAR = 2025` → `new Date().getFullYear()`
  - 桌面版 `<p>` 加 `suppressHydrationWarning`，防止 SSG build year vs runtime year hydration mismatch
- `Footer.tsx`：WCAG 2.1 AA 修復
  - 裝飾性 SVG（checkmark、external link、clock）加 `aria-hidden="true"`（行動版 + 桌面版）
  - 桌面 Links Grid 改以 `<nav aria-label="頁腳導航">` 包裝，提供 landmark 語意
- `OpenData.tsx`：WCAG 2.1 AA 修復
  - 回首頁箭頭、FAQ 手風琴展開箭頭、CTA 前進箭頭加 `aria-hidden="true"`
  - `CodeBlock` 的 `<pre>` 加 `role="region" aria-label="程式碼範例：{language}"`
- `public/sitemap.xml`：重新生成，新增 `/open-data/`，URL 總數 24 → 25（含 hreflang）
