import { useState } from 'react';

/**
 * UpdatePrompt UI Showcase - 5 設計方案
 *
 * 創建時間: 2025-10-23T01:18:11+08:00
 * 設計靈感來源:
 * - shadcn/ui (權威UI組件庫)
 * - Smashing Magazine (設計趨勢)
 * - CSS-Tricks (現代CSS技術)
 * - NN/g (用戶體驗研究)
 *
 * 配色基於當前專案: purple-500 (#8b5cf6) to blue-500 (#3b82f6)
 */

type VariantType = 'liquid-glass' | 'flat-minimal' | 'neumorphism' | 'neon-cyber' | 'soft-gradient';

interface UpdatePromptVariantProps {
  variant: VariantType;
  offlineReady: boolean;
  needRefresh: boolean;
  onUpdate: () => void;
  onClose: () => void;
}

/**
 * 方案 1: 液態玻璃效果 (Liquid Glass / Glassmorphism)
 * 靈感: iOS 設計語言 + macOS Big Sur
 * 特點: backdrop-blur + 半透明 + 內陰影
 */
function LiquidGlassVariant({
  offlineReady,
  needRefresh,
  onUpdate,
  onClose,
}: Omit<UpdatePromptVariantProps, 'variant'>) {
  return (
    <div
      className="
        relative overflow-hidden rounded-2xl
        w-80 max-w-[calc(100vw-2rem)]
        backdrop-blur-xl backdrop-saturate-150
        bg-white/70 dark:bg-slate-900/70
        border border-white/20 dark:border-slate-700/30
        shadow-2xl shadow-purple-500/10
        animate-slide-in-bounce
      "
      style={{
        boxShadow: `
          0 20px 60px -15px rgba(139, 92, 246, 0.3),
          0 0 0 1px rgba(255, 255, 255, 0.1) inset,
          0 1px 0 0 rgba(255, 255, 255, 0.3) inset
        `,
      }}
    >
      {/* 背景光澤效果 */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none"
        aria-hidden="true"
      />

      {/* 內容區域 */}
      <div className="relative p-5">
        {/* 標題區 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {/* 動畫圖標 */}
            <div
              className="
                w-10 h-10 rounded-full
                bg-gradient-to-br from-purple-500 to-blue-500
                flex items-center justify-center
                animate-ping-slow
                shadow-lg shadow-purple-500/50
              "
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
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                )}
              </svg>
            </div>

            {/* 標題文字 */}
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {offlineReady ? '離線模式已就緒' : '發現新版本'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {offlineReady ? 'App 已可離線使用' : '點擊重新載入以更新'}
              </p>
            </div>
          </div>

          {/* 關閉按鈕 */}
          <button
            onClick={onClose}
            className="
              -mr-1 -mt-1 p-1.5 rounded-lg
              text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
              hover:bg-slate-100/50 dark:hover:bg-slate-800/50
              transition-colors duration-200
            "
            aria-label="關閉通知"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 描述文字 */}
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
          {offlineReady
            ? '應用程式已緩存到您的設備上，現在可以離線使用。'
            : '我們發布了新版本，包含改進和錯誤修復。建議立即更新以獲得最佳體驗。'}
        </p>

        {/* 按鈕區 */}
        <div className="flex space-x-2">
          {needRefresh && (
            <button
              onClick={onUpdate}
              className="
                flex-1 px-4 py-2.5 rounded-xl
                bg-gradient-to-r from-purple-500 to-blue-500
                text-white text-sm font-medium
                shadow-lg shadow-purple-500/30
                hover:shadow-xl hover:shadow-purple-500/40
                hover:scale-[1.02]
                active:scale-[0.98]
                transition-all duration-200
                animate-pulse-soft
              "
            >
              <span className="flex items-center justify-center space-x-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>立即更新</span>
              </span>
            </button>
          )}

          <button
            onClick={onClose}
            className="
              px-4 py-2.5 rounded-xl
              bg-slate-100/80 dark:bg-slate-800/80
              text-slate-700 dark:text-slate-300
              text-sm font-medium
              hover:bg-slate-200/80 dark:hover:bg-slate-700/80
              active:scale-[0.98]
              transition-all duration-200
            "
          >
            {needRefresh ? '稍後提醒' : '知道了'}
          </button>
        </div>
      </div>

      {/* 底部微光效果 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * 方案 2: 極簡扁平風格 (Flat Minimal)
 * 靈感: Apple HIG + Material Design 3
 * 特點: 純色 + 清晰層次 + 大字體
 */
function FlatMinimalVariant({
  offlineReady,
  needRefresh,
  onUpdate,
  onClose,
}: Omit<UpdatePromptVariantProps, 'variant'>) {
  return (
    <div
      className="
        relative overflow-hidden rounded-3xl
        w-80 max-w-[calc(100vw-2rem)]
        bg-white dark:bg-slate-900
        border-2 border-purple-500/20
        shadow-xl
        animate-slide-in-bounce
      "
    >
      {/* 頂部色塊 */}
      <div className="h-1.5 bg-gradient-to-r from-purple-500 to-blue-500" aria-hidden="true" />

      {/* 內容區域 */}
      <div className="p-6">
        {/* 圖標 */}
        <div className="mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        {/* 標題 */}
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {offlineReady ? '離線模式已就緒' : '發現新版本'}
        </h2>

        {/* 描述 */}
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          {offlineReady
            ? '應用程式已緩存到您的設備上，現在可以離線使用。'
            : '我們發布了新版本，包含改進和錯誤修復。'}
        </p>

        {/* 按鈕 */}
        <div className="flex flex-col space-y-2">
          {needRefresh && (
            <button
              onClick={onUpdate}
              className="
                w-full px-4 py-3 rounded-2xl
                bg-gradient-to-r from-purple-500 to-blue-500
                text-white text-sm font-bold
                hover:from-purple-600 hover:to-blue-600
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
              bg-slate-100 dark:bg-slate-800
              text-slate-700 dark:text-slate-300
              text-sm font-semibold
              hover:bg-slate-200 dark:hover:bg-slate-700
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
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="關閉通知"
      >
        <svg
          className="w-4 h-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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
}

/**
 * 方案 3: 新擬態風格 (Neumorphism)
 * 靈感: Dribbble Neumorphism 設計
 * 特點: 柔和陰影 + 內凹外凸 + 漸變
 */
function NeumorphismVariant({
  offlineReady,
  needRefresh,
  onUpdate,
  onClose,
}: Omit<UpdatePromptVariantProps, 'variant'>) {
  return (
    <div
      className="
        relative overflow-hidden rounded-3xl
        w-80 max-w-[calc(100vw-2rem)]
        bg-slate-50 dark:bg-slate-900
        animate-slide-in-bounce
      "
      style={{
        boxShadow: `
          12px 12px 24px rgba(100, 100, 111, 0.15),
          -12px -12px 24px rgba(255, 255, 255, 0.9)
        `,
      }}
    >
      {/* 內容區域 */}
      <div className="p-6">
        {/* 圖標 - 內凹效果 */}
        <div className="mb-4 flex justify-center">
          <div
            className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center"
            style={{
              boxShadow: `
                inset 6px 6px 12px rgba(100, 100, 111, 0.2),
                inset -6px -6px 12px rgba(255, 255, 255, 0.7)
              `,
            }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 text-center">
          {offlineReady ? '離線模式已就緒' : '發現新版本'}
        </h2>

        {/* 描述 */}
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed text-center">
          {offlineReady ? 'App 已可離線使用' : '點擊重新載入以更新'}
        </p>

        {/* 按鈕 - 外凸效果 */}
        <div className="flex flex-col space-y-3">
          {needRefresh && (
            <button
              onClick={onUpdate}
              className="
                w-full px-4 py-3 rounded-2xl
                bg-slate-50 dark:bg-slate-900
                text-sm font-bold
                hover:scale-[1.02]
                active:scale-[0.98]
                transition-all duration-200
              "
              style={{
                boxShadow: `
                  6px 6px 12px rgba(100, 100, 111, 0.15),
                  -6px -6px 12px rgba(255, 255, 255, 0.9)
                `,
              }}
            >
              <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                立即更新
              </span>
            </button>
          )}

          <button
            onClick={onClose}
            className="
              w-full px-4 py-3 rounded-2xl
              bg-slate-50 dark:bg-slate-900
              text-slate-600 dark:text-slate-400
              text-sm font-semibold
              hover:scale-[1.02]
              active:scale-[0.98]
              transition-all duration-200
            "
            style={{
              boxShadow: `
                4px 4px 8px rgba(100, 100, 111, 0.1),
                -4px -4px 8px rgba(255, 255, 255, 0.9)
              `,
            }}
          >
            {needRefresh ? '稍後提醒' : '知道了'}
          </button>
        </div>
      </div>

      {/* 關閉按鈕 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full transition-all"
        style={{
          boxShadow: `
            3px 3px 6px rgba(100, 100, 111, 0.1),
            -3px -3px 6px rgba(255, 255, 255, 0.9)
          `,
        }}
        aria-label="關閉通知"
      >
        <svg
          className="w-4 h-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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
}

/**
 * 方案 4: 霓虹賽博風格 (Neon Cyberpunk)
 * 靈感: Cyberpunk 2077 UI + Neon aesthetics
 * 特點: 強烈色彩 + 發光效果 + 銳利邊緣
 */
function NeonCyberVariant({
  offlineReady,
  needRefresh,
  onUpdate,
  onClose,
}: Omit<UpdatePromptVariantProps, 'variant'>) {
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
    >
      {/* 掃描線效果 */}
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <p className="text-sm text-purple-200 mb-5 leading-relaxed font-mono">
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
}

/**
 * 方案 5: 柔和漸變風格 (Soft Gradient)
 * 靈感: Instagram UI + Gradient Mesh
 * 特點: 多彩漸變 + 柔和過渡 + 圓潤設計
 */
function SoftGradientVariant({
  offlineReady,
  needRefresh,
  onUpdate,
  onClose,
}: Omit<UpdatePromptVariantProps, 'variant'>) {
  return (
    <div
      className="
        relative overflow-hidden rounded-3xl
        w-80 max-w-[calc(100vw-2rem)]
        bg-white dark:bg-slate-900
        shadow-2xl
        animate-slide-in-bounce
      "
    >
      {/* 漸變背景 */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.2) 0%, transparent 70%)
          `,
        }}
        aria-hidden="true"
      />

      {/* 內容區域 */}
      <div className="relative p-6">
        {/* 圖標 */}
        <div className="mb-4 flex justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #a855f7 100%)',
            }}
          >
            {/* 光暈效果 */}
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #a855f7 100%)',
                opacity: 0.3,
              }}
            />
            <svg
              className="w-8 h-8 text-white relative z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        {/* 標題 */}
        <h2
          className="text-xl font-bold mb-2 text-center bg-clip-text text-transparent"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {offlineReady ? '離線模式已就緒' : '發現新版本'}
        </h2>

        {/* 描述 */}
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed text-center">
          {offlineReady ? '應用程式已緩存，可離線使用' : '新版本包含改進和錯誤修復'}
        </p>

        {/* 按鈕 */}
        <div className="flex flex-col space-y-2">
          {needRefresh && (
            <button
              onClick={onUpdate}
              className="
                w-full px-4 py-3 rounded-2xl
                text-white text-sm font-bold
                hover:scale-[1.02]
                active:scale-[0.98]
                transition-all duration-200
                relative overflow-hidden
              "
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #a855f7 100%)',
              }}
            >
              {/* 按鈕光暈 */}
              <div
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                }}
              />
              <span className="relative z-10">立即更新</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="
              w-full px-4 py-3 rounded-2xl
              bg-slate-100 dark:bg-slate-800
              text-slate-700 dark:text-slate-300
              text-sm font-semibold
              hover:bg-slate-200 dark:hover:bg-slate-700
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
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="關閉通知"
      >
        <svg
          className="w-4 h-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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
}

/**
 * UpdatePromptVariant - 統一包裝組件
 */
function UpdatePromptVariant(props: UpdatePromptVariantProps) {
  const variants = {
    'liquid-glass': LiquidGlassVariant,
    'flat-minimal': FlatMinimalVariant,
    neumorphism: NeumorphismVariant,
    'neon-cyber': NeonCyberVariant,
    'soft-gradient': SoftGradientVariant,
  };

  const VariantComponent = variants[props.variant];
  return <VariantComponent {...props} />;
}

/**
 * UpdatePromptShowcase - 主展示組件
 * 顯示所有5個設計方案供選擇
 */
export function UpdatePromptShowcase() {
  const [selectedVariant, setSelectedVariant] = useState<VariantType | null>(null);

  const variants: { id: VariantType; name: string; description: string }[] = [
    {
      id: 'liquid-glass',
      name: '液態玻璃效果',
      description: '現代感十足，模糊背景 + 半透明，適合所有場景',
    },
    {
      id: 'flat-minimal',
      name: '極簡扁平風格',
      description: '清晰直接，大字體 + 純色，適合商務應用',
    },
    {
      id: 'neumorphism',
      name: '新擬態風格',
      description: '柔和立體，內凹外凸效果，適合優雅設計',
    },
    {
      id: 'neon-cyber',
      name: '霓虹賽博風格',
      description: '未來感強烈，發光效果 + 銳利邊緣，適合科技應用',
    },
    {
      id: 'soft-gradient',
      name: '柔和漸變風格',
      description: '多彩漸變，圓潤設計，適合創意應用',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-purple-950 dark:to-blue-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            通知視窗設計方案展示
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            基於專案配色 (Purple-Blue) 設計的 5 個專業方案
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
            創建時間: 2025-10-23T01:18:11+08:00 | 參考: shadcn/ui, Smashing Magazine, CSS-Tricks,
            NN/g
          </p>
        </div>

        {/* 方案選擇器 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => setSelectedVariant(variant.id)}
              className={`
                p-6 rounded-2xl border-2 text-left transition-all duration-200
                ${
                  selectedVariant === variant.id
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 scale-105'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 hover:scale-102'
                }
              `}
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {variant.name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{variant.description}</p>
              {selectedVariant === variant.id && (
                <div className="mt-3 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  ✓ 已選擇
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 預覽區域 */}
        {selectedVariant && (
          <div className="bg-slate-100 dark:bg-slate-900 rounded-3xl p-12 min-h-[500px] flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              預覽: {variants.find((v) => v.id === selectedVariant)?.name}
            </h2>

            <div className="flex flex-col space-y-8">
              {/* 離線模式預覽 */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center">
                  場景 1: 離線模式已就緒
                </p>
                <UpdatePromptVariant
                  variant={selectedVariant}
                  offlineReady={true}
                  needRefresh={false}
                  onUpdate={() => console.log('Update clicked')}
                  onClose={() => console.log('Close clicked')}
                />
              </div>

              {/* 更新通知預覽 */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center">
                  場景 2: 發現新版本
                </p>
                <UpdatePromptVariant
                  variant={selectedVariant}
                  offlineReady={false}
                  needRefresh={true}
                  onUpdate={() => console.log('Update clicked')}
                  onClose={() => console.log('Close clicked')}
                />
              </div>
            </div>
          </div>
        )}

        {!selectedVariant && (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            請選擇一個設計方案以查看預覽
          </div>
        )}
      </div>
    </div>
  );
}
