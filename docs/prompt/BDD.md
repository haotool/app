# 🧠 BDD 專案開發指南 - CLAUDE.md

## 🚨 關鍵規則 (CRITICAL RULES)

- **KISS 原則**: 優先選擇簡單、可維護的解決方案，避免過度工程化
- **YAGNI 原則**: 只有在實際需要時才建構功能特性
- **DRY 原則**: 避免重複程式碼，創建可重用的元件
- **生產就緒**: 始終編寫生產級程式碼，不使用模擬數據或測試 API
- **測試優先**: 採用行為驅動開發(BDD)方法，測試先於實作

## 🎯 專案背景與目標

### 專案類型

- **領域**: [描述業務領域，如電商、餐飲、金融等]
- **架構**: [單體應用/微服務/Serverless 等]
- **團隊規模**: [小型團隊/中型團隊/企業級團隊]

### 技術棧

- **前端**: [如 Next.js 15.3, React 19.1, TypeScript 5.8]
- **後端**: [如 Node.js, Prisma 6.9, PostgreSQL]
- **樣式**: [如 Tailwind CSS 3.4]
- **測試**: [如 Jest, Cypress, Playwright]

## 📝 BDD 開發流程

### Given-When-Then 模式

使用標準 BDD 格式描述行為：

```gherkin
場景：用戶成功登入系統
  假設 用戶擁有有效的帳號
  當 用戶輸入正確的使用者名稱和密碼
  那麼 系統應該重定向到儀表板
  並且 顯示歡迎訊息
  並且 記錄登入日誌
```

### Three Amigos 協作

- **業務分析師**: 定義業務規則和使用者需求
- **開發者**: 實作功能和技術解決方案
- **測試工程師**: 確保品質和測試覆蓋率

### Discovery Workshop 發現工作坊

- 專注於真實世界的使用者範例
- 識別理解差距
- 建立共享的專案語言(Ubiquitous Language)

## 🔧 程式碼標準與約定

### 命名約定

- **元件**: PascalCase (`UserProfile.tsx`)
- **函數**: camelCase (`getUserById`)
- **常數**: SCREAMING_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **檔案**: kebab-case (`user-profile.component.tsx`)

### 專案結構 (基於您的 Verdant 專案)

```
src/
├── app/                    # Next.js App Router
├── components/             # 共用元件
│   ├── ui/                # 基礎UI元件
│   └── feature/           # 功能特定元件
├── features/              # 功能模組
│   ├── order/             # 點餐功能
│   └── billing/           # 分帳功能
├── lib/                   # 工具函數
├── types/                 # TypeScript型別定義
└── __tests__/             # 測試檔案
```

### 程式碼品質要求

- **TypeScript**: 嚴格模式啟用，所有型別必須明確定義
- **錯誤處理**: 實作適當的錯誤邊界和回退機制
- **效能**: 使用懶載入、程式碼分割和圖片優化
- **無障礙**: 遵循 WCAG 2.1 AA 標準

## 🧪 測試策略

### 測試金字塔

1. **單元測試** (70%): 測試個別函數和元件
2. **整合測試** (20%): 測試元件間互動
3. **端到端測試** (10%): 測試完整使用者流程

### TDD 紅-綠-重構循環

1. **紅色**: 撰寫失敗的測試
2. **綠色**: 寫最少程式碼讓測試通過
3. **重構**: 改善程式碼品質，保持測試通過

### BDD 測試範例模板

```typescript
describe('使用者登入功能', () => {
  describe('當使用者提供有效憑證時', () => {
    it('應該成功登入並重定向到儀表板', async () => {
      // Given: 準備測試數據
      const validCredentials = {
        email: 'user@example.com',
        password: 'validPassword',
      };

      // When: 執行動作
      const result = await loginUser(validCredentials);

      // Then: 驗證結果
      expect(result.success).toBe(true);
      expect(result.redirectUrl).toBe('/dashboard');
    });
  });
});
```

## 🔄 開發工作流程

