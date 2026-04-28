<div align="center">

# 🌋 Quake-School 地震知識小學堂

**互動式地震科學教育平台**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff?logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-GPL--3.0-green)](./LICENSE)

[🌐 線上體驗](https://app.haotool.org/quake-school/) · [📖 課程教學](https://app.haotool.org/quake-school/lessons/) · [🐛 回報問題](https://github.com/haotool/app/issues)

</div>

---

## 📋 專案概述

**Quake-School（地震知識小學堂）** 是一個互動式地震科學教育網站，專為各年齡層設計，透過視覺化模擬器與測驗，讓使用者輕鬆了解地震的成因、地震波、規模與震度的差異。

### ✨ 主要功能

- **🌍 地震模擬器** - 互動式調整規模與深度，即時視覺化地震影響
- **📚 分級課程** - 幼兒園到進階程度的地震知識課程
- **🧪 知識測驗** - 互動問答測驗，驗證學習成效
- **📊 震度視覺化** - 台灣震度分級圖表，一目了然
- **🌊 地震波動畫** - P波、S波視覺化展示
- **📱 PWA 支援** - 可安裝至手機，離線使用

### 🎓 課程主題

1. **成因：地球大拼圖** - 為什麼地會動？
2. **地震波：誰先敲門？** - P波與S波的秘密
3. **規模 (Magnitude)** - 地震釋放的能量
4. **深度 (Depth)** - 震央下的秘密
5. **震度 (Intensity)** - 你感受到的搖晃

---

## 🚀 快速開始

### 環境需求

- Node.js 24
- pnpm 9.10.0

### 本地開發

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 開啟瀏覽器
# http://localhost:3003
```

### 建置與預覽

```bash
# 生產建置（含 SSG 預渲染）
pnpm build

# 預覽建置結果
pnpm preview
```

---

## 📁 專案結構

```
apps/quake-school/
├── public/                  # 靜態資源
│   ├── icons/               # PWA 圖示
│   ├── og-image.svg         # Open Graph 圖片
│   ├── sitemap.xml          # 網站地圖
│   ├── robots.txt           # 爬蟲規則
│   └── llms.txt             # AI 可讀文檔
├── src/
│   ├── components/          # React 組件
│   │   ├── Layout.tsx       # 頁面佈局
│   │   ├── EarthquakeSimulator.tsx  # 地震模擬器
│   │   ├── MagnitudeVisualizer.tsx  # 規模視覺化
│   │   ├── IntensityGrid.tsx        # 震度分級表
│   │   ├── SeismicWaves.tsx         # 地震波動畫
│   │   ├── QuizWidget.tsx           # 測驗元件
│   │   └── Header.tsx               # 頁首導覽
│   ├── pages/               # 頁面組件
│   │   ├── Home.tsx         # 首頁（地震模擬器）
│   │   ├── Lessons.tsx      # 課程頁面
│   │   ├── Quiz.tsx         # 測驗頁面
│   │   └── About.tsx        # 關於頁面
│   ├── data/                # 資料層
│   │   └── lessons.ts       # 課程內容與測驗題目
│   ├── seo/                 # SEO 配置
│   │   ├── jsonld.ts        # 結構化資料
│   │   └── meta-tags.ts     # Meta 標籤
│   ├── routes.tsx           # 路由配置
│   └── main.tsx             # 應用入口
├── tests/                   # E2E 測試
├── vite.config.ts           # Vite 配置
├── vitest.config.ts         # Vitest 配置
└── tailwind.config.ts       # Tailwind 配置
```

---

## 🧪 測試

```bash
# 執行單元測試
pnpm test

# 測試覆蓋率報告
pnpm test:coverage

# E2E 測試
pnpm test:e2e

# Lighthouse CI
pnpm lighthouse
```

### 測試覆蓋率目標

| 指標       | 目標 | 當前 |
| ---------- | ---- | ---- |
| Statements | ≥80% | ✅   |
| Branches   | ≥75% | ✅   |
| Functions  | ≥80% | ✅   |
| Lines      | ≥80% | ✅   |

---

## 🎨 技術棧

| 類別         | 技術                      |
| ------------ | ------------------------- |
| **框架**     | React 19 + TypeScript 5.9 |
| **建置工具** | Vite 8 + esbuild          |
| **樣式**     | Tailwind CSS 3.4          |
| **動畫**     | Motion (Framer Motion)    |
| **SSG**      | vite-react-ssg            |
| **PWA**      | vite-plugin-pwa           |
| **測試**     | Vitest + Playwright       |
| **部署**     | Zeabur / Docker           |

### 設計特色

- **天空藍主題** - 清新教育風格設計
- **互動式動畫** - 地震波、規模視覺化
- **漸進式難度** - 幼兒園到進階分級
- **RWD 響應式設計** - 完美適配各種裝置

---

## 🔍 SEO 優化

本專案實施完整的 SEO 最佳實踐：

### 結構化資料 (JSON-LD)

- ✅ `Course` - 地震課程資訊
- ✅ `Quiz` - 互動測驗
- ✅ `Organization` - 組織資訊
- ✅ `WebSite` - 網站搜尋功能
- ✅ `FAQPage` - FAQ 頁面
- ✅ `HowTo` - 使用指南
- ✅ `BreadcrumbList` - 麵包屑導航

### AI 搜尋優化 (LLMO/GEO)

- ✅ `llms.txt` - AI 可讀文檔
- ✅ `robots.txt` - 允許 GPTBot、ClaudeBot 等 AI 爬蟲

### 目標關鍵字

- 地震教學
- 震度規模差異
- 地震成因
- P波S波
- 台灣地震
- 地震防災教育
- 震度分級

---

## 📊 效能指標

| 指標           | 目標   | 當前 |
| -------------- | ------ | ---- |
| Performance    | ≥90    | ✅   |
| Accessibility  | ≥90    | ✅   |
| Best Practices | ≥90    | ✅   |
| SEO            | 100    | ✅   |
| LCP            | ≤2.5s  | ✅   |
| FID            | ≤100ms | ✅   |
| CLS            | ≤0.1   | ✅   |

---

## 📚 參考資料

1. **中央氣象署** - 地震測報中心
2. **USGS** - 美國地質調查所
3. **日本氣象廳** - 地震情報

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

- **開發者** - [haotool](https://haotool.org)
- **作者** - [@azlife_1224](https://twitter.com/azlife_1224)

---

<div align="center">

**讓地震知識變得簡單有趣！**

Made with ❤️ by [haotool](https://haotool.org)

</div>
