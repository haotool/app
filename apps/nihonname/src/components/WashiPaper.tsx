/**
 * WashiPaper Component
 * 和紙（Washi）質感組件 - 日本傳統紙張效果
 *
 * 技術實現：
 * 1. 底色：米白色 #fcfaf7（溫暖的和紙底色）
 * 2. 紋理：transparenttextures.com 的 rice-paper 噪點圖層
 * 3. 圖案：SVG Pattern（青海波 Seigaiha、麻葉 Asanoha）
 * 4. 陰影：shadow-2xl 製造紙張浮起的立體感
 * 5. 邊框：極細 ring-1 ring-black/5 增加精緻度
 *
 * 使用範例：
 * <WashiPaper>內容</WashiPaper>
 * <WashiCard variant="traditional" corners watermark={<KamonIcon />}>卡片內容</WashiCard>
 */

import type { ReactNode } from 'react';

// ============================================
// SVG Pattern Components
// ============================================

/**
 * 青海波紋樣（Seigaiha Pattern）
 * 日本傳統波浪圖案，象徵無盡的和平與寧靜
 */
export const SeigaihaPattern = ({
  className,
  opacity = 0.1,
  patternId = 'seigaiha',
}: {
  className?: string;
  opacity?: number;
  patternId?: string;
}) => (
  <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id={patternId} width="40" height="20" patternUnits="userSpaceOnUse">
        <path
          d="M0,10 A10,10 0 0,1 20,10 A10,10 0 0,1 40,10 M20,10 A10,10 0 0,1 30,0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity={opacity}
        />
        <path
          d="M0,20 A20,20 0 0,1 40,20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity={opacity}
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${patternId})`} />
  </svg>
);

/**
 * 麻葉紋樣（Asanoha Pattern）
 * 六角形幾何圖案，象徵成長與繁榮
 */
export const AsanohaPattern = ({
  className,
  opacity = 0.1,
  patternId = 'asanoha',
}: {
  className?: string;
  opacity?: number;
  patternId?: string;
}) => (
  <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern
        id={patternId}
        width="60"
        height="34.6"
        patternUnits="userSpaceOnUse"
        patternTransform="scale(1.5)"
      >
        <path
          d="M30,0 L60,17.3 L30,34.6 L0,17.3 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity={opacity}
        />
        <path
          d="M30,17.3 L0,0 M30,17.3 L60,0 M30,17.3 L30,34.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity={opacity}
        />
        <path
          d="M0,17.3 L60,17.3"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity={opacity}
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${patternId})`} />
  </svg>
);

// ============================================
// Texture URLs (transparenttextures.com)
// ============================================

const TEXTURE_URLS = {
  'rice-paper': 'https://www.transparenttextures.com/patterns/rice-paper.png',
  'rice-paper-2': 'https://www.transparenttextures.com/patterns/rice-paper-2.png',
  'rice-paper-light': 'https://www.transparenttextures.com/patterns/rice-paper-light.png',
  'textured-paper': 'https://www.transparenttextures.com/patterns/textured-paper.png',
  washi: 'https://www.transparenttextures.com/patterns/washi.png',
} as const;

type TextureType = keyof typeof TEXTURE_URLS;
type PatternType = 'seigaiha' | 'asanoha' | 'none';

// ============================================
// WashiPaper Base Component
// ============================================

interface WashiPaperProps {
  children: ReactNode;
  className?: string;
  texture?: TextureType;
  pattern?: PatternType;
  patternOpacity?: number;
}

/**
 * WashiPaper - 基礎和紙質感組件
 * 提供米白色底 + rice-paper 紋理 + 可選 SVG 圖案
 */
export function WashiPaper({
  children,
  className = '',
  texture = 'rice-paper-2',
  pattern = 'none',
  patternOpacity = 0.05,
}: WashiPaperProps) {
  const textureUrl = TEXTURE_URLS[texture];

  return (
    <div
      className={`
        relative
        bg-[#fcfaf7]
        bg-[url('${textureUrl}')]
        shadow-2xl
        rounded-sm
        ring-1 ring-black/5
        ${className}
      `.trim()}
    >
      {/* SVG Pattern Overlay */}
      {pattern !== 'none' && (
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
          {pattern === 'seigaiha' && <SeigaihaPattern opacity={patternOpacity} />}
          {pattern === 'asanoha' && <AsanohaPattern opacity={patternOpacity} />}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ============================================
// WashiCard Variants
// ============================================

type CardVariant = 'traditional' | 'modern' | 'minimal';

interface WashiCardProps extends WashiPaperProps {
  variant?: CardVariant;
  corners?: boolean;
  watermark?: ReactNode;
}

/**
 * WashiCard - 預設樣式的和紙卡片
 * 包含邊框、角落裝飾、浮水印等進階功能
 */
export function WashiCard({
  children,
  className = '',
  texture = 'rice-paper-2',
  pattern = 'seigaiha',
  patternOpacity = 0.05,
  variant = 'traditional',
  corners = false,
  watermark,
}: WashiCardProps) {
  // 根據 variant 決定邊框樣式
  const borderClasses = {
    traditional: 'border-8 border-double border-stone-200',
    modern: 'border border-stone-200',
    minimal: 'border border-stone-100',
  };

  return (
    <WashiPaper
      texture={texture}
      pattern={pattern}
      patternOpacity={patternOpacity}
      className={`
        ${borderClasses[variant]}
        p-6 md:p-10
        overflow-hidden
        ${className}
      `.trim()}
    >
      {/* Corner Decorations */}
      {corners && (
        <>
          <div className="absolute top-4 left-4 w-16 h-16 border-t border-l border-red-900/20" />
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b border-r border-red-900/20" />
        </>
      )}

      {/* Watermark */}
      {watermark && (
        <div className="absolute top-4 right-4 text-red-900/10 rotate-12">{watermark}</div>
      )}

      {/* Content */}
      {children}
    </WashiPaper>
  );
}

// ============================================
// Exports
// ============================================

export default WashiPaper;
