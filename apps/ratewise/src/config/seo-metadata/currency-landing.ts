import { CURRENCY_DEFINITIONS } from '../../features/ratewise/constants';
import { APP_INFO } from '../app-info';
import {
  SEO_RATE_EXAMPLES,
  SEO_RATE_EXAMPLES_DATE,
  type RateExample,
} from '../generated/seo-rate-examples';
import { INDEXABLE_FORWARD_AMOUNTS } from '../seo-paths';
import {
  type FAQEntry,
  type RelatedGuideLink,
  type CommonAmountEntry,
  type CurrencyLandingPageContent,
  buildCanonicalUrl,
  buildAlternativeProviderFaq,
  buildExchangeRateSpecificationJsonLd,
  buildShareImageJsonLd,
  GUIDE_LINK_SELL_RATE_VS_MID_RATE,
  GUIDE_LINK_CASH_VS_SPOT_RATE,
  GUIDE_LINK_CARD_RATE_GUIDE,
} from './core';

const RELATED_GUIDES_TO_TWD: RelatedGuideLink[] = [
  GUIDE_LINK_SELL_RATE_VS_MID_RATE,
  GUIDE_LINK_CASH_VS_SPOT_RATE,
];

/** 台幣→外幣方向的相關攻略連結（出國換匯場景）。 */
const RELATED_GUIDES_TWD_TO_FOREIGN: RelatedGuideLink[] = [
  GUIDE_LINK_SELL_RATE_VS_MID_RATE,
  GUIDE_LINK_CASH_VS_SPOT_RATE,
  GUIDE_LINK_CARD_RATE_GUIDE,
];

const CURRENCY_PAGE_OVERRIDES = {
  USD: {
    displayName: '美金',
    region: '美國旅遊與海外付款',
    question: '1 USD 等於多少台幣？',
    keyword: '美金換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '美國消費以刷卡為主，建議準備少量現金搭配信用卡。',
    searchQueries: ['100 美金等於多少台幣', '美金匯率', '美元換台幣'],
  },
  JPY: {
    displayName: '日圓',
    region: '日本旅遊換匯',
    question: '1000 JPY 等於多少台幣？',
    keyword: '日圓換台幣',
    popularAmounts: [1000, 3000, 5000, 10000, 30000, 50000, 100000],
    travelTip: '日本許多餐廳與商店仍以現金為主，建議準備充足日圓現鈔。',
    searchQueries: ['1000 日幣等於多少台幣', '日圓匯率', '日幣換台幣'],
  },
  EUR: {
    displayName: '歐元',
    region: '歐洲旅遊與跨境付款',
    question: '1 EUR 等於多少台幣？',
    keyword: '歐元換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '歐洲多數國家接受刷卡，建議備少量歐元現金用於小型商店與市集。',
    searchQueries: ['100 歐元等於多少台幣', '歐元匯率', '歐元換台幣'],
  },
  GBP: {
    displayName: '英鎊',
    region: '英國旅遊換匯',
    question: '1 GBP 等於多少台幣？',
    keyword: '英鎊換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '英國刷卡普及度高，感應支付廣泛。',
    searchQueries: ['100 英鎊等於多少台幣', '英鎊匯率', '英鎊換台幣'],
  },
  CNY: {
    displayName: '人民幣',
    region: '人民幣付款與報價',
    question: '1 CNY 等於多少台幣？',
    keyword: '人民幣換台幣',
    popularAmounts: [1, 100, 500, 1000, 5000, 10000],
    travelTip: '中國大陸以行動支付為主，建議準備小額現金備用。',
    searchQueries: ['100 人民幣等於多少台幣', '人民幣匯率', '人民幣換台幣'],
  },
  KRW: {
    displayName: '韓元',
    region: '韓國旅遊換匯',
    question: '1000 KRW 等於多少台幣？',
    keyword: '韓元換台幣',
    popularAmounts: [1000, 5000, 10000, 50000, 100000, 300000, 500000],
    travelTip: '韓國多數店家接受刷卡，但夜市與小吃攤建議準備現金。',
    searchQueries: ['50000 韓元多少台幣', '一萬韓元多少台幣', '韓幣換台幣'],
  },
  HKD: {
    displayName: '港幣',
    region: '香港旅遊換匯',
    question: '1 HKD 等於多少台幣？',
    keyword: '港幣換台幣',
    popularAmounts: [1, 100, 500, 1000, 5000, 10000],
    travelTip: '香港八達通卡適用於交通與便利商店，其餘可刷卡或付現。',
    searchQueries: ['100 港幣等於多少台幣', '港幣匯率', '港幣換台幣'],
  },
  AUD: {
    displayName: '澳幣',
    region: '澳洲旅遊與留學換匯',
    question: '1 AUD 等於多少台幣？',
    keyword: '澳幣換台幣',
    popularAmounts: [1, 20, 50, 100, 500, 1000],
    travelTip: '澳洲刷卡非常普遍，感應支付接受度高。',
    searchQueries: ['100 澳幣等於多少台幣', '澳幣匯率', '澳幣換台幣'],
  },
  CAD: {
    displayName: '加幣',
    region: '加拿大旅遊與留學換匯',
    question: '1 CAD 等於多少台幣？',
    keyword: '加幣換台幣',
    popularAmounts: [1, 20, 50, 100, 500, 1000],
    travelTip: '加拿大刷卡普及，建議準備少量現金用於小費。',
    searchQueries: ['100 加幣等於多少台幣', '加幣匯率', '加幣換台幣'],
  },
  SGD: {
    displayName: '新加坡幣',
    region: '新加坡旅遊與商務換匯',
    question: '1 SGD 等於多少台幣？',
    keyword: '新加坡幣換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '新加坡刷卡與行動支付普及，熟食中心建議準備現金。',
    searchQueries: ['100 新加坡幣等於多少台幣', '新幣匯率', '新加坡幣換台幣'],
  },
  THB: {
    displayName: '泰銖',
    region: '泰國旅遊換匯',
    question: '100 THB 等於多少台幣？',
    keyword: '泰銖換台幣',
    popularAmounts: [100, 500, 1000, 3000, 5000, 10000],
    travelTip: '泰國路邊攤、計程車與夜市以現金為主，建議準備充足泰銖。',
    searchQueries: ['1000 泰銖等於多少台幣', '泰銖匯率', '泰銖換台幣'],
  },
  NZD: {
    displayName: '紐元',
    region: '紐西蘭旅遊與留學換匯',
    question: '1 NZD 等於多少台幣？',
    keyword: '紐元換台幣',
    popularAmounts: [1, 20, 50, 100, 500, 1000],
    travelTip: '紐西蘭刷卡普及，但部分戶外活動可能需要現金。',
    searchQueries: ['100 紐元等於多少台幣', '紐元匯率', '紐元換台幣'],
  },
  CHF: {
    displayName: '瑞士法郎',
    region: '瑞士旅遊與跨境付款',
    question: '1 CHF 等於多少台幣？',
    keyword: '瑞士法郎換台幣',
    popularAmounts: [1, 10, 50, 100, 500, 1000],
    travelTip: '瑞士消費水準高，刷卡普遍，建議備少量法郎現金。',
    searchQueries: ['100 瑞士法郎等於多少台幣', '瑞郎匯率', '瑞士法郎換台幣'],
  },
  VND: {
    displayName: '越南盾',
    region: '越南旅遊換匯',
    question: '100000 VND 等於多少台幣？',
    keyword: '越南盾換台幣',
    popularAmounts: [10000, 50000, 100000, 500000, 1000000, 5000000],
    travelTip:
      '越南以現金為主，建議準備充足越南盾。信用卡在大城市飯店與餐廳可用，但市集與路邊攤需現金。',
    searchQueries: ['100000 越南盾多少台幣', '越南盾匯率', '越南幣換台幣'],
  },
  PHP: {
    displayName: '菲律賓披索',
    region: '菲律賓旅遊換匯',
    question: '1000 PHP 等於多少台幣？',
    keyword: '菲律賓披索換台幣',
    popularAmounts: [100, 500, 1000, 5000, 10000, 50000],
    travelTip: '菲律賓刷卡接受度視地區而異，宿霧與長灘島觀光區較普及，偏遠地區建議準備現金。',
    searchQueries: ['1000 菲律賓披索等於多少台幣', '菲律賓披索匯率', '披索換台幣'],
  },
  IDR: {
    displayName: '印尼盾',
    region: '印尼旅遊換匯',
    question: '100000 IDR 等於多少台幣？',
    keyword: '印尼盾換台幣',
    popularAmounts: [10000, 50000, 100000, 500000, 1000000, 5000000],
    travelTip: '印尼（峇里島）以現金為主，建議在機場或市區換匯所兌換。注意面額較大的紙鈔較受歡迎。',
    searchQueries: ['100000 印尼盾多少台幣', '印尼盾匯率', '印尼盾換台幣'],
  },
  MYR: {
    displayName: '馬來幣',
    region: '馬來西亞旅遊換匯',
    question: '100 MYR 等於多少台幣？',
    keyword: '馬來幣換台幣',
    popularAmounts: [10, 50, 100, 500, 1000, 5000],
    travelTip: '馬來西亞刷卡普及度中等，吉隆坡市區可刷卡，但夜市、熟食中心與小鎮建議準備現金。',
    searchQueries: ['100 馬來幣等於多少台幣', '馬來幣匯率', '馬來西亞幣換台幣'],
  },
} as const;

