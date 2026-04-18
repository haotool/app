# 041 — Brand Rename SOP（品牌改名標準作業流程）

| 欄位      | 內容                                         |
| --------- | -------------------------------------------- |
| 文件性質  | 長期決策 / 工程 SOP                          |
| 適用對象  | RateWise 應用程式品牌名稱（`shortName`）改名 |
| 文件狀態  | Active                                       |
| 生效日期  | 2026-04-18                                   |
| 上位文件  | `CLAUDE.md`、`AGENTS.md`                     |
| SSOT 參照 | `apps/ratewise/src/config/app-info.ts`       |

## 0. 背景

RateWise 與其他產品撞名，未來可能需要更換品牌。為降低改名成本與風險，已完成：

1. **顯示品牌 SSOT 收斂**：所有 UI / SEO / metadata 文案皆從 `APP_INFO.shortName` 與 `APP_INFO.subtitle` 衍生
2. **技術識別符 stable policy**：URL path、storage keys、package name、目錄名稱定為 permanent identifier，與品牌 rename 解耦
3. **Drill 工具**：`scripts/rename-drill.mjs` 自動驗證 SSOT 散播完整性
4. **靜態哨兵**：`build-scripts.test.ts` 防止新增程式碼硬寫品牌字面值

本文件記錄改名時的標準步驟。

## 1. 改名分層（Layered Rename Model）

| 層級 | 範圍                                                | 改名成本 | 對使用者影響        |
| ---- | --------------------------------------------------- | -------- | ------------------- |
| L1   | Display brand（`shortName`、`subtitle`）            | 極低     | 高（品牌可見）      |
| L2   | 內部符號（component / type 名稱）                   | 中       | 零                  |
| L3   | 技術識別符（package、目錄、URL path、storage keys） | 高       | 高（破壞性）        |
| L4   | 對外契約（domain、social handle、email）            | 極高     | 極高（含 SEO 損失） |

**核心原則：L1 與 L3/L4 解耦處理。**多數情境只需 L1，L3/L4 視為破壞性升級。

## 2. SOP 步驟

### Phase 0 — 決策鎖定（半天）

- [ ] 新 `shortName` 定稿
  - [ ] 確認商標 / App Store 名稱沒有衝突
  - [ ] 確認 `BRAND_SHORT_NAME` 字串不含 regex 特殊字元（避免測試需要 escape）
- [ ] URL 策略決定：
  - **A（推薦）**：保留 `/ratewise/` 作為 technical codename，不動 URL
  - **B**：換 `/<newname>/`，需走 Phase 4
- [ ] 開 issue 追蹤改名工作

### Phase 1 — Display 品牌切換（同一個 PR，單日完成）

```bash
cd apps/ratewise

# 1. 跑 drill 確認 SSOT 完整
node scripts/rename-drill.mjs

# 2. 改 SSOT
# 編輯 src/config/app-info.ts，僅改：
#   const BRAND_SHORT_NAME = 'NewName';
#   （subtitle 視需求一同改）

# 3. 更新 canary 測試的期望值
# 編輯 src/config/__tests__/app-info.test.ts
# 將 'RateWise' / 'RateWise 匯率好工具' 改為新值

# 4. 重跑 drill 確認新品牌散播完整
node scripts/rename-drill.mjs

# 5. 重新 build + 驗證
pnpm build:ratewise
pnpm typecheck
pnpm test

# 6. 寫 changeset（minor bump，使用者可感知品牌變更）
pnpm changeset
```

**Phase 1 PR 必含**：

- `app-info.ts` 改動
- `app-info.test.ts` canary 更新
- changeset entry（minor）
- 重新 build 後的 `public/*` 產出物

**Phase 1 不含**：

- 任何目錄/檔案 rename
- 任何 URL 變更
- 任何 storage key 變更

### Phase 2 — 對外曝光同步（1-2 週）

| 項目                          | 動作                               | 負責人 |
| ----------------------------- | ---------------------------------- | ------ |
| OG share image                | 重生成 jpg + cache-bust query      |        |
| App Store / Play Store 名稱   | 送審改名（預留 7 天）              |        |
| Social handles / email sig    | 手動更新                           |        |
| Cloudflare Pages project name | dashboard label 更新（不影響 URL） |        |
| GA4 property name             | dashboard label 更新               |        |
| GSC verification              | 不需動作（domain 未變）            |        |

