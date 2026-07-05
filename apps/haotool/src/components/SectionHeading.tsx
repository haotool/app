import type { ReactNode } from 'react';

interface SectionHeadingProps {
  overline: string;
  title: ReactNode;
  sub?: string;
  id?: string;
  align?: 'center' | 'left';
}

/** 區塊標題組 SSOT（§2 區 4）：overline + H2 + 可選副文，組內 gap 12px。 */
export default function SectionHeading({
  overline,
  title,
  sub,
  id,
  align = 'center',
}: SectionHeadingProps) {
  return (
    <div className={`flex flex-col gap-3 ${align === 'center' ? 'items-center text-center' : ''}`}>
      <p className="text-overline uppercase text-primary-strong">{overline}</p>
      <h2 id={id} className="text-h2 text-text">
        {title}
      </h2>
      {sub ? <p className="max-w-[65ch] text-body text-text-muted">{sub}</p> : null}
    </div>
  );
}