/**
 * 幣別特化 FAQ：基於權威金融網站資訊，為每個幣別提供獨特的換匯知識。
 * 資料來源：台灣銀行、兆豐銀行、Money101、Trip.com、各國旅遊換匯攻略（2026 年）。
 * 每個幣別至少 2-3 則特化 FAQ，避免模板重複，提升 SEO 獨特性。
 */
const CURRENCY_SPECIFIC_FAQ: Record<string, FAQEntry[]> = {
  USD: [
    {
      question: '在台灣換美金，哪種方式最划算？',
      answer:
        '線上換匯（網銀 App）通常匯率最優，採用即期匯率且常有減分優惠；臨櫃換匯使用現金匯率，成本較高但可取得小面額鈔票；外幣 ATM 24 小時服務但僅提供大面額。大額換匯（超過 1 萬美元）時，匯差可達 30-50 美元（約 900-1,500 台幣），應優先比較匯率而非手續費。',
    },
    {
      question: '美金換匯有什麼省錢技巧？',
      answer:
        '善用銀行線上匯率優惠（如減 3.5 分）、分批買入分散風險、比較各銀行牌告匯率。台銀、兆豐等主要銀行匯率存在差異，換匯前應多方比較。線上結匯可提前鎖定匯率，到機場或分行領取。',
    },
    {
      question: '去美國旅遊需要換多少美金現金？',
      answer:
        '美國消費以刷卡為主，建議準備 200-500 美元現金用於小費、停車費、小型商家等場合。多數餐廳、商店、加油站皆接受信用卡，選擇海外回饋 ≥1.5% 的信用卡可抵消手續費。',
    },
  ],
  JPY: [
    {
      question: '去日本旅遊，該換現金還是刷卡？',
      answer:
        '建議採用「高回饋信用卡為主 + 日圓現鈔備用」的組合。信用卡海外手續費約 1.5%，選擇回饋率 ≥3% 的卡片（如國泰 CUBE 卡日本 3.3%、台新 Richart 卡 3.3%）可抵消手續費並額外獲利。日本許多餐廳、便利商店與小店仍以現金為主，建議準備 3-5 萬日圓現鈔。',
    },
    {
      question: '日圓雙幣卡值得辦嗎？',
      answer:
        '雙幣卡（如玉山熊本熊卡）可在匯率低點先換日圓存入外幣帳戶，未來刷卡直接扣日圓帳戶，避免匯率波動風險。若日圓匯率已夠甜、且有明確赴日計畫，雙幣卡是分散風險的好選擇。',
    },
    {
      question: '在日本可以用台灣的電子支付嗎？',
      answer:
        '全支付、街口支付、玉山 Wallet 等台灣電子支付已串接日本 PayPay，免收 1.5% 海外交易手續費，適合小額消費（便利商店、藥妝店）。但多有回饋上限，大額消費仍建議用高回饋信用卡。',
    },
  ],
  KRW: [
    {
      question: '去韓國換韓元，在台灣換還是到當地換？',
      answer:
        '強烈建議到韓國當地換。以 10,000 台幣為例，台灣銀行約換 419,639 韓元，明洞換錢所約換 452,000 韓元，相差約 32,361 韓元（約台幣 770 元）。帶台幣千元鈔到明洞 Money Plant、大使館、一品香等換錢所換最划算。',
    },
    {
      question: '首爾明洞哪家換錢所匯率最好？',
      answer:
        'Money Plant（明洞 5 號出口）、大使館、一品香、SKY 匯率基本一致，差異僅 0.0X，不需執著比較。Money Box 提供台灣旅客專屬優惠（匯率 +0.1）。營業時間約 09:00-21:00，建議白天前往。',
    },
    {
      question: '韓國旅遊信用卡回饋 ≥3.5% 是否比換現金划算？',
      answer:
        '是的。若信用卡海外回饋 ≥3.5%，刷卡比在明洞換現金更划算。韓國多數店家接受刷卡，但夜市、路邊攤、傳統市場仍需現金。建議現金 40%、刷卡 60% 的配置。',
    },
  ],
  EUR: [
    {
      question: '去歐洲旅遊，現金和刷卡怎麼搭配？',
      answer:
        '歐洲大城市刷卡普及，建議以信用卡為主、現金為輔。出發前在台灣換 200-300 歐元小額鈔票（50 歐元以下），用於小餐廳、傳統市集、公共廁所等現金場合。避免在機場換錢，匯率最差。',
    },
    {
      question: '在歐洲刷卡要注意什麼？',
      answer:
        '刷卡時務必選擇「歐元」或「當地貨幣」結算，拒絕「台幣」結算（DCC 動態貨幣轉換），否則會被收取 3-18% 額外匯差。部分無人機台需輸入 PIN 碼，建議出發前向銀行申請。',
    },
    {
      question: '歐洲退稅怎麼操作？',
      answer:
        '歐洲各國退稅比率 19-25% 不等，門檻約 40-300 歐元。購物時向店家索取退稅單，離境前在機場海關蓋章，可選擇現金或信用卡退稅。建議選信用卡退稅，金額較完整但需等 1-2 個月入帳。',
    },
  ],
  HKD: [
    {
      question: '港幣匯率為什麼很穩定？',
      answer:
        '港幣採聯繫匯率制度，與美元維持在 7.75-7.85 的固定區間。因此港幣對台幣的匯率主要隨美元走勢波動，相對其他貨幣更穩定可預測。',
    },
    {
      question: '去香港需要換多少港幣？',
      answer:
        '香港八達通卡適用於交通、便利商店、部分餐廳，建議儲值 300-500 港幣。其餘消費可刷卡或付現，一般 3-5 天行程準備 2,000-3,000 港幣現金即可。',
    },
  ],
  CNY: [
    {
      question: '台灣人攜帶人民幣出入境有限額嗎？',
      answer:
        '有。根據台灣法規，民眾攜帶人民幣進出境的限額為人民幣 2 萬元。超過需向海關申報，經許可的金融機構不受此限。',
    },
    {
      question: '去中國大陸需要換多少人民幣現金？',
      answer:
        '中國大陸以微信支付、支付寶等行動支付為主，外國旅客可綁定國際信用卡使用。建議準備 500-1,000 人民幣小額現金備用，用於不支援行動支付的場合。',
    },
    {
      question: '在台灣換人民幣有什麼注意事項？',
      answer:
        '等值新台幣 50 萬元以上的外幣兌換需事先預約，並可能需填寫申報書。線上結匯（如台銀 Easy 購）匯率最優惠、24 小時可下單，可選擇機場或分行領取。',
    },
  ],
  THB: [
    {
      question: '去泰國換泰銖，在台灣換還是到當地換？',
      answer:
        '強烈建議到泰國當地換。台灣銀行匯率約 1 TWD = 0.89-1.07 THB，曼谷 Super Rich 約 1 TWD = 1.115-1.135 THB，價差超過 10%。帶台幣到曼谷 Super Rich（綠標或橘標）換最划算。',
    },
    {
      question: '曼谷機場可以換泰銖嗎？',
      answer:
        '可以，但要選對地點。素萬那普機場地下室（B1 捷運站旁）有 Super Rich，匯率優良；行李轉盤區的換匯所匯率差 20% 以上，千萬不要在那裡換。廊曼機場無 Super Rich，建議到市區再換。',
    },
    {
      question: '泰國旅遊現金和刷卡怎麼配置？',
      answer:
        '建議現金 40%、刷卡 60%。泰國數位支付漸普及，但嘟嘟車、路邊攤、夜市、小費仍需現金。準備新台幣現鈔時注意鈔票狀態，有皺摺、破洞、記號的舊鈔可能被拒收或匯率打折。',
    },
  ],
  VND: [
    {
      question: '去越南換越南盾，在台灣換還是到當地換？',
      answer:
        '建議到越南當地換。台灣銀行匯率約 1:752 越南盾，越南當地銀樓約 1:854，每 1 萬台幣相差超過 100 萬越盾。在台灣先換 1,000-2,000 台幣的越南盾作為應急金，大筆金額到當地再換。',
    },
    {
      question: '在越南可以用台幣直接換越南盾嗎？',
      answer:
        '可以。越南當地銀樓可直接用台幣換越南盾，不需先換美金。匯率參考：10,000 台幣 ≈ 750-830 萬越南盾。可查詢 CHỢ GIÁ（chogia.vn）網站了解當日匯率。',
    },
    {
      question: '越南換匯有什麼注意事項？',
      answer:
        '2026 年越南實施外匯管理新制，政府對非法換匯查緝趨嚴格，建議選擇合法且有營業執照的銀樓或銀行兌換。越南以現金為主，信用卡僅在大城市飯店與餐廳可用。',
    },
  ],
  SGD: [
    {
      question: '新加坡幣匯率大約多少？',
      answer:
        '1 新加坡幣約等於 24-25 台幣（2026 年）。新加坡幣相對穩定，與美元連動性高。各銀行匯率略有差異，星展銀行通常提供較優惠的新幣匯率。',
    },
    {
      question: '去新加坡需要換多少新幣現金？',
      answer:
        '新加坡刷卡與行動支付非常普及，但熟食中心（Hawker Centre）多以現金為主。建議準備 200-300 新幣現金用於熟食中心、小販與交通，其餘可刷卡。',
    },
  ],
  AUD: [
    {
      question: '澳幣匯率大約多少？',
      answer:
        '1 澳幣約等於 22-23 台幣（2026 年）。澳幣屬於商品貨幣，匯率受原物料價格影響較大。換澳幣最便宜的銀行為高雄銀行，換回台幣最划算的是台新銀行。',
    },
    {
      question: '去澳洲需要換多少澳幣現金？',
      answer:
        '澳洲刷卡非常普遍，感應支付（tap-and-go）接受度極高，許多店家甚至不收現金。建議準備 100-200 澳幣現金備用即可，主要用於小費或緊急情況。',
    },
  ],
  GBP: [
    {
      question: '英鎊匯率大約多少？',
      answer:
        '1 英鎊約等於 41-43 台幣（2026 年）。英鎊是主要貨幣中單位價值較高的，換匯時注意金額。玉山銀行通常提供較優惠的英鎊匯率。',
    },
    {
      question: '去英國需要換多少英鎊現金？',
      answer:
        '英國感應支付極為普及，幾乎所有商家都接受 contactless payment。建議準備 50-100 英鎊現金備用，主要用於小費、市集或緊急情況。',
    },
  ],
  CAD: [
    {
      question: '加幣匯率大約多少？',
      answer:
        '1 加幣約等於 23 台幣（2026 年）。加幣屬於商品貨幣，與油價有一定連動性。現金匯率通常比即期匯率差 0.2-0.5 元。',
    },
    {
      question: '去加拿大需要換多少加幣現金？',
      answer:
        '加拿大刷卡普及，但小費文化盛行（餐廳 15-20%、計程車 10-15%）。建議準備 100-200 加幣現金用於小費，其餘可刷卡。',
    },
  ],
  CHF: [
    {
      question: '瑞士法郎為什麼被稱為避險貨幣？',
      answer:
        '瑞士政治中立、經濟穩定、銀行體系健全，瑞士法郎在國際市場動盪時常被視為資金避風港，匯率易走強。這也使得瑞郎長期維持較高幣值。',
    },
    {
      question: '去瑞士需要換多少瑞郎現金？',
      answer:
        '瑞士消費水準全球最高，但刷卡普遍。建議準備 100-200 瑞郎現金備用，主要用於小費或小型商家。瑞郎在台灣大型銀行可換，非主要幣別建議提前預約。',
    },
  ],
  NZD: [
    {
      question: '紐元匯率大約多少？',
      answer:
        '1 紐元約等於 18-19 台幣（2026 年）。紐元與澳幣走勢相近，同屬商品貨幣。新光銀行通常提供較優惠的紐元即期匯率。',
    },
    {
      question: '去紐西蘭需要換多少紐元現金？',
      answer:
        '紐西蘭刷卡普及，但部分戶外活動（如極限運動、農場體驗）可能需要現金。建議準備 100-200 紐元現金，其餘可刷卡。',
    },
  ],
  PHP: [
    {
      question: '去菲律賓換披索，帶台幣還是美金？',
      answer:
        '建議在台灣先換美金，到菲律賓當地再換披索，比直接換披索更划算。要求銀行準備新版、大面額（100 元與 50 元）美金，舊版美金在菲律賓可能被拒收。',
    },
    {
      question: '菲律賓刷信用卡方便嗎？哪些地方需要現金？',
      answer:
        '菲律賓現金仍是多數場合的主力支付。馬尼拉、宿霧、長灘島（Boracay）的國際飯店、Ayala Mall 等大型商場、連鎖餐廳可刷 Visa/Mastercard；但三輪車（tricycle）、路邊攤、傳統市場、偏遠島嶼（科隆、薩馬島）幾乎只收現金。ATM 每次提款固定手續費約 ₱250，建議單次提足。刷卡時選 PHP 結算，拒絕 DCC 台幣選項，以免多付 2-5% 匯差。',
    },
  ],
  IDR: [
    {
      question: '印尼盾面額很大，怎麼換算？',
      answer:
        '印尼盾面額大，1 台幣約等於 500-540 印尼盾。簡易換算：印尼盾去掉 3 個零再除以 2，約等於台幣金額。例如 100,000 印尼盾 ≈ 100 ÷ 2 = 50 台幣。',
    },
    {
      question: '去峇里島刷信用卡還是換現金？QRIS 可以用嗎？',
      answer:
        '峇里島現金與信用卡並行。Seminyak、Canggu、Uluwatu 的中高級餐廳與精品店可刷 Visa/Mastercard；便利商店（Indomaret、Alfamart）也可刷卡。但市集攤販、偏遠地區仍以現金為主。建議帶 USD 100 面額鈔票到認明「PVA Berizin」綠牌的合法換匯所（如 Central Kuta）兌換，匯率比台灣換台幣好 10-15%。QRIS 統一 QR 碼已在峇里島廣泛使用，可下載 GoPay 並綁定 Visa/Mastercard 使用。刷卡選 IDR 結算，避免 DCC 多付 5-7%。',
    },
  ],
  MYR: [
    {
      question: '馬來幣匯率大約多少？',
      answer:
        '1 馬來幣約等於 7-8.5 台幣（2026 年），各銀行匯率差異較大。台灣銀行現金賣出約 8.52，兆豐銀行約 8.60，建議多方比較。',
    },
    {
      question: "去馬來西亞刷信用卡方便嗎？需要辦 Touch 'n Go 嗎？",
      answer:
        "馬來西亞是東南亞刷卡環境最完善的國家之一，吉隆坡、檳城的商場、餐廳、飯店全面支援 Visa/Mastercard 感應支付（contactless）。搭地鐵（LRT/MRT/KTM）、公車、高速公路 ETC 建議購買實體 Touch 'n Go 卡（類悠遊卡，KLIA 機場可買）；夜市（亞羅街）、熟食中心（hawker）以現金為主，建議備 300-500 馬來幣。選擇海外回饋 ≥1.5% 的信用卡（如台新 Richart 3.3%）刷卡，避免 DCC 台幣結算。",
    },
  ],
};

