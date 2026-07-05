import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Button 四態 SSOT（design-deep-dive §4.2）：radius 16、字 17px、h 52px、focus ring 2px offset 2px。
const BUTTON_BASE =
  'press press-scale inline-flex h-[52px] items-center justify-center gap-2 rounded-btn px-8 text-[17px]';

export const BUTTON_VARIANT = {
  primary: `${BUTTON_BASE} focus-ring bg-primary font-bold text-white hover:bg-primary-strong disabled:pointer-events-none disabled:bg-disabled-bg disabled:text-disabled-text`,
  secondary: `${BUTTON_BASE} focus-ring border border-border bg-surface font-semibold text-text hover:border-primary hover:text-primary-strong disabled:pointer-events-none disabled:border-surface-sunken disabled:text-disabled-text`,
  banner: `${BUTTON_BASE} focus-ring-inverse bg-white font-bold text-primary-strong hover:bg-primary-bg disabled:pointer-events-none disabled:bg-white/60 disabled:text-disabled-text`,
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANT;

export function buttonClass(variant: ButtonVariant, className?: string): string {
  return className ? `${BUTTON_VARIANT[variant]} ${className}` : BUTTON_VARIANT[variant];
}

interface GhostLinkProps {
  children: ReactNode;
  to?: string;
  href?: string;
  external?: boolean;
  inverse?: boolean;
  className?: string;
}

/** ghost 文字連結（§4.2）：hover 箭頭右移 4px、active opacity 0.8；深藍底用白 focus ring（D1）。 */
export function GhostLink({
  children,
  to,
  href,
  external = false,
  inverse = false,
  className,
}: GhostLinkProps) {
  const classes = [
    'press group inline-flex h-11 items-center gap-1 text-[15px] font-semibold active:opacity-80',
    inverse ? 'focus-ring-inverse text-banner-sub' : 'focus-ring text-primary-strong',
    className ?? '',
  ]
    .join(' ')
    .trim();
  const arrow = (
    <ArrowRight
      className="size-4 ease-out-quart motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1"
      aria-hidden="true"
    />
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
        {arrow}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={classes}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
      {arrow}
    </a>
  );
}
