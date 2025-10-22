/\*\*

- 粉彩雲朵風格 (Pastel Cloud) - 歷史歸檔
-
- 創建時間: 2025-10-23T01:30:00+08:00
- 歸檔時間: 2025-10-23T02:35:57+08:00
- 歸檔原因: 採用棉花糖甜心風格作為主要設計
-
- 設計靈感：
- - 柔和天空色調 + 雲朵質感
- - 清晨薄霧的柔和感受
- - 極度柔和的視覺體驗
-
- 核心配色：
- - 背景：from-purple-50 via-blue-50 to-purple-100
- - 圖標：from-purple-200 to-blue-200
- - 文字：text-purple-800 (主標題), text-purple-600 (描述)
- - 按鈕：from-purple-400 to-blue-400
-
- 特色元素：
- - 雲朵裝飾（模糊圓形，blur-2xl）
- - 天空色調漸變
- - 純淨清新的配色
- - 柔和的陰影效果
-
- 適用場景：
- - 需要極度柔和、舒緩的視覺體驗
- - 天氣類應用
- - 冥想、放鬆類應用
- - 早晨使用的應用程式
    \*/

import { type FC } from 'react';

interface PastelCloudVariantProps {
offlineReady: boolean;
needRefresh: boolean;
onUpdate: () => void;
onClose: () => void;
}

export const PastelCloudVariant: FC<PastelCloudVariantProps> = ({
offlineReady,
needRefresh,
onUpdate,
onClose,
}) => {
return (
<div
className="
relative overflow-hidden rounded-3xl
w-80 max-w-[calc(100vw-2rem)]
bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100
border border-purple-200/50
shadow-lg
animate-slide-in-bounce
"
style={{
        boxShadow: '0 10px 40px -10px rgba(139, 92, 246, 0.15)',
      }}
role="alertdialog"
aria-labelledby="notification-title"
aria-describedby="notification-description" >
{/_ 裝飾性雲朵 - 頂部 _/}
<div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/40 blur-2xl"
        aria-hidden="true"
      />

      {/* 裝飾性雲朵 - 底部 */}
      <div
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-purple-100/40 blur-2xl"
        aria-hidden="true"
      />

      {/* 內容區域 */}
      <div className="relative p-6">
        {/* 圖標 */}
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-200 to-blue-200 flex items-center justify-center shadow-md">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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

        {/* 標題 */}
        <h2 id="notification-title" className="text-xl font-bold text-purple-800 mb-2 text-center">
          {offlineReady ? '離線模式已就緒' : '發現新版本'}
        </h2>

        {/* 描述 */}
        <p id="notification-description" className="text-sm text-purple-600 mb-5 leading-relaxed text-center">
          {offlineReady ? '應用程式已緩存，現在可以離線使用' : '新版本包含改進和錯誤修復'}
        </p>

        {/* 按鈕 */}
        <div className="flex flex-col space-y-2">
          {needRefresh && (
            <button
              onClick={onUpdate}
              className="
                w-full px-4 py-3 rounded-2xl
                bg-gradient-to-r from-purple-400 to-blue-400
                text-white text-sm font-bold
                shadow-md hover:shadow-lg
                hover:from-purple-500 hover:to-blue-500
                active:scale-[0.98]
                transition-all duration-200
              "
            >
              立即更新
            </button>
          )}

          <button
            onClick={onClose}
            className="
              w-full px-4 py-3 rounded-2xl
              bg-white/80 backdrop-blur-sm
              text-purple-600
              text-sm font-semibold
              border border-purple-200
              hover:bg-white
              active:scale-[0.98]
              transition-all duration-200
            "
          >
            {needRefresh ? '稍後提醒' : '知道了'}
          </button>
        </div>
      </div>

      {/* 關閉按鈕 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        aria-label="關閉通知"
      >
        <svg
          className="w-4 h-4 text-purple-400"
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

);
};

/\*\*

- CSS 動畫定義（需要在 index.css 中）
  \*/
  export const pastelCloudAnimations = `
  @keyframes slide-in-bounce {
  0% {
  transform: translateY(-1rem) scale(0.95);
  opacity: 0;
  }
  50% {
  transform: translateY(0.25rem) scale(1.01);
  }
  100% {
  transform: translateY(0) scale(1);
  opacity: 1;
  }
  }

.animate-slide-in-bounce {
animation: slide-in-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
`;

/\*\*

- 設計規範說明
  \*/
  export const pastelCloudDesignSpec = {
  name: '粉彩雲朵',
  nameEn: 'Pastel Cloud',
  version: '1.0.0',

colors: {
background: {
from: '#faf5ff', // purple-50
via: '#eff6ff', // blue-50
to: '#f3e8ff', // purple-100
},
border: '#e9d5ff', // purple-200
icon: {
gradient: 'from #e9d5ff to #bfdbfe', // purple-200 to blue-200
text: '#9333ea', // purple-600
},
text: {
title: '#6b21a8', // purple-800
description: '#9333ea', // purple-600
},
button: {
primary: 'from #c084fc to #60a5fa', // purple-400 to blue-400
primaryHover: 'from #a855f7 to #3b82f6', // purple-500 to blue-500
secondary: 'rgba(255, 255, 255, 0.8)',
secondaryBorder: '#e9d5ff', // purple-200
},
decoration: {
topCloud: 'rgba(255, 255, 255, 0.4)',
bottomCloud: 'rgba(243, 232, 255, 0.4)', // purple-100/40
},
},

spacing: {
container: {
padding: '24px',
borderRadius: '24px',
},
elements: {
gap: '16px',
iconSize: '64px',
},
},

shadow: '0 10px 40px -10px rgba(139, 92, 246, 0.15)',

animation: {
duration: '500ms',
easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
},

characteristics: [
'極度柔和的視覺體驗',
'雲朵般的裝飾效果',
'天空色調漸變',
'適合放鬆場景',
],
};
