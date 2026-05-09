import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { PageNavHeader } from '../components/PageNavHeader';
import { AnswerCapsule } from '../components/AnswerCapsule';
import { MailtoLink } from '../components/MailtoLink';
import { OPEN_DATA_PAGE_SEO } from '../config/seo-metadata';
import { APP_INFO } from '../config/app-info';
import { CDN_DATA_BASE, RATES_API, RAW_DATA_BASE } from '../config/api-endpoints';
import { buildPublicRateProviderMetadata } from '../config/rateProviderPublicMetadata';
import { SITE_CONFIG } from '../config/seo-paths';
import rateModeStrategies from '../config/rate-mode-strategies.json';
import { CURRENCY_DEFINITIONS } from '../features/ratewise/constants';

// ─── 資料來源架構 ──────────────────────────────────────────────────────────────

const DATA_SOURCES = [
  {
    label: '原始來源',
    name: '臺灣銀行牌告匯率',
    url: 'https://rate.bot.com.tw/xrt',
    note: '官方每日公布，現金買入／賣出、即期買入／賣出四種報價',
  },
  {
    label: '換錢所來源',
    name: 'MoneyBox (明洞換匯所聯盟)',
    url: 'https://moneybox-exchange.com/zh-CHT/exchange',
    note: '目前用於 KRW 換錢所現金匯率，獨立保存 current 與 moneybox-history 快照',
  },
  {
    label: '同步機制',
    name: 'GitHub Actions',
    url: RATES_API.actionsUrl,
    note: '每 5 分鐘自動抓取台銀最新牌告，寫入 data 分支 JSON',
  },
  {
    label: '建議端點',
    name: 'jsDelivr CDN',
    url: 'https://cdn.jsdelivr.net',
    note: '全球 PoP 加速，無請求上限，支援 ETag 條件式請求。data 分支推送後自動 Purge，新鮮度約 5 分鐘',
  },
  {
    label: '備援端點',
    name: 'GitHub Raw',
    url: 'https://raw.githubusercontent.com',
    note: '無快取，每次直接取最新資料。未認證 IP 每小時 60 次上限',
  },
] as const;

// ─── API 端點 ──────────────────────────────────────────────────────────────────

const API_ENDPOINTS = [
  {
    method: 'GET',
    path: '/public/rates/latest.json',
    cdnUrl: RATES_API.latestCdn,
    rawUrl: RATES_API.latestRaw,
    description: '最新匯率',
    badge: '每 5 分鐘更新',
    note: '包含 17 種外幣的現金與即期四種報價，TWD 為基準幣；App 匯率模式請依 rateModeStrategies 選取 buy / sell / mid 欄位。',
  },
  {
    method: 'GET',
    path: '/public/rates/history/{YYYY-MM-DD}.json',
    cdnUrl: RATES_API.historyCdnExample,
    rawUrl: RATES_API.historyRawExample,
    description: '歷史匯率',
    badge: '指定日期',
    note: '以日期替換 {YYYY-MM-DD}。若該日無資料（如假日），回傳 404。',
  },
] as const;

// ─── 速率限制 ──────────────────────────────────────────────────────────────────

const RATE_LIMIT_ITEMS = [
  {
    source: 'jsDelivr CDN',
    limit: '無明確上限',
    note: '遵守 jsDelivr 服務條款；禁止爬蟲式大量歷史批次抓取',
  },
  {
    source: 'GitHub Raw',
    limit: '60 req/hr（未認證）',
    note: '超出返回 HTTP 429；建議以 CDN 為主',
  },
  {
    source: '資料更新頻率',
    limit: '每 5 分鐘',
    note: '建議 client 端快取 5 分鐘（與 Actions 更新週期一致）',
  },
] as const;

// ─── 使用範例 ──────────────────────────────────────────────────────────────────

