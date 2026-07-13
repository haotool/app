import type { ReactNode } from 'react';

type StickerVariant = 'primary' | 'ink' | 'live';

const VARIANT_CLASS: Record<StickerVariant, string> = {
  primary: 'sticker-primary text-overline uppercase text-primary-strong',
  ink: 'sticker-ink text-overline uppercase text-text',
  live: 'sticker-live text-caption text-text-muted',
};

interface StickerBadgeProps {
  variant: StickerVariant;
  /** 前置 8px success 圓點（gap 8px 由 .sticker 承載）。 */
  withDot?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * A6 貼紙徽章家族（mobile-beauty §5.2）：純色底＋1px 框＋靜態旋轉（−2°／+1.5°／+2°）。
 * 旋轉為恆常個性（非動畫、無 hover 回正）；禁撕邊/濾鏡；全站數量紀律 ≤3 枚。
 */
export default function StickerBadge({
  variant,
  withDot = false,
  className,
  children,
}: StickerBadgeProps) {
  return (
    <span className={`sticker ${VARIANT_CLASS[variant]}${className ? ` ${className}` : ''}`}>
      {withDot ? <span className="size-2 rounded-full bg-success" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
