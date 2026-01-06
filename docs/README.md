# Documentation Index

本目錄包含 RateWise 專案的完整技術文檔。

## 📚 快速導航

### 入門指南

- **[SETUP.md](SETUP.md)** - 開發環境設置與初始配置
- **[QUICK_START_HISTORICAL_RATES.md](QUICK_START_HISTORICAL_RATES.md)** - 歷史匯率功能快速上手

### 部署文檔

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Docker 部署指南
- **[ZEABUR_DEPLOYMENT.md](ZEABUR_DEPLOYMENT.md)** - Zeabur 平台部署

### 功能實作

- **[PWA_IMPLEMENTATION.md](PWA_IMPLEMENTATION.md)** - Progressive Web App 實作指南
- **[HISTORICAL_RATES_IMPLEMENTATION.md](HISTORICAL_RATES_IMPLEMENTATION.md)** - 歷史匯率功能實作
- **[EXCHANGE_RATE_UPDATE_STRATEGIES.md](EXCHANGE_RATE_UPDATE_STRATEGIES.md)** - 匯率更新策略比較

### 安全與配置

- **[SECURITY_BASELINE.md](SECURITY_BASELINE.md)** - 安全基線與責任界面
- **[CLOUDFLARE_SECURITY_HEADERS_GUIDE.md](CLOUDFLARE_SECURITY_HEADERS_GUIDE.md)** - Cloudflare CSP/HSTS 配置指南 ⭐ 最新
- **[CLOUDFLARE_NGINX_HEADERS.md](CLOUDFLARE_NGINX_HEADERS.md)** - 安全標頭配置策略 (已過時)

### 架構與規劃

- **[ARCHITECTURE_BASELINE.md](dev/ARCHITECTURE_BASELINE.md)** - 架構藍圖與分層準則

### SEO 與優化

- **[SEO_GUIDE.md](SEO_GUIDE.md)** - SEO 最佳實踐指南
- **[SEARCH_CONSOLE_GUIDE.md](SEARCH_CONSOLE_GUIDE.md)** - Search Console 配置指南
- **[SEO_SUBMISSION_GUIDE.md](SEO_SUBMISSION_GUIDE.md)** - SEO 提交指南

### 開發參考 (dev/)

- **[ARCHITECTURE_BASELINE.md](dev/ARCHITECTURE_BASELINE.md)** - 架構藍圖與分層準則
- **[CHECKLISTS.md](dev/CHECKLISTS.md)** - 品質檢查清單
- **[CITATIONS.md](dev/CITATIONS.md)** - 權威來源清單與技術引用
- **[DEPENDENCY_UPGRADE_PLAN.md](dev/DEPENDENCY_UPGRADE_PLAN.md)** - 依賴升級策略
- **[AI_SEARCH_OPTIMIZATION_SPEC.md](dev/AI_SEARCH_OPTIMIZATION_SPEC.md)** - AI 搜尋優化規格
- **[002_development_reward_penalty_log.md](dev/002_development_reward_penalty_log.md)** - 開發獎懲記錄

## 📋 文檔類型說明

### 指南 (Guide)

提供特定任務的逐步說明，適合新手入門。

- SETUP.md
- QUICK*START*\*.md
- DEPLOYMENT.md

### 參考 (Reference)

技術實作細節與配置說明，適合深入研究。

- PWA_IMPLEMENTATION.md
- SECURITY_BASELINE.md
- CLOUDFLARE_SECURITY_HEADERS_GUIDE.md (CSP/HSTS 最新指南)

### 規劃 (Planning)

架構決策、技術債務、升級計劃等前瞻性文檔。

- DEPENDENCY_UPGRADE_PLAN.md
- ARCHITECTURE_BASELINE.md

## 🔄 文檔維護原則

遵循 AGENTS.md 中的文檔維護規範：

1. **時間戳記**: 所有文檔需標註建立與更新時間
2. **版本標記**: 重大變更需更新版本號
3. **狀態標記**: 使用 ✅ 已完成、🔄 進行中、📋 規劃中、❌ 已廢棄
4. **引用來源**: 技術決策需標註來源
5. **範例程式碼**: 必須可執行或明確標註狀態

### 禁止保留

- ❌ 臨時報告 (`*_REPORT.md`, `*_SUMMARY.md`)
- ❌ 已完成的計畫文檔 (`*_PLAN.md` 完成後應移除或歸檔)
- ❌ 過時的審查報告 (`*_AUDIT_*.md` 含日期的單次審查)

### 必須保留

- ✅ 操作指南 (SETUP, DEPLOYMENT)
- ✅ 技術決策 (ARCHITECTURE, SECURITY)
- ✅ 最佳實踐 (IMPLEMENTATION guides)
- ✅ 快速開始 (QUICK_START)
- ✅ 檢查清單 (CHECKLISTS)

## 🔗 相關資源

- [專案 README](../README.md) - 專案概覽與快速開始
- [AGENTS.md](../AGENTS.md) - Agent 操作守則
- [LINUS_GUIDE.md](../LINUS_GUIDE.md) - 開發哲學與程式碼品質準則

---

**維護者**: DevOps Team  
**最後更新**: 2025-12-24T22:42:00+08:00  
**版本**: 1.1.0
