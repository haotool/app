# AGENT 操作守則與工具說明

> **角色**: 自動化代理 (Agents) 負責重複性檢查、端到端驗證與部署流程觸發。本文檔說明所有可用工具與工作流程。

---

## 1. 可用 MCP 工具

### Context7 MCP (官方文件檢索)

```bash
# 安裝
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

**用途**:

- 檢索 React, Vite, TypeScript 等官方文件
- 獲取最新 API 範例與最佳實踐

**工作流**:

```bash
# 1. 解析 library ID
resolve-library-id --libraryName "React"

# 2. 取得文件
get-library-docs --context7CompatibleLibraryID "/reactjs/react.dev" --topic "hooks"
```

---

### Grep MCP (GitHub 程式碼搜尋)

```bash
# 安裝
claude mcp add --transport http grep https://mcp.grep.app
```

**用途**:

- 搜尋真實專案程式碼範例
- 研究特定模式在產業的實作

---

### Spec-Workflow MCP (規格文件管理)

```bash
# 安裝
claude mcp add spec-workflow-mcp -s user -- npx -y spec-workflow-mcp@latest
```

**用途**:

- 維護 `docs/specs/*` 需求與設計文件
- 追蹤功能實作進度

**工作流**:

```bash
specs-workflow --action init --featureName "匯率API整合" --introduction "整合即時匯率API"
specs-workflow --action check  # 檢查當前狀態
specs-workflow --action complete_task --taskNumber "1"  # 完成任務
```

---

### Puppeteer MCP (瀏覽器自動化)

**用途**:

- E2E 測試自動化
- UI 截圖與視覺回歸測試
- 效能指標收集

**典型流程**:

```typescript
// 1. 啟動瀏覽器
browser_navigate --url "http://localhost:4173"

// 2. 截圖
browser_take_screenshot --filename "homepage.png"

// 3. 互動測試
browser_click --element "單幣別" --ref "[data-testid='single-mode']"

// 4. 驗證
browser_snapshot  // 取得 DOM 結構驗證
```

---

## 2. 工作流程

### 初始建置流程

```bash
# 1. 同步需求
# 以 docs/SETUP.md 與 docs/dev/*.md 為準

# 2. 安裝依賴
pnpm install --frozen-lockfile

# 3. 類型檢查
pnpm typecheck

# 4. 測試
pnpm test --coverage

# 5. 建置
pnpm build

# 6. E2E 測試 (Puppeteer)
pnpm preview  # 啟動 preview server
# 使用 Puppeteer MCP 執行測試
```

### 品質檢查流程

```bash
# 1. Pre-commit hooks
pre-commit run --all-files

# 2. Lint
pnpm lint

# 3. Format check
pnpm format

# 4. 安全掃描
pnpm audit
```

### Docker 建置流程

```bash
# 1. 建置映像
docker build -t ratewise:latest .

# 2. 執行容器
docker run -p 8080:80 ratewise:latest

# 3. 健康檢查 (使用 Puppeteer MCP)
browser_navigate --url "http://localhost:8080"
browser_take_screenshot --filename "docker-health-check.png"
```

---

## 3. 開發哲學與設計原則

### KISS 原則 - Keep It Simple, Stupid

遵循 Linus Torvalds 的核心哲學，確保程式碼簡潔且易於維護：

**核心準則**：

1. **"好品味" (Good Taste)**
   - 消除特殊情況永遠優於增加條件判斷
   - 重新設計資料結構以移除 if/else 分支
   - 10 行帶判斷的程式碼 → 4 行無條件分支

2. **實用主義優先**
   - 解決實際問題，而非假想的威脅
   - 拒絕過度工程化與"理論完美"的方案
   - 程式碼為現實服務，不是為論文服務

3. **簡潔執念**
   - 函數必須短小精悍，只做一件事
   - 超過 3 層縮排就是警訊，需要重構
   - 複雜性是萬惡之源

**Linus 三問**（開始任何開發前）：

```text
1. "這是個真問題還是臆想出來的？" - 拒絕過度設計
2. "有更簡單的方法嗎？" - 永遠尋找最簡方案
3. "會破壞什麼嗎？" - 向後相容是鐵律
```

**實踐範例**：

```typescript
// ❌ 糟糕：特殊情況處理
function deleteNode(list, node) {
  if (node === list.head) {
    list.head = node.next;
  } else {
    let prev = list.head;
    while (prev.next !== node) {
      prev = prev.next;
    }
    prev.next = node.next;
  }
}

// ✅ 好品味：消除特殊情況
function deleteNode(indirect, node) {
  *indirect = node.next;
}
```

### 最小可行方案 (MVP First)

- ✅ 先實作核心功能，驗證可行性
- ✅ 避免提前優化與複雜架構
- ✅ 確保每個 commit 都是可編譯、可測試的完整狀態
- ❌ 禁止在 MVP 階段引入微服務、複雜設計模式

---

## 4. 提交規範

### Commit Message Format

```
type(scope): subject

body

footer
```

**Types**:

- `feat`: 新功能
- `fix`: 修復 bug
- `docs`: 文件變更
- `style`: 格式調整 (不影響程式碼)
- `refactor`: 重構
- `test`: 測試相關
- `chore`: 建置工具或輔助工具變更

**範例**:

```
feat(converter): 新增多幣別即時換算功能

- 實作 MultiConverter 元件
- 新增 useCurrencyConverter hook
- 補齊單元測試

Closes #123
```

### 原子化提交原則

每個 commit 必須遵循以下原則：

1. **單一職責**: 一個 commit 只解決一個問題或實現一個功能
2. **完整性**: 每個 commit 都應該是可編譯、可測試的完整狀態
3. **可回溯性**: 每個 commit 都應該能獨立回滾而不影響其他功能
4. **專業描述**: 使用清晰、專業的語言描述變更內容

**好的範例**:

```bash
fix(types): 修正 useCurrencyConverter 的 TypeScript 類型定義

- 更新 exchangeRates 類型為 Record<string, number | null>
- 增強 getRate 函數的 null 檢查邏輯
- 遵循 TypeScript 官方最佳實踐

Fixes #12
```

**不好的範例**:

```bash
# ❌ 過於簡略
fix: 修bug

# ❌ 包含多個不相關的變更
feat: 新增功能並修復bug還有更新文檔

# ❌ 非專業描述
update: 改了一些東西
```

### PR 檢查清單

- [ ] 需求連結 (Issue #)
- [ ] CI 全綠
- [ ] 測試證據 (coverage report)
- [ ] E2E 測試通過 (Puppeteer 截圖)
- [ ] Build size 無顯著增加
- [ ] 文件已更新

---

## 5. 安全守則

### 分層防禦原則

- **Cloudflare 層**: WAF, DDoS防護, Rate Limiting, 安全標頭
- **應用層**: Input validation, XSS 防護, Error Boundary

### 禁止事項

❌ 在應用程式內重複設定 Cloudflare 已處理的安全標頭
❌ 處理金流或密鑰 (應由環境變數管理)
❌ 提交 `.env` 檔案到版本控制

### 異常處理

- 發現可疑流量 → 標記 `security` 並通知維運
- 建置失敗 → 收集 log + `pnpm env info` 提交 Issue
- 外部服務失敗 → 最多重試 3 次 (間隔 60s)

---

## 6. 文檔結構

### 核心指南 (專案根目錄)

- `AGENTS.md` (本文件) - Agent 操作守則與工具說明
- `LINUS_GUIDE.md` - 開發哲學與程式碼品質準則
- `README.md` - 專案說明與快速開始

### 部署與設定 (docs/)

- `SETUP.md` - MVP 快速流程與環境設定
- `DEPLOYMENT.md` - Docker 部署指南
- `ZEABUR_DEPLOYMENT.md` - Zeabur 平台部署指南
- `SECURITY_BASELINE.md` - 安全基線與責任界面

### 功能文檔 (docs/)

- `HISTORICAL_RATES_IMPLEMENTATION.md` - 歷史匯率功能實施指南
- `QUICK_START_HISTORICAL_RATES.md` - 歷史匯率快速開始
- `EXCHANGE_RATE_UPDATE_STRATEGIES.md` - 匯率更新策略比較

### 開發參考 (docs/dev/)

- `CITATIONS.md` - 權威來源清單與技術引用
- `DEPENDENCY_UPGRADE_PLAN.md` - 依賴升級策略
- `ARCHITECTURE_BASELINE.md` - 架構藍圖與分層準則
- `CHECKLISTS.md` - 品質檢查清單

---

## 7. 常用指令速查

### 開發

```bash
pnpm dev                    # 啟動開發伺服器
pnpm build                  # 生產建置
pnpm preview                # 預覽建置結果
```

### 品質

```bash
pnpm typecheck              # TypeScript 檢查
pnpm lint                   # ESLint 檢查
pnpm format                 # Prettier 格式化
pnpm test                   # 執行測試
pnpm test --coverage        # 測試覆蓋率報告
```

### Monorepo

```bash
pnpm -r build               # 建置所有 workspace
pnpm --filter @app/ratewise dev    # 執行特定 workspace
pnpm -w add -D <package>    # Root 安裝 dev dependency
```

### Docker

```bash
docker build -t ratewise:latest .
docker run -p 8080:80 ratewise:latest
docker logs <container-id>
```

---

## 8. 當前任務狀態

### ✅ 已完成 (Phase 0 - MVP)

- ✅ 測試覆蓋率 ≥80% (目前 89.8%)
- ✅ CI/CD Pipeline (GitHub Actions)
- ✅ 觀測性 (Logger + Error Boundary)
- ✅ Docker 化部署
- ✅ 元件拆分 (RateWise.tsx 已模組化)
- ✅ 工程工具鏈 (Husky + lint-staged)
- ✅ TypeScript 嚴格化
- ✅ 安全標頭配置
- ✅ 歷史匯率功能 (30 天資料追蹤)

### 🔄 進行中 (Phase 1 - 優化)

- [ ] E2E 測試自動化 (Puppeteer)
- [ ] Vite Build 最佳化 (vendor chunk 分離)
- [ ] 依賴升級 (Vite 7、Tailwind 4)

### 📋 規劃中 (Phase 2 - 進階功能)

- [ ] 匯率趨勢圖 (使用歷史資料)
- [ ] Service Worker 快取
- [ ] PWA 支援

---

## 9. 故障排除

### 建置失敗

```bash
# 1. 清除快取
pnpm store prune
rm -rf node_modules
pnpm install

# 2. 檢查環境
node -v    # 應為 20+
pnpm -v    # 應為 9+

# 3. 檢查類型錯誤
pnpm typecheck
```

### 測試失敗

```bash
# 1. 更新測試快照
pnpm test -u

# 2. 執行單一測試
pnpm test RateWise.test.tsx

# 3. 檢查覆蓋率
pnpm test --coverage
```

### Docker 建置失敗

```bash
# 1. 檢查 Dockerfile 語法
docker build --no-cache -t ratewise:latest .

# 2. 進入容器除錯
docker run -it ratewise:latest sh

# 3. 檢查日誌
docker logs <container-id>
```

---

## 10. 品質門檻

每個 PR 必須通過:

- ✅ CI 全綠 (lint + typecheck + test + build)
- ✅ Test coverage ≥80%
- ✅ Build size <500KB
- ✅ E2E 測試通過
- ✅ Code review 通過

---

## 11. 聯絡與支援

- **問題回報**: 建立 Issue 並標記適當 label
- **安全問題**: 標記 `security` 並通知維運
- **文檔問題**: 參考 `docs/dev/*.md`
- **工具問題**: 參考 [LINUS_GUIDE.md](./LINUS_GUIDE.md)

---

> **總結**: Agent 的任務是保持流程可靠並回報結果，不參與需求判斷、不做超出授權範圍的操作。所有操作依照本文檔與 `docs/dev/` 文檔執行。

**最後更新**: 2025-10-10
**版本**: v1.1 (整合 MCP 工具與完整工作流)
