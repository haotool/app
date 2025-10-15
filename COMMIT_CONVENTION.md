# Commit 訊息規範

> **基於**: [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) + [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md)
> **版本**: 1.0.0
> **最後更新**: 2025-10-16

---

## 快速參考

### 基本格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 完整範例

```bash
feat(converter): 新增歷史匯率趨勢圖

實作 30 天歷史匯率趨勢圖表功能：
- 使用 Chart.js 繪製趨勢線
- 整合 exchangeRateHistoryService API
- 新增響應式設計支援行動裝置
- 補充單元測試與 E2E 測試覆蓋

效能優化：使用 React.memo 避免不必要的重新渲染

Closes #42
```

---

## Type（類型）

必須為以下類型之一（**小寫英文**）：

| Type       | 說明                           | 語義化版本 | 範例                                      |
| ---------- | ------------------------------ | ---------- | ----------------------------------------- |
| `feat`     | 新功能                         | MINOR      | `feat(api): 新增匯率 API 快取機制`        |
| `fix`      | 錯誤修復                       | PATCH      | `fix(converter): 修正小數點精度問題`      |
| `docs`     | 文檔變更                       | -          | `docs(readme): 更新安裝步驟說明`          |
| `style`    | 程式碼格式調整（不影響邏輯）   | -          | `style(eslint): 套用 Prettier 格式化`     |
| `refactor` | 重構（不新增功能也不修復錯誤） | -          | `refactor(utils): 簡化貨幣格式化邏輯`     |
| `perf`     | 效能改善                       | PATCH      | `perf(chart): 使用虛擬化列表提升渲染效能` |
| `test`     | 測試相關                       | -          | `test(converter): 新增邊界條件測試`       |
| `build`    | 建置系統或外部依賴變更         | -          | `build(deps): 升級 React 至 19.0.0`       |
| `ci`       | CI/CD 配置變更                 | -          | `ci(github): 新增 Lighthouse CI 檢查`     |
| `chore`    | 其他不影響 src 或 test 的變更  | -          | `chore(git): 更新 .gitignore 規則`        |
| `revert`   | 回復先前的 commit              | -          | `revert: 回復 feat(api): 新增快取機制`    |

### Type 選擇指南

```
新增功能 → feat
修復 bug → fix
改善效能 → perf
重構程式碼（無功能變更） → refactor
僅調整格式（空白、縮排） → style
更新文檔 → docs
新增/修改測試 → test
依賴或建置工具變更 → build
CI/CD 相關 → ci
其他雜項 → chore
```

---

## Scope（範圍）

**可選**，用括號包住，表示影響的模組或元件（**小寫英文**）。

### 常用 Scope

| Scope       | 說明       | 範例                              |
| ----------- | ---------- | --------------------------------- |
| `converter` | 匯率轉換器 | `feat(converter): 新增多幣別模式` |
| `api`       | API 服務層 | `fix(api): 修正錯誤處理邏輯`      |
| `ui`        | UI 元件    | `style(ui): 調整按鈕間距`         |
| `a11y`      | 無障礙性   | `fix(a11y): 新增 ARIA 標籤`       |
| `i18n`      | 國際化     | `feat(i18n): 新增英文語系`        |
| `deps`      | 依賴管理   | `build(deps): 更新 Vite 至 6.0`   |
| `ci`        | CI/CD      | `ci(github): 優化測試工作流`      |
| `config`    | 配置檔案   | `chore(config): 更新 ESLint 規則` |

### Scope 命名規則

- 使用小寫英文，單詞間用 `-` 連接
- 使用現有的 scope，避免創造新名稱
- 如果影響全域，可省略 scope

---

## Subject（主旨）

**必填**，簡短描述變更內容（**中文**）。

### 規則

✅ **必須**：

- 使用命令式、現在式（新增、修正、更新）
- 第一個字不大寫
- 結尾不加句號（。）
- 限制在 **70 字元**以內

❌ **禁止**：

- 過去式（新增了、修正了）
- 句子式（這個 commit 新增了...）
- 過於籠統（更新檔案、修正問題）

### 好壞範例

| ❌ 不好          | ✅ 好                                |
| ---------------- | ------------------------------------ |
| `修正了一個 bug` | `修正貨幣轉換時的精度錯誤`           |
| `更新檔案`       | `更新 API 端點為最新版本`            |
| `新增功能`       | `新增快速金額按鈕（100/1000/10000）` |
| `Fix bug.`       | `修正日期選擇器無法選取未來日期`     |

---

## Body（本文）

**可選**，詳細說明變更的動機與實作細節（**中文**）。

### 何時需要 Body

- `feat` 和 `fix` 類型建議加上 body
- 需要解釋「為什麼」這樣做
- 實作細節較複雜時

### 格式要求

