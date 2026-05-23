/**
 * SEO 技術揭露頁面
 *
 * 揭露本站所有 SEO 技術、架構與資料管線。
 * 資料從 SSOT 配置模組自動計算，確保數字永遠與實際設定同步。
 *
 * @created 2026-03-20
 * @updated 2026-04-06 - Core Web Vitals (FID→INP)、E-E-A-T 信號、PWA 快取統計
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Globe,
  FileJson,
  Search,
  Zap,
  Shield,
  Link2,
  Database,
  FileText,
  RefreshCw,
  Map,
  Bot,
  Code2,
  Layers,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { SEOHelmet } from '../components/SEOHelmet';
import { PageNavHeader } from '../components/PageNavHeader';
import { APP_ONLY_PAGE_SEO } from '../config/seo-metadata';
import { SEO_SCHEMA_REGISTRY } from '../config/seo-schema-registry';
import { SEO_BUILD_PIPELINE } from '../config/seo-build-pipeline';
import {
  SEO_PATHS,
  PRERENDER_PATHS,
  CURRENCY_SEO_PATHS,
  REVERSE_CURRENCY_SEO_PATHS,
  CONTENT_SEO_PATHS,
  SITE_CONFIG,
} from '../config/seo-paths';
import { RATES_API } from '../config/api-endpoints';
import { APP_INFO } from '../config/app-info';
import { staggerContainerVariants, staggerItemVariants, transitions } from '../config/animations';
import { contentPageTokens } from '../config/design-tokens';

// ─── SSOT 計算數據 ──────────────────────────────────────────────────────────────

const STATS = [
  {
    value: SEO_PATHS.length,
    unit: '個',
    label: '可索引 SEO 路徑',
    sub: 'Google 可爬取頁面',
    icon: Globe,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    value: PRERENDER_PATHS.length,
    unit: '頁',
    label: '靜態預渲染（SSG）',
    sub: '建置期 HTML 快照',
    icon: Layers,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    value: CURRENCY_SEO_PATHS.length + REVERSE_CURRENCY_SEO_PATHS.length,
    unit: '頁',
    label: '幣別落地頁',
    sub: '正向 + 反向匯率頁',
    icon: Link2,
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
  },
  {
    value: SEO_SCHEMA_REGISTRY.filter((schema) => schema.enabled).length,
    unit: '種',
    label: 'JSON-LD Schema',
    sub: '結構化資料類型',
    icon: FileJson,
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
  },
] as const;

// ─── 資料管線 ──────────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  {
    icon: Database,
    label: '臺灣銀行',
    sub: '官方牌告匯率來源',
    note: '現金 / 即期 四種報價',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  {
    icon: RefreshCw,
    label: 'GitHub Actions',
    sub: '自動化抓取排程',
    note: '每 5 分鐘同步一次',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Zap,
    label: 'jsDelivr CDN',
    sub: '全球 PoP 加速分發',
    note: '無請求限制 · ETag 支援',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    icon: Globe,
    label: `${APP_INFO.shortName} App`,
    sub: 'SSG 預渲染 + PWA',
    note: '可離線使用 · 即時更新',
    color: 'text-success',
    bg: 'bg-success/10',
  },
] as const;

// ─── 機器可讀檔案 ────────────────────────────────────────────────────────────────

const MACHINE_READABLE_FILES = [
  {
    name: 'sitemap.xml',
    desc: `涵蓋全部 ${SEO_PATHS.length} 個 SEO 路徑，含 lastmod、hreflang 與 image sitemap；不輸出 changefreq / priority`,
    url: `${SITE_CONFIG.url}sitemap.xml`,
    icon: Map,
    badge: `${SEO_PATHS.length} URLs`,
  },
  {
    name: 'robots.txt',
    desc: '精確控制爬蟲允許/禁止路徑，引導 Sitemap 位置',
    url: `${SITE_CONFIG.url}robots.txt`,
    icon: Bot,
    badge: 'Crawl Rules',
  },
  {
    name: 'llms.txt',
    desc: '機器可讀的純文字索引，供爬蟲與 LLM 工具理解站點結構',
    url: `${SITE_CONFIG.url}llms.txt`,
    icon: Bot,
    badge: 'Readable',
  },
  {
    name: 'llms-full.txt',
    desc: '完整站點內容快照，包含所有幣別頁說明',
    url: `${SITE_CONFIG.url}llms-full.txt`,
    icon: FileText,
    badge: 'Full Content',
  },
  {
    name: 'openapi.json',
    desc: 'OpenAPI 3.1 規格，描述公開匯率 API 端點',
    url: `${SITE_CONFIG.url}openapi.json`,
    icon: FileJson,
    badge: 'OpenAPI 3.1',
  },
] as const;

// ─── 技術特性 ──────────────────────────────────────────────────────────────────

const TECH_FEATURES = [
  {
    icon: Layers,
    title: 'SSG 靜態預渲染',
    desc: `${PRERENDER_PATHS.length} 頁在建置期轉為 HTML，首屏無 JS 白屏，爬蟲直接讀取完整內容。`,
    tech: 'vite-react-ssg',
  },
  {
    icon: Shield,
    title: 'PWA 離線支援',
    desc: '服務工作者（Service Worker）快取靜態資源，無網路時仍可查詢最後一筆匯率。',
    tech: 'Workbox + vite-plugin-pwa',
  },
  {
    icon: Search,
    title: 'ETag 條件式請求',
    desc: '匯率 API 支援 If-None-Match 標頭，相同資料回傳 304 Not Modified，省流量。',
    tech: 'jsDelivr CDN',
  },
  {
    icon: Globe,
    title: 'URL 標準化（301）',
    desc: '大寫 URL 自動 301 重定向至小寫，避免重複內容問題，保護 PageRank 集中。',
    tech: 'useUrlNormalization Hook',
  },
  {
    icon: Link2,
    title: 'Canonical 標籤',
    desc: '每頁明確宣告 canonical URL，防止 www / 無 www / trailing slash 重複。',
    tech: 'SEOHelmet 元件',
  },
  {
    icon: Zap,
    title: 'Core Web Vitals (2026)',
    desc: 'LCP < 2.5s、INP < 200ms、CLS < 0.1；Lighthouse CI 在 PR 自動驗證分數（FID 已轉換為 INP）。',
    tech: 'Lighthouse CI + INP Metric',
  },
  {
    icon: Shield,
    title: 'E-E-A-T 信號',
    desc: '作者身份 (Person schema)、發行日期 (Article schema)、發布者驗證 (Organization)，強化內容權威性與可信度。',
    tech: 'Schema.org Person + Organization',
  },
  {
    icon: Database,
    title: 'PWA 離線快取統計',
    desc: '50+ 項靜態資源預快取、最後一筆匯率儲存、Workbox 智慧更新策略，確保網路中斷時仍可查詢。',
    tech: 'Workbox + Service Worker',
  },
] as const;

// ─── SEO 路徑覆蓋 ──────────────────────────────────────────────────────────────

const PATH_CATEGORIES = [
  {
    label: '核心內容頁',
    count: CONTENT_SEO_PATHS.length,
    examples: ['/', '/faq/', '/about/', '/guide/', '/open-data/'],
    color: 'border border-primary/20 bg-primary/10 text-text',
    bar: 'bg-primary',
  },
  {
    label: '正向幣別頁（XXX→TWD）',
    count: CURRENCY_SEO_PATHS.length,
    examples: ['/usd-twd/', '/jpy-twd/', '/eur-twd/', '/hkd-twd/', '…'],
    color: 'border border-warning/20 bg-warning/10 text-text',
    bar: 'bg-warning',
  },
  {
    label: '反向幣別頁（TWD→XXX）',
    count: REVERSE_CURRENCY_SEO_PATHS.length,
    examples: ['/twd-usd/', '/twd-jpy/', '/twd-eur/', '/twd-hkd/', '…'],
    color: 'border border-success/20 bg-success/10 text-text',
    bar: 'bg-success',
  },
] as const;

// ─── E-E-A-T 信號（2026）────────────────────────────────────────────────────────

const EEAT_SIGNALS = [
  {
    title: '專業性 (Expertise)',
    items: [
      '作者身份：獨立開發者 + 金融科技專業',
      '內容深度：18 種貨幣、現金 & 即期雙套報價',
      '技術透明：完整 SEO 技術揭露（本頁）',
    ],
    icon: Search,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    title: '權威性 (Authoritativeness)',
    items: [
      '官方數據：台灣銀行牌告匯率（5 分鐘同步）',
      '公開 API：OpenAPI 3.1 規範供開發者整合',
      '機器可讀：sitemap.xml、robots.txt、llms.txt',
    ],
    icon: Shield,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    title: '可信度 (Trustworthiness)',
    items: [
      '隱私第一：無帳號、本機存儲；僅使用匿名流量分析並於隱私政策揭露',
      '安全傳輸：HTTPS、CSP 標頭、X-Frame-Options',
      '透明營運：公開隱私政策、費用結構',
    ],
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success/10',
  },
] as const;

// ─── 動畫設定 ──────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const sectionTransition = { ...transitions.smooth, delay: 0.05 };

// ─── 元件 ──────────────────────────────────────────────────────────────────────

export default function SeoTech() {
  const pageSeo = APP_ONLY_PAGE_SEO.seoTech;

  return (
    <div className="min-h-full bg-background text-text">
      <SEOHelmet
        title={pageSeo.title}
        description={pageSeo.description}
        pathname={pageSeo.pathname}
        robots={pageSeo.robots}
        breadcrumb={pageSeo.breadcrumb}
        jsonLd={pageSeo.jsonLd}
      />

      <div className={contentPageTokens.shell}>
        <PageNavHeader
          fallbackHref="/settings/"
          breadcrumbItems={[
            { label: '首頁', href: '/' },
            { label: '設定', href: '/settings/' },
            { label: 'SEO 技術揭露', href: '/seo-tech/' },
          ]}
        />
      </div>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-surface-elevated/60" />

        <div className="relative mx-auto w-full max-w-5xl px-4 pb-10 pt-2 sm:px-6 lg:px-8">
          {/* 標題區 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.05 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={contentPageTokens.badges.subtle}>
                <Search className="w-3 h-3" />
                SEO 技術揭露
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-2 tracking-tight">
              {APP_INFO.shortName} SEO 架構
            </h1>
            <p className="text-sm text-text-muted leading-relaxed max-w-prose">
              完整揭露 {APP_INFO.shortName} 所採用的所有搜尋引擎最佳化技術、資料架構與自動化流程。
              所有數字均從設定檔即時計算，永遠與實際部署狀態同步。
            </p>
          </motion.div>

          {/* Stats 卡片 */}
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3"
          >
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={staggerItemVariants}
                  transition={transitions.smooth}
                  className={`rounded-lg border p-4 ${stat.bg} ${stat.border}`}
                >
                  <div
                    className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated ${stat.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex items-baseline gap-0.5 mb-0.5">
                    <span className="text-2xl font-bold tabular-nums text-text">{stat.value}</span>
                    <span className="text-sm font-medium text-text">{stat.unit}</span>
                  </div>
                  <p className="text-xs font-semibold text-text">{stat.label}</p>
                  <p className="text-xs text-text mt-0.5">{stat.sub}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-16 sm:px-6 lg:px-8">
        {/* ─── 資料管線 ─────────────────────────────────────────────────── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          transition={sectionTransition}
        >
          <SectionHeader icon={RefreshCw} title="資料管線" />
          <div className="space-y-2">
            {PIPELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...transitions.smooth, delay: idx * 0.07 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${step.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{step.label}</span>
                      <span className="text-xs text-text truncate">{step.sub}</span>
                    </div>
                    <p className="text-xs text-text">{step.note}</p>
                  </div>
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <div className="flex-shrink-0 w-4 h-4 text-text-muted opacity-40">→</div>
                  )}
                </motion.div>
              );
            })}
          </div>
          <div className={`mt-3 ${contentPageTokens.surfaces.quiet}`}>
            <p className="text-xs text-text-muted leading-relaxed">
              <span className="font-medium text-primary">CDN 端點：</span>{' '}
              <a
                href={RATES_API.latestCdn}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-lg font-mono text-xs break-all transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {RATES_API.latestCdn}
              </a>
            </p>
          </div>
        </motion.section>

        {/* ─── SEO 路徑覆蓋 ─────────────────────────────────────────────── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          transition={sectionTransition}
        >
          <SectionHeader icon={Globe} title="SEO 路徑覆蓋" />
          <div className="space-y-3">
            {PATH_CATEGORIES.map((cat, idx) => {
              const pct = Math.round((cat.count / SEO_PATHS.length) * 100);
              return (
                <motion.div
                  key={cat.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...transitions.smooth, delay: idx * 0.08 }}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{cat.label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cat.color}`}>
                      {cat.count} 頁
                    </span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full mb-2 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${cat.bar}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.1 + 0.2 }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cat.examples.map((path) => (
                      <span
                        key={path}
                        className="font-mono text-xs bg-surface-elevated px-1.5 py-0.5 rounded-lg text-text-muted"
                      >
                        {path}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <p className="text-xs text-text-muted mt-2 pl-1">
            合計 {SEO_PATHS.length} 個可索引路徑，全部收錄於 sitemap.xml
          </p>
        </motion.section>

        {/* ─── JSON-LD Schema ─────────────────────────────────────────────── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          transition={sectionTransition}
        >
          <SectionHeader icon={FileJson} title="JSON-LD 結構化資料" />
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-2"
          >
            {SEO_SCHEMA_REGISTRY.filter((schema) => schema.enabled).map((schema) => {
              const Icon = schema.icon;
              return (
                <motion.div
                  key={schema.type}
                  variants={staggerItemVariants}
                  transition={transitions.smooth}
                  className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
                >
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-warning/10">
                    <Icon className="w-4 h-4 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs font-mono font-bold text-text bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded-lg">
                        {schema.type}
                      </code>
                      <span className="text-xs text-text-muted">{schema.pages}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">{schema.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* ─── 機器可讀檔案 ───────────────────────────────────────────────── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          transition={sectionTransition}
        >
          <SectionHeader icon={FileText} title="機器可讀檔案" />
          <div className="space-y-2">
            {MACHINE_READABLE_FILES.map((file, idx) => {
              const Icon = file.icon;
              return (
                <motion.a
                  key={file.name}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...transitions.smooth, delay: idx * 0.06 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface p-3.5"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="w-[18px] h-[18px] text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-bold">{file.name}</code>
                      <span className="text-xs border border-primary/20 bg-primary/10 text-text px-1.5 py-0.5 rounded-full font-medium">
                        {file.badge}
                      </span>
                    </div>
                    <p className="text-xs text-text mt-0.5 leading-relaxed line-clamp-2">
                      {file.desc}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
                </motion.a>
              );
            })}
          </div>
        </motion.section>

        {/* ─── 技術特性 ───────────────────────────────────────────────────── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          transition={sectionTransition}
        >
          <SectionHeader icon={Zap} title="核心技術特性" />
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-3"
          >
            {TECH_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  variants={staggerItemVariants}
                  transition={transitions.smooth}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold">{feat.title}</h3>
                        <span className="text-xs bg-surface-elevated border border-border px-1.5 py-0.5 rounded-lg text-text font-mono">
                          {feat.tech}
                        </span>
                      </div>
                      <p className="text-xs text-text leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* ─── E-E-A-T 信號（2026）─────────────────────────────────────── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          transition={sectionTransition}
        >
          <SectionHeader icon={Shield} title="E-E-A-T 信號強化（2026）" />
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            {EEAT_SIGNALS.map((signal) => {
              const Icon = signal.icon;
              return (
                <motion.div
                  key={signal.title}
                  variants={staggerItemVariants}
                  transition={transitions.smooth}
                  className={`rounded-lg border border-border p-4 ${signal.bg}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-5 h-5 ${signal.color}`} />
                    <h3 className="text-sm font-semibold">{signal.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {signal.items.map((item, idx) => (
                      <li key={idx} className="text-xs text-text flex gap-2">
                        <span className="flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </motion.div>
          <p className="text-xs text-text-muted mt-3 pl-1">
            Google 搜尋品質評估指南強調 E-E-A-T（專業性、權威性、可信度）為
            YMYL（您的錢或生活）內容評分的關鍵。{APP_INFO.shortName}{' '}
            透過透明化揭露、官方資料來源與隱私優先設計強化信號。
          </p>
        </motion.section>

        {/* ─── 建置腳本 ───────────────────────────────────────────────────── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          transition={sectionTransition}
        >
          <SectionHeader icon={Code2} title="Prebuild 自動化腳本" />
          <p className="text-xs text-text-muted mb-3 leading-relaxed">
            每次建置前依序執行 SEO / machine-readable 產線，產生所有必要靜態檔案並串上驗證 gate。
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            {SEO_BUILD_PIPELINE.map((script, idx) => (
              <div
                key={script.name}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx < SEO_BUILD_PIPELINE.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <span className="text-xs font-mono text-primary/60 w-4 text-right flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <code className="text-xs font-mono text-text block truncate">{script.name}</code>
                  <p className="text-xs text-text-muted">{script.desc}</p>
                </div>
                <code className="text-xs font-mono text-success flex-shrink-0 hidden sm:block">
                  {script.output}
                </code>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ─── 狀態機架構 ─────────────────────────────────────────────────── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          transition={sectionTransition}
        >
          <SectionHeader icon={Layers} title="SEO 狀態機架構" />
          <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
            {/* SSOT 層 */}
            <ArchLayer
              label="SSOT 層"
              color="bg-primary"
              items={['seo-paths.ts', 'seo-metadata.ts', 'api-endpoints.ts', 'app-info.ts']}
              desc="所有 SEO 資料的單一真相來源"
            />
            {/* Arrow */}
            <div className="flex items-center gap-2 px-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted">生成</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {/* 建置層 */}
            <ArchLayer
              label="Prebuild 層"
              color="bg-warning"
              items={['sitemap.xml', 'robots.txt', 'llms.txt', 'openapi.json']}
              desc="建置期自動生成靜態 SEO 檔案"
            />
            <div className="flex items-center gap-2 px-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted">渲染</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {/* SSG 層 */}
            <ArchLayer
              label="SSG 層"
              color="bg-success"
              items={[
                `${SEO_PATHS.length} SEO 頁面`,
                `${PRERENDER_PATHS.length} 預渲染`,
                'JSON-LD',
                'meta tags',
              ]}
              desc="靜態 HTML + 結構化資料注入"
            />
            <div className="flex items-center gap-2 px-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted">部署</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {/* 邊緣層 */}
            <ArchLayer
              label="邊緣層"
              color="bg-destructive"
              items={['Cloudflare CDN', 'Security Headers', 'Cache-Control', 'CSP']}
              desc="Cloudflare Workers 注入安全標頭"
            />
          </div>
        </motion.section>

        {/* ─── 相關資源 ───────────────────────────────────────────────────── */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          transition={sectionTransition}
        >
          <SectionHeader icon={Link2} title="相關資源" />
          <div className="space-y-2">
            <ResourceLink href={APP_INFO.github} label="原始碼" sub="haotool/app" external />
            <ResourceLink
              href={`${SITE_CONFIG.url}openapi.json`}
              label="OpenAPI 規格"
              sub="openapi.json"
              external
            />
            <ResourceLink
              href={`${SITE_CONFIG.url}sitemap.xml`}
              label="Sitemap"
              sub="sitemap.xml"
              external
            />
            <ResourceLink to="/open-data/" label="開放資料 API" sub="匯率資料開放 API 文件" />
          </div>
        </motion.section>
      </div>
    </div>
  );
}

// ─── 小型共用元件 ──────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <h2 className="text-base font-bold">{title}</h2>
    </div>
  );
}

function ArchLayer({
  label,
  color,
  items,
  desc,
}: {
  label: string;
  color: string;
  items: readonly string[];
  desc: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-xs font-semibold text-text-muted">{label}</span>
        <span className="text-xs text-text-muted opacity-60">— {desc}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-4">
        {items.map((item) => (
          <span
            key={item}
            className="font-mono text-xs bg-surface-elevated border border-border px-2 py-0.5 rounded-lg"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResourceLink({
  href,
  to,
  label,
  sub,
  external,
}: {
  href?: string;
  to?: string;
  label: string;
  sub: string;
  external?: boolean;
}) {
  const cls = contentPageTokens.links.row;

  const content = (
    <>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-text-muted">{sub}</p>
      </div>
      {external ? (
        <ExternalLink className="w-4 h-4 text-text-muted opacity-40 group-hover:opacity-100 transition-opacity" />
      ) : (
        <svg
          className="w-4 h-4 text-text-muted opacity-40 group-hover:opacity-100 transition-opacity"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {content}
    </a>
  );
}
