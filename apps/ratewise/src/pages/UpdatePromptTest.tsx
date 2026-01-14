/**
 * UpdatePrompt 測試頁面 - 用於展示「離線模式已就緒」和「發現新版本」
 *
 * 創建時間: 2025-12-27T00:14:00+08:00
 * 更新時間: 2025-12-27T00:35:00+08:00
 * 目的: 測試 RateWise 品牌配色的 PWA 更新提示
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function UpdatePromptTest() {
  const [showOfflineReady, setShowOfflineReady] = useState(false);
  const [showNeedRefresh, setShowNeedRefresh] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-light via-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 標題區 */}
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
          <h1 className="text-3xl font-bold text-neutral-text mt-4">UpdatePrompt 測試頁面</h1>
          <p className="text-neutral-text-secondary mt-2">測試 RateWise 品牌配色的 PWA 更新提示組件</p>
        </div>

        {/* 控制面板 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral mb-8">
          <h2 className="text-xl font-semibold text-neutral-text mb-4">控制面板</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setShowNeedRefresh(false);
                setShowOfflineReady(true);
              }}
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all"
            >
              ✨ 顯示「離線模式已就緒」
            </button>
            <button
              onClick={() => {
                setShowOfflineReady(false);
                setShowNeedRefresh(true);
              }}
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all"
            >
              🎉 顯示「發現新版本」
            </button>
          </div>
          <button
            onClick={() => {
              setShowOfflineReady(false);
              setShowNeedRefresh(false);
            }}
            className="w-full mt-4 px-6 py-3 rounded-xl bg-neutral text-neutral-text font-semibold hover:bg-neutral-dark transition-all"
          >
            關閉所有提示
          </button>
        </div>

        {/* 說明區 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral">
          <h2 className="text-xl font-semibold text-neutral-text mb-4">設計特點</h2>
          <ul className="space-y-3 text-neutral-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>藍紫漸變品牌色</strong> - RateWise 主題配色
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>圓潤現代的視覺元素</strong> - 24px 圓角設計
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>柔和的光暈裝飾效果</strong> - 藍靛色光暈背景
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>emoji 點綴增加親和力</strong> - ✨ 和 🎉
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>右上角定位</strong> - 不影響用戶操作
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* 模擬 UpdatePrompt 組件 */}
      {(showOfflineReady || showNeedRefresh) && (
        <div
          className="fixed top-4 right-4 z-50 transition-all duration-500 ease-out opacity-100 translate-y-0"
          role="alertdialog"
          aria-labelledby="update-prompt-title"
          aria-describedby="update-prompt-description"
        >
          {/* RateWise 品牌風格卡片 */}
          <div className="relative overflow-hidden rounded-3xl w-80 max-w-[calc(100vw-2rem)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-xl shadow-blue-100/50 animate-slide-in-bounce">
            {/* 品牌光暈裝飾 */}
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-200/30 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-indigo-200/30 blur-3xl"
              aria-hidden="true"
            />

            {/* 內容區域 */}
            <div className="relative p-6">
              {/* 圖標區 */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {/* 外圈光暈 */}
                  <div className="absolute inset-0 rounded-full bg-blue-300 blur-md opacity-40" />
                  {/* 主圖標 */}
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      {showOfflineReady ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      )}
                    </svg>
                  </div>
                </div>
              </div>

              {/* 標題 */}
              <h2
                id="update-prompt-title"
                className="text-xl font-bold text-blue-900 mb-2 text-center"
              >
                {showOfflineReady ? '✨ 離線模式已就緒' : '🎉 發現新版本'}
              </h2>

              {/* 描述 */}
              <p
                id="update-prompt-description"
                className="text-sm text-purple-500 mb-5 leading-relaxed text-center px-2"
              >
                {showOfflineReady ? '應用已準備好，隨時隨地都能使用！' : '新版本帶來更棒的體驗哦！'}
              </p>

              {/* 按鈕 */}
              <div className="flex flex-col space-y-2">
                {showNeedRefresh && (
                  <button
                    onClick={() => alert('模擬更新：實際會重新載入頁面')}
                    className="w-full px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-blue-200/50 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    馬上更新
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowOfflineReady(false);
                    setShowNeedRefresh(false);
                  }}
                  className="w-full px-5 py-3 rounded-2xl bg-white/90 backdrop-blur-sm text-blue-700 text-sm font-semibold border-2 border-blue-200 hover:bg-white hover:border-blue-300 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  {showNeedRefresh ? '等等再說' : '好的'}
                </button>
              </div>
            </div>

            {/* 關閉按鈕 */}
            <button
              onClick={() => {
                setShowOfflineReady(false);
                setShowNeedRefresh(false);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/80 text-blue-500 hover:text-blue-700 hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="關閉通知"
            >
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
          </div>
        </div>
      )}
    </div>
  );
}
