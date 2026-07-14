import { type LucideIcon } from 'lucide-react';

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function PlaceholderPage({ icon: Icon, title, description }: PlaceholderPageProps) {
  return (
    <section className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 p-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-card bg-surface-2 text-text-3">
        <Icon size={28} strokeWidth={1.6} aria-hidden />
      </span>
      <h1 className="text-price-lg font-semibold">{title}</h1>
      <p className="max-w-xs text-label text-text-2">{description}</p>
    </section>
  );
}
