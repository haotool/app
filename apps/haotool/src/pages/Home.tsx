/**
 * 首頁（design-deep-dive §2 八區；Header/Footer 由 Layout 提供）。
 * Hero 為 SSG 靜態內容（LCP = H1 文字；S1 開場僅位移不動透明度）；首屏以下 whileInView once。
 */
import { Link } from 'react-router-dom';
import { Gauge, Scale, ShieldCheck } from 'lucide-react';
import { APP_INFO } from '../config/app-info';
import { TOOLS } from '../config/tools';
import { buttonClass, GhostLink } from '../components/Button';
import HeroChips from '../components/HeroChips';
import HeroStage from '../components/HeroStage';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import StatItem from '../components/StatItem';
import ToolCard from '../components/ToolCard';

// 信任列統計（§2 區 3）：符號為靜態字元，不參與 count-up。
const STATS = [
  { value: TOOLS.length, label: '個上線產品' },
  { value: 100, suffix: '%', label: '開源免費' },
  { value: 0, label: '廣告與追蹤' },
  { value: 90, suffix: '+', label: 'Lighthouse 分數' },
] as const;

// 工藝證明三卡（§2 區 5）＋ FR-012 證據錨點（每個宣稱 ≥1 個可點擊證據）。
const CRAFT_PROOFS = [
  {
    icon: Gauge,
    data: 'LCP <2s',
    title: '效能',
    description: 'Lighthouse 90+，打開 DevTools 就能對帳的速度。',
    evidenceLabel: '查看 Lighthouse 報告',
    evidenceHref: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(APP_INFO.siteUrl)}`,
  },
  {
    icon: ShieldCheck,
    data: 'PWA 離線可用',
    title: '可靠',
    description: '資料驗證守門，測試與 CI 全綠才出貨。',
    evidenceLabel: '查看原始碼與測試',
    evidenceHref: APP_INFO.github,
  },
  {
    icon: Scale,
    data: 'GPL-3.0 開源',
    title: '誠實',
    description: '零廣告、零追蹤，程式碼公開歡迎檢視。',
    evidenceLabel: '查看授權條款',
    evidenceHref: APP_INFO.licenseUrl,
  },
] as const;

export default function Home() {
  return (
    <>
      {/* 區 2 — Hero（白底；文字在上、舞台在後 — D8） */}
      <section aria-labelledby="hero-heading" className="bg-surface">
        <div className="shell flex flex-col gap-10 pb-[72px] pt-12 lg:grid lg:grid-cols-[minmax(0,560px)_minmax(0,512px)] lg:items-center lg:gap-12 lg:pb-28 lg:pt-24">
          {/* <1024：文字區撐滿首屏可視高（100svh − header 64 − pt 48 − gap 40），
              舞台整體移出首屏 → LCP 元素保證為 H1 文字（PRD §10.2 MUST）；桌面版式不變。 */}
          <div className="relative flex min-h-[calc(100svh-152px)] flex-col justify-center lg:min-h-0">
            {/* 文字容器 z-index 1、chips z-index 0（S2：chips 置於文字之下）。 */}
            <div className="relative z-[1] flex flex-col">
              {/* self-start：flex column 下維持 chip 內容寬（不被 stretch 撐滿）。 */}
              <p className="inline-flex items-center gap-2 self-start rounded-chip bg-primary-bg px-3.5 py-1.5 text-overline uppercase text-primary-strong">
                <span className="size-2 rounded-full bg-success" aria-hidden="true" />
                OPEN SOURCE · 台灣
              </p>
              {/* S1：H1 整體單一 spring（僅 translateY、透明度恆 1）。
                  不拆詞段——inline-block 詞段會把 H1 文字拆成多個小 LCP 候選，
                  使 LCP 被副文段落搶走，違反 8.1 不可動搖約束「LCP=H1」（實測驗證）。 */}
              <h1 id="hero-heading" className="intro-h1 mt-4 text-display text-text">
                把好想法，
                <br />
                做成<span className="text-primary-strong">好工具</span>。
              </h1>
              <p className="intro-follow mt-5 max-w-none text-body text-text-muted lg:max-w-[30ch]">
                我是{APP_INFO.author}
                。從匯率、分帳到防災教育，每一個工具都以產品級標準交付，免費且開源。
              </p>
              <div className="intro-follow mt-8 flex flex-col gap-3 md:flex-row">
                <a href="#tools" className={buttonClass('primary', 'w-full md:w-auto')}>
                  看看我做的工具
                </a>
                <Link
                  to="/contact/"
                  viewTransition
                  className={buttonClass('secondary', 'w-full md:w-auto')}
                >
                  和我聊專案
                </Link>
              </div>
            </div>
            <HeroChips />
          </div>
          <HeroStage />
        </div>
      </section>

      {/* 區 3 — 信任列（淺灰底；banner 型窄區節奏例外） */}
      <section aria-labelledby="stats-heading" className="bg-background">
        <div className="shell py-12 md:py-20">
          <Reveal>
            <p
              id="stats-heading"
              className="text-center text-overline uppercase text-primary-strong"
            >
              不是作品集，是已上線的產品
            </p>
          </Reveal>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-6">
            {STATS.map((stat) => (
              <li key={stat.label}>
                <StatItem
                  value={stat.value}
                  label={stat.label}
                  {...('suffix' in stat ? { suffix: stat.suffix } : {})}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 區 4 — 工具展示（白底） */}
      <section id="tools" aria-labelledby="tools-heading" className="scroll-mt-20 bg-surface">
        <div className="shell section-pad">
          <Reveal>
            <SectionHeading
              overline="TOOLS"
              id="tools-heading"
              title="五個正在服務真實使用者的工具"
              sub="不是 demo，每一個都上線、可安裝、離線可用。"
            />
          </Reveal>
          <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:flex lg:flex-wrap lg:justify-center">
            {TOOLS.map((tool, index) => (
              <li key={tool.id} className="lg:w-[calc((100%-48px)/3)]">
                <Reveal className="h-full" delay={index * 0.07}>
                  <ToolCard tool={tool} />
                </Reveal>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center">
            <GhostLink to="/tools/">查看全部工具</GhostLink>
          </p>
        </div>
      </section>

      {/* 區 5 — 工藝證明（淺灰底；非連結卡，證據錨點為卡內 ghost 連結） */}
      <section aria-labelledby="craft-heading" className="bg-background">
        <div className="shell section-pad">
          <Reveal>
            <SectionHeading
              overline="CRAFT"
              id="craft-heading"
              title="產品級，是可以被驗證的"
              sub="每一項數字都可以在 Lighthouse 與原始碼裡對帳。"
            />
          </Reveal>
          <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {CRAFT_PROOFS.map((proof, index) => (
              <li key={proof.title}>
                <Reveal className="h-full" delay={index * 0.07}>
                  <div className="flex h-full flex-col items-start gap-4 rounded-card border border-border bg-surface px-6 py-7">
                    <span className="inline-flex size-10 items-center justify-center rounded-icon bg-primary-bg">
                      <proof.icon
                        className="size-6 text-primary-strong"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </span>
                    <p className="text-[20px] font-extrabold tabular-nums leading-[1.4] text-text">
                      {proof.data}
                    </p>
                    <div>
                      <h3 className="text-caption font-bold text-text">{proof.title}</h3>
                      <p className="mt-1 text-body-sm text-text-muted">{proof.description}</p>
                    </div>
                    <GhostLink href={proof.evidenceHref} external className="mt-auto">
                      {proof.evidenceLabel}
                    </GhostLink>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 區 6 — 作者（白底；整組單次 reveal 不 stagger） */}
      <section aria-labelledby="author-heading" className="bg-surface">
        <div className="shell section-pad">
          <Reveal>
            <div className="flex flex-col items-center gap-8 text-center lg:grid lg:grid-cols-[320px_1fr] lg:items-center lg:gap-16 lg:text-left">
              {/* 素材 A6（作者插畫）待產出；先以品牌淡藍幾何佔位（無邊框無陰影）。 */}
              <div
                className="flex size-[200px] items-center justify-center rounded-deco bg-primary-bg lg:size-[320px]"
                aria-hidden="true"
              >
                <span className="text-[64px] font-extrabold text-primary lg:text-[96px]">好</span>
              </div>
              <div className="flex max-w-[60ch] flex-col gap-4">
                <h2 id="author-heading" className="text-h2 text-text">
                  寫程式之前，先想像<span className="text-primary-strong">使用的人</span>。
                </h2>
                <p className="text-caption text-text-muted">
                  {APP_INFO.author} · {APP_INFO.authorTitle} · Since {APP_INFO.copyrightStartYear}
                </p>
                <p className="text-body text-text">
                  我是{APP_INFO.author}，{APP_INFO.authorTitle}。{APP_INFO.copyrightStartYear}{' '}
                  年起，我把生活裡的小麻煩一個個做成免費工具。匯率、分帳、停車、防災——它們都不大，但每一個細節我都當產品在做。
                </p>
                <p className="lg:self-start">
                  <GhostLink to="/about/">更多關於我</GhostLink>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 區 7 — 聯繫 Banner（#1B64DA 全幅；藍實底 ≤15% 規則唯一授權例外 D2） */}
      <section aria-labelledby="contact-heading" className="bg-banner-bg">
        <div className="shell py-16 md:py-24">
          <Reveal>
            <div className="mx-auto flex max-w-[640px] flex-col items-center text-center">
              <h2 id="contact-heading" className="text-h2 text-banner-text">
                有想做的產品？我們聊聊。
              </h2>
              <p className="mt-4 text-body text-banner-sub">
                合作委託、技術顧問，或只是打個招呼——24 小時內回覆。
              </p>
              <Link
                to="/contact/"
                viewTransition
                className={buttonClass(
                  'banner',
                  'mt-3 w-full max-w-[360px] md:w-auto md:max-w-none',
                )}
              >
                聊聊你的專案
              </Link>
              <GhostLink to="/about/#faq" inverse className="mt-8">
                先看常見問題
              </GhostLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
