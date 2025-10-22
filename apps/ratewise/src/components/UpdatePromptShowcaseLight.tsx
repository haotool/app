import { useState } from 'react';

/**
 * UpdatePrompt UI Showcase - 5 淺色系設計方案
 *
 * 創建時間: 2025-10-23T01:30:00+08:00
 * 設計靈感來源:
 * - shadcn/ui (權威UI組件庫)
 * - Smashing Magazine (設計趨勢)
 * - CSS-Tricks (現代CSS技術)
 * - NN/g (用戶體驗研究)
 *
 * 配色基於當前專案的淺色變體:
 * - purple-100 (#f3e8ff) to purple-200 (#e9d5ff)
 * - blue-100 (#dbeafe) to blue-200 (#bfdbfe)
 */

type VariantType =
  | 'pastel-cloud'
  | 'lavender-mist'
  | 'morning-dew'
  | 'cotton-candy'
  | 'pearl-shimmer';

interface UpdatePromptVariantProps {
  variant: VariantType;
  offlineReady: boolean;
  needRefresh: boolean;
  onUpdate: () => void;
  onClose: () => void;
}

/**
 * 方案 1: 粉彩雲朵 (Pastel Cloud)
 * 靈感: 柔和天空色調 + 雲朵質感
 * 特點: 淺紫淺藍漸層 + 柔和陰影 + 圓潤邊角
 */
