import { CURRENCY_DEFINITIONS } from '../features/ratewise/constants';
import type { CurrencyCode } from '../features/ratewise/types';

export interface PopularCurrencyLink {
  code: CurrencyCode;
  href: string;
  label: string;
}

interface PopularCurrencyNavLink extends PopularCurrencyLink {
  flag: string;
  rateLabel: string;
  shortLabel: string;
}

/** 首頁與 SEO ItemList 的熱門外幣順序；同時服務外幣→台幣與台幣→外幣導覽。 */
export const POPULAR_CURRENCY_CODES = [
  'JPY',
  'KRW',
  'USD',
  'EUR',
  'HKD',
  'SGD',
  'THB',
  'VND',
  'AUD',
  'GBP',
] as const satisfies readonly CurrencyCode[];

const buildToTwdLink = (code: (typeof POPULAR_CURRENCY_CODES)[number]): PopularCurrencyNavLink => {
  const definition = CURRENCY_DEFINITIONS[code];

  return {
    code,
    flag: definition.flag,
    href: `/${code.toLowerCase()}-twd/`,
    label: `${definition.name}換台幣`,
    rateLabel: `${definition.name}匯率`,
    shortLabel: `${code} ${definition.name}`,
  };
};

const buildFromTwdLink = (
  code: (typeof POPULAR_CURRENCY_CODES)[number],
): PopularCurrencyNavLink => {
  const definition = CURRENCY_DEFINITIONS[code];

  return {
    code,
    flag: definition.flag,
    href: `/twd-${code.toLowerCase()}/`,
    label: `台幣換${definition.name}`,
    rateLabel: `${definition.name}匯率`,
    shortLabel: `${code} ${definition.name}`,
  };
};

export const POPULAR_TO_TWD_LINKS = POPULAR_CURRENCY_CODES.map(buildToTwdLink);

export const POPULAR_FROM_TWD_LINKS = POPULAR_CURRENCY_CODES.map(buildFromTwdLink);

export const POPULAR_ITEM_LIST_LINKS = [...POPULAR_TO_TWD_LINKS, ...POPULAR_FROM_TWD_LINKS];

export const POPULAR_RATE_LINKS: PopularCurrencyLink[] = POPULAR_TO_TWD_LINKS.slice(0, 6).map(
  ({ code, href, shortLabel }) => ({
    code,
    href,
    label: shortLabel,
  }),
);

export const POPULAR_RELATED_CURRENCY_LINKS: PopularCurrencyLink[] = POPULAR_RATE_LINKS.map(
  ({ code, href }) => ({
    code,
    href,
    label: `${CURRENCY_DEFINITIONS[code].name}匯率`,
  }),
);
