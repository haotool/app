/\*\*

- 霓虹賽博風格 (Neon Cyberpunk) - 歷史歸檔
-
- 創建時間: 2025-10-23T01:18:11+08:00
- 歸檔時間: 2025-10-23T02:35:57+08:00
- 歸檔原因: 採用棉花糖甜心風格作為主要設計
-
- 設計靈感：
- - Cyberpunk 2077 遊戲 UI
- - Blade Runner 霓虹美學
- - 賽博龐克文化元素
- - 未來科技感視覺語言
-
- 核心配色：
- - 背景：bg-slate-950 (深黑色)
- - 邊框：border-purple-500 (霓虹紫)
- - 發光：rgba(139, 92, 246, 0.5-0.8)
- - 文字：text-white (主), text-purple-300 (次)
- - 按鈕：bg-purple-500 with glow effect
-
- 特色元素：
- - 霓虹發光效果 (box-shadow glow)
- - 掃描線動畫 (repeating-linear-gradient)
- - 切角設計 (clip-path polygon)
- - 全大寫英文文字 (uppercase)
- - 等寬字體 (font-mono)
- - 脈衝動畫 (animate-pulse)
-
- 適用場景：
- - 科技類應用
- - 遊戲平台
- - 開發者工具
- - 需要未來感、酷炫風格的產品
- - 夜間模式優先的應用
    \*/

import { type FC } from 'react';

interface NeonCyberVariantProps {
offlineReady: boolean;
needRefresh: boolean;
onUpdate: () => void;
onClose: () => void;
}

