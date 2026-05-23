# Design Token SSOT 架構文檔

> 狀態：實作架構說明。當前正式視覺規範請以 root `DESIGN.md` 為主，本文保留技術實作背景與歷史決策。

> **建立時間**: 2026-01-17T00:30:00+08:00
> **最後更新**: 2026-05-23T00:00:00+08:00
> **版本**: 1.1.0
> **狀態**: ✅ 已完成

---

## 1. 概述

RateWise 採用 **SSOT (Single Source of Truth) Design Token** 架構，透過 CSS Variables 實現風格切換，支援 6 種介面風格。正式產品視覺北極星與色票以 root `DESIGN.md` 為準；runtime 實作以 `src/config/themes.ts`、`src/config/design-tokens.ts` 與 `src/index.css` 為準。

### 1.1 核心設計原則

1. **語義化命名**: 使用 `--color-primary`、`--color-accent` 等語義名稱，而非 `--color-blue-500`
2. **風格隔離**: 透過 `data-style` 屬性控制風格變數；現行 runtime 不使用 `data-mode`
3. **FOUC 防護**: 同步腳本在 `<head>` 中初始化主題，避免閃爍
4. **語義 class 優先**: 正式頁優先使用 `bg-surface`、`text-text-muted`、`border-border` 等 Tailwind semantic class；任意 `rgb(var())` 僅保留於 token 定義、SVG/Canvas、內部展示頁與必要 fallback

---

## 2. 檔案結構

```
apps/ratewise/src/
├── config/
│   └── themes.ts          # 主題配置與工具函數
├── hooks/
│   ├── useAppTheme.ts     # 主題管理 Hook
│   └── useTheme.ts        # 基礎主題 Hook
├── index.css              # CSS Variables 定義
└── index.html             # 同步主題初始化腳本
```

---

## 3. 支援的風格

| 風格 ID   | 名稱    | 主色調      | 說明                     |
| --------- | ------- | ----------- | ------------------------ |
| `zen`     | Zen     | 冷靜藍系    | 極簡專業，為產品預設基準 |
| `nitro`   | Nitro   | 青色/霓虹   | 深色科技感               |
| `kawaii`  | Kawaii  | 粉紅/珊瑚   | 可愛粉嫩                 |
| `classic` | Classic | 琥珀/棕色   | 復古書卷                 |
| `ocean`   | Ocean   | 青藍/海洋藍 | 海洋深邃                 |
| `forest`  | Forest  | 翠綠/森林綠 | 自然森林                 |

---

## 4. CSS Variables 結構

### 4.1 核心語義色彩

```css
:root {
  /* 主色 */
  --color-primary: <RGB 值>;
  --color-primary-hover: <RGB 值>;

  /* 輔色 */
  --color-secondary: <RGB 值>;
  --color-accent: <RGB 值>;

  /* 狀態色 */
  --color-info: <RGB 值>;
  --color-success: <RGB 值>;
  --color-warning: <RGB 值>;
  --color-error: <RGB 值>;

  /* 背景 */
  --color-bg: <RGB 值>;
  --color-surface: <RGB 值>;
  --color-card: <RGB 值>;

  /* 文字 */
  --color-text: <RGB 值>;
  --color-text-muted: <RGB 值>;

  /* 圖表專用 */
  --color-chart-line: <RGB 值>;
  --color-chart-area-top: <RGB 值>;
  --color-chart-area-bottom: <RGB 值>;
}
```

### 4.2 主題選擇器

```css
/* 風格選擇器 */
[data-style="zen"] { ... }
[data-style="nitro"] { ... }
[data-style="kawaii"] { ... }
[data-style="classic"] { ... }
[data-style="ocean"] { ... }
[data-style="forest"] { ... }

/* 注意：現行 runtime 已移除 data-mode / dark mode。 */
```

---

## 5. 使用方式

### 5.1 在組件中使用

```tsx
// 正式頁優先使用 semantic class
<div className="bg-primary text-primary-foreground">Primary Background</div>

// 例外：色票預覽、SVG/Canvas 或 fallback HTML 才直接讀 CSS variable。
```

### 5.2 在 Hook 中使用

```tsx
import { useAppTheme } from '../hooks/useAppTheme';

function MyComponent() {
  const { style, setStyle, resetTheme } = useAppTheme();

  return <button onClick={() => setStyle('nitro')}>Switch to Nitro</button>;
}
```

### 5.3 取得圖表顏色

```tsx
import { getChartColors } from '../config/themes';

function TrendChart() {
  const colors = getChartColors();

  return (
    <AreaSeries
      lineColor={colors.lineColor}
      topColor={colors.topColor}
      bottomColor={colors.bottomColor}
    />
  );
}
```

---

## 6. FOUC 防護機制

### 6.1 同步初始化腳本

位於 `index.html` 的 `<head>` 中，在任何 CSS/JS 載入前執行：

```html
<script>
  (function () {
    var STORAGE_KEY = 'ratewise-theme';
    var DEFAULT_STYLE = 'zen';
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        var config = JSON.parse(stored);
        var style = config.style || DEFAULT_STYLE;

        document.documentElement.dataset.style = style;
      }
    } catch (e) {
      document.documentElement.dataset.style = DEFAULT_STYLE;
    }
  })();
</script>
```

### 6.2 React Hook 同步

`useAppTheme.ts` 使用 `useRef` 追蹤首次掛載，避免重複應用主題：

```tsx
const isFirstMount = useRef(true);

useEffect(() => {
  if (isFirstMount.current) {
    isFirstMount.current = false;
    return; // 首次掛載不重新應用主題
  }
  applyTheme(config);
}, [config]);
```

---

## 7. 參考來源

| 來源                                                      | 說明                              |
| --------------------------------------------------------- | --------------------------------- |
| [context7:/websites/react_dev:useLayoutEffect:2026-01-17] | React 官方 SSR/hydration 最佳實踐 |
| [WebSearch:React SSR hydration flickering FOUC fix 2025]  | 業界 FOUC 解決方案                |
| [context7:/tailwindlabs/tailwindcss.com:2026-01-16]       | Tailwind CSS Variables 主題化     |
| [MUI getInitColorSchemeScript]                            | MUI 同步主題腳本參考              |
| [Twilio Paste Design System]                              | CSS Variables + data-theme 模式   |

---

## 8. 測試覆蓋

- `src/config/__tests__/theme-consistency.test.ts` - 主題一致性測試
- `src/config/__tests__/seo-paths.test.ts` - SEO 路徑測試
- 瀏覽器 QA 測試 - 6 種風格 + PWA safe-area / responsive header 檢查

---

## 9. 變更歷史

| 版本  | 日期       | 變更內容                                                                                            |
| ----- | ---------- | --------------------------------------------------------------------------------------------------- |
| 1.1.0 | 2026-05-23 | 對齊現行僅 `data-style` 架構，移除文件中的 `data-mode` 操作說明，補充正式頁 semantic class 優先規則 |
| 1.0.0 | 2026-01-17 | 初始文檔建立，包含 6 種風格 SSOT 架構                                                               |
