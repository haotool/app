/**
 * 首頁（design-deep-dive §2 八區；Header/Footer 由 Layout 提供）。
 * Hero 為 SSG 靜態內容（LCP = H1 文字；S1 開場僅位移不動透明度）；首屏以下 whileInView once。
 */
import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { Gauge, Scale, ShieldCheck } from 'lucide-react';
import { APP_INFO } from '../config/app-info';
import { TOOLS } from '../config/tools';
import { buttonClass, GhostLink } from '../components/Button';
import HeroChips from '../components/HeroChips';
import HeroStage from '../components/HeroStage';
import { useMagnetic } from '../components/interactions';
import Reveal from '../components/Reveal';
import ScrollProgress from '../components/ScrollProgress';
import SectionHeading from '../components/SectionHeading';
import StatItem from '../components/StatItem';
import StickerBadge from '../components/StickerBadge';
import ToolCard from '../components/ToolCard';

// 信任列統計（§2 區 3）：符號為靜態字元，不參與 count-up。
const STATS = [
  { value: TOOLS.length, label: '個上線產品' },
  { value: 100, suffix: '%', label: '開源免費' },
  { value: 0, label: '廣告與追蹤' },
  { value: 90, suffix: '+', label: 'Lighthouse 分數' },
] as const;

// A1 bento 網格放置序（mobile-beauty §2.1）：DOM 順序 = TOOLS SSOT 順序 = 視覺閱讀順序。
const BENTO_SLOTS = [
  'bento-feature',
  'bento-sm-a',
  'bento-sm-b',
  'bento-wide-a',
  'bento-wide-b',
] as const;

// A1 feature 數據帶（HaoRate 專屬、零時效數值）：靜態 sparkline 形狀＋幣別徽章牆。
// 禁止清單：匯率值、更新時間、漲跌百分比——一切會過期的內容（PM 9.2 A1 硬規則）。
const FEATURE_CURRENCIES = ['USD', 'JPY', 'KRW', 'EUR', 'GBP'] as const;

const featureDataBand = (
  <div className="mt-4 flex flex-col gap-2" data-testid="feature-data-band">
    <div className="flex items-center gap-3">
      <svg
        viewBox="0 0 120 32"
        width={120}
        height={32}
        aria-hidden="true"
        className="shrink-0 text-primary"
      >
        <path
          d="M2 26 L14 22 L26 24 L38 17 L50 19 L62 12 L74 14 L86 9 L98 11 L110 5 L118 6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={118} cy={6} r={3} fill="currentColor" />
      </svg>
      <span className="text-caption text-text-muted">30 天趨勢</span>
    </div>
    <ul className="flex flex-wrap gap-1.5">
      {FEATURE_CURRENCIES.map((code) => (
        <li
          key={code}
          className="rounded-chip bg-surface-sunken px-2 py-0.5 text-caption text-text-muted"
        >
          {code}
        </li>
      ))}
    </ul>
  </div>
);

