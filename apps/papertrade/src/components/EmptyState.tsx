import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  // sm：sheet 內嵌輕量變體，不畫卡片外框。
  size?: 'md' | 'sm';
}

const SIZE_STYLES = {
  md: 'gap-2 rounded-card border border-border bg-surface px-4 py-8',
  sm: 'gap-1.5 px-4 py-6',
} as const;

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center text-center', SIZE_STYLES[size], className)}>
      <Icon size={26} className="text-text-3" aria-hidden />
      <p className="text-label text-text-2">{title}</p>
      {description !== undefined && <p className="text-caption text-text-3">{description}</p>}
      {action}
    </div>
  );
}
