import { Mail, MessageCircleMore } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AUTHOR_CONTACT_LINKS } from '../config/app-info';
import { contentPageTokens } from '../config/design-tokens';

interface SupportContactLinksProps {
  title?: string;
  description?: string;
  className?: string;
  tone?: 'surface' | 'brand';
}

const ICONS = {
  threads: MessageCircleMore,
  email: Mail,
} as const;

const TONE_STYLES = {
  surface: {
    container: 'border-border/70 bg-surface-elevated/90',
    title: 'text-text',
    description: 'text-text-muted',
    item: contentPageTokens.links.row,
    icon: 'text-primary',
    label: 'text-text-muted',
    value: 'text-text',
  },
  brand: {
    container: 'border-border/70 bg-surface/95',
    title: 'text-text',
    description: 'text-text-muted',
    item: contentPageTokens.links.row,
    icon: 'text-primary',
    label: 'text-text-muted',
    value: 'text-text group-hover:text-primary',
  },
} as const;

export function SupportContactLinks({
  title,
  description,
  className = '',
  tone = 'surface',
}: SupportContactLinksProps) {
  const { t } = useTranslation();
  const styles = TONE_STYLES[tone];

  return (
    <section
      className={`pointer-events-none rounded-control border p-4 text-left ${styles.container} ${className}`.trim()}
      aria-label={t('support.contactLinksAriaLabel')}
    >
      {title ? <p className={`text-sm font-semibold ${styles.title}`}>{title}</p> : null}
      {description ? (
        <p className={`mt-1 text-xs leading-relaxed ${styles.description}`}>{description}</p>
      ) : null}

      <div className="mt-3 flex flex-col gap-2">
        {AUTHOR_CONTACT_LINKS.map((link) => {
          const Icon = ICONS[link.id];

          return (
            <a
              key={link.id}
              href={link.href}
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={`pointer-events-auto ${styles.item}`}
              aria-label={link.label}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon className={`h-4 w-4 flex-shrink-0 ${styles.icon}`} aria-hidden="true" />
                <span className={`text-xs font-medium uppercase tracking-[0.18em] ${styles.label}`}>
                  {link.label}
                </span>
              </span>
              <span className={`truncate text-sm font-medium ${styles.value}`}>{link.value}</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
