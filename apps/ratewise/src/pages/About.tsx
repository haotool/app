import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOHelmet } from '../components/SEOHelmet';
import { AnswerCapsule } from '../components/AnswerCapsule';
import { getDisplayVersion } from '../config/version';
import { APP_INFO, AUTHOR_PERSON, getCopyrightYears } from '../config/app-info';
import { UPDATE_FREQUENCY_PHRASE } from '../config/data-freshness';
import { MailtoLink } from '../components/MailtoLink';
import { ContentPageLayout } from '../components/content/ContentPageLayout';
import {
  ContentPageHeader,
  ContentSections,
  type ContentSection,
} from '../components/content/ContentSections';
import { ABOUT_PAGE_SEO, SITE_SEO } from '../config/seo-metadata';
import { SUPPORTED_CURRENCY_COUNT } from '../features/ratewise/constants';

const LAST_UPDATED = new Date(SITE_SEO.updatedTime).toLocaleDateString('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Taipei',
});

// 內容驅動渲染：文案沿用現況來源，只重排呈現。
const SECTIONS: readonly ContentSection[] = [
  {
    kind: 'text',
    title: '我們的定位',
    paragraphs: [
      '本工具的重點不是展示漂亮的中間價，而是協助你在換匯前快速判讀「實際比較接近會發生的金額」。當你拿台幣去買外幣時，真正影響成本的通常是銀行賣出價；當你把外幣換回台幣時，則要看銀行買入價。',
      '這也是我們把「買入 / 賣出」與「現金 / 即期」區分清楚的原因。目標不是取代銀行成交畫面，而是提供更符合台灣使用情境的牌告判讀工具。',
    ],
  },
  {
    kind: 'list',
    title: '資料方法與範圍',
    items: [
      {
        term: '資料來源：',
        description: '臺灣銀行官方牌告匯率，涵蓋現金買入、現金賣出、即期買入、即期賣出四種報價。',
      },
      { term: '更新頻率：', description: `${UPDATE_FREQUENCY_PHRASE}，畫面會顯示最近更新時間。` },
      {
        term: '支援範圍：',
        description: `目前支援 ${SUPPORTED_CURRENCY_COUNT} 種貨幣，包含 TWD 與主要旅遊、留學、跨境付款常用幣別。`,
      },
      {
        term: '使用提醒：',
        description: '牌告匯率僅供參考，實際成交仍會受銀行、手續費、刷卡清算規則與交易時間影響。',
      },
    ],
  },
  {
    kind: 'cards',
    title: '技術與資料面能力',
    cards: [
      {
        title: '精準換算',
        description: '單幣別換算、快速金額按鈕、計算機鍵盤、現金與即期切換、7~30 天趨勢圖。',
      },
      {
        title: '日常管理',
        description: '多幣別比較、收藏管理、拖曳排序、換算歷史、主題風格與三語介面設定。',
      },
      {
        title: '可驗證資料面',
        description:
          '提供 `latest.json`、`openapi.json`、`llms.txt` 與 `llms-full.txt`，方便開發者與 AI agent 使用。',
      },
      {
        title: 'PWA 能力',
        description: '可加入主畫面、支援離線讀取最近快取資料，重新連線後再同步最新匯率。',
      },
    ],
  },
  {
    kind: 'list',
    title: '作者',
    items: [
      {
        term: '作者：',
        description: (
          <>
            <a
              href={APP_INFO.threadsUrl}
              target="_blank"
              rel="noopener noreferrer me"
              className="ml-1 text-primary-on-surface underline"
            >
              {AUTHOR_PERSON.name}
            </a>
            （個人開發者，{APP_INFO.author} 維護者）
          </>
        ),
      },
      {
        term: 'Threads：',
        description: (
          <a
            href={APP_INFO.threadsUrl}
            target="_blank"
            rel="noopener noreferrer me"
            className="ml-1 text-primary-on-surface underline"
          >
            {APP_INFO.socialHandle}
          </a>
        ),
      },
      {
        term: '聯絡信箱：',
        description: (
          <MailtoLink email={APP_INFO.email} className="ml-1 text-primary-on-surface underline" />
        ),
      },
    ],
  },
  {
    kind: 'list',
    title: '透明與開放原始碼',
    items: [
      {
        term: '原始碼：',
        description: (
          <a
            href={APP_INFO.github}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-primary-on-surface underline"
          >
            {APP_INFO.github}
          </a>
        ),
      },
      {
        term: '延伸閱讀：',
        description: (
          <>
            <Link to="/faq/" className="ml-1 text-primary-on-surface underline">
              常見問題
            </Link>
            <span className="mx-1">·</span>
            <Link to="/guide/" className="text-primary-on-surface underline">
              使用指南
            </Link>
            <span className="mx-1">·</span>
            <Link to="/seo-tech/" className="text-primary-on-surface underline">
              SEO 技術揭露
            </Link>
            <span className="mx-1">·</span>
            <Link to="/open-source/" className="text-primary-on-surface underline">
              開放原始碼
            </Link>
          </>
        ),
      },
    ],
  },
];

export default function About() {
  const { t } = useTranslation();
  return (
    <>
      <SEOHelmet
        title={ABOUT_PAGE_SEO.title}
        description={ABOUT_PAGE_SEO.description}
        pathname={ABOUT_PAGE_SEO.pathname}
        breadcrumb={ABOUT_PAGE_SEO.breadcrumb}
        jsonLd={ABOUT_PAGE_SEO.jsonLd}
        ogType="article"
      />

      <ContentPageLayout
        breadcrumbItems={[
          { label: t('nav.home'), href: '/' },
          { label: t('settings.aboutUs'), href: '/about/' },
        ]}
      >
        <ContentPageHeader
          title={`關於 ${APP_INFO.name}`}
          lead="專注提供台灣用戶更接近實際換匯情境的匯率資訊，而不是只顯示中間價。"
          meta={
            <>
              作者：
              <a
                href={APP_INFO.threadsUrl}
                target="_blank"
                rel="noopener noreferrer me author"
                className="text-primary-on-surface underline"
                itemProp="author"
              >
                {AUTHOR_PERSON.name}
              </a>
              （{APP_INFO.author}）・ 版本：{getDisplayVersion()} ・ 最後更新：
              <time dateTime={new Date(SITE_SEO.updatedTime).toISOString()}>{LAST_UPDATED}</time>
            </>
          }
        />

        <AnswerCapsule items={ABOUT_PAGE_SEO.answerCapsule ?? []} />

        <ContentSections sections={SECTIONS} />

        <p className="mt-8 text-center text-sm text-text-muted">
          © {getCopyrightYears()} {APP_INFO.name}．採用 {APP_INFO.license} 授權
        </p>
      </ContentPageLayout>
    </>
  );
}