### Git 工作流程

- **主分支**: `main` (生產就緒程式碼)
- **開發分支**: `develop` (整合分支)
- **功能分支**: `feature/[功能名稱]`
- **修復分支**: `hotfix/[問題描述]`

### 提交訊息格式

```
類型(範圍): 簡短描述

詳細描述內容

相關議題: #123
```

類型選項: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Code Review 檢查清單

- [ ] 程式碼遵循專案約定
- [ ] 測試涵蓋率達標(最低 85%)
- [ ] 無 TypeScript 錯誤
- [ ] 效能影響評估
- [ ] 安全性考量

## 🛡️ 安全與品質

### 安全檢查清單

- **輸入驗證**: 所有使用者輸入必須驗證
- **SQL 注入**: 使用參數化查詢
- **XSS 防護**: 適當的內容轉義
- **CSRF 保護**: 實作 CSRF token
- **API 限流**: 防止濫用攻擊

### 效能最佳化

- **快取策略**: Redis 用於會話，CDN 用於靜態資源
- **資料庫最佳化**: 適當的索引和查詢最佳化
- **前端最佳化**: 程式碼分割、樹搖和圖片最佳化
- **監控**: 實作 APM 和錯誤追蹤

## 🚀 部署與 CI/CD

### 部署環境

- **開發環境**: 自動部署 feature 分支
- **測試環境**: 整合測試和 UAT
- **生產環境**: 手動批准的生產部署

### 自動化流程

1. **程式碼檢查**: ESLint, Prettier, TypeScript
2. **測試執行**: 單元、整合、e2e 測試
3. **安全掃描**: SAST, SCA, 容器掃描
4. **效能測試**: Lighthouse 審核
5. **部署驗證**: 健康檢查和煙霧測試

## 📊 監控與分析

### 關鍵指標 (KPIs)

- **使用者體驗**: Core Web Vitals, 頁面載入時間
- **業務指標**: 轉換率、使用者留存率
- **技術指標**: 錯誤率、回應時間、系統可用性

### 錯誤追蹤

- **即時監控**: 關鍵錯誤立即通知
- **錯誤分類**: 按嚴重程度和頻率分類
- **根因分析**: 詳細的錯誤上下文和堆疊追蹤

## 🤝 團隊協作

### 溝通原則

- **透明**: 公開分享進度、風險和決策
- **文件導向**: 重要決策必須文件化
- **反饋導向**: 鼓勵建設性反饋和持續改進

### 知識管理

- **技術文件**: API 文件、架構決策記錄
- **使用者文件**: 使用手冊、故障排除指南
- **流程文件**: 開發流程、部署程序

## 📋 常用命令快捷參考

### 開發命令

- `npm run dev`: 啟動開發伺服器
- `npm run build`: 建構生產版本
- `npm run test`: 執行測試套件
- `npm run lint`: 程式碼檢查
- `npm run type-check`: TypeScript 型別檢查

### Git 命令

- `git flow feature start [名稱]`: 開始新功能
- `git flow feature finish [名稱]`: 完成功能
- `git rebase -i HEAD~n`: 互動式重組提交

## 📖 參考資源

### 官方文檔

- [Next.js 文檔](https://nextjs.org/docs)
- [React 文檔](https://react.dev)
- [TypeScript 文檔](https://www.typescriptlang.org/docs)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)

### BDD 資源

- [Cucumber BDD 指南](https://cucumber.io/docs/bdd/)
- [Gherkin 語法參考](https://cucumber.io/docs/gherkin/)
- [BDD 最佳實踐](https://www.thoughtworks.com/insights/blog/applying-bdd-agile-world)

### 測試工具

- [Jest 測試框架](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright E2E](https://playwright.dev/)

---

**記住**: 這個 CLAUDE.md 檔案是活文檔，應該隨著專案演進而更新。定期審查和改進指導原則，確保它們持續為團隊提供價值。

**最後更新**: [日期] | **版本**: 1.0.0
