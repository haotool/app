# Agent 工作流 Prompt 集合

**建立時間**: 2025-11-07T13:28:58+08:00  
**維護者**: RateWise Team  
**版本**: 1.0.0

---

## 📚 Prompt 清單

### 1. 🔒 Ultrathink Pro｜資安檢測工作流

**檔案**: `ultrathink_pro_security_workflow.md`

**用途**: LLM 專案上線前智能資安檢測

**核心功能**:

- 自動技術棧識別
- 零信任原則檢測
- 十大類別安全掃描（憑證、XSS、SQLi、Prompt Injection 等）
- 智能旗標系統（按需觸發）
- 分級報告產出

**適用場景**:

- 專案上線前安全審查
- CI/CD Pipeline 整合
- 定期安全掃描
- 合規性檢查

**啟動指令**:

```
請執行 Ultrathink Pro 資安檢測。
```

---

### 2. 🚀 Lighthouse Pro｜效能優化工作流

**檔案**: `lighthouse_optimization_workflow.md`

**用途**: 專案效能優化智能檢測與實施

**核心功能**:

- 自動 Lighthouse 基準測試
- Core Web Vitals 優化（LCP、CLS、TBT）
- 圖片優化（sharp + 響應式圖片）
- 程式碼分割與 Tree Shaking
- 快取策略優化
- 渲染阻塞消除

**適用場景**:

- 效能優化需求
- Lighthouse 分數提升
- Core Web Vitals 達標
- 使用者體驗改善

**啟動指令**:

```
請執行 Lighthouse Pro 效能優化檢測。
```

---

## 🎯 設計原則

### Linus Torvalds 實用主義

所有 prompt 遵循 Linus 三問：

1. **"這是個真問題還是臆想出來的？"**
   - 基於實際數據（Lighthouse 報告、安全掃描結果）
   - 拒絕過度設計

2. **"有更簡單的方法嗎？"**
   - 優先使用業界標準工具
   - 不重新發明輪子
   - 原生功能優先

3. **"會破壞什麼嗎？"**
   - 確保向後相容
   - 功能完整性保持
   - 可測量、可驗證、可回滾

---

## 🔧 技術架構

### 共同特性

**智能適應機制**:

- 自動專案規模評估（Small/Medium/Large）
- 旗標系統（按需觸發檢測/優化）
- 分級報告產出

**工具整合**:

- Context7 MCP（動態查詢權威文檔）
- Fetch MCP（搜尋最新最佳實踐）
- 自動工具安裝（Gitleaks、sharp、Lighthouse）

**報告標準**:

- 統一記錄格式
- 嚴重度分級（Critical/High/Medium/Low）
- PR 與 Commit 規範
- Todo 與甘特圖生成

---

## 📊 使用統計

### Lighthouse Pro 實戰案例

**專案**: RateWise 匯率轉換器

**優化成果**:
| 指標 | 優化前 | 優化後 | 改善 |
|------|--------|--------|------|
| 效能分數 | 72 | 95 | +32% |
| LCP | 9.8s | 2.1s | -78% |
| 圖片大小 | 1.4MB | 3.6KB | -99.7% |

**執行時間**: 2 小時（含測試驗證）

**產出**:

- 54 個優化圖片（AVIF/WebP/PNG）
- 3 份詳細報告
- 1 個自動化腳本
- 完整實施計畫

---

## 🚀 快速開始

### 1. 安裝 MCP 工具

```bash
# Context7 MCP
claude mcp add --transport http context7 https://mcp.context7.com/mcp

# Fetch MCP（如果需要）
# 通常已內建
```

### 2. 選擇適合的 Prompt

**資安檢測**:

```bash
# 複製 ultrathink_pro_security_workflow.md 內容
# 貼到 Claude/Cursor 並執行
```

**效能優化**:

```bash
# 複製 lighthouse_optimization_workflow.md 內容
# 貼到 Claude/Cursor 並執行
```

### 3. 執行檢測

Agent 會自動：

1. 初始化環境
2. 識別技術棧
3. 執行檢測/優化
4. 產出報告
5. 生成實施計畫

---

## 📖 文檔結構

```
docs/prompt/
├── README.md                                    # 本文檔
├── ultrathink_pro_security_workflow.md          # 資安檢測工作流
└── lighthouse_optimization_workflow.md          # 效能優化工作流
```

---

## 🔄 更新記錄

### v1.0.0 (2025-11-07)

**新增**:

- ✅ Lighthouse Pro 效能優化工作流
- ✅ 圖片優化自動化（sharp + responsive images）
- ✅ Core Web Vitals 優化策略
- ✅ Linus 三問驗證機制

**改進**:

- ✅ 統一報告格式
- ✅ 智能旗標系統
- ✅ 分級優化策略

---

## 🤝 貢獻指南

### 新增 Prompt

1. 遵循現有格式結構
2. 包含 Linus 三問驗證
3. 提供實戰案例
4. 記錄權威來源

### 格式要求

```markdown
# 🎯 [名稱]｜[用途]

## 1) 角色定義

[Agent 角色與能力描述]

## 2) 智能檢測策略

[規模評估與旗標系統]

## 3) 執行流程

[詳細步驟]

## 4) 標準記錄格式

[統一格式]

## 5) 觸發標籤系統

[標籤定義]

## 6) 嚴重度分級標準

[分級規則]

## 7) PR 與 Commit 規範

[規範說明]

## 8) 驗證與完成

[檢查清單]

## 9) 啟動指令

[執行指令]
```

---

## 📞 支援

**問題回報**: 建立 Issue 並標記 `prompt` label  
**功能建議**: 建立 Issue 並標記 `enhancement` label  
**文檔問題**: 建立 Issue 並標記 `documentation` label

---

## 📜 授權

本專案採用 MIT 授權。詳見 [LICENSE](../../LICENSE)。

---

**總結**: 這些 prompt 是經過實戰驗證的 Agent 工作流，遵循 Linus Torvalds 實用主義原則，確保簡單、直接、有效。適用於任何支援 MCP 的 AI 開發工具。
