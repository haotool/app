# Park Keeper 停車好工具

> 停車位置紀錄、羅盤導航、Leaflet 小地圖與多語言 PWA。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff?logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-GPL--3.0-green)](../../LICENSE)

[線上體驗](https://app.haotool.org/park-keeper/) · [關於](https://app.haotool.org/park-keeper/about/) · [回報問題](https://github.com/haotool/app/issues)

## 功能

- GPS 停車位置紀錄與快速入口。
- 羅盤與方向感測器導航，支援步行距離與方向提示。
- Leaflet / React Leaflet 小地圖顯示停車點。
- IndexedDB 本機紀錄、照片檢視、地圖圖磚快取設定。
- 繁體中文、英文、日文 i18n。
- PWA 更新提示與離線快取。

## 技術棧

- React 19.2 + TypeScript 5.9
- Vite + vite-react-ssg
- Tailwind CSS 4 + `@tailwindcss/vite`
- Leaflet / React Leaflet
- Vitest + Testing Library
- Workbox / vite-plugin-pwa

## 開發

```bash
pnpm install --frozen-lockfile
pnpm --filter @app/park-keeper dev
```

常用命令：

```bash
pnpm --filter @app/park-keeper typecheck
pnpm --filter @app/park-keeper test
pnpm --filter @app/park-keeper lint
pnpm --filter @app/park-keeper build
```

## 結構

```text
apps/park-keeper/
├── src/components/     # UI、地圖、紀錄卡、PWA 更新提示
├── src/hooks/          # 導航、方向感測器、地圖效能
├── src/pages/          # Home / About / Settings
├── src/services/       # IndexedDB、定位、圖片、i18n、圖磚快取
├── src/seo/            # JSON-LD 與 meta tags
├── src/sw.ts           # Service Worker
└── app.config.mjs      # workspace / SEO SSOT
```

## 維護規則

- 需要瀏覽器 API 的頁面使用 `ClientOnly`，避免 SSG 階段觸發定位或 IndexedDB。
- 修改路由、SEO 資源或公開文案時，同步更新 `app.config.mjs`、sitemap / robots 產出與 root README。
- 修改 PWA 或 cache 行為後，至少執行 app build 與相關 Vitest。
