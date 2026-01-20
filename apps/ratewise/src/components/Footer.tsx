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
import { useExchangeRates } from '../features/ratewise/hooks/useExchangeRates';
import { FOOTER_SECTIONS, POPULAR_RATE_LINKS } from '../config/footer-links';

/** 固定年份避免 SSG/hydration mismatch */
const CURRENT_YEAR = 2025;

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

/** 獨立的時間顯示組件，用於 ClientOnly 渲染以避免 hydration mismatch */
function UpdateTimeDisplay() {
  const { lastUpdate, lastFetchedAt } = useExchangeRates();

  return (
    <span>
      更新時間 來源 {formatTime(lastUpdate)} · 刷新 {formatTime(lastFetchedAt)}
    </span>
  );
}

/** 時間顯示的 Fallback (SSG 時顯示的靜態內容) */
function UpdateTimeFallback() {
  return <span>更新時間 來源 --/-- --:-- · 刷新 --/-- --:--</span>;
}

export function Footer() {
  // Version and build time from environment
  const appVersion = import.meta.env.VITE_APP_VERSION ?? 'v1.2.2';
  const buildTime = import.meta.env.VITE_BUILD_TIME ?? '2025/12/24 01:14';

  return (
    <footer className="bg-gradient-to-br from-footer-from via-footer-via to-footer-to text-neutral mt-16">
      {/* 行動版簡潔 Footer */}
      <div className="md:hidden max-w-6xl mx-auto px-4 py-8">
        {/* 匯率來源與更新時間 */}
        <div className="flex flex-col items-center justify-center gap-4 mb-6">
          <a
            href="https://rate.bot.com.tw/xrt?Lang=zh-TW"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 group"
          >
            <svg
              className="w-4 h-4 text-white group-hover:scale-110 transition-transform"
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
            <span className="text-sm font-medium text-white">Taiwan Bank (臺灣銀行牌告匯率)</span>
            <svg
              className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-0.5 transition-transform"
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
          <div className="flex items-center gap-2 text-sm text-white/80">
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
          <p className="text-xs text-white/70 leading-relaxed">
            本服務匯率資料參考臺灣銀行牌告匯率（現金與即期賣出價）· 實際交易匯率以各銀行公告為準
          </p>
        </div>

        {/* 快速連結 */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-white/80 mb-6">
          <Link
            to="/faq/"
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors duration-200"
          >
            <span aria-hidden="true" className="text-white/50">
              ?
            </span>
            常見問題
          </Link>
          <Link
            to="/about/"
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors duration-200"
          >
            <span aria-hidden="true" className="text-white/50">
              i
            </span>
            關於我們
          </Link>
        </div>

        {/* 熱門匯率快速導航 */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/80 mb-6">
          {POPULAR_RATE_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="hover:text-white transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* 分隔線 */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

        {/* 版權與版本資訊 */}
        <div className="flex flex-col items-center justify-center gap-3 text-sm">
          <div className="flex items-center gap-2 text-white/90">
            <div className="w-5 h-5 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <svg
                className="w-3 h-3 text-white"
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
            <span className="font-semibold">匯率好工具</span>
            <span className="text-white/50">•</span>
            <span
              className="relative inline-block cursor-help text-xs text-white/60 font-mono group"
              title={`Built on ${buildTime}`}
            >
              {appVersion}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-text rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                Built on {buildTime}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-text" />
              </span>
            </span>
            <span className="text-white/50">•</span>
            <span className="text-white/70" suppressHydrationWarning>
              © {CURRENT_YEAR}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/80">
            <span>By</span>
            <a
              href="https://www.threads.net/@azlife_1224"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 hover:text-white transition-colors duration-200 font-medium"
            >
              azlife_1224
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
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 group"
          >
            <svg
              className="w-4 h-4 text-white group-hover:scale-110 transition-transform"
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
            <span className="text-sm font-medium text-white">Taiwan Bank (臺灣銀行牌告匯率)</span>
            <svg
              className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-0.5 transition-transform"
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
          <div className="flex items-center gap-2 text-sm text-white/80">
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
          <p className="text-xs text-white/70 leading-relaxed">
            本服務匯率資料參考臺灣銀行牌告匯率（現金與即期賣出價）· 實際交易匯率以各銀行公告為準
          </p>
        </div>

        {/* 快速連結 */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-white/80 mb-6">
          <Link
            to="/faq/"
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors duration-200"
          >
            <span aria-hidden="true" className="text-white/50">
              ?
            </span>
            常見問題
          </Link>
          <Link
            to="/about/"
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors duration-200"
          >
            <span aria-hidden="true" className="text-white/50">
              i
            </span>
            關於我們
          </Link>
        </div>

        {/* 分隔線 */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8" />

        {/* Links Grid - SEO 內部連結 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4 text-lg">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-white/80 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8" />

        {/* Bottom Section - 整合版權與社群 */}
        <div className="flex flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <div className="text-sm text-white/80">
            <p>
              © {CURRENT_YEAR}{' '}
              <a
                href="https://app.haotool.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 underline underline-offset-4 decoration-white/40 hover:text-white transition-colors"
              >
                haotool
              </a>
              . All rights reserved.
            </p>
            <p className="mt-1 text-xs text-white/70">
              匯率數據參考臺灣銀行牌告匯率，每 5 分鐘更新。僅供參考，實際交易請以銀行公告為準。
            </p>
          </div>

          {/* Threads Link */}
          <a
            href="https://www.threads.net/@azlife_1224"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-300"
          >
            <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
              Created by
            </span>
            <svg
              viewBox="0 0 192 192"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-white/70 group-hover:text-white transition-colors duration-300"
              fill="currentColor"
              aria-label="Threads"
            >
              <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
            </svg>
            <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
              azlife_1224
            </span>
          </a>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-xs text-white/70 text-center md:text-left">
          <p>Built with React • Vite • Tailwind CSS • Progressive Web App (PWA)</p>
          <p className="mt-1">
            Open Source on{' '}
            <a
              href="https://github.com/haotool/app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 underline underline-offset-4 decoration-white/40 hover:text-white"
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
