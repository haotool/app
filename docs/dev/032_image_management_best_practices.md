# 圖片管理最佳實踐

**建立時間**: 2025-12-24T22:00:00+08:00
**更新時間**: 2025-12-24T22:00:00+08:00
**版本**: v1.0
**狀態**: ✅ 完成
**依據**: [002_development_reward_penalty_log.md:2025-12-24]

---

## 📋 目錄

- [背景與動機](#背景與動機)
- [核心原則](#核心原則)
- [路徑管理策略](#路徑管理策略)
- [圖片優化流程](#圖片優化流程)
- [SSG 預渲染最佳實踐](#ssg-預渲染最佳實踐)
- [CI/CD 自動化](#cicd-自動化)
- [故障排除](#故障排除)
- [檢查清單](#檢查清單)

---

## 背景與動機

### 問題起源

**時間**: 2025-12-23 23:17
**事件**: 合併 `feature/seo-complete-optimization` 分支到主幹
**後果**: 導致 Logo 圖片 404 錯誤 + React Hydration #418 警告

### 問題演進

| 時間  | Commit  | 問題                            | 影響                    |
| ----- | ------- | ------------------------------- | ----------------------- |
| 23:15 | 7b9e5c3 | 使用 `/optimized/logo-112w.png` | 檔案不存在 → 404        |
| 02:07 | 794b229 | 改用絕對路徑 `/logo.png`        | 子路徑部署失效          |
| 08:52 | 1fd235c | 動態路徑 `${BASE_URL}logo.png`  | SSG hydration 錯誤      |
| 21:05 | 378a1ab | `<picture>` + 動態路徑          | 複雜化 + hydration 錯誤 |
| 21:21 | 98d3350 | 相對路徑 `logo.png`             | ✅ 最終修復             |

### 關鍵教訓

1. **KISS 原則** - 簡單 `<img src="logo.png">` 優於複雜 `<picture>` + 動態路徑
2. **消除特殊情況** - 讓 Vite build 統一處理路徑，而非手動條件判斷
3. **生產環境驗證** - 分支合併前必須測試 `base: '/ratewise/'` 子路徑部署
4. **避免過度優化** - 未準備好的 AVIF/WebP 不應強行使用

---

## 核心原則

### Linus 三問（每次修改前必問）

1. **這是真問題還是臆想？**
   - ✅ 圖片 404 是真問題
   - ❌ 過早優化 AVIF/WebP（檔案未準備好）是臆想

2. **有更簡單的方法嗎？**
   - ✅ 相對路徑 `logo.png` 最簡單
   - ❌ `<picture>` + 動態路徑 過於複雜

3. **會破壞什麼嗎？**
   - ✅ 相對路徑在所有環境都有效
   - ❌ 動態 BASE_URL 在 SSG 預渲染時失效

### 設計原則

- **單一真實來源 (SSOT)** - 圖片檔案放在 `public/` 目錄
- **相對路徑優先** - 讓 Vite 自動處理 base path
- **向後相容** - 確保子路徑部署正常
- **自動化驗證** - CI/CD 自動檢查圖片存在性和路徑正確性

---

## 路徑管理策略

### ✅ 正確模式（推薦）

```tsx
// 最簡單：相對路徑（Vite 自動處理 base path）
<img
  src="logo.png" // ✅ Vite build 時自動加上 /ratewise/
  alt="Logo"
  width={112}
  height={112}
  loading="lazy"
  decoding="async"
/>
```

**優點**：

- Vite build 自動處理 base path
- 無 SSG hydration 問題
- 符合 KISS 原則
- 在所有環境（開發/生產/子路徑）都有效

### ❌ 錯誤模式（禁止）

#### 錯誤 1：絕對路徑

```tsx
// ❌ 絕對路徑（子路徑部署失效）
<img src="/logo.png" />

// 問題：
// - 本地開發 (base: '/') → http://localhost:3001/logo.png ✅
// - 生產環境 (base: '/ratewise/') → https://app.haotool.org/logo.png ❌ (404)
//   正確應該是：https://app.haotool.org/ratewise/logo.png
```

#### 錯誤 2：動態 BASE_URL

```tsx
// ❌ 動態路徑（SSG hydration 錯誤）
<img src={`${import.meta.env.BASE_URL}logo.png`} />

// 問題：
// - SSG 預渲染時 import.meta.env.BASE_URL 未正確解析
// - 導致 React Hydration Error #418
// - 伺服器渲染 HTML 與客戶端 hydration 不一致
```

#### 錯誤 3：複雜 Picture 元素

```tsx
// ❌ 過度複雜（未準備好就強行使用）
<picture>
  <source srcSet={`${import.meta.env.BASE_URL}logo-112w.avif`} type="image/avif" />
  <source srcSet={`${import.meta.env.BASE_URL}logo-112w.webp`} type="image/webp" />
  <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" />
</picture>

// 問題：
// - 檔案不存在（未執行優化腳本）
// - 動態路徑導致 SSG hydration 錯誤
// - 違反 YAGNI 原則（You Aren't Gonna Need It）
```

### 路徑驗證檢查清單

```bash
# 1. 檢查圖片檔案是否存在
test -f apps/ratewise/public/logo.png
test -f apps/ratewise/public/og-image.png

# 2. 檢查程式碼中是否使用相對路徑
grep -r 'src="logo.png"' apps/ratewise/src/  # ✅ 正確
grep -r 'src="/logo.png"' apps/ratewise/src/  # ❌ 錯誤：絕對路徑
grep -r 'BASE_URL.*logo' apps/ratewise/src/   # ❌ 錯誤：動態路徑

# 3. 本地測試子路徑部署
VITE_RATEWISE_BASE_PATH='/ratewise/' pnpm build
pnpm preview
# 手動驗證：http://localhost:4173/ratewise/ 圖片顯示正常
```

---

## 圖片優化流程

### 階段 1：基礎（當前實作）

**策略**：只使用 PNG，讓 Cloudflare 自動優化

```tsx
// 簡單可靠
<img src="logo.png" alt="Logo" />
```

**優點**：

- 無複雜性
- Cloudflare 自動轉換為 WebP/AVIF（支援的瀏覽器）
- 100% 相容性（PNG fallback）

**缺點**：

- 初始載入稍慢（未優化的 PNG）
- 依賴 Cloudflare（但這是可接受的）

### 階段 2：進階（未來優化）

**策略**：預生成 AVIF/WebP，使用靜態路徑

**前提條件**：

1. ✅ CI/CD 中自動執行 `pnpm optimize:images`
2. ✅ 確保 `public/logo.avif` 和 `public/logo.webp` 存在
3. ✅ 使用**相對路徑**（不用 BASE_URL）

**實作範例**：

```tsx
// ✅ 正確：靜態相對路徑
<picture>
  <source srcSet="logo.avif" type="image/avif" />
  <source srcSet="logo.webp" type="image/webp" />
  <img src="logo.png" alt="Logo" />
</picture>
```

**package.json 配置**：

```json
{
  "scripts": {
    "optimize:images": "node scripts/optimize-images-2025.mjs",
    "prebuild": "pnpm optimize:images"
  }
}
```

### 圖片優化腳本

參考：[scripts/optimize-images-2025.mjs](../../scripts/optimize-images-2025.mjs)

**功能**：

- AVIF 格式（70-80% 壓縮率）
- WebP fallback（廣泛支援）
- PNG 優化（最終 fallback）

**執行方式**：

```bash
# 手動執行
node scripts/optimize-images-2025.mjs

# 自動執行（prebuild hook）
pnpm build  # 會先執行 optimize:images
```

---

## SSG 預渲染最佳實踐

### Vite-React-SSG 配置

```typescript
// vite.config.ts
import ViteReactSSG from 'vite-react-ssg';

export default defineConfig({
  base: process.env.VITE_RATEWISE_BASE_PATH || '/ratewise/',

  plugins: [
    react(),
    ViteReactSSG(), // 自動預渲染所有 routes
  ],
});
```

### 圖片使用注意事項

1. **避免動態路徑**

   ```tsx
   // ❌ SSG 無法正確解析
   <img src={`${import.meta.env.BASE_URL}logo.png`} />

   // ✅ Vite 自動處理
   <img src="logo.png" />
   ```

2. **確保檔案存在**

   ```bash
   # CI 中自動檢查
   test -f apps/ratewise/public/logo.png || exit 1
   ```

3. **驗證預渲染輸出**

   ```bash
   pnpm build

   # 檢查 HTML 中的圖片路徑
   grep -o 'src="[^"]*logo[^"]*"' apps/ratewise/dist/index.html
   # 預期輸出：src="/ratewise/logo.png"
   ```

### Hydration 錯誤防範

**常見原因**：

- 伺服器渲染（SSG）和客戶端 hydration 的 HTML 不一致
- 動態路徑在 SSG 時未正確解析

**解決方案**：

1. 使用相對路徑（讓 Vite 統一處理）
2. 避免在圖片路徑中使用環境變數
3. 如果需要動態內容，使用 `suppressHydrationWarning` 屬性

```tsx
// 範例：動態年份（會 hydration 不一致）
<span suppressHydrationWarning>{new Date().getFullYear()}</span>
```

---

## CI/CD 自動化

### GitHub Actions 配置

參考：[.github/workflows/ci.yml](../../.github/workflows/ci.yml)

**新增步驟**：

```yaml
- name: Verify image assets
  run: |
    # 檢查所有 apps 的必要圖片
    test -f apps/ratewise/public/logo.png || exit 1
    test -f apps/ratewise/public/og-image.png || exit 1
    test -f apps/nihonname/public/logo.png || exit 1
    test -f apps/haotool/public/logo.png || exit 1

- name: Verify image paths in code
  run: |
    # 禁止絕對路徑
    ! grep -r 'src="/.*\.png' apps/*/src/

    # 禁止動態 BASE_URL
    ! grep -r 'BASE_URL.*\.png' apps/*/src/
```

### Pre-commit Hook（可選）

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 檢查圖片路徑
echo "🖼️ Checking image paths..."

if git diff --cached --name-only | grep -E '\.(tsx|jsx)$'; then
  # 檢查是否有絕對路徑
  if git diff --cached | grep -E 'src=["\x27]/.*\.(png|jpg|jpeg|avif|webp)'; then
    echo "❌ Found absolute image paths (use relative paths)"
    exit 1
  fi

  # 檢查是否有動態 BASE_URL
  if git diff --cached | grep -E 'BASE_URL.*\.(png|jpg|jpeg|avif|webp)'; then
    echo "❌ Found dynamic BASE_URL paths (use relative paths)"
    exit 1
  fi
fi

echo "✅ Image paths OK"
```

---

## 故障排除

### 問題 1：圖片 404 錯誤

**症狀**：

- 本地開發正常，生產環境圖片 404
- 瀏覽器 DevTools Network 顯示 `https://app.haotool.org/logo.png` (404)

**原因**：

- 使用絕對路徑 `/logo.png`
- 未考慮子路徑部署 `base: '/ratewise/'`

**解決**：

```tsx
// 改用相對路徑
<img src="logo.png" /> // Vite 自動加上 /ratewise/
```

**驗證**：

```bash
VITE_RATEWISE_BASE_PATH='/ratewise/' pnpm build
pnpm preview
# 開啟 http://localhost:4173/ratewise/ 檢查圖片
```

### 問題 2：React Hydration Error #418

**症狀**：

- Console 顯示 `Warning: Text content did not match. Server: "..." Client: "..."`
- 通常發生在使用動態 BASE_URL 的圖片

**原因**：

- SSG 預渲染時 `import.meta.env.BASE_URL` 未正確解析
- 伺服器 HTML 與客戶端 hydration 不一致

**解決**：

```tsx
// 移除動態路徑
-(<img src={`${import.meta.env.BASE_URL}logo.png`} />) + <img src="logo.png" />;
```

**驗證**：

```bash
pnpm build
pnpm preview
# 檢查 Console 無 hydration 警告
```

### 問題 3：圖片檔案不存在

**症狀**：

- 程式碼引用 `logo.avif` 但檔案不存在
- CI build 失敗

**原因**：

- 未執行圖片優化腳本
- 引用了未生成的檔案

**解決**：

```bash
# 執行優化腳本
node scripts/optimize-images-2025.mjs

# 或者回到簡單模式（只用 PNG）
<img src="logo.png" />
```

---

## 檢查清單

### 開發階段

- [ ] 只使用相對路徑（`logo.png`，不用 `/logo.png` 或 `${BASE_URL}logo.png`）
- [ ] 確認圖片檔案存在於 `public/` 目錄
- [ ] 本地測試開發環境 `pnpm dev`
- [ ] 本地測試生產環境 `VITE_RATEWISE_BASE_PATH='/ratewise/' pnpm build && pnpm preview`

### 分支合併前（必須）

- [ ] 執行 Linus 三問（真問題？更簡單？會破壞？）
- [ ] 本地驗證子路徑部署
  ```bash
  VITE_RATEWISE_BASE_PATH='/ratewise/' pnpm build
  pnpm preview
  # 驗證：http://localhost:4173/ratewise/ 所有圖片顯示正常
  ```
- [ ] 檢查圖片檔案存在性
  ```bash
  test -f apps/*/public/logo.png
  test -f apps/*/public/og-image.png
  ```
- [ ] 檢查程式碼路徑正確性
  ```bash
  # 不應該有絕對路徑或動態 BASE_URL
  ! grep -r 'src="/.*\.png' apps/*/src/
  ! grep -r 'BASE_URL.*\.png' apps/*/src/
  ```
- [ ] SSG 預渲染輸出驗證
  ```bash
  pnpm build
  test -f apps/ratewise/dist/index.html
  ```
- [ ] 所有測試通過 `pnpm test`
- [ ] Lint 和 TypeScript 檢查通過 `pnpm lint && pnpm typecheck`

### CI/CD（自動）

- [x] CI 自動檢查圖片存在性
- [x] CI 自動檢查圖片路徑正確性
- [x] E2E 測試驗證圖片顯示

---

## 參考資源

### 內部文檔

- [002_development_reward_penalty_log.md](./002_development_reward_penalty_log.md) - 獎懲記錄與教訓
- [LINUS_GUIDE.md](../../LINUS_GUIDE.md) - Linus 開發哲學
- [CLAUDE.md](../../CLAUDE.md) - Claude Code 開發指南

### 外部資源

- [Vite Static Asset Handling](https://vitejs.dev/guide/assets.html)
- [Vite React SSG](https://github.com/daydreamer-riri/vite-react-ssg)
- [Web.dev Image Optimization](https://web.dev/articles/optimize-lcp)
- [AVIF vs WebP Comparison](https://aibudwp.com/image-optimization-in-2025)

### 圖片優化腳本

- [scripts/optimize-images-2025.mjs](../../scripts/optimize-images-2025.mjs)
- [scripts/**tests**/image-optimization-2025.test.ts](../../scripts/__tests__/image-optimization-2025.test.ts)

---

**最後更新**: 2025-12-24T22:00:00+08:00
**維護者**: Claude Code
**版本**: v1.0
