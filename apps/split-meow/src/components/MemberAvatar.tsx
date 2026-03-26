import Avatar from 'boring-avatars';
import { cn } from '../lib/utils';

/** 可愛極簡配色盤 */
const PALETTE = ['#86EFAC', '#6EE7F7', '#FCA5A5', '#C4B5FD', '#FDE68A'];

interface MemberAvatarProps {
  /** avatarUrl（舊版 data URI / 路徑）或 boring-avatars seed 字串 */
  seed: string;
  alt?: string;
  size?: number;
  /** 額外 CSS class（如 grayscale、border-*、shadow-*、transition-* 等） */
  className?: string;
}

/**
 * 統一頭像元件。
 * - seed 為 `/`、`data:` 或 `http` 開頭時，向後相容以 <img> 顯示舊頭像。
 * - 其餘字串使用 boring-avatars beam 樣式離線生成。
 */
export function MemberAvatar({ seed, alt = '', size = 40, className }: MemberAvatarProps) {
  const isLegacy = seed.startsWith('/') || seed.startsWith('data:') || seed.startsWith('http');

  if (isLegacy) {
    return (
      <img
        src={seed}
        alt={alt}
        width={size}
        height={size}
        className={cn('rounded-full object-cover shrink-0', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={alt}
      className={cn('inline-flex rounded-full overflow-hidden shrink-0 select-none', className)}
      style={{ width: size, height: size }}
    >
      <Avatar size={size} name={seed} variant="beam" colors={PALETTE} />
    </span>
  );
}
