import type { FC } from 'react';

export type UiShowcaseKey = 'graphite-minimal' | 'auric-ribbon';

export interface UiShowcaseMeta {
  key: UiShowcaseKey;
  title: string;
  subtitle: string;
  badge: string;
  previewClass: string;
}

interface Props {
  value: UiShowcaseKey;
  onChange: (key: UiShowcaseKey) => void;
  options: Record<UiShowcaseKey, UiShowcaseMeta>;
}

export const UiShowcaseSelector: FC<Props> = ({ value, onChange, options }) => {
  return (
    <div className="mb-6 space-y-3 sm:space-y-4">
      {/* 標題區 - 行動版垂直排列 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-900 text-white">
            UI Showcase
          </span>
          <p className="text-xs sm:text-sm text-slate-600">切換鍵盤體驗樣式（僅影響下方預覽）。</p>
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-500">2 種高級風格可即時預覽</div>
      </div>
      {/* 選項網格 - 行動版 1 列，桌面版 2 列 */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {Object.values(options).map((opt) => {
          const isActive = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 focus:ring-offset-white ${
                isActive
                  ? 'border-slate-900 shadow-lg shadow-slate-900/20'
                  : 'border-slate-200 hover:border-slate-400 shadow-sm'
              } ${opt.previewClass}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/0 to-white/10 pointer-events-none" />
              <div className="relative p-3 sm:p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold rounded-full bg-white/80 text-slate-900 shadow-sm">
                    {opt.badge}
                  </span>
                  {isActive && (
                    <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-100 bg-emerald-600/80 px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm">
                      已選擇
                    </span>
                  )}
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm font-semibold text-white drop-shadow-sm">
                    {opt.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-100/80 leading-snug">
                    {opt.subtitle}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
