---
'@app/ratewise': patch
---

fix(w3c,ssg,seo): 修正 W3C 驗證、SSG 預渲染與 SEO 路徑配置

- 徹底移除 BottomNavigation tabindex（CSS :active 替代 motion whileTap）
- SEOHelmet 提取至 early return 之前（Multi/Favorites/Settings SSG 修正）
- 更新 isCorePagePath 包含 /multi/, /favorites/, /settings/
- SEO_PATHS 17→20 路徑，同步 SSOT 配置與 sitemap.xml
- 簡化 Article schema、修正 publisher logo URL
- SkeletonLoader heading 修正（h1→p 避免重複）
