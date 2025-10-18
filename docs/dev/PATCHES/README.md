# Patches 資料夾說明

> 本資料夾包含可直接套用的程式碼修復範例與 patch 檔案

---

## 使用方式

每個 `.patch` 檔案包含：

- **Before/After 程式碼對照**
- **執行指令**
- **驗證步驟**
- **相關 Issue 連結**

### 套用 Patch 流程

1. 閱讀 patch 檔案內容
2. 建立專屬分支
3. 手動套用變更（複製 After 程式碼）
4. 執行驗證指令
5. Commit 並建立 PR

**注意**: 這些 patch 為範例參考，不建議直接使用 `git apply`，請手動檢視後套用。

---

## Patch 清單

### M0: 清理與基礎強化

| Patch | 檔案                            | 說明                     | 優先級 |
| ----- | ------------------------------- | ------------------------ | ------ |
| 01    | `01-vitest-thresholds.patch`    | 提升測試覆蓋率門檻至 80% | P0     |
| 02    | `02-eslint-any-to-error.patch`  | ESLint `any` 規則強化    | P0     |
| 03    | `03-remove-reload-prompt.patch` | 刪除未使用元件           | P1     |
| 04    | `04-add-env-example.patch`      | 新增環境變數範本         | P0     |

### M1: 觀測性建立

| Patch | 檔案                                 | 說明                 | 優先級 |
| ----- | ------------------------------------ | -------------------- | ------ |
| 05    | `05-sentry-integration-test.patch`   | Sentry 整合測試      | P0     |
| 06    | `06-webvitals-mock-test.patch`       | Web Vitals mock 測試 | P1     |
| 07    | `07-logger-sentry-integration.patch` | Logger 整合至 Sentry | P1     |

### M2: 依賴升級

| Patch | 檔案                         | 說明                | 優先級 |
| ----- | ---------------------------- | ------------------- | ------ |
| 08    | `08-vite-7-upgrade.sh`       | Vite 7 升級腳本     | P1     |
| 09    | `09-tailwind-4-migration.md` | Tailwind 4 遷移指南 | P1     |

### M3: 測試強化

| Patch | 檔案                              | 說明                         | 優先級 |
| ----- | --------------------------------- | ---------------------------- | ------ |
| 10    | `10-playwright-page-object.patch` | Playwright Page Object Model | P2     |
| 11    | `11-lighthouse-ci-config.patch`   | Lighthouse CI 配置           | P2     |

---

## 驗證所有 Patches

```bash
# 建立驗證腳本
cat > verify-patches.sh << 'EOF'
#!/bin/bash
set -e

echo "🔍 驗證所有 Patches..."

# M0
echo "1️⃣ 測試覆蓋率門檻..."
cd apps/ratewise
pnpm test:coverage || echo "⚠️ 覆蓋率未達標"

# M0
echo "2️⃣ ESLint 檢查..."
cd ../..
pnpm lint || echo "⚠️ Lint 有錯誤"

# M0
echo "3️⃣ TypeScript 檢查..."
pnpm typecheck || echo "⚠️ 型別有錯誤"

# M0
echo "4️⃣ 建置檢查..."
pnpm build || echo "⚠️ 建置失敗"

echo "✅ 驗證完成！"
EOF

chmod +x verify-patches.sh
bash verify-patches.sh
```

---

## 回滾策略

所有 patch 套用後若發生問題，可使用以下指令回滾：

```bash
# 回滾單一 commit
git revert <commit-sha>

# 回滾整個 PR
git revert <merge-commit-sha>

# 回滾依賴升級
cd apps/ratewise
pnpm up <package>@<old-version>
pnpm install --frozen-lockfile
```

---

## 產出說明

本資料夾為 `TECH_DEBT_AUDIT.md` § 產出清單 第 7 項：

> `PATCHES/` 建議變更的範例 patch 或指令腳本片段

**最後更新**: 2025-10-18T03:13:53+08:00
