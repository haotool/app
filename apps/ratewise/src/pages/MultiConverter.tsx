/**
 * Multi-Currency Converter Page
 *
 * 多幣別轉換器頁面 - 同時顯示多個貨幣的換算結果
 *
 * @description 支援同時顯示多個貨幣的換算結果，方便快速比較不同貨幣的匯率
 * @features 基準金額輸入、多貨幣顯示、新增/移除貨幣、即時更新
 */

import { Globe } from 'lucide-react';

export default function MultiConverter() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full text-center">
        {/* 圖標 */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Globe className="w-10 h-10 text-primary" aria-hidden="true" />
          </div>
        </div>

        {/* 標題 */}
        <h1 className="text-2xl font-bold text-neutral-text mb-3">多幣別轉換器</h1>

        {/* 說明 */}
        <p className="text-neutral-text-muted mb-6 leading-relaxed">
          同時顯示多個貨幣的換算結果，方便快速比較不同貨幣的匯率。
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
              <span>同時顯示多個貨幣換算結果</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>支援自訂顯示貨幣列表</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>即時匯率更新與比較</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>匯率趨勢快速預覽</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
