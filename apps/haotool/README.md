<div align="center">

# 🛠️ haotool

**專案展示平台 | 3D 互動首頁**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646cff?logo=vite)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.182-black?logo=threedotjs)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-GPL--3.0-green)](../../LICENSE)

[🌐 線上體驗](https://app.haotool.org/) · [📖 專案列表](https://app.haotool.org/projects/) · [🐛 回報問題](https://github.com/haotool/app/issues)

</div>

---

## 📋 專案概述

**haotool** 是一個現代化的專案展示平台，使用 Three.js 打造沉浸式 3D 互動首頁，展示 haotool 旗下所有應用程式。

「HAO」取自中文「好」的拼音，核心理念是打造真正的「**好工具**」。

### ✨ 主要功能

- **🎨 3D 互動首頁** - Three.js + React Three Fiber 打造的沉浸式視覺體驗
- **📱 響應式設計** - 完美適配桌面與行動裝置
- **⚡ 極致效能** - Vite 7 + React 19 + SWC 建置
- **🎭 Framer Motion** - 流暢的頁面過渡動畫
- **📊 專案展示** - 展示 HaoRate、NihonName 等應用

### 🚀 專案列表

| 專案          | 描述             | 狀態    |
| ------------- | ---------------- | ------- |
| **HaoRate**   | 即時匯率換算工具 | 🟢 Live |
| **NihonName** | 日本名字產生器   | 🟢 Live |

---

## 🚀 快速開始

### 環境需求

- Node.js 20+
- pnpm 9+

### 本地開發

```bash
# 從 Monorepo 根目錄
cd /path/to/app

# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm --filter @app/haotool dev

# 開啟瀏覽器
# http://localhost:3000
```

### 建置與預覽

```bash
# 生產建置（含 SSG 預渲染）
pnpm --filter @app/haotool build

# 預覽建置結果
pnpm --filter @app/haotool preview
```

---

## 📁 專案結構

```
apps/haotool/
├── public/                  # 靜態資源
│   ├── icons/               # PWA 圖示
│   ├── projects/            # 專案圖片
│   ├── screenshots/         # 截圖
│   └── sitemap.xml          # 網站地圖
├── src/
│   ├── components/          # React 組件
│   │   ├── ThreeHero.tsx    # 3D 首頁場景
│   │   ├── Layout.tsx       # 頁面佈局
│   │   ├── ProjectCard.tsx  # 專案卡片
│   │   └── Accordion.tsx    # FAQ 手風琴
│   ├── pages/               # 頁面組件
│   │   ├── Home.tsx         # 首頁
│   │   ├── Projects.tsx     # 專案列表
│   │   ├── About.tsx        # 關於頁面
│   │   └── Contact.tsx      # 聯繫頁面
│   ├── hooks/               # 自訂 Hooks
│   ├── seo/                 # SEO 配置
│   ├── constants.ts         # 專案資料
│   ├── routes.tsx           # 路由配置
│   └── main.tsx             # 應用入口
├── vite.config.ts           # Vite 配置
├── vitest.config.ts         # Vitest 配置
└── tailwind.config.ts       # Tailwind 配置
```

---

## 🧪 測試

```bash
# 執行單元測試
pnpm --filter @app/haotool test

# 測試覆蓋率報告
pnpm --filter @app/haotool test:coverage

# E2E 測試
pnpm --filter @app/haotool test:e2e
```

---

## 🎨 技術棧

| 類別         | 技術                         |
| ------------ | ---------------------------- |
| **框架**     | React 19 + TypeScript 5.9    |
| **建置工具** | Vite 7.3 + vite-react-ssg    |
| **3D 渲染**  | Three.js + React Three Fiber |
| **動畫**     | Framer Motion 12             |
| **樣式**     | Tailwind CSS 3.4             |
| **滾動**     | Lenis 平滑滾動               |
| **測試**     | Vitest + Playwright          |
| **部署**     | Zeabur / Docker              |

---

## 🔍 SEO 優化

- ✅ SSG 靜態生成 (vite-react-ssg)
- ✅ 結構化資料 (JSON-LD)
- ✅ Open Graph 標籤
- ✅ Sitemap 自動生成
- ✅ PWA 支援

---

## 📊 效能指標

| 指標           | 目標 | 當前 |
| -------------- | ---- | ---- |
| Performance    | ≥90  | ✅   |
| Accessibility  | ≥90  | ✅   |
| Best Practices | ≥90  | ✅   |
| SEO            | ≥90  | ✅   |

---

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

請確保：

- 遵循 [Commit Convention](../../COMMIT_CONVENTION.md)
- 通過所有測試 (`pnpm test`)
- 通過 TypeScript 檢查 (`pnpm typecheck`)
- 通過 Lint 檢查 (`pnpm lint`)

---

## 📄 授權

本專案採用 [GPL-3.0](../../LICENSE) 授權。

---

## 👥 開發團隊

- **開發者** - [haotool](https://app.haotool.org/)
- **Threads** - [@azlife_1224](https://www.threads.net/@azlife_1224)

---

<div align="center">

Made with ❤️ by [haotool](https://app.haotool.org/)

</div>
