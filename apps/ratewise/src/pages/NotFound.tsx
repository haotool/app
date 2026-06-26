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
import { contentPageTokens } from '../config/design-tokens';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-8 sm:px-6">
      <SEOHelmet
        title={t('notFound.metaTitle')}
        description={t('notFound.metaDescription')}
        pathname="/404"
        robots="noindex, follow"
      />

      <div className="card w-full max-w-xl p-6 text-center sm:p-8">
        <p className={contentPageTokens.sectionHeader.eyebrow}>{t('notFound.eyebrow')}</p>
        <div className="mt-3 mb-8">
          <h1
            className="text-6xl font-bold tracking-tight text-primary sm:text-7xl"
            aria-label={t('notFound.errorAria')}
          >
            404
          </h1>
          <h2 className="mt-3 text-2xl font-semibold text-text">{t('notFound.title')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted sm:text-base">
            {t('notFound.message')}
          </p>
        </div>

        <div className="mb-8">
          <Link to="/" className={contentPageTokens.buttons.primary}>
            {t('notFound.goHome')}
          </Link>
        </div>

        <div className="space-y-3">
          <p className="mb-3 text-sm text-text-muted">{t('notFound.suggestedPages')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/faq/" className={contentPageTokens.links.ctaSecondary}>
              {t('settings.faq')}
            </Link>
            <Link to="/about/" className={contentPageTokens.links.ctaSecondary}>
              {t('settings.aboutUs')}
            </Link>
          </div>
        </div>

        <p className="mt-8 text-xs text-text-muted">
          {t('notFound.reportIssuePrefix')}
          <a
            href="https://github.com/haotool/app/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline ml-1"
          >
            {t('notFound.reportIssueLink')}
          </a>
        </p>
      </div>
    </main>
  );
}
