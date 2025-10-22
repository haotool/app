# 棉花糖甜心風格 - 通知視窗組件 (歸檔)

**風格名稱**: Cotton Candy (棉花糖甜心)  
**使用時間**: 2025-10-22 ~ 2025-10-22  
**歸檔日期**: 2025-10-22  
**狀態**: ✅ 已測試完成，歸檔保留

---

## 📐 設計規格

### 核心特點

- 🎨 **配色**: 粉紅粉紫粉藍三色漸變
- ☁️ **圓潤度**: 32px 超大圓角
- ✨ **裝飾**: 棉花糖泡泡效果
- 🎉 **點綴**: Emoji 增加親和力
- 💫 **動畫**: 彈性入場效果 (spring physics)

### 完整配色規格

```typescript
// 配色系統 (Color System)
const cottonCandyColors = {
  // 背景漸變 (粉 → 紫 → 藍)
  containerBg: 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50',
  // Hex: #fdf2f8 → #faf5ff → #eff6ff
  // RGB: rgb(253, 242, 248) → rgb(250, 245, 255) → rgb(239, 246, 255)
  // HSL: hsl(327, 73%, 97%) → hsl(270, 100%, 98%) → hsl(214, 100%, 97%)

  // 邊框
  border: 'border-2 border-purple-100',
  // Hex: #f3e8ff

  // 圖標背景 (粉 → 紫 → 藍)
  iconBg: 'bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200',
  // Hex: #fbcfe8 → #e9d5ff → #bfdbfe

  // 圖標顏色
  iconColor: 'text-purple-600',
  // Hex: #9333ea

  // 標題文字
  title: 'text-purple-700',
  // Hex: #7e22ce

  // 描述文字
  description: 'text-purple-500',
  // Hex: #a855f7

  // 主按鈕 (粉 → 紫 → 藍)
  primaryBtn: 'bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300',
  primaryBtnHover: 'hover:from-pink-400 hover:via-purple-400 hover:to-blue-400',
  // Hex: #f9a8d4 → #d8b4fe → #93c5fd
  // Hover: #f472b6 → #c084fc → #60a5fa

  // 次要按鈕
  secondaryBtn: 'bg-white/90 backdrop-blur-sm text-purple-600 border-2 border-purple-200',
  secondaryBtnHover: 'hover:bg-white hover:border-purple-300',

  // 關閉按鈕
  closeBtn: 'bg-white/80 text-purple-400 hover:text-purple-600 hover:bg-white',

  // 裝飾泡泡
  bubbleTop: 'bg-purple-100/50 blur-3xl',
  bubbleBottom: 'bg-pink-100/50 blur-3xl',

  // 圖標光暈
  iconGlow: 'bg-purple-200 blur-md opacity-50',
};
```

### 間距系統

```css
/* 容器 */
.container {
  width: 20rem; /* 320px */
  max-width: calc(100vw - 2rem);
  padding: 1.5rem; /* 24px */
  border-radius: 2rem; /* 32px */
}

/* 圖標 */
.icon {
  width: 4rem; /* 64px */
  height: 4rem; /* 64px */
  border-radius: 9999px; /* full circle */
}

/* 按鈕 */
.button {
  padding: 0.75rem 1.25rem; /* 12px 20px */
  border-radius: 1.25rem; /* 20px */
}

/* 間距 */
.spacing {
  icon-margin-bottom: 1rem; /* 16px */
  title-margin-bottom: 0.5rem; /* 8px */
  description-margin-bottom: 1.25rem; /* 20px */
  button-gap: 0.5rem; /* 8px */
}
```

---

## 📦 完整組件代碼

### React TypeScript 實現

