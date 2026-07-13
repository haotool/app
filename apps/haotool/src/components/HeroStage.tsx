import { useEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { TOOLS, getToolIconUrl, type Tool } from '../config/tools';
import { screenshotSources } from './screenshot-sources';

// 舞台卡順序 SSOT（deep-dive §3.1 表）：HaoRate C 位 → 喵喵分帳 → ParkKeeper → NihonName → 地震小學堂。
const STAGE_TOOL_IDS = [
  'ratewise',
  'split-meow',
  'park-keeper',
  'nihonname',
  'quake-school',
] as const;

function StageCard({ tool, index }: { tool: Tool; index: number }) {
  const [failed, setFailed] = useState(false);

  const handleError = (_event: SyntheticEvent<HTMLImageElement>) => {
    setFailed(true);
  };

  return (
    <div className={`stage-card stage-card-${index + 1}`}>
      <div className="stage-float">
        <div className="stage-para">
          <div className="stage-frame">
            {failed ? (
              // 缺檔佔位卡：--color-primary-bg 底 + 工具 icon（不得 broken image）。
              <div className="stage-placeholder flex items-center justify-center bg-primary-bg">
                <img
                  src={getToolIconUrl(tool)}
                  alt=""
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
                  alt=""
                  width={390}
                  height={844}
                  loading="lazy"
                  fetchPriority="low"
                  decoding="async"
                  draggable={false}
                  onError={handleError}
                />
              </picture>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hero 工具卡疊層舞台（deep-dive §3）。
 * 桌面（≥1024 + fine pointer + 非 reduced-motion）：5 卡浮動 + 指標視差；
 * 行動/平板：3 卡完全靜態（卡 4/5 display:none，lazy 圖不觸發載入）。
 * 純裝飾（aria-hidden）；五工具入口以工具展示區卡格為準。
 */
export default function HeroStage() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    if (typeof window.matchMedia !== 'function') return undefined;

    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1024px)');
    if (!finePointer.matches || reducedMotion.matches || !desktop.matches) return undefined;

    // 視差監聽掛在 hero 區（stage 的外層 section），rAF 節流寫入 --px/--py（-1..1）。
    const hero = stage.closest('section') ?? stage;
    let frame = 0;
    let nextX = 0;
    let nextY = 0;

    const flush = () => {
      frame = 0;
      stage.style.setProperty('--px', String(nextX));
      stage.style.setProperty('--py', String(nextY));
    };

    const handleMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      nextX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
      nextY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const handleLeave = () => {
      nextX = 0;
      nextY = 0;
      if (!frame) frame = requestAnimationFrame(flush);
    };

    hero.addEventListener('pointermove', handleMove as EventListener, { passive: true });
    hero.addEventListener('pointerleave', handleLeave, { passive: true });
    return () => {
      hero.removeEventListener('pointermove', handleMove as EventListener);
      hero.removeEventListener('pointerleave', handleLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const stageTools = STAGE_TOOL_IDS.map((id) => TOOLS.find((tool) => tool.id === id)).filter(
    (tool): tool is Tool => tool !== undefined,
  );

  return (
    <div ref={stageRef} className="hero-stage" aria-hidden="true" data-testid="hero-stage">
      {stageTools.map((tool, index) => (
        <StageCard key={tool.id} tool={tool} index={index} />
      ))}
    </div>
  );
}