### Phase 3 — Technical refactor（**可選，不急，獨立 PR**）

僅在團隊決定徹底清除舊 codename 時執行。**不要與 Phase 1 混在同一個 PR。**

```bash
# 1. 用 ts-morph 或 IDE refactor，AST-aware rename
#    避免改到字串裡的 stable identifier（如 storage keys）

# 2. 檔案/目錄 rename 用 git mv 保留 blame
git mv src/features/ratewise src/features/<newname>
# 同步更新 routes.tsx import path、urlNormalization.test.ts entry fixture

# 3. 確認 storage-keys.ts 內字面值「不變」
#    （這些是 stable identifier，與 rename 解耦）

# 4. commit
git commit -m "refactor: rename ratewise → <newname> (mechanical)"

# 5. 把該 commit SHA 寫進 .git-blame-ignore-revs
```

**Phase 3 PR 必含 checklist**：

- [ ] `pnpm typecheck` + `pnpm test` 全綠
- [ ] `node scripts/rename-drill.mjs` 通過
- [ ] storage-keys.ts 字面值無動作
- [ ] commit SHA 加入 `.git-blame-ignore-revs`
- [ ] PR 描述明確標示「mechanical refactor only」

### Phase 4 — URL 搬遷（**強烈不建議，列為破壞性升級**）

只有在被法務 / 商標強制時才執行。完整步驟：

1. Dual-serve 1 個月：`/ratewise/` 與 `/<newname>/` 同時 200
2. 301 全路徑映射（不只 root，要逐 URL）
3. GSC **Change of Address** 工具提交
4. 雙 sitemap 並行 6 個月
5. 預期 organic traffic 短期 -20% ~ -30%
6. 舊 URL 至少保留 1 年 301
7. PWA `start_url` / `scope` 變更會讓舊 PWA 安裝失效
8. major version bump
9. release notes 明確告知

## 3. 工具與防護機制

### 3.1 `scripts/rename-drill.mjs`

驗證 SSOT 散播完整性。執行流程：

1. 備份 `app-info.ts`
2. 把 `BRAND_SHORT_NAME` 暫改為 `__RENAME_DRILL_SENTINEL__`
3. 跑 `pnpm prebuild` 重新生成 public/ 產物
4. grep `public/` 確認舊品牌字面值已清乾淨且 sentinel 確實散播
5. 還原備份

**何時執行**：

- 每月手動或 CI 排程跑一次
- 改名前最後安全網
- 新增涉及 SEO metadata 的 PR 時

### 3.2 `build-scripts.test.ts` 哨兵

靜態掃描 `src/` 內任何新出現的 `'RateWise'` 或 `'匯率好工具'` 字面值。
allowlist 解釋見測試本身的註解。

加新 component 時若引用品牌：使用 `APP_INFO.shortName` / `APP_INFO.name`。

### 3.3 `.git-blame-ignore-revs`

未來大 rename commit 寫進此檔，讓 GitHub web blame 與本地 `git blame`
（需手動 `git config blame.ignoreRevsFile .git-blame-ignore-revs`）跳過 mechanical commit。

### 3.4 Storage keys stable policy

`src/features/ratewise/storage-keys.ts` 內所有字串值為 **永久穩定識別符**，
即使品牌改名也不可變更。改了會清掉所有使用者的 favorites / 歷史。
若必須改：寫遷移腳本 + major version bump + release notes 公告。

## 4. 驗證 Checklist（每次改名 PR 必跑）

```bash
# Phase 1 PR
node scripts/rename-drill.mjs              # SSOT 散播完整
pnpm test src/config/__tests__/build-scripts.test.ts  # 哨兵綠
pnpm test src/config/__tests__/app-info.test.ts       # canary 更新到新值
pnpm typecheck                              # 全綠
pnpm build:ratewise                         # 產出物含新品牌
grep -r "RateWise" public/ dist/ | head     # 應為空（舊品牌完全消失）
grep -r "<NewName>" public/ dist/ | head    # 應有大量結果
```

## 5. 修訂紀錄

| 日期       | 版本 | 變更摘要                                 |
| ---------- | ---- | ---------------------------------------- |
| 2026-04-18 | v1.0 | 初版：建立改名 SOP、drill 工具、哨兵測試 |
