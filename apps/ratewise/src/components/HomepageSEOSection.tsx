import { Link } from 'react-router-dom';
import { HOMEPAGE_SEO } from '../config/seo-metadata';

export function HomepageSEOSection() {
  const { content, howTo, faqContent } = HOMEPAGE_SEO;

  return (
    <section
      aria-labelledby="homepage-seo-heading"
      className="px-5 pt-5 pb-3 max-w-md mx-auto w-full"
    >
      <div className="rounded-[28px] border border-black/5 bg-surface shadow-card p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/80">
          {content.eyebrow}
        </p>
        <h1
          id="homepage-seo-heading"
          className="mt-2 text-[28px] font-black tracking-tight text-text"
        >
          {content.heading}
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">{content.intro}</p>

        <ul className="mt-4 space-y-2 text-sm leading-6 text-text">
          {content.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-2">
              <span
                aria-hidden="true"
                className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/70"
              />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          {content.quickLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/10"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[28px] border border-black/5 bg-surface shadow-card p-5">
        <h2 className="text-lg font-black text-text">{howTo.name}</h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">{howTo.description}</p>
        <ol className="mt-4 space-y-3">
          {howTo.steps.map((step, index) => (
            <li key={step.name} className="flex gap-3 rounded-2xl bg-primary/5 px-4 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
                {step.position ?? index + 1}
              </span>
              <div>
                <h3 className="text-sm font-bold text-text">{step.name}</h3>
                <p className="mt-1 text-sm leading-6 text-text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 rounded-[28px] border border-black/5 bg-surface shadow-card p-5">
        <h2 className="text-lg font-black text-text">首頁常見問題</h2>
        <div className="mt-4 space-y-3">
          {faqContent.map((entry, index) => (
            <details
              key={entry.question}
              className="rounded-2xl border border-primary/10 bg-primary/5"
              open={index === 0}
            >
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-text">
                {entry.question}
              </summary>
              <p className="px-4 pb-4 text-sm leading-6 text-text-muted">{entry.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
