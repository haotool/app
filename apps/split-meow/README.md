# Split Meow 喵喵分帳

> 旅遊與聚餐分帳工具，支援行程、成員、付款人、平分 / 個別輸入與結清建議。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff?logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-GPL--3.0-green)](../../LICENSE)

[線上體驗](https://app.haotool.org/split-meow/) · [回報問題](https://github.com/haotool/app/issues)

## 功能

- 建立多個行程並切換當前行程。
- 管理成員、付款人與頭像。
- 支援平分與個別輸入費用。
- 自動計算各人應收 / 應付與最少結清路徑。
- Web Share API 分享，剪貼簿備援。
- 繁體中文、英文、韓文、日文 i18n。
- PWA 更新提示與離線快取。

## 技術棧

- React 19.2 + TypeScript 5.9
- Vite 8 + Oxc / Rolldown
- Tailwind CSS 4 + `@tailwindcss/vite`
- Zustand
- i18next / react-i18next
- Vitest + Testing Library + Playwright
- Workbox / vite-plugin-pwa

## 開發

```bash
pnpm install --frozen-lockfile
pnpm --filter @app/split-meow dev
```

常用命令：

```bash
pnpm --filter @app/split-meow typecheck
pnpm --filter @app/split-meow test
pnpm --filter @app/split-meow lint
pnpm --filter @app/split-meow build
pnpm --filter @app/split-meow test:e2e
```

## 結構

```text
apps/split-meow/
├── src/components/     # tabs、分帳表單、成員、底部導覽、更新提示
├── src/hooks/          # 鍵盤高度、PWA 更新提示
├── src/lib/            # 頭像、互動效果、算式解析、utils
├── src/store/          # Zustand 狀態
├── src/i18n.ts         # 語系資源
├── src/sw.ts           # Service Worker
└── public/             # icons、avatars、offline、sitemap、llms
```

## 維護規則

- 修改分帳演算法時同步更新 `src/App.test.tsx` 或新增對應測試。
- 修改公開資源、PWA 或 SEO 檔案時，同步更新 root README 與 `app.config.mjs`。
- 不需要外部 AI API key；本 app 只使用本機狀態與瀏覽器能力。
