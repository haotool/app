import type { FAQEntry } from '../config/seo-metadata';

interface AnswerCapsuleProps {
  title?: string;
  items: FAQEntry[];
}

export function AnswerCapsule({ title = '快速答案', items }: AnswerCapsuleProps) {
  if (items.length === 0) return null;

  return (
    <section className="card mb-6 border border-primary/20 bg-primary/5 p-6">
      <h2 className="mb-4 text-2xl font-bold text-text">{title}</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={item.question}
            className="rounded-xl border border-surface-border bg-surface p-4"
          >
            <h3 className="mb-2 text-base font-semibold text-text">{item.question}</h3>
            <p className="text-sm leading-relaxed text-text-muted">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
