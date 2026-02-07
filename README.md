<div align="center">

# 🛠️ haotool Apps

**現代化 React 應用 Monorepo | Modern React Applications Monorepo**

[![CI](https://github.com/haotool/app/actions/workflows/ci.yml/badge.svg)](https://github.com/haotool/app/actions/workflows/ci.yml)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646cff?logo=vite)](https://vitejs.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-9.10-yellow?logo=pnpm)](https://pnpm.io/)

[English](#english) · [繁體中文](#繁體中文)

</div>

---

## 繁體中文

### 📋 專案概述

**haotool Apps** 是一個專業的 pnpm Monorepo，包含多個高品質的 React 19 應用程式。所有應用程式共享統一的工程標準、CI/CD 管線和開發工具鏈。

「HAO」取自中文「好」的拼音，我們的核心理念是打造真正的「**好工具**」。

### 🚀 應用程式

| 應用                               | 描述                              | 狀態    | 連結                                                            |
| ---------------------------------- | --------------------------------- | ------- | --------------------------------------------------------------- |
| **[RateWise](./apps/ratewise/)**   | 即時匯率換算工具，支援 30+ 種貨幣 | 🟢 Live | [app.haotool.org/ratewise](https://app.haotool.org/ratewise/)   |
| **[NihonName](./apps/nihonname/)** | 日本名字產生器，探索皇民化歷史    | 🟢 Live | [app.haotool.org/nihonname](https://app.haotool.org/nihonname/) |
| **[haotool](./apps/haotool/)**     | 專案展示平台，3D 互動首頁         | 🟢 Live | [app.haotool.org](https://app.haotool.org/)                     |

### ✨ RateWise 匯率好工具

> 基於臺灣銀行牌告匯率的即時匯率 PWA 應用

- 🔄 **雙模式換算**：單幣別與多幣別同時換算
- 💹 **即時匯率**：每 5 分鐘同步臺灣銀行牌告匯率
- 📊 **趨勢圖表**：30 天歷史匯率走勢視覺化
- 📱 **PWA 支援**：可安裝至手機，支援離線使用
- ⭐ **收藏管理**：自訂常用貨幣快速存取

### 🏯 NihonName 皇民化改姓生成器

> 探索 1940 年代台灣皇民化運動的歷史改姓對照

- 🎌 **姓名變換所**：查詢歷史上的日式改姓對照
- 📚 **歷史專區**：皇民化運動、馬關條約、舊金山和約
- 🎲 **諧音梗名字**：500+ 趣味諧音日本名
- 🎨 **和紙質感 UI**：日式傳統美學設計

### 🌐 haotool 專案平台

> 3D 互動展示平台，介紹所有專案

- 🎨 **Three.js 3D 效果**：沉浸式視覺體驗
- 📱 **響應式設計**：完美適配各種裝置
- ⚡ **極致效能**：Lighthouse 95+ 全類別

---

### 🛠️ 技術棧

| 類別         | 技術                         |
| ------------ | ---------------------------- |
| **框架**     | React 19.2 + TypeScript 5.9  |
| **建置工具** | Vite 7.3 + vite-react-ssg    |
| **樣式**     | Tailwind CSS 3.4             |
| **測試**     | Vitest 4.0 + Playwright 1.57 |
| **套件管理** | pnpm 9.10.0 (Monorepo)       |
| **CI/CD**    | GitHub Actions (6 workflows) |
| **部署**     | Docker + Zeabur / Vercel     |
| **安全**     | Gitleaks + Trivy + SARIF     |

### 📊 品質指標

| 指標           | 數值        |
| -------------- | ----------- |
| **測試數量**   | 1000+       |
| **測試覆蓋率** | 92%+        |
| **TypeScript** | Strict Mode |
| **ESLint**     | 0 警告      |
| **Lighthouse** | 95+ 全類別  |
| **CI 管線**    | 6 個全通過  |

### 🚀 快速開始

#### 環境需求

- **Node.js**: >= 24.0.0
- **pnpm**: >= 9.10.0

#### 安裝與開發

```bash
# 複製儲存庫
git clone https://github.com/haotool/app.git
cd app

# 安裝依賴
pnpm install

# 啟動所有應用開發模式
pnpm dev

# 或啟動特定應用
pnpm --filter @app/ratewise dev    # RateWise (http://localhost:4173)
pnpm --filter @app/nihonname dev   # NihonName (http://localhost:3002)
pnpm --filter @app/haotool dev     # haotool (http://localhost:3000)
```

#### 建置與測試

```bash
# 建置所有應用
pnpm build

# 執行測試
pnpm test

# TypeScript 檢查
pnpm typecheck

# ESLint 檢查
pnpm lint
```

### 📁 專案結構

```
haotool-app/
├── apps/
│   ├── ratewise/         # 匯率換算工具
│   ├── nihonname/        # 日本名字產生器
│   ├── haotool/          # 專案展示平台
│   └── shared/           # 共用模組
├── docs/                 # 文檔
├── scripts/              # 自動化腳本
├── .github/
│   └── workflows/        # CI/CD 管線
├── package.json          # Monorepo 根配置
├── pnpm-workspace.yaml   # pnpm workspace 配置
└── tsconfig.base.json    # 共用 TypeScript 配置
```

### 📚 文檔

| 文檔                                           | 描述                 |
| ---------------------------------------------- | -------------------- |
| [AGENTS.md](./AGENTS.md)                       | Agent 工具與工作流程 |
| [LINUS_GUIDE.md](./LINUS_GUIDE.md)             | Linus 風格開發指南   |
| [CONTRIBUTING.md](./CONTRIBUTING.md)           | 貢獻指南             |
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)     | 行為準則             |
| [SECURITY.md](./SECURITY.md)                   | 安全政策             |
| [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) | 提交規範             |

### 🤝 貢獻

歡迎提交 Issue 和 Pull Request！請先閱讀 [貢獻指南](./CONTRIBUTING.md)。

### 📄 授權

本專案採用 [GPL-3.0](./LICENSE) 授權。

### 👥 團隊

- **作者**: [haotool](https://haotool.org)
- **Threads**: [@azlife_1224](https://www.threads.net/@azlife_1224)
- **Email**: haotool.org@gmail.com

---

## English

### 📋 Overview

**haotool Apps** is a professional pnpm Monorepo containing multiple high-quality React 19 applications. All applications share unified engineering standards, CI/CD pipelines, and development toolchains.

"HAO" comes from the Chinese word "好" (good). Our core philosophy is to build truly **good tools**.

### 🚀 Applications

| App                                | Description                                     | Status  | Link                                                            |
| ---------------------------------- | ----------------------------------------------- | ------- | --------------------------------------------------------------- |
| **[RateWise](./apps/ratewise/)**   | Real-time currency converter, 30+ currencies    | 🟢 Live | [app.haotool.org/ratewise](https://app.haotool.org/ratewise/)   |
| **[NihonName](./apps/nihonname/)** | Japanese name generator, historical exploration | 🟢 Live | [app.haotool.org/nihonname](https://app.haotool.org/nihonname/) |
| **[haotool](./apps/haotool/)**     | Project showcase with 3D interactive homepage   | 🟢 Live | [app.haotool.org](https://app.haotool.org/)                     |

### 🛠️ Tech Stack

- **Framework**: React 19.2 + TypeScript 5.9
- **Build**: Vite 7.3 + vite-react-ssg
- **Styling**: Tailwind CSS 3.4
- **Testing**: Vitest 4.0 + Playwright 1.57
- **Package Manager**: pnpm 9.10.0 (Monorepo)
- **CI/CD**: GitHub Actions (6 workflows)
- **Deployment**: Docker + Zeabur / Vercel
- **Security**: Gitleaks + Trivy + SARIF

### 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/haotool/app.git
cd app

# Install dependencies
pnpm install

# Start development
pnpm dev
```

### 📄 License

This project is licensed under [GPL-3.0](./LICENSE).

---

<div align="center">

**Built with ❤️ by [haotool](https://app.haotool.org/)**

[Website](https://haotool.org) · [GitHub](https://github.com/haotool/app) · [Threads](https://www.threads.net/@azlife_1224)

</div>
