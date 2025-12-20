/**
 * Footer Component - Stage 6: 內部連結結構
 *
 * 依據：
 * - [Google SEO] 內部連結最佳實踐
 * - [Moz] Internal Linking Strategy 2025
 * - [WCAG 2.1] 無障礙導航要求
 *
 * 功能：
 * - 所有 17 個 SEO 路徑連結
 * - 分組顯示（核心頁面 + 幣別頁面）
 * - 響應式設計
 * - 無障礙標籤
 *
 * SEO 效益：
 * - 改善內部連結分布 (Internal PageRank)
 * - 降低網站層級深度
 * - 提升爬蟲發現效率
 * - 改善用戶導航體驗
 *
 * 建立時間: 2025-12-20
 * BDD 階段: Stage 6 GREEN
 */

import { Link } from 'react-router-dom';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: '核心頁面',
    links: [
      { label: '首頁', href: '/' },
      { label: '常見問題', href: '/faq/' },
      { label: '關於我們', href: '/about/' },
      { label: '使用指南', href: '/guide/' },
    ],
  },
  {
    title: '亞洲貨幣',
    links: [
      { label: 'USD 美元', href: '/usd-twd/' },
      { label: 'JPY 日圓', href: '/jpy-twd/' },
      { label: 'HKD 港幣', href: '/hkd-twd/' },
      { label: 'CNY 人民幣', href: '/cny-twd/' },
      { label: 'KRW 韓元', href: '/krw-twd/' },
      { label: 'SGD 新加坡幣', href: '/sgd-twd/' },
      { label: 'THB 泰銖', href: '/thb-twd/' },
    ],
  },
  {
    title: '歐美貨幣',
    links: [
      { label: 'EUR 歐元', href: '/eur-twd/' },
      { label: 'GBP 英鎊', href: '/gbp-twd/' },
      { label: 'AUD 澳幣', href: '/aud-twd/' },
      { label: 'CAD 加幣', href: '/cad-twd/' },
      { label: 'NZD 紐幣', href: '/nzd-twd/' },
      { label: 'CHF 瑞士法郎', href: '/chf-twd/' },
    ],
  },
];

const SOCIAL_LINKS = [
  {
    name: 'Threads',
    url: 'https://www.threads.net/@azlife_1224',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.186 3.003c-.813 0-1.599.161-2.315.471-1.39.603-2.47 1.748-3.14 3.317-.505 1.183-.627 2.587-.357 4.064.185 1.015.533 1.939 1.029 2.743.455.739 1.037 1.374 1.723 1.89.722.543 1.543.94 2.439 1.182 1.056.285 2.179.379 3.292.281 1.062-.094 2.067-.363 2.98-.804 1.065-.516 1.937-1.238 2.59-2.142.641-.889 1.023-1.923 1.131-3.078a7.18 7.18 0 0 0-.159-2.137c-.341-1.443-1.145-2.653-2.322-3.493C16.935 3.718 14.658 3.003 12.186 3.003z" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    url: 'https://github.com/haotool/app',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-16" role="contentinfo">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4 text-lg">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-slate-400 hover:text-indigo-400 transition-colors duration-200 text-sm"
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
        <div className="border-t border-slate-700 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <div className="text-sm text-slate-400">
            <p>
              © {currentYear}{' '}
              <a
                href="https://haotool.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                HaoTool
              </a>
              . All rights reserved.
            </p>
            <p className="mt-1 text-xs">
              匯率數據參考臺灣銀行牌告匯率，每 5 分鐘更新。僅供參考，實際交易請以銀行公告為準。
            </p>
          </div>

          {/* Social Links */}
          <div className="flex gap-4">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-indigo-400 transition-colors duration-200"
                aria-label={`Visit our ${social.name} page`}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-xs text-slate-500 text-center md:text-left">
          <p>Built with React • Vite • Tailwind CSS • Progressive Web App (PWA)</p>
          <p className="mt-1">
            Open Source on{' '}
            <a
              href="https://github.com/haotool/app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300"
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
