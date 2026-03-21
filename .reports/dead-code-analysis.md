# Dead Code Analysis Report — @app/ratewise

Generated: 2026-03-21 | Tools: knip, ts-prune

---

## Summary

| Category               | Found | Deleted | Skipped |
| ---------------------- | ----- | ------- | ------- |
| Unused files           | 21    | 13      | 8       |
| Unused dependencies    | 1     | 0       | 1       |
| Unused devDependencies | 8     | 0       | 8       |
| Unused exports         | 88    | 0       | 88      |
| Unused types           | 39    | 0       | 39      |
| Duplicate exports      | 9     | 0       | 9       |

Tests before: 103 files, 1642 passed | Tests after: 103 files, 1642 passed ✅

---

## DELETED (13 files)

### SW Debug Scripts (9) — Playwright 手動測試腳本，開發期殘留

- scripts/test-sw-console-debug.mjs
- scripts/test-sw-console.mjs
- scripts/test-sw-detailed.mjs
- scripts/test-sw-direct.mjs
- scripts/test-sw-fixed.mjs
- scripts/test-sw-location.mjs
- scripts/test-sw-patched.mjs
- scripts/test-sw-precache.mjs
- scripts/inspect-precache.mjs

### Unused Components / Utils (4)

- src/components/ThreadsIcon.tsx — Meta Threads 圖標，無任何頁面引用
- src/components/VersionDisplay.tsx — 已被其他實作取代，無引用
- src/utils/pushNotifications.ts — 功能未實裝，無引用
- vite-plugins/non-blocking-css.ts — vite.config.ts 無引用

---

## SKIPPED

### Files — knip 無法追蹤非模組圖入口

- src/sw.ts → vite.config.ts VitePWA swSrc 直接指定
- src/utils/react-is-shim.ts → vite.config.ts alias
- src/utils/react-helmet-async-shim.tsx → vite.config.ts alias
- src/bootstrap/pwa-recovery-bootstrap.js → vite.config.ts rollupOptions.input
- src/utils/workbox-window.ts → sw.ts 內部使用
- scripts/health-check.mjs → CI seo-production.yml 使用
- app.config.mjs → 建置設定，需人工確認

### devDependencies (8) — workbox-\* 由 sw.ts import，knip 不追蹤 SW 模組圖

### @app/shared — monorepo 內部套件，需人工確認

### Unused exports (88) + types (39) — 公開 API 合約，不在 cleanup 範圍

### Duplicate exports (9) — React.lazy 需要 default export，刻意保留
