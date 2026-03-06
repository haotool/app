---
'@app/ratewise': patch
---

修正幣別數量聲明、新增 noindex、縮短首頁 title

- 全站「30+」→「18 種」（與 SSOT constants.ts 對齊：18 種含 TWD 基準）
- API 實際外幣 17 種（TWD 為基準不在 details），SEO 落地頁 17 種，均已驗證
- 移除 FAQ.tsx 錯誤聲明（SEK 瑞典克朗、ZAR 南非幣不在支援清單）
- MultiConverter / Favorites / Settings 新增 `robots="noindex, nofollow"`
- robots.txt 新增 Disallow /multi /favorites /settings
- DEFAULT_TITLE 縮短至 ~519px（閾值 535px，舊版 ~609px 超限）
