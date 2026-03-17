---
'@app/ratewise': patch
---

fix(seo): 修正 hydration 後 alternate/og:locale:alternate 標籤重複問題

- replaceHeadCollection 改為同時清除 data-seo-helmet="managed"（CSR）與 data-rh="true"（SSR）兩類節點
- 防止 vite-react-ssg <Head> SSR 輸出的 hreflang link 在 useEffect 接管後殘留，造成頁面 head 同時存在重複或過時的 hreflang/og:locale:alternate metadata
- 不含任一標記的外部注入節點仍受保護，不會被移除
