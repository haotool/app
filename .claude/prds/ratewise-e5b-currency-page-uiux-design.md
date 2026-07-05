# E5 wave-B 設計簡報：幣別/金額頁 UIUX 砍掉重做（PM 親撰 v1.0）

> 使用者指令：「每個兌換幣別的頁面內容全部砍掉重做 UIUX 達到韓系 app 風格水準」「所有 SEO 頁面大規模 UIUX 重構」。
> 前提已齊：E1 設計系統（token/primitive/守門）、E5 wave-A 內容層（persona/金額頁 v2 資料/L3 守門）。**本 wave 是純呈現層重構——`seo-metadata/**` 內容一個字不動。**

## 資訊架構（34 幣別頁＋金額頁統一骨架，上→下）

1. **Answer Hero**（首屏）：大字當前匯率（tabular-nums、E1 字階頂級）＋銀行賣出/買入雙 chip＋更新時間 caption＋「立即換算」CTA（錨到站內換算器）——answer-first，3 秒內拿到答案。
2. **四報價卡**：現金買/賣、即期買/賣，2×2 卡片網格（E1 卡片 token、hairline），缺即期的幣別誠實顯示不可用態（對齊 H2 語意）。
3. **金額階梯表**：wave-A 的 `<table>` 重排為 Toss 交易列表式（代碼左、數值右、hairline 分隔、斑馬紋免）＋互鏈金額頁。
4. **在地情境區**：persona 內容（機場 vs 市區、換錢所比較、實用提示）改為卡片組＋icon 點綴（lucide 既有），非牆文。
5. **FAQ 手風琴**：套 E4 的 `ContentFaqAccordion` 範式（原生 details）。
6. **相關連結**：反向頁、熱門幣別 chips。

## 硬規格

- **全部用 E1 系統**：token 字階/圓角/陰影、無漸層無彩影（design-system-guards 會擋）；section 間距 24px 級。
- **SSG/SEO 紅線**：JSON-LD、meta、hreflang、sitemap、內容文字（title/description/FAQ/persona）零變動——只動 JSX 結構與樣式；`seo-ssot`/`truthfulness`/`template-bleed`/schema 測試一個都不能弱化；重構後 dist 的可見文字集合與重構前等價（可寫一次性 diff 腳本佐證，正規化空白後比對）。
- 行動 390×844 無水平溢位；桌面/平板沿用置中欄策略；深色主題全數正確。
- 金額頁與幣別頁共用同一組 presentational 元件（禁止兩套）。

## 淘汰清單（使用者授權「不好的設計就淘汰」）

- 現行牆文式段落佈局、無層次的 highlights 條列、與 app 端割裂的視覺語言。
- 保留並強化：answer capsule 概念（升級為 Answer Hero）、階梯表資料。

## 品質閘門

全套 vitest（含 E1/E5 守門零弱化）；typecheck；build（SSG 255 頁）；可見文字等價證據；截圖矩陣：{krw-twd, usd-twd, jpy-twd, 金額頁 krw-twd/50000} × {zen, nitro} × {390×844, 1440×900}；Lighthouse mobile 抽 1 頁（SEO 100 維持）；console 0；changeset patch（呈現改版）。

## 邊界

`seo-metadata/**` 禁改；`PageNavHeader`/`ContentPageLayout` 只消費不修改（safe-area 修復另案進行中）；路由/URL 不動。