/**
 * 反向頁（TWD→外幣）特化 FAQ：強調出國前換匯場景的獨特知識。
 * 與正向頁 FAQ 互補，避免重複內容。
 */
const REVERSE_CURRENCY_SPECIFIC_FAQ: Record<string, FAQEntry[]> = {
  USD: [
    {
      question: '出國前換美金，線上換還是臨櫃換？',
      answer:
        '線上換匯（網銀 App）使用即期匯率，通常比臨櫃現金匯率優惠 0.5-1%。但線上換匯需轉入外幣帳戶，若要提領現鈔需另外預約。若急需現鈔，臨櫃換匯較方便但匯率稍差。',
    },
    {
      question: '換美金要選哪家銀行？',
      answer:
        '台銀、兆豐、彰銀等大型銀行匯率差異不大，但部分銀行提供線上減分優惠（如減 3.5 分）。大額換匯（超過 1 萬美元）時，0.1% 的匯差就是 300-500 台幣，值得多方比較。',
    },
  ],
  JPY: [
    {
      question: '什麼時候換日圓最划算？',
      answer: `日圓匯率受日本央行政策影響大，難以預測最低點。建議出發前 1-2 週開始觀察趨勢，分 2-3 次換匯分散風險。${APP_INFO.shortName} 提供 7-30 天趨勢圖，可觀察近期高低區間。`,
    },
    {
      question: '日圓現鈔要換多少面額？',
      answer:
        '日本自動販賣機、小店常不收萬元大鈔，建議換匯時要求部分千元鈔（1,000 日圓）。台銀臨櫃可指定面額，線上結匯則依銀行庫存配置。',
    },
  ],
  KRW: [
    {
      question: '台幣換韓元，在台灣換還是到首爾換？',
      answer:
        '到首爾明洞換匯所換最划算，匯率比台灣銀行好 7-10%。但若不想帶大量台幣現鈔出國，可在台灣先換少量韓元（約 5 萬韓元）用於機場交通，抵達後再到明洞換足額。',
    },
    {
      question: '去韓國要帶台幣還是美金去換？',
      answer:
        '帶台幣直接換最方便，明洞換錢所接受台幣千元鈔。帶美金換匯率有時略優，但需先在台灣換美金，兩次換匯較麻煩。除非已有美金現鈔，否則建議直接帶台幣。',
    },
  ],
  EUR: [
    {
      question: '去歐洲要換多少歐元現金？',
      answer:
        '歐洲刷卡普及，建議準備 200-300 歐元現金即可，用於小餐廳、市集、公共廁所等現金場合。盡量換 50 歐元以下小額鈔票，部分商家不收 100、200 歐元大鈔。',
    },
    {
      question: '歐元在台灣哪裡換最划算？',
      answer:
        '台銀、兆豐等大型銀行皆可換歐元，匯率差異不大。線上結匯通常比臨櫃優惠，可提前鎖定匯率，到機場或分行領取。建議提早 2-3 個工作天預約，確保有足夠庫存。',
    },
  ],
  HKD: [
    {
      question: '港幣匯率很穩定，什麼時候換都一樣嗎？',
      answer:
        '港幣採聯繫匯率制度，與美元維持固定區間，因此匯率波動較小。但仍會隨美元對台幣走勢變動，若美元走弱時換港幣會稍划算。短期旅遊不需太在意時機，隨時換即可。',
    },
  ],
  CNY: [
    {
      question: '去中國大陸要換多少人民幣？',
      answer:
        '中國大陸行動支付極為普及，外國旅客可用國際信用卡綁定微信支付或支付寶。建議準備 500-1,000 人民幣現金備用，用於不支援行動支付的小攤或緊急情況。',
    },
    {
      question: '人民幣攜帶出境有限額嗎？',
      answer:
        '有。台灣法規規定攜帶人民幣進出境限額為 2 萬元人民幣。超過需向海關申報。建議大額資金透過外幣帳戶匯款，避免攜帶大量現金。',
    },
  ],
  THB: [
    {
      question: '去泰國要在台灣先換泰銖嗎？',
      answer:
        '不建議在台灣換大量泰銖，台灣銀行匯率比曼谷 Super Rich 差 10% 以上。建議只在台灣換少量（約 1,000-2,000 泰銖）用於機場交通，抵達曼谷後再到 Super Rich 換足額。',
    },
    {
      question: '帶台幣去泰國換泰銖要注意什麼？',
      answer:
        '準備新鈔、無摺痕的台幣千元鈔票。有皺摺、破損、塗鴉的舊鈔可能被拒收或匯率打折。換匯時需攜帶護照，每人每次換匯無上限，但建議依行程需求分批換。',
    },
  ],
  VND: [
    {
      question: '台幣換越南盾，在台灣換還是到當地換？',
      answer:
        '強烈建議到越南當地換。台灣銀行匯率約 1:752，越南銀樓約 1:854，每 1 萬台幣相差超過 100 萬越盾。在台灣只需換少量（約 50-100 萬越盾）應急金即可。',
    },
  ],
  SGD: [
    {
      question: '新加坡幣在台灣好換嗎？',
      answer:
        '新加坡幣是主要貨幣，台灣大型銀行皆有提供。星展銀行（新加坡銀行）通常提供較優惠的新幣匯率，可優先比較。',
    },
  ],
  AUD: [
    {
      question: '去澳洲需要換多少澳幣現金？',
      answer:
        '澳洲刷卡極為普及，許多店家甚至不收現金（cash-free）。建議只準備 100-200 澳幣現金備用，主要用於小費或緊急情況，其餘全程刷卡即可。',
    },
  ],
  GBP: [
    {
      question: '英鎊在台灣好換嗎？',
      answer:
        '英鎊是主要貨幣，台灣大型銀行皆可換。玉山銀行通常提供較優惠的英鎊匯率。建議提前 1-2 天預約，確保有足夠庫存。',
    },
  ],
  CAD: [
    {
      question: '去加拿大要準備多少加幣現金？',
      answer:
        '加拿大刷卡普及，但小費文化盛行（餐廳 15-20%）。建議準備 100-200 加幣現金用於小費，其餘可刷卡。部分餐廳會在帳單上直接加小費選項，可選擇刷卡支付。',
    },
  ],
  CHF: [
    {
      question: '瑞士法郎在台灣好換嗎？',
      answer:
        '瑞士法郎非主要幣別，部分銀行可能庫存有限。建議提前 2-3 天向銀行預約，或選擇台銀、兆豐等大型銀行換匯。',
    },
  ],
  NZD: [
    {
      question: '紐元在台灣好換嗎？',
      answer:
        '紐元是次要貨幣，部分銀行可能庫存有限。新光銀行通常提供較優惠的紐元匯率。建議提前預約，或選擇大型銀行換匯。',
    },
  ],
  PHP: [
    {
      question: '去菲律賓要帶台幣還是美金？',
      answer:
        '建議帶美金到菲律賓換披索，匯率比直接換披索更好。在台灣先換新版、大面額美金（100 元與 50 元），舊版美金在菲律賓可能被拒收。',
    },
  ],
  IDR: [
    {
      question: '去峇里島要在台灣先換印尼盾嗎？',
      answer:
        '不建議在台灣換大量印尼盾。台灣銀行匯率較差，且印尼盾面額大、張數多不便攜帶。建議只換少量應急金，抵達峇里島後在市區換匯所（如 Sanur、Ubud）換足額。',
    },
  ],
  MYR: [
    {
      question: '馬來幣在台灣好換嗎？',
      answer:
        '馬來幣是次要貨幣，部分銀行可能庫存有限。台灣銀行、兆豐銀行通常有提供，建議提前預約。或抵達吉隆坡後在市區換匯所換，匯率可能更優。',
    },
  ],
};

