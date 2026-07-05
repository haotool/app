import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { getToolIconUrl, getToolUrl, type Tool } from '../config/tools';
import { screenshotSources } from './screenshot-sources';

interface ToolCardProps {
  tool: Tool;
  /** Tools 頁附加技術 chips 常駐列（FR-011）。 */
  showChips?: boolean;
  /** Home 區塊內為 h3；Tools 頁首層卡格為 h2。 */
  headingLevel?: 'h2' | 'h3';
}

/**
 * 工具卡（deep-dive §4.1）：整卡單一 <a>，icon 列 → 標題 → 描述 →（chips）→ 底列 → 截圖窗。
 * hover：border 品牌藍 + 箭頭右移 4px（無位移、無縮放、無陰影）；active scale 0.99。
 */
export default function ToolCard({ tool, showChips = false, headingLevel = 'h3' }: ToolCardProps) {
  const Heading = headingLevel;
  const [screenshotFailed, setScreenshotFailed] = useState(false);

  return (
    <a
      href={getToolUrl(tool)}
      className="press press-scale focus-ring group flex h-full cursor-pointer flex-col overflow-hidden rounded-card border border-border bg-surface px-6 pt-6 [--press-scale:0.99] hover:border-primary"
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
          {screenshotFailed ? (
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
                className="w-full rounded-t-[24px] object-cover object-top"
                onError={() => setScreenshotFailed(true)}
              />
            </picture>
          )}
        </div>
      </div>
    </a>
  );
}
