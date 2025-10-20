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

1.  **Performance 優化 (LCP 改善)**
    - **任務**: 優化 Largest Contentful Paint (LCP) 從 3.5s 降至 <2.5s
    - **問題**:
      - 未使用的 JavaScript 浪費 450ms
      - 渲染阻塞資源浪費 150ms
    - **解決方案**: Code splitting, dynamic import, lazy loading
    - **影響**: 將 Performance 從 89/100 提升至 95+/100
    - **狀態**: ❌ **待處理**

2.  **技術驗證**
    - **任務**: 使用 Google Rich Results Test 和 Schema.org Validator 驗證所有頁面（`/, /about, /faq`）的結構化資料正確無誤。
    - **影響**: 確保您的網站在搜索結果中能以豐富摘要（Rich Results）的形式展現。

3.  **AI 搜索測試**
    - **任務**: 使用 ChatGPT, Claude, Perplexity, Gemini 測試關鍵問題，驗證 `llms.txt` 和優化內容的成效。
    - **影響**: 確保您的品牌和資訊在 AI 問答中被準確引用。

4.  **品牌提及建立**
    - **任務**: 開始在 Product Hunt, PTT, GitHub 等平台建立品牌提及。
    - **影響**: 提升您網站在 AI 模型中的權威性（LLMO）。

---

## 🟢 P2 - 未來優化

1.  **擴展 FAQ 內容**: 將問答從 14 個擴展至 20 個以上，覆蓋更多長尾關鍵字。
2.  **Information Gain 內容優化**: 參考研究報告，進一步增加首頁內容的資訊密度。

## ⚠️ P2 - 已棄用項目

1.  **~~啟用 `prioritizeSeoTags`~~** (不適用)
    - **原因**: 此功能僅在 `@dr.pogodin/react-helmet` 中可用，本專案使用 `react-helmet-async@2.0.5`，不支援此屬性。
    - **替代方案**: 透過 Code splitting 和 lazy loading 優化 Performance。

2.  **~~修復外部資源 404 錯誤~~** (已解決)
    - **狀態**: Lighthouse Best Practices 已達 100/100，無外部資源錯誤。

---

## ✅ 已完成 (截至 2025-10-20)

**Lighthouse 審查結果** (2025-10-20):

```
Performance:    89/100 ⚠️  (LCP 3.5s，需優化)
Accessibility: 100/100 🎉  (+2 from 98/100)
Best Practices: 100/100 🎉  (+4 from 96/100)
SEO:           100/100 🎉  (維持滿分)
```

**核心 Web Vitals**:

- FCP: 1.8s ✓
- LCP: 3.5s ⚠️ (目標 <2.5s)
- TBT: 0ms ✓
- CLS: 0.001 ✓

**AI Search Readiness**: 95/100 ✅

**2025-10-20 完成項目**：

- ✅ **Sitemap 更新**: 更新所有 lastmod 日期為 2025-10-20，新增 hreflang="en" 支援
- ✅ **2025 AI SEO 研究**: 調查 10+ 權威網站 (Google Search Central, Moz, Search Engine Land 等)
- ✅ **瀏覽器驗證**: 確認所有頁面 (/, /about, /faq) 無 console 錯誤
- ✅ **Lighthouse CLI 全面掃描**: 識別 Performance 優化機會

**核心完成項目** (歷史):

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
