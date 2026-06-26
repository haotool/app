import { Head } from 'vite-react-ssg';
import { ArrowLeft, RefreshCw, X } from 'lucide-react';
import { notificationTokens } from '../config/design-tokens';

export default function ColorSchemeComparison() {
  const notificationVariants = [
    {
      id: 'primary',
      name: '方案 A · 品牌主色',
      description: '以目前風格的主色建立更新提示層級',
      containerBg: 'bg-primary/10',
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
      primaryBtn: 'bg-primary',
    },
    {
      id: 'success',
      name: '方案 B · 可用狀態',
      description: '用於離線內容已準備完成的正向回饋',
      containerBg: 'bg-success/10',
      iconBg: 'bg-success/15',
      iconColor: 'text-success',
      primaryBtn: 'bg-success',
    },
    {
      id: 'warning',
      name: '方案 C · 更新提醒',
      description: '用於需要使用者注意但不阻斷操作的提示',
      containerBg: 'bg-warning/10',
      iconBg: 'bg-warning/15',
      iconColor: 'text-warning',
      primaryBtn: 'bg-warning',
    },
    {
      id: 'destructive',
      name: '方案 D · 更新失敗',
      description: '用於重試與錯誤狀態，保留明確警示感',
      containerBg: 'bg-destructive/10',
      iconBg: 'bg-destructive/15',
      iconColor: 'text-destructive',
      primaryBtn: 'bg-destructive',
    },
  ];

  const NotificationCard = ({ variant }: { variant: (typeof notificationVariants)[0] }) => {
    return (
      <div className="flex flex-col items-center">
        <div className="mb-4 text-center">
          <h3 className="mb-1 text-lg font-bold text-text">{variant.name}</h3>
          <p className="text-sm text-text-muted">{variant.description}</p>
        </div>

        <div className="relative">
          <div
            className={`
              relative overflow-hidden rounded-control
              w-80 max-w-[calc(100vw-2rem)]
              border border-border/70 bg-surface
              shadow-soft
            `}
          >
            <div className="relative p-6">
              <div className="flex justify-center mb-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full ${variant.iconBg}`}
                >
                  <RefreshCw className={`h-8 w-8 ${variant.iconColor}`} strokeWidth={2.5} />
                </div>
              </div>

              <h2 className="mb-2 text-center text-xl font-bold text-text">發現新版本</h2>

              <p className="mb-5 px-2 text-center text-sm leading-relaxed text-text-muted">
                新版本帶來更棒的體驗哦！
              </p>

              <div className="flex flex-col space-y-2">
                <button
                  className={`
                    inline-flex w-full items-center justify-center gap-2 rounded-control
                    border border-border/70 bg-surface-elevated px-5 py-3
                    text-sm font-bold text-text shadow-soft
                    transition-colors duration-200 hover:border-primary/20 hover:bg-surface
                  `}
                  type="button"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${variant.primaryBtn}`}
                    aria-hidden="true"
                  />
                  馬上更新
                </button>

                <button
                  className={`
                    inline-flex w-full items-center justify-center gap-2 rounded-control
                    border border-border/70 bg-surface px-5 py-3
                    text-sm font-semibold text-text-muted
                    transition-colors duration-200 hover:bg-surface-elevated hover:text-text
                  `}
                  type="button"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${variant.containerBg}`}
                    aria-hidden="true"
                  />
                  等等再說
                </button>
              </div>
            </div>

            <button
              className={`absolute right-4 top-4 ${notificationTokens.actions.icon}`}
              type="button"
              aria-label="關閉通知"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-4 w-80 max-w-[calc(100vw-2rem)] rounded-control border border-border/70 bg-surface-elevated p-4">
          <h4 className="mb-2 text-sm font-bold text-text">配色詳情</h4>
          <div className="space-y-1 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <div
                className={`h-4 w-4 rounded-compact border border-border/70 ${variant.containerBg}`}
              />
              <span>提示背景</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-4 w-4 rounded-compact ${variant.primaryBtn}`} />
              <span>狀態重點</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-4 w-4 rounded-compact border border-border/70 ${variant.iconBg}`}
              />
              <span>圖示背景</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="mb-3 text-4xl font-bold text-text">通知配色歷史比較</h1>
          <p className="mx-auto max-w-2xl text-text-muted">
            以下把通知狀態收斂成四種語義 tone，並以現行產品殼層比較其色彩傾向。
            <br />
            比較重點是 token 層級與可讀性，而不是額外特效。
          </p>
        </div>

        <div className="mb-12 rounded-control border border-border/70 bg-surface p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-bold text-text">現行產品語法參考</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-text-muted">基礎表面</p>
              <div className="h-16 rounded-control border border-border/70 bg-surface" />
              <code className="mt-1 block text-xs text-text-muted">
                bg-surface + border-border/70
              </code>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-text-muted">品牌重點</p>
              <div className="h-16 rounded-control border border-primary/15 bg-primary/10" />
              <code className="mt-1 block text-xs text-text-muted">
                bg-primary/10 + border-primary/15
              </code>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-text-muted">互動層次</p>
              <div className="h-16 rounded-control border border-border/70 bg-surface-elevated" />
              <code className="mt-1 block text-xs text-text-muted">
                bg-surface-elevated + shadow-soft
              </code>
            </div>
          </div>
        </div>

        {/* 配色方案網格 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {notificationVariants.map((variant) => (
            <NotificationCard key={variant.id} variant={variant} />
          ))}
        </div>

        {/* 返回按鈕 */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-control border border-border/70 bg-surface-elevated px-6 py-3 font-semibold text-text transition-colors hover:border-primary/20 hover:bg-surface"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            返回主頁
          </a>
        </div>
      </div>
    </div>
  );
}