function PastelCloudVariant({
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
        bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100
        border border-purple-200/50
        shadow-lg
        animate-slide-in-bounce
      "
      style={{
        boxShadow: '0 10px 40px -10px rgba(139, 92, 246, 0.15)',
      }}
    >
      {/* 裝飾性雲朵 */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/40 blur-2xl"
        aria-hidden="true"
      />
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
        <h2 className="text-xl font-bold text-purple-800 mb-2 text-center">
          {offlineReady ? '離線模式已就緒' : '發現新版本'}
        </h2>

        {/* 描述 */}
        <p className="text-sm text-purple-600 mb-5 leading-relaxed text-center">
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
 * 方案 2: 薰衣草迷霧 (Lavender Mist)
 * 靈感: 薰衣草田 + 清晨薄霧
 * 特點: 淡紫色主調 + 模糊邊緣 + 柔和光暈
 */
function LavenderMistVariant({
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
        bg-purple-50
        border-2 border-purple-200
        shadow-xl
        animate-slide-in-bounce
      "
    >
      {/* 薰衣草色漸層背景 */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(167, 139, 250, 0.3) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(196, 181, 253, 0.3) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* 內容區域 */}
      <div className="relative p-6">
        {/* 標題區 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* 圖標 */}
            <div className="w-12 h-12 rounded-2xl bg-purple-200 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
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
              <h2 className="text-base font-bold text-purple-800">
                {offlineReady ? '離線模式已就緒' : '發現新版本'}
              </h2>
              <p className="text-xs text-purple-500 mt-0.5">
                {offlineReady ? '應用已緩存' : '建議立即更新'}
              </p>
            </div>
          </div>

          {/* 關閉按鈕 */}
          <button
            onClick={onClose}
            className="p-1.5 text-purple-400 hover:text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
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

        {/* 描述 */}
        <p className="text-sm text-purple-600 mb-5 leading-relaxed">
          {offlineReady
            ? '您的應用程式已完整緩存到本地設備，無網路連線時也能正常使用。'
            : '我們發布了新版本，包含功能改進與錯誤修復，建議您立即更新以獲得最佳體驗。'}
        </p>

        {/* 按鈕區 */}
        <div className="flex space-x-2">
          {needRefresh && (
            <button
              onClick={onUpdate}
              className="
                flex-1 px-4 py-2.5 rounded-xl
                bg-purple-400 text-white text-sm font-bold
                hover:bg-purple-500
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
              px-4 py-2.5 rounded-xl
              bg-purple-100 text-purple-700
              text-sm font-semibold
              hover:bg-purple-200
              active:scale-[0.98]
              transition-all duration-200
            "
          >
            {needRefresh ? '稍後提醒' : '知道了'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 方案 3: 晨露清新 (Morning Dew)
 * 靈感: 清晨露水 + 清新空氣
 * 特點: 藍紫混合 + 水滴效果 + 透明感
 */
function MorningDewVariant({
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
        bg-white
        border border-blue-200
        shadow-lg
        animate-slide-in-bounce
      "
      style={{
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.12)',
      }}
    >
      {/* 水滴裝飾 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200" />

      {/* 內容區域 */}
      <div className="p-6">
        {/* 圖標 */}
        <div className="mb-4">
          <div
            className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center"
            style={{
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
            }}
          >
            <svg
              className="w-7 h-7 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {offlineReady ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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
        </div>

        {/* 標題 */}
        <h2 className="text-lg font-bold text-blue-900 mb-2">
          {offlineReady ? '離線模式已就緒' : '發現新版本'}
        </h2>

        {/* 副標題 */}
        <p className="text-xs text-blue-500 font-medium mb-4">
          {offlineReady ? '可離線使用' : '建議更新'}
        </p>

        {/* 描述 */}
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          {offlineReady
            ? '應用程式已完整緩存，即使沒有網路也能正常使用所有功能。'
            : '新版本包含重要更新，點擊下方按鈕即可快速更新。'}
        </p>

        {/* 按鈕 */}
        <div className="flex space-x-2">
          {needRefresh && (
            <button
              onClick={onUpdate}
              className="
                flex-1 px-4 py-3 rounded-2xl
                bg-gradient-to-r from-blue-400 to-purple-400
                text-white text-sm font-bold
                shadow-md hover:shadow-lg
                hover:from-blue-500 hover:to-purple-500
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
              px-4 py-3 rounded-2xl
              bg-blue-50 text-blue-700
              text-sm font-semibold
              border border-blue-200
              hover:bg-blue-100
              active:scale-[0.98]
              transition-all duration-200
            "
          >
            {needRefresh ? '稍後' : '關閉'}
          </button>
        </div>
      </div>

      {/* 關閉按鈕 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-full text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
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
  );
}

/**
 * 方案 4: 棉花糖甜心 (Cotton Candy)
 * 靈感: 棉花糖色調 + 甜美風格
 * 特點: 粉紫粉藍 + 圓潤可愛 + 柔和質感
 */
function CottonCandyVariant({
  offlineReady,
  needRefresh,
  onUpdate,
  onClose,
}: Omit<UpdatePromptVariantProps, 'variant'>) {
  return (
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
        <h2 className="text-xl font-bold text-purple-700 mb-2 text-center">
          {offlineReady ? '✨ 離線模式已就緒' : '🎉 發現新版本'}
        </h2>

        {/* 描述 */}
        <p className="text-sm text-purple-500 mb-5 leading-relaxed text-center px-2">
          {offlineReady ? '應用已準備好，隨時隨地都能使用！' : '新版本帶來更棒的體驗哦！'}
        </p>

        {/* 按鈕 */}
        <div className="flex flex-col space-y-2">
          {needRefresh && (
            <button
              onClick={onUpdate}
              className="
                w-full px-5 py-3 rounded-[20px]
                bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300
                text-white text-sm font-bold
                shadow-lg
                hover:from-pink-400 hover:via-purple-400 hover:to-blue-400
                active:scale-[0.98]
                transition-all duration-200
              "
            >
              馬上更新
            </button>
          )}

          <button
            onClick={onClose}
            className="
              w-full px-5 py-3 rounded-[20px]
              bg-white/90 backdrop-blur-sm
              text-purple-600 text-sm font-semibold
              border-2 border-purple-200
              hover:bg-white hover:border-purple-300
              active:scale-[0.98]
              transition-all duration-200
            "
          >
            {needRefresh ? '等等再說' : '好的'}
          </button>
        </div>
      </div>

      {/* 關閉按鈕 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/80 text-purple-400 hover:text-purple-600 hover:bg-white transition-colors"
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
  );
}

/**
 * 方案 5: 珍珠微光 (Pearl Shimmer)
 * 靈感: 珍珠光澤 + 微光閃爍
 * 特點: 珍珠白底 + 淡彩虹光 + 高級質感
 */
function PearlShimmerVariant({
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
        bg-white
        border border-purple-100
        shadow-2xl
        animate-slide-in-bounce
      "
      style={{
        boxShadow: `
          0 20px 60px -15px rgba(139, 92, 246, 0.12),
          0 0 1px rgba(139, 92, 246, 0.1) inset
        `,
      }}
    >
      {/* 珍珠光澤效果 */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(243, 232, 255, 0.3) 25%,
              rgba(219, 234, 254, 0.3) 50%,
              rgba(243, 232, 255, 0.3) 75%,
              rgba(255, 255, 255, 0) 100%
            )
          `,
        }}
        aria-hidden="true"
      />

      {/* 內容區域 */}
      <div className="relative p-6">
        {/* 標題區 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* 圖標 */}
            <div
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center"
              style={{
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.1)',
              }}
            >
              <svg
                className="w-6 h-6 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {offlineReady ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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
              <h2 className="text-base font-bold text-slate-800">
                {offlineReady ? '離線模式已就緒' : '發現新版本'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {offlineReady ? '應用已準備完成' : '建議立即更新'}
              </p>
            </div>
          </div>

          {/* 關閉按鈕 */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
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

        {/* 描述 */}
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          {offlineReady
            ? '您的應用程式已完整緩存至本地設備，無論是否連接網路都能流暢運行。'
            : '我們發布了包含功能改進與安全性更新的新版本，建議您立即更新以享受最佳使用體驗。'}
        </p>

        {/* 按鈕區 */}
        <div className="flex space-x-2">
          {needRefresh && (
            <button
              onClick={onUpdate}
              className="
                flex-1 px-4 py-2.5 rounded-xl
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
              px-4 py-2.5 rounded-xl
              bg-slate-50 text-slate-700
              text-sm font-semibold
              border border-slate-200
              hover:bg-slate-100
              active:scale-[0.98]
              transition-all duration-200
            "
          >
            {needRefresh ? '稍後提醒' : '知道了'}
          </button>
        </div>
      </div>

      {/* 底部微光 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.2), transparent)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * UpdatePromptVariant - 統一包裝組件
 */
function UpdatePromptVariant(props: UpdatePromptVariantProps) {
  const variants = {
    'pastel-cloud': PastelCloudVariant,
    'lavender-mist': LavenderMistVariant,
    'morning-dew': MorningDewVariant,
    'cotton-candy': CottonCandyVariant,
    'pearl-shimmer': PearlShimmerVariant,
  };

  const VariantComponent = variants[props.variant];
  return <VariantComponent {...props} />;
}

/**
 * UpdatePromptShowcaseLight - 淺色系展示組件
 * 顯示所有5個淺色系設計方案供選擇
 */
export function UpdatePromptShowcaseLight() {
  const [selectedVariant, setSelectedVariant] = useState<VariantType | null>(null);

  const variants: { id: VariantType; name: string; description: string }[] = [
    {
      id: 'pastel-cloud',
      name: '粉彩雲朵',
      description: '柔和天空色調，淺紫淺藍漸層，適合清新優雅風格',
    },
    {
      id: 'lavender-mist',
      name: '薰衣草迷霧',
      description: '淡紫色主調，薰衣草田氛圍，適合舒適放鬆場景',
    },
    {
      id: 'morning-dew',
      name: '晨露清新',
      description: '藍紫混合，清晨露水質感，適合清爽明亮應用',
    },
    {
      id: 'cotton-candy',
      name: '棉花糖甜心',
      description: '粉紫粉藍，甜美可愛風格，適合活潑親和應用',
    },
    {
      id: 'pearl-shimmer',
      name: '珍珠微光',
      description: '珍珠白底，淡彩虹光澤，適合高級質感應用',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-purple-800 mb-4">
            通知視窗設計方案展示 - 淺色系列
          </h1>
          <p className="text-lg text-purple-600">基於專案配色設計的 5 個淺色系專業方案</p>
          <p className="text-sm text-slate-500 mt-2">
            創建時間: 2025-10-23T01:30:00+08:00 | 淺色系配色: purple-100 to blue-200
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
                    ? 'border-purple-400 bg-purple-100 scale-105 shadow-lg'
                    : 'border-purple-200 bg-white hover:border-purple-300 hover:scale-102 hover:shadow-md'
                }
              `}
            >
              <h3 className="text-lg font-bold text-purple-800 mb-2">{variant.name}</h3>
              <p className="text-sm text-purple-600">{variant.description}</p>
              {selectedVariant === variant.id && (
                <div className="mt-3 text-xs font-semibold text-purple-600">✓ 已選擇</div>
              )}
            </button>
          ))}
        </div>

        {/* 預覽區域 */}
        {selectedVariant && (
          <div className="bg-white rounded-3xl p-12 min-h-[500px] flex flex-col items-center justify-center shadow-xl border border-purple-100">
            <h2 className="text-2xl font-bold text-purple-800 mb-8">
              預覽: {variants.find((v) => v.id === selectedVariant)?.name}
            </h2>

            <div className="flex flex-col space-y-8">
              {/* 離線模式預覽 */}
              <div>
                <p className="text-sm text-purple-600 mb-4 text-center font-medium">
                  場景 1: 離線模式已就緒
                </p>
                <UpdatePromptVariant
                  variant={selectedVariant}
                  offlineReady={true}
                  needRefresh={false}
                  onUpdate={() => console.log('更新被點擊')}
                  onClose={() => console.log('關閉被點擊')}
                />
              </div>

              {/* 更新通知預覽 */}
              <div>
                <p className="text-sm text-purple-600 mb-4 text-center font-medium">
                  場景 2: 發現新版本
                </p>
                <UpdatePromptVariant
                  variant={selectedVariant}
                  offlineReady={false}
                  needRefresh={true}
                  onUpdate={() => console.log('更新被點擊')}
                  onClose={() => console.log('關閉被點擊')}
                />
              </div>
            </div>
          </div>
        )}

        {!selectedVariant && (
          <div className="text-center py-20 text-purple-500">請選擇一個設計方案以查看預覽</div>
        )}
      </div>
    </div>
  );
}
