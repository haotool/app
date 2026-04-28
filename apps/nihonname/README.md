<div align="center">

# 🏯 NihonName 皇民化改姓生成器

**探索 1940 年代台灣皇民化運動的歷史改姓對照**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff?logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-GPL--3.0-green)](./LICENSE)

[🌐 線上體驗](https://app.haotool.org/nihonname/) · [📖 歷史專區](https://app.haotool.org/nihonname/history/) · [🐛 回報問題](https://github.com/haotool/app/issues)

</div>

---

## 📋 專案概述

**NihonName（姓名變換所）** 是一個探索台灣日治時期歷史的網頁應用程式，讓使用者透過輸入自己的姓氏，了解在 1940 年代皇民化運動期間，該姓氏可能對應的日式姓名。

### ✨ 主要功能

- **🎌 姓名變換所** - 輸入中文姓氏，查詢歷史上的日式改姓對照
- **📚 歷史專區** - 深入了解皇民化運動、馬關條約、舊金山和約等重要歷史事件
- **🎲 諧音梗名字** - 500+ 趣味諧音日本名，支援自訂創作
- **📸 截圖模式** - 一鍵隱藏 UI，方便分享結果
- **📱 PWA 支援** - 可安裝至手機主畫面，離線使用

### 📖 歷史背景

皇民化運動（1937-1945）是日本殖民政府在台灣推行的同化政策，其中「改姓名」運動讓許多台灣人家庭將漢姓改為日式姓名。本系統依據歷史文獻《内地式改姓名の仕方》，重現當時的改姓對照關係。

**改姓三原則：**

1. **語意翻譯** - 如：林 → 林（Hayashi）、高 → 高山（Takayama）
2. **字形拆解** - 如：林 → 二木（Futaki）、黃 → 共田（Tomoda）
3. **讀音近似** - 如：蔡 → 佐井（Sai）、許 → 許田（Kyoda）

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
# http://localhost:3002
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
apps/nihonname/
├── public/                  # 靜態資源
│   ├── icons/               # PWA 圖示
│   ├── og-image.png         # Open Graph 圖片
│   ├── sitemap.xml          # 網站地圖
│   ├── robots.txt           # 爬蟲規則
│   └── llms.txt             # AI 可讀文檔
├── src/
│   ├── components/          # React 組件
│   │   ├── Layout.tsx       # 頁面佈局
│   │   ├── SEOHelmet.tsx    # SEO 元件（單一來源）
│   │   ├── WashiPaper.tsx   # 和紙質感組件
│   │   ├── RollingText.tsx  # 滾動文字動畫
│   │   └── JapaneseDiceButton.tsx # 日式骰子按鈕
│   ├── pages/               # 頁面組件
│   │   ├── Home.tsx         # 首頁（姓名變換所）
│   │   ├── About.tsx        # 關於頁面
│   │   ├── Guide.tsx        # 使用指南
│   │   └── history/         # 歷史專區
│   │       ├── index.tsx    # 歷史首頁
│   │       ├── KominkaMovement.tsx    # 皇民化運動
│   │       ├── ShimonosekiTreaty.tsx  # 馬關條約
│   │       └── SanFranciscoTreaty.tsx # 舊金山和約
│   ├── hooks/               # 自訂 Hooks
│   ├── constants.ts         # 姓氏對照資料庫
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
pnpm vitest run --coverage

# E2E 測試
pnpm playwright test
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
| **框架**     | React 19 + TypeScript 5.7 |
| **建置工具** | Vite 8 + esbuild          |
| **樣式**     | Tailwind CSS 3.4          |
| **SSG**      | vite-react-ssg            |
| **PWA**      | vite-plugin-pwa           |
| **測試**     | Vitest + Playwright       |
| **部署**     | Zeabur / Docker           |

### 設計特色

- **和紙質感 UI** - 日式傳統美學設計
- **青海波紋/麻葉紋** - 經典日本傳統紋樣
- **櫻花飄落動畫** - 沉浸式視覺體驗
- **RWD 響應式設計** - 完美適配各種裝置

---

## 🔍 SEO 優化

本專案實施完整的 SEO 最佳實踐：

### 結構化資料 (JSON-LD)

- ✅ `WebApplication` - 應用程式資訊
- ✅ `Organization` - 組織資訊
- ✅ `WebSite` - 網站搜尋功能
- ✅ `FAQPage` - FAQ 頁面
- ✅ `Article` - 歷史文章
- ✅ `BreadcrumbList` - 麵包屑導航
- ✅ `HowTo` - 使用指南

### AI 搜尋優化 (LLMO/GEO)

- ✅ `llms.txt` - AI 可讀文檔
- ✅ `robots.txt` - 允許 GPTBot、ClaudeBot 等 AI 爬蟲

### 目標關鍵字

- 皇民化改姓運動
- 姓名變換所
- 台灣人改姓名單
- 舊金山和約
- 日治時代改姓名單
- 馬關條約
- 日治時期改名
- 改日本姓

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

## 📚 資料來源

1. **《内地式改姓名の仕方》** - 宮山豐源、廣田藤雄 著
2. **臺灣總督府檔案** - 國史館台灣文獻館
3. **巴哈姆特** - [日治時期台灣人更改姓名活動及辦法](https://m.gamer.com.tw/home/creationDetail.php?sn=5844723)

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

**本系統僅供歷史教育與娛樂用途**

Made with ❤️ by [haotool](https://haotool.org)

</div>
