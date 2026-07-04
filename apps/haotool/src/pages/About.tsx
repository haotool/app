/**
 * 關於頁佔位（語意結構完整版）
 * 品牌故事（046 §1）→ 能力領域 → 隱私政策（#privacy 錨點，046 §3.4 原文要點）→ CTA。
 * FAQ Accordion 與 FAQPage JSON-LD 掛點留待後續 wave（見 src/seo/jsonld.ts ABOUT_FAQ_ITEMS）。
 */
import { Link } from 'react-router-dom';
import { APP_INFO } from '../config/app-info';

const SKILL_AREAS = [
  {
    title: '前端開發',
    description: 'React 19、TypeScript、Vite 打造高品質 Web 應用。',
    chips: ['React 19', 'TypeScript', 'Vite'],
  },
  {
    title: '效能與 PWA',
    description: 'SSG 預渲染、Service Worker 離線快取，追求 Lighthouse 90+。',
    chips: ['PWA', 'Workbox', 'Core Web Vitals'],
  },
  {
    title: '開源實踐',
    description: '全部專案以 GPL-3.0 開源，測試與 CI 守門。',
    chips: ['GPL-3.0', 'Vitest', 'Playwright'],
  },
  {
    title: '產品思維',
    description: '從真實痛點出發，以產品級標準交付每一個工具。',
    chips: ['Cloudflare', 'SEO', 'UX'],
  },
] as const;

export default function About() {
  return (
    <div className="mx-auto max-w-[1120px] px-5 py-16 md:px-6">
      <h1 className="text-3xl font-extrabold">關於 {APP_INFO.shortName}</h1>
      <p className="mt-3 text-text-muted">
        {APP_INFO.author} · {APP_INFO.authorTitle} · Since {APP_INFO.copyrightStartYear}
      </p>

      <section aria-labelledby="story-heading" className="mt-12">
        <h2 id="story-heading" className="text-2xl font-extrabold">
          好工具的由來
        </h2>
        <div className="mt-4 max-w-prose space-y-4 leading-relaxed">
          <p>
            「HAO」是中文「好」的拼音；「{APP_INFO.shortName}」就是「{APP_INFO.subtitle}
            」。核心理念非常純粹——打造真正的好工具。
          </p>
          <p>
            我深信優秀的數位產品不應只是功能的堆砌，更要是能解決痛點、並在使用過程中帶來愉悅感的工藝品。
          </p>
          <p>
            所以每一個工具都免費、開源、不收集個資，並以產品級標準交付：效能是功能、細節是尊重、開源是承諾。
          </p>
        </div>
      </section>

      <section aria-labelledby="skills-heading" className="mt-12">
        <h2 id="skills-heading" className="text-2xl font-extrabold">
          能力領域
        </h2>
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {SKILL_AREAS.map((area) => (
            <li key={area.title} className="rounded-[20px] border border-border bg-surface p-6">
              <h3 className="text-lg font-bold">{area.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{area.description}</p>
              <p className="mt-4 text-xs text-text-muted">{area.chips.join(' / ')}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="privacy" aria-labelledby="privacy-heading" className="mt-12 scroll-mt-20">
        <h2 id="privacy-heading" className="text-2xl font-extrabold">
          隱私權政策
        </h2>
        <ul className="mt-4 max-w-prose list-disc space-y-2 pl-5 leading-relaxed">
          <li>本站不收集任何個人識別資訊，不使用第三方追蹤工具或廣告 SDK。</li>
          <li>
            使用技術聲明：localStorage（僅用戶偏好，資料留在瀏覽器）、Service Worker（PWA
            離線快取，不傳輸個人資料）。
          </li>
          <li>如有隱私相關疑問，歡迎透過聯繫頁面與我聯絡。</li>
        </ul>
      </section>

      <section aria-labelledby="about-cta-heading" className="mt-12">
        <h2 id="about-cta-heading" className="sr-only">
          聯繫方式
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/contact/"
            className="inline-flex h-[52px] items-center rounded-2xl bg-primary px-8 font-bold text-white"
          >
            聯繫我
          </Link>
          <a
            href={APP_INFO.threadsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary-strong"
          >
            Threads
          </a>
          <a
            href={APP_INFO.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary-strong"
          >
            GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
