/**
 * GlassCard - Glassmorphism card component
 *
 * A reusable card component implementing Apple's Liquid Glass design language.
 * Uses CSS custom properties from the design token system for consistent styling.
 *
 * @see https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass
 * @module components/ui/GlassCard
 */

import type { ReactNode, CSSProperties } from 'react';

type GlassVariant = 'base' | 'elevated' | 'overlay' | 'subtle';
type GlassPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface GlassCardProps {
  children: ReactNode;
  /** Glass effect intensity level */
  variant?: GlassVariant;
  /** Internal padding size */
  padding?: GlassPadding;
  /** Enable glow effect */
  glow?: boolean;
  /** Enable hover interactions */
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  'aria-label'?: string;
}

const variantStyles: Record<GlassVariant, CSSProperties> = {
  base: {
    background: 'var(--glass-surface-base)',
    backdropFilter: 'blur(var(--glass-blur-md, 16px))',
    WebkitBackdropFilter: 'blur(var(--glass-blur-md, 16px))',
    border: '1px solid var(--glass-border-light)',
  },
  elevated: {
    background: 'var(--glass-surface-elevated)',
    backdropFilter: 'blur(var(--glass-blur-lg, 24px))',
    WebkitBackdropFilter: 'blur(var(--glass-blur-lg, 24px))',
    border: '1px solid var(--glass-border-medium)',
    boxShadow: 'var(--shadow-lg)',
  },
  overlay: {
    background: 'var(--glass-surface-overlay)',
    backdropFilter: 'blur(var(--glass-blur-xl, 32px))',
    WebkitBackdropFilter: 'blur(var(--glass-blur-xl, 32px))',
    border: '1px solid var(--glass-border-strong)',
    boxShadow: 'var(--shadow-xl)',
  },
  subtle: {
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(var(--glass-blur-sm, 8px))',
    WebkitBackdropFilter: 'blur(var(--glass-blur-sm, 8px))',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
};

const paddingStyles: Record<GlassPadding, string> = {
  none: '0',
  sm: 'var(--spacing-2, 8px)',
  md: 'var(--spacing-4, 16px)',
  lg: 'var(--spacing-6, 24px)',
  xl: 'var(--spacing-8, 32px)',
};

export function GlassCard({
  children,
  variant = 'base',
  padding = 'md',
  glow = false,
  interactive = false,
  className = '',
  style,
  onClick,
  'aria-label': ariaLabel,
}: GlassCardProps) {
  const variantStyle = variantStyles[variant];
  const baseStyles: CSSProperties = {
    ...variantStyle,
    padding: paddingStyles[padding],
    borderRadius: 'var(--radius-xl, 16px)',
    transition: 'all var(--duration-normal, 200ms) var(--easing-ease-out)',
    ...(glow && {
      boxShadow: [variantStyle.boxShadow, 'var(--glass-shadow-glow)'].filter(Boolean).join(', '),
    }),
    ...style,
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={`glass-card ${interactive ? 'glass-card--interactive' : ''} ${className}`}
      style={baseStyles}
      onClick={onClick}
      aria-label={ariaLabel}
      type={onClick ? 'button' : undefined}
    >
      {children}
    </Component>
  );
}

interface GlassCardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function GlassCardHeader({ title, subtitle, action }: GlassCardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3
          style={{
            fontSize: 'var(--font-size-base, 16px)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              fontSize: 'var(--font-size-xs, 14px)',
              color: 'var(--color-text-tertiary)',
              margin: '2px 0 0 0',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface GlassCardBodyProps {
  children: ReactNode;
  className?: string;
}

export function GlassCardBody({ children, className = '' }: GlassCardBodyProps) {
  return <div className={`glass-card__body ${className}`}>{children}</div>;
}

interface GlassCardFooterProps {
  children: ReactNode;
  className?: string;
}

export function GlassCardFooter({ children, className = '' }: GlassCardFooterProps) {
  return (
    <div
      className={`glass-card__footer ${className}`}
      style={{
        marginTop: 'var(--spacing-3, 12px)',
        paddingTop: 'var(--spacing-3, 12px)',
        borderTop: '1px solid var(--glass-border-light)',
      }}
    >
      {children}
    </div>
  );
}
