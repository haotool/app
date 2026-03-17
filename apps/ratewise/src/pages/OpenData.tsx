import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';
import { Breadcrumb } from '../components/Breadcrumb';
import { OPEN_DATA_PAGE_SEO } from '../config/seo-metadata';
import { APP_INFO } from '../config/app-info';
import { RATES_API } from '../config/api-endpoints';
import { SITE_CONFIG } from '../config/seo-paths';
import { CURRENCY_DEFINITIONS } from '../features/ratewise/constants';

// ─── 資料來源 ─────────────────────────────────────────────────────────────────

const DATA_SOURCES = [
  {
    label: '原始來源',
    name: '臺灣銀行牌告匯率',
    url: 'https://rate.bot.com.tw/xrt',
    note: '官方每日公布，涵蓋現金買入、現金賣出、即期買入、即期賣出四種報價',
  },
  {
    label: '同步機制',
    name: 'GitHub Actions（每 5 分鐘）',
    url: RATES_API.actionsUrl,
    note: '自動抓取台銀最新牌告，寫入 data 分支 JSON 檔案，確保資料即時性',
  },
  {
    label: '主要 CDN',
    name: 'jsDelivr 全球加速',
    url: 'https://cdn.jsdelivr.net',
    note: '建議使用端點：全球 PoP 節點加速，適合生產環境呼叫',
  },
  {
    label: '備援端點',
    name: 'GitHub Raw',
    url: 'https://raw.githubusercontent.com',
    note: '無快取，即時反映最新資料，適合需要最新資料或 CDN 不可用時',
  },
];

// ─── API 端點 ─────────────────────────────────────────────────────────────────

const API_ENDPOINTS = [
  {
    method: 'GET',
    path: '/public/rates/latest.json',
    cdnUrl: RATES_API.latestCdn,
    rawUrl: RATES_API.latestRaw,
    description: '最新匯率（每 5 分鐘更新）',
    note: '包含所有 18 幣別的現金與即期四種報價，以及簡化的即期賣出參考匯率。',
  },
  {
    method: 'GET',
    path: '/public/rates/history/{YYYY-MM-DD}.json',
    cdnUrl: RATES_API.historyCdnExample,
    rawUrl: RATES_API.historyRawExample,
    description: '歷史匯率（指定日期）',
    note: '以日期取代 {YYYY-MM-DD}，例如 2025-02-20。若該日無資料（例如假日），伺服器回傳 404。',
  },
];

// ─── 速率限制 ──────────────────────────────────────────────────────────────────

const RATE_LIMIT_ITEMS = [
  {
    source: 'jsDelivr CDN',
    limit: '無明確請求上限',
    note: '遵守 jsDelivr 服務條款，禁止爬蟲式大量歷史批次抓取',
  },
  {
    source: 'GitHub Raw',
    limit: '60 requests/hour（未認證）',
    note: '超出限制時 HTTP 429，建議優先使用 CDN 端點',
  },
  {
    source: '資料更新頻率',
    limit: '每 5 分鐘一次',
    note: '超過此頻率請求 latest.json 無意義，建議 client 端自行快取 5 分鐘',
  },
] as const;

// ─── 使用範例 ──────────────────────────────────────────────────────────────────

const CODE_CURL = `# 取得最新匯率
curl -s "${RATES_API.latestCdn}" | python3 -m json.tool

# 取得歷史匯率（以 2025-02-20 為例）
curl -s "${RATES_API.historyCdnExample}"`;

const CODE_JS = `// JavaScript / TypeScript（fetch API）
const res = await fetch(
  "${RATES_API.latestCdn}"
);
const data = await res.json();

// 取得美元現金賣出匯率（台幣買美元時參考）
const usdCashSell = data.details.USD.cash.sell;
console.log(\`1 USD = \${usdCashSell} TWD（現金賣出）\`);

// 取得所有即期賣出匯率
Object.entries(data.rates).forEach(([currency, rate]) => {
  console.log(\`\${currency}/TWD = \${rate}\`);
});`;

const CODE_PYTHON = `# Python（requests）
import requests

url = "${RATES_API.latestCdn}"
data = requests.get(url).json()

# 美元現金賣出匯率
usd_cash_sell = data["details"]["USD"]["cash"]["sell"]
print(f"1 USD = {usd_cash_sell} TWD（現金賣出）")

# 歷史匯率（指定日期）
history_url = "${RATES_API.historyCdnExample}"
history = requests.get(history_url).json()
print(f"2025-02-20 USD/TWD 即期賣出：{history['details']['USD']['spot']['sell']}")`;

