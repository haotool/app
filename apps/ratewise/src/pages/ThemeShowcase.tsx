/**
 * Theme Showcase 頁面 - ParkKeeper 風格主題展示
 *
 * @description 展示新主題系統的所有風格、狀態和元件
 *
 * 展示內容：
 * - 4 種風格預覽（Nitro/Kawaii/Zen/Classic）
 * - 淺色/深色模式切換
 * - 設計語彙（圓角、陰影、間距）
 * - 元件庫預覽（按鈕、卡片、輸入框）
 *
 * @reference ParkKeeper UI Design
 * @created 2026-01-16
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Sun, Moon, Monitor, Palette, Box, Type } from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';
import { STYLE_OPTIONS, MODE_OPTIONS, type ThemeMode } from '../config/themes';

export default function ThemeShowcase() {
  const { style, mode, resolvedMode, setStyle, setMode, isLoaded } = useAppTheme();

  // 獲取模式圖標
  const getModeIcon = (modeValue: ThemeMode) => {
    switch (modeValue) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'auto':
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-32">
      <div className="px-5 py-6 max-w-2xl mx-auto">
        {/* 返回按鈕 */}
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回設定
        </Link>

        {/* 標題區 */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2">Theme Showcase</h1>
          <p className="text-sm opacity-60">ParkKeeper 風格主題系統展示</p>
        </div>

        {/* 當前主題資訊 */}
        <section className="mb-8">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Palette className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">當前主題</h3>
          </div>
          <div className="card p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="opacity-60">風格</span>
                <p className="font-bold capitalize mt-1">{style}</p>
              </div>
              <div>
                <span className="opacity-60">模式</span>
                <p className="font-bold capitalize mt-1">
                  {mode} ({resolvedMode})
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 風格選擇器 */}
        <section className="mb-8">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Palette className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">介面風格</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {STYLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setStyle(option.value)}
                disabled={!isLoaded}
                className={`
                  relative p-4 h-28 flex flex-col justify-end overflow-hidden rounded-xl 
                  transition-all shadow-sm disabled:opacity-50
                  ${style === option.value ? 'ring-2 ring-offset-2' : ''}
                `}
                style={
                  {
                    backgroundColor: option.previewBg,
                    color: option.previewText,
                    '--tw-ring-color': option.previewText,
                  } as React.CSSProperties
                }
              >
                {/* 裝飾圓形 */}
                <div
                  className="absolute top-0 right-0 w-20 h-20 opacity-10 -mr-6 -mt-6 rounded-full"
                  style={{ backgroundColor: option.previewAccent }}
                />

                {/* 內容 */}
                <div className="relative z-10">
                  <span className="font-bold text-lg">{option.label}</span>
                  <p className="text-xs opacity-70 mt-0.5">{option.description}</p>
                </div>

                {style === option.value && (
                  <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 模式選擇器 */}
        <section className="mb-8">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Sun className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">顯示模式</h3>
          </div>
          <div className="bg-black/5 dark:bg-white/5 rounded-[20px] p-1.5 flex gap-1 relative shadow-inner">
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setMode(option.value)}
                disabled={!isLoaded}
                className={`
                  flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 
                  relative z-10 transition-colors disabled:opacity-50
                  ${mode === option.value ? '' : 'opacity-60 hover:opacity-100'}
                `}
              >
                {mode === option.value && (
                  <div
                    className="absolute inset-0 rounded-2xl shadow-sm z-[-1]"
                    style={{ backgroundColor: 'rgb(var(--color-surface))' }}
                  />
                )}
                <span className="mb-1">{getModeIcon(option.value)}</span>
                <span className="text-[10px] font-bold">{option.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 元件展示 */}
        <section className="mb-8">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Box className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">元件庫</h3>
          </div>

          {/* 按鈕 */}
          <div className="card p-5 mb-4">
            <h4 className="text-sm font-bold mb-3">按鈕</h4>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary">主要按鈕</button>
              <button
                className="px-4 py-2 rounded-2xl border transition-colors"
                style={{
                  borderColor: 'rgb(var(--color-border))',
                  color: 'rgb(var(--color-text))',
                }}
              >
                次要按鈕
              </button>
              <button className="px-4 py-2 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                危險按鈕
              </button>
            </div>
          </div>

          {/* 卡片 */}
          <div className="card p-5 mb-4">
            <h4 className="text-sm font-bold mb-3">卡片樣式</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4">
                <p className="font-bold">預設卡片</p>
                <p className="text-xs opacity-60 mt-1">rounded-3xl</p>
              </div>
              <div className="card p-4 shadow-elevation-2">
                <p className="font-bold">懸浮卡片</p>
                <p className="text-xs opacity-60 mt-1">shadow-elevation-2</p>
              </div>
            </div>
          </div>

          {/* 輸入框 */}
          <div className="card p-5 mb-4">
            <h4 className="text-sm font-bold mb-3">輸入框</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="預設輸入框"
                className="w-full px-4 py-3 rounded-2xl border transition-colors"
                style={{
                  backgroundColor: 'rgb(var(--color-surface))',
                  borderColor: 'rgb(var(--color-border))',
                  color: 'rgb(var(--color-text))',
                }}
              />
              <div className="bg-black/5 dark:bg-white/5 rounded-[20px] p-1.5 flex gap-1 shadow-inner">
                <button className="flex-1 py-2 rounded-2xl text-xs font-bold relative">
                  <div
                    className="absolute inset-0 rounded-2xl shadow-sm z-[-1]"
                    style={{ backgroundColor: 'rgb(var(--color-surface))' }}
                  />
                  <span className="relative z-10">選項 1</span>
                </button>
                <button className="flex-1 py-2 rounded-2xl text-xs font-bold opacity-60">
                  選項 2
                </button>
                <button className="flex-1 py-2 rounded-2xl text-xs font-bold opacity-60">
                  選項 3
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 排版展示 */}
        <section className="mb-8">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Type className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">排版</h3>
          </div>
          <div className="card p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">
              標籤文字 LABEL
            </p>
            <h1 className="text-3xl font-black tracking-tight mb-1">大標題 H1</h1>
            <h2 className="text-xl font-bold mb-1">中標題 H2</h2>
            <h3 className="text-lg font-semibold mb-1">小標題 H3</h3>
            <p className="text-sm opacity-80 mb-1">內文段落 Body</p>
            <p className="text-xs opacity-60">輔助文字 Caption</p>
          </div>
        </section>

        {/* 設計規格 */}
        <section className="mb-8">
          <div className="card p-5">
            <h4 className="text-sm font-bold mb-4">設計規格</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="opacity-60">卡片圓角</span>
                <code className="font-mono">rounded-3xl (1.5rem)</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="opacity-60">按鈕圓角</span>
                <code className="font-mono">rounded-2xl (1rem)</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="opacity-60">毛玻璃</span>
                <code className="font-mono">backdrop-blur-xl</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="opacity-60">邊框透明度</span>
                <code className="font-mono">border-black/[0.02~0.05]</code>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="opacity-60">標籤文字</span>
                <code className="font-mono">text-[9px] uppercase tracking-[0.2em]</code>
              </div>
            </div>
          </div>
        </section>

        {/* 參考來源 */}
        <section className="text-center opacity-40">
          <p className="text-[10px] font-medium">Design Reference: ParkKeeper UI Style</p>
          <p className="text-[10px] mt-1">Built with Tailwind CSS + CSS Variables</p>
        </section>
      </div>
    </div>
  );
}
