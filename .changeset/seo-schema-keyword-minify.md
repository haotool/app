---
'@app/ratewise': patch
---

fix(seo): Schema.org 合規修正、關鍵字密度優化、inline script 壓縮

- P0 Schema.org: ImageObject width/height 改為 number、Organization.logo 改為 ImageObject、Article.image 補 contentUrl 與 publisher.logo 尺寸、FinancialService Offer 補完整欄位
- P0 SEOHelmet: structuredDataJson 與 normalizedAlternatesSignature 改用 useMemo、移除 unmount cleanup race condition、replaceHeadCollection 限制只清除 managed 節點
- P1 robots.txt: Disallow 路徑補 /ratewise/ 前綴（正確反映 sub-path 部署）
- P2 關鍵字密度: 幣別 FAQ 答案與 About FAQ 問題改用「本工具」取代重複品牌名稱
- P2 inline script: 移除 index.html 兩個 inline script 的 comments 並壓縮
