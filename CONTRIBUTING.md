# 貢獻指南

感謝您有興趣為 RateWise 做出貢獻！本文檔提供貢獻流程與規範。

> **授權提醒**: 本專案採用 **GPL-3.0** 授權。您的貢獻將自動適用相同授權。
> 任何基於本專案的衍生作品**必須開源**並標註原作者。
>
> **原作者**: haotool | **Threads**: @azlife_1224 | **Email**: haotool.org@gmail.com

---

## 🚀 快速開始

### 開發環境需求

- **Node.js**: >= 24.0.0
- **pnpm**: 9.10.0
- **Git**: >= 2.40.0

### Fork 與 Clone

```bash
# 1. Fork 專案到你的 GitHub
# 2. Clone 你的 fork
git clone https://github.com/YOUR_USERNAME/app.git
cd app

# 3. 加入上游遠端
git remote add upstream https://github.com/haotool/app.git

# 4. 安裝依賴
pnpm install

# 5. 啟動開發伺服器
pnpm dev
```

---

## 📋 貢獻流程

### 1. 建立 Issue（可選但建議）

在開始工作前，先建立或找到相關的 Issue：

- **Bug 回報**: 使用 Bug Report 範本
- **功能請求**: 使用 Feature Request 範本
- **文檔改善**: 直接說明需要改善的部分

### 2. 建立分支

```bash
# 從 main 分支建立新分支
git checkout -b feature/your-feature-name

# 或修復 bug
git checkout -b fix/bug-description
```

**分支命名規範**：

- `feature/功能名稱` - 新功能
- `fix/問題描述` - Bug 修復
- `docs/文檔主題` - 文檔更新
- `refactor/重構範圍` - 程式碼重構
- `test/測試範圍` - 測試相關
- `chore/工具或配置` - 建置工具或輔助工具變更

### 3. 進行變更

#### 程式碼規範

遵循專案的程式碼風格：

```bash
# 執行 linter
pnpm lint

# 自動修復 lint 問題
pnpm lint:fix

# 檢查格式
pnpm format

# 自動格式化
pnpm format:fix

# TypeScript 類型檢查
pnpm typecheck
```

#### 測試要求

- 新功能必須包含測試
- Bug 修復應包含重現測試
- 保持測試覆蓋率 >= 80%

```bash
# 執行測試
pnpm test

# 測試覆蓋率報告
pnpm test:coverage

# 監聽模式
pnpm test:watch
```

#### 文檔更新

如果你的變更影響以下內容，請同步更新文檔：

- **API 變更** → 更新 README.md 與相關文檔
- **配置變更** → 更新 .env.example 與 SETUP.md
- **架構變更** → 更新 ARCHITECTURE_BASELINE.md
- **部署變更** → 更新 DEPLOYMENT.md

參考 `AGENTS.md` § 6 的完整文檔維護清單。

### 4. Commit 規範

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
type(scope): subject

body (可選)

footer (可選)
```

**Types**:

- `feat`: 新功能
- `fix`: Bug 修復
- `docs`: 文檔更新
- `style`: 程式碼格式調整（不影響功能）
- `refactor`: 重構（不新增功能也不修復 bug）
- `perf`: 效能改善
- `test`: 測試相關
- `build`: 建置系統或外部依賴變更
- `ci`: CI/CD 配置變更
- `chore`: 其他不影響 src 或 test 的變更

**範例**:

```bash
# 好的 commit
feat(converter): 新增歷史匯率趨勢圖

實作 25 天歷史匯率趨勢圖表，使用 Chart.js
- 新增 TrendChart 元件
- 整合 exchangeRateHistoryService
- 補充單元測試與 E2E 測試

Closes #42

# 不好的 commit
❌ update files
❌ fix bug
❌ 更新了一些東西
```

**原子化提交原則**：

1. 一個 commit 只做一件事
2. 每個 commit 都是可編譯、可測試的完整狀態
3. 可以獨立回滾而不影響其他功能

### 5. Push 與 Pull Request

```bash
# Push 到你的 fork
git push origin feature/your-feature-name

# 到 GitHub 開啟 Pull Request
```

**PR 標題格式**：與 commit message 相同

**PR 描述應包含**：

- 變更摘要
- 相關 Issue 連結（`Closes #123`）
- 測試證據（截圖、測試報告）
- 重大變更說明（Breaking Changes）
- Checklist 確認

**PR Checklist**:

- [ ] 所有測試通過 (`pnpm test`)
- [ ] 測試覆蓋率 >= 80%
- [ ] Lint 檢查通過 (`pnpm lint`)
- [ ] 格式檢查通過 (`pnpm format`)
- [ ] TypeScript 檢查通過 (`pnpm typecheck`)
- [ ] 建置成功 (`pnpm build`)
- [ ] 文檔已更新
- [ ] CHANGELOG.md 已更新（重大變更）
- [ ] 已在本地測試過

### 6. Code Review

- 等待維護者審查
- 根據 review 意見修改
- Push 更新後 PR 會自動更新

---

## 🏗️ 專案架構

### Monorepo 結構

