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
      { label: '開放資料 API', href: '/open-data/' },
      { label: '隱私政策', href: '/privacy/' },
    ],
  },
  {
    title: '熱門匯率',
    links: POPULAR_RATE_LINKS,
  },
  {
    // 移除與熱門匯率重複的 USD/JPY/HKD/CNY/KRW，改為非重複的亞洲幣別。
    title: '亞洲貨幣',
    links: [
      { label: 'SGD 新加坡幣', href: '/sgd-twd/' },
      { label: 'THB 泰銖', href: '/thb-twd/' },
      { label: 'PHP 菲律賓披索', href: '/php-twd/' },
      { label: 'MYR 馬來幣', href: '/myr-twd/' },
      { label: 'IDR 印尼盾', href: '/idr-twd/' },
      { label: 'VND 越南盾', href: '/vnd-twd/' },
    ],
  },
  {
    // 移除與熱門匯率重複的 EUR，改為非重複的歐美幣別。
    title: '歐美貨幣',
    links: [
      { label: 'GBP 英鎊', href: '/gbp-twd/' },
      { label: 'AUD 澳幣', href: '/aud-twd/' },
      { label: 'CAD 加幣', href: '/cad-twd/' },
      { label: 'NZD 紐幣', href: '/nzd-twd/' },
      { label: 'CHF 瑞士法郎', href: '/chf-twd/' },
    ],
  },
];
