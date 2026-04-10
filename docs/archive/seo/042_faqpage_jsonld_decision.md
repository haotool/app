# FAQPage JSON-LD 決策文件

## 文件控制

| 欄位       | 內容                                            |
| ---------- | ----------------------------------------------- |
| 文件編號   | 042                                             |
| 文件名稱   | FAQPage JSON-LD 決策文件                        |
| 文件性質   | 架構決策記錄（ADR）                             |
| 適用範圍   | RateWise 全站 FAQ 內容與結構化資料              |
| 文件狀態   | Active                                          |
| 建立日期   | 2026-03-26                                      |
| 審查週期   | 每 90 日或 Google 結構化資料政策變更後          |
| 下次審查日 | 2026-06-26                                      |
| 關聯文件   | `seo-metadata.ts`, `SEOHelmet.tsx`, `AGENTS.md` |

## 決策摘要

**決策**：RateWise 不輸出 `FAQPage` JSON-LD rich result 標記，FAQ 內容僅保留為可讀 HTML 區塊。

**狀態**：已採用（Adopted）

**決策日期**：2026-03-26

## 背景與問題

### 問題描述

RateWise 在多個頁面（首頁、幣別頁、攻略頁、FAQ 頁）包含 FAQ 內容。需要決定是否為這些 FAQ 內容輸出 `FAQPage` JSON-LD 結構化資料，以獲取 Google 搜尋結果的 FAQ rich results。

### 考量因素

1. **Google FAQPage 支援範圍**：Google 對 FAQPage rich results 的支援範圍有限，且近年持續收緊顯示條件
2. **重複標記風險**：多個頁面同時輸出 FAQPage 可能導致 Search Console 報告重複標記警告
3. **內容品質 vs 標記**：Google 更重視實際內容品質，而非單純依賴結構化資料
4. **維護成本**：FAQPage 標記需要與可見 HTML 內容保持同步，增加維護負擔

## 決策選項

### 選項 A：全站輸出 FAQPage JSON-LD（不採用）

- **優點**：可能獲得 FAQ rich results 曝光
- **缺點**：
  - 多頁面重複標記風險
  - Google 支援範圍不穩定
  - 維護成本高

### 選項 B：僅 FAQ 頁輸出 FAQPage JSON-LD（不採用）

- **優點**：集中管理，降低重複風險
- **缺點**：
  - 仍需額外維護標記與 HTML 同步
  - 效益不確定

### 選項 C：不輸出 FAQPage，保留可讀 HTML（已採用）

- **優點**：
  - 無重複標記風險
  - 零額外維護成本
  - FAQ 內容對使用者與 AI 爬蟲均可讀
  - 符合 Google「內容優先」原則
- **缺點**：
  - 無法獲得 FAQ rich results（但此功能本身不穩定）

## 決策理由

1. **Google 政策趨勢**：Google 近年持續收緊 rich results 顯示條件，FAQPage 的顯示機率已大幅降低
2. **內容品質優先**：RateWise 的 FAQ 內容已針對 E-E-A-T 與 AI 引用優化，可讀 HTML 已足夠
3. **維護效率**：不輸出 FAQPage 可避免標記與內容不同步的風險
4. **替代方案**：使用 `Article` JSON-LD 標記攻略頁，已足夠傳達內容結構

## 實作細節

### 現有 JSON-LD 標記（保留）

| Schema 類型           | 適用頁面               | 用途             |
| --------------------- | ---------------------- | ---------------- |
| `WebSite`             | 全站                   | 站點識別與搜尋框 |
| `SoftwareApplication` | 首頁                   | PWA 產品資訊     |
| `Organization`        | 全站                   | 聯絡資訊         |
| `HowTo`               | 首頁、Guide、Open Data | 使用步驟         |
| `BreadcrumbList`      | 全站                   | 麵包屑導覽       |
| `Article`             | 攻略頁                 | 內容頁標記       |
| `FinancialService`    | 幣別頁                 | 金融服務標記     |
| `ImageObject`         | 全站                   | 分享圖片授權     |

### FAQ 內容處理方式

1. **可見 HTML**：所有 FAQ 內容以語意化 HTML 呈現（`<details>` / `<summary>` 或自訂元件）
2. **AI 可讀性**：FAQ 文案針對 LLM 引用設計，包含精確數字與雙幣標示
3. **無 FAQPage 標記**：不輸出 `@type: FAQPage` JSON-LD

### 程式碼位置

- FAQ 內容 SSOT：`apps/ratewise/src/config/seo-metadata.ts`
- SEO 標記輸出：`apps/ratewise/src/components/SEOHelmet.tsx`
- 幣別特化 FAQ：`CURRENCY_SPECIFIC_FAQ` 與 `REVERSE_CURRENCY_SPECIFIC_FAQ`

## 審查條件

以下情況應重新評估本決策：

1. Google 宣布擴大 FAQPage rich results 支援範圍
2. Search Console 報告顯示 FAQ rich results 對流量有顯著影響
3. 競爭對手大量採用 FAQPage 且獲得明顯 SEO 優勢

## 相關資源

- [Google FAQPage 結構化資料文件](https://developers.google.com/search/docs/appearance/structured-data/faqpage)
- [Google Search Central Blog - Rich Results 政策更新](https://developers.google.com/search/blog)
- RateWise SEO SSOT：`apps/ratewise/src/config/seo-metadata.ts`

## 修訂紀錄

| 日期       | 版本 | 變更摘要                    |
| ---------- | ---- | --------------------------- |
| 2026-03-26 | v1.0 | 初版：建立 FAQPage 決策文件 |

---

**最後更新**: 2026-03-26T00:00:00+0800
**版本**: v1.0