const CODE_DEEPLINK = `<!-- 深層連結（帶入換算參數）-->
<!-- 開啟 RateWise 並預填 1000 美元換台幣 -->
<a href="${SITE_CONFIG.url}?amount=1000&from=USD&to=TWD">
  查看 1000 USD 換多少台幣
</a>

<!-- URL 參數說明 -->
<!-- amount: 換算金額（數字）        -->
<!-- from:   來源幣別（三碼 ISO）     -->
<!-- to:     目標幣別（預設 TWD）    -->`;

// ─── 資料欄位說明 ──────────────────────────────────────────────────────────────

const SCHEMA_FIELDS = [
  { field: 'timestamp', type: 'integer', description: 'Unix 時間戳（毫秒），資料最後同步時間' },
  {
    field: 'updateTime',
    type: 'string (ISO 8601)',
    description: '資料更新時間，台灣時間（UTC+8），例如 2025-02-20T10:30:00+08:00',
  },
  { field: 'source', type: 'string', description: '資料來源名稱，固定為「臺灣銀行牌告匯率」' },
  {
    field: 'rates',
    type: 'object',
    description: '各幣別對 TWD 的即期賣出參考匯率，key 為三碼 ISO 幣別代碼',
  },
  {
    field: 'details',
    type: 'object',
    description: '各幣別完整四種報價（cash/spot × buy/sell）',
  },
  {
    field: 'details.{CODE}.cash.buy',
    type: 'number',
    description: '現金買入：銀行以此價收購外幣現鈔（你拿外幣換台幣）',
  },
  {
    field: 'details.{CODE}.cash.sell',
    type: 'number',
    description: '現金賣出：銀行以此價賣出外幣現鈔（你拿台幣換外幣現金）',
  },
  {
    field: 'details.{CODE}.spot.buy',
    type: 'number',
    description: '即期買入：電匯/帳戶轉入匯率（你匯款回台灣）',
  },
  {
    field: 'details.{CODE}.spot.sell',
    type: 'number',
    description: '即期賣出：電匯/帳戶轉出匯率（你從台灣匯款出去）',
  },
] as const;

// 從 CURRENCY_DEFINITIONS SSOT 導出，TWD 標示為基準幣。
const SUPPORTED_CURRENCIES = Object.entries(CURRENCY_DEFINITIONS).map(([code, def]) => ({
  code,
  name: code === 'TWD' ? `${def.name}（基準幣）` : def.name,
}));

// ─── 元件 ─────────────────────────────────────────────────────────────────────

interface CodeBlockProps {
  title: string;
  language: string;
  code: string;
}

interface ResourceCardItem {
  title: string;
  desc: string;
  href: string;
  label: string;
  external: boolean;
}

