/**
 * 404 佔位頁（brief §3.5）：大數字 + 品牌一句 + 回首頁 + 工具導流。
 */
import { Link } from 'react-router-dom';
import { TOOLS, getToolUrl } from '../config/tools';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1120px] px-5 py-16 text-center md:px-6">
      <p className="text-7xl font-extrabold [font-variant-numeric:tabular-nums]" aria-hidden="true">
        404
      </p>
      <h1 className="mt-4 text-3xl font-extrabold">找不到頁面</h1>
      <p className="mt-3 text-text-muted">這頁不存在，但工具都在。</p>
      <p className="mt-6">
        <Link
          to="/"
          className="inline-flex h-[52px] items-center rounded-2xl bg-primary px-8 font-bold text-white"
        >
          回首頁
        </Link>
      </p>
      <nav aria-label="工具導流" className="mt-10">
        <ul className="flex flex-wrap justify-center gap-4">
          {TOOLS.map((tool) => (
            <li key={tool.id}>
              <a href={getToolUrl(tool)} className="text-sm font-semibold text-primary-strong">
                {tool.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
