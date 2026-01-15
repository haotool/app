/**
 * Settings Page - 現代化主題設定
 *
 * @description 應用程式設定頁面，支援 4 種風格 × 4 種配色切換
 *              採用現代化扁平 UI 設計
 *
 * 功能：
 * - 主題模式切換（淺色/深色/自動）
 * - 4 種 UI 風格選擇（現代中性/溫暖舒適/冷靜專業/高對比）
 * - 4 種配色選擇（品牌紫/專業藍/自然綠/溫暖玫瑰）
 * - 關於與版本資訊
 *
 * @created 2026-01-15
 * @updated 2026-01-16 - 大規模 UI/UX 重構
 */

import { Settings as SettingsIcon, Palette, Sun, Moon, Monitor, Check } from 'lucide-react';
import { useAppTheme } from '../hooks/useAppTheme';
import {
  STYLE_OPTIONS,
  COLOR_SCHEME_OPTIONS,
  MODE_OPTIONS,
  type ThemeMode,
} from '../config/themes';

export default function Settings() {
  const {
    style,
    colorScheme,
    mode,
    resolvedMode,
    setStyle,
    setColorScheme,
    setMode,
    resetTheme,
    isLoaded,
  } = useAppTheme();

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
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-6 h-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-foreground">應用程式設定</h1>
        </div>
        <p className="text-foreground-muted">自訂您的 RateWise 使用體驗</p>
      </div>

      {/* 主題模式 */}
      <section className="mb-6">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5 text-primary" aria-hidden="true" />
            主題模式
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setMode(option.value)}
                disabled={!isLoaded}
                className={`
                  relative flex flex-col items-center gap-2 px-4 py-4 rounded-lg border-2 
                  transition-all duration-200 disabled:opacity-50
                  ${
                    mode === option.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card text-foreground-secondary hover:border-primary/50 hover:bg-primary/5'
                  }
                `}
                aria-pressed={mode === option.value}
              >
                {getModeIcon(option.value)}
                <span className="text-sm font-medium">{option.label}</span>
                {mode === option.value && (
                  <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs text-foreground-muted">
            目前：{resolvedMode === 'dark' ? '深色模式' : '淺色模式'}
          </p>
        </div>
      </section>

      {/* UI 風格 */}
      <section className="mb-6">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" aria-hidden="true" />
            UI 風格
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {STYLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setStyle(option.value)}
                disabled={!isLoaded}
                className={`
                  relative flex flex-col items-start gap-1 px-4 py-4 rounded-lg border-2
                  text-left transition-all duration-200 disabled:opacity-50
                  ${
                    style === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                  }
                `}
                aria-pressed={style === option.value}
              >
                <span
                  className={`text-sm font-medium ${
                    style === option.value ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {option.label}
                </span>
                <span className="text-xs text-foreground-muted">{option.description}</span>
                {style === option.value && (
                  <Check className="absolute top-3 right-3 w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 配色方案 */}
      <section className="mb-6">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full"
              style={{
                backgroundColor: COLOR_SCHEME_OPTIONS.find((o) => o.value === colorScheme)?.color,
              }}
              aria-hidden="true"
            />
            配色方案
          </h2>

          <div className="grid grid-cols-4 gap-3">
            {COLOR_SCHEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setColorScheme(option.value)}
                disabled={!isLoaded}
                className={`
                  relative flex flex-col items-center gap-2 px-3 py-4 rounded-lg border-2
                  transition-all duration-200 disabled:opacity-50
                  ${
                    colorScheme === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                  }
                `}
                aria-pressed={colorScheme === option.value}
              >
                <span
                  className="w-8 h-8 rounded-full shadow-soft"
                  style={{ backgroundColor: option.color }}
                  aria-hidden="true"
                />
                <span
                  className={`text-xs font-medium ${
                    colorScheme === option.value ? 'text-primary' : 'text-foreground-secondary'
                  }`}
                >
                  {option.label}
                </span>
                {colorScheme === option.value && (
                  <Check
                    className="absolute top-2 right-2 w-4 h-4"
                    style={{ color: option.color }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 重置按鈕 */}
      <section className="mb-6">
        <button
          onClick={resetTheme}
          disabled={!isLoaded}
          className="w-full px-4 py-3 rounded-lg border-2 border-border bg-card
                     text-foreground-secondary font-medium
                     hover:border-destructive hover:text-destructive
                     transition-all duration-200 disabled:opacity-50"
        >
          重置為預設設定
        </button>
      </section>

      {/* 關於資訊 */}
      <section className="mb-6">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">
              ℹ️
            </span>
            關於
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-foreground-muted">應用程式版本</span>
              <span className="text-foreground font-medium font-mono">v2.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground-muted">資料來源</span>
              <span className="text-foreground font-medium">台灣銀行牌告匯率</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground-muted">UI 設計</span>
              <span className="text-foreground font-medium">Modern Flat Design</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-foreground-muted text-center">
              © 2026 RateWise. Built with React + Tailwind CSS.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
