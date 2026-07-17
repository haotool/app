/**
 * BrandLogo – Original "P" letter designs
 * 自 pages/Home.tsx 純搬移抽出（issue #711 S0），行為零變更。
 */
import type { ThemeConfig } from '@app/park-keeper/types';

export default function BrandLogo({ theme }: { theme: ThemeConfig }) {
  const colors = theme.colors;

  switch (theme.id) {
    case 'racing':
      return (
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="w-8 h-8 drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]">
            <defs>
              <linearGradient id="nitroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.primary} />
                <stop offset="100%" stopColor={colors.secondary} />
              </linearGradient>
            </defs>
            <path
              d="M 8 32 L 14 8 L 32 8 L 28 20 L 16 20 L 13 32 Z"
              fill="none"
              stroke="url(#nitroGrad)"
              strokeWidth="3"
              strokeLinecap="square"
            />
            <path d="M 32 8 L 36 8" stroke={colors.accent} strokeWidth="3" />
            <circle cx="22" cy="14" r="2" fill={colors.accent} />
          </svg>
        </div>
      );
    case 'cute':
      return (
        <div className="flex items-center justify-center">
          <svg
            viewBox="0 0 40 40"
            className="w-10 h-10 transform hover:scale-110 transition-transform duration-300"
          >
            <defs>
              <linearGradient id="cuteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.primary} />
                <stop offset="100%" stopColor={colors.secondary} />
              </linearGradient>
            </defs>
            <path
              d="M 12 32 L 12 14 C 12 6 30 6 30 15 C 30 24 12 24 12 24"
              stroke="url(#cuteGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M 12 14 C 12 9 24 9 24 15"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
            <path
              d="M 34 32 L 30 36 L 26 32 C 25 31 25 29 26 28 C 27 27 29 27 30 28 L 30 28 L 31 28 C 32 27 34 27 35 28 C 36 29 36 31 35 32 Z"
              fill={colors.accent}
              stroke={colors.primary}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    case 'literary':
      return (
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="w-8 h-8">
            <path
              d="M 12 32 L 12 10 C 12 8 13 6 18 6 L 24 6 C 30 6 32 10 32 15 C 32 20 28 23 24 23 L 14 23"
              stroke={colors.primary}
              strokeWidth="2.5"
              fill="none"
            />
            <path d="M 12 32 L 8 32 M 12 32 L 16 32" stroke={colors.primary} strokeWidth="2.5" />
            <path d="M 10 8 L 8 8" stroke={colors.primary} strokeWidth="2.5" />
            <path d="M 22 11 L 22 17" stroke={colors.accent} strokeWidth="2" opacity="0.6" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="w-8 h-8">
            <rect
              x="6"
              y="6"
              width="28"
              height="28"
              rx="8"
              stroke={colors.primary}
              strokeWidth="2.5"
              fill="none"
            />
            <path
              d="M 15 28 L 15 12 L 22 12 C 25 12 26 13 26 16 C 26 19 25 20 22 20 L 15 20"
              stroke={colors.primary}
              strokeWidth="2.5"
              fill="none"
            />
            <circle cx="28" cy="28" r="4" fill={colors.accent} />
          </svg>
        </div>
      );
  }
}
