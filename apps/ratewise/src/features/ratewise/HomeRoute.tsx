/**
 * HomeRoute — 首頁路由元件
 *
 * 包裝首頁 SEO 邏輯：
 * - 一般訪問：使用 HOMEPAGE_SEO（靜態 title/description/canonical）
 * - deep-link 訪問（?amount=X&from=Y&to=Z）：使用 useDeepLinkSEO 回傳的動態 SEO，
 *   讓 Googlebot 建立「500 美元換新台幣」等長尾關鍵字索引頁。
 */

import { ClientOnly } from 'vite-react-ssg';
import { SEOHelmet } from '../../components/SEOHelmet';
import { HomepageSEOSection } from '../../components/HomepageSEOSection';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { HOMEPAGE_SEO } from '../../config/seo-metadata';
import { useDeepLinkSEO } from '../../hooks/useDeepLinkSEO';
import CurrencyConverter from './RateWise';

export function HomeRoute() {
  const deepLinkSEO = useDeepLinkSEO();

  return (
    <>
      {deepLinkSEO ? (
        // deep-link 模式：動態 title/description/canonical（提供長尾 SEO 索引頁）。
        <SEOHelmet
          title={deepLinkSEO.title}
          description={deepLinkSEO.description}
          canonical={deepLinkSEO.canonical}
          pathname={HOMEPAGE_SEO.pathname}
          howTo={HOMEPAGE_SEO.howTo}
          jsonLd={HOMEPAGE_SEO.jsonLd}
        />
      ) : (
        // 一般訪問：預設首頁 SEO。
        <SEOHelmet
          pathname={HOMEPAGE_SEO.pathname}
          description={HOMEPAGE_SEO.description}
          howTo={HOMEPAGE_SEO.howTo}
          jsonLd={HOMEPAGE_SEO.jsonLd}
        />
      )}
      <ClientOnly fallback={<SkeletonLoader />}>{() => <CurrencyConverter />}</ClientOnly>
      <HomepageSEOSection />
    </>
  );
}
