---
'@app/ratewise': minor
---

feat(seo): deep-link URL 動態 SEO — 允許 Googlebot 建立長尾關鍵字索引頁

新增 useDeepLinkSEO hook 及 HomeRoute 元件，讓帶 ?amount/from/to 參數的首頁 URL
（如 ?amount=500&from=USD&to=TWD）可獲得唯一 title/description/canonical，
提供「500 美元換新台幣」等長尾關鍵字的 SEO 索引頁機會。
