/**
 * Footer Component - Stage 6: 內部連結結構 + 響應式設計
 *
 * 依據：
 * - [Google SEO] 內部連結最佳實踐
 * - [Moz] Internal Linking Strategy 2025
 * - [WCAG 2.1] 無障礙導航要求
 *
 * 功能：
 * - 行動版：簡潔 footer（匯率來源 + 基本資訊）
 * - 電腦版：完整 footer（17 個 SEO 路徑連結 + 詳細資訊）
 * - 響應式設計
 * - 無障礙標籤
 *
 * SEO 效益：
 * - 改善內部連結分布 (Internal PageRank)
 * - 降低網站層級深度
 * - 提升爬蟲發現效率
 * - 改善用戶導航體驗
 *
 */

import { Link } from 'react-router-dom';
import { ClientOnly } from 'vite-react-ssg';
import { useTranslation } from 'react-i18next';
import { useExchangeRates } from '../features/ratewise/hooks/useExchangeRates';
import { FOOTER_SECTIONS, POPULAR_RATE_LINKS } from '../config/footer-links';
import { getDisplayVersion, getFormattedBuildTime } from '../config/version';
import { APP_INFO, AUTHOR_CONTACT_LINK_MAP } from '../config/app-info';

/** 動態取得當前年份；suppressHydrationWarning 防止 SSG 與 runtime 年份不符。 */
const CURRENT_YEAR = new Date().getFullYear();

// 格式化時間為 MM/DD HH:mm
const formatTime = (dateString: string | null) => {
  if (!dateString) return '--/-- --:--';
  try {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  } catch {
    return '--/-- --:--';
  }
};

const FOOTER_SOURCE_LINK_CLASS =
  'group inline-flex min-h-11 items-center gap-2 rounded-control border border-border/70 bg-surface-elevated px-4 py-2.5 text-text transition-colors duration-200 hover:border-primary/20 hover:bg-surface';
const FOOTER_DIVIDER_CLASS = 'w-full border-t border-border/70';
const FOOTER_TEXT_LINK_CLASS =
  'inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 text-text-muted transition-colors duration-200 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
const FOOTER_RATE_LINK_CLASS =
  'inline-flex min-h-11 items-center rounded-control px-2 text-text-muted transition-colors duration-200 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

function TimeSlot({ value }: { value: string }) {
  return (
    <span
      data-testid="footer-time-slot"
      className="inline-block min-w-[11ch] whitespace-nowrap text-left font-mono tabular-nums"
    >
      {value}
    </span>
  );
}

function FooterUpdateTimeText({
  sourceTime,
  refreshTime,
}: {
  sourceTime: string;
  refreshTime: string;
}) {
  const { t } = useTranslation();

  return (
    <span>
      {t('footer.updateTime')} {t('footer.source')} <TimeSlot value={sourceTime} /> ·{' '}
      {t('footer.refresh')} <TimeSlot value={refreshTime} />
    </span>
  );
}

/** 獨立的時間顯示組件，用於 ClientOnly 渲染以避免 hydration mismatch */
function UpdateTimeDisplay() {
  const { lastUpdate, lastFetchedAt } = useExchangeRates();

  return (
    <FooterUpdateTimeText
      sourceTime={formatTime(lastUpdate)}
      refreshTime={formatTime(lastFetchedAt)}
    />
  );
}

/** 時間顯示的 Fallback (SSG 時顯示的靜態內容) */
function UpdateTimeFallback() {
  return <FooterUpdateTimeText sourceTime="--/-- --:--" refreshTime="--/-- --:--" />;
}

