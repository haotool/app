# 🚀 MCP 工具快速參考卡

> **建立時間**: 2026-01-07T02:45:00+08:00  
> **版本**: 1.0.0  
> **用途**: Agent 開發時的 MCP 工具快速查閱

---

## 📋 工具調用決策流程

```
任務開始 → 需要反饋? → mcp-feedback-enhanced
         → 複雜分析? → sequential-thinking
         → 技術文檔? → context7
         → 最新資訊? → WebSearch / fetch
         → 部署服務? → zeabur
         → 任務追蹤? → TodoWrite
         → 時間戳記? → time.now
```

---

## 1️⃣ mcp-feedback-enhanced

**用途**: 互動回饋收集

```typescript
// 調用格式
mcp -
  feedback -
  enhanced -
  interactive_feedback({
    project_directory: '/path/to/project',
    summary: '工作摘要（Markdown 格式）',
    timeout: 300,
  });
```

**強制時機**: 流程開始、階段完成、需要確認、任務結束前

---

## 2️⃣ sequential-thinking

**用途**: 深度思考與問題分析

```typescript
// 調用格式
sequential -
  thinking -
  sequentialthinking({
    thought: '當前思考內容',
    nextThoughtNeeded: true,
    thoughtNumber: 1,
    totalThoughts: 5,
    isRevision: false,
    needsMoreThoughts: false,
  });
```

**思考模板**:

```
Step 1: 問題定義
Step 2: 證據收集
Step 3: 假設生成
Step 4: 假設驗證
Step 5: 結論方案
```

---

## 3️⃣ context7

**用途**: 官方技術文檔查詢

```typescript
// Step 1: 解析 library ID
context7 -
  resolve -
  library -
  id({
    query: '問題描述',
    libraryName: 'react',
  });

// Step 2: 查詢文檔
context7 -
  query -
  docs({
    libraryId: '/reactjs/react.dev',
    query: 'hooks best practices',
  });
```

**來源標註**: `[context7:/org/repo:timestamp]`

---

## 4️⃣ WebSearch / fetch

**用途**: 網路搜尋與網頁內容獲取

```typescript
// 搜尋
WebSearch({
  search_term: '關鍵字 2025',
  explanation: '搜尋原因',
});

// 獲取網頁
fetch({
  url: 'https://example.com',
  max_length: 5000,
});
```

---

## 5️⃣ zeabur

**用途**: 部署服務操作

```typescript
// 常用操作
zeabur - list - regions();
zeabur - create - project({ region: 'aws-ap-northeast-1' });
zeabur - create - empty - service({ project: 'id', name: 'name' });
zeabur - upload - codebase({ service: 'id', environment: 'id', 'codebase-path': '/path' });
zeabur - bind - domain({ domain: 'app.example.com', service: 'id', environment: 'id' });
zeabur - list - deployments({ service: 'id', environment: 'id' });
```

---

## 6️⃣ TodoWrite

**用途**: 任務管理

```typescript
TodoWrite({
  todos: [{ id: 'task-1', content: '任務描述', status: 'pending' }],
  merge: true, // true=合併, false=取代
});
```

**狀態**: `pending` → `in_progress` → `completed` / `cancelled`

---

## 7️⃣ time

**用途**: 時間操作

```typescript
// 獲取當前時間
time - get_current_time({ timezone: 'Asia/Taipei' });

// 時區轉換
time -
  convert_time({
    source_timezone: 'America/New_York',
    target_timezone: 'Asia/Taipei',
    time: '14:30',
  });
```

---

## 🔧 常用 Shell 指令

```bash
# 代碼品質
pnpm typecheck          # TypeScript 檢查
pnpm lint              # ESLint 檢查
pnpm format            # Prettier 檢查
pnpm test              # 執行測試
pnpm test --coverage   # 測試覆蓋率
pnpm build             # 建置

# CI 監控
gh run list --limit 10       # 最近 CI 執行
gh pr checks <PR>            # PR 檢查狀態
gh run view <ID> --log       # CI 日誌

# 代碼搜尋
rg "pattern" --glob "*.ts"   # 搜尋模式
```

---

## 📊 效能指標標準

| 指標     | 良好    | 待改進  |
| -------- | ------- | ------- |
| LCP      | ≤ 2.5s  | ≤ 4.0s  |
| INP      | ≤ 100ms | ≤ 200ms |
| CLS      | ≤ 0.1   | ≤ 0.25  |
| 效能分數 | ≥ 90    | ≥ 50    |
| SEO 分數 | 100     | ≥ 90    |

---

## 🏆 獎懲分數

| 類型                  | 分數 |
| --------------------- | ---- |
| Context7 解決問題     | +1   |
| 修復潛在 bug          | +1   |
| 重大效能提升 (>20%)   | +2   |
| 系統性 Root Cause Fix | +3   |
| 創新解決方案          | +5   |
| 大規模優化成功        | +8   |
| 引入新 bug            | -1   |
| 過度設計              | -1   |
| Regression            | -2   |
| 生產停機              | -3   |

---

**完整文檔**: 參見 `AUTONOMOUS_AGENT_WORKFLOW.md`
