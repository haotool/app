/**
 * UI Showcase Page - Complete RateWise Component Gallery
 * UI 展示頁面 - 完整的 RateWise 組件庫
 *
 * @description Comprehensive showcase of all RateWise UI components,
 *              design tokens, and theme variations with live theme switching.
 *              完整展示所有 RateWise UI 組件、設計 Token 和主題變化，支援即時主題切換。
 * @version 3.0.0
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import {
  SkeletonLoader,
  SettingsSkeleton,
  FavoritesSkeleton,
  MultiConverterSkeleton,
} from '../components/SkeletonLoader';
import { ConversionHistory } from '../features/ratewise/components/ConversionHistory';
import { useAppTheme } from '../hooks/useAppTheme';
import { STYLE_DEFINITIONS, type ThemeStyle } from '../config/themes';
import type { ConversionHistoryEntry } from '../features/ratewise/types';

/**
 * Theme color swatch component
 * 主題色彩樣本組件
 */
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
    <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
      <div
        className="w-12 h-12 rounded-lg shadow-sm border border-border"
        style={{ backgroundColor: `rgb(var(${cssVar}))` }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-text text-sm truncate">{name}</div>
        <div className="text-xs text-text-muted font-mono truncate">{cssVar}</div>
        <div className="text-[10px] text-text-muted opacity-60 truncate">{description}</div>
      </div>
    </div>
  );
}

/**
 * Section wrapper component
 * 區塊包裝組件
 */
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

/**
 * Theme style icons mapping
 * 主題風格圖示對應
 */
const STYLE_ICONS: Record<ThemeStyle, React.ElementType> = {
  nitro: Zap,
  kawaii: Sparkles,
  zen: Sun,
  classic: Moon,
  ocean: Waves,
  forest: Leaf,
};

export default function UIShowcase() {
  useTranslation(); // Initialize i18n context
  const { showToast } = useToast();
  const { config, setStyle, isLoaded } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'themes' | 'colors' | 'components' | 'skeletons'>(
    'themes',
  );

  // Sample history data for demo - using useMemo to avoid impure function calls during render
  const sampleHistory: ConversionHistoryEntry[] = useMemo(
    () => [
      {
        from: 'TWD',
        to: 'USD',
        amount: '1000',
        result: '31.62',
        time: '今天 上午10:30',
        timestamp: 1706140200000, // Fixed timestamp for demo
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl bg-surface border border-border hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft size={20} className="text-text" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-text">UI Showcase</h1>
              <p className="text-sm text-text-muted">RateWise 組件庫展示</p>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="card p-1.5">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'themes' as const, label: '主題', icon: Palette },
              { id: 'colors' as const, label: '色彩', icon: Sun },
              { id: 'components' as const, label: '組件', icon: Layout },
              { id: 'skeletons' as const, label: '骨架屏', icon: Smartphone },
            ].map(({ id, label, icon: TabIcon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                  activeTab === id
                    ? 'bg-primary text-white shadow-md'
                    : 'text-text-muted hover:bg-surface'
                }`}
              >
                <TabIcon size={16} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Themes Tab - Live Theme Switching */}
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
                      key={styleKey}
                      onClick={() => setStyle(styleKey)}
                      disabled={!isLoaded}
                      className={`
                        relative p-4 rounded-2xl border-2 transition-all duration-200
                        ${
                          isActive
                            ? 'border-primary bg-primary/10 shadow-lg scale-[1.02]'
                            : 'border-border bg-surface hover:border-primary/50 hover:shadow-md'
                        }
                        ${!isLoaded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {isActive && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isActive ? 'bg-primary text-white' : 'bg-surface-elevated text-primary'
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

            {/* Current Theme Preview */}
            <Section title="當前主題預覽" icon={Star}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-primary text-white text-center">
                  <span className="text-sm font-bold">Primary</span>
                </div>
                <div className="p-4 rounded-xl bg-accent text-white text-center">
                  <span className="text-sm font-bold">Accent</span>
                </div>
                <div className="p-4 rounded-xl bg-success text-white text-center">
                  <span className="text-sm font-bold">Success</span>
                </div>
                <div className="p-4 rounded-xl bg-destructive text-white text-center">
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

        {/* Colors Tab */}
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

        {/* Components Tab */}
        {activeTab === 'components' && (
          <div className="space-y-6">
            {/* Buttons */}
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

            {/* Toast Notifications */}
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

            {/* Conversion History */}
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

            {/* Typography */}
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

            {/* Cards */}
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

            {/* Icons */}
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
                    className="flex flex-col items-center gap-1 p-3 rounded-xl bg-surface"
                  >
                    <IconComponent size={24} className={color} />
                    <span className="text-xs text-text-muted">{name}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* Skeletons Tab */}
        {activeTab === 'skeletons' && (
          <div className="space-y-6">
            <Section title="主頁面骨架屏" icon={Smartphone}>
              <div className="border border-border rounded-xl overflow-hidden">
                <SkeletonLoader />
              </div>
            </Section>

            <Section title="設定頁面骨架屏" icon={Settings}>
              <div className="border border-border rounded-xl overflow-hidden">
                <SettingsSkeleton />
              </div>
            </Section>

            <Section title="收藏頁面骨架屏" icon={Star}>
              <div className="border border-border rounded-xl overflow-hidden">
                <FavoritesSkeleton />
              </div>
            </Section>

            <Section title="多幣別頁面骨架屏" icon={RefreshCw}>
              <div className="border border-border rounded-xl overflow-hidden">
                <MultiConverterSkeleton />
              </div>
            </Section>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-6 text-sm text-text-muted">
          <p>RateWise UI Showcase v2.0.0</p>
          <p className="text-xs opacity-60 mt-1">使用 SSOT Design Token 系統 | 支援 6 種主題風格</p>
        </footer>
      </div>
    </div>
  );
}
