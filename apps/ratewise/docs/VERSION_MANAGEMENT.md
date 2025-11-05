# 版本管理機制

> **修復日期**: 2025-11-05
> **問題**: 生產環境版本號永遠顯示 `v1.1.0`
> **解決方案**: Docker ARG/ENV 注入 Git 資訊

---

## 📊 問題分析

### 根本原因

1. **`.dockerignore` 排除 `.git`**
   - Docker 建置時沒有 Git 歷史
   - `getVersionFromCommitCount()` 無法執行

2. **package.json 版本硬編碼**
   - `"version": "1.1.0"` 永不更新
   - 作為最終 fallback 返回舊版本

3. **無 Git TAG 自動化**
   - 專案沒有 Git 標籤
   - `getVersionFromGitTag()` 返回 `null`

---

## 🎯 解決方案

### 版本生成策略（優先級）

```typescript
// vite.config.ts:98
return (
  getVersionFromGitTag() ?? // 1. Git TAG (未實施)
  getVersionFromCommitCount() ?? // 2. Git commit 數 ✅
  baseVersion
); // 3. package.json fallback
```

### Docker 建置流程

1. **在建置主機上** (有 Git 歷史)：

   ```bash
   GIT_COMMIT_COUNT=$(git rev-list --count HEAD)
   GIT_COMMIT_HASH=$(git rev-parse --short HEAD)
   BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
   ```

2. **傳遞到 Docker 容器** (via ARG/ENV)：

   ```dockerfile
   ARG GIT_COMMIT_COUNT
   ENV GIT_COMMIT_COUNT=${GIT_COMMIT_COUNT}
   ARG VITE_BASE_PATH=/ratewise/
   ENV VITE_BASE_PATH=${VITE_BASE_PATH}
   ```

3. **vite.config.ts 使用環境變數**：

```typescript
const commitCount = process.env.GIT_COMMIT_COUNT ?? execSync('git rev-list --count HEAD').trim();
```

> 參考: [MDN start_url](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/start_url)、[W3C App Manifest §1.6/§1.10](https://www.w3.org/TR/appmanifest/) - start_url 與 scope 必須落在 `/ratewise` 子目錄，故建置時預設 `VITE_BASE_PATH=/ratewise/`。

4. **Docker 部署後鏡像資產**

   Dockerfile 會把 `/usr/share/nginx/html/assets`、`sw.js`、`workbox-*.js` 同步複製到 `/usr/share/nginx/html/ratewise/`，確保 `/ratewise/assets/*` 與 `/ratewise/sw.js` 在子路徑部署時可取得最新檔案（避免 Service Worker 預快取 404）。

---

## 🚀 使用方式

### 本地建置

```bash
# 使用建置腳本（自動注入 Git 資訊）
./build-docker.sh

# 或手動指定
docker build \
  --build-arg GIT_COMMIT_COUNT="$(git rev-list --count HEAD)" \
  --build-arg GIT_COMMIT_HASH="$(git rev-parse --short HEAD)" \
  --build-arg BUILD_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  -t ratewise:latest \
  .
```

### CI/CD 環境 (Zeabur/GitHub Actions)

```yaml
# 範例：GitHub Actions workflow
- name: Build Docker image
  run: |
    docker build \
      --build-arg GIT_COMMIT_COUNT="${{ github.run_number }}" \
      --build-arg GIT_COMMIT_HASH="${{ github.sha }}" \
      --build-arg BUILD_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
      -t ratewise:latest \
      .
```

---

## 📝 版本號格式

| 環境 | 格式                                           | 範例                        |
| ---- | ---------------------------------------------- | --------------------------- |
| 開發 | `{major}.{minor}.{commits}+sha.{hash}[-dirty]` | `1.1.190+sha.78cb6b8-dirty` |
| 生產 | `{major}.{minor}.{commits}`                    | `1.1.190`                   |
| 回退 | `{major}.{minor}.{patch}`                      | `1.1.0` (不應出現)          |

### 版本號來源

- `major.minor`：從 `package.json` 讀取（`1.1`）
- `commits`：Git commit 總數（`190`）
- `hash`：Git commit 短 hash（`78cb6b8`）
- `dirty`：有未提交變更時附加

---

## ✅ 驗證方式

### 1. 檢查建置輸出

```bash
$ ./build-docker.sh
🔍 Collecting Git information...
   Git commit count: 190
   Git commit hash: 78cb6b8
   Build time: 2025-11-05T07:30:00Z

📦 Building Docker image...
   Version: 1.1.190
```

### 2. 檢查容器內版本

```bash
$ docker run --rm ratewise:latest cat /usr/share/nginx/html/index.html | grep -o 'app-version" content="[^"]*"'
app-version" content="1.1.190"
```

### 3. 檢查生產環境

打開瀏覽器開發者工具 → Elements → 搜尋 `<meta name="app-version"`

---

## 🔧 故障排除

### 問題 1：版本依然是 1.1.0

**可能原因**:

- Docker 建置時沒有傳遞 build args
- CI/CD 環境沒有 Git 歷史（shallow clone）

**解決方案**:

```bash
# 確保使用完整 Git 歷史
git fetch --unshallow

# 檢查 build args 是否傳遞
docker inspect ratewise:latest | grep -A5 "Env"
```

### 問題 2：BUILD_TIME 未更新

**可能原因**:

- Docker 快取導致重用舊的建置層

**解決方案**:

```bash
# 強制重新建置
docker build --no-cache ...
```

---

## 📚 參考資料

- [Docker ARG vs ENV](https://docs.docker.com/engine/reference/builder/#arg)
- [vite-plugin-pwa 版本管理](https://vite-pwa-org.netlify.app/)
- [語義化版本 (Semantic Versioning)](https://semver.org/)
- [Git Commit Count 最佳實踐](https://stackoverflow.com/questions/677436)

---

## 🎉 預期效果

修復後：

- ✅ 本地建置：`1.1.190+sha.78cb6b8-dirty`
- ✅ 生產環境：`1.1.190`
- ✅ 每次提交自動遞增版本號
- ✅ 無需手動更新 `package.json`
