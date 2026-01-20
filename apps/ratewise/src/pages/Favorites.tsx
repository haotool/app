/**
 * Favorites & History Page
 *
 * 收藏與歷史記錄頁面
 *
 * @description 管理收藏的貨幣對，查看轉換歷史記錄，快速訪問常用貨幣
 * @features 收藏管理、歷史記錄、快速訪問、清除/匯出功能
 */

import { Star } from 'lucide-react';

export default function Favorites() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full text-center">
        {/* 圖標 */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Star className="w-10 h-10 text-primary" aria-hidden="true" />
          </div>
        </div>

        {/* 標題 */}
        <h1 className="text-2xl font-bold text-neutral-text mb-3">收藏與歷史</h1>

        {/* 說明 */}
        <p className="text-neutral-text-muted mb-6 leading-relaxed">
          管理您的收藏貨幣對，查看轉換歷史記錄，快速訪問常用貨幣。
        </p>

        {/* 狀態 */}
        <div className="bg-primary/10 rounded-xl px-6 py-4 border border-primary/20">
          <p className="text-primary font-medium">🚧 功能開發中</p>
          <p className="text-sm text-neutral-text-muted mt-2">此功能即將推出，敬請期待！</p>
        </div>

        {/* 預覽功能列表 */}
        <div className="mt-8 text-left bg-surface-elevated rounded-xl p-4">
          <h2 className="text-sm font-semibold text-neutral-text mb-3">即將推出的功能：</h2>
          <ul className="space-y-2 text-sm text-neutral-text-muted">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>收藏常用的貨幣對</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>查看轉換歷史記錄</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>一鍵快速轉換收藏貨幣</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>清除或匯出歷史記錄</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
