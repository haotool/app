/**
 * Settings Page - ParkKeeper 風格設定頁面
 *
 * @description 應用程式設定頁面，支援 6 種風格切換
 *              採用 ParkKeeper 設計風格（圓潤卡片、風格預覽）
 *              SSOT: 風格定義來自 themes.ts
 *
 * 風格選項：
 * - Zen - 極簡專業（預設）
 * - Nitro - 深色科技感
 * - Kawaii - 可愛粉嫩
 * - Classic - 復古書卷
 * - Ocean - 海洋深邃
 * - Forest - 自然森林
 *
 * @reference ParkKeeper UI Design, themes.ts SSOT
 * @created 2026-01-15
 * @updated 2026-01-17 - 移除深色模式功能，簡化為僅風格切換
 * @version 4.0.0
 */

import { Palette, Globe, Database, ShieldAlert, Check } from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';
import { STYLE_OPTIONS } from '../config/themes';

export default function Settings() {
  const { style, setStyle, resetTheme, isLoaded } = useAppTheme();

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-32">
      <div className="px-5 py-6 max-w-md mx-auto">
        {/* 介面風格區塊 */}
        <section className="mb-8">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Palette className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">介面風格</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {STYLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setStyle(option.value)}
                disabled={!isLoaded}
                className={`
                  relative p-3 h-20 flex flex-col justify-end overflow-hidden rounded-xl
                  transition-all duration-200 ease-out shadow-sm disabled:opacity-50
                  hover:scale-[1.02] hover:shadow-md active:scale-[0.98]
                  ${style === option.value ? 'ring-2 ring-offset-2 shadow-md' : ''}
                `}
                style={
                  {
                    backgroundColor: option.previewBg,
                    color: option.previewText,
                    '--tw-ring-color': option.previewAccent,
                    '--tw-ring-offset-color': 'rgb(var(--color-background))',
                  } as React.CSSProperties
                }
                aria-pressed={style === option.value}
                aria-label={`${option.label} - ${option.description}`}
              >
                {/* 裝飾圓形 */}
                <div
                  className="absolute top-0 right-0 w-16 h-16 opacity-15 -mr-4 -mt-4 rounded-full"
                  style={{ backgroundColor: option.previewAccent }}
                />

                {/* 選中指示器 */}
                {style === option.value && (
                  <div
                    className="absolute top-2 right-2 rounded-full p-0.5"
                    style={{ backgroundColor: option.previewAccent }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* 內容 */}
                <div className="flex flex-col items-start w-full relative z-10">
                  <span className="font-bold text-sm leading-tight">{option.label}</span>
                  <span className="text-[10px] opacity-60 leading-tight">{option.description}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 語言區塊（未來功能） */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Globe className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">語言</h3>
          </div>

          <div className="bg-black/5 rounded-[20px] p-1.5 flex gap-1 relative shadow-inner">
            <button className="flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 relative z-10 transition-all duration-200 ease-out opacity-60 hover:opacity-100 hover:scale-[1.02] active:scale-[0.98]">
              <span className="text-xl mb-1 filter drop-shadow-sm">🇺🇸</span>
              <span className="text-[10px] font-bold">English</span>
            </button>
            <button className="flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 relative z-10 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]">
              <div className="absolute inset-0 rounded-2xl shadow-sm z-[-1] bg-[rgb(var(--color-surface))]" />
              <span className="text-xl mb-1 filter drop-shadow-sm">🇹🇼</span>
              <span className="text-[10px] font-bold">繁體中文</span>
            </button>
            <button className="flex-1 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 relative z-10 transition-all duration-200 ease-out opacity-60 hover:opacity-100 hover:scale-[1.02] active:scale-[0.98]">
              <span className="text-xl mb-1 filter drop-shadow-sm">🇯🇵</span>
              <span className="text-[10px] font-bold">日本語</span>
            </button>
          </div>
        </section>

        {/* 儲存與快取區塊 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <Database className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">儲存與快取</h3>
          </div>

          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                匯率資料來源
              </span>
              <span className="text-lg font-black">台灣銀行</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold opacity-60 uppercase tracking-wider">
                更新頻率
              </span>
              <span className="text-lg font-black">5 分鐘</span>
            </div>
            <p className="text-[10px] mt-2 opacity-40 font-medium text-center">
              匯率資料每 5 分鐘自動更新。
            </p>
          </div>
        </section>

        {/* 資料管理區塊 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">資料管理</h3>
          </div>

          <div className="card overflow-hidden">
            <button
              onClick={resetTheme}
              disabled={!isLoaded}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-destructive/10 active:bg-destructive/20 group transition-all duration-200 ease-out disabled:opacity-50"
            >
              <span className="text-xs font-black text-destructive uppercase tracking-widest">
                重置主題設定
              </span>
              <ShieldAlert className="w-4 h-4 text-destructive opacity-40 group-active:opacity-100 transition-opacity" />
            </button>
          </div>
        </section>

        {/* 關於區塊 */}
        <section className="mb-6">
          <div className="card p-5">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="opacity-60">應用程式版本</span>
                <span className="font-bold font-mono">v4.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-60">設計系統</span>
                <span className="font-bold">6 Styles SSOT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-60">技術棧</span>
                <span className="font-bold">React + Tailwind</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-black/5">
              <p className="text-[10px] opacity-40 text-center font-medium">
                © 2026 RateWise. Built with Design Token SSOT
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
