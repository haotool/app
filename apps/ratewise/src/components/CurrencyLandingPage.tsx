/**
 * CurrencyLandingPage - Reusable SEO Landing Page Component
 *
 * @description ParkKeeper-inspired design system for currency landing pages.
 *              Provides consistent styling across all 13 currency landing pages.
 *              SSOT: Design tokens from index.css, structure inspired by Settings/Favorites.
 *
 * Features:
 * - Fully responsive (mobile-first: 320px → tablet: 768px → desktop: 1024px)
 * - Design token SSOT compliance
 * - SEO-optimized structure with schema.org support
 * - PWA-friendly layout with safe area handling
 *
 * @version 1.0.0
 * @created 2026-01-25
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, BookOpen, Sparkles } from 'lucide-react';
import { SEOHelmet } from './SEOHelmet';
import { Breadcrumb } from './Breadcrumb';

export interface FAQEntry {
  question: string;
  answer: string;
}

export interface HowToStep {
  position: number;
  name: string;
  text: string;
}

export interface CurrencyLandingPageProps {
  /** Currency code (e.g., 'USD', 'JPY') */
  currencyCode: string;
  /** Currency flag emoji */
  currencyFlag: string;
  /** Currency full name in Chinese */
  currencyName: string;
  /** Page title for SEO */
  title: string;
  /** Page description for SEO */
  description: string;
  /** URL pathname (e.g., '/usd-twd') */
  pathname: string;
  /** Canonical URL */
  canonical: string;
  /** SEO keywords */
  keywords: string[];
  /** FAQ entries for schema.org */
  faqEntries: FAQEntry[];
  /** How-to steps for schema.org */
  howToSteps: HowToStep[];
  /** Quick highlights for the currency */
  highlights: string[];
  /** Optional custom FAQ section title */
  faqTitle?: string;
}

export function CurrencyLandingPage({
  currencyCode,
  currencyFlag,
  currencyName,
  title,
  description,
  pathname,
  canonical,
  keywords,
  faqEntries,
  howToSteps,
  highlights,
  faqTitle = '常見問題',
}: CurrencyLandingPageProps) {
  const seoProps = {
    title,
    description,
    pathname,
    canonical,
    keywords,
    breadcrumb: [
      { name: 'RateWise 首頁', item: '/' },
      { name: `${currencyCode} → TWD 匯率`, item: `${pathname}/` },
    ],
    faq: faqEntries,
    howTo: {
      name: `如何查看 ${currencyCode} 對 TWD 匯率`,
      description: `使用 RateWise ${howToSteps.length} 步驟快速換算${currencyName}對台幣，並查看歷史趨勢與多幣別。`,
      steps: howToSteps,
      totalTime: 'PT30S',
    },
  };

  return (
    <>
      <SEOHelmet {...seoProps} />

      {/* Main container - PWA optimized with safe area handling */}
      <div className="min-h-full">
        <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
          {/* Back Navigation */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-hover mb-4 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回主換算器</span>
          </Link>

          {/* Breadcrumb Navigation */}
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: `${currencyCode} → TWD`, href: `${pathname}/` },
            ]}
          />

          {/* Header Section */}
          <header className="mb-6 sm:mb-8">
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="text-4xl sm:text-5xl">{currencyFlag}</span>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text leading-tight">
                  {currencyCode} 對 TWD 匯率換算器
                </h1>
                <p className="text-text-muted text-sm sm:text-base mt-2 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          </header>

          {/* Quick Action Card */}
          <div className="card p-4 sm:p-5 mb-6 bg-primary text-white">
            <div className="flex items-center gap-2 mb-3 opacity-80">
              <Sparkles className="w-4 h-4" />
              <h2 className="text-xs font-black uppercase tracking-wider">立即換算</h2>
            </div>
            <p className="text-sm sm:text-base mb-4 opacity-90">
              前往主換算器，即時查看{currencyName}對台幣匯率，支援現金/即期匯率切換。
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-semibold text-sm transition-colors"
            >
              開始換算 {currencyCode} → TWD
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>

          {/* Highlights Section */}
          <section className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
                {currencyName}匯率重點
              </h2>
            </div>

            <div className="card p-4 sm:p-5">
              <ul className="space-y-3">
                {highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-text text-sm sm:text-base leading-relaxed">
                      {highlight}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* How To Steps Section */}
          <section className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">使用步驟</h2>
            </div>

            <div className="space-y-3">
              {howToSteps.map((step) => (
                <div
                  key={step.position}
                  className="card p-4 sm:p-5 flex items-start gap-3 sm:gap-4"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg sm:text-xl flex-shrink-0">
                    {step.position}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-bold text-text text-sm sm:text-base mb-1">{step.name}</h3>
                    <p className="text-text-muted text-xs sm:text-sm leading-relaxed">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 px-2 opacity-40 mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">{faqTitle}</h2>
            </div>

            <div className="space-y-3">
              {faqEntries.map((faq, index) => (
                <details key={index} className="card group" open={index === 0}>
                  <summary className="p-4 sm:p-5 cursor-pointer list-none flex items-start gap-3 hover:bg-surface/50 transition-colors rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text text-sm sm:text-base leading-snug pr-4">
                        {faq.question}
                      </h3>
                    </div>
                    <span className="text-text-muted group-open:rotate-180 transition-transform duration-200 flex-shrink-0">
                      ▼
                    </span>
                  </summary>
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 ml-11">
                    <p className="text-text-muted text-xs sm:text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Guide Link Section */}
          <section className="mb-6">
            <div className="card p-4 sm:p-5 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text text-sm sm:text-base">需要更多幫助？</h3>
                  <p className="text-text-muted text-xs sm:text-sm mt-1">
                    查看完整使用指南，了解所有功能與技巧。
                  </p>
                </div>
                <Link
                  to="/guide/"
                  className="px-3 py-2 bg-primary text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors flex-shrink-0"
                >
                  使用指南
                </Link>
              </div>
            </div>
          </section>

          {/* Data Source Notice */}
          <footer className="text-center text-text-muted text-xs opacity-60">
            <p>資料來源：臺灣銀行牌告匯率 · 每 5 分鐘自動更新</p>
            <p className="mt-1">© 2025 RateWise 匯率好工具</p>
          </footer>
        </div>
      </div>
    </>
  );
}

export default CurrencyLandingPage;