export type CurrencyLandingCode = keyof typeof CURRENCY_PAGE_OVERRIDES;

function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-TW');
}

export const DEFAULT_EXAMPLE_AMOUNTS = {
  USD: 1000,
  JPY: 100000,
  EUR: 1000,
  KRW: 100000,
  HKD: 10000,
  THB: 10000,
  VND: 1000000,
} as const;

export function getDefaultExampleAmount(currencyCode: string): number {
  return Object.prototype.hasOwnProperty.call(DEFAULT_EXAMPLE_AMOUNTS, currencyCode)
    ? DEFAULT_EXAMPLE_AMOUNTS[currencyCode as keyof typeof DEFAULT_EXAMPLE_AMOUNTS]
    : 1000;
}

export interface RateDifferenceSentenceInput {
  currencyCode: string;
  currencyName: string;
  direction: 'to-twd' | 'twd-to-foreign';
  exampleAmount?: number;
  bankMid?: number | null;
  cashSell?: number | null;
}

export function buildRateDifferenceSentence(input: RateDifferenceSentenceInput): string {
  const { currencyCode, currencyName, direction, exampleAmount, bankMid, cashSell } = input;
  const amount = exampleAmount && exampleAmount > 0 ? exampleAmount : 1000;

  if (bankMid == null || cashSell == null) {
    return '中間價只適合觀察市場方向，實際換匯仍應以銀行牌告買入價或賣出價為準。換匯金額越大，買賣價差的影響越明顯。';
  }

  if (direction === 'twd-to-foreign') {
    const foreignAtMid = amount / bankMid;
    const foreignAtSell = amount / cashSell;
    const diffForeign = Math.abs(foreignAtMid - foreignAtSell);
    return `差距有多大？以 ${formatAmount(amount)} 台幣估算 TWD→${currencyCode}，若用中間價推算約可換得 ${formatAmount(
      foreignAtMid,
    )} ${currencyCode}，實際台銀賣出價約可換得 ${formatAmount(
      foreignAtSell,
    )} ${currencyCode}，少換約 ${formatAmount(diffForeign)} ${currencyCode}。換匯金額越大，差距越明顯。`;
  }

  const midCost = amount * bankMid;
  const sellCost = amount * cashSell;
  const diff = Math.abs(sellCost - midCost);

  return `差距有多大？以買 ${formatAmount(amount)} ${currencyName} 所需台幣估算，中間價與台銀實際賣出價約相差 ${Math.round(
    diff,
  ).toLocaleString('zh-TW')} 元台幣；金額越大，差距越明顯。`;
}

