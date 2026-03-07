import { Link } from 'react-router-dom';
import { Breadcrumb } from './Breadcrumb';
import { SEOHelmet } from './SEOHelmet';
import type { AuthorityGuideContent } from '../config/seo-metadata';

interface AuthorityGuidePageProps {
  page: AuthorityGuideContent;
}

export function AuthorityGuidePage({ page }: AuthorityGuidePageProps) {
  return (
    <>
      <SEOHelmet
        title={page.title}
        description={page.description}
        pathname={page.pathname}
        breadcrumb={page.breadcrumb}
      />

      <div className="min-h-screen">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <Link
            to="/"
            className="mb-4 inline-flex items-center text-primary transition-colors hover:text-primary-hover"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            回到首頁
          </Link>

          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: page.heading, href: `${page.pathname}/` },
            ]}
          />

          <header className="mb-8">
            <h1 className="mb-3 text-4xl font-bold text-text">{page.heading}</h1>
            <p className="max-w-3xl text-base leading-7 text-text-muted">{page.intro}</p>
          </header>

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
