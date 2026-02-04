/**
 * UpdatePrompt 測試頁面
 *
 * 展示 6 種風格（Zen / Nitro / Kawaii / Classic / Ocean / Forest）
 * 與 4 種狀態（offlineReady / needRefresh / isUpdating / updateFailed）
 * 共 24 種通知卡片組合。
 *
 * 視覺結構與 UpdatePrompt 生產元件一致，
 * 使用相同 brand token、圓角、陰影與微互動效果。
 */

import { Link } from 'react-router-dom';

const STYLES = ['zen', 'nitro', 'kawaii', 'classic', 'ocean', 'forest'] as const;

const STATES = ['offlineReady', 'needRefresh', 'isUpdating', 'updateFailed'] as const;
type State = (typeof STATES)[number];

const STATE_LABELS: Record<State, string> = {
  offlineReady: '離線就緒',
  needRefresh: '發現新版本',
  isUpdating: '更新中',
  updateFailed: '更新失敗',
};

const STATE_TITLE: Record<State, string> = {
  offlineReady: '離線模式已就緒',
  needRefresh: '發現新版本',
  isUpdating: '正在更新',
  updateFailed: '更新失敗',
};

const STATE_DESC: Record<State, string> = {
  offlineReady: '隨時隨地都能使用',
  needRefresh: '點擊更新獲取最新功能',
  isUpdating: '請稍候...',
  updateFailed: '請重試或檢查網路',
};

const STYLE_LABELS: Record<string, string> = {
  zen: 'Zen 極簡專業',
  nitro: 'Nitro 深色科技',
  kawaii: 'Kawaii 可愛粉嫩',
  classic: 'Classic 復古書卷',
  ocean: 'Ocean 海洋深邃',
  forest: 'Forest 森林自然',
};

/** CTA 按鈕共用樣式（與 UpdatePrompt 一致） */
const CTA_CLASS =
  'px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-brand-button-from to-brand-button-to text-white shadow-sm hover:from-brand-button-hover-from hover:to-brand-button-hover-to hover:scale-[1.02] active:scale-[0.98] transition-[color,background-color,border-color,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-1';

/** 關閉按鈕樣式（與 UpdatePrompt 一致） */
const CLOSE_CLASS =
  'p-1.5 rounded-full bg-brand-icon-from/80 text-brand-text hover:text-brand-text-dark hover:bg-brand-icon-from hover:scale-[1.05] active:scale-[0.95] transition-[color,background-color,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-1';

function NotificationCard({ state }: { state: State }) {
  return (
    <div className="relative overflow-hidden rounded-2xl w-full max-w-[344px] bg-gradient-to-r from-brand-from via-brand-via to-brand-to border border-brand-border/60 shadow-card shadow-brand-shadow/20">
      {/* 裝飾光暈 */}
      <div
        className="absolute top-0 right-0 w-16 h-16 rounded-full bg-brand-icon-from/40 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-brand-decoration/40 blur-2xl"
        aria-hidden="true"
      />

      {/* 內容 */}
      <div className="relative px-6 py-3.5">
        <div className="flex items-center gap-3">
          {/* 狀態圖標 */}
          <div className="flex-shrink-0">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-brand-icon-from to-brand-icon-to flex items-center justify-center shadow">
              <StateIcon state={state} />
            </div>
          </div>

          {/* 標題與描述 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-brand-text-dark truncate">
              {STATE_TITLE[state]}
            </h3>
            <p className="text-xs text-brand-text truncate">{STATE_DESC[state]}</p>
          </div>

          {/* 操作按鈕 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <StateAction state={state} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StateIcon({ state }: { state: State }) {
  if (state === 'isUpdating') {
    return (
      <svg
        className="w-5 h-5 text-brand-text animate-spin"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth={4}
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    );
  }

  const paths: Record<string, string> = {
    updateFailed:
      'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    offlineReady: 'M5 13l4 4L19 7',
    needRefresh:
      'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  };

  return (
    <svg
      className="w-5 h-5 text-brand-text"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={paths[state]} />
    </svg>
  );
}

function StateAction({ state }: { state: State }) {
  if (state === 'isUpdating') return null;

  if (state === 'needRefresh' || state === 'updateFailed') {
    return (
      <button className={CTA_CLASS} aria-label={state === 'updateFailed' ? '重試更新' : '立即更新'}>
        {state === 'updateFailed' ? '重試' : '更新'}
      </button>
    );
  }

  return (
    <button className={CLOSE_CLASS} aria-label="關閉通知">
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}

export default function UpdatePromptTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-light via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 頁首 */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 bg-white/80 px-4 py-2.5 rounded-full shadow border border-blue-100 hover:text-blue-900 hover:bg-white transition-colors mb-4"
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
          <h1 className="text-3xl font-bold text-neutral-text mt-4">UpdatePrompt Brand 配色總覽</h1>
          <p className="text-neutral-text-secondary mt-2">6 種風格 × 4 種狀態 = 24 種組合</p>
        </div>

        {/* 欄標題（狀態） */}
        <div className="hidden md:grid grid-cols-[140px_repeat(4,1fr)] gap-3 mb-3">
          <div />
          {STATES.map((s) => (
            <div
              key={s}
              className="text-center text-xs font-semibold text-neutral-text-secondary uppercase tracking-wide"
            >
              {STATE_LABELS[s]}
            </div>
          ))}
        </div>

        {/* 矩陣：列=風格，欄=狀態 */}
        <div className="flex flex-col gap-6">
          {STYLES.map((style) => (
            <div
              key={style}
              data-style={style}
              className="md:grid md:grid-cols-[140px_repeat(4,1fr)] md:gap-3 md:items-center"
            >
              {/* 列標籤 */}
              <div className="mb-2 md:mb-0">
                <span className="text-sm font-bold text-neutral-text">{STYLE_LABELS[style]}</span>
              </div>

              {/* 四種狀態 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:contents gap-3">
                {STATES.map((state) => (
                  <div key={state} className="flex justify-center py-1.5 md:py-0">
                    <NotificationCard state={state} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
