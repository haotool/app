import type { FC } from 'react';
import type { UiShowcaseMeta, UiShowcaseKey } from './UiShowcaseSelector';

interface Props {
  option: UiShowcaseMeta;
}

interface PreviewTheme {
  shell: string;
  header: string;
  resultLabel: string;
  keycap: string;
  utilityKey: string;
  accentKey: string;
  gridBg: string;
  footerText: string;
}

const KEY_LAYOUT = [
  ['7', '8', '9', 'DEL'],
  ['4', '5', '6', '+'],
  ['1', '2', '3', '−'],
  ['0', '.', '%', '='],
];

const UTILITY_KEYS = new Set(['AC', 'DEL', '%']);
const ACCENT_KEYS = new Set(['=']);

const PREVIEW_THEMES: Record<UiShowcaseKey, PreviewTheme> = {
  'graphite-minimal': {
    shell: 'bg-white text-slate-900 border border-slate-200 shadow-xl shadow-slate-300/40',
    header: 'bg-slate-50 border border-blue-100 text-slate-900',
    resultLabel: 'text-blue-500',
    gridBg: 'bg-slate-50',
    keycap: 'bg-white border border-slate-200 hover:border-blue-300',
    utilityKey: 'bg-blue-50 border border-blue-100 text-blue-700',
    accentKey: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg',
    footerText: 'text-slate-600',
  },
  'auric-ribbon': {
    shell:
      'bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-slate-900 border border-blue-100 shadow-blue-200/40 shadow-2xl',
    header: 'bg-white border border-blue-100 text-slate-900',
    resultLabel: 'text-indigo-600',
    gridBg: 'bg-white',
    keycap: 'bg-slate-50 border border-blue-100 hover:border-blue-300',
    utilityKey: 'bg-blue-50 border border-blue-100 text-blue-700',
    accentKey: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white shadow-lg',
    footerText: 'text-slate-600',
  },
};

export const KeypadShowcasePreview: FC<Props> = ({ option }) => {
  const theme = PREVIEW_THEMES[option.key];

  return (
    <section className="mt-6" aria-label={`鍵盤樣式預覽 - ${option.title}`}>
      {/* 預覽標題 - 行動版垂直排列 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3">
        <div>
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500">
            Keyboard Preview
          </p>
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 mt-0.5">
            {option.title}
          </h3>
        </div>
        <p className="text-[10px] sm:text-xs text-slate-500 sm:text-right leading-tight max-w-full sm:max-w-[180px]">
          {option.subtitle}
        </p>
      </div>
      {/* 鍵盤預覽 - 優化行動版間距 */}
      <div
        className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 ${theme.shell}`}
      >
        {/* 結果顯示區 */}
        <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4 ${theme.header}`}>
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <span className={theme.resultLabel}>TWD → USD</span>
            <span className={theme.resultLabel}>即時換算</span>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold mt-1.5 sm:mt-2">12,345.67</p>
          <p className="text-xs sm:text-sm opacity-80">= 384.21 USD</p>
        </div>
        {/* 鍵盤網格 */}
        <div className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-3 ${theme.gridBg}`}>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {KEY_LAYOUT.flat().map((key) => {
              const baseClass = ACCENT_KEYS.has(key)
                ? theme.accentKey
                : UTILITY_KEYS.has(key)
                  ? theme.utilityKey
                  : theme.keycap;
              return (
                <div
                  key={key}
                  className={`flex items-center justify-center rounded-lg sm:rounded-xl py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors duration-150 ${baseClass}`}
                >
                  {key}
                </div>
              );
            })}
          </div>
        </div>
        {/* 提示文字 */}
        <p
          className={`text-[10px] sm:text-[11px] mt-3 sm:mt-4 leading-relaxed ${theme.footerText}`}
        >
          此預覽僅示意計算機鍵盤樣式，不會改變目前頁面主題。
        </p>
      </div>
    </section>
  );
};
