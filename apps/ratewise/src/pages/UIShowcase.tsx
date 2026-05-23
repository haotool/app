import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Head } from 'vite-react-ssg';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Check,
  X,
  Info,
  Copy,
  Star,
  Clock,
  Settings,
  ArrowRight,
  RefreshCw,
  Palette,
  Type,
  Layout,
  Bell,
  Smartphone,
  Sun,
  Moon,
  Sparkles,
  Zap,
  Leaf,
  Waves,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { Button } from '../components/Button';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { UpdatePromptPreview } from '../components/UpdatePromptPreview';
import {
  SkeletonLoader,
  SettingsSkeleton,
  FavoritesSkeleton,
  MultiConverterSkeleton,
} from '../components/SkeletonLoader';
import { ConversionHistory } from '../features/ratewise/components/ConversionHistory';
import { useAppTheme } from '../hooks/useAppTheme';
import { STYLE_DEFINITIONS, type ThemeStyle } from '../config/themes';
import { getDisplayVersion } from '../config/version';
import { APP_INFO } from '../config/app-info';
import type { ConversionHistoryEntry } from '../features/ratewise/types';

function ColorSwatch({
  name,
  cssVar,
  description,
}: {
  name: string;
  cssVar: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <div
        className="w-12 h-12 rounded-lg shadow-sm border border-border"
        style={{ backgroundColor: `rgb(var(${cssVar}))` }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-text text-sm truncate">{name}</div>
        <div className="text-xs text-text-muted font-mono truncate">{cssVar}</div>
        <div className="truncate text-[11px] text-text-muted opacity-70">{description}</div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6 space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Icon size={20} />
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

const STYLE_ICONS: Record<ThemeStyle, React.ElementType> = {
  nitro: Zap,
  kawaii: Sparkles,
  zen: Sun,
  classic: Moon,
  ocean: Waves,
  forest: Leaf,
};

export default function UIShowcase() {
  useTranslation();
  const { showToast } = useToast();
  const { config, setStyle, isLoaded } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'themes' | 'colors' | 'components' | 'skeletons'>(
    'themes',
  );
  const [forceOfflinePreview, setForceOfflinePreview] = useState(false);
  const [updatePromptState, setUpdatePromptState] = useState<
    'offlineReady' | 'needRefresh' | 'isUpdating' | 'updateFailed' | null
  >(null);

  const sampleHistory: ConversionHistoryEntry[] = useMemo(
    () => [
      {
        from: 'TWD',
        to: 'USD',
        amount: '1000',
        result: '31.62',
        time: '今天 上午10:30',
        timestamp: 1706140200000,
      },
      {
        from: 'USD',
        to: 'JPY',
        amount: '100',
        result: '15,234',
        time: '今天 上午09:15',
        timestamp: 1706136600000,
      },
      {
        from: 'EUR',
        to: 'TWD',
        amount: '500',
        result: '17,100',
        time: '昨天 下午03:45',
        timestamp: 1706053800000,
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <UpdatePromptPreview
        state={updatePromptState}
        onClose={() => setUpdatePromptState(null)}
        onUpdate={() => {
          if (updatePromptState === 'needRefresh' || updatePromptState === 'updateFailed') {
            showToast(updatePromptState === 'updateFailed' ? '重試更新' : '開始更新', 'info');
          }
        }}
      />

      <OfflineIndicator forceOffline={forceOfflinePreview ? true : undefined} />

      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-lg border border-border bg-surface p-2 transition-colors hover:bg-surface-elevated"
            >
              <ArrowLeft size={20} className="text-text" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-text">介面展示</h1>
              <p className="text-sm text-text-muted">{APP_INFO.shortName} 組件庫展示</p>
            </div>
          </div>
        </header>

        <nav className="card p-1.5">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'themes' as const, label: '主題', icon: Palette },
              { id: 'colors' as const, label: '色彩', icon: Sun },
              { id: 'components' as const, label: '組件', icon: Layout },
              { id: 'skeletons' as const, label: '骨架屏', icon: Smartphone },
            ].map(({ id, label, icon: TabIcon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] whitespace-nowrap ${
                  activeTab === id
                    ? 'border border-border/70 bg-surface-elevated text-text shadow-sm'
                    : 'text-text-muted hover:bg-surface'
                }`}
              >
                <TabIcon size={16} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {activeTab === 'themes' && (
          <div className="space-y-6">
            <Section title="主題風格切換" icon={Palette}>
              <p className="text-sm text-text-muted mb-4">
                即時切換主題風格，查看所有組件在不同主題下的表現
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.keys(STYLE_DEFINITIONS) as ThemeStyle[]).map((styleKey) => {
                  const styleDef = STYLE_DEFINITIONS[styleKey];
                  const StyleIcon = STYLE_ICONS[styleKey];
                  const isActive = config.style === styleKey;

                  return (
                    <button
                      type="button"
                      key={styleKey}
                      onClick={() => setStyle(styleKey)}
                      disabled={!isLoaded}
                      className={`
                        relative rounded-lg border-2 p-4 transition-[background-color,border-color,box-shadow,transform] duration-200
                        ${
                          isActive
                            ? 'border-primary/30 bg-surface-elevated shadow-sm'
                            : 'border-border bg-surface hover:border-primary/20 hover:bg-surface-elevated'
                        }
                        ${!isLoaded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {isActive && (
                        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-primary/20 bg-surface text-primary">
                          <Check size={14} />
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-surface-elevated text-primary'
                          }`}
                        >
                          <StyleIcon size={24} />
                        </div>
                        <span className="font-bold text-sm text-text">{styleDef.name}</span>
                        <span className="text-xs text-text-muted text-center">
                          {styleDef.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="當前主題預覽" icon={Star}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg bg-primary p-4 text-center text-primary-foreground">
                  <span className="text-sm font-bold">Primary</span>
                </div>
                <div className="rounded-lg bg-accent p-4 text-center text-primary-foreground">
                  <span className="text-sm font-bold">Accent</span>
                </div>
                <div className="rounded-lg bg-success p-4 text-center text-success-foreground">
                  <span className="text-sm font-bold">Success</span>
                </div>
                <div className="rounded-lg bg-destructive p-4 text-center text-destructive-foreground">
                  <span className="text-sm font-bold">Destructive</span>
                </div>
              </div>
              <div className="mt-4 p-4 card">
                <p className="text-text font-semibold">主要文字 (text)</p>
                <p className="text-text-muted">次要文字 (text-muted)</p>
                <p className="text-primary">主題色文字 (primary)</p>
              </div>
            </Section>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="space-y-6">
            <Section title="主要色彩" icon={Palette}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ColorSwatch name="Primary" cssVar="--color-primary" description="主要品牌色" />
                <ColorSwatch name="Accent" cssVar="--color-accent" description="強調色" />
                <ColorSwatch name="Background" cssVar="--color-background" description="背景色" />
                <ColorSwatch name="Surface" cssVar="--color-surface" description="卡片表面色" />
                <ColorSwatch name="Text" cssVar="--color-text" description="主要文字色" />
                <ColorSwatch
                  name="Text Muted"
                  cssVar="--color-text-muted"
                  description="次要文字色"
                />
              </div>
            </Section>

            <Section title="狀態色彩" icon={Bell}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ColorSwatch name="Success" cssVar="--color-success" description="成功狀態" />
                <ColorSwatch
                  name="Destructive"
                  cssVar="--color-destructive"
                  description="錯誤/危險"
                />
                <ColorSwatch name="Warning" cssVar="--color-warning" description="警告狀態" />
                <ColorSwatch name="Info" cssVar="--color-info" description="資訊提示" />
              </div>
            </Section>

            <Section title="特殊色彩" icon={Star}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ColorSwatch name="Favorite" cssVar="--color-favorite" description="收藏星星色" />
                <ColorSwatch name="Border" cssVar="--color-border" description="邊框色" />
                <ColorSwatch name="Card" cssVar="--color-card" description="卡片背景" />
              </div>
            </Section>
          </div>
        )}

        {activeTab === 'components' && (
          <div className="space-y-6">
            <Section title="PWA 更新通知" icon={RefreshCw}>
              <p className="text-sm text-text-muted mb-3">
                PWA 更新通知的四種狀態展示，統一使用通知 shared token。
                <br />
                <strong className="text-warning">通知會顯示在頁面底部中央的真實位置</strong>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  variant={updatePromptState === 'offlineReady' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() =>
                    setUpdatePromptState((prev) =>
                      prev === 'offlineReady' ? null : 'offlineReady',
                    )
                  }
                >
                  {updatePromptState === 'offlineReady' ? '✓ ' : ''}離線就緒
                </Button>
                <Button
                  variant={updatePromptState === 'needRefresh' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() =>
                    setUpdatePromptState((prev) => (prev === 'needRefresh' ? null : 'needRefresh'))
                  }
                >
                  {updatePromptState === 'needRefresh' ? '✓ ' : ''}需要更新
                </Button>
                <Button
                  variant={updatePromptState === 'isUpdating' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() =>
                    setUpdatePromptState((prev) => (prev === 'isUpdating' ? null : 'isUpdating'))
                  }
                >
                  {updatePromptState === 'isUpdating' ? '✓ ' : ''}更新中
                </Button>
                <Button
                  variant={updatePromptState === 'updateFailed' ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={() =>
                    setUpdatePromptState((prev) =>
                      prev === 'updateFailed' ? null : 'updateFailed',
                    )
                  }
                >
                  {updatePromptState === 'updateFailed' ? '✓ ' : ''}更新失敗
                </Button>
              </div>
            </Section>

            <Section title="離線指示器" icon={Bell}>
              <p className="text-sm text-text-muted mb-3">
                強制顯示離線指示器，方便設計檢視。未強制時會使用真實網路狀態。
                <br />
                <strong className="text-warning">通知會顯示在頁面頂部中央的真實位置</strong>
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={forceOfflinePreview ? 'danger' : 'secondary'}
                  onClick={() => setForceOfflinePreview((prev) => !prev)}
                >
                  {forceOfflinePreview ? '✓ 停止強制離線' : '強制顯示離線'}
                </Button>
              </div>
            </Section>

            <Section title="按鈕組件" icon={Layout}>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <Button leftIcon={<Star size={16} />}>With Icon</Button>
                </div>
              </div>
            </Section>

            <Section title="Toast 通知" icon={Bell}>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  leftIcon={<Check size={16} />}
                  onClick={() => showToast('操作成功！', 'success')}
                >
                  成功通知
                </Button>
                <Button
                  variant="danger"
                  leftIcon={<X size={16} />}
                  onClick={() => showToast('發生錯誤', 'error')}
                >
                  錯誤通知
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Info size={16} />}
                  onClick={() => showToast('提示資訊', 'info')}
                >
                  資訊通知
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Copy size={16} />}
                  onClick={() => showToast('已複製到剪貼簿', 'success')}
                >
                  複製通知
                </Button>
              </div>
            </Section>

            <Section title="轉換歷史" icon={Clock}>
              <p className="text-sm text-text-muted mb-3">
                點擊卡片複製轉換結果，雙擊或長按重新轉換
              </p>
              <ConversionHistory
                history={sampleHistory}
                onReconvert={(entry) => {
                  showToast(`重新轉換: ${entry.amount} ${entry.from} → ${entry.to}`, 'info');
                }}
              />
            </Section>

            <Section title="文字排版" icon={Type}>
              <div className="space-y-3">
                <h1 className="text-3xl font-black text-text">Heading 1 - 標題一</h1>
                <h2 className="text-2xl font-bold text-text">Heading 2 - 標題二</h2>
                <h3 className="text-xl font-semibold text-text">Heading 3 - 標題三</h3>
                <p className="text-base text-text">Body text - 正文文字</p>
                <p className="text-sm text-text-muted">Small text - 小字文字</p>
                <p className="text-xs text-text-muted opacity-60">Caption - 說明文字</p>
              </div>
            </Section>

            <Section title="卡片樣式" icon={Layout}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-4">
                  <h3 className="font-bold text-text mb-2">基本卡片</h3>
                  <p className="text-sm text-text-muted">使用 .card 類別的基本卡片樣式</p>
                </div>
                <div className="card p-4 border-2 border-primary/30">
                  <h3 className="font-bold text-primary mb-2">強調卡片</h3>
                  <p className="text-sm text-text-muted">帶有主題色邊框的強調卡片</p>
                </div>
              </div>
            </Section>

            <Section title="圖示展示" icon={Star}>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: Star, name: 'Star', color: 'text-favorite' },
                  { icon: Clock, name: 'Clock', color: 'text-text-muted' },
                  { icon: Settings, name: 'Settings', color: 'text-text' },
                  { icon: ArrowRight, name: 'Arrow', color: 'text-primary' },
                  { icon: RefreshCw, name: 'Refresh', color: 'text-success' },
                  { icon: Copy, name: 'Copy', color: 'text-info' },
                  { icon: Check, name: 'Check', color: 'text-success' },
                  { icon: X, name: 'Close', color: 'text-destructive' },
                ].map(({ icon: IconComponent, name, color }) => (
                  <div
                    key={name}
                    className="flex flex-col items-center gap-1 rounded-lg bg-surface p-3"
                  >
                    <IconComponent size={24} className={color} />
                    <span className="text-xs text-text-muted">{name}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {activeTab === 'skeletons' && (
          <div className="space-y-6">
            <Section title="主頁面骨架屏" icon={Smartphone}>
              <div className="overflow-hidden rounded-lg border border-border">
                <SkeletonLoader />
              </div>
            </Section>

            <Section title="設定頁面骨架屏" icon={Settings}>
              <div className="overflow-hidden rounded-lg border border-border">
                <SettingsSkeleton />
              </div>
            </Section>

            <Section title="收藏頁面骨架屏" icon={Star}>
              <div className="overflow-hidden rounded-lg border border-border">
                <FavoritesSkeleton />
              </div>
            </Section>

            <Section title="多幣別頁面骨架屏" icon={RefreshCw}>
              <div className="overflow-hidden rounded-lg border border-border">
                <MultiConverterSkeleton />
              </div>
            </Section>
          </div>
        )}

        <footer className="text-center py-6 text-sm text-text-muted">
          <p>
            {APP_INFO.shortName} 介面展示 {getDisplayVersion()}
          </p>
          <p className="text-xs opacity-60 mt-1">使用 SSOT Design Token 系統 | 支援 6 種主題風格</p>
        </footer>
      </div>
    </div>
  );
}
