import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { getToolIconUrl, getToolUrl, type Tool } from '../config/tools';
import { useTilt } from './interactions';
import { screenshotSources } from './screenshot-sources';
import StickerBadge from './StickerBadge';

interface ToolCardProps {
  tool: Tool;
  /** Tools 頁附加技術 chips 常駐列（FR-011）。 */
  showChips?: boolean;
  /** Home 區塊內為 h3；Tools 頁首層卡格為 h2。 */
  headingLevel?: 'h2' | 'h3';
  /**
   * A1 bento 版式（mobile-beauty §2.3）：default = Tools 頁現行卡（零變更）。
   * mini 與 row 共用同一 DOM——SSG 單一 DOM 由 CSS 斷點承載兩版式
   * （<1024 直排精簡、≥1024 桌面橫排 sm/wide）。
   */
  variant?: 'default' | 'feature' | 'mini' | 'row';
  /** feature 數據帶 slot：內容由呼叫端傳入，工具專屬知識不進 ToolCard SSOT。 */
  extra?: ReactNode;
}

/**
 * 工具卡（deep-dive §4.1＋mobile-beauty §2.2）：整卡單一 <a>，icon 列 → 標題 → 描述 →
 * （chips／數據帶）→ 底列 → 截圖窗。
 * hover：border 品牌藍 + 箭頭右移 4px（hover 無版面位移、無陰影）；active scale 0.99。
 * S5-c（M3 核准）：desktop fine-pointer 加 pointer tilt ≤4deg（tilt-scene 承載 perspective、
 * 卡片本體為 tilt-inner；行動/平板不掛監聽）。
 */
