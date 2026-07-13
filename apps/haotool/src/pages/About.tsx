/**
 * 關於頁（design-deep-dive §5.2）：品牌故事 → 能力四卡 → 開發原則 → FAQ → 隱私 → CTA。
 * 正文欄 max-width 720px 置中（能力卡區用全容器寬）；FAQ 資料 SSOT：config/faq。
 */
import { Link } from 'react-router-dom';
import { Code, GitBranch, Lightbulb, Zap } from 'lucide-react';
import { APP_INFO } from '../config/app-info';
import { ABOUT_FAQS } from '../config/faq';
import Accordion from '../components/Accordion';
import { buttonClass, GhostLink } from '../components/Button';
import Reveal from '../components/Reveal';

const SKILL_AREAS = [
  {
    icon: Code,
    title: '前端開發',
    description: 'React 19、TypeScript、Vite 打造高品質 Web 應用。',
    chips: ['React 19', 'TypeScript', 'Vite'],
  },
  {
    icon: Zap,
    title: '效能與 PWA',
    description: 'SSG 預渲染、Service Worker 離線快取，追求 Lighthouse 90+。',
    chips: ['PWA', 'Workbox', 'Core Web Vitals'],
  },
  {
    icon: GitBranch,
    title: '開源實踐',
    description: '全部專案以 GPL-3.0 開源，測試與 CI 守門。',
    chips: ['GPL-3.0', 'Vitest', 'Playwright'],
  },
  {
    icon: Lightbulb,
    title: '產品思維',
    description: '從真實痛點出發，以產品級標準交付每一個工具。',
    chips: ['Cloudflare', 'SEO', 'UX'],
  },
] as const;

// 開發原則三條（§5.2）：序號 tabular 20px/800 品牌藍 + 標題 17px/700 + 一句 muted。
const PRINCIPLES = [
  { title: '性能是功能', description: '速度不是優化項目，是每個工具的第一個功能。' },
  { title: '細節是尊重', description: '44px 觸控目標、離線可用、無障礙——細節是對使用者的尊重。' },
  { title: '開源是承諾', description: '程式碼公開在 GitHub，品質接受任何人檢視。' },
] as const;

