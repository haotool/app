import { Mail, MessageCircleMore } from 'lucide-react';
import { AUTHOR_CONTACT_LINKS } from '../config/app-info';

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
    container: 'border-border/60 bg-surface/80',
    title: 'text-text',
    description: 'text-text-muted',
    item: 'border-border/60 bg-surface-secondary/80 hover:border-primary/30 hover:bg-surface-secondary',
    icon: 'text-primary',
    label: 'text-text-muted',
    value: 'text-text',
  },
  brand: {
    container: 'border-white/15 bg-white/10',
    title: 'text-white/95',
    description: 'text-white/75',
    item: 'border-white/15 bg-black/15 hover:border-white/30 hover:bg-black/25',
    icon: 'text-white/80',
    label: 'text-white/60',
    value: 'text-white/95 group-hover:text-white',
  },
} as const;

export function SupportContactLinks({
  title,
  description,
  className = '',
  tone = 'surface',
}: SupportContactLinksProps) {
  const styles = TONE_STYLES[tone];

  return (
    <section
      className={`pointer-events-none rounded-2xl border p-4 text-left backdrop-blur-sm ${styles.container} ${className}`.trim()}
      aria-label="Support contact links"
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
              className={`pointer-events-auto group flex items-center justify-between gap-3 rounded-xl border px-3 py-2 transition-colors duration-200 ${styles.item}`}
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
