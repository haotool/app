# 開發 TODO 清單

> 最後更新：2025-10-20
> 維護人：AI SEO Optimization Team
> 指引：依 `LINUS_GUIDE.md` 要求，以最小可行修復逐項完成，結束後更新此檔。

---

## 🔴 P0 - 立即執行 (開發者待辦)

**此為當前最重要的任務，完成後即可讓您的網站正式被搜索引擎索引。**

1.  **提交至搜索引擎**
    - **任務**: 根據 `docs/dev/DEVELOPER_SEO_CHECKLIST.md` 的指引，手動將網站提交至 Google Search Console 和 Bing Webmaster Tools。
    - **影響**: 這是讓您的 SEO 優化成果被 Google、Bing、Yahoo、DuckDuckGo 等搜索引擎看見的**關鍵一步**。
    - **狀態**: ❌ **未完成**

---

## 🟡 P1 - 重要驗證與優化

1.  **技術驗證**
    - **任務**: 使用 Google Rich Results Test 和 Schema.org Validator 驗證所有頁面（`/, /about, /faq`）的結構化資料正確無誤。
    - **影響**: 確保您的網站在搜索結果中能以豐富摘要（Rich Results）的形式展現。

2.  **AI 搜索測試**
    - **任務**: 使用 ChatGPT, Claude, Perplexity, Gemini 測試關鍵問題，驗證 `llms.txt` 和優化內容的成效。
    - **影響**: 確保您的品牌和資訊在 AI 問答中被準確引用。

3.  **啟用 `prioritizeSeoTags`**
    - **任務**: 在 `HelmetProvider` 啟用 `prioritizeSeoTags` 屬性，這可以讓關鍵的 SEO 標籤更早被加載。
    - **影響**: 可能改善 FCP (First Contentful Paint) 效能，提升 1-3 分的 Lighthouse 分數。

4.  **修復外部資源 404 錯誤**
    - **任務**: 調查並修復 Lighthouse 報告中提到的 TradingView 和 GitHub raw 資源的 404 錯誤。
    - **影響**: 將 Best Practices 分數從 96 分提升至 100 分。

5.  **品牌提及建立**
    - **任務**: 開始在 Product Hunt, PTT, GitHub 等平台建立品牌提及。
    - **影響**: 提升您網站在 AI 模型中的權威性（LLMO）。

---

## 🟢 P2 - 未來優化

1.  **擴展 FAQ 內容**: 將問答從 14 個擴展至 20 個以上，覆蓋更多長尾關鍵字。
2.  **Information Gain 內容優化**: 參考研究報告，進一步增加首頁內容的資訊密度。
3.  **Performance 優化至 100 分**: 研究並解決目前 97 分的瓶頸，可能需要 Code splitting 或 dynamic import。

---

## ✅ 已完成 (截至 2025-10-20)

**Lighthouse 最終審查結果**：

```
Performance:    97/100 ⭐
Accessibility:  98/100 ✅
Best Practices: 96/100 ✅
SEO:           100/100 🎉
```

**AI Search Readiness**: 95/100 ✅

**核心完成項目**：

- ✅ **AI 指導文件 (`llms.txt`)**: 已建立，指導 AI 如何引用您的內容。
- ✅ **安全聲明 (`security.txt`)**: 已建立，符合 RFC 9116 標準。
- ✅ **關於頁面 (`/about`)**: 已建立，包含完整的 E-E-A-T 信任信號。
- ✅ **操作指南 (`HowTo` Schema)**: 已在首頁實施。
- ✅ **FAQ 頁面優化**: 事實密度提升 3-5 倍，並擴充問題。
- ✅ **OG 圖片優化**: 已創建並優化至 `1200x630` 標準尺寸。
- ✅ **PWA Manifest 截圖**: 已生成 5 張應用程式截圖。
- ✅ **Email 地址統一**: 已將公開 Email 統一。
- ✅ **過時文件清理**: 已移除不再需要的報告與範例文件。
- ✅ **範例文件還原**: 已將 `ZEABUR_DEPLOYMENT.md` 還原為通用範本。

---

## 📊 當前 SEO 配置完整度

- ✅ **基礎 Meta Tags**: 100%
- ✅ **Open Graph & Twitter Card**: 100%
- ✅ **結構化資料 (5 種)**: 100% (WebApplication, Organization, WebSite, FAQPage, HowTo)
- ✅ **AI 搜索優化**: 100% (llms.txt, 優化內容)
- ✅ **E-E-A-T 信號**: 100% (About 頁面, security.txt)

---

## 🔗 相關文檔

- **AI SEO 趨勢研究**: `docs/dev/2025_AI_SEO_TRENDS_RESEARCH_REPORT.md`
- **AI SEO 規格**: `docs/dev/AI_SEARCH_OPTIMIZATION_SPEC.md`
- **開發者檢查清單**: `docs/dev/DEVELOPER_SEO_CHECKLIST.md`
