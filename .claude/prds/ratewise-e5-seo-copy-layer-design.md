# E5 設計簡報 wave-A：SEO copy 四層架構與金額頁 v2（PM 親撰 v1.0）

> 依據：SEO 審計 `.claude/product-intel/seo-audit.md`（四層 copy 架構＋金額查詢奪首戰略）＋ #566 追蹤項。基底：`experiment/ratewise-product-2026h2` @ `18834c58`。
> 目標：Google「任意金額＋幣別」查詢首位。**wave-A 只動內容層（seo-metadata 設定與生成），不動視覺元件與版面**（那是 E1/E4）。

## 交付範圍

### 1. Copy 四層架構（去 AI 化的根治）

- **L0 全站常數**：延續 `MID_RATE_SPREAD_NOTE` 模式，收斂全站重複敘述為常數集。
- **L1 幣別 persona schema**：為 34 個幣別 landing 定義必填特化欄位（在地換匯情境、機場 vs 市區、特化 FAQ 素材、實用提示），品質基準＝現有 PHP/IDR/MYR 特化 FAQ 水準；**每幣別 ≥3 個可驗證的真實在地事實**，嚴禁湊字模板句。
- **L2 純組裝生成器**：敘述性文字 100% 來自 persona 欄位，模板只做資料呈現（反 template-bleed 根治）。
- **L3 守門測試**：AI 贅詞黑名單、寫死匯率 lint、跨幣別相似度上限、高頻模板句 phrase budget——**必須把 #566 的三項一併吃掉**（「實際價差每日變動」×6 等新模板句收斂、About FAQ 尾句去機房語言、answer 級自指涉掃描）。

### 2. 金額頁 v2（奪首核心）

- **Answer Block**：首屏雙向答案——「N 外幣 ≈ X 台幣（銀行賣出）／換回 Y 台幣（銀行買入）」＋與中間價差一句話；數字全部由 `SEO_RATE_EXAMPLES` 每日資料注入。
- **金額階梯表**：`<table>` 由既有 INDEXABLE amounts 純計算生成（零硬編碼），覆蓋常用階梯。
- **Title 公式**：加中文數字別名——「5 萬韓元（50,000 KRW）換台幣」；title 不放匯率數字；description 首句直接給答案。
- 內容真實性紅線：延續 #558 原則，全 source 零手寫匯率與年份。

### 3. 明確不做（wave-B / E4 的事）

幣別頁視覺重排（等 E1 元件）、新路由、sitemap 結構變更（沿用既有 SSOT 管線，內容變更自然反映）、多銀行比較表（審計 P3）。

## 品質閘門

- L3 守門全綠且經突變驗證（故意塞一句黑名單贅詞要紅）；既有 seo-ssot/truthfulness/template-bleed 測試零弱化。
- 34 幣別 persona 填齊率 100%；抽 5 個幣別全文人工可讀性自檢（讀起來像在地達人寫的，不像模板）。
- `generate:deterministic` 冪等；build 後 dist 抽查 3 個金額頁 ＋ 2 個幣別頁的實際輸出。
- 全套 vitest、typecheck、build；changeset patch（內容品質與 SEO 改善，使用者可見為文案更新）。

## 執行提示

分 commit：L0/L1 schema → 34 幣 persona 內容（可拆 2-3 commit）→ L2 生成器接線 → 金額頁 v2 → L3 守門。persona 內容撰寫前先 WebSearch 驗證在地事實（例：明洞換錢所、成田機場匯率慣例），禁憑記憶編造。
