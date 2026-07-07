/**
 * 內容頁 section renderer（E4）
 *
 * 內容驅動渲染：頁面把文案整理為 sections 設定，由此統一輸出卡片版面，
 * 收斂七頁重複 JSX。僅涵蓋實際出現的型別（text／list／faq／links／cards），
 * 頁面專屬結構（API 表格、技術清單等）維持頁內元件，不過度抽象。
 * @see .claude/prds/ratewise-e4-internal-pages-design.md
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ExternalLink } from 'lucide-react';

export interface ContentListItem {
  /** 條目前置粗體詞（如「資料來源：」）。 */
  term?: ReactNode;
  description: ReactNode;
}

export interface ContentFaqItem {
  question: string;
  answer: ReactNode;
  /** per-question 錨點 id（供 TOC 側跳與分享深連結）。 */
  id?: string;
}

export interface ContentLinkItem {
  label: string;
  sub?: string;
  href: string;
  external?: boolean;
}

export interface ContentCardItem {
  title: string;
  description: ReactNode;
}

export type ContentSection = (
  | { kind: 'text'; title: string; paragraphs: readonly ReactNode[] }
  | { kind: 'list'; title: string; items: readonly ContentListItem[] }
  | { kind: 'faq'; title?: string; items: readonly ContentFaqItem[] }
  | { kind: 'links'; title: string; links: readonly ContentLinkItem[] }
  | { kind: 'cards'; title: string; cards: readonly ContentCardItem[] }
) & {
  /** 頁內錨點（供長文頁目錄側跳）。 */
  id?: string;
};

/** 內容頁標準頁首：h1＋導言＋meta 列（作者／更新時間等）。 */
export function ContentPageHeader({
  title,
  lead,
  meta,
}: {
  title: ReactNode;
  lead?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold leading-tight text-text">{title}</h1>
      {lead && <p className="mt-2 text-base leading-relaxed text-text-muted">{lead}</p>}
      {meta && <p className="mt-2 text-xs text-text-muted">{meta}</p>}
    </header>
  );
}

/** 標準 section 卡片殼：E1 卡片圓角＋hairline＋rest 陰影。 */
export function ContentSectionCard({
  title,
  children,
  id,
}: {
  title?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="rounded-card border border-border/60 bg-surface shadow-card p-5 scroll-mt-[calc(1rem+env(safe-area-inset-top,0px))]"
    >
      {title && <h2 className="mb-4 text-xl font-bold leading-tight text-text">{title}</h2>}
      {children}
    </section>
  );
}

/** FAQ 手風琴（原生 details；chevron 隨開合旋轉）。 */
export function ContentFaqAccordion({ items }: { items: readonly ContentFaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          id={item.id}
          className="group rounded-card border border-border/60 bg-surface shadow-card scroll-mt-[calc(1rem+env(safe-area-inset-top,0px))]"
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
            <h3 className="text-base font-semibold leading-normal text-text">{item.question}</h3>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-text-muted transition-transform duration-200 group-open:rotate-90"
              aria-hidden="true"
            />
          </summary>
          <div className="border-t border-border/60 px-5 pb-5 pt-4 text-base leading-relaxed text-text-muted">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}

/** 連結卡列（站內 Link／站外 a，44px 熱區）。 */
function ContentLinkRow({ link }: { link: ContentLinkItem }) {
  const className =
    'group flex min-h-11 items-center justify-between gap-3 rounded-control px-4 py-3 transition-colors hover:bg-primary/5';
  const body = (
    <>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-text group-hover:text-primary-on-surface">
          {link.label}
        </span>
        {link.sub && (
          <span className="mt-0.5 block break-all text-xs text-text-muted">{link.sub}</span>
        )}
      </span>
      {link.external ? (
        <ExternalLink className="h-4 w-4 shrink-0 text-text-muted opacity-60" aria-hidden="true" />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-text-muted opacity-60" aria-hidden="true" />
      )}
    </>
  );

  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {body}
      </a>
    );
  }
  return (
    <Link to={link.href} className={className}>
      {body}
    </Link>
  );
}

function renderSection(section: ContentSection) {
  switch (section.kind) {
    case 'text':
      return (
        <ContentSectionCard title={section.title} id={section.id}>
          <div className="space-y-4">
            {section.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-base leading-relaxed text-text-muted">
                {paragraph}
              </p>
            ))}
          </div>
        </ContentSectionCard>
      );
    case 'list':
      return (
        <ContentSectionCard title={section.title} id={section.id}>
          <ul className="space-y-3">
            {section.items.map((item, index) => (
              <li key={index} className="text-base leading-relaxed text-text-muted">
                {item.term && <strong className="font-semibold text-text">{item.term}</strong>}
                {item.description}
              </li>
            ))}
          </ul>
        </ContentSectionCard>
      );
    case 'faq':
      return (
        <section id={section.id} className="scroll-mt-[calc(1rem+env(safe-area-inset-top,0px))]">
          {section.title && (
            <h2 className="mb-4 text-xl font-bold leading-tight text-text">{section.title}</h2>
          )}
          <ContentFaqAccordion items={section.items} />
        </section>
      );
    case 'links':
      return (
        <ContentSectionCard title={section.title} id={section.id}>
          <div className="divide-y divide-border/40">
            {section.links.map((link) => (
              <ContentLinkRow key={`${link.href}::${link.label}`} link={link} />
            ))}
          </div>
        </ContentSectionCard>
      );
    case 'cards':
      return (
        <ContentSectionCard title={section.title} id={section.id}>
          <div className="grid gap-3 sm:grid-cols-2">
            {section.cards.map((card) => (
              <div
                key={card.title}
                className="rounded-panel border border-border/60 bg-surface-elevated p-4"
              >
                <h3 className="mb-1.5 text-base font-semibold text-primary-on-surface">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">{card.description}</p>
              </div>
            ))}
          </div>
        </ContentSectionCard>
      );
    default: {
      const exhaustive: never = section;
      return exhaustive;
    }
  }
}

/** 依 sections 設定依序渲染；區塊間距採 24px 級。 */
export function ContentSections({ sections }: { sections: readonly ContentSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section, index) => (
        <div key={'title' in section && section.title ? String(section.title) : index}>
          {renderSection(section)}
        </div>
      ))}
    </div>
  );
}