export interface PairAmountSeoCopy {
  title: string;
  description: string;
}

export function buildPairAmountSeo(
  amount: number,
  currencyCode: string,
  currencyName: string,
  direction: 'to-twd' | 'twd-to-foreign' = 'to-twd',
): PairAmountSeoCopy {
  const formatted = formatAmount(amount);

  if (direction === 'twd-to-foreign') {
    return {
      title: `${formatted} 台幣換${currencyName}（TWD/${currencyCode}）— 台銀實際賣出價 | ${APP_INFO.shortName}`,
      description: `${formatted} 台幣今日可換多少${currencyName}？${APP_INFO.shortName} 直接顯示台銀牌告現金賣出價（非中間價），資料每 5 分鐘自動更新，幫你出國換匯前精確估算可兌換的外幣金額，避免被中間價誤導。`,
    };
  }

  return {
    title: `買 ${formatted} ${currencyName}要多少新台幣（${currencyCode}/TWD）— 台銀實際賣出價 | ${APP_INFO.shortName}`,
    description: `買 ${formatted} ${currencyName}今日要多少新台幣？${APP_INFO.shortName} 直接顯示台銀牌告現金賣出價（非中間價），資料每 5 分鐘自動更新，幫你出國換匯前精確估算所需台幣金額，避免被中間價誤導。`,
  };
}

/**
 * 根據每日更新的匯差數據，產生具體落差敘述句。
 * 同時顯示外幣數量（實際 vs 中間價預期）與台幣差距，提升 LLM 引用精確度。
 */
function buildRateExampleSentence(code: string, displayName: string): string {
  const ex = SEO_RATE_EXAMPLES[code];
  if (!ex) return '換匯金額越大、落差越明顯。';
  // 整萬數格式：30000 → "3 萬"，以符合中文閱讀習慣。
  const twdLabel =
    ex.exampleTWD % 10000 === 0 ? `${ex.exampleTWD / 10000} 萬` : formatAmount(ex.exampleTWD);
  const fCash = formatAmount(ex.foreignAtCash);
  const fMid = formatAmount(ex.foreignAtMarketMid);
  const fDiff = formatAmount(ex.diffForeign);
  return `以換 ${twdLabel}元新台幣的${displayName}為例：台灣銀行臨櫃現金實際只能換到 ${fCash} ${code}，而 Google（資料來源：Morningstar）、XE、Wise、Apple 計算機（資料來源：Yahoo Finance）等工具顯示的市場中間價換算結果約為 ${fMid} ${code}——兩者相差約 ${fDiff} ${code}（差距 ${ex.diffPct}%）。若先用中間價估算再去台銀換匯，實際會比預期少換 ${fDiff} ${code}，等於多花了 ${ex.diffTWD} 元新台幣的匯差。（匯差數據每日自動更新，最後更新：${SEO_RATE_EXAMPLES_DATE}）`;
}

/**
 * 在 FAQ 答案中嵌入靜態匯率數字，讓 Googlebot 原始 HTML 層次即可讀到匯率。
 * 數據來自 SEO_RATE_EXAMPLES（每日 GitHub Actions 自動更新）。
 */
function buildCashSellRateSentence(code: string, baseAmount: number): string {
  const ex = SEO_RATE_EXAMPLES[code];
  if (!ex) return '';
  const result = Math.round(baseAmount * ex.cashSell);
  return `以台銀現金賣出匯率換算，${formatAmount(baseAmount)} ${code} ≈ ${formatAmount(result)} 元台幣（台銀現金賣出 1 ${code} = ${ex.cashSell} TWD，匯率每日自動更新，最後更新：${SEO_RATE_EXAMPLES_DATE}）。`;
}

/** 反向頁（TWD→外幣）FAQ：嵌入台幣換外幣的靜態換算結果。 */
function buildTwdToForeignRateSentence(code: string, twdAmount: number): string {
  const ex = SEO_RATE_EXAMPLES[code];
  if (!ex) return '';
  const result = Math.round(twdAmount / ex.cashSell);
  return `以台銀現金賣出匯率換算，${formatAmount(twdAmount)} 台幣 ≈ ${formatAmount(result)} ${code}（台銀現金賣出 1 ${code} = ${ex.cashSell} TWD，匯率每日自動更新，最後更新：${SEO_RATE_EXAMPLES_DATE}）。`;
}

/**
 * 幣對頁 Answer Capsule：40-60 字直接答案段落，供 AI 引擎直接引用。
 * P1-1 任務：在所有 34 幣對頁頂部加入 Answer Capsule，提升 AI 引用率 +40%。
 */
function buildCurrencyAnswerCapsule(
  code: string,
  displayName: string,
  direction: 'to-twd' | 'twd-to-foreign',
): FAQEntry[] {
  const ex = SEO_RATE_EXAMPLES[code];
  if (!ex) return [];

  if (direction === 'to-twd') {
    return [
      {
        question: `買${displayName}今日台銀賣出價是多少？`,
        answer: `台銀現金賣出價：1 ${code} = ${ex.cashSell} TWD（${SEO_RATE_EXAMPLES_DATE} 更新）。${APP_INFO.shortName} 直接顯示臺灣銀行牌告的實際賣出價，非中間價，換匯前可精準估算所需台幣。`,
      },
      {
        question: `為什麼 ${APP_INFO.shortName} 顯示的${displayName}匯率和 Google 不一樣？`,
        answer: `Google 顯示的是市場中間價（批發參考價），一般人換不到。${APP_INFO.shortName} 顯示的是台銀牌告的現金賣出價，是你臨櫃換匯的實際匯率，兩者差距可達 ${ex.diffPct}%。`,
      },
    ];
  }

  // twd-to-foreign
  const exampleTwd = ex.exampleTWD;
  const foreignResult = Math.round(exampleTwd / ex.cashSell);
  return [
    {
      question: `台幣換${displayName}今日匯率是多少？`,
      answer: `台銀現金賣出價：1 ${code} = ${ex.cashSell} TWD（${SEO_RATE_EXAMPLES_DATE} 更新）。${formatAmount(exampleTwd)} 台幣約可換 ${formatAmount(foreignResult)} ${code}。${APP_INFO.shortName} 顯示臺灣銀行牌告實際賣出價，出國換匯前可精準估算。`,
    },
    {
      question: `出國前換${displayName}，該用哪個匯率？`,
      answer: `臨櫃換現鈔看「現金賣出」，網銀外幣帳戶看「即期賣出」。${APP_INFO.shortName} 同時顯示兩種匯率，讓你依換匯情境選擇正確報價。`,
    },
  ];
}

