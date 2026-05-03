import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageNavHeader } from './PageNavHeader';
import { SEOHelmet } from './SEOHelmet';
import { AnswerCapsule } from './AnswerCapsule';
import type { AuthorityGuideContent } from '../config/seo-metadata';

interface AuthorityGuidePageProps {
  page: AuthorityGuideContent;
}

export function AuthorityGuidePage({ page }: AuthorityGuidePageProps) {
  const { t } = useTranslation();
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

      <div className="min-h-screen">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          {/* 頁面頂部導航：返回 + 麵包屑（PageNavHeader SSOT 模組）。 */}
          <PageNavHeader
            breadcrumbItems={[
              { label: t('nav.home'), href: '/' },
              { label: page.heading, href: page.pathname },
            ]}
          />

          <header className="mb-8">
            <h1 className="mb-3 text-4xl font-bold text-text">{page.heading}</h1>
            <p className="max-w-3xl text-base leading-7 text-text-muted">{page.intro}</p>
          </header>

          <AnswerCapsule items={page.answerCapsule ?? []} />

          <section className="card mb-6 p-6">
            <h2 className="mb-4 text-2xl font-bold text-text">重點整理</h2>
            <ul className="space-y-3 text-text-muted">
              {page.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3">
                  <span className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary" />
                  <span className="leading-7">{highlight}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-6">
            {page.sections.map((section) => (
              <section key={section.title} className="card p-6">
                <h2 className="mb-3 text-2xl font-bold text-text">{section.title}</h2>
                <div className="space-y-3 text-text-muted">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="leading-7">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {page.faqContent && page.faqContent.length > 0 && (
            <section className="card mt-8 p-6">
              <h2 className="mb-6 text-2xl font-bold text-text">常見問題</h2>
              <div className="space-y-4">
                {page.faqContent.map((item) => (
                  <div key={item.question}>
                    <h3 className="mb-1 font-semibold text-text">{item.question}</h3>
                    <p className="leading-7 text-text-muted">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {page.relatedCurrencies && page.relatedCurrencies.length > 0 && (
            <section className="card mt-8 p-6">
              <h2 className="mb-4 text-xl font-semibold text-text">相關幣別</h2>
              <div className="flex flex-wrap gap-2">
                {page.relatedCurrencies.map((currency) => (
                  <Link
                    key={currency.code}
                    to={currency.href}
                    className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    {currency.label}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="card mt-8 border-primary/20 bg-primary/5 p-6">
            <h2 className="mb-2 text-xl font-semibold text-text">{page.ctaTitle}</h2>
            <p className="text-text-muted">{page.ctaDescription}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex items-center rounded-lg bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
              >
                開始換算
              </Link>
              <Link
                to="/faq/"
                className="inline-flex items-center rounded-lg border border-primary/20 px-5 py-3 font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                查看 FAQ
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
