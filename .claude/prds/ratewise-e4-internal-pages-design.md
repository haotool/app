# E4 設計簡報：內部頁面全面重構（PM 親撰 v1.0）

> 依據：使用者需求原文（常見問題／使用指南／關於我們／隱私權政策／開放資料 API／SEO 技術揭露／開放原始碼七頁「完整重構、韓系水準、高可維護、SSOT 收斂」）＋UIUX 審計 P1（內容頁遺失底部導覽等）。
> 基底：`experiment/ratewise-product-2026h2` @ `0b55fe4d`（E1 設計系統已就緒——**必須用 E1 的 token 與 primitive，不得自創樣式**）。

## 前置任務（Task 0，先做並獨立 commit）

Issue **#577**：BottomSheet 補 Esc 關閉／focus trap／開啟初始焦點／關閉焦點還原（含 4 項單元測試）＋守門 regex 限制註解＋三個 Nits（CurrencyPickerSheet pinned 接收藏、TrendSheet aria 名稱、SegmentedControl 魔法數註解）。E4 頁面會大量用 sheet/dialog，先清這筆債。

## 資訊架構（七頁統一骨架）

1. **共用 `ContentPageLayout`**：PageNavHeader（返回＋標題）＋內容區＋**底部導覽必須在場**（修復審計 P1「內容頁遺失底部導覽」）＋safe-area。七頁不得各自手刻版面。
2. **內容驅動渲染**：每頁內容整理為 sections 設定（標題／段落／清單／FAQ 手風琴／連結卡），由共用 section renderer 渲染——收斂七頁的重複 JSX；但**不過度抽象**：僅涵蓋實際出現的 section 型別，特例（OpenData 的 API 表格、SeoTech 的技術清單）允許頁內專屬元件。
3. **文案零改動**：內容文字與 SEO 資料一律沿用現況來源（`seo-metadata/**` 由 E5 專屬，本 epic 禁止修改該目錄）；E4 只重排呈現。

## 韓系視覺語彙（用 E1 系統）

- 字階用 E1 八級 SSOT；區塊間距大方（24px 級）；hairline 分隔；卡片用 E1 圓角/陰影 token。
- FAQ 改手風琴（原生 details 或輕量受控元件，動效用 E1 press/slide 三類）；長文頁（隱私）加目錄側跳或黏性小節導覽（擇一，簡約優先）。
- OpenData API 頁：端點卡片化＋複製按鈕；SeoTech／開源頁：資訊卡片化，去牆文。
- 深色主題（nitro/racing）與 custom 主題全部正確（吃 #571 的 Layout token 基礎）。

## 邊界（out of scope）

`seo-metadata/**`（E5 專屬）、路由與 URL、JSON-LD schema、i18n 架構（新 UI 字串照常四語系，但不重構 i18n 本身）、首頁與換算頁。

## 品質閘門

- 全套 vitest（E1 守門、a11y 斷言零弱化）＋Task 0 的四項 a11y 測試；typecheck；build（SSG 254 頁成功）。
- e2e：`accessibility.spec.ts` 全綠＋內容頁導覽 smoke（每頁可達、底部導覽在場）。
- 截圖：7 頁 × {zen, nitro} × 390×844（14 張起）＋375×667 抽 3 頁；無跑版、console error 0（既有 #418 豁免）。
- changeset patch（內部頁體驗改版）。

## 執行提示

commit 拆分：Task 0（#577）→ ContentPageLayout＋renderer → 各頁遷移（可 2-3 批）→ 收尾守門。每 commit 過 commitlint＋002。PR body 附七頁 before/after 對照說明。
