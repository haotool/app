/**
 * Authority Guide 頁共用元件（E5 wave-D）：三篇匯率攻略長文 SSOT 渲染。
 * 六段 IA：Answer-first 頁首（h1＋導言＋快速答案）→ 目錄側跳 → 重點整理 →
 * 分段卡片正文 → FAQ 手風琴 → 相關連結＋CTA。
 * 純呈現層：SEO head／JSON-LD／可見文字零變動，佈局與樣式全走 E1 token。
 */

import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from './SEOHelmet';
import { AnswerCapsule } from './AnswerCapsule';
import { ContentPageLayout } from './content/ContentPageLayout';
import {
  ContentPageHeader,
  ContentSectionCard,
  ContentSections,
  type ContentSection,
} from './content/ContentSections';
import type { AuthorityGuideContent } from '../config/seo-metadata';

interface AuthorityGuidePageProps {
  page: AuthorityGuideContent;
}

export function AuthorityGuidePage({ page }: AuthorityGuidePageProps) {
  const { t } = useTranslation();

  // 內容驅動渲染：文案沿用 seo-metadata SSOT，只重排呈現；id 供頁內目錄側跳。
  const sections: ContentSection[] = [
    ...page.sections.map(
      (section, index): ContentSection => ({
        kind: 'text',
        id: `guide-section-${index + 1}`,
        title: section.title,
        paragraphs: section.paragraphs,
      }),
    ),
    ...(page.faqContent && page.faqContent.length > 0
      ? [{ kind: 'faq', id: 'faq', title: '常見問題', items: page.faqContent } as ContentSection]
      : []),
    ...(page.relatedGuides && page.relatedGuides.length > 0
      ? [
          {
            kind: 'links',
            id: 'related-guides',
            title: '相關攻略',
            links: page.relatedGuides.map((guide) => ({
              label: guide.label,
              sub: guide.description,
              href: guide.href,
            })),
          } as ContentSection,
        ]
      : []),
  ];

  // 長文頁目錄側跳（對齊 E4 隱私頁範式）：重點整理＋正文章節＋FAQ。
  const toc = [
    { id: 'highlights', title: '重點整理' },
    ...sections
      .filter((section) => section.kind !== 'links')
      .map((section) => ({
        id: section.id ?? '',
        title: 'title' in section && section.title ? section.title : '',
      })),
  ].filter((item) => item.id && item.title);

  return (
    <>
      <SEOHelmet
        title={page.title}
        description={page.description}
        pathname={page.pathname}
        breadcrumb={page.breadcrumb}
        jsonLd={page.jsonLd}
        ogType="article"
      />

      <ContentPageLayout
        breadcrumbItems={[
          { label: t('nav.home'), href: '/' },
          { label: page.heading, href: page.pathname },
        ]}
        testId="authority-guide-page"
      >
        {/* 1. Answer-first 頁首：h1＋導言，快速答案緊接首屏。 */}
        <ContentPageHeader title={page.heading} lead={page.intro} />

        <AnswerCapsule items={page.answerCapsule ?? []} />

        {/* 2. 目錄側跳（nav chrome，不屬 SEO 內容文字）。 */}
        <nav aria-label="頁內目錄" className="mb-6 flex flex-wrap gap-2">
          {toc.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="inline-flex min-h-11 items-center rounded-full border border-border/60 bg-surface px-4 text-sm font-medium text-text-muted transition-colors hover:bg-primary/5 hover:text-primary-on-surface"
            >
              {item.title}
            </a>
          ))}
        </nav>

        <div className="space-y-6">
          {/* 3. 重點整理：lucide 勾號取代圓點 bullet。 */}
          <ContentSectionCard title="重點整理" id="highlights">
            <ul className="space-y-3">
              {page.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-1 h-5 w-5 shrink-0 text-primary-on-surface"
                    aria-hidden="true"
                  />
                  <span className="text-base leading-relaxed text-text-muted">{highlight}</span>
                </li>
              ))}
            </ul>
          </ContentSectionCard>

          {/* 4-5. 分段卡片正文＋FAQ 手風琴＋相關攻略（E4 section renderer）。 */}
          <ContentSections sections={sections} />

          {/* 6a. 相關幣別 chips（guide→currency 內部連結）。 */}
          {page.relatedCurrencies && page.relatedCurrencies.length > 0 && (
            <ContentSectionCard title="相關幣別" id="related-currencies">
              <div className="flex flex-wrap gap-2">
                {page.relatedCurrencies.map((currency) => (
                  <Link
                    key={currency.code}
                    to={currency.href}
                    className="inline-flex min-h-11 items-center rounded-full border border-border/60 bg-surface px-4 text-sm font-medium text-text-muted transition-colors hover:border-primary/30 hover:text-primary-on-surface"
                  >
                    {currency.label}
                  </Link>
                ))}
              </div>
            </ContentSectionCard>
          )}

          {/* 6b. 換算 CTA：primary tint 卡＋primary-strong 平色按鈕。 */}
          <section className="rounded-card border border-primary/20 bg-primary/5 p-5 shadow-card">
            <h2 className="text-xl font-bold leading-tight text-text">{page.ctaTitle}</h2>
            <p className="mt-2 text-base leading-relaxed text-text-muted">{page.ctaDescription}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary-strong px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                開始換算
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/faq/"
                className="inline-flex min-h-11 items-center justify-center rounded-control border border-primary/20 bg-surface px-5 text-sm font-semibold text-primary-on-surface transition-colors hover:bg-primary/5"
              >
                查看 FAQ
              </Link>
            </div>
          </section>
        </div>
      </ContentPageLayout>
    </>
  );
}
