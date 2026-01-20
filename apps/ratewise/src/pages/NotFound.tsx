/**
 * NotFound - 404 頁面元件
 *
 * [SEO Fix 2025-11-25 Phase 2A-2]
 * 實作 404 錯誤頁面，提供清晰的錯誤訊息與導航選項
 *
 * SEO 策略：
 * - 使用 SEOHelmet 設定 robots: noindex（避免 404 頁面被索引）
 * - 提供友善的錯誤說明與替代導航選項
 * - 幫助用戶快速回到有效頁面
 *
 * 參考：fix/seo-phase2a-bdd-approach
 * 依據：[SEO 審查報告 2025-11-25] 404 頁面最佳實踐
 */

import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-light to-neutral px-4">
      {/* SEO Configuration: noindex to prevent 404 pages from being indexed */}
      <SEOHelmet
        title="404 - 找不到頁面"
        description="很抱歉，您訪問的頁面不存在。請返回首頁或瀏覽其他頁面。"
        pathname="/404"
        robots="noindex, follow"
      />

      <div className="max-w-md w-full text-center">
        {/* 404 Error Display */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary mb-4" aria-label="404 錯誤">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-neutral-text mb-2">找不到頁面</h2>
          <p className="text-neutral-text-secondary mb-6">
            很抱歉，您訪問的頁面不存在。
            <br />
            請檢查網址是否正確，或返回首頁繼續瀏覽。
          </p>
        </div>

        {/* Primary Action: Return to Home */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            返回首頁
          </Link>
        </div>

        {/* Suggested Pages */}
        <div className="space-y-3">
          <p className="text-sm text-neutral-text-muted mb-3">或許您想前往：</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/faq/"
              className="px-4 py-2 text-primary hover:text-primary-hover hover:bg-primary-bg rounded-lg transition-colors font-medium"
            >
              常見問題
            </Link>
            <Link
              to="/about/"
              className="px-4 py-2 text-primary hover:text-primary-hover hover:bg-primary-bg rounded-lg transition-colors font-medium"
            >
              關於我們
            </Link>
          </div>
        </div>

        {/* Additional Help Text */}
        <p className="mt-8 text-xs text-neutral-text-muted">
          如果您認為這是一個錯誤，請
          <a
            href="https://github.com/haotool/app/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-hover underline ml-1"
          >
            回報問題
          </a>
        </p>
      </div>
    </main>
  );
}