export function getCurrencyLandingPageContent(
  code: CurrencyLandingCode,
): CurrencyLandingPageContent {
  const override = CURRENCY_PAGE_OVERRIDES[code];
  const definition = CURRENCY_DEFINITIONS[code];
  const pathname = `/${code.toLowerCase()}-twd`;
  const displayName = override.displayName;

  const indexablePopularAmounts =
    INDEXABLE_FORWARD_AMOUNTS[code.toLowerCase()] ?? override.popularAmounts;

  const commonAmounts: CommonAmountEntry[] = indexablePopularAmounts.map((amount) => ({
    amount,
    label: `${formatAmount(amount)} ${code}`,
    question: `買 ${formatAmount(amount)} ${displayName}要多少台幣？`,
  }));

  const canonicalUrl = buildCanonicalUrl(pathname);
  const rateExample = SEO_RATE_EXAMPLES[code];
  const spotAvailable = rateExample?.spotAvailable ?? true;

  const faqEntries: FAQEntry[] = [
    {
      question: `為什麼 Google、XE、Wise、Apple 計算機顯示的${displayName}換算金額，和台灣銀行臨櫃換匯的實際結果不同？`,
      answer: `Google 匯率（資料來源：Morningstar）、XE、Wise 及 Apple 計算機（資料來源：Yahoo Finance）所顯示的匯率均為「市場中間價」（mid-market rate）——即全球銀行同業間批發交易的參考基準價，一般消費者無法直接以此價格換匯。這些工具本質上是匯率參考儀表板，並非反映實際臨櫃換匯成本。台灣銀行臨櫃現金換匯使用的是「現金賣出」牌告價，因需涵蓋現鈔保管、運送與保險成本，通常比市場中間價高出 1% 至 10% 以上（東南亞及非主流貨幣差距尤為顯著）。${buildRateExampleSentence(code, displayName)} ${APP_INFO.name}直接顯示臺灣銀行官方牌告的${spotAvailable ? '現金賣出與即期賣出價' : '現金賣出價'}，是專為台灣人設計的精準換匯工具，讓使用者出門換匯前即可掌握真實兌換金額，不被市場中間價誤導。`,
    },
    // 幣別特化 FAQ：基於權威金融網站資訊，提供該幣別獨特的換匯知識
    ...(CURRENCY_SPECIFIC_FAQ[code] ?? []),
    ...(spotAvailable
      ? [
          {
            question: `${displayName}現金賣出和即期賣出有什麼差別？怎麼選？`,
            answer: `「現金賣出」適合臨櫃換外幣現鈔，「即期賣出」適合網銀外幣帳戶轉換或匯款。現金匯率通常比即期差，因為銀行需負擔現鈔的保管、運送與保險成本。出國旅遊前換現金看「現金賣出」，線上外幣轉換看「即期賣出」。`,
          },
        ]
      : []),
    {
      question: `買${displayName}今日台銀賣出價是多少？`,
      answer: `${buildCashSellRateSentence(code, indexablePopularAmounts[0])}使用本工具可查看 5 分鐘即時更新匯率，點擊「開始換算」輸入任意金額查看結果。`,
    },
    {
      question: `${formatAmount(indexablePopularAmounts.at(-1) ?? 0)} ${displayName}大約等於多少台幣？`,
      answer: `${buildCashSellRateSentence(code, indexablePopularAmounts.at(-1) ?? 0)}實際匯率以台銀牌告為準，請使用本工具查看 5 分鐘即時更新結果。`,
    },
    {
      question: `出國刷卡的匯率跟 ${APP_INFO.shortName} 顯示的${displayName}台銀牌告匯率一樣嗎？`,
      answer: `不一樣。出國刷卡使用的是發卡組織（Visa、Mastercard）的清算匯率，再加上發卡銀行的海外交易手續費（通常 1.5%），與臺灣銀行牌告匯率是不同體系。本工具顯示的台銀牌告匯率適用於臨櫃換鈔或外幣帳戶匯款，不代表你出國刷卡時的實際扣款匯率。若出國以刷卡為主，建議另行查詢發卡銀行的海外手續費規定。`,
    },
    // 替代換匯管道 FAQ（如明洞換匯所），僅有 alternativeProviders 的幣別（KRW）會產生條目
    // /krw-twd/ 頁方向為 to-twd（旅客持 KRW 換 TWD），使用 rateBuy 版本 FAQ
    ...buildAlternativeProviderFaq(code, rateExample ?? ({} as RateExample), 'to-twd'),
  ];

  return {
    currencyCode: code,
    currencyFlag: definition.flag,
    currencyName: displayName,
    title: `即時${displayName}匯率 — 台銀實際賣出價 | ${code}/TWD`,
    description: spotAvailable
      ? `即時查看台銀${displayName}現金賣出價（非中間價），換匯前確認你真正要付多少台幣。資料來源臺灣銀行官方牌告，每 5 分鐘自動同步，支援現金與即期匯率切換，附快速金額按鈕與 7～30 天歷史趨勢圖。適合${override.region}費用估算使用。`
      : `即時查看台銀${displayName}現金賣出價（非中間價），換匯前確認你真正要付多少台幣。資料來源臺灣銀行官方牌告，每 5 分鐘自動同步，附快速金額按鈕與 7～30 天歷史趨勢圖。適合${override.region}費用估算使用。`,
    pathname,
    canonical: canonicalUrl,
    keywords: [
      `${code} TWD 匯率`,
      override.keyword,
      `${displayName}匯率`,
      `${displayName}換台幣`,
      ...override.searchQueries,
      '匯率換算',
      APP_INFO.name,
    ],
    jsonLd: [
      buildShareImageJsonLd(
        `${displayName}兌台幣匯率分享圖片`,
        `${APP_INFO.name} ${code}/TWD 即時匯率換算與趨勢`,
      ),
      // 幣別頁只輸出可稽核的匯率數值 schema，避免把 FAQ rich result 訊號擴散到金融頁。
      ...(rateExample
        ? [
            buildExchangeRateSpecificationJsonLd(
              code,
              'TWD',
              rateExample.cashSell,
              `臺灣銀行現金賣出價（買${displayName}所需台幣匯率）`,
            ),
          ]
        : []),
    ],
    faqEntries,
    howToSteps: [
      {
        position: 1,
        name: '選擇原始貨幣',
        text: `在首頁將來源貨幣設定為 ${code}，再選擇 TWD 或其他目標貨幣。可點擊星號收藏常用幣別。`,
      },
      {
        position: 2,
        name: '輸入金額',
        text: `輸入 ${code} 金額、使用計算機鍵盤或點擊快速金額按鈕（如 ${indexablePopularAmounts.slice(0, 3).map(formatAmount).join('、')}），系統即時計算換算結果。`,
      },
      {
        position: 3,
        name: '切換匯率類型',
        text: spotAvailable
          ? '依換匯情境切換現金匯率或即期匯率。臨櫃換鈔選現金，匯款轉帳選即期。'
          : '此幣別以現金牌告為主，換匯前請直接確認現金賣出價並搭配歷史趨勢判斷預算。',
      },
      {
        position: 4,
        name: '查看趨勢與歷史',
        text: '展開匯率卡片可查看 7~30 天歷史趨勢圖，幫助判斷換匯時機。',
      },
    ],
    highlights: [
      spotAvailable
        ? `精準賣出價：顯示臺灣銀行牌告的現金賣出與即期賣出實際報價，非中間價——換匯金額更精準，避免低估所需台幣。`
        : `精準賣出價：顯示臺灣銀行牌告的現金賣出實際報價，非中間價——換匯金額更精準，避免低估所需台幣。`,
      spotAvailable
        ? `資料來源：臺灣銀行牌告匯率，現金與即期買入賣出四種報價完整呈現。`
        : `資料來源：臺灣銀行牌告匯率，頁面以該幣別可實際查得的現金買入賣出報價為準。`,
      `更新頻率：每 5 分鐘自動同步，首頁顯示最近更新時間，亦可下拉手動重新整理。`,
      `適用情境：${override.region}前快速查看 ${code}/TWD 即時換算與歷史趨勢。`,
      `${override.travelTip}`,
      `工具功能：計算機鍵盤快速輸入、快速金額按鈕、收藏管理與拖曳排序、換算歷史紀錄。`,
    ],
    commonAmounts,
    travelTip: override.travelTip,
    faqTitle: `${displayName}換匯常見問題`,
    direction: 'to-twd' as const,
    relatedGuides: RELATED_GUIDES_TO_TWD,
    answerCapsule: buildCurrencyAnswerCapsule(code, displayName, 'to-twd'),
    ...(rateExample?.alternativeProviders
      ? { alternativeProviders: rateExample.alternativeProviders }
      : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 反向幣別頁（TWD→外幣）：出國換匯場景 SSOT
// ─────────────────────────────────────────────────────────────────────────────

/** 反向幣別頁的差異化覆寫：強調出國前換匯場景與台幣→外幣方向。 */
const REVERSE_CURRENCY_PAGE_OVERRIDES = {
  USD: {
    keyword: '台幣換美金',
    travelTip: '出國前在台灣市區銀行換美金現鈔，匯率通常優於機場；信用卡手續費另計。',
    outboundTip: '赴美期間以刷卡為主，建議備少量現金備用。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換美金', '30000台幣換多少美金', '美金匯率今日買入'],
  },
  JPY: {
    keyword: '台幣換日圓',
    travelTip: '日本許多餐廳與小店仍以現金為主，建議出發前換足日圓現鈔。',
    outboundTip: '可在台灣銀行或兆豐銀行換日圓，機場匯率通常較差。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換日圓', '50000台幣換多少日圓', '日圓匯率買入'],
  },
  EUR: {
    keyword: '台幣換歐元',
    travelTip: '歐洲多數商家接受刷卡，建議備少量歐元現金用於小攤或市集。',
    outboundTip: '歐元在台灣市區銀行可換，建議提早預留 2~3 個工作天。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換歐元', '30000台幣換多少歐元', '歐元匯率買入'],
  },
  GBP: {
    keyword: '台幣換英鎊',
    travelTip: '英國感應支付普及，現金需求少；建議少量備用即可。',
    outboundTip: '英鎊在台灣大型銀行可換，非主要幣別建議提前詢問庫存。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換英鎊', '30000台幣換多少英鎊', '英鎊匯率買入'],
  },
  CNY: {
    keyword: '台幣換人民幣',
    travelTip: '中國大陸以行動支付為主，少量人民幣備用即可應付小額付款。',
    outboundTip: '赴中國大陸前可在台灣銀行換人民幣現鈔，建議確認各行庫存。',
    popularTwdAmounts: [5000, 10000, 30000, 50000, 100000, 200000],
    searchQueries: ['台幣換人民幣', '10000台幣換多少人民幣', '人民幣匯率買入'],
  },
  KRW: {
    keyword: '台幣換韓元',
    travelTip: '韓國多數店家接受刷卡，但夜市與路邊攤建議準備現金。',
    outboundTip: '韓元在台灣部分銀行可換，或抵達首爾明洞換匯所匯率有時更優。',
    popularTwdAmounts: [5000, 10000, 30000, 50000, 100000, 200000],
    searchQueries: ['台幣換韓元', '10000台幣換多少韓元', '韓元匯率買入'],
  },
  HKD: {
    keyword: '台幣換港幣',
    travelTip: '香港八達通卡方便；其餘可刷卡或付港幣現金。',
    outboundTip: '港幣在台灣市區銀行可換，匯率穩定且流動性佳。',
    popularTwdAmounts: [5000, 10000, 30000, 50000, 100000, 200000],
    searchQueries: ['台幣換港幣', '10000台幣換多少港幣', '港幣匯率買入'],
  },
  AUD: {
    keyword: '台幣換澳幣',
    travelTip: '澳洲刷卡普及，建議少量備用澳幣現金即可。',
    outboundTip: '澳幣在台灣大型銀行可換，建議提前 2 天預約。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換澳幣', '30000台幣換多少澳幣', '澳幣匯率買入'],
  },
  CAD: {
    keyword: '台幣換加幣',
    travelTip: '加拿大刷卡普及，備少量現金用於小費或緊急情況。',
    outboundTip: '加幣在台灣大型銀行可換，非旺季建議提前確認庫存。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換加幣', '30000台幣換多少加幣', '加幣匯率買入'],
  },
  SGD: {
    keyword: '台幣換新加坡幣',
    travelTip: '新加坡刷卡與行動支付普及，熟食中心建議備少量現金。',
    outboundTip: '新幣在台灣銀行可換，或抵達後在機場/市區換匯所換。',
    popularTwdAmounts: [5000, 10000, 30000, 50000, 100000, 200000],
    searchQueries: ['台幣換新幣', '10000台幣換多少新加坡幣', '新幣匯率買入'],
  },
  THB: {
    keyword: '台幣換泰銖',
    travelTip: '泰國夜市、計程車以現金為主，建議攜帶充足泰銖。',
    outboundTip: '泰銖在台灣部分銀行可換，或抵達曼谷後在蘇坤蔚路換匯所換。',
    popularTwdAmounts: [5000, 10000, 30000, 50000, 100000, 200000],
    searchQueries: ['台幣換泰銖', '10000台幣換多少泰銖', '泰銖匯率買入'],
  },
  NZD: {
    keyword: '台幣換紐元',
    travelTip: '紐西蘭刷卡普及，部分戶外活動建議備少量現金。',
    outboundTip: '紐元在台灣大型銀行可換，建議提前確認庫存。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換紐元', '30000台幣換多少紐元', '紐元匯率買入'],
  },
  CHF: {
    keyword: '台幣換瑞士法郎',
    travelTip: '瑞士消費水準高，刷卡普遍；備少量法郎現金備用即可。',
    outboundTip: '瑞郎在台灣大型銀行可換，非主要幣別建議提前預約。',
    popularTwdAmounts: [10000, 30000, 50000, 100000, 200000, 300000],
    searchQueries: ['台幣換瑞郎', '30000台幣換多少瑞士法郎', '瑞郎匯率買入'],
  },
  VND: {
    keyword: '台幣換越南盾',
    travelTip: '越南以現金為主，建議攜帶充足越南盾，面額大鈔較受歡迎。',
    outboundTip: '越南盾在台灣部分銀行可換，或抵達後在河內/胡志明市換匯。',
    popularTwdAmounts: [3000, 5000, 10000, 30000, 50000, 100000],
    searchQueries: ['台幣換越南盾', '10000台幣換多少越南盾', '越南盾匯率買入'],
  },
  PHP: {
    keyword: '台幣換菲律賓披索',
    travelTip: '菲律賓觀光區刷卡普及，偏遠地區建議準備披索現金。',
    outboundTip: '披索在台灣銀行可換，或抵達馬尼拉/宿霧後在機場換匯。',
    popularTwdAmounts: [3000, 5000, 10000, 30000, 50000, 100000],
    searchQueries: ['台幣換菲律賓披索', '10000台幣換多少披索', '披索匯率買入'],
  },
  IDR: {
    keyword: '台幣換印尼盾',
    travelTip: '印尼（峇里島）以現金為主，建議在峇里島市區換匯所兌換，匯率通常優於機場。',
    outboundTip: '印尼盾在台灣部分銀行可換，面額大，建議確認所需張數。',
    popularTwdAmounts: [3000, 5000, 10000, 30000, 50000, 100000],
    searchQueries: ['台幣換印尼盾', '10000台幣換多少印尼盾', '印尼盾匯率買入'],
  },
  MYR: {
    keyword: '台幣換馬來幣',
    travelTip: '吉隆坡市區刷卡普及，夜市和熟食中心建議準備現金。',
    outboundTip: '馬來幣在台灣部分銀行可換，或抵達後在吉隆坡市區換匯。',
    popularTwdAmounts: [3000, 5000, 10000, 30000, 50000, 100000],
    searchQueries: ['台幣換馬來幣', '10000台幣換多少馬來幣', '馬來幣匯率買入'],
  },
} as const;

