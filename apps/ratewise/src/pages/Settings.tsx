/**
 * Settings Page
 *
 * 應用程式設定頁面
 *
 * 功能（未來實作）：
 * - 主題模式切換（淺色/深色/自動）
 * - 匯率更新頻率設定
 * - 匯率類型設定（現金/即期）
 * - 語言設定
 * - 關於與版本資訊
 * - 隱私權政策與使用條款
 *
 * [refactor:2026-01-15] 新增設定頁面模組（佔位頁面）
 * 依據：Phase 2 架構升級計畫 - 設定頁面設計
 */

import { Settings as SettingsIcon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function Settings() {
  const { mode, setTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-6 h-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-neutral-text">應用程式設定</h1>
        </div>
        <p className="text-neutral-text-muted">自訂您的 RateWise 使用體驗</p>
      </div>

      {/* 外觀設定 */}
      <section className="mb-6">
        <div className="bg-white dark:bg-neutral-dark rounded-lg border border-neutral-light dark:border-neutral-border p-4">
          <h2 className="text-lg font-semibold text-neutral-text mb-4 flex items-center gap-2">
            <span className="text-xl">🎨</span>
            外觀
          </h2>

          {/* 主題模式（已實作） */}
          <div>
            <label className="block text-sm font-medium text-neutral-text mb-3">主題模式</label>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`
                  flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200
                  ${
                    mode === 'light'
                      ? 'border-primary bg-primary-light text-primary font-medium'
                      : 'border-neutral-light bg-neutral-light text-neutral-text-muted hover:border-neutral-DEFAULT'
                  }
                `}
                aria-pressed={mode === 'light'}
              >
                ☀️ 淺色
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`
                  flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200
                  ${
                    mode === 'dark'
                      ? 'border-primary bg-primary-light text-primary font-medium'
                      : 'border-neutral-light bg-neutral-light dark:bg-neutral-dark text-neutral-text-muted hover:border-neutral-DEFAULT'
                  }
                `}
                aria-pressed={mode === 'dark'}
              >
                🌙 深色
              </button>
              <button
                onClick={() => setTheme('auto')}
                className={`
                  flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200
                  ${
                    mode === 'auto'
                      ? 'border-primary bg-primary-light text-primary font-medium'
                      : 'border-neutral-light bg-neutral-light dark:bg-neutral-dark text-neutral-text-muted hover:border-neutral-DEFAULT'
                  }
                `}
                aria-pressed={mode === 'auto'}
              >
                🔄 自動
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 匯率設定 */}
      <section className="mb-6">
        <div className="bg-white dark:bg-neutral-dark rounded-lg border border-neutral-light dark:border-neutral-border p-4">
          <h2 className="text-lg font-semibold text-neutral-text mb-4 flex items-center gap-2">
            <span className="text-xl">💱</span>
            匯率設定
          </h2>

          <div className="bg-primary-light dark:bg-primary-bg rounded-lg px-4 py-3 border border-primary/20">
            <p className="text-primary text-sm font-medium">🚧 功能開發中</p>
          </div>
        </div>
      </section>

      {/* 語言設定 */}
      <section className="mb-6">
        <div className="bg-white dark:bg-neutral-dark rounded-lg border border-neutral-light dark:border-neutral-border p-4">
          <h2 className="text-lg font-semibold text-neutral-text mb-4 flex items-center gap-2">
            <span className="text-xl">🌐</span>
            語言
          </h2>

          <div className="bg-primary-light dark:bg-primary-bg rounded-lg px-4 py-3 border border-primary/20">
            <p className="text-primary text-sm font-medium">🚧 功能開發中</p>
          </div>
        </div>
      </section>

      {/* 關於資訊 */}
      <section className="mb-6">
        <div className="bg-white dark:bg-neutral-dark rounded-lg border border-neutral-light dark:border-neutral-border p-4">
          <h2 className="text-lg font-semibold text-neutral-text mb-4 flex items-center gap-2">
            <span className="text-xl">ℹ️</span>
            關於
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-neutral-text-muted">應用程式版本</span>
              <span className="text-neutral-text font-medium">v2.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-text-muted">資料來源</span>
              <span className="text-neutral-text font-medium">台灣銀行</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-text-muted">最後更新</span>
              <span className="text-neutral-text font-medium">2026-01-15</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-light dark:border-neutral-border">
            <p className="text-xs text-neutral-text-muted text-center">
              © 2026 RateWise. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