export default function About() {
  return (
    <>
      <div className="bg-surface">
        <div className="shell pb-12 pt-16 md:pt-20">
          <div className="mx-auto flex max-w-[720px] items-center gap-5 md:gap-6">
            {/* A4 L2-a 吉祥物頭像（與 Home 區 6 同資產）；固定尺寸容器零 CLS。 */}
            <div className="flex size-[88px] shrink-0 items-center justify-center overflow-hidden rounded-deco bg-primary-bg md:size-[112px]">
              <img
                src="/brand/avatar.png"
                alt="阿璋的吉祥物頭像——手持扳手的品牌藍小方塊"
                width={640}
                height={640}
                loading="lazy"
                decoding="async"
                className="size-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-h1 text-text">關於 {APP_INFO.shortName}</h1>
              <p className="mt-3 text-caption text-text-muted">
                {APP_INFO.author} · {APP_INFO.authorTitle} · Since {APP_INFO.copyrightStartYear}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 品牌故事（白底；文案 §6.3 三段） */}
      <section aria-labelledby="story-heading" className="bg-surface">
        <div className="shell pb-16 md:pb-20">
          <div className="mx-auto max-w-[720px]">
            <h2 id="story-heading" className="sr-only">
              品牌故事
            </h2>
            <div className="space-y-5 text-body leading-[1.7] text-text">
              <p>
                「HAO」取自中文「好」的拼音。{APP_INFO.shortName} 的理念很純粹——打造真正的
                <span className="text-primary-strong">好工具</span>
                ：不是功能的堆砌，而是能解決痛點、用起來舒服的工藝品。
              </p>
              <p>
                每個工具都從我自己的真實需求出發：換匯時想知道銀行真正賣我的價格、旅行分帳不想吵架、停車後想找得到車。做給自己用，所以不敢馬虎。
              </p>
              <p>
                全部開源（{APP_INFO.license}）、全部免費、不放廣告、不收集任何個資。程式碼就放在
                GitHub 上，歡迎檢視、歡迎指教。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 能力四卡（淺灰底；全容器寬 2×2） */}
      <section aria-labelledby="skills-heading" className="bg-background">
        <div className="shell section-pad">
          <Reveal>
            <h2 id="skills-heading" className="text-center text-h2 text-text">
              我擅長的事
            </h2>
          </Reveal>
          <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {SKILL_AREAS.map((area, index) => (
              <li key={area.title}>
                <Reveal className="h-full" delay={index * 0.07}>
                  <div className="flex h-full flex-col items-start gap-4 rounded-card border border-border bg-surface p-6">
                    <span className="inline-flex size-10 items-center justify-center rounded-icon bg-primary-bg">
                      <area.icon
                        className="size-6 text-primary-strong"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <h3 className="text-h3 text-text">{area.title}</h3>
                      <p className="mt-1 text-body-sm text-text-muted">{area.description}</p>
                    </div>
                    <ul className="mt-auto flex flex-wrap gap-1.5">
                      {area.chips.map((chip) => (
                        <li
                          key={chip}
                          className="rounded-chip bg-surface-sunken px-2.5 py-[3px] text-caption text-text-muted"
                        >
                          {chip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 開發原則（白底） */}
      <section aria-labelledby="principles-heading" className="bg-surface">
        <div className="shell section-pad">
          <div className="mx-auto max-w-[720px]">
            <h2 id="principles-heading" className="text-h2 text-text">
              三條不妥協的原則
            </h2>
            <ol className="mt-8 space-y-6">
              {PRINCIPLES.map((principle, index) => (
                <li key={principle.title} className="flex items-baseline gap-4">
                  <span
                    className="text-[20px] font-extrabold tabular-nums text-primary-strong"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-[17px] font-bold text-text">{principle.title}</h3>
                    <p className="mt-1 text-[15px] text-text-muted">{principle.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ（淺灰底；FAQPage schema 全站唯一輸出處 = 本頁，由 SEO 模組負責） */}
      <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-20 bg-background">
        <div className="shell section-pad">
          <div className="mx-auto max-w-[720px]">
            <h2 id="faq-heading" className="text-h2 text-text">
              常見問題
            </h2>
            <div className="mt-8">
              <Accordion items={ABOUT_FAQS} />
            </div>
          </div>
        </div>
      </section>

      {/* 隱私政策（白底；046 §3.4 三要點） */}
      <section id="privacy" aria-labelledby="privacy-heading" className="scroll-mt-20 bg-surface">
        <div className="shell section-pad">
          <div className="mx-auto max-w-[720px]">
            <h2 id="privacy-heading" className="text-h2 text-text">
              隱私權政策
            </h2>
            <ul className="mt-6 list-disc space-y-3 pl-5 text-[15px] leading-[1.7] text-text">
              <li>本站不收集任何個人識別資訊，不使用第三方追蹤工具或廣告 SDK。</li>
              <li>
                使用技術聲明：localStorage（僅用戶偏好，資料留在瀏覽器）、Service Worker（PWA
                離線快取，不傳輸個人資料）。
              </li>
              <li>如有隱私相關疑問，歡迎透過聯繫頁面與我聯絡。</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA（白底） */}
      <section aria-labelledby="about-cta-heading" className="bg-surface">
        <div className="shell pb-20">
          <div className="mx-auto max-w-[720px]">
            <h2 id="about-cta-heading" className="sr-only">
              聯繫方式
            </h2>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
              <Link
                to="/contact/"
                viewTransition
                className={buttonClass('primary', 'w-full md:w-auto')}
              >
                聯繫我
              </Link>
              <GhostLink href={APP_INFO.github} external>
                GitHub
              </GhostLink>
              <GhostLink href={APP_INFO.threadsUrl} external>
                Threads
              </GhostLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
