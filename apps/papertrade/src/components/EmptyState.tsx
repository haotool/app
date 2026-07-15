import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

// 空狀態統一版型：圖示＋一句話＋（選配）補述與 CTA。
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center gap-2 rounded-card border border-border bg-surface px-4 py-8 text-center',
        className,
      )}
    >
      <Icon size={26} className="text-text-3" aria-hidden />
      <p className="text-label text-text-2">{title}</p>
      {description !== undefined && <p className="text-caption text-text-3">{description}</p>}
      {action}
    </div>
  );
}
