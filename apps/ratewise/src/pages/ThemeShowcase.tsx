import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Palette, Box, Type } from 'lucide-react';
import { Head } from 'vite-react-ssg';
import { useAppTheme } from '../hooks/useAppTheme';
import { STYLE_OPTIONS } from '../config/themes';
import { contentPageTokens } from '../config/design-tokens';

export default function ThemeShowcase() {
  const { style, setStyle, isLoaded } = useAppTheme();

  return (
    <div className="min-h-full">
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="px-5 py-6 max-w-2xl mx-auto">
        <Link
          to="/settings/"
          className="inline-flex items-center gap-2 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回設定
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2">風格展示</h1>
          <p className="text-sm opacity-60">RateWise 風格系統展示</p>
        </div>

        <section className="mb-8">
          <div className={`${contentPageTokens.sectionHeader.row} mb-3`}>
            <Palette className="w-3.5 h-3.5" />
            <h3 className={contentPageTokens.sectionHeader.eyebrow}>當前主題</h3>
          </div>
          <div className="card p-5">
            <div className="text-sm">
              <span className="opacity-60">風格</span>
              <p className="font-bold capitalize mt-1">{style}</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className={`${contentPageTokens.sectionHeader.row} mb-3`}>
            <Palette className="w-3.5 h-3.5" />
            <h3 className={contentPageTokens.sectionHeader.eyebrow}>介面風格</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {STYLE_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => setStyle(option.value)}
                disabled={!isLoaded}
                className={`
                  relative flex h-28 flex-col justify-end overflow-hidden rounded-control p-4
                  shadow-soft transition-[box-shadow,opacity,transform] disabled:opacity-50
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
                <div
                  className="absolute -right-5 -top-5 h-16 w-16 rounded-full opacity-[0.08]"
                  style={{ backgroundColor: option.previewAccent }}
                />

                <div className="relative z-10">
                  <span className="font-bold text-lg">{option.label}</span>
                  <p className="text-xs opacity-70 mt-0.5">{option.description}</p>
                </div>

                {style === option.value && (
                  <div className="absolute top-3 right-3 rounded-full border border-current/15 bg-surface/85 p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <div className={`${contentPageTokens.sectionHeader.row} mb-3`}>
            <Box className="w-3.5 h-3.5" />
            <h3 className={contentPageTokens.sectionHeader.eyebrow}>元件庫</h3>
          </div>

          <div className="card p-5 mb-4">
            <h4 className="text-sm font-bold mb-3">按鈕</h4>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-primary">
                主要按鈕
              </button>
              <button
                type="button"
                className="rounded-control border px-4 py-2 transition-colors"
                style={{
                  borderColor: 'rgb(var(--color-border))',
                  color: 'rgb(var(--color-text))',
                }}
              >
                次要按鈕
              </button>
              <button
                type="button"
                className="rounded-control px-4 py-2 text-destructive transition-colors hover:bg-destructive/10"
              >
                危險按鈕
              </button>
            </div>
          </div>

          <div className="card p-5 mb-4">
            <h4 className="text-sm font-bold mb-3">卡片樣式</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4">
                <p className="font-bold">預設卡片</p>
                <p className="text-xs opacity-60 mt-1">rounded-card</p>
              </div>
              <div className="card p-4 shadow-elevation-2">
                <p className="font-bold">懸浮卡片</p>
                <p className="text-xs opacity-60 mt-1">shadow-elevation-2</p>
              </div>
            </div>
          </div>

          <div className="card p-5 mb-4">
            <h4 className="text-sm font-bold mb-3">輸入框</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="預設輸入框"
                className="w-full rounded-control border px-4 py-3 transition-colors"
                style={{
                  backgroundColor: 'rgb(var(--color-surface))',
                  borderColor: 'rgb(var(--color-border))',
                  color: 'rgb(var(--color-text))',
                }}
              />
              <div className="flex gap-1 rounded-control bg-surface-sunken/60 p-1.5 shadow-inner">
                <button
                  type="button"
                  className="relative flex-1 rounded-control py-2 text-xs font-bold"
                >
                  <div
                    className="absolute inset-0 z-[-1] rounded-control shadow-soft"
                    style={{ backgroundColor: 'rgb(var(--color-surface))' }}
                  />
                  <span className="relative z-10">選項 1</span>
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-control py-2 text-xs font-bold opacity-60"
                >
                  選項 2
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-control py-2 text-xs font-bold opacity-60"
                >
                  選項 3
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className={`${contentPageTokens.sectionHeader.row} mb-3`}>
            <Type className="w-3.5 h-3.5" />
            <h3 className={contentPageTokens.sectionHeader.eyebrow}>排版</h3>
          </div>
          <div className="card p-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-50">
              標籤文字 LABEL
            </p>
            <h1 className="text-3xl font-black tracking-tight mb-1">大標題 H1</h1>
            <h2 className="text-xl font-bold mb-1">中標題 H2</h2>
            <h3 className="text-lg font-semibold mb-1">小標題 H3</h3>
            <p className="text-sm opacity-80 mb-1">內文段落 Body</p>
            <p className="text-xs opacity-60">輔助文字 Caption</p>
          </div>
        </section>

        <section className="mb-8">
          <div className="card p-5">
            <h4 className="text-sm font-bold mb-4">設計規格</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-border/60">
                <span className="opacity-60">卡片圓角</span>
                <code className="font-mono">rounded-control (1rem token alias)</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/60">
                <span className="opacity-60">按鈕圓角</span>
                <code className="font-mono">rounded-control (1rem token alias)</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/60">
                <span className="opacity-60">表面層次</span>
                <code className="font-mono">bg-surface-elevated + shadow-soft</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/60">
                <span className="opacity-60">邊框透明度</span>
                <code className="font-mono">border-border/60</code>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="opacity-60">標籤文字</span>
                <code className="font-mono">text-[9px] uppercase tracking-[0.2em]</code>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center opacity-40">
          <p className="text-[11px] font-medium">設計參考：RateWise DESIGN.md + themes.ts</p>
          <p className="mt-1 text-[11px]">建構方式：Tailwind CSS + CSS Variables</p>
        </section>
      </div>
    </div>
  );
}