- 與 subject 之間空一行
- 使用條列式說明（`-` 或數字）
- 每行限制 **100 字元**
- 說明動機、影響範圍、技術選擇

### 範例

```
feat(api): 實作 API 請求重試機制

為提升穩定性，新增自動重試邏輯：
- 最多重試 3 次，間隔 1/2/4 秒（指數退避）
- 僅重試 5xx 錯誤與網路逾時
- 使用 axios-retry 庫實作
- 新增 Sentry 追蹤重試次數

效能影響：重試會增加最多 7 秒延遲，但顯著降低錯誤率
```

---

## Footer（頁尾）

**可選**，包含 Breaking Changes、關閉 Issue、其他元資料。

### 1. Breaking Changes（重大變更）

**必須**標註可能破壞現有功能的變更。

#### 格式

```
BREAKING CHANGE: <簡述>

<詳細說明>
<遷移指南>
```

#### 範例

```
feat(api): 統一錯誤回應格式

BREAKING CHANGE: API 錯誤回應結構變更

舊格式：
{ error: "錯誤訊息" }

新格式：
{
  code: "ERROR_CODE",
  message: "錯誤訊息",
  details: {}
}

遷移指南：
更新錯誤處理邏輯，改為讀取 response.message 而非 response.error
```

#### 替代標記

可在 type 後加 `!` 表示 Breaking Change：

```
feat(api)!: 統一錯誤回應格式
```

### 2. 關閉 Issue

使用關鍵字自動關閉 Issue：

```
Closes #123
Fixes #456
Resolves #789
```

多個 Issue：

```
Closes #123, #456
Fixes #789, #101
```

### 3. 其他頁尾

```
Reviewed-by: @username
Refs: #123
Co-authored-by: Name <email@example.com>
```

---

## 完整範例

### 範例 1：新功能

```
feat(converter): 新增歷史匯率趨勢圖

實作 30 天歷史匯率趨勢圖表功能：
- 使用 lightweight-charts 繪製趨勢線
- 整合 exchangeRateHistoryService API
- 新增 loading skeleton 提升感知效能
- 支援行動裝置觸控縮放
- 補充單元測試與 E2E 測試

效能優化：
- 使用 React.lazy 延遲載入圖表元件
- 快取歷史資料於 localStorage（24 小時）

Closes #42
```

### 範例 2：錯誤修復

```
fix(a11y): 修正下拉選單缺少 ARIA 標籤

修復無障礙性問題以符合 WCAG 2.1 AA 標準：
- 為貨幣選擇下拉選單新增 aria-label
- 為交換按鈕新增 aria-label="交換來源與目標貨幣"
- 為可滾動區域新增 tabindex="0" 支援鍵盤導航

測試：
- Axe-core 掃描無 Critical 違規
- Playwright 無障礙性測試通過

Fixes #128
```

### 範例 3：重大變更

```
refactor(api)!: 移除已廢棄的 v1 API 端點

BREAKING CHANGE: 移除 /api/v1/rates 端點

已於 v2.0.0 標記為 deprecated 的 v1 API 端點已完全移除。

影響範圍：
- GET /api/v1/rates → 使用 /api/v2/exchange-rates
- POST /api/v1/convert → 使用 /api/v2/convert

遷移指南：
請更新所有 API 請求至 v2 端點，回應格式保持相容。
詳見：https://docs.example.com/api/v2-migration

Closes #256
```

### 範例 4：效能改善

```
perf(chart): 使用虛擬化列表優化多幣別渲染

多幣別模式顯示 100+ 貨幣時出現卡頓，使用虛擬化列表改善：
- 整合 react-window 實作虛擬滾動
- 僅渲染可見區域 ±3 項目
- 新增 React.memo 避免不必要的重新渲染

效能改善：
- 首次渲染時間：320ms → 45ms（提升 86%）
- 記憶體使用：120MB → 35MB（降低 71%）
- Lighthouse Performance：78 → 94

測試：
- Chrome DevTools Performance 面板驗證
- 100 貨幣列表滾動流暢度達 60fps

Refs: #189
```

### 範例 5：文檔更新

```
docs(setup): 更新 Docker 部署文檔

補充 Docker Compose 部署步驟：
- 新增環境變數配置說明
- 補充健康檢查端點資訊
- 新增常見問題排除指南
- 更新依賴版本資訊

參考來源：
- [context7:/docker/docs:2025-10-16]
```

---

## 原子化提交原則

### 什麼是原子化提交？

每個 commit 只做**一件事**，且該 commit 本身是完整、可編譯、可測試的狀態。

### 為什麼重要？

✅ **易於回滾**：可單獨回復某個變更而不影響其他功能
✅ **易於 Code Review**：審查者可快速理解單一變更
✅ **清晰歷史**：Git 歷史易讀易查
✅ **自動化 CHANGELOG**：可自動生成語義化版本號與更新日誌

### 實踐方法

