/**
 * UI Showcase 頁面 - UpdatePrompt 組件展示
 *
 * 創建時間: 2025-12-27
 * 目的: 展示 UpdatePrompt 的各個狀態和配色風格
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

interface UpdatePromptDemoProps {
  variant: 'offline' | 'update';
  title: string;
  description: string;
  colorScheme?: 'brand' | 'cotton-candy' | 'pastel-cloud';
}

function UpdatePromptDemo({
  variant,
  title,
  description,
  colorScheme = 'brand',
}: UpdatePromptDemoProps) {
  const isOffline = variant === 'offline';

  // 棉花糖甜心配色
  const cottonCandyColors = {
    bg: 'from-pink-50 via-purple-50 to-blue-50',
    border: 'border-purple-100',
    bubble1: 'bg-purple-100/50',
    bubble2: 'bg-pink-100/50',
    iconGlow: 'bg-purple-200',
    iconBg: 'from-pink-200 via-purple-200 to-blue-200',
    iconColor: 'text-purple-600',
    titleColor: 'text-purple-700',
    descColor: 'text-purple-500',
    primaryBtn:
      'from-pink-300 via-purple-300 to-blue-300 hover:from-pink-400 hover:via-purple-400 hover:to-blue-400',
    secondaryBtn: 'text-purple-600 border-purple-200 hover:border-purple-300',
    closeBtn: 'text-purple-400 hover:text-purple-600',
  };

  // RateWise 品牌配色
  const brandColors = {
    bg: 'from-blue-50 via-indigo-50 to-purple-50',
    border: 'border-blue-200',
    bubble1: 'bg-blue-200/30',
    bubble2: 'bg-indigo-200/30',
    iconGlow: 'bg-blue-300',
    iconBg: 'from-blue-500 to-indigo-600',
    iconColor: 'text-white',
    titleColor: 'text-blue-900',
    descColor: 'text-indigo-700',
    primaryBtn: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
    secondaryBtn: 'text-blue-700 border-blue-200 hover:border-blue-300',
    closeBtn: 'text-blue-500 hover:text-blue-700',
  };

  // 粉彩雲朵配色
  const pastelCloudColors = {
    bg: 'from-purple-50 via-blue-50 to-purple-100',
    border: 'border-purple-200/50',
    bubble1: 'bg-white/40',
    bubble2: 'bg-purple-100/40',
    iconGlow: 'bg-purple-200',
    iconBg: 'from-purple-200 to-blue-200',
    iconColor: 'text-purple-600',
    titleColor: 'text-purple-800',
    descColor: 'text-purple-600',
    primaryBtn: 'from-purple-400 to-blue-400 hover:from-purple-500 hover:to-blue-500',
    secondaryBtn: 'text-purple-600 border-purple-200 hover:bg-white',
    closeBtn: 'text-purple-400 hover:text-purple-600',
  };

  const colors =
    colorScheme === 'cotton-candy'
      ? cottonCandyColors
      : colorScheme === 'pastel-cloud'
        ? pastelCloudColors
        : brandColors;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl w-80 bg-gradient-to-br ${colors.bg} border-2 ${colors.border} shadow-xl shadow-blue-100/50`}
    >
      {/* 泡泡裝飾 */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full ${colors.bubble1} blur-3xl`} />
      <div
        className={`absolute bottom-0 left-0 w-32 h-32 rounded-full ${colors.bubble2} blur-3xl`}
      />

      {/* 內容區域 */}
      <div className="relative p-6">
        {/* 圖標區 */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            {/* 外圈光暈 */}
            <div
              className={`absolute inset-0 rounded-full ${colors.iconGlow} blur-md opacity-40`}
            />
            {/* 主圖標 */}
            <div
              className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${colors.iconBg} flex items-center justify-center shadow-lg`}
            >
              <svg
                className={`w-8 h-8 ${colors.iconColor}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isOffline ? (
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
        <h2 className={`text-xl font-bold ${colors.titleColor} mb-2 text-center`}>{title}</h2>

        {/* 描述 */}
        <p className={`text-sm ${colors.descColor} mb-5 leading-relaxed text-center px-2`}>
          {description}
        </p>

        {/* 按鈕 */}
        <div className="flex flex-col space-y-2">
          {!isOffline && (
            <button
              className={`w-full px-5 py-3 rounded-2xl bg-gradient-to-r ${colors.primaryBtn} text-white text-sm font-bold shadow-lg shadow-blue-200/50 active:scale-[0.98] transition-all duration-200`}
            >
              馬上更新
            </button>
          )}

          <button
            className={`w-full px-5 py-3 rounded-2xl bg-white/90 backdrop-blur-sm ${colors.secondaryBtn} text-sm font-semibold border-2 hover:bg-white active:scale-[0.98] transition-all duration-200`}
          >
            {isOffline ? '好的' : '等等再說'}
          </button>
        </div>
      </div>

      {/* 關閉按鈕 */}
      <button
        className={`absolute top-4 right-4 p-2 rounded-full bg-white/80 ${colors.closeBtn} hover:bg-white transition-colors`}
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

interface ColorSwatchProps {
  color: string;
  name: string;
  value: string;
}

function ColorSwatch({ color, name, value }: ColorSwatchProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
      <div className={`w-12 h-12 rounded-lg ${color} shadow-sm`} />
      <div>
        <div className="font-semibold text-slate-900 text-sm">{name}</div>
        <div className="text-xs text-slate-500 font-mono">{value}</div>
      </div>
    </div>
  );
}

export default function UIShowcase() {
  const [activeDemo, setActiveDemo] = useState<'offline' | 'update' | null>(null);
  const [colorScheme, setColorScheme] = useState<'brand' | 'cotton-candy' | 'pastel-cloud'>(
    'brand',
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 標題區 */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 bg-white/80 px-4 py-2.5 rounded-full shadow border border-blue-100 hover:text-blue-900 hover:bg-white transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            返回主頁
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mt-4">UI Showcase</h1>
          <p className="text-slate-600 mt-2">UpdatePrompt 組件的各個狀態和配色風格展示</p>
        </div>

        {/* 配色切換 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">配色方案</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setColorScheme('brand')}
              className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                colorScheme === 'brand'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              💙 RateWise 品牌配色
            </button>
            <button
              onClick={() => setColorScheme('cotton-candy')}
              className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                colorScheme === 'cotton-candy'
                  ? 'bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🍬 棉花糖甜心配色
            </button>
            <button
              onClick={() => setColorScheme('pastel-cloud')}
              className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                colorScheme === 'pastel-cloud'
                  ? 'bg-gradient-to-r from-purple-400 to-blue-400 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ☁️ 粉彩雲朵配色
            </button>
          </div>
        </div>

        {/* 狀態展示區 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">組件狀態</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* 離線模式已就緒 */}
            <div className="flex flex-col items-center">
              <div className="mb-4 text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">✨ 離線模式已就緒</h3>
                <p className="text-sm text-slate-600">當 PWA 首次安裝完成後顯示</p>
              </div>
              <UpdatePromptDemo
                variant="offline"
                title="✨ 離線模式已就緒"
                description="應用已準備好，隨時隨地都能使用！"
                colorScheme={colorScheme}
              />
            </div>

            {/* 發現新版本 */}
            <div className="flex flex-col items-center">
              <div className="mb-4 text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">🎉 發現新版本</h3>
                <p className="text-sm text-slate-600">當有新版本可用時顯示</p>
              </div>
              <UpdatePromptDemo
                variant="update"
                title="🎉 發現新版本"
                description="新版本帶來更棒的體驗哦！"
                colorScheme={colorScheme}
              />
            </div>
          </div>

          {/* 互動測試 */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">互動測試</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveDemo('offline')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all"
              >
                顯示離線模式
              </button>
              <button
                onClick={() => setActiveDemo('update')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all"
              >
                顯示更新提示
              </button>
              <button
                onClick={() => setActiveDemo(null)}
                className="px-6 py-3 rounded-xl bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-all"
              >
                關閉
              </button>
            </div>
          </div>
        </div>

        {/* 配色系統 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">配色系統</h2>

          {colorScheme === 'brand' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorSwatch
                color="bg-gradient-to-br from-blue-500 to-indigo-600"
                name="主要漸變"
                value="blue-500 → indigo-600"
              />
              <ColorSwatch
                color="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
                name="背景漸變"
                value="blue-50 → purple-50"
              />
              <ColorSwatch color="bg-blue-200" name="邊框色" value="blue-200" />
              <ColorSwatch color="bg-blue-900" name="標題文字" value="blue-900" />
              <ColorSwatch color="bg-indigo-700" name="描述文字" value="indigo-700" />
              <ColorSwatch color="bg-blue-600" name="按鈕背景" value="blue-600" />
            </div>
          ) : colorScheme === 'cotton-candy' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorSwatch
                color="bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200"
                name="圖標漸變"
                value="pink-200 → blue-200"
              />
              <ColorSwatch
                color="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50"
                name="背景漸變"
                value="pink-50 → blue-50"
              />
              <ColorSwatch color="bg-purple-100" name="邊框色" value="purple-100" />
              <ColorSwatch color="bg-purple-700" name="標題文字" value="purple-700" />
              <ColorSwatch color="bg-purple-500" name="描述文字" value="purple-500" />
              <ColorSwatch
                color="bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300"
                name="按鈕漸變"
                value="pink-300 → blue-300"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorSwatch
                color="bg-gradient-to-br from-purple-200 to-blue-200"
                name="圖標漸變"
                value="purple-200 → blue-200"
              />
              <ColorSwatch
                color="bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100"
                name="背景漸變"
                value="purple-50 → purple-100"
              />
              <ColorSwatch
                color="bg-purple-200/50 border border-purple-200"
                name="邊框色"
                value="purple-200/50"
              />
              <ColorSwatch color="bg-purple-800" name="標題文字" value="purple-800" />
              <ColorSwatch color="bg-purple-600" name="描述文字" value="purple-600" />
              <ColorSwatch
                color="bg-gradient-to-r from-purple-400 to-blue-400"
                name="按鈕漸變"
                value="purple-400 → blue-400"
              />
            </div>
          )}
        </div>

        {/* 設計特點 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">設計特點</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">藍紫漸變品牌色</h3>
                  <p className="text-sm text-slate-600">
                    使用 RateWise 品牌識別色，營造專業可信賴的形象
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">圓潤現代視覺</h3>
                  <p className="text-sm text-slate-600">24px 圓角設計，柔和親和的視覺語言</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">柔和光暈效果</h3>
                  <p className="text-sm text-slate-600">藍靛色光暈裝飾，增添品牌質感</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Emoji 點綴</h3>
                  <p className="text-sm text-slate-600">✨ 和 🎉 增加親和力和情感連結</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">5</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">彈性入場動畫</h3>
                  <p className="text-sm text-slate-600">Spring physics 動畫，流暢自然的視覺體驗</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">6</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">完整無障礙支援</h3>
                  <p className="text-sm text-slate-600">
                    ARIA labels, keyboard navigation, 符合 WCAG 標準
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右上角互動展示 */}
      {activeDemo && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-bounce">
          {activeDemo === 'offline' ? (
            <UpdatePromptDemo
              variant="offline"
              title="✨ 離線模式已就緒"
              description="應用已準備好，隨時隨地都能使用！"
              colorScheme={colorScheme}
            />
          ) : (
            <UpdatePromptDemo
              variant="update"
              title="🎉 發現新版本"
              description="新版本帶來更棒的體驗哦！"
              colorScheme={colorScheme}
            />
          )}
          <button
            onClick={() => setActiveDemo(null)}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