export function Footer() {
  const { t } = useTranslation();
  // SSOT: 版本資訊來自 config/version.ts
  const appVersion = getDisplayVersion();
  const buildTime = getFormattedBuildTime();

  return (
    <footer className="mt-16 border-t border-border/70 bg-surface text-text">
      {/* 行動版簡潔 Footer */}
      <div className="md:hidden max-w-6xl mx-auto px-4 py-8">
        {/* 匯率來源與更新時間 */}
        <div className="flex flex-col items-center justify-center gap-4 mb-6">
          <a
            href="https://rate.bot.com.tw/xrt?Lang=zh-TW"
            target="_blank"
            rel="noopener noreferrer"
            className={FOOTER_SOURCE_LINK_CLASS}
          >
            <svg
              className="h-4 w-4 text-primary transition-transform group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium">{t('footer.taiwanBankFull')}</span>
            <svg
              className="h-3.5 w-3.5 text-text-muted transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
          {/* ClientOnly 避免 hydration mismatch */}
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <ClientOnly fallback={<UpdateTimeFallback />}>{() => <UpdateTimeDisplay />}</ClientOnly>
          </div>
        </div>

        {/* 免責聲明 */}
        <div className="text-center mb-6">
          <p className="text-xs leading-relaxed text-text-muted">{t('footer.disclaimer')}</p>
        </div>

        {/* 快速連結 */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <Link to="/faq/" className={FOOTER_TEXT_LINK_CLASS}>
            <span aria-hidden="true" className="text-text-muted/60">
              ?
            </span>
            {t('footer.faq')}
          </Link>
          <Link to="/about/" className={FOOTER_TEXT_LINK_CLASS}>
            <span aria-hidden="true" className="text-text-muted/60">
              i
            </span>
            {t('footer.about')}
          </Link>
          <Link to="/privacy/" className={FOOTER_TEXT_LINK_CLASS}>
            <span aria-hidden="true" className="text-text-muted/60">
              🔒
            </span>
            {t('footer.privacyPolicy')}
          </Link>
        </div>

        {/* 熱門匯率快速導航 */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          {POPULAR_RATE_LINKS.map((link) => (
            <Link key={link.href} to={link.href} className={FOOTER_RATE_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* 分隔線 */}
        <div className={`mb-6 ${FOOTER_DIVIDER_CLASS}`} />

        {/* 版權與版本資訊 */}
        <div className="flex flex-col items-center justify-center gap-3 text-sm">
          <div className="flex items-center gap-2 text-text">
            <div className="flex h-5 w-5 items-center justify-center rounded-control border border-border/70 bg-surface-elevated">
              <svg
                className="h-3 w-3 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <span className="font-semibold">{t('footer.appName')}</span>
            <span className="text-text-muted/60">•</span>
            <span
              className="group relative inline-block cursor-help font-mono text-xs text-text-muted"
              title={`Built on ${buildTime}`}
            >
              {appVersion}
              <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-text px-2 py-1 text-xs text-surface opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Built on {buildTime}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-text" />
              </span>
            </span>
            <span className="text-text-muted/60">•</span>
            <span className="text-text-muted" suppressHydrationWarning>
              © {CURRENT_YEAR}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted">
            <span>{t('footer.by')}</span>
            <a
              href={AUTHOR_CONTACT_LINK_MAP.threads.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-text transition-colors duration-200 hover:text-primary"
            >
              {AUTHOR_CONTACT_LINK_MAP.threads.value}
            </a>
          </div>
        </div>
      </div>

      {/* 電腦版完整 Footer - 整合簡潔風格 + SEO 連結 */}
      <div className="hidden md:block container mx-auto px-4 md:px-6 py-12 max-w-6xl">
        {/* 匯率來源與更新時間 */}
        <div className="flex flex-row items-center justify-center gap-4 mb-6">
          <a
            href="https://rate.bot.com.tw/xrt?Lang=zh-TW"
            target="_blank"
            rel="noopener noreferrer"
            className={FOOTER_SOURCE_LINK_CLASS}
          >
            <svg
              className="h-4 w-4 text-primary transition-transform group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium">{t('footer.taiwanBankFull')}</span>
            <svg
              className="h-3.5 w-3.5 text-text-muted transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
          {/* ClientOnly 避免 hydration mismatch */}
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <ClientOnly fallback={<UpdateTimeFallback />}>{() => <UpdateTimeDisplay />}</ClientOnly>
          </div>
        </div>

        {/* 免責聲明 */}
        <div className="text-center mb-6">
          <p className="text-xs leading-relaxed text-text-muted">{t('footer.disclaimer')}</p>
        </div>

        {/* 快速連結 */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <Link to="/faq/" className={FOOTER_TEXT_LINK_CLASS}>
            <span aria-hidden="true" className="text-text-muted/60">
              ?
            </span>
            {t('footer.faq')}
          </Link>
          <Link to="/about/" className={FOOTER_TEXT_LINK_CLASS}>
            <span aria-hidden="true" className="text-text-muted/60">
              i
            </span>
            {t('footer.about')}
          </Link>
          <Link to="/privacy/" className={FOOTER_TEXT_LINK_CLASS}>
            <span aria-hidden="true" className="text-text-muted/60">
              🔒
            </span>
            {t('footer.privacyPolicy')}
          </Link>
        </div>

        {/* 分隔線 */}
        <div className={`mb-8 ${FOOTER_DIVIDER_CLASS}`} />

        {/* Links Grid - SEO 內部連結 */}
        <nav aria-label={t('footer.footerNav')}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="mb-4 text-lg font-semibold text-text">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        className="inline-flex min-h-11 min-w-[44px] items-center justify-center rounded-control px-1 text-sm text-text-muted transition-colors duration-200 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Divider */}
        <div className={`my-8 ${FOOTER_DIVIDER_CLASS}`} />

        {/* Bottom Section - 整合版權與社群 */}
        <div className="flex flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <div className="text-sm text-text-muted">
            <p suppressHydrationWarning>
              © {CURRENT_YEAR}{' '}
              <a
                href="https://app.haotool.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-control px-1 text-text underline decoration-border underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                haotool
              </a>
              . All rights reserved.
            </p>
            <p className="mt-1 text-xs text-text-muted">{t('footer.disclaimerDesktop')}</p>
          </div>

          {/* Threads Link */}
          <a
            href={AUTHOR_CONTACT_LINK_MAP.threads.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-11 items-center gap-2 rounded-control border border-transparent px-4 py-2 transition-colors duration-200 hover:border-primary/20 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="text-sm text-text-muted transition-colors group-hover:text-text">
              {t('footer.createdBy')}
            </span>
            <svg
              viewBox="0 0 192 192"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-text-muted transition-colors duration-200 group-hover:text-primary"
              fill="currentColor"
              aria-label="Threads"
            >
              <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
            </svg>
            <span className="text-sm font-medium text-text transition-colors group-hover:text-primary">
              {AUTHOR_CONTACT_LINK_MAP.threads.value}
            </span>
          </a>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-xs text-text-muted md:text-left">
          <p>{t('footer.builtWith')}</p>
          <p className="mt-1">
            {t('footer.openSourceOn')}{' '}
            <a
              href={APP_INFO.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-control px-1 text-text underline decoration-border underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