export type ReverseCurrencyLandingCode = keyof typeof REVERSE_CURRENCY_PAGE_OVERRIDES;

export function getReverseCurrencyLandingPageContent(
  code: ReverseCurrencyLandingCode,
): CurrencyLandingPageContent {
  const override = REVERSE_CURRENCY_PAGE_OVERRIDES[code];
  const forwardOverride = CURRENCY_PAGE_OVERRIDES[code];
  const definition = CURRENCY_DEFINITIONS[code];
  const pathname = `/twd-${code.toLowerCase()}`;
  const displayName = forwardOverride.displayName;

  const commonAmounts: CommonAmountEntry[] = override.popularTwdAmounts.map((amount) => ({
    amount,
    label: `${formatAmount(amount)} TWD`,
    question: `${formatAmount(amount)} 台幣可以換多少${displayName}？`,
  }));

  const canonicalUrl = buildCanonicalUrl(pathname);
  const rateExample = SEO_RATE_EXAMPLES[code];
  const spotAvailable = rateExample?.spotAvailable ?? true;

  const faqEntries: FAQEntry[] = [
    {
      question: `現在台幣換${displayName}划算嗎？什麼時候換比較好？`,
      answer: `匯率每日波動，難以預測「最佳時機」。${APP_INFO.shortName} 提供 7～30 天歷史趨勢圖，讓你觀察近期走勢。建議分批換匯分散風險，而非等待所謂最低點。出發前 1～2 週開始觀察趨勢，視需求分 2～3 次換匯是常見策略。`,
    },
    // 反向頁特化 FAQ：基於權威金融網站資訊，提供出國換匯場景的獨特知識
    ...(REVERSE_CURRENCY_SPECIFIC_FAQ[code] ?? []),
    {
      question: `帶台幣去銀行換${displayName}，要看哪個匯率？`,
      answer: `你帶台幣去銀行買${displayName}現鈔，銀行是在「賣出」外幣給你，需參考台銀牌告的「現金賣出」價。${APP_INFO.shortName} 直接顯示此數字——這才是你實際要付的台幣金額，而非 Google 或 XE 顯示的市場中間價。`,
    },
    {
      question: `${formatAmount(override.popularTwdAmounts[2] ?? 30000)} 台幣可以換多少${displayName}？`,
      answer: `${buildTwdToForeignRateSentence(code, override.popularTwdAmounts[2] ?? 30000)}實際匯率以台銀牌告為準，請使用本工具查看 5 分鐘即時更新結果。`,
    },
    {
      question: `出國刷卡跟換現金哪個比較省？`,
      answer: `取決於發卡銀行的海外手續費。部分無手續費卡片搭配Visa/Mastercard清算匯率，整體成本可能低於現金換匯。但現金在特定地區（如泰國、日本）更實用。建議同時準備少量現金加信用卡。`,
    },
    ...(spotAvailable
      ? [
          {
            question: `換${displayName}現金和外幣帳戶匯款哪種匯率較好？`,
            answer: `外幣帳戶使用「即期賣出」匯率，通常優於「現金賣出」，因為銀行省去了現鈔保管與運送成本。如不急需現鈔，透過網銀外幣帳戶換匯通常可省下一些匯差。${APP_INFO.shortName} 可一鍵切換查看兩種報價。`,
          },
        ]
      : []),
    // 替代換匯管道 FAQ（如明洞換匯所），僅 KRW 等有 alternativeProviders 的幣別會產生條目
    // /twd-krw/ 頁方向為 twd-to-foreign（旅客持 TWD 換 KRW），使用 rate（sell 率）版本 FAQ
    ...buildAlternativeProviderFaq(code, rateExample ?? ({} as RateExample), 'twd-to-foreign'),
  ];

  return {
    currencyCode: code,
    currencyFlag: definition.flag,
    currencyName: displayName,
    title: `台幣換${displayName}匯率 — 出國換匯實際費率 | TWD/${code}`,
    description: spotAvailable
      ? `出國換${displayName}前，先用台銀實際現金賣出價（非中間價）確認你真正要付多少台幣。資料來源臺灣銀行官方牌告，每 5 分鐘自動同步，支援現金與即期匯率切換，附快速金額按鈕與 7～30 天歷史趨勢圖，幫助你合理規劃換匯預算。`
      : `出國換${displayName}前，先用台銀實際現金賣出價（非中間價）確認你真正要付多少台幣。資料來源臺灣銀行官方牌告，每 5 分鐘自動同步，附快速金額按鈕與 7～30 天歷史趨勢圖，幫助你合理規劃換匯預算。`,
    pathname,
    canonical: canonicalUrl,
    keywords: [
      override.keyword,
      `TWD ${code} 匯率`,
      `台幣換${displayName}`,
      `${displayName}匯率今日`,
      ...override.searchQueries,
      '換匯計算',
      APP_INFO.name,
    ],
    jsonLd: [
      buildShareImageJsonLd(
        `台幣換${displayName}匯率分享圖片`,
        `${APP_INFO.name} TWD/${code} 出國換匯即時計算`,
      ),
      // 反向幣別頁同樣只輸出可稽核的匯率數值 schema。
      // 反向頁（TWD→外幣）：currency 為 TWD，priceCurrency 為外幣代碼。
      ...(rateExample
        ? [
            buildExchangeRateSpecificationJsonLd(
              'TWD',
              code,
              Number((1 / rateExample.cashSell).toFixed(6)),
              `臺灣銀行現金賣出價（台幣換${displayName}匯率）`,
            ),
          ]
        : []),
    ],
    faqEntries,
    howToSteps: [
      {
        position: 1,
        name: '選擇換算方向',
        text: `進入 ${APP_INFO.shortName} 首頁，設定來源貨幣為 TWD，目標貨幣選 ${code}。`,
      },
      {
        position: 2,
        name: '輸入台幣金額',
        text: `輸入你想換出的台幣金額，或使用快速金額按鈕（如 ${override.popularTwdAmounts.slice(0, 3).map(formatAmount).join('、')} 台幣），系統即時顯示可換到的${displayName}。`,
      },
      {
        position: 3,
        name: '確認匯率類型',
        text: spotAvailable
          ? '確認使用「現金匯率」（臨櫃換鈔）或「即期匯率」（網銀外幣帳戶）。兩者費率不同，請依換匯方式選擇。'
          : '此幣別以現金牌告為主，出國前請直接確認現金賣出價並搭配歷史趨勢安排換匯節奏。',
      },
      {
        position: 4,
        name: '觀察趨勢，決定換匯時機',
        text: '展開匯率卡片查看 7～30 天歷史趨勢，了解近期匯率高低區間，協助判斷換匯時機。',
      },
    ],
    highlights: [
      `精準費率：顯示台銀現金賣出價——這是你帶台幣換${displayName}現鈔的實際費率，非中間價。`,
      spotAvailable
        ? `資料來源：臺灣銀行牌告匯率，現金與即期買入賣出四種報價完整呈現。`
        : `資料來源：臺灣銀行牌告匯率，頁面以該幣別可實際查得的現金買入賣出報價為準。`,
      `更新頻率：每 5 分鐘自動同步，顯示最近更新時間，可手動重新整理。`,
      `換匯估算：輸入台幣金額即時計算可換到的${displayName}，並附 7～30 天趨勢。`,
      `${override.travelTip}`,
      `工具功能：計算機鍵盤快速輸入、快速金額按鈕、收藏管理、換算歷史紀錄。`,
    ],
    commonAmounts,
    travelTip: override.travelTip,
    faqTitle: `台幣換${displayName}常見問題`,
    direction: 'twd-to-foreign' as const,
    relatedGuides: RELATED_GUIDES_TWD_TO_FOREIGN,
    answerCapsule: buildCurrencyAnswerCapsule(code, displayName, 'twd-to-foreign'),
    ...(rateExample?.alternativeProviders
      ? { alternativeProviders: rateExample.alternativeProviders }
      : {}),
  };
}
