/**
 * 開放原始碼頁（E4 新增，noindex 功能頁）
 *
 * 將散落於設定頁外部連結、關於頁與開放資料頁的開源／授權資訊卡片化收斂。
 * 頁面 SEO 設定就地定義（noindex、不入 sitemap），不動 seo-metadata/**（E5 白名單互斥）。
 * 文案沿用現況來源（About 透明區塊＋OpenData 授權聲明），只重排呈現。
 */

import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { APP_INFO, getCopyrightYears } from '../config/app-info';
import { ContentPageLayout } from '../components/content/ContentPageLayout';
import {
  ContentPageHeader,
  ContentSections,
  type ContentSection,
} from '../components/content/ContentSections';

const OPEN_SOURCE_PAGE_SEO = {
  title: `開放原始碼 - ${APP_INFO.shortName} 程式碼與授權資訊`,
  description: `${APP_INFO.shortName} 完整原始碼公開於 GitHub，以 ${APP_INFO.license} 授權釋出，可自由使用與修改。`,
  pathname: '/open-source/',
  robots: 'noindex, follow',
} as const;

const SECTIONS: readonly ContentSection[] = [
  {
    kind: 'list',
    title: '授權聲明',
    items: [
      {
        term: '程式碼：',
        description: (
          <>
            以{' '}
            <a
              href={APP_INFO.licenseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {APP_INFO.license}
            </a>{' '}
            授權釋出，可自由使用、修改，衍生作品須以相同授權開源。
          </>
        ),
      },
      {
        term: '資料版權：',
        description:
          '匯率數據原始版權屬臺灣銀行。本專案以自動化方式公開抓取官方牌告，使用前請自行確認是否符合臺灣銀行使用規範。',
      },
      {
        term: '免責聲明：',
        description:
          '本工具與臺灣銀行無隸屬關係。資料可能因網路延遲或同步異常而短暫差異。所有匯率僅供參考，實際交易以金融機構公告為準。',
      },
    ],
  },
  {
    kind: 'links',
    title: '原始碼與回報',
    links: [
      {
        label: 'GitHub 原始碼',
        sub: APP_INFO.github,
        href: APP_INFO.github,
        external: true,
      },
      {
        label: 'Issue 回報',
        sub: `${APP_INFO.github}/issues`,
        href: `${APP_INFO.github}/issues`,
        external: true,
      },
      {
        label: '授權條款全文',
        sub: APP_INFO.license,
        href: APP_INFO.licenseUrl,
        external: true,
      },
    ],
  },
  {
    kind: 'links',
    title: '延伸閱讀',
    links: [
      { label: '開放資料 API', sub: '匯率資料開放 API 文件', href: '/open-data/' },
      { label: 'SEO 技術揭露', sub: '站點技術架構完整說明', href: '/seo-tech/' },
      { label: '關於我們', sub: '產品定位與資料方法', href: '/about/' },
    ],
  },
];

export default function OpenSource() {
  const { t } = useTranslation();
  return (
    <>
      <SEOHelmet
        title={OPEN_SOURCE_PAGE_SEO.title}
        description={OPEN_SOURCE_PAGE_SEO.description}
        pathname={OPEN_SOURCE_PAGE_SEO.pathname}
        robots={OPEN_SOURCE_PAGE_SEO.robots}
      />

      <ContentPageLayout
        breadcrumbItems={[
          { label: t('nav.home'), href: '/' },
          { label: t('settings.openSource'), href: '/open-source/' },
        ]}
      >
        <ContentPageHeader
          title="開放原始碼"
          lead={`${APP_INFO.shortName} 的完整原始碼公開於 GitHub，歡迎檢視、回報問題或參與貢獻。`}
        />

        <ContentSections sections={SECTIONS} />

        <p className="mt-8 text-center text-sm text-text-muted">
          © {getCopyrightYears()} {APP_INFO.name}．採用 {APP_INFO.license} 授權
        </p>
      </ContentPageLayout>
    </>
  );
}
