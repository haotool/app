# Lighthouse 持續優化記錄

> **目的**: 追蹤所有 Lighthouse 優化嘗試，記錄有效與無效的方案，確保分數持續提升
> **原則**: 只提交有效的優化，無效的優化記錄在此文檔中供未來參考

---

## 📊 目標分數追蹤

| 日期       | Performance | Accessibility | Best Practices | SEO        | 來源                                           | 備註              |
| ---------- | ----------- | ------------- | -------------- | ---------- | ---------------------------------------------- | ----------------- |
| 2025-10-29 | **100** ✅  | **100** ✅    | 92 ⚠️          | 89 ⚠️      | Production (https://app.haotool.org/ratewise/) | 初始基準          |
| 2025-10-28 | 72 ⚠️       | **100** ✅    | **100** ✅     | **100** ✅ | Local (localhost:4174)                         | 本地測試 LCP 異常 |

**目標**: Performance 100 + Accessibility 100 + Best Practices 100 + SEO 100

---

## ✅ 已實施優化 (Committed)

### 1. 非阻塞 CSS 載入 (2025-10-28)

- **Commit**: `70f28b6` - feat(lighthouse): Performance 100 優化 - 非阻塞 CSS + 快取策略
- **技術**: Vite plugin 轉換 `<link rel="stylesheet">` → `<link rel="preload" ... onload>`
- **檔案**: `vite-plugins/non-blocking-css.ts`, `vite.config.ts`
- **理論效果**: 消除 CSS 阻塞渲染 (410ms)
- **實際效果**: ✅ 生產環境 Performance 100 達成
- **權威來源**: [web.dev - Defer non-critical CSS](https://web.dev/articles/defer-non-critical-css)

### 2. 內聯關鍵 CSS (骨架屏) (2025-10-28)

- **Commit**: `e308c26` - feat(lighthouse): Performance 100 優化 - Skeleton Screen + 404 修復
- **技術**: `<style>` 內聯骨架屏樣式，立即渲染頁面結構
- **檔案**: `index.html` (lines 42-105, 147-164)
- **理論效果**: 提升 perceived performance，避免白屏
- **實際效果**: ✅ 骨架屏立即顯示，用戶體驗提升
- **權威來源**: [web.dev - Optimize LCP](https://web.dev/articles/optimize-lcp)

### 3. HTTP 快取策略 (2025-10-28)

- **Commit**: `70f28b6` (同上)
- **技術**: `public/_headers` 配置分層快取
  - Assets: 1 年 (`max-age=31536000, immutable`)
  - HTML: 1 小時 (`max-age=3600, must-revalidate`)
  - Service Worker: 不快取 (`max-age=0`)
- **檔案**: `public/_headers`
- **理論效果**: 減少重複下載，加速二次訪問
- **實際效果**: ✅ 生產環境快取正常運作
- **權威來源**: [web.dev - HTTP Cache](https://web.dev/articles/http-cache)

### 4. Modulepreload 自動化 (2025-10-28)

- **技術**: Vite 自動生成 `<link rel="modulepreload">`
- **檔案**: Vite 建置自動生成
- **理論效果**: 並行載入關鍵 JavaScript 模組
- **實際效果**: ✅ 生產環境自動生成
- **權威來源**: [Vite - Build Optimizations](https://vite.dev/guide/build.html)

### 5. robots.txt SEO 修復 (第一次嘗試，失敗)

- **Commit**: `70f28b6` (已包含但未生效)
- **技術**: 移除 line 29 `Content-signal` 非標準指令
- **檔案**: `public/robots.txt`
- **預期效果**: SEO 92 → 100
- **實際效果**: ❌ **未生效** - 生產環境仍顯示 SEO 89，line 29 仍存在
- **問題分析**: 修改後未正確部署到生產環境
- **下一步**: 重新修復並驗證生產環境

---

## 🔄 待驗證優化 (Testing)

### robots.txt 標準化 (第二次嘗試，本地測試完成)

- **日期**: 2025-10-29
- **Commit**: `7bec3e3` - fix(seo): 移除 robots.txt 非標準 Content-signal 指令
- **技術**: 移除 line 29 非標準 `Content-signal` 指令，加入 Google 規範註解
- **預期效果**: SEO 89 → 100 (+11 分)
- **權威來源**: [Google - robots.txt specification](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt)
- **測試結果 (本地)**:
  1. ✅ 修改 `public/robots.txt`
  2. ✅ 建置成功，robots.txt 正確複製到 dist/
  3. ✅ 驗證: Content-signal 指令已移除（僅存於註解）
  4. ✅ pa11y WCAG 2.1 AA 測試: No issues found!
  5. ⏳ **待生產環境驗證**: 需部署後使用 PageSpeed Insights 測試
- **狀態**: 🔄 本地測試通過，待生產環境驗證 SEO 分數

### CSP Strict 模式 (決定不實施)

- **日期**: 2025-10-29
- **決策**: ❌ **不實施** Strict CSP
- **理由**:
  1. **分層防禦原則**: CSP 在 Cloudflare 層級已設定，符合 SECURITY_BASELINE.md 架構
  2. **責任界面清晰**: 應用層不重複設定 Cloudflare 已處理的安全標頭
  3. **投資報酬率低**: Best Practices 92→100 (+8 分) vs 實施複雜度極高
  4. **技術風險**: 需要動態 nonce 生成，可能破壞現有功能（Vite、PWA、Cloudflare Rocket Loader）
  5. **維護成本**: 每次新增 inline script 都需要加入 nonce 屬性
- **當前 CSP 配置**:
  ```
  Content-Security-Policy: default-src 'self';
    script-src 'self' https://static.cloudflareinsights.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    connect-src 'self' https://raw.githubusercontent.com https://cdn.jsdelivr.net;
  ```
- **替代方案**: 維持 Cloudflare WAF + 應用層 Input Validation 雙層防護
- **權威來源**: [web.dev - Strict CSP](https://web.dev/articles/strict-csp)
- **狀態**: ✅ 決策完成，記錄於 LOG

---

## ❌ 無效優化記錄 (Failed Attempts)

### 本地 Lighthouse 測試 (2025-10-28)

- **嘗試**: 使用 `pnpm lighthouse` 本地測試驗證優化效果
- **結果**: ❌ **無效** - Performance 72/100，LCP 29.9s 異常
- **原因**:
  - `LanternError: NO_LCP` - 本地測試環境限制
  - 多個 preview 伺服器同時運行 (5+ instances)
  - Service Worker 快取策略干擾
  - React DevTools 增加額外負載
- **教訓**: **本地 Lighthouse 測試不可靠**，必須使用生產環境測試
- **替代方案**: 使用 Google PageSpeed Insights 測試生產環境

### seo-analyzer 工具 (2025-10-28)

- **嘗試**: 安裝 `seo-analyzer@3.2.0` 進行 SEO 深度檢測
- **結果**: ❌ **無法使用** - `Error: Cannot find module './version'`
- **原因**: 工具本身有模組錯誤
- **教訓**: 工具安裝前需驗證是否正常運作
- **替代方案**: 使用 Lighthouse CLI、pa11y、unlighthouse

---

## 🎯 優化策略指南

### 有效策略

1. **Performance 優化**:
   - ✅ 非阻塞 CSS 載入 (preload + onload)
   - ✅ 內聯關鍵 CSS (骨架屏)
   - ✅ HTTP 快取策略 (分層快取)
   - ✅ Modulepreload (Vite 自動)
   - ✅ Code splitting (Vite 自動)

2. **SEO 優化**:
   - ✅ robots.txt 標準化 (只使用 Google 支援的指令)
   - ✅ Sitemap.xml (已實施)
   - ✅ Meta 標籤完整性 (已實施)

3. **Accessibility 優化**:
   - ✅ WCAG 2.1 AA 合規 (pa11y 驗證通過)
   - ✅ 語義化 HTML (已實施)
   - ✅ ARIA 標籤 (已實施)

### 無效或高風險策略

1. **本地測試**:
   - ❌ 本地 Lighthouse CLI 測試 (LCP 異常)
   - ❌ 本地 unlighthouse 測試 (同樣 LCP 問題)
   - ✅ **改用**: Google PageSpeed Insights (生產環境)

2. **CSP Strict 模式**:
   - ⚠️ **高複雜度**: 需要動態 nonce 生成
   - ⚠️ **風險**: 可能破壞現有功能
   - ⚠️ **投資報酬率低**: 92 → 100 (+8 分) vs 實施複雜度
   - 💡 **建議**: 暫不實施，CSP 由 Cloudflare 層級管理

---

## 📝 測試工作流程

### 標準測試流程

```bash
# 1. 記錄優化前分數
echo "Baseline: https://pagespeed.web.dev/analysis?url=https://app.haotool.org/ratewise/"

# 2. 執行優化修改
# ... (修改檔案)

# 3. 建置並部署
pnpm build
git add .
git commit -m "fix(seo): 修復項目描述"
git push

# 4. 等待部署完成 (Zeabur 約 2-5 分鐘)

# 5. 測試生產環境
# 使用 Google PageSpeed Insights 手動測試
# 比對分數差異

# 6. 決策
if [ 分數提升 ]; then
  echo "✅ 優化有效，保留 commit"
  # 更新此 LOG 文檔
else
  echo "❌ 優化無效，記錄到 LOG"
  git revert HEAD
fi
```

### 快速驗證指令

```bash
# 檢查 robots.txt 是否正確
curl https://app.haotool.org/ratewise/robots.txt

# 檢查 CSP headers
curl -I https://app.haotool.org/ratewise/ | grep -i content-security-policy

# 檢查快取策略
curl -I https://app.haotool.org/ratewise/assets/index-xxx.css | grep -i cache-control
```

---

## 🔍 問題分析框架

### 問題發現

1. 使用 Google PageSpeed Insights 測試生產環境
2. 記錄所有低於 100 分的類別
3. 查看 Lighthouse 報告中的具體錯誤訊息

### 根因分析

1. 搜尋 Google 官方文檔確認問題原因
2. 查閱 web.dev 最佳實踐文章
3. 使用 Context7 查詢框架官方文檔

### 解決方案驗證

1. 小範圍修改測試
2. 生產環境驗證
3. 記錄效果到此 LOG

### 決策準則

- ✅ **提交**: 分數提升且無副作用
- ❌ **回退**: 分數未提升或引入新問題
- 📝 **記錄**: 所有嘗試都記錄到此 LOG

---

## 📚 權威參考資源

### Google 官方文檔

- [Google Search Central - robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt)
- [Google Search Central - Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [PageSpeed Insights](https://pagespeed.web.dev/)

### Web.dev 最佳實踐

- [Optimize LCP](https://web.dev/articles/optimize-lcp)
- [Defer non-critical CSS](https://web.dev/articles/defer-non-critical-css)
- [HTTP Cache](https://web.dev/articles/http-cache)
- [Strict CSP](https://web.dev/articles/strict-csp)

### Lighthouse 文檔

- [Lighthouse Best Practices](https://developer.chrome.com/docs/lighthouse/best-practices/)
- [Lighthouse SEO](https://developer.chrome.com/docs/lighthouse/seo/)
- [Lighthouse Performance](https://developer.chrome.com/docs/lighthouse/performance/)

### 框架文檔

- [Vite - Build Optimizations](https://vite.dev/guide/build.html)
- [React - Performance Optimization](https://react.dev/learn/render-and-commit)

---

## 🎯 下一步行動

### 立即執行 (High Priority)

1. ✅ 建立此 LOG 文檔
2. 🔄 修復 robots.txt (移除 line 29-31)
3. 🔄 生產環境測試驗證 SEO 分數

### 待討論 (Medium Priority)

1. CSP Strict 模式策略決策
   - 選項 A: 不修改 (建議)
   - 選項 B: 實施 Strict CSP (複雜)

### 長期監控 (Low Priority)

1. 設定 Lighthouse CI 自動監控
2. 整合 GitHub Actions 自動測試
3. 建立 Lighthouse 分數徽章

---

**最後更新**: 2025-10-29
**維護者**: Claude Code
**版本**: v1.0
