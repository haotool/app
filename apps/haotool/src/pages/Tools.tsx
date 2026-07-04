/**
 * 工具總覽佔位（語意結構完整版）
 * 分類 pill 以 aria-pressed 標記（FR-003 基礎）；切換動效由後續 wave 深化。
 */
import { useState } from 'react';
import { TOOLS, getActiveCategories, getToolUrl, type ToolCategory } from '../config/tools';

type CategoryFilter = ToolCategory | '全部';

export default function Tools() {
  const [category, setCategory] = useState<CategoryFilter>('全部');
  const categories: CategoryFilter[] = ['全部', ...getActiveCategories()];
  const visibleTools = category === '全部' ? TOOLS : TOOLS.filter((t) => t.category === category);

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-16 md:px-6">
      <h1 className="text-3xl font-extrabold">所有工具</h1>
      <p className="mt-3 max-w-prose text-text-muted">
        免費、開源、不收集個資——每一個工具都以產品級標準交付。
      </p>

      <div role="group" aria-label="分類篩選" className="mt-8 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={`h-11 rounded-full border px-5 text-sm font-medium ${
              category === item
                ? 'border-primary bg-primary-bg text-primary-strong'
                : 'border-border bg-surface text-text'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleTools.map((tool) => (
          <li key={tool.id}>
            <a
              href={getToolUrl(tool)}
              className="block h-full rounded-[20px] border border-border bg-surface p-6"
            >
              <h2 className="text-lg font-bold">{tool.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{tool.description}</p>
              <p className="mt-4 text-xs text-text-muted">
                {tool.category} · {tool.techChips.join(' / ')}
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-primary-strong">
                開啟 →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
