import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageNavHeader } from './PageNavHeader';
import { SEOHelmet } from './SEOHelmet';
import { AnswerCapsule } from './AnswerCapsule';
import type { AuthorityGuideContent } from '../config/seo-metadata';
import { contentPageTokens } from '../config/design-tokens';

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

      <div className="min-h-full">
        <div className={contentPageTokens.shell}>
          <PageNavHeader
            breadcrumbItems={[
              { label: t('nav.home'), href: '/' },
              { label: page.heading, href: page.pathname },
            ]}
          />

          <header className={contentPageTokens.hero.wrapper}>
            <p className={contentPageTokens.sectionHeader.eyebrow}>專題指南</p>
            <h1 className={contentPageTokens.hero.title}>{page.heading}</h1>
            <p className={contentPageTokens.intro}>{page.intro}</p>
          </header>

          <AnswerCapsule items={page.answerCapsule ?? []} />

          <section className={`${contentPageTokens.article.cardLoose} mb-6`}>
            <h2 className={contentPageTokens.article.title}>重點整理</h2>
            <ul className={contentPageTokens.article.list}>
              {page.highlights.map((highlight) => (
                <li key={highlight} className={contentPageTokens.article.listItem}>
                  <span className={contentPageTokens.article.bullet} />
                  <span className={contentPageTokens.article.paragraph}>{highlight}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className={contentPageTokens.section.stack}>
            {page.sections.map((section) => (
              <section key={section.title} className={contentPageTokens.article.cardLoose}>
                <h2 className={contentPageTokens.article.title}>{section.title}</h2>
                <div className={contentPageTokens.article.body}>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className={contentPageTokens.article.paragraph}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {page.faqContent && page.faqContent.length > 0 && (
            <section className={`${contentPageTokens.article.cardLoose} mt-8`}>
              <h2 className={contentPageTokens.article.title}>常見問題</h2>
              <div className="space-y-4">
                {page.faqContent.map((item) => (
                  <div key={item.question}>
                    <h3 className="mb-1 font-semibold text-text">{item.question}</h3>
                    <p className={contentPageTokens.article.paragraph}>{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {page.relatedGuides && page.relatedGuides.length > 0 && (
            <section className={`${contentPageTokens.article.cardLoose} mt-8`}>
              <h2 className={contentPageTokens.article.title}>相關攻略</h2>
              <div className="space-y-3">
                {page.relatedGuides.map((guide) => (
                  <Link
                    key={guide.href}
                    to={guide.href}
                    className={`flex items-start gap-3 ${contentPageTokens.surfaces.quietInteractive}`}
                  >
                    <div>
                      <p className="font-medium text-text">{guide.label}</p>
                      <p className="mt-0.5 text-sm text-text-muted">{guide.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {page.relatedCurrencies && page.relatedCurrencies.length > 0 && (
            <section className={`${contentPageTokens.article.cardLoose} mt-8`}>
              <h2 className={contentPageTokens.article.title}>相關幣別</h2>
              <div className="flex flex-wrap gap-2">
                {page.relatedCurrencies.map((currency) => (
                  <Link
                    key={currency.code}
                    to={currency.href}
                    className={contentPageTokens.links.pill}
                  >
                    {currency.label}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className={`${contentPageTokens.article.cardLoose} mt-8`}>
            <h2 className={contentPageTokens.article.title}>{page.ctaTitle}</h2>
            <p className="text-text-muted">{page.ctaDescription}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/" className={contentPageTokens.buttons.primary}>
                開始換算
              </Link>
              <Link to="/faq/" className={contentPageTokens.links.ctaSecondary}>
                查看 FAQ
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
