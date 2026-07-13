/**
 * 工具總覽（design-deep-dive §5.1）：頁首 → pill tabs → 卡格（chips 常駐）→ 尾 CTA。
 * 篩選僅隱藏不重排序（FR-003）；切換 150ms opacity 淡入、無位移。
 * pill 滑動指示器（motion-deep-dive §2 S5-d，M4）：CSS 變數方案，零 motion 依賴增量。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { TOOLS, getActiveCategories, type ToolCategory } from '../config/tools';
import { GhostLink } from '../components/Button';
import ToolCard from '../components/ToolCard';

type CategoryFilter = ToolCategory | '全部';

/** pill 顯示文案（brief §3.2：全部／工具／創意／教育）；篩選值仍為資料 SSOT 分類。 */
function pillLabel(category: CategoryFilter): string {
  return category === '全部' ? category : category.replace(/類$/, '');
}

export default function Tools() {
  const [category, setCategory] = useState<CategoryFilter>('全部');
  // SSG／JS 失效韌性：ready 前選中 pill 維持墨實底（視覺不依賴 JS 定位的指示器）。
  const [indicatorReady, setIndicatorReady] = useState(false);
  const categories: CategoryFilter[] = ['全部', ...getActiveCategories()];
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  // 讀取選中 pill 的 offsetLeft/offsetWidth 寫入 --pill-x/--pill-w（切換由 CSS 過渡滑動）。
  const syncIndicator = useCallback(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    if (!list || !indicator) return;
    const selected = list.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    if (!selected) return;
    indicator.style.setProperty('--pill-x', `${selected.offsetLeft}px`);
    indicator.style.setProperty('--pill-w', `${selected.offsetWidth}px`);
  }, []);

  useEffect(() => {
    syncIndicator();
  }, [category, syncIndicator]);

  useEffect(() => {
    // mount 首次定位無過渡（下一幀才標記 ready，避免 0 寬滑入）；resize 以 ResizeObserver 重算。
    const frame = requestAnimationFrame(() => {
      setIndicatorReady(true);
    });
    const list = listRef.current;
    const observer = new ResizeObserver(syncIndicator);
    if (list) observer.observe(list);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [syncIndicator]);

  return (
    <>
      <div className="bg-surface">
        <div className="shell pb-12 pt-16 md:pt-20">
          <h1 className="text-h1 text-text">所有工具</h1>
          <p className="mt-3 text-body text-text-muted">免費、開源、離線可用——挑一個開始。</p>

          <div
            ref={listRef}
            role="group"
            aria-label="分類篩選"
            className="scrollbar-hide relative -mx-5 mt-8 flex gap-2 overflow-x-auto px-5 md:-mx-6 md:px-6"
          >
            {categories.map((item) => {
              const selected = category === item;
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCategory(item)}
                  className={`press press-scale focus-ring pill-hit h-10 shrink-0 whitespace-nowrap rounded-chip px-[18px] text-sm ${
                    selected
                      ? `border border-transparent font-semibold text-white ${
                          indicatorReady ? 'bg-transparent' : 'bg-text'
                        }`
                      : 'border border-border bg-surface font-medium text-text-muted hover:border-border-strong hover:text-text'
                  }`}
                >
                  {pillLabel(item)}
                </button>
              );
            })}
            {/* 選中態視覺由指示器承載（墨實底 pill 滑動）；ready 後本體才轉透明底。 */}
            <span
              ref={indicatorRef}
              className="pill-indicator"
              data-ready={indicatorReady || undefined}
              aria-hidden="true"
            />
          </div>

          <ul
            key={category}
            className="fade-in mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:flex lg:flex-wrap lg:justify-center"
          >
            {TOOLS.map((tool) => {
              const hidden = category !== '全部' && tool.category !== category;
              return (
                <li
                  key={tool.id}
                  className={hidden ? 'hidden' : 'lg:w-[calc((100%-48px)/3)]'}
                  aria-hidden={hidden || undefined}
                >
                  <ToolCard tool={tool} showChips headingLevel="h2" />
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="bg-background">
        <div className="shell flex flex-col items-center gap-4 py-16 text-center">
          <h2 className="text-h2 text-text">沒找到你要的工具？</h2>
          <GhostLink to="/contact/">跟我說說你的需求</GhostLink>
        </div>
      </div>
    </>
  );
}
