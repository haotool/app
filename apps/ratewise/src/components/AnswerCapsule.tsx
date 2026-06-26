import type { FAQEntry } from '../config/seo-metadata';
import { contentPageTokens } from '../config/design-tokens';

interface AnswerCapsuleProps {
  title?: string;
  items: FAQEntry[];
}

export function AnswerCapsule({ title = '快速答案', items }: AnswerCapsuleProps) {
  if (items.length === 0) return null;

  return (
    <section className="card mb-6 p-5 lg:p-6">
      <p className={contentPageTokens.sectionHeader.eyebrow}>即時重點</p>
      <h2 className="mt-2 text-xl font-bold text-text sm:text-2xl">{title}</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.question} className={contentPageTokens.article.card}>
            <h3 className="mb-2 text-base font-semibold text-text">{item.question}</h3>
            <p className="break-words text-sm leading-relaxed text-text-muted">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
