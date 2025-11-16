import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UiShowcaseSelector,
  type UiShowcaseKey,
  type UiShowcaseMeta,
} from '../features/ratewise/components/UiShowcaseSelector';
import { KeypadShowcasePreview } from '../features/ratewise/components/KeypadShowcasePreview';

const UI_SHOWCASE_OPTIONS: Record<UiShowcaseKey, UiShowcaseMeta> = {
  'graphite-minimal': {
    key: 'graphite-minimal',
    title: 'Graphite Minimal',
    subtitle: '單色極簡，精準對齊，偏向 B2B 專業版面。',
    badge: '極簡對齊',
    previewClass: 'bg-gradient-to-br from-slate-200 via-white to-blue-50 text-slate-900',
  },
  'auric-ribbon': {
    key: 'auric-ribbon',
    title: 'Auric Ribbon',
    subtitle: '保留金屬線框但以藍紫輔色呈現玻璃感。',
    badge: '精緻線條',
    previewClass: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-white text-slate-900',
  },
};

const UiShowcasePage = () => {
  const [variant, setVariant] = useState<UiShowcaseKey>('graphite-minimal');
  const activeOption = UI_SHOWCASE_OPTIONS[variant];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* 標題區 - 行動版垂直排列 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-widest">
              Showcase
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              行動計算機鍵盤 UI Showcase
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl">
              用於預覽鍵盤模組的不同表現，僅影響計算機鍵盤與 QuickOpsBar，主介面保持原樣。
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-blue-700 bg-white/80 px-4 py-2.5 rounded-full shadow border border-blue-100 hover:text-blue-900 hover:bg-white transition-colors whitespace-nowrap self-start sm:self-center"
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
        </div>

        <div className="mt-8">
          <UiShowcaseSelector value={variant} onChange={setVariant} options={UI_SHOWCASE_OPTIONS} />
          <KeypadShowcasePreview option={activeOption} />
        </div>

        {/* 配色說明 - 優化行動版間距 */}
        <section className="mt-8 bg-white/80 backdrop-blur rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-blue-100 shadow">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">配色限制</h2>
          <ul className="text-xs sm:text-sm text-slate-600 list-disc list-inside space-y-2 leading-relaxed">
            <li>沿用 RateWise 主色 (#2563EB) 與輔色 (#4C1D95) 的明暗階，確保品牌一致。</li>
            <li>Showcase 僅是鍵盤模組參考，不會覆寫主頁的背景或其他元件。</li>
            <li>未來實作時以 tokens 注入 `KeypadSurface`、`QuickOpsBar`，可維持相同模組界線。</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default UiShowcasePage;
