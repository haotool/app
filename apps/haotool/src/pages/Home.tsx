/**
 * 首頁佔位（語意結構完整版）
 * 區塊順序依設計 brief §3.1：Hero → 信任列 → 工具展示 → 作者 → 聯繫 CTA。
 * 視覺與動效由後續 wave 深化；FAQ 集中於 About（brief 修正 PRD v1）。
 */
import { Link } from 'react-router-dom';
import { APP_INFO } from '../config/app-info';
import { TOOLS, getToolUrl } from '../config/tools';

const STATS = [
  { value: String(TOOLS.length), label: '個上線產品' },
  { value: '100%', label: '開源免費' },
  { value: '0', label: '廣告與追蹤' },
  { value: '90+', label: 'Lighthouse 分數' },
] as const;

export default function Home() {
  return (
    <>
      <section aria-labelledby="hero-heading" className="mx-auto max-w-[1120px] px-5 py-16 md:px-6">
        <h1 id="hero-heading" className="text-4xl font-extrabold leading-tight">
          把好想法，做成<span className="text-primary-strong">好工具</span>。
        </h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed">
          我是{APP_INFO.author}。{APP_INFO.shortName}{' '}
          是我打造的免費開源工具集——從匯率、分帳到防災教育，每一個都以產品級標準交付。
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <a
            href="#tools"
            className="inline-flex h-[52px] items-center rounded-2xl bg-primary px-8 font-bold text-white"
          >
            看看我做的工具
          </a>
          <Link
            to="/contact/"
            className="inline-flex h-[52px] items-center rounded-2xl border border-border bg-surface px-8 font-bold text-text"
          >
            和我聊專案
          </Link>
        </div>
      </section>

      <section aria-labelledby="stats-heading" className="bg-surface-sunken">
        <div className="mx-auto max-w-[1120px] px-5 py-12 md:px-6">
          <h2 id="stats-heading" className="text-sm font-semibold text-primary-strong">
            不是作品集，是已上線的產品
          </h2>
          <dl className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dd className="text-3xl font-extrabold [font-variant-numeric:tabular-nums]">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-sm text-text-muted">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="tools" aria-labelledby="tools-heading" className="scroll-mt-20">
        <div className="mx-auto max-w-[1120px] px-5 py-16 md:px-6">
          <h2 id="tools-heading" className="text-2xl font-extrabold">
            五個正在服務真實使用者的工具
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <li key={tool.id}>
                <a
                  href={getToolUrl(tool)}
                  className="block h-full rounded-[20px] border border-border bg-surface p-6"
                >
                  <h3 className="text-lg font-bold">{tool.name}</h3>
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
          <p className="mt-6">
            <Link to="/tools/" className="text-sm font-semibold text-primary-strong">
              查看全部 →
            </Link>
          </p>
        </div>
      </section>

      <section aria-labelledby="author-heading" className="bg-surface-sunken">
        <div className="mx-auto max-w-[1120px] px-5 py-16 md:px-6">
          <h2 id="author-heading" className="text-2xl font-extrabold">
            寫程式碼之前，我先想像使用的人。
          </h2>
          <p className="mt-4 max-w-prose leading-relaxed">
            「HAO」取自中文「好」的拼音。{APP_INFO.shortName}{' '}
            的核心理念非常純粹——打造真正的「好工具」：免費、開源、不收集個資。
          </p>
          <p className="mt-4">
            <Link to="/about/" className="text-sm font-semibold text-primary-strong">
              更多關於我 →
            </Link>
          </p>
        </div>
      </section>

      <section aria-labelledby="contact-heading" className="bg-primary-strong">
        <div className="mx-auto max-w-[1120px] px-5 py-16 md:px-6">
          <h2 id="contact-heading" className="text-2xl font-extrabold text-white">
            有想做的產品？我們聊聊。
          </h2>
          <p className="mt-2 text-primary-bg">合作委託、技術顧問或只是打個招呼——24 小時內回覆。</p>
          <p className="mt-6">
            <Link
              to="/contact/"
              className="inline-flex h-[52px] items-center rounded-2xl bg-surface px-8 font-bold text-primary-strong"
            >
              聊聊你的專案
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