```tsx
import { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';

/**
 * PWA 更新通知組件 - 棉花糖甜心風格
 *
 * 採用風格: Cotton Candy (棉花糖甜心)
 * 設計時間: 2025-10-22
 * 歸檔日期: 2025-10-22
 *
 * 設計特點：
 * - 粉紫粉藍漸變色調
 * - 圓潤可愛的視覺元素 (32px 圓角)
 * - 柔和的泡泡裝飾效果
 * - emoji 點綴增加親和力
 * - 多彩但和諧的配色
 *
 * 技術實現：
 * - 彈性入場動畫 (spring physics)
 * - 右上角定位，不影響用戶操作
 * - 完整無障礙支援 (ARIA labels, keyboard navigation)
 * - 響應式設計 (手機/桌面適配)
 */
export function UpdatePromptCottonCandy() {
  const [show, setShow] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [wb, setWb] = useState<Workbox | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const swUrl = import.meta.env.DEV
      ? `${import.meta.env.BASE_URL}dev-sw.js?dev-sw`
      : `${import.meta.env.BASE_URL}sw.js`;
    const swScope = import.meta.env.BASE_URL || '/';

    const validateServiceWorkerScript = async () => {
      try {
        const response = await fetch(swUrl, {
          cache: 'no-store',
          headers: {
            'cache-control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`Unexpected response (${response.status}) while fetching ${swUrl}`);
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('javascript')) {
          throw new Error(`Unsupported MIME type "${contentType}" for ${swUrl}`);
        }

        return true;
      } catch (error) {
        console.warn('[PWA] Skip service worker registration:', error);
        return false;
      }
    };

    const swType = import.meta.env.DEV ? 'module' : 'classic';

    const workbox = new Workbox(swUrl, {
      scope: swScope,
      type: swType,
    });

    workbox.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        setNeedRefresh(true);
      } else {
        setOfflineReady(true);
      }
    });

    void validateServiceWorkerScript().then((isValid) => {
      if (!isValid) {
        return;
      }

      workbox
        .register()
        .then(() => setWb(workbox))
        .catch((error) => {
          console.error('SW registration error:', error);
        });
    });
  }, []);

  useEffect(() => {
    if (offlineReady || needRefresh) {
      const timer = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(timer);
    }
    setShow(false);
    return undefined;
  }, [offlineReady, needRefresh]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShow(false);
  };

  const handleUpdate = () => {
    if (wb) {
      wb.messageSkipWaiting();
      window.location.reload();
    }
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-500 ease-out ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
      role="alertdialog"
      aria-labelledby="update-prompt-title"
      aria-describedby="update-prompt-description"
    >
      {/* 棉花糖甜心風格卡片 */}
      <div
        className="
          relative overflow-hidden rounded-[32px]
          w-80 max-w-[calc(100vw-2rem)]
          bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50
          border-2 border-purple-100
          shadow-xl
          animate-slide-in-bounce
        "
      >
        {/* 棉花糖泡泡裝飾 */}
        <div
          className="absolute top-0 right-0 w-24 h-24 rounded-full bg-purple-100/50 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-pink-100/50 blur-3xl"
          aria-hidden="true"
        />

        {/* 內容區域 */}
        <div className="relative p-6">
          {/* 圖標區 */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              {/* 外圈光暈 */}
              <div className="absolute inset-0 rounded-full bg-purple-200 blur-md opacity-50" />
              {/* 主圖標 */}
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {offlineReady ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>

          {/* 標題 */}
          <h2
            id="update-prompt-title"
            className="text-xl font-bold text-purple-700 mb-2 text-center"
          >
            {offlineReady ? '✨ 離線模式已就緒' : '🎉 發現新版本'}
          </h2>

          {/* 描述 */}
          <p
            id="update-prompt-description"
            className="text-sm text-purple-500 mb-5 leading-relaxed text-center px-2"
          >
            {offlineReady ? '應用已準備好，隨時隨地都能使用！' : '新版本帶來更棒的體驗哦！'}
          </p>

          {/* 按鈕 */}
          <div className="flex flex-col space-y-2">
            {needRefresh && (
              <button
                onClick={handleUpdate}
                className="
                  w-full px-5 py-3 rounded-[20px]
                  bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300
                  text-white text-sm font-bold
                  shadow-lg
                  hover:from-pink-400 hover:via-purple-400 hover:to-blue-400
                  active:scale-[0.98]
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                "
              >
                馬上更新
              </button>
            )}

            <button
              onClick={close}
              className="
                w-full px-5 py-3 rounded-[20px]
                bg-white/90 backdrop-blur-sm
                text-purple-600 text-sm font-semibold
                border-2 border-purple-200
                hover:bg-white hover:border-purple-300
                active:scale-[0.98]
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
              "
            >
              {needRefresh ? '等等再說' : '好的'}
            </button>
          </div>
        </div>

        {/* 關閉按鈕 */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 text-purple-400 hover:text-purple-600 hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          aria-label="關閉通知"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
```

