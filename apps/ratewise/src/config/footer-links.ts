export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export const POPULAR_RATE_LINKS: FooterLink[] = [
  { label: 'USD 美元', href: '/usd-twd/' },
  { label: 'JPY 日圓', href: '/jpy-twd/' },
  { label: 'EUR 歐元', href: '/eur-twd/' },
  { label: 'HKD 港幣', href: '/hkd-twd/' },
  { label: 'CNY 人民幣', href: '/cny-twd/' },
  { label: 'KRW 韓元', href: '/krw-twd/' },
];

export const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: '核心頁面',
    links: [
      { label: '首頁', href: '/' },
      { label: '常見問題', href: '/faq/' },
      { label: '關於我們', href: '/about/' },
      { label: '使用指南', href: '/guide/' },
    ],
  },
  {
    title: '熱門匯率',
    links: POPULAR_RATE_LINKS,
  },
  {
    title: '亞洲貨幣',
    links: [
      { label: 'USD 美元', href: '/usd-twd/' },
      { label: 'JPY 日圓', href: '/jpy-twd/' },
      { label: 'HKD 港幣', href: '/hkd-twd/' },
      { label: 'CNY 人民幣', href: '/cny-twd/' },
      { label: 'KRW 韓元', href: '/krw-twd/' },
      { label: 'SGD 新加坡幣', href: '/sgd-twd/' },
      { label: 'THB 泰銖', href: '/thb-twd/' },
    ],
  },
  {
    title: '歐美貨幣',
    links: [
      { label: 'EUR 歐元', href: '/eur-twd/' },
      { label: 'GBP 英鎊', href: '/gbp-twd/' },
      { label: 'AUD 澳幣', href: '/aud-twd/' },
      { label: 'CAD 加幣', href: '/cad-twd/' },
      { label: 'NZD 紐幣', href: '/nzd-twd/' },
      { label: 'CHF 瑞士法郎', href: '/chf-twd/' },
    ],
  },
];