export default function ToolCard({
  tool,
  showChips = false,
  headingLevel = 'h3',
  variant = 'default',
  extra,
}: ToolCardProps) {
  const Heading = headingLevel;
  const [screenshotFailed, setScreenshotFailed] = useState(false);
  const tiltRef = useTilt<HTMLDivElement>();

  // A3 morph（mobile-beauty §4.2，N4）：靜態 view-transition-name = tool-<id>，
  // 兩頁同名自動配對；名稱宣告集中於 CSS .tool-vt（reduced-motion 一鍵歸零）。
  const rootClass = 'tilt-scene tool-vt h-full';
  const vtStyle = { '--vt-name': `tool-${tool.id}` } as CSSProperties;

  // 截圖窗共用內容（radius 由各版式 frame 承載；default 維持現行 inline 值）。
  const screenshot = (imgClassName: string) =>
    screenshotFailed ? (
      <div className="flex aspect-[390/500] items-start justify-center bg-primary-bg pt-10">
        <img
          src={getToolIconUrl(tool)}
          alt={`${tool.name} 介面截圖`}
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          className="size-12 rounded-icon"
        />
      </div>
    ) : (
      <picture>
        <source type="image/avif" srcSet={screenshotSources(tool.id).avif} />
        <img
          src={screenshotSources(tool.id).webp}
          alt={`${tool.name} 介面截圖`}
          width={390}
          height={844}
          loading="lazy"
          fetchPriority="low"
          decoding="async"
          className={imgClassName}
          onError={() => setScreenshotFailed(true)}
        />
      </picture>
    );

  if (variant === 'feature') {
    return (
      <div ref={tiltRef} className={rootClass} style={vtStyle}>
        <a
          href={getToolUrl(tool)}
          className="tilt-inner press press-scale focus-ring group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-card border border-border bg-surface px-5 pt-5 [--press-scale:0.99] hover:border-primary md:px-6 md:pt-6 lg:flex-row lg:gap-6"
        >
          {/* A6 Live 角標貼紙（全站第 3 枚；mini/sm/wide 維持行內圓點不掛貼紙）。 */}
          <StickerBadge variant="live" withDot className="absolute right-4 top-4">
            Live
          </StickerBadge>
          <div className="flex min-w-0 flex-1 flex-col lg:pb-6">
            <span className="inline-flex size-10 items-center justify-center self-start rounded-icon bg-primary-bg">
              <img
                src={getToolIconUrl(tool)}
                alt=""
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
                className="size-10 rounded-icon"
                onError={(event) => {
                  event.currentTarget.style.visibility = 'hidden';
                }}
              />
            </span>
            <Heading className="mt-4 text-[19px] font-bold leading-[1.4] text-text">
              {tool.name}
            </Heading>
            <p className="mt-1.5 text-body-sm text-text-muted line-clamp-2">{tool.description}</p>
            {extra}
            <div className="mt-auto hidden pt-4 lg:flex">
              <span className="inline-flex items-center gap-1 text-[15px] font-semibold text-primary-strong">
                開啟
                <ArrowRight
                  className="size-4 ease-out-quart motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </div>
          </div>
          <div className="bento-feature-shot">
            <div className="bento-feature-frame">
              {screenshot('w-full object-cover object-top')}
            </div>
          </div>
        </a>
      </div>
    );
  }

  if (variant === 'mini' || variant === 'row') {
    return (
      <div ref={tiltRef} className={rootClass} style={vtStyle}>
        <a
          href={getToolUrl(tool)}
          className="tilt-inner press press-scale focus-ring group flex h-full cursor-pointer flex-col overflow-hidden rounded-card border border-border bg-surface px-4 pt-4 [--press-scale:0.99] hover:border-primary lg:flex-row lg:gap-4 lg:px-5 lg:pt-5"
        >
          <div className="flex min-w-0 flex-1 flex-col lg:pb-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex size-9 items-center justify-center rounded-icon bg-primary-bg lg:size-10">
                <img
                  src={getToolIconUrl(tool)}
                  alt=""
                  width={36}
                  height={36}
                  loading="lazy"
                  decoding="async"
                  className="size-9 rounded-icon lg:size-10"
                  onError={(event) => {
                    event.currentTarget.style.visibility = 'hidden';
                  }}
                />
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success" aria-hidden="true" />
                <span className="hidden text-caption text-text-muted lg:inline">Live</span>
              </span>
            </div>
            <Heading className="mt-3 text-[15px] font-bold leading-[1.4] text-text line-clamp-2 lg:text-h3">
              {tool.name}
            </Heading>
            {/* N3：描述與分類 <768px 隱藏（DOM 完整輸出，CSS @media 承載）。 */}
            <p className="mt-1.5 hidden text-body-sm text-text-muted md:line-clamp-2 lg:line-clamp-1">
              {tool.description}
            </p>
            <div className="mt-auto hidden items-center justify-between pt-4 lg:flex">
              <span className="text-caption text-text-muted">{tool.category}</span>
              <span className="inline-flex items-center gap-1 text-[15px] font-semibold text-primary-strong">
                開啟
                <ArrowRight
                  className="size-4 ease-out-quart motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </div>
          </div>
          <div className="bento-mini-shot">
            <div className="bento-mini-frame">{screenshot('w-full object-cover object-top')}</div>
          </div>
        </a>
      </div>
    );
  }

  return (
    <div ref={tiltRef} className={rootClass} style={vtStyle}>
      <a
        href={getToolUrl(tool)}
        className="tilt-inner press press-scale focus-ring group flex h-full cursor-pointer flex-col overflow-hidden rounded-card border border-border bg-surface px-6 pt-6 [--press-scale:0.99] hover:border-primary"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex size-10 items-center justify-center rounded-icon bg-primary-bg">
            <img
              src={getToolIconUrl(tool)}
              alt=""
              width={40}
              height={40}
              loading="lazy"
              decoding="async"
              className="size-10 rounded-icon"
              onError={(event) => {
                event.currentTarget.style.visibility = 'hidden';
              }}
            />
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            <span className="text-caption text-text-muted">Live</span>
          </span>
        </div>

        <Heading className="mt-4 text-h3 text-text">{tool.name}</Heading>

        <p className="mt-1.5 min-h-12 text-body-sm text-text-muted line-clamp-2">
          {tool.description}
        </p>

        {showChips ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {tool.techChips.slice(0, 3).map((chip) => (
              <li
                key={chip}
                className="rounded-chip bg-surface-sunken px-2.5 py-[3px] text-caption text-text-muted"
              >
                {chip}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-caption text-text-muted">{tool.category}</span>
          <span className="inline-flex items-center gap-1 text-[15px] font-semibold text-primary-strong">
            開啟
            <ArrowRight
              className="size-4 ease-out-quart motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>

        <div className="mt-5 aspect-[16/10] overflow-hidden">
          <div className="mx-auto w-[62%] overflow-hidden rounded-t-[28px] border-4 border-b-0 border-text bg-surface">
            {screenshot('w-full rounded-t-[24px] object-cover object-top')}
          </div>
        </div>
      </a>
    </div>
  );
}