// 工藝證明三幕（A2，mobile-beauty §3.1 文案終稿）＋ FR-012 證據錨點。
// 同一份 DOM 雙版式：enhanced＝sticky 幕（overline→巨型數據→標題句→描述→錨點）；
// fallback＝現行三卡網格（icon＋數據＋標題＋描述＋錨點一一對應）。
const CRAFT_PROOFS = [
  {
    icon: Gauge,
    overline: 'PERFORMANCE',
    data: <>LCP &lt;2s</>,
    title: '快，是第一個功能。',
    description: 'Lighthouse 90+，打開 DevTools 就能對帳。',
    evidenceLabel: '查看 Lighthouse 報告',
    evidenceHref: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(APP_INFO.siteUrl)}`,
  },
  {
    icon: ShieldCheck,
    overline: 'RELIABILITY',
    data: (
      <>
        100% <span className="text-primary-strong">離線</span>
      </>
    ),
    title: '斷網，也照常工作。',
    description: 'PWA 離線可用，測試與 CI 全綠才出貨。',
    evidenceLabel: '查看原始碼與測試',
    evidenceHref: APP_INFO.github,
  },
  {
    icon: Scale,
    overline: 'HONESTY',
    data: <>GPL-3.0</>,
    title: '程式碼公開，歡迎檢視。',
    description: '零廣告、零追蹤、零個資收集。',
    evidenceLabel: '查看授權條款',
    evidenceHref: APP_INFO.licenseUrl,
  },
] as const;

export default function Home() {
  // S5-b magnetic hover（範圍收斂：hero 主/次 CTA；Header GitHub 鈕於 Header 內）。
  const primaryCtaRef = useMagnetic<HTMLAnchorElement>();
  const secondaryCtaRef = useMagnetic<HTMLAnchorElement>();

  return (
    <>
      {/* S4-c：僅 Home（敘事長頁）掛載 1px scroll progress。 */}
      <ScrollProgress />
      {/* 區 2 — Hero（白底；文字在上、舞台在後 — D8） */}
      <section aria-labelledby="hero-heading" className="bg-surface">
        <div className="shell flex flex-col gap-10 pb-[72px] pt-12 lg:grid lg:grid-cols-[minmax(0,560px)_minmax(0,512px)] lg:items-center lg:gap-12 lg:pb-28 lg:pt-24">
          {/* <1024：文字區撐滿首屏可視高（100svh − header 64 − pt 48 − gap 40），
              舞台整體移出首屏 → LCP 元素保證為 H1 文字（PRD §10.2 MUST）；桌面版式不變。 */}
          <div className="relative flex min-h-[calc(100svh-152px)] flex-col justify-center lg:min-h-0">
            {/* 文字容器 z-index 1、chips z-index 0（S2：chips 置於文字之下）。 */}
            <div className="relative z-[1] flex flex-col">
              {/* A6 貼紙徽章列（mobile-beauty §1 屏 1）：靜態旋轉、不新增動畫、首屏第一幀即繪製；
                  padding-block 2px 吸收 ±2° 縱向溢出。 */}
              <div className="flex items-center gap-2 self-start py-0.5">
                <StickerBadge variant="primary" withDot>
                  OPEN SOURCE · 台灣
                </StickerBadge>
                <StickerBadge variant="ink">100% FREE</StickerBadge>
              </div>
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
                {/* S5-b：內層 magnet-item 承載 ±4px 位移，避免與外層 :active scale 衝突。 */}
                <a
                  ref={primaryCtaRef}
                  href="#tools"
                  className={buttonClass('primary', 'w-full md:w-auto')}
                >
                  <span className="magnet-item">看看我做的工具</span>
                </a>
                <Link
                  ref={secondaryCtaRef}
                  to="/contact/"
                  viewTransition
                  className={buttonClass('secondary', 'w-full md:w-auto')}
                >
                  <span className="magnet-item">和我聊專案</span>
                </Link>
              </div>
            </div>
            <HeroChips />
          </div>
          <HeroStage />
        </div>
      </section>

      {/* 區 3 — 信任列（淺灰底；banner 型窄區節奏例外）；A7 dot-grid pattern 全站唯一授權處 */}
      <section aria-labelledby="stats-heading" className="trust-pattern">
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
            {/* A5 H2 詞級 kinetic（僅區 4/6，N2）：aria-label 完整句＋aria-hidden 拆詞雙軌。 */}
            <SectionHeading
              overline="TOOLS"
              id="tools-heading"
              kineticWords={['五個', '正在服務', '真實使用者', '的工具']}
              sub="不是 demo，每一個都上線、可安裝、離線可用。"
            />
          </Reveal>
          {/* A1 bento：行動 2 欄（feature 跨滿＋2×2 mini）／桌面 12 欄 3 列；
              DOM 順序 = TOOLS SSOT 順序 = 視覺閱讀順序（禁止 grid 放置交叉）。 */}
          <ul className="bento mt-12">
            {TOOLS.map((tool, index) => (
              <li key={tool.id} data-tool-id={tool.id} className={BENTO_SLOTS[index]}>
                <Reveal className="h-full" delay={index * 0.07}>
                  <ToolCard
                    tool={tool}
                    variant={index === 0 ? 'feature' : 'mini'}
                    {...(index === 0 ? { extra: featureDataBand } : {})}
                  />
                </Reveal>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center">
            <GhostLink to="/tools/">查看全部工具</GhostLink>
          </p>
        </div>
      </section>

      {/* 區 5 — 工藝證明 sticky 一幕（A2，mobile-beauty §3）：
          標題組置於 pin 容器之前（不進幕、走既有 Reveal）；同一份 DOM 雙版式——
          enhanced（view-timeline）＝pin 300svh 三幕逐幕換場；
          fallback（iOS<26／Firefox／reduced-motion／矮視口）＝現行三卡靜態網格。 */}
      <section aria-labelledby="craft-heading" className="bg-background">
        <div className="shell pt-[var(--space-section)]">
          <Reveal>
            <SectionHeading
              overline="CRAFT"
              id="craft-heading"
              title="產品級，是可以被驗證的"
              sub="每一項數字都可以在 Lighthouse 與原始碼裡對帳。"
            />
          </Reveal>
        </div>
        <div className="craft-pin">
          <ul className="craft-stage shell mt-12 pb-[var(--space-section)]">
            {CRAFT_PROOFS.map((proof, index) => (
              <li key={proof.overline} className={`craft-scene craft-scene-${index + 1}`}>
                {/* enhanced 模式 Reveal 由 .craft-reveal 中性化（幕動畫為該視口唯一動畫組）。 */}
                <Reveal className="craft-reveal h-full" delay={index * 0.07}>
                  <div className="craft-card flex h-full flex-col items-start gap-4 rounded-card border border-border bg-surface px-6 py-7">
                    <p className="craft-overline text-overline uppercase text-primary-strong">
                      {proof.overline}
                    </p>
                    {/* S4-b draw-in 僅 fallback 卡版生效（N8：enhanced 幕內停用、icon 整格隱藏）。 */}
                    <span
                      className="craft-icon inline-flex size-10 items-center justify-center rounded-icon bg-primary-bg"
                      style={{ '--draw-delay': `${index * 70}ms` } as CSSProperties}
                    >
                      <proof.icon
                        className="draw-in size-6 text-primary-strong"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </span>
                    <p className="craft-data text-[20px] font-extrabold tabular-nums leading-[1.4] text-text">
                      {proof.data}
                    </p>
                    <div>
                      <h3 className="craft-title text-caption font-bold text-text">
                        {proof.title}
                      </h3>
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
              {/* A4 L2-a 吉祥物頭像（mobile-beauty §6）：容器尺寸與佔位期一致 → 零 CLS。 */}
              <div className="flex size-[200px] items-center justify-center overflow-hidden rounded-deco bg-primary-bg lg:size-[320px]">
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
              <div className="flex max-w-[60ch] flex-col gap-4">
                {/* A5 kinetic（區 6，3 段、570ms）：品牌色 span 併入所屬段；AT 讀 aria-label 完整句。 */}
                <h2
                  id="author-heading"
                  className="text-h2 text-text"
                  aria-label="寫程式之前，先想像使用的人。"
                >
                  <span aria-hidden="true">
                    <span className="kinetic-word" style={{ '--i': 0 } as CSSProperties}>
                      寫程式之前，
                    </span>
                    <span className="kinetic-word" style={{ '--i': 1 } as CSSProperties}>
                      先想像
                    </span>
                    <span className="kinetic-word" style={{ '--i': 2 } as CSSProperties}>
                      <span className="text-primary-strong">使用的人</span>。
                    </span>
                  </span>
                </h2>
                <p className="text-caption text-text-muted">
                  {APP_INFO.author} · {APP_INFO.authorTitle} · Since {APP_INFO.copyrightStartYear}
                </p>
                <p className="text-body text-text">
                  我是{APP_INFO.author}，{APP_INFO.authorTitle}。{APP_INFO.copyrightStartYear}{' '}
                  年起，我把生活裡的小麻煩一個個做成免費工具。匯率、分帳、停車、防災，它們都不大，但每一個細節我都當產品在做。
                </p>
                <p className="lg:self-start">
                  <GhostLink to="/about/">更多關於我</GhostLink>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 區 7 — 聯繫 Banner（#1B64DA 全幅；藍實底 ≤15% 規則唯一授權例外 D2）；
          A4 L3-b 插畫掛右下角（§6 N6：僅 ≥1024px、純裝飾、不壓 640px 置中文字）。 */}
      <section aria-labelledby="contact-heading" className="relative bg-banner-bg">
        {/* S1：480w＝渲染寬 240px 的 2× 帳；AVIF 主軌＋WebP 備援（§6 格式決策）。
            定位類掛 picture（img 絕對定位會在 section 流內留下空 inline box）。 */}
        <picture aria-hidden="true" className="banner-illus">
          <source type="image/avif" srcSet="/brand/illus-desk.avif" />
          <img
            src="/brand/illus-desk.webp"
            alt=""
            width={480}
            height={320}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />
        </picture>
        <div className="shell py-16 md:py-24">
          <Reveal>
            <div className="mx-auto flex max-w-[640px] flex-col items-center text-center">
              <h2 id="contact-heading" className="text-h2 text-banner-text">
                有想做的產品？我們聊聊。
              </h2>
              <p className="mt-4 text-body text-banner-sub">
                合作委託、技術顧問，或只是打個招呼，24 小時內回覆。
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