#### ❌ 不好的做法

```bash
# 一個 commit 做多件事
git commit -m "feat: 新增趨勢圖、修正精度問題、更新文檔"

# 非原子化：部分測試失敗
git commit -m "feat(api): 新增快取功能（測試待補）"
```

#### ✅ 好的做法

```bash
# 分成 3 個獨立 commit
git commit -m "feat(chart): 新增歷史匯率趨勢圖"
git commit -m "fix(converter): 修正小數點精度問題"
git commit -m "docs(readme): 更新趨勢圖使用說明"
```

### 提交檢查清單

在執行 `git commit` 前確認：

- [ ] 只解決一個問題或新增一個功能
- [ ] 程式碼可成功編譯（`pnpm build`）
- [ ] 所有測試通過（`pnpm test`）
- [ ] Lint 檢查通過（`pnpm lint`）
- [ ] 類型檢查通過（`pnpm typecheck`）
- [ ] 相關文檔已同步更新
- [ ] Commit message 符合本規範

---

## 工具與自動化

### 1. Commitlint

自動驗證 commit message 格式。

#### 安裝

```bash
pnpm add -D @commitlint/cli @commitlint/config-conventional
```

#### 配置

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'subject-case': [0], // 允許中文主旨
    'body-max-line-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 100],
  },
};
```

### 2. Husky + lint-staged

Commit 前自動檢查。

#### 安裝

```bash
pnpm add -D husky lint-staged
npx husky init
```

#### 配置

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.md": ["prettier --write"]
  }
}
```

```bash
# .husky/commit-msg
npx --no -- commitlint --edit $1
```

```bash
# .husky/pre-commit
npx lint-staged
```

### 3. Commitizen

互動式產生 commit message。

#### 安裝

```bash
pnpm add -D commitizen cz-conventional-changelog
```

#### 使用

```bash
# 取代 git commit
pnpm cz
```

---

## 語義化版本（Semantic Versioning）

Commit type 自動對應版本號變更：

| Commit Type       | 版本變更              | 範例         |
| ----------------- | --------------------- | ------------ |
| `feat`            | MINOR (0.1.0 → 0.2.0) | 新功能       |
| `fix`             | PATCH (0.1.0 → 0.1.1) | Bug 修復     |
| `perf`            | PATCH (0.1.0 → 0.1.1) | 效能改善     |
| `BREAKING CHANGE` | MAJOR (0.1.0 → 1.0.0) | 重大變更     |
| 其他              | -                     | 不影響版本號 |

### 自動化流程

1. Commit 使用規範格式
2. CI/CD 分析 commit 歷史
3. 自動決定版本號（使用 `semantic-release`）
4. 自動產生 CHANGELOG.md
5. 自動建立 Git tag
6. 自動發布至 npm / GitHub Releases

---

## FAQ

### Q1: 主旨可以用中文嗎？

**A**: **可以**。本專案主旨使用中文，但 type 和 scope 必須用英文。

### Q2: 一個 commit 可以有多個 type 嗎？

**A**: **不行**。每個 commit 只能有一個 type。如需多個變更，請分成多個 commit。

### Q3: Scope 必填嗎？

**A**: **選填**。如果變更影響全域或難以歸類，可省略 scope。

### Q4: Breaking Change 一定要在 footer 寫嗎？

**A**: **不一定**。可以在 type 後加 `!`（如 `feat!:`），但建議兩者都加以提高可見度。

### Q5: 如何處理已經 push 的錯誤 commit？

**A**:

- 如果是最新的 commit：`git commit --amend`
- 如果已被他人 pull：建立新 commit 修正，不要 force push
- 如果是歷史 commit：`git rebase -i` 或建立 `revert` commit

### Q6: Merge commit 需要遵循規範嗎？

**A**: **需要**。使用 squash merge 時，PR 標題會成為 commit message，需符合規範。

---

## 參考資源

### 官方規範

- [Conventional Commits v1.0.0](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md)
- [Semantic Versioning 2.0.0](https://semver.org/)

### 工具文檔

- [commitlint](https://commitlint.js.org/)
- [Husky](https://typicode.github.io/husky/)
- [lint-staged](https://github.com/lint-staged/lint-staged)
- [Commitizen](https://github.com/commitizen/cz-cli)
- [semantic-release](https://semantic-release.gitbook.io/)

### 延伸閱讀

- [如何寫好 Git Commit Message](https://blog.louie.lu/2017/03/21/%E5%A6%82%E4%BD%95%E5%AF%AB%E4%B8%80%E5%80%8B-git-commit-message/)
- [Commit Message 和 Change Log 編寫指南](https://www.ruanyifeng.com/blog/2016/01/commit_message_change_log.html)

---

**版本歷史**:

- v1.0.0 (2025-10-16): 初始版本，基於 Conventional Commits v1.0.0 + Angular Guidelines
