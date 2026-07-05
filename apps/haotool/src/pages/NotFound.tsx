/**
 * 404（design-deep-dive §5.4）：大數字 + 品牌一句 + 回首頁 + 5 工具導流；noindex 由 SEO 模組處理。
 */
import { Link } from 'react-router-dom';
import { buttonClass } from '../components/Button';
import { TOOLS, getToolUrl } from '../config/tools';

export default function NotFound() {
  return (
    <div className="bg-surface">
      <div className="shell flex min-h-[calc(100svh-64px)] flex-col items-center justify-center py-16 text-center">
        <div className="max-w-[560px]">
          <p className="text-404 tabular-nums text-text" aria-hidden="true">
            404
          </p>
          <h1 className="mt-4 text-h2 text-text">這頁不存在，但工具都在。</h1>
          <p className="mt-3 text-body text-text-muted">網址可能打錯了，或這個頁面已經搬家。</p>
          <p className="mt-8">
            <Link to="/" viewTransition className={buttonClass('primary', 'w-full md:w-auto')}>
              回首頁
            </Link>
          </p>
          <nav aria-label="工具導流" className="mt-12">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              {TOOLS.map((tool) => (
                <li key={tool.id}>
                  <a
                    href={getToolUrl(tool)}
                    className="press focus-ring text-[15px] font-semibold text-primary-strong active:opacity-80"
                  >
                    {tool.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