```
app/
├── apps/
│   └── ratewise/          # 主應用程式
│       ├── src/
│       │   ├── components/    # 共用元件
│       │   ├── features/      # 功能模組
│       │   ├── services/      # API 服務
│       │   └── utils/         # 工具函式
│       └── package.json
├── docs/                  # 文檔
├── scripts/               # 自動化腳本
└── package.json           # Root package.json
```

### 程式碼組織原則

遵循 **KISS 原則** (Keep It Simple, Stupid)：

1. **函數必須短小精悍** - 一個函數只做一件事
2. **避免深層巢狀** - 超過 3 層縮排需要重構
3. **消除特殊情況** - 重新設計資料結構以移除 if/else 分支
4. **實用主義優先** - 解決實際問題，拒絕過度工程化

詳見 `LINUS_GUIDE.md` 與 `AGENTS.md` § 3。

---

## 🧪 測試指南

### 測試策略

- **單元測試**: 測試獨立函數與元件
- **整合測試**: 測試元件間互動
- **E2E 測試**: 測試完整使用者流程

### 測試檔案命名

- `*.test.ts` - 單元測試
- `*.test.tsx` - React 元件測試
- `*.e2e.ts` - E2E 測試

### 測試覆蓋率要求

| 類型     | 最低覆蓋率  |
| -------- | ----------- |
| 單元測試 | 80%         |
| 整合測試 | 70%         |
| E2E 測試 | 主流程 100% |

---

## 📝 文檔撰寫

### 程式碼註解

```typescript
// ✅ 好的註解：解釋為什麼，而非做什麼
// 使用 null-safe 檢查以避免 runtime error，因為 exchangeRates 可能包含 null
const rate = exchangeRates[code] ?? null;

// ❌ 不好的註解：重複程式碼
// 檢查 rate 是否為 null
if (rate === null) { ... }
```

### Markdown 文檔

- 使用清晰的標題結構
- 提供程式碼範例
- 包含時間戳記（使用 ISO-8601 格式）
- 標註來源（如 `[context7:source:timestamp]`）

---

## 🔒 安全性

### 安全漏洞回報

**請勿公開揭露安全漏洞**

如發現安全問題，請：

1. 透過 GitHub Security Advisories 私下回報
2. 或發送 email 給維護者
3. 等待修復後再公開

### 安全編碼原則

- 不在程式碼中硬編碼密鑰
- 不提交 `.env` 檔案
- 使用環境變數管理敏感資訊
- 遵循 OWASP Top 10 防護措施

---

## 🎯 品質門檻

所有 PR 必須通過以下檢查：

### 自動化檢查

- ✅ CI 全綠（lint + typecheck + test + build）
- ✅ 測試覆蓋率 >= 80%
- ✅ 無 TypeScript 錯誤
- ✅ 無 ESLint 錯誤

### 手動檢查

- ✅ Code review 通過
- ✅ 文檔已更新
- ✅ Build size 無顯著增加（< +10%）
- ✅ 效能無退化

---

## 💡 開發技巧

### 本地開發工作流

```bash
# 1. 同步上游變更
git fetch upstream
git rebase upstream/main

# 2. 開發與測試
pnpm dev          # 開發伺服器
pnpm test:watch   # 監聽測試

# 3. 提交前檢查
pnpm lint
pnpm typecheck
pnpm test
pnpm build

# 4. Commit
git add .
git commit -m "feat(scope): description"

# 5. Push
git push origin feature/your-feature
```

### 常見問題

**Q: 測試失敗怎麼辦？**

```bash
# 更新測試快照
pnpm test -u

# 執行單一測試
pnpm test RateWise.test.tsx

# 查看詳細錯誤
pnpm test --verbose
```

**Q: TypeScript 錯誤怎麼解？**

- 查看官方文檔（透過 `context7` 獲取最新資訊）
- 參考現有程式碼的類型定義
- 避免使用 `any`，使用具體型別

**Q: 如何除錯？**

- 使用 `logger` 工具而非 `console.log`
- 利用瀏覽器 DevTools
- 執行測試找出問題根源

---

## 🤝 行為準則

### 我們的承諾

- 尊重所有貢獻者
- 接納不同觀點
- 專注於建設性討論
- 保持專業與友善

### 不被接受的行為

- 人身攻擊或侮辱性語言
- 騷擾或歧視
- 發布他人私人資訊
- 其他不專業行為

---

## 📞 需要協助？

- **問題討論**: [GitHub Discussions](https://github.com/haotool/app/discussions)
- **Bug 回報**: [GitHub Issues](https://github.com/haotool/app/issues)
- **文檔參考**: `docs/` 目錄
- **開發指南**: `AGENTS.md`, `LINUS_GUIDE.md`
- **聯絡作者**: haotool.org@gmail.com | [Threads @azlife_1224](https://threads.net/@azlife_1224)

---

## 🙏 致謝

感謝所有貢獻者讓 RateWise 變得更好！

---

**Copyright (C) 2025 haotool. Licensed under GPL-3.0.**

**聯絡方式**: haotool.org@gmail.com | [Threads @azlife_1224](https://threads.net/@azlife_1224)
