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
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen flex items-center justify-center bg-page-gradient px-4">
      {/* SEO Configuration: noindex to prevent 404 pages from being indexed */}
      <SEOHelmet
        title="404 - 找不到頁面"
        description="您訪問的頁面不存在。若要繼續使用即時匯率服務，請返回首頁並重新搜尋。"
        pathname="/404"
        robots="noindex, follow"
      />

      <div className="max-w-md w-full text-center">
        {/* 404 Error Display */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary mb-4" aria-label="404 錯誤">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-text mb-2">{t('notFound.title')}</h2>
          <p className="text-text-muted mb-6">{t('notFound.message')}</p>
          <p className="text-sm text-text-muted">
            如果想繼續匯率換算，建議先回首頁並使用「匯率計算機」。
          </p>
        </div>

        {/* Primary Action: Return to Home */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            {t('notFound.goHome')}
          </Link>
        </div>

        {/* Suggested Pages */}
        <div className="space-y-3">
          <p className="text-sm text-text-muted mb-3">或許您想前往：</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="px-4 py-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-colors font-medium"
            >
              首頁匯率換算
            </Link>
            <Link
              to="/faq/"
              className="px-4 py-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-colors font-medium"
            >
              {t('settings.faq')}
            </Link>
            <Link
              to="/about/"
              className="px-4 py-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-colors font-medium"
            >
              {t('settings.aboutUs')}
            </Link>
          </div>
        </div>

        {/* Additional Help Text */}
        <p className="mt-8 text-xs text-text-muted">
          如果您認為這是一個錯誤，請
          <a
            href="https://github.com/haotool/app/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline ml-1"
          >
            回報問題
          </a>
        </p>
      </div>
    </main>
  );
}
