import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { APP_INFO, getCopyrightYears } from '../config/app-info';
import { MailtoLink } from '../components/MailtoLink';
import { ContentPageLayout } from '../components/content/ContentPageLayout';
import {
  ContentPageHeader,
  ContentSections,
  type ContentSection,
} from '../components/content/ContentSections';
import { PRIVACY_PAGE_SEO, SITE_SEO } from '../config/seo-metadata';

const LAST_UPDATED = new Date(SITE_SEO.updatedTime).toLocaleDateString('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Taipei',
});

// 內容驅動渲染：文案沿用現況來源，只重排呈現；id 供頁內目錄側跳。
const SECTIONS: readonly ContentSection[] = [
  {
    kind: 'text',
    id: 'overview',
    title: '概述',
    paragraphs: [
      `${APP_INFO.shortName} 重視資料最小化原則。本服務不要求註冊帳號，也不建立可識別個人的會員資料。`,
      '收藏貨幣、介面設定與換算歷史會保存在您的裝置本地；站點營運另使用第三方分析與安全服務處理匿名流量與防護資訊。',
    ],
  },
  {
    kind: 'list',
    id: 'local-data',
    title: '本地儲存資料',
    items: [
      { description: '收藏貨幣清單' },
      { description: '介面風格與語言設定' },
      { description: '換算歷史記錄' },
      { description: '最近一次匯率快取資料' },
      {
        description: `以上資料主要透過瀏覽器的 \`localStorage\` 與快取機制儲存，不會由 ${APP_INFO.shortName} 自建伺服器集中保存。`,
      },
    ],
  },
  {
    kind: 'list',
    id: 'third-party',
    title: '第三方服務',
    items: [
      {
        term: '臺灣銀行牌告匯率：',
        description: '本服務會讀取公開匯率資料，用於顯示現金與即期報價。',
      },
      {
        term: 'Google Analytics：',
        description:
          '用於匿名流量分析與功能使用統計，協助了解頁面瀏覽與產品改善方向。Google 可能依其服務機制設定分析所需 Cookie 或識別資訊。',
      },
      {
        term: 'Cloudflare：',
        description:
          '用於 CDN 加速、安全防護與基礎營運記錄。Cloudflare 可能記錄匿名技術資訊以支援流量管理與防護。',
      },
    ],
  },
  {
    kind: 'list',
    id: 'manage-data',
    title: '你可以怎麼管理資料',
    items: [
      {
        description: (
          <>
            你可以在
            <Link to="/settings/" className="mx-1 text-primary-on-surface underline">
              設定頁
            </Link>
            重設部分本地偏好與快取資料。
          </>
        ),
      },
      { description: '你也可以透過瀏覽器設定清除站點資料、Cookie 與本地儲存內容。' },
      {
        description: (
          <>
            若對隱私有疑問，可來信
            <MailtoLink email={APP_INFO.email} className="ml-1 text-primary-on-surface underline" />
            。
          </>
        ),
      },
    ],
  },
];

// 長文頁目錄側跳（簡約版：頁首錨點清單）。
const TOC = SECTIONS.map((section) => ({
  id: section.id ?? '',
  title: 'title' in section ? section.title : '',
}));

export default function Privacy() {
  const { t } = useTranslation();
  return (
    <>
      <SEOHelmet
        title={PRIVACY_PAGE_SEO.title}
        description={PRIVACY_PAGE_SEO.description}
        pathname={PRIVACY_PAGE_SEO.pathname}
        breadcrumb={PRIVACY_PAGE_SEO.breadcrumb}
        robots={PRIVACY_PAGE_SEO.robots}
      />

      <ContentPageLayout
        width="wide-lg"
        breadcrumbItems={[
          { label: t('nav.home'), href: '/' },
          { label: t('footer.privacyPolicy'), href: '/privacy/' },
        ]}
      >
        <ContentPageHeader title="隱私政策" meta={<>最後更新：{LAST_UPDATED}</>} />

        {/* #594 二階：≥1024px 目錄轉左側錨點欄＋正文收斂閱讀寬度；<1024px 佈局零變化。 */}
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <nav
            aria-label="頁內目錄"
            className="mb-6 flex flex-wrap gap-2 lg:sticky lg:top-6 lg:mb-0 lg:flex-col lg:self-start"
          >
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="inline-flex min-h-11 items-center rounded-full border border-border/60 bg-surface px-4 text-sm font-medium text-text-muted transition-colors hover:bg-primary/5 hover:text-primary-on-surface"
              >
                {item.title}
              </a>
            ))}
          </nav>

          <ContentSections sections={SECTIONS} />
        </div>

        <p className="mt-8 text-center text-sm text-text-muted">
          © {getCopyrightYears()} {APP_INFO.name}
        </p>
      </ContentPageLayout>
    </>
  );
}
