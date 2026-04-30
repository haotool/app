import { Link } from 'react-router-dom';
import { CURRENCY_DEFINITIONS } from '../features/ratewise/constants';
import { HOMEPAGE_SEO } from '../config/seo-metadata';
import { AnswerCapsule } from './AnswerCapsule';

/** 熱門幣對：外幣換台幣（依台灣旅遊熱度排序）。 */
const HOT_TO_TWD = ['JPY', 'KRW', 'USD', 'EUR', 'HKD', 'SGD', 'THB', 'VND', 'AUD', 'GBP'] as const;

/** 熱門幣對：台幣換外幣（出國換匯常見方向）。 */
const HOT_FROM_TWD = [
  'JPY',
  'KRW',
  'USD',
  'EUR',
  'HKD',
  'SGD',
  'THB',
  'VND',
  'AUD',
  'GBP',
] as const;

export function HomepageSEOSection() {
  const { content, howTo, faqContent, answerCapsule } = HOMEPAGE_SEO;

  return (
    <section
      aria-labelledby="homepage-seo-heading"
      className="px-5 pt-5 pb-3 max-w-md mx-auto w-full"
    >
      <div className="rounded-[28px] border border-black/5 bg-surface shadow-card p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
          {content.eyebrow}
        </p>
        <h2
          id="homepage-seo-section-heading"
          className="mt-2 text-[28px] font-black tracking-tight text-text"
        >
          {content.heading}
        </h2>
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

      {/* AEO/GEO 快速答案：AI 引擎直接引用的核心問答，提升首頁引用率。 */}
      <div className="mt-4">
        <AnswerCapsule items={answerCapsule ?? []} />
      </div>

      {/* 熱門幣別換算：內部連結區塊，提升幣對落地頁 PageRank 傳遞。 */}
      <div className="mt-4 rounded-[28px] border border-black/5 bg-surface shadow-card p-5">
        <h2 className="text-lg font-black text-text">熱門幣別換算</h2>

        <p className="mt-1 text-xs text-text-muted">外幣換台幣</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {HOT_TO_TWD.map((code) => {
            const def = CURRENCY_DEFINITIONS[code];
            return (
              <Link
                key={`to-twd-${code}`}
                to={`/${code.toLowerCase()}-twd/`}
                className="flex items-center gap-2 rounded-2xl border border-primary/10 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/10"
              >
                <span aria-hidden="true">{def.flag}</span>
                <span>{def.name}換台幣</span>
              </Link>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-text-muted">台幣換外幣</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {HOT_FROM_TWD.map((code) => {
            const def = CURRENCY_DEFINITIONS[code];
            return (
              <Link
                key={`from-twd-${code}`}
                to={`/twd-${code.toLowerCase()}/`}
                className="flex items-center gap-2 rounded-2xl border border-primary/10 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/10"
              >
                <span aria-hidden="true">{def.flag}</span>
                <span>台幣換{def.name}</span>
              </Link>
            );
          })}
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
          {faqContent?.map((entry, index) => (
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