const CODE_EXAMPLES = [
  {
    id: 'curl',
    label: 'cURL',
    language: 'bash',
    code: `# 最新匯率
curl -s "${RATES_API.latestCdn}" | python3 -m json.tool

# 歷史匯率（2026-03-19）
curl -s "${RATES_API.historyCdnExample}"`,
  },
  {
    id: 'js',
    label: 'JavaScript',
    language: 'javascript',
    code: `const res = await fetch("${RATES_API.latestCdn}");
const data = await res.json();

const rateMode = "auto"; // auto | sell | mid，對應 App 設定
const rateType = "cash"; // cash | spot，對應使用者選擇

function pickRate(detail, side) {
  if (rateMode === "mid") {
    return (detail[rateType].buy + detail[rateType].sell) / 2;
  }
  if (rateMode === "sell") {
    return detail[rateType].sell;
  }
  return side === "from" ? detail[rateType].buy : detail[rateType].sell;
}

const usdRate = pickRate(data.details.USD, "to");
console.log(\`1000 TWD = \${1000 / usdRate} USD\`);

console.log(data.details.USD.cash.sell, data.details.USD.cash.buy);`,
  },
  {
    id: 'python',
    label: 'Python',
    language: 'python',
    code: `import requests

data = requests.get("${RATES_API.latestCdn}").json()

rate_mode = "auto"  # auto | sell | mid，對應 App 設定
rate_type = "cash"  # cash | spot，對應使用者選擇

def pick_rate(detail, side):
    if rate_mode == "mid":
        return (detail[rate_type]["buy"] + detail[rate_type]["sell"]) / 2
    if rate_mode == "sell":
        return detail[rate_type]["sell"]
    return detail[rate_type]["buy"] if side == "from" else detail[rate_type]["sell"]

usd_rate = pick_rate(data["details"]["USD"], "to")
print(f"1000 TWD = {1000 / usd_rate} USD")

history = requests.get("${RATES_API.historyCdnExample}").json()
print(history["details"]["USD"]["spot"]["sell"])`,
  },
  {
    id: 'html',
    label: 'Deep Link',
    language: 'html',
    code: `<!-- 主要可索引 URL：金額落地頁（建議用於內容頁、SEO、AI 引用） -->
<a href="${SITE_CONFIG.url}usd-twd/1000/">
  查看 1000 USD 換多少台幣
</a>

<!-- 互動 deep link：首頁 query 參數（建議用於 App 內導流或分享當下狀態） -->
<a href="${SITE_CONFIG.url}?amount=1000&from=USD&to=TWD">
  查看 1000 USD 換多少台幣
</a>

<!-- URL 參數（首頁互動模式） -->
<!-- amount  換算金額（數字）      -->
<!-- from    來源幣別（ISO 三碼）   -->
<!-- to      目標幣別（預設 TWD）   -->`,
  },
] as const;

// ─── 資料欄位說明 ──────────────────────────────────────────────────────────────

const SCHEMA_FIELDS = [
  { field: 'timestamp', type: 'string (ISO 8601)', description: '資料抓取時間（UTC）' },
  {
    field: 'updateTime',
    type: 'string',
    description: '台灣銀行牌告顯示時間，台灣時間（UTC+8），例如 2026/05/08 01:25:48',
  },
  { field: 'source', type: 'string', description: '固定為「Taiwan Bank (臺灣銀行牌告匯率)」' },
  { field: 'base', type: 'string', description: '基準幣，固定為 "TWD"' },
  {
    field: 'rates',
    type: 'object',
    description:
      '相容舊版的簡化參考匯率；App 與 API 新整合應優先使用 details 搭配 rateModeStrategies',
  },
  { field: 'details', type: 'object', description: '各幣別完整四種報價（cash/spot × buy/sell）' },
  {
    field: 'details.{CODE}.cash.buy',
    type: 'number',
    description: '現金買入：銀行收購外幣現鈔（你拿外幣換台幣）',
  },
  {
    field: 'details.{CODE}.cash.sell',
    type: 'number',
    description: '現金賣出：銀行賣出外幣現鈔（你拿台幣換外幣現金）',
  },
  { field: 'details.{CODE}.spot.buy', type: 'number', description: '即期買入：電匯匯款回台灣' },
  { field: 'details.{CODE}.spot.sell', type: 'number', description: '即期賣出：電匯從台灣匯出' },
] as const;

const RATE_MODE_STRATEGY_ROWS = Object.entries(rateModeStrategies).map(([mode, strategy]) => ({
  mode,
  name: strategy.label,
  from: strategy.fromCurrencyField,
  to: strategy.toCurrencyField,
  description: strategy.description,
}));

const BANK_PROVIDER_ACTIVATION_NOTE = 'bank provider 超過一家';

const SUPPORTED_CURRENCIES = Object.entries(CURRENCY_DEFINITIONS).map(([code, def]) => ({
  code,
  name: code === 'TWD' ? `${def.name}（基準幣）` : def.name,
}));

