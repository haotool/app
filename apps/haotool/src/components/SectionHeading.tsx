import type { CSSProperties, ReactNode } from 'react';

interface SectionHeadingProps {
  overline: string;
  title?: ReactNode;
  /**
   * A5 H2 詞級 kinetic（mobile-beauty §5.4）：構建期手動拆詞（每 H2 ≤5 段）。
   * aria-label 輸出完整句、視覺層 aria-hidden 拆詞雙軌；觸發沿用 Reveal data-inview 管線。
   */
  kineticWords?: readonly string[];
  sub?: string;
  id?: string;
  align?: 'center' | 'left';
}

/** 區塊標題組 SSOT（§2 區 4）：overline + H2 + 可選副文，組內 gap 12px。 */
export default function SectionHeading({
  overline,
  title,
  kineticWords,
  sub,
  id,
  align = 'center',
}: SectionHeadingProps) {
  return (
    <div className={`flex flex-col gap-3 ${align === 'center' ? 'items-center text-center' : ''}`}>
      <p className="text-overline uppercase text-primary-strong">{overline}</p>
      {kineticWords ? (
        <h2 id={id} className="text-h2 text-text" aria-label={kineticWords.join('')}>
          <span aria-hidden="true">
            {kineticWords.map((word, index) => (
              <span key={word} className="kinetic-word" style={{ '--i': index } as CSSProperties}>
                {word}
              </span>
            ))}
          </span>
        </h2>
      ) : (
        <h2 id={id} className="text-h2 text-text">
          {title}
        </h2>
      )}
      {sub ? <p className="max-w-[65ch] text-body text-text-muted">{sub}</p> : null}
    </div>
  );
}