export const NeonCyberVariant: FC<NeonCyberVariantProps> = ({
offlineReady,
needRefresh,
onUpdate,
onClose,
}) => {
return (

<div
className="
relative overflow-hidden
w-80 max-w-[calc(100vw-2rem)]
bg-slate-950
border border-purple-500
animate-slide-in-bounce
"
style={{
        clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
        boxShadow: `
          0 0 20px rgba(139, 92, 246, 0.5),
          0 0 40px rgba(139, 92, 246, 0.3),
          inset 0 0 20px rgba(139, 92, 246, 0.1)
        `,
      }}
role="alertdialog"
aria-labelledby="notification-title"
aria-describedby="notification-description" >
{/_ 掃描線效果 _/}
<div
className="absolute inset-0 pointer-events-none"
style={{
          background:
            'repeating-linear-gradient(0deg, rgba(139, 92, 246, 0.05) 0px, transparent 2px, transparent 4px)',
        }}
aria-hidden="true"
/>

      {/* 右上角切角裝飾 */}
      <div
        className="absolute top-0 right-0 w-20 h-20"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, rgba(139, 92, 246, 0.2) 50%)',
        }}
        aria-hidden="true"
      />

      {/* 內容區域 */}
      <div className="relative p-5">
        {/* 標題區 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* 動畫圖標 */}
            <div
              className="w-10 h-10 bg-purple-500 flex items-center justify-center animate-pulse"
              style={{
                clipPath:
                  'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.8)',
              }}
            >
              <svg
                className="w-5 h-5 text-white"
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

            {/* 標題文字 */}
            <div>
              <h2
                id="notification-title"
                className="text-base font-bold uppercase tracking-wide"
                style={{
                  color: '#fff',
                  textShadow: '0 0 10px rgba(139, 92, 246, 0.8)',
                }}
              >
                {offlineReady ? 'OFFLINE READY' : 'UPDATE AVAILABLE'}
              </h2>
              <p className="text-xs text-purple-300 mt-0.5 font-mono">
                {offlineReady ? 'System cached' : 'New version detected'}
              </p>
            </div>
          </div>

          {/* 關閉按鈕 */}
          <button
            onClick={onClose}
            className="p-1.5 text-purple-400 hover:text-purple-300 transition-colors"
            style={{
              textShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
            }}
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

        {/* 分隔線 */}
        <div
          className="h-px mb-4"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), transparent)',
          }}
          aria-hidden="true"
        />

        {/* 描述文字 */}
        <p
          id="notification-description"
          className="text-sm text-purple-200 mb-5 leading-relaxed font-mono"
        >
          {offlineReady ? '> Application cached successfully' : '> New version ready to install'}
        </p>

        {/* 按鈕區 */}
        <div className="flex space-x-2">
          {needRefresh && (
            <button
              onClick={onUpdate}
              className="
                flex-1 px-4 py-2.5 uppercase text-sm font-bold
                bg-purple-500 text-white
                border border-purple-400
                hover:bg-purple-600
                active:scale-[0.98]
                transition-all duration-200
              "
              style={{
                clipPath:
                  'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)',
              }}
            >
              Execute
            </button>
          )}

          <button
            onClick={onClose}
            className="
              px-4 py-2.5 uppercase text-sm font-bold
              bg-slate-900 text-purple-300
              border border-purple-500/30
              hover:bg-slate-800
              active:scale-[0.98]
              transition-all duration-200
            "
            style={{
              clipPath:
                'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
            }}
          >
            {needRefresh ? 'Skip' : 'Close'}
          </button>
        </div>
      </div>

      {/* 底部霓虹線 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 1), transparent)',
          boxShadow: '0 0 10px rgba(139, 92, 246, 0.8)',
        }}
        aria-hidden="true"
      />
    </div>

);
};

/\*\*

- CSS 動畫定義（需要在 index.css 中）
  \*/
  export const neonCyberAnimations = `
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

/_ 額外的脈衝動畫已內建在 Tailwind (animate-pulse) _/
`;

/\*\*

- 設計規範說明
  \*/
  export const neonCyberDesignSpec = {
  name: '霓虹賽博',
  nameEn: 'Neon Cyberpunk',
  version: '1.0.0',

colors: {
background: '#020617', // slate-950
border: '#a855f7', // purple-500
glow: {
primary: 'rgba(139, 92, 246, 0.5)',
secondary: 'rgba(139, 92, 246, 0.3)',
inset: 'rgba(139, 92, 246, 0.1)',
},
text: {
primary: '#ffffff',
secondary: '#d8b4fe', // purple-300
accent: '#e9d5ff', // purple-200
},
button: {
primary: '#a855f7', // purple-500
primaryHover: '#9333ea', // purple-600
primaryBorder: '#c084fc', // purple-400
secondary: '#0f172a', // slate-900
secondaryBorder: 'rgba(168, 85, 247, 0.3)', // purple-500/30
},
decoration: {
scanlines: 'rgba(139, 92, 246, 0.05)',
corner: 'rgba(139, 92, 246, 0.2)',
divider: 'rgba(139, 92, 246, 0.5)',
bottomGlow: 'rgba(139, 92, 246, 1)',
},
},

clipPaths: {
container: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
icon: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
button:
'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
},

effects: {
glowShadow:
'0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3), inset 0 0 20px rgba(139, 92, 246, 0.1)',
iconGlow: '0 0 20px rgba(139, 92, 246, 0.8)',
buttonGlow: '0 0 15px rgba(139, 92, 246, 0.5)',
textGlow: '0 0 10px rgba(139, 92, 246, 0.8)',
bottomLineGlow: '0 0 10px rgba(139, 92, 246, 0.8)',
},

spacing: {
container: {
padding: '20px',
},
elements: {
gap: '12px',
iconSize: '40px',
},
},

typography: {
title: {
transform: 'uppercase',
fontWeight: 700,
letterSpacing: 'wide',
fontFamily: 'monospace (for some elements)',
},
body: {
fontFamily: 'monospace',
prefix: '>',
},
},

animation: {
duration: '500ms',
easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
iconPulse: 'animate-pulse (built-in Tailwind)',
},

characteristics: [
'強烈的視覺衝擊力',
'霓虹發光效果',
'未來科技感',
'適合深色模式',
'切角幾何設計',
'全大寫英文文字',
],

technicalNotes: [
'clip-path 可能不支援舊版瀏覽器',
'多層 box-shadow 可能影響效能',
'建議在深色環境下使用',
'文字發光效果需注意可讀性',
],
};
