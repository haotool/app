/**
 * SEO 技術揭露頁面
 *
 * 揭露 RateWise 所有 SEO 技術、架構與資料管線。
 * 資料從 SSOT 配置模組自動計算，確保數字永遠與實際設定同步。
 *
 * @created 2026-03-20
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
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
import { APP_ONLY_PAGE_SEO, HOMEPAGE_HOW_TO } from '../config/seo-metadata';
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

// ─── JSON-LD Schema 類型 ────────────────────────────────────────────────────────

const SCHEMA_TYPES = [
  {
    type: 'WebSite',
    desc: '網站整體識別與 SearchAction 搜尋框',
    pages: '首頁',
    icon: Globe,
  },
  {
    type: 'SoftwareApplication',
    desc: '應用程式評分、平台、定價資訊',
    pages: '首頁',
    icon: Code2,
  },
  {
    type: 'Organization',
    desc: '組織聯絡資訊、社群連結、Logo',
    pages: '全站',
    icon: Shield,
  },
  {
    type: 'HowTo',
    desc: `匯率換算操作步驟說明（${HOMEPAGE_HOW_TO.steps.length} 步驟）`,
    pages: '首頁',
    icon: CheckCircle2,
  },
  {
    type: 'BreadcrumbList',
    desc: '頁面麵包屑路徑導覽結構',
    pages: '所有頁面',
    icon: Link2,
  },
  {
    type: 'Article',
    desc: '指南頁文章作者、發布日期、字數',
    pages: 'Guide / FAQ',
    icon: FileText,
  },
  {
    type: 'FinancialService',
    desc: '外匯換算金融服務描述',
    pages: '幣別落地頁',
    icon: Database,
  },
  {
    type: 'ImageObject',
    desc: 'OG 圖片授權、版權資訊',
    pages: '全站',
    icon: Layers,
  },
] as const;

// ─── SSOT 計算數據 ──────────────────────────────────────────────────────────────

const STATS = [
  {
    value: SEO_PATHS.length,
    unit: '個',
    label: '可索引 SEO 路徑',
    sub: 'Google 可爬取頁面',
    icon: Globe,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  {
    value: PRERENDER_PATHS.length,
    unit: '頁',
    label: '靜態預渲染（SSG）',
    sub: '建置期 HTML 快照',
    icon: Layers,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    value: CURRENCY_SEO_PATHS.length + REVERSE_CURRENCY_SEO_PATHS.length,
    unit: '頁',
    label: '幣別落地頁',
    sub: '正向 + 反向匯率頁',
    icon: Link2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    value: SCHEMA_TYPES.length,
    unit: '種',
    label: 'JSON-LD Schema',
    sub: '結構化資料類型',
    icon: FileJson,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
] as const;

// ─── 資料管線 ──────────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  {
    icon: Database,
    label: '臺灣銀行',
    sub: '官方牌告匯率來源',
    note: '現金 / 即期 四種報價',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    icon: RefreshCw,
    label: 'GitHub Actions',
    sub: '自動化抓取排程',
    note: '每 5 分鐘同步一次',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    icon: Zap,
    label: 'jsDelivr CDN',
    sub: '全球 PoP 加速分發',
    note: '無請求限制 · ETag 支援',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  {
    icon: Globe,
    label: 'RateWise App',
    sub: 'SSG 預渲染 + PWA',
    note: '可離線使用 · 即時更新',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
] as const;

// ─── 機器可讀檔案 ────────────────────────────────────────────────────────────────

const MACHINE_READABLE_FILES = [
  {
    name: 'sitemap.xml',
    desc: `涵蓋全部 ${SEO_PATHS.length} 個 SEO 路徑，含 lastmod 與 priority 欄位`,
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
    desc: 'AI 友善的純文字索引，供 LLM 爬蟲快速理解站點結構',
    url: `${SITE_CONFIG.url}llms.txt`,
    icon: Bot,
    badge: 'AI-Ready',
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
    title: 'Core Web Vitals',
    desc: 'LCP < 2.5s、FID < 100ms、CLS < 0.1；Lighthouse CI 在 PR 自動驗證分數。',
    tech: 'Lighthouse CI',
  },
] as const;

// ─── SEO 路徑覆蓋 ──────────────────────────────────────────────────────────────

const PATH_CATEGORIES = [
  {
    label: '核心內容頁',
    count: CONTENT_SEO_PATHS.length,
    examples: ['/', '/faq/', '/about/', '/guide/', '/open-data/'],
    color: 'bg-violet-100 text-violet-800',
    bar: 'bg-violet-500',
  },
  {
    label: '正向幣別頁（XXX→TWD）',
    count: CURRENCY_SEO_PATHS.length,
    examples: ['/usd-twd/', '/jpy-twd/', '/eur-twd/', '/hkd-twd/', '…'],
    color: 'bg-blue-100 text-blue-800',
    bar: 'bg-blue-500',
  },
  {
    label: '反向幣別頁（TWD→XXX）',
    count: REVERSE_CURRENCY_SEO_PATHS.length,
    examples: ['/twd-usd/', '/twd-jpy/', '/twd-eur/', '/twd-hkd/', '…'],
    color: 'bg-emerald-100 text-emerald-800',
    bar: 'bg-emerald-500',
  },
] as const;

// ─── 建置腳本 ──────────────────────────────────────────────────────────────────

const BUILD_SCRIPTS = [
  { name: 'generate-sitemap.mjs', output: 'sitemap.xml', desc: '42 個 SEO URL + lastmod' },
  { name: 'generate-robots-txt.mjs', output: 'robots.txt', desc: 'Crawl 規則 + Sitemap 連結' },
  { name: 'generate-llms-txt.mjs', output: 'llms.txt', desc: 'AI 爬蟲友善純文字索引' },
  { name: 'generate-llms-full-txt.mjs', output: 'llms-full.txt', desc: '完整頁面內容快照' },
  { name: 'generate-api-json.mjs', output: 'api/latest.json', desc: '公開匯率 JSON 資料範例' },
  { name: 'generate-openapi.mjs', output: 'openapi.json', desc: 'OpenAPI 3.1 API 規格書' },
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
    <div className="min-h-screen bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]">
      <SEOHelmet
        title={pageSeo.title}
        description={pageSeo.description}
        pathname={pageSeo.pathname}
        robots={pageSeo.robots}
      />

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* 背景裝飾 */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/8 via-transparent to-blue-600/8 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative px-4 pt-6 pb-10">
          {/* 返回按鈕 */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={transitions.default}
          >
            <Link
              to="/settings/"
              className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors mb-6"
              aria-label="回到設定"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>設定</span>
            </Link>
          </motion.div>

          {/* 標題區 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.smooth, delay: 0.05 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Search className="w-3 h-3" />
                SEO 技術揭露
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-2 tracking-tight">RateWise SEO 架構</h1>
            <p className="text-sm text-[rgb(var(--color-text-muted))] leading-relaxed max-w-prose">
              完整揭露 RateWise 所採用的所有搜尋引擎最佳化技術、資料架構與自動化流程。
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
                  className={`rounded-2xl border p-4 ${stat.bg} ${stat.border}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 bg-white/70 ${stat.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex items-baseline gap-0.5 mb-0.5">
                    <span className={`text-2xl font-bold tabular-nums ${stat.color}`}>
                      {stat.value}
                    </span>
                    <span className={`text-sm font-medium ${stat.color}`}>{stat.unit}</span>
                  </div>
                  <p className="text-xs font-semibold text-[rgb(var(--color-text))]">
                    {stat.label}
                  </p>
                  <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">{stat.sub}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      <div className="px-4 pb-16 space-y-8">
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
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${step.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{step.label}</span>
                      <span className="text-xs text-[rgb(var(--color-text-muted))] truncate">
                        {step.sub}
                      </span>
                    </div>
                    <p className="text-xs text-[rgb(var(--color-text-muted))]">{step.note}</p>
                  </div>
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <div className="flex-shrink-0 w-4 h-4 text-[rgb(var(--color-text-muted))] opacity-40">
                      →
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-xs text-[rgb(var(--color-text-muted))] leading-relaxed">
              <span className="font-medium text-primary">CDN 端點：</span>{' '}
              <a
                href={RATES_API.latestCdn}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs break-all hover:text-primary transition-colors"
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
                  className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{cat.label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cat.color}`}>
                      {cat.count} 頁
                    </span>
                  </div>
                  <div className="h-1.5 bg-[rgb(var(--color-border))] rounded-full mb-2 overflow-hidden">
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
                        className="font-mono text-xs bg-[rgb(var(--color-background))] px-1.5 py-0.5 rounded-lg text-[rgb(var(--color-text-muted))]"
                      >
                        {path}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <p className="text-xs text-[rgb(var(--color-text-muted))] mt-2 pl-1">
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
            {SCHEMA_TYPES.map((schema) => {
              const Icon = schema.icon;
              return (
                <motion.div
                  key={schema.type}
                  variants={staggerItemVariants}
                  transition={transitions.smooth}
                  className="flex items-start gap-3 p-3 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]"
                >
                  <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs font-mono font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-lg">
                        {schema.type}
                      </code>
                      <span className="text-xs text-[rgb(var(--color-text-muted))]">
                        {schema.pages}
                      </span>
                    </div>
                    <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1 leading-relaxed">
                      {schema.desc}
                    </p>
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
                  className="flex items-center gap-3 p-3.5 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-blue-600 w-[18px] h-[18px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-bold">{file.name}</code>
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                        {file.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5 leading-relaxed line-clamp-2">
                      {file.desc}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[rgb(var(--color-text-muted))] opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
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
                  className="p-4 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold">{feat.title}</h3>
                        <span className="text-xs bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] px-1.5 py-0.5 rounded-lg text-[rgb(var(--color-text-muted))] font-mono">
                          {feat.tech}
                        </span>
                      </div>
                      <p className="text-xs text-[rgb(var(--color-text-muted))] leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
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
          <p className="text-xs text-[rgb(var(--color-text-muted))] mb-3 leading-relaxed">
            每次建置前自動執行 6 支腳本，產生所有 SEO 必要靜態檔案，確保內容永遠與 SSOT 設定同步。
          </p>
          <div className="rounded-2xl border border-[rgb(var(--color-border))] overflow-hidden">
            {BUILD_SCRIPTS.map((script, idx) => (
              <div
                key={script.name}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx < BUILD_SCRIPTS.length - 1 ? 'border-b border-[rgb(var(--color-border))]' : ''
                }`}
              >
                <span className="text-xs font-mono text-primary/60 w-4 text-right flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <code className="text-xs font-mono text-[rgb(var(--color-text))] block truncate">
                    {script.name}
                  </code>
                  <p className="text-xs text-[rgb(var(--color-text-muted))]">{script.desc}</p>
                </div>
                <code className="text-xs font-mono text-emerald-600 flex-shrink-0 hidden sm:block">
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
          <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4 space-y-4">
            {/* SSOT 層 */}
            <ArchLayer
              label="SSOT 層"
              color="bg-violet-500"
              items={['seo-paths.ts', 'seo-metadata.ts', 'api-endpoints.ts', 'app-info.ts']}
              desc="所有 SEO 資料的單一真相來源"
            />
            {/* Arrow */}
            <div className="flex items-center gap-2 px-2">
              <div className="flex-1 h-px bg-[rgb(var(--color-border))]" />
              <span className="text-xs text-[rgb(var(--color-text-muted))]">生成</span>
              <div className="flex-1 h-px bg-[rgb(var(--color-border))]" />
            </div>
            {/* 建置層 */}
            <ArchLayer
              label="Prebuild 層"
              color="bg-blue-500"
              items={['sitemap.xml', 'robots.txt', 'llms.txt', 'openapi.json']}
              desc="建置期自動生成靜態 SEO 檔案"
            />
            <div className="flex items-center gap-2 px-2">
              <div className="flex-1 h-px bg-[rgb(var(--color-border))]" />
              <span className="text-xs text-[rgb(var(--color-text-muted))]">渲染</span>
              <div className="flex-1 h-px bg-[rgb(var(--color-border))]" />
            </div>
            {/* SSG 層 */}
            <ArchLayer
              label="SSG 層"
              color="bg-emerald-500"
              items={[
                `${SEO_PATHS.length} SEO 頁面`,
                `${PRERENDER_PATHS.length} 預渲染`,
                'JSON-LD',
                'meta tags',
              ]}
              desc="靜態 HTML + 結構化資料注入"
            />
            <div className="flex items-center gap-2 px-2">
              <div className="flex-1 h-px bg-[rgb(var(--color-border))]" />
              <span className="text-xs text-[rgb(var(--color-text-muted))]">部署</span>
              <div className="flex-1 h-px bg-[rgb(var(--color-border))]" />
            </div>
            {/* 邊緣層 */}
            <ArchLayer
              label="邊緣層"
              color="bg-orange-500"
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
        <span className="text-xs font-semibold text-[rgb(var(--color-text-muted))]">{label}</span>
        <span className="text-xs text-[rgb(var(--color-text-muted))] opacity-60">— {desc}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-4">
        {items.map((item) => (
          <span
            key={item}
            className="font-mono text-xs bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] px-2 py-0.5 rounded-lg"
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
  const cls =
    'flex items-center justify-between px-4 py-3 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] group hover:bg-primary/5 transition-colors';

  const content = (
    <>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[rgb(var(--color-text-muted))]">{sub}</p>
      </div>
      {external ? (
        <ExternalLink className="w-4 h-4 text-[rgb(var(--color-text-muted))] opacity-40 group-hover:opacity-100 transition-opacity" />
      ) : (
        <svg
          className="w-4 h-4 text-[rgb(var(--color-text-muted))] opacity-40 group-hover:opacity-100 transition-opacity"
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
