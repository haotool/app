/**
 * 支援與資訊 IA SSOT。
 *
 * 這裡只存放跨入口共用的公開內容頁連結；Settings 可在此清單後追加
 * GitHub 等設定頁專屬外部入口。
 */
export const SUPPORT_INFO_LINKS = [
  { href: '/faq/', labelKey: 'settings.faq', descKey: 'settings.faqDesc' },
  { href: '/guide/', labelKey: 'settings.usageGuide', descKey: 'settings.usageGuideDesc' },
  { href: '/about/', labelKey: 'settings.aboutUs', descKey: 'settings.aboutUsDesc' },
  { href: '/open-data/', labelKey: 'settings.openDataApi', descKey: 'settings.openDataApiDesc' },
  { href: '/seo-tech/', labelKey: 'settings.seoTech', descKey: 'settings.seoTechDesc' },
  { href: '/privacy/', labelKey: 'settings.privacyPolicy', descKey: 'settings.privacyPolicyDesc' },
] as const;

export type SupportInfoLink = (typeof SUPPORT_INFO_LINKS)[number];
export type SupportInfoHref = SupportInfoLink['href'];
