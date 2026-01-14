# 009 Router Basename Alignment

**版本**: 1.0.1  
**建立時間**: 2025-11-10T21:51:02+0800  
**更新時間**: 2026-01-15T00:21:49+0800  
**狀態**: ✅ 完成

---

## 背景

FAQ / About 直接以 `https://app.haotool.org/faq` 或 `pnpm preview` 預覽的 `/faq`、`/about` 會顯示空白頁，因為 React Router `BrowserRouter` 被強制設定 `basename='/ratewise'`，但 Vite build 若未使用一致的 `base` 會導致路由與靜態資產根路徑不同步，造成非 `/ratewise/*` URL 無法 hydrate。此問題同時影響 SEO（搜尋引擎索引的是 `/faq` 但實際內容在 `/ratewise/faq`）。

---

## Linus 三問檢查

1. **這是真問題嗎？**
   - 是。使用者在 Zeabur / preview 直接造訪 `/faq` 只看到空白畫面，且 Search Console 也會收到空頁警示。
2. **有更簡單的方法嗎？**
   - 有。直接使用 `import.meta.env.BASE_URL`（Vite 依 `base` 設定產生）給 `BrowserRouter`，就能保證兩者同步，而不必再寫 `import.meta.env.DEV ? '/' : '/ratewise'` 這種條件。
3. **會破壞什麼嗎？**
   - 若只在 Router 端改寫仍需人工輸入 `VITE_RATEWISE_BASE_PATH`，容易再次遺漏。因此額外建立 `.env.production`，讓 build / preview 預設就是 `/ratewise/`。經 `pnpm typecheck`、`pnpm test`、`pnpm build:ratewise`、`pnpm preview` 驗證後，舊功能無回歸。

---

## 決策摘要

- React Router 官方建議 `BrowserRouter` 的 `basename` 必須與實際部署的 base URL 相同，否則路由切換與直接造訪皆會失敗。[context7:remix-run/react-router:2025-11-10T13:16:00Z]
- Vite 會把 `base` 注入 `import.meta.env.BASE_URL`，也支援 `.env.production` 自動覆寫，因此讓 Router 直接使用該值即可確保一致。[context7:vitejs/vite:2025-11-10T13:17:00Z]
- Zeabur 仍以 `/ratewise/` 子路徑曝光，所以 sitemap、canonical、PWA manifest 都需落在同一層；把 `VITE_RATEWISE_BASE_PATH` 固定寫進 `.env.production` 可以避免遺漏，如需根目錄部署可顯式設為 `/`。

---

## 實作清單

1. **Router 正規化**
   - 讀取 `import.meta.env.BASE_URL`，若為 `'/'` 則回傳 `'/'`，否則移除結尾斜線再傳給 `BrowserRouter`。確保 dev (`'/'`) 與 prod (`'/ratewise/'`) 皆能自動切換。
2. **生產環境 base 設定**
   - 在 `apps/ratewise/.env.production` 建立 `VITE_RATEWISE_BASE_PATH=/ratewise/`。`pnpm build:ratewise` 會自動載入該檔，Vite `base` 與 Router `basename` 與 SEO URL 因此保持一致。
3. **文件與流程**
   - 本檔詳細紀錄決策，QA 需檢查 `http(s)://*/ratewise/{faq,about}` 是否可直接載入。並在 002 獎懲記錄登記本次改善。

---

## 驗證

| 類型        | 指令                                                                   | 結果                                              |
| ----------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| ✅ 類型檢查 | `pnpm typecheck`                                                       | 全部通過                                          |
| ✅ 單元測試 | `pnpm test`                                                            | Vitest 全綠                                       |
| ✅ 生產建置 | `pnpm build:ratewise`（自動載入 `.env.production`）                    | 產生 `/ratewise/` 靜態資源                        |
| ✅ 預覽驗證 | `pnpm preview` → 手動造訪 `http://localhost:4173/ratewise/{faq,about}` | FAQ / About 成功渲染；`/faq` 會 404，符合部署策略 |

---

## SEO / 發佈建議

- sitemap、canonical、JSON-LD URL 需要保持 `/ratewise/` 前綴；若要遷移到根路徑，必須同時調整 `.env.production` 與 Router。
- Cloudflare / Zeabur 需設定 301，將 `/faq` 等舊連結轉向 `/ratewise/faq`，避免搜尋引擎索引空頁。

---

## 待追蹤

- 若未來調整為根目錄部署，請新增 010 文檔記錄遷移作業，並更新 `.env.production` 與 SEO 文件。