const PUBLIC_PROVIDER_METADATA = buildPublicRateProviderMetadata({
  dataBaseUrl: `${RAW_DATA_BASE}/public/rates`,
  cdnBaseUrl: `${CDN_DATA_BASE}/public/rates`,
  supportedCurrencies: SUPPORTED_CURRENCIES.map((currency) => currency.code),
});

const PROVIDER_PATH_METADATA = buildPublicRateProviderMetadata({
  dataBaseUrl: '/public/rates',
  supportedCurrencies: SUPPORTED_CURRENCIES.map((currency) => currency.code),
});

const EXCHANGE_SHOP_PROVIDER_ENDPOINTS = PUBLIC_PROVIDER_METADATA.providers.find(
  (provider) => provider.sourceKind === 'exchange-shop',
);
const EXCHANGE_SHOP_PROVIDER_PATHS = PROVIDER_PATH_METADATA.providers.find(
  (provider) => provider.providerId === EXCHANGE_SHOP_PROVIDER_ENDPOINTS?.providerId,
);

const PROVIDER_API_ENDPOINTS = EXCHANGE_SHOP_PROVIDER_ENDPOINTS
  ? [
      {
        method: 'GET',
        path: EXCHANGE_SHOP_PROVIDER_PATHS?.currentEndpoint ?? '/public/rates/moneybox.json',
        cdnUrl: EXCHANGE_SHOP_PROVIDER_ENDPOINTS.cdnCurrentEndpoint ?? RATES_API.moneyboxCdn,
        rawUrl: EXCHANGE_SHOP_PROVIDER_ENDPOINTS.currentEndpoint,
        description: `${EXCHANGE_SHOP_PROVIDER_ENDPOINTS.shortName} 最新換錢所匯率`,
        badge: 'KRW 換錢所',
        note: `${EXCHANGE_SHOP_PROVIDER_ENDPOINTS.shortName} 以 KRW 為基準；目前 App 只在 KRW 相關換算啟用，且換錢所來源固定視為現金匯率。`,
      },
      {
        method: 'GET',
        path:
          EXCHANGE_SHOP_PROVIDER_PATHS?.historyEndpoint ??
          '/public/rates/moneybox-history/{YYYY-MM-DD}.json',
        cdnUrl:
          EXCHANGE_SHOP_PROVIDER_ENDPOINTS.cdnHistoryEndpoint ??
          RATES_API.moneyboxHistoryCdnExample,
        rawUrl: EXCHANGE_SHOP_PROVIDER_ENDPOINTS.historyEndpoint,
        description: `${EXCHANGE_SHOP_PROVIDER_ENDPOINTS.shortName} 歷史換錢所匯率`,
        badge: '指定日期',
        note: '以日期替換 {YYYY-MM-DD}。此路徑與台銀 history 分離，避免銀行與換錢所歷史資料語意混用。',
      },
    ]
  : [];

const OPEN_DATA_API_ENDPOINTS = [...API_ENDPOINTS, ...PROVIDER_API_ENDPOINTS] as const;

const PROVIDER_CONTRACT_ROWS = PUBLIC_PROVIDER_METADATA.providers.map((provider) => ({
  providerId: provider.providerId,
  sourceKind: provider.sourceKind,
  name: provider.name,
  status:
    provider.sourceKind === 'bank'
      ? '目前唯一銀行 provider'
      : `${provider.supportedCurrencies.join(', ')} 換錢所現金匯率`,
  endpoints: `${provider.currentEndpoint} + ${provider.historyEndpoint}`,
}));