function CodeBlock({ title, language, code }: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-surface-border">
      <div className="flex items-center justify-between bg-surface-elevated px-4 py-2">
        <span className="text-sm font-medium text-text-muted">{title}</span>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
          {language}
        </span>
      </div>
      <pre
        role="region"
        aria-label={`程式碼範例：${language}`}
        className="overflow-x-auto bg-surface p-4 text-sm leading-relaxed text-text"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ResourceCard({ item }: { item: ResourceCardItem }) {
  const className =
    'group rounded-xl border border-surface-border bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-surface-elevated';
  const content = (
    <>
      <div className="mb-1 font-semibold text-text group-hover:text-primary">{item.title}</div>
      <div className="mb-2 text-sm text-text-muted">{item.desc}</div>
      <div className="font-mono text-xs text-primary">{item.label}</div>
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

  return (
    <>
      <SEOHelmet
        title={OPEN_DATA_PAGE_SEO.title}
        description={OPEN_DATA_PAGE_SEO.description}
        canonical={`${SITE_CONFIG.url}open-data/`}
        pathname={OPEN_DATA_PAGE_SEO.pathname}
        breadcrumb={OPEN_DATA_PAGE_SEO.breadcrumb}
        howTo={HOW_TO}
        jsonLd={OPEN_DATA_PAGE_SEO.jsonLd}
      />

      <div className="min-h-screen bg-page-gradient">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <Link
            to="/"
            className="mb-4 inline-flex items-center text-primary transition-colors hover:text-primary-hover"
          >
            <svg
              aria-hidden="true"
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            回到首頁
          </Link>

          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '開放資料 API', href: '/open-data/' },
            ]}
          />

          {/* ── 標題 ── */}
          <div className="mb-10">
            <h1 className="mb-3 text-4xl font-bold text-text">開放資料 API</h1>
            <p className="max-w-3xl text-lg text-text-muted">
              RateWise 匯率資料完全開放。本頁揭露資料管線架構、API 端點、資料格式與使用規範，
              讓開發者、研究人員或任何需要台灣銀行牌告匯率資料的專案可自由接取，無需授權申請。
            </p>
          </div>

          {/* ── 資料來源架構 ── */}
          <section className="mb-12">
            <h2 className="mb-2 text-2xl font-semibold text-text">資料管線架構</h2>
            <p className="mb-6 text-text-muted">
              從官方來源到你的應用程式，資料流向完全透明可追溯。
            </p>

            {/* 架構示意圖 */}
            <div className="mb-6 overflow-hidden rounded-xl border border-surface-border bg-surface p-5">
              <div className="flex flex-col items-center gap-2 font-mono text-sm sm:flex-row sm:flex-wrap sm:justify-center sm:gap-0">
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
                    label: 'GitHub data 分支',
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
                    label: '你的應用程式',
                    sub: 'fetch / curl / SDK',
                    color: 'bg-surface-elevated border border-surface-border text-text',
                  },
                ].map((item, i) =>
                  item === null ? (
                    <div key={i} className="text-text-muted sm:mx-1">
                      →
                    </div>
                  ) : (
                    <div key={i} className={`rounded-lg px-3 py-2 text-center ${item.color}`}>
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-xs opacity-80">{item.sub}</div>
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
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-medium text-text-muted">{src.label}</span>
                  </div>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline"
                  >
                    {src.name}
                  </a>
                  <p className="mt-1 text-sm text-text-muted">{src.note}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── API 端點 ── */}
          <section className="mb-12">
            <h2 className="mb-2 text-2xl font-semibold text-text">API 端點</h2>
            <p className="mb-6 text-text-muted">
              無需認證、無需 API Key，直接以 HTTP GET 請求存取。建議優先使用 CDN 端點。
            </p>

            <div className="space-y-6">
              {API_ENDPOINTS.map((ep) => (
                <div
                  key={ep.path}
                  className="rounded-xl border border-surface-border bg-surface p-5"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      {ep.method}
                    </span>
                    <code className="rounded bg-surface-elevated px-2 py-0.5 text-sm font-mono text-text">
                      {ep.path}
                    </code>
                    <span className="text-sm font-medium text-text">{ep.description}</span>
                  </div>
                  <p className="mb-4 text-sm text-text-muted">{ep.note}</p>

                  <div className="space-y-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        CDN（建議）
                      </span>
                      <a
                        href={ep.cdnUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all rounded bg-surface-elevated px-3 py-2 font-mono text-sm text-primary hover:underline"
                      >
                        {ep.cdnUrl}
                      </a>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        GitHub Raw（備援）
                      </span>
                      <a
                        href={ep.rawUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all rounded bg-surface-elevated px-3 py-2 font-mono text-sm text-text-muted hover:text-primary hover:underline"
                      >
                        {ep.rawUrl}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* OpenAPI spec link */}
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-text">
                完整 OpenAPI 3.1 規格（含 schema、範例值）：
                <a
                  href="/ratewise/openapi.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 font-mono text-primary hover:underline"
                >
                  /ratewise/openapi.json
                </a>
              </p>
            </div>
          </section>

          {/* ── 快速上手範例 ── */}
          <section className="mb-12">
            <h2 className="mb-2 text-2xl font-semibold text-text">快速上手範例</h2>
            <p className="mb-6 text-text-muted">複製貼上即可運行的程式碼範例。</p>

            <div className="space-y-5">
              <CodeBlock title="命令列" language="bash / curl" code={CODE_CURL} />
              <CodeBlock title="瀏覽器 / Node.js" language="JavaScript" code={CODE_JS} />
              <CodeBlock title="Python" language="Python 3" code={CODE_PYTHON} />
              <CodeBlock title="深層連結" language="HTML" code={CODE_DEEPLINK} />
            </div>
          </section>

          {/* ── 資料格式 ── */}
          <section className="mb-12">
            <h2 className="mb-2 text-2xl font-semibold text-text">資料格式說明</h2>
            <p className="mb-6 text-text-muted">
              所有端點均回傳 JSON，Content-Type: application/json。
            </p>

            {/* 欄位表格 */}
            <div className="overflow-x-auto rounded-xl border border-surface-border">
              <table className="w-full text-sm">
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
                      <td className="px-4 py-3 font-mono text-xs text-primary">{f.field}</td>
                      <td className="px-4 py-3 text-text-muted">{f.type}</td>
                      <td className="px-4 py-3 text-text">{f.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 支援幣別 */}
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-semibold text-text">
                支援幣別（{SUPPORTED_CURRENCIES.length} 種，基準幣 TWD）
              </h3>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_CURRENCIES.map((c) => (
                  <span
                    key={c.code}
                    className="rounded-full border border-surface-border bg-surface-elevated px-3 py-1 text-sm"
                  >
                    <span className="font-mono font-semibold text-primary">{c.code}</span>
                    <span className="ml-1 text-text-muted">{c.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ── 速率限制與使用規則 ── */}
          <section className="mb-12">
            <h2 className="mb-2 text-2xl font-semibold text-text">速率限制與使用規則</h2>
            <p className="mb-6 text-text-muted">
              API 免費開放，但請遵守以下使用準則以維護服務品質。
            </p>

            <div className="mb-6 overflow-x-auto rounded-xl border border-surface-border">
              <table className="w-full text-sm">
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
                      <td className="px-4 py-3 font-mono text-xs text-primary">{r.limit}</td>
                      <td className="px-4 py-3 text-text-muted">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3">
              {[
                '✅ 允許：個人專案、學術研究、非商業 App、教學展示、媒體引用',
                '✅ 允許：在顯示結果時標示「資料來源：臺灣銀行牌告匯率」',
                `⚠️ 建議：商業用途請聯繫 ${APP_INFO.email} 說明使用情境`,
                '❌ 禁止：大量爬取歷史資料（對 CDN 或 GitHub 造成異常流量）',
                '❌ 禁止：冒充本服務或宣稱為官方臺灣銀行 API',
                '⚠️ 免責：本 API 為非官方開源自動化同步，實際交易請以金融機構公告為準',
              ].map((rule, i) => (
                <p key={i} className="rounded-lg bg-surface px-4 py-2.5 text-sm text-text">
                  {rule}
                </p>
              ))}
            </div>
          </section>

          {/* ── 授權聲明 ── */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold text-text">授權聲明</h2>
            <div className="rounded-xl border border-surface-border bg-surface p-5 text-sm leading-relaxed text-text-muted">
              <p className="mb-3">
                <span className="font-semibold text-text">程式碼授權：</span>
                本專案原始碼以{' '}
                <a
                  href={APP_INFO.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {APP_INFO.license}
                </a>{' '}
                授權釋出。你可自由使用、修改與散布，但衍生作品亦須以相同授權開源。
              </p>
              <p className="mb-3">
                <span className="font-semibold text-text">資料版權：</span>
                匯率數據原始版權屬臺灣銀行（Bank of Taiwan）。本專案以自動化方式公開抓取臺灣銀行網站
                公告資料，資料使用請自行確認是否符合臺灣銀行相關使用規範。
              </p>
              <p>
                <span className="font-semibold text-text">免責聲明：</span>
                本工具與臺灣銀行無隸屬關係，資料可能因網路延遲或同步異常而與官方有短暫差異。
                所有匯率僅供參考，實際交易請以金融機構公告為準。
              </p>
            </div>
          </section>

          {/* ── 相關資源 ── */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold text-text">相關資源</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'OpenAPI 3.1 規格',
                  desc: '完整機器可讀 API schema（Swagger / Scalar 相容）',
                  href: '/ratewise/openapi.json',
                  label: 'openapi.json',
                  external: true,
                },
                {
                  title: 'API 中繼資料',
                  desc: '端點清單、支援幣別與聯絡資訊（JSON）',
                  href: '/ratewise/api/latest.json',
                  label: 'api/latest.json',
                  external: true,
                },
                {
                  title: 'LLM 文件',
                  desc: 'AI Agent / LLM 快速理解站點架構用途',
                  href: '/ratewise/llms.txt',
                  label: 'llms.txt',
                  external: true,
                },
                {
                  title: 'LLM 完整文件',
                  desc: '含 JSON schema、程式碼範例、完整幣別表',
                  href: '/ratewise/llms-full.txt',
                  label: 'llms-full.txt',
                  external: true,
                },
                {
                  title: 'GitHub 原始碼',
                  desc: '查看 GitHub Actions、服務端程式碼與 Issue 回報',
                  href: APP_INFO.github,
                  label: 'haotool/app',
                  external: true,
                },
                {
                  title: '使用指南',
                  desc: '如何在 RateWise 網頁介面進行匯率換算',
                  href: '/guide/',
                  label: '查看指南',
                  external: false,
                },
              ].map((item) => (
                <ResourceCard key={item.title} item={item} />
              ))}
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold text-text">常見問題</h2>
            <div className="space-y-4">
              {OPEN_DATA_PAGE_SEO.faqContent?.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl border border-surface-border bg-surface"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-medium text-text">
                    {item.question}
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5 flex-shrink-0 text-text-muted transition-transform group-open:rotate-180"
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
                  <div className="border-t border-surface-border px-5 py-4 text-sm leading-relaxed text-text-muted">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
            <h2 className="mb-2 text-xl font-semibold text-text">立即試用換算工具</h2>
            <p className="mb-4 text-text-muted">
              不想直接呼叫 API？直接使用 RateWise 匯率換算介面，免安裝、免帳號。
            </p>
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