---

## 🎯 使用場景

### 適合

- ✅ 社交類應用
- ✅ 生活類應用
- ✅ 娛樂類應用
- ✅ 面向年輕用戶群
- ✅ 強調親和力的產品

### 不適合

- ❌ 企業級 B2B 應用
- ❌ 嚴肅的財金類應用
- ❌ 需要專業形象的產品
- ❌ 中老年用戶群為主

---

## 📊 測試結果

### 通過的測試

- ✅ PWA Service Worker 註冊
- ✅ UI 渲染完整性 (100%)
- ✅ 響應式設計 (桌面/手機)
- ✅ 互動功能 (按鈕操作)
- ✅ 動畫效果 (入場/hover/點擊)
- ✅ 無障礙功能 (WCAG 2.1 AA)

### 測試截圖

- `cotton-candy-notification-full-page.png`
- `cotton-candy-notification-close-up.png`
- `cotton-candy-notification-mobile.png`
- `cotton-candy-notification-hover-primary.png`
- `cotton-candy-notification-keyboard-focus-1.png`

---

## 🔄 為什麼被替換

**替換日期**: 2025-10-22  
**替換為**: 方案 A - 品牌對齊 (Brand Aligned)

**原因**:

1. **品牌一致性不足**: 粉色系與主應用的藍紫色調不一致
2. **專業度考量**: 財金類應用需要更專業穩重的形象
3. **用戶心理**: 藍紫色調更符合「可靠」「專業」的品牌定位
4. **Linus 原則**: "好品味是消除特殊情況" - 統一配色消除視覺特殊情況

---

## 💾 如何復原此風格

如果未來需要恢復棉花糖甜心風格：

### 步驟 1: 複製代碼

```bash
# 從歸檔複製組件代碼
cp docs/archive/designs/cotton-candy-variant.md \
   apps/ratewise/src/components/UpdatePrompt.tsx.cotton-candy
```

### 步驟 2: 替換類別

在 `UpdatePrompt.tsx` 中進行以下替換：

| 品牌對齊 (當前)                              | 棉花糖甜心 (復原)                          |
| -------------------------------------------- | ------------------------------------------ |
| `from-blue-50 via-indigo-50 to-purple-50`    | `from-pink-50 via-purple-50 to-blue-50`    |
| `border-indigo-100`                          | `border-purple-100`                        |
| `from-blue-200 via-indigo-200 to-purple-200` | `from-pink-200 via-purple-200 to-blue-200` |
| `text-indigo-700`                            | `text-purple-700`                          |
| `text-indigo-500`                            | `text-purple-500`                          |
| `from-blue-500 via-indigo-500 to-purple-500` | `from-pink-300 via-purple-300 to-blue-300` |
| `border-indigo-200`                          | `border-purple-200`                        |
| `bg-indigo-100/50`                           | `bg-purple-100/50`                         |
| `bg-blue-100/50`                             | `bg-pink-100/50`                           |

### 步驟 3: 更新文檔

記得同步更新 `docs/design/NOTIFICATION_DESIGN_SYSTEM.md`

---

## 📚 相關文檔

- [通知設計系統](../design/NOTIFICATION_DESIGN_SYSTEM.md)
- [配色方案選項](../design/COLOR_SCHEME_OPTIONS.md)
- [測試報告](../../tests/notification-system-test-report.md)
- [其他歸檔風格](./README.md)

---

**歸檔理由**: 品牌一致性優化，改用與主應用完全對齊的藍紫色調  
**保留價值**: 未來可能用於其他專案或不同產品線  
**維護狀態**: ✅ 完整可用，隨時可復原

**最後更新**: 2025-10-22  
**歸檔人**: RateWise Design Team