// ─── 子元件 ────────────────────────────────────────────────────────────────────

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? '已複製' : '複製'}
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors ${
        copied
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-surface-elevated text-text-muted hover:text-text'
      } ${className}`}
    >
      {copied ? (
        <>
          <svg
            aria-hidden="true"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          已複製
        </>
      ) : (
        <>
          <svg
            aria-hidden="true"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          複製
        </>
      )}
    </button>
  );
}

function TabbedCodeExamples() {
  const [activeId, setActiveId] = useState<string>(CODE_EXAMPLES[0].id);

  return (
    <div className="max-w-full overflow-hidden rounded-xl border border-surface-border">
      {/* Tab bar */}
      <div className="flex min-w-0 items-center gap-0 overflow-x-auto border-b border-surface-border bg-surface-elevated">
        {CODE_EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setActiveId(ex.id)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeId === ex.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            {ex.label}
          </button>
        ))}
        <div className="sticky right-0 ml-auto bg-surface-elevated/95 pr-3 backdrop-blur-sm">
          <CopyButton
            text={
              (CODE_EXAMPLES.find((example) => example.id === activeId) ?? CODE_EXAMPLES[0]).code
            }
          />
        </div>
      </div>
      {/* 所有 code panel 保留在 DOM，讓 prerender HTML 與輔助工具可讀取完整內容。 */}
      {CODE_EXAMPLES.map((example) => {
        const isActive = example.id === activeId;
        return (
          <pre
            key={example.id}
            role="region"
            aria-label={`程式碼範例：${example.label}`}
            hidden={!isActive}
            className="max-w-full overflow-x-auto bg-surface p-5 text-sm leading-relaxed text-text"
          >
            <code>{example.code}</code>
          </pre>
        );
      })}
    </div>
  );
}

function UrlCopyRow({
  label,
  url,
  recommended = false,
}: {
  label: string;
  url: string;
  recommended?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {label}
        </span>
        {recommended && (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
            建議
          </span>
        )}
      </div>
      <div className="flex min-w-0 items-center gap-2 rounded bg-surface-elevated px-3 py-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 break-all font-mono text-sm text-primary hover:underline"
        >
          {url}
        </a>
        <CopyButton text={url} className="shrink-0" />
      </div>
    </div>
  );
}

interface ResourceCardItem {
  title: string;
  desc: string;
  href: string;
  label: string;
  external: boolean;
}

function ResourceCard({ item }: { item: ResourceCardItem }) {
  const className =
    'group rounded-xl border border-surface-border bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-surface-elevated';
  const content = (
    <>
      <div className="mb-1 min-w-0 break-words font-semibold text-text group-hover:text-primary">
        {item.title}
      </div>
      <div className="mb-2 min-w-0 break-words text-sm text-text-muted">{item.desc}</div>
      <div className="min-w-0 break-all font-mono text-xs text-primary">{item.label}</div>
    </>
  );

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link to={item.href} className={className}>
      {content}
    </Link>
  );
}

// ─── 頁面主體 ──────────────────────────────────────────────────────────────────

const OpenData = () => {
  const HOW_TO = OPEN_DATA_PAGE_SEO.howTo;
  const { t } = useTranslation();

  return (
    <>
      <SEOHelmet
        title={OPEN_DATA_PAGE_SEO.title}
        description={OPEN_DATA_PAGE_SEO.description}
        pathname={OPEN_DATA_PAGE_SEO.pathname}
        breadcrumb={OPEN_DATA_PAGE_SEO.breadcrumb}
        howTo={HOW_TO}
        jsonLd={OPEN_DATA_PAGE_SEO.jsonLd}
        ogType="article"
      />

      <div className="min-h-screen bg-page-gradient">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          {/* 頁面頂部導航：返回 + 麵包屑（PageNavHeader SSOT 模組）。 */}
          <PageNavHeader
            breadcrumbItems={[
              { label: t('nav.home'), href: '/' },
              { label: t('settings.openDataApi'), href: '/open-data/' },
            ]}
          />

          {/* ── Hero ── */}
          <div className="mb-10">
            <h1 className="mb-3 text-4xl font-bold text-text">開放資料 API</h1>
            <p className="mb-4 max-w-2xl text-lg text-text-muted">
              台灣銀行牌告匯率 JSON 端點，免費、免 API Key、免帳號。
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                `${SUPPORTED_CURRENCIES.length} 種幣別`,
                '每 5 分鐘更新',
                '無需 API Key',
                'ETag 支援',
                'CDN 全球加速',
              ].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-surface-border bg-surface-elevated px-3 py-1 text-xs font-medium text-text-muted"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <AnswerCapsule items={OPEN_DATA_PAGE_SEO.answerCapsule ?? []} />

          {/* ── 資料管線 ── */}
          <section className="mb-12">
            <h2 className="mb-5 text-2xl font-semibold text-text">資料管線</h2>

            {/* 流程圖 */}
            <div className="mb-5 max-w-full overflow-hidden rounded-xl border border-surface-border bg-surface p-5">
              <div className="flex min-w-0 flex-col items-center gap-2 font-mono text-sm sm:flex-row sm:flex-wrap sm:justify-center sm:gap-0">
                {[
                  {
                    label: '臺灣銀行',
                    sub: 'rate.bot.com.tw',
                    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                  },
                  null,
                  {
                    label: 'GitHub Actions',
                    sub: '每 5 分鐘',
                    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                  },
                  null,
                  {
                    label: 'data 分支',
                    sub: 'latest.json / history/',
                    color:
                      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
                  },
                  null,
                  {
                    label: 'jsDelivr CDN',
                    sub: '全球加速',
                    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                  },
                  null,
                  {
                    label: '你的應用',
                    sub: 'fetch / curl',
                    color: 'bg-surface-elevated border border-surface-border text-text',
                  },
                ].map((item, i) =>
                  item === null ? (
                    <div key={i} className="text-text-muted sm:mx-1">
                      →
                    </div>
                  ) : (
                    <div
                      key={i}
                      className={`max-w-full rounded-lg px-3 py-2 text-center ${item.color}`}
                    >
                      <div className="font-semibold">{item.label}</div>
                      <div className="break-all text-xs opacity-75">{item.sub}</div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {DATA_SOURCES.map((src) => (
                <div
                  key={src.label}
                  className="rounded-lg border border-surface-border bg-surface p-4"
                >
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {src.label}
                  </div>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline"
                  >
                    {src.name}
                  </a>
                  <p className="mt-1 min-w-0 break-words text-sm text-text-muted">{src.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 min-w-0 break-words rounded-lg border border-surface-border bg-surface-elevated p-4 text-sm text-text-muted">
              <span className="font-semibold text-text">快取建議</span>
              ：CDN 端點支援{' '}
              <code className="rounded bg-surface px-1 font-mono text-xs">If-None-Match</code> ETag
              條件式請求， 資料未變時回傳 304（零 body），可節省約 5 KB／次。建議 client 端快取 5
              分鐘，避免無意義重複請求。
            </div>

            {/* ── 資料新鮮度與時間戳記說明 ── */}
            <div className="mt-6">
              <h3 className="mb-3 text-base font-semibold text-text">資料新鮮度與時間戳記說明</h3>

              {/* 兩個時間欄位對照 */}
              <div className="mb-4 max-w-full overflow-x-auto rounded-xl border border-surface-border">
                <table className="min-w-[42rem] text-sm" aria-label="時間戳記欄位說明">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-elevated">
                      <th className="px-4 py-3 text-left font-semibold text-text">欄位</th>
                      <th className="px-4 py-3 text-left font-semibold text-text">意義</th>
                      <th className="px-4 py-3 text-left font-semibold text-text">更新時機</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border bg-surface">
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs text-primary">updateTime</td>
                      <td className="px-4 py-3 break-words text-text">
                        台銀匯率於本系統最後一次<strong>實際變動</strong>的時間（台灣時區）
                      </td>
                      <td className="px-4 py-3 break-words text-text-muted">
                        僅在 GitHub Actions 偵測到匯率數值與前次不同時才更新；台銀未發布新牌告時即使
                        Actions 持續執行，此欄位也不會前進
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-xs text-primary">timestamp</td>
                      <td className="px-4 py-3 text-text">同上，UTC ISO 8601 格式</td>
                      <td className="px-4 py-3 text-text-muted">與 updateTime 同步更新</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 核心說明 */}
              <div className="space-y-3">
                <div className="min-w-0 rounded-lg border border-surface-border bg-surface p-4 text-sm leading-relaxed">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      變動偵測機制
                    </span>
                  </div>
                  <p className="break-words text-text">
                    GitHub Actions 每 5 分鐘抓取台銀 CSV 後，會將本次各幣別匯率與前次儲存的
                    <code className="mx-1 rounded bg-surface-elevated px-1 font-mono text-xs">
                      rates
                    </code>
                    物件進行 JSON 字串比對。若完全相同，腳本立即結束、不寫檔、不
                    commit；只有在至少一個幣別數值發生變化時，才會寫入新的
                    <code className="mx-1 rounded bg-surface-elevated px-1 font-mono text-xs">
                      latest.json
                    </code>
                    並更新
                    <code className="mx-1 rounded bg-surface-elevated px-1 font-mono text-xs">
                      updateTime
                    </code>
                    。
                  </p>
                </div>

                <div className="min-w-0 rounded-lg border border-surface-border bg-surface p-4 text-sm leading-relaxed">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      為何來源時間與刷新時間差距較大？
                    </span>
                  </div>
                  <p className="break-words text-text">
                    應用介面顯示的「<strong>來源</strong>」時間對應
                    <code className="mx-1 rounded bg-surface-elevated px-1 font-mono text-xs">
                      updateTime
                    </code>
                    ，代表台銀牌告上次實際更新的時刻；「<strong>刷新</strong>
                    」時間則是用戶端瀏覽器本次成功取得資料的時刻。臺灣銀行通常每個交易日更新牌告數次（多集中於開盤後），非交易時段、例假日或銀行內部尚未發布新牌告時，
                    <code className="mx-1 rounded bg-surface-elevated px-1 font-mono text-xs">
                      updateTime
                    </code>
                    不會變動，因此兩者之間出現數小時乃至跨日的落差屬預期行為，並非資料延遲或系統異常。
                  </p>
                </div>

                <div className="min-w-0 rounded-lg border border-surface-border bg-surface p-4 text-sm leading-relaxed">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                      Actions 排程說明
                    </span>
                  </div>
                  <p className="break-words text-text">
                    排程使用標準 cron 語法{' '}
                    <code className="rounded bg-surface-elevated px-1 font-mono text-xs">
                      */5 * * * *
                    </code>
                    ，理論間隔 5 分鐘。受 GitHub Actions 公共執行器佇列影響，實際觸發可能有 1–10
                    分鐘的不確定延遲，無法保證嚴格等時。若需高精度即時匯率，建議直接訂閱台銀官方牌告
                    API 或金融數據服務商。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── API 端點 ── */}
          <section className="mb-12">
            <h2 className="mb-2 text-2xl font-semibold text-text">API 端點</h2>
            <p className="mb-5 text-text-muted">HTTP GET，無需認證，直接請求。</p>

            <div className="space-y-5">
              {OPEN_DATA_API_ENDPOINTS.map((ep) => (
                <div
                  key={ep.path}
                  className="rounded-xl border border-surface-border bg-surface p-5"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      {ep.method}
                    </span>
                    <code className="rounded bg-surface-elevated px-2 py-0.5 font-mono text-sm text-text">
                      {ep.path}
                    </code>
                    <span className="font-medium text-text">{ep.description}</span>
                    <span className="rounded-full border border-surface-border px-2 py-0.5 text-xs text-text-muted">
                      {ep.badge}
                    </span>
                  </div>
                  <p className="mb-4 text-sm text-text-muted">{ep.note}</p>
                  <div className="space-y-2">
                    <UrlCopyRow label="CDN（jsDelivr）" url={ep.cdnUrl} recommended />
                    <UrlCopyRow label="備援（GitHub Raw）" url={ep.rawUrl} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 min-w-0 break-words rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              完整 OpenAPI 3.1 規格：
              <a
                href="/ratewise/openapi.json"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 break-all font-mono text-primary hover:underline"
              >
                /ratewise/openapi.json
              </a>
            </div>
          </section>

          {/* ── 快速上手範例 ── */}
          <section className="mb-12">
            <h2 className="mb-2 text-2xl font-semibold text-text">快速上手</h2>
            <p className="mb-5 text-text-muted">
              選擇語言，直接複製執行。範例使用 2026-03-19 真實資料。
            </p>
            <TabbedCodeExamples />
          </section>

          {/* ── 資料格式 ── */}
          <section className="mb-12">
            <h2 className="mb-2 text-2xl font-semibold text-text">資料格式</h2>
            <p className="mb-5 text-sm text-text-muted">
              回應為 JSON，
              <code className="rounded bg-surface-elevated px-1 font-mono">
                Content-Type: application/json
              </code>
              。
            </p>

            <div className="mb-6 max-w-full overflow-x-auto rounded-xl border border-surface-border">
              <table className="min-w-[44rem] text-sm" aria-label="資料格式欄位說明">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-elevated">
                    <th className="px-4 py-3 text-left font-semibold text-text">欄位</th>
                    <th className="px-4 py-3 text-left font-semibold text-text">型別</th>
                    <th className="px-4 py-3 text-left font-semibold text-text">說明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border bg-surface">
                  {SCHEMA_FIELDS.map((f) => (
                    <tr key={f.field}>
                      <td className="px-4 py-3 break-all font-mono text-xs text-primary">
                        {f.field}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-text-muted">
                        {f.type}
                      </td>
                      <td className="px-4 py-3 break-words text-text">{f.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-6 max-w-full overflow-x-auto rounded-xl border border-surface-border">
              <table className="min-w-[52rem] text-sm" aria-label="App 匯率模式欄位對照">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-elevated">
                    <th className="px-4 py-3 text-left font-semibold text-text">App 模式</th>
                    <th className="px-4 py-3 text-left font-semibold text-text">來源幣別欄位</th>
                    <th className="px-4 py-3 text-left font-semibold text-text">目標幣別欄位</th>
                    <th className="px-4 py-3 text-left font-semibold text-text">說明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border bg-surface">
                  {RATE_MODE_STRATEGY_ROWS.map((strategy) => (
                    <tr key={strategy.mode}>
                      <td className="px-4 py-3">
                        <code className="rounded bg-surface-elevated px-1 font-mono text-xs text-primary">
                          {strategy.mode}
                        </code>
                        <span className="ml-2 text-text">{strategy.name}</span>
                      </td>
                      <td className="px-4 py-3 break-all font-mono text-xs text-text-muted">
                        {strategy.from}
                      </td>
                      <td className="px-4 py-3 break-all font-mono text-xs text-text-muted">
                        {strategy.to}
                      </td>
                      <td className="px-4 py-3 break-words text-text">{strategy.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-6 max-w-full overflow-x-auto rounded-xl border border-surface-border">
              <table className="min-w-[54rem] text-sm" aria-label="匯率來源 provider 合約">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-elevated">
                    <th className="px-4 py-3 text-left font-semibold text-text">providerId</th>
                    <th className="px-4 py-3 text-left font-semibold text-text">sourceKind</th>
                    <th className="px-4 py-3 text-left font-semibold text-text">來源</th>
                    <th className="px-4 py-3 text-left font-semibold text-text">狀態</th>
                    <th className="px-4 py-3 text-left font-semibold text-text">端點</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border bg-surface">
                  {PROVIDER_CONTRACT_ROWS.map((provider) => (
                    <tr key={provider.providerId}>
                      <td className="px-4 py-3 font-mono text-xs text-primary">
                        {provider.providerId}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-muted">
                        {provider.sourceKind}
                      </td>
                      <td className="px-4 py-3 break-words text-text">{provider.name}</td>
                      <td className="px-4 py-3 break-words text-text-muted">{provider.status}</td>
                      <td className="px-4 py-3 break-all font-mono text-xs text-text-muted">
                        {provider.endpoints}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-6 rounded-lg border border-surface-border bg-surface-elevated p-4 text-sm leading-relaxed text-text-muted">
              <span className="font-semibold text-text">Provider selection contract：</span>
              歷史與未來篩選以 sourceKind + providerId 作為穩定資料鍵。現在只有台灣銀行一個 bank
              provider，因此銀行選單與最佳匯率推薦保持關閉；未來 {
                BANK_PROVIDER_ACTIVATION_NOTE
              }{' '}
              時，才啟用銀行推薦清單，且主匯率只顯示使用者指定或系統推薦的單一 provider。
            </div>

            {/* 支援幣別 */}
            <div>
              <h3 className="mb-3 text-base font-semibold text-text">
                支援幣別（{SUPPORTED_CURRENCIES.length} 種，基準幣 TWD）
              </h3>
              <div className="flex min-w-0 flex-wrap gap-2">
                {SUPPORTED_CURRENCIES.map((c) => (
                  <span
                    key={c.code}
                    className="min-w-0 rounded-full border border-surface-border bg-surface-elevated px-3 py-1 text-sm"
                  >
                    <span className="font-mono font-semibold text-primary">{c.code}</span>
                    <span className="ml-1 break-words text-text-muted">{c.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ── 速率限制 ── */}
          <section className="mb-12">
            <h2 className="mb-5 text-2xl font-semibold text-text">速率限制</h2>

            <div className="mb-5 max-w-full overflow-x-auto rounded-xl border border-surface-border">
              <table className="min-w-[42rem] text-sm" aria-label="速率限制規則">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-elevated">
                    <th className="px-4 py-3 text-left font-semibold text-text">來源</th>
                    <th className="px-4 py-3 text-left font-semibold text-text">限制</th>
                    <th className="px-4 py-3 text-left font-semibold text-text">備註</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border bg-surface">
                  {RATE_LIMIT_ITEMS.map((r) => (
                    <tr key={r.source}>
                      <td className="px-4 py-3 font-medium text-text">{r.source}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-primary">
                        {r.limit}
                      </td>
                      <td className="px-4 py-3 break-words text-text-muted">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              {[
                { icon: '✅', content: '允許：個人專案、學術研究、非商業 App、教學、媒體引用' },
                { icon: '✅', content: '允許：標示「資料來源：臺灣銀行牌告匯率」' },
                {
                  icon: '⚠️',
                  content: (
                    <>
                      商業用途建議聯繫{' '}
                      <MailtoLink email={APP_INFO.email} className="text-primary underline" />{' '}
                      說明使用情境
                    </>
                  ),
                },
                { icon: '❌', content: '禁止：大量爬取歷史資料（對 CDN 或 GitHub 造成異常流量）' },
                { icon: '❌', content: '禁止：宣稱為官方臺灣銀行 API' },
              ].map(({ icon, content }, i) => (
                <div
                  key={i}
                  className="flex min-w-0 items-start gap-3 rounded-lg bg-surface px-4 py-2.5 text-sm text-text"
                >
                  <span className="mt-0.5 shrink-0">{icon}</span>
                  <span className="min-w-0 break-words">{content}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── 授權聲明 ── */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold text-text">授權聲明</h2>
            <div className="min-w-0 space-y-3 rounded-xl border border-surface-border bg-surface p-5 text-sm leading-relaxed text-text-muted">
              <p>
                <span className="font-semibold text-text">程式碼</span>
                ：以{' '}
                <a
                  href={APP_INFO.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {APP_INFO.license}
                </a>{' '}
                授權釋出，可自由使用、修改，衍生作品須以相同授權開源。
              </p>
              <p>
                <span className="font-semibold text-text">資料版權</span>
                ：匯率數據原始版權屬臺灣銀行。本專案以自動化方式公開抓取官方牌告，使用前請自行確認是否符合臺灣銀行使用規範。
              </p>
              <p>
                <span className="font-semibold text-text">免責聲明</span>
                ：本工具與臺灣銀行無隸屬關係。資料可能因網路延遲或同步異常而短暫差異。所有匯率僅供參考，實際交易以金融機構公告為準。
              </p>
            </div>
          </section>

          {/* ── 相關資源 ── */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold text-text">相關資源</h2>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  {
                    title: 'OpenAPI 3.1 規格',
                    desc: 'Swagger / Scalar 相容 API schema',
                    href: '/ratewise/openapi.json',
                    label: 'openapi.json',
                    external: true,
                  },
                  {
                    title: 'Swagger Editor（線上預覽）',
                    desc: '將 openapi.json 匯入後可互動式測試 API',
                    href: 'https://editor.swagger.io/?url=https://app.haotool.org/ratewise/openapi.json',
                    label: 'editor.swagger.io',
                    external: true,
                  },
                  {
                    title: 'API 中繼資料',
                    desc: '端點清單、支援幣別與聯絡資訊',
                    href: '/ratewise/api/latest.json',
                    label: 'api/latest.json',
                    external: true,
                  },
                  {
                    title: 'LLM 文件（精簡）',
                    desc: 'AI Agent 快速理解站點架構',
                    href: '/ratewise/llms.txt',
                    label: 'llms.txt',
                    external: true,
                  },
                  {
                    title: 'LLM 文件（完整）',
                    desc: '含 JSON schema、完整幣別表、程式碼範例',
                    href: '/ratewise/llms-full.txt',
                    label: 'llms-full.txt',
                    external: true,
                  },
                  {
                    title: 'GitHub 原始碼',
                    desc: 'GitHub Actions、Issue 回報、原始碼',
                    href: APP_INFO.github,
                    label: 'haotool/app',
                    external: true,
                  },
                  {
                    title: '使用指南',
                    desc: '網頁介面使用教學',
                    href: '/guide/',
                    label: '查看指南',
                    external: false,
                  },
                ] satisfies ResourceCardItem[]
              ).map((item) => (
                <ResourceCard key={item.title} item={item} />
              ))}
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="mb-12">
            <h2 className="mb-5 text-2xl font-semibold text-text">常見問題</h2>
            <div className="space-y-3">
              {OPEN_DATA_PAGE_SEO.faqContent?.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl border border-surface-border bg-surface"
                >
                  <summary className="flex min-w-0 cursor-pointer items-center justify-between gap-3 px-5 py-4 font-medium text-text">
                    <span className="min-w-0 break-words">{item.question}</span>
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-text-muted transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="break-words border-t border-surface-border px-5 py-4 text-sm leading-relaxed text-text-muted">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <div className="min-w-0 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="mb-3 text-text-muted">不想呼叫 API？直接使用換算介面，免安裝、免帳號。</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              開啟換算工具
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default OpenData;
