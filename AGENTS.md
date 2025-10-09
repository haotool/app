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

## 3. 提交規範

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

### PR 檢查清單

- [ ] 需求連結 (Issue #)
- [ ] CI 全綠
- [ ] 測試證據 (coverage report)
- [ ] E2E 測試通過 (Puppeteer 截圖)
- [ ] Build size 無顯著增加
- [ ] 文件已更新

---

## 4. 安全守則

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

## 5. 文檔結構

### 產出文檔 (docs/dev/)

- ✅ `CITATIONS.md` - 權威來源清單 (17 筆)
- ✅ `TECH_DEBT_AUDIT.md` - 技術債總報告
- ✅ `REFACTOR_PLAN.md` - 重構路線圖
- ✅ `DEPENDENCY_UPGRADE_PLAN.md` - 依賴升級策略
- ✅ `ARCHITECTURE_BASELINE.md` - 架構藍圖
- ✅ `CHECKLISTS.md` - 品質檢查清單

### 安全文檔 (docs/)

- ✅ `SECURITY_BASELINE.md` - 安全基線與責任界面

### 專案根文檔

- `AGENTS.md` (本文件) - Agent 操作指南
- `LINUS_GUIDE.md` - 技術債掃描規範

---

## 6. 常用指令速查

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

## 7. 待辦事項 (根據 TECH_DEBT_AUDIT.md)

### P0 (阻擋上線)

- [ ] 補齊測試 (目標覆蓋率 ≥80%)
- [ ] 建立 CI/CD Pipeline
- [ ] 補齊觀測性 (Logger + Error Boundary)
- [ ] 建立 Dockerfile

### P1 (高優先級)

- [ ] 拆分 RateWise.tsx (586行 → 5個元件)
- [ ] 補齊工程工具鏈 (Husky + lint-staged)
- [ ] 建立 E2E 測試 (Puppeteer)

### P2 (中優先級)

- [ ] TypeScript 嚴格化
- [ ] Vite Build 最佳化
- [ ] 依賴鎖版策略
- [ ] 安全標頭 (Cloudflare 設定)

### P3 (低優先級)

- [ ] 補齊文檔 (README, CONTRIBUTING)
- [ ] PostCSS ESM 化
- [ ] Tailwind 字型 fallback

---

## 8. 故障排除

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

## 9. 品質門檻

每個 PR 必須通過:

- ✅ CI 全綠 (lint + typecheck + test + build)
- ✅ Test coverage ≥80%
- ✅ Build size <500KB
- ✅ E2E 測試通過
- ✅ Code review 通過

---

## 10. 聯絡與支援

- **問題回報**: 建立 Issue 並標記適當 label
- **安全問題**: 標記 `security` 並通知維運
- **文檔問題**: 參考 `docs/dev/*.md`
- **工具問題**: 參考 [LINUS_GUIDE.md](./LINUS_GUIDE.md)

---

> **總結**: Agent 的任務是保持流程可靠並回報結果，不參與需求判斷、不做超出授權範圍的操作。所有操作依照本文檔與 `docs/dev/` 文檔執行。

**最後更新**: 2025-10-10
**版本**: v1.1 (整合 MCP 工具與完整工作流)
