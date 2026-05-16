export type CurrencyLandingDirection = 'foreign-to-twd' | 'twd-to-foreign';

export type CurrencyLandingRouteDefinition = Readonly<{
  direction: CurrencyLandingDirection;
  code: string;
  from: string;
  to: string;
  path: `/${string}/`;
  amountPathPattern: `/${string}/:amount`;
  entry: `src/pages/${string}.tsx`;
  pageModule: string;
}>;

const CURRENCY_CODES = [
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'EUR',
  'GBP',
  'HKD',
  'IDR',
  'JPY',
  'KRW',
  'MYR',
  'NZD',
  'PHP',
  'SGD',
  'THB',
  'USD',
  'VND',
] as const;

function createForeignToTwdRoute(code: (typeof CURRENCY_CODES)[number]) {
  const lowerCode = code.toLowerCase();
  const pageModule = `${code}ToTWD`;

  return {
    direction: 'foreign-to-twd',
    code,
    from: code,
    to: 'TWD',
    path: `/${lowerCode}-twd/`,
    amountPathPattern: `/${lowerCode}-twd/:amount`,
    entry: `src/pages/${pageModule}.tsx`,
    pageModule,
  } as const satisfies CurrencyLandingRouteDefinition;
}

function createTwdToForeignRoute(code: (typeof CURRENCY_CODES)[number]) {
  const lowerCode = code.toLowerCase();
  const pageModule = `TWDTo${code}`;

  return {
    direction: 'twd-to-foreign',
    code,
    from: 'TWD',
    to: code,
    path: `/twd-${lowerCode}/`,
    amountPathPattern: `/twd-${lowerCode}/:amount`,
    entry: `src/pages/${pageModule}.tsx`,
    pageModule,
  } as const satisfies CurrencyLandingRouteDefinition;
}

export const CURRENCY_LANDING_ROUTE_REGISTRY = [
  ...CURRENCY_CODES.map(createForeignToTwdRoute),
  ...CURRENCY_CODES.map(createTwdToForeignRoute),
] as const;

export const FORWARD_CURRENCY_LANDING_ROUTES = CURRENCY_LANDING_ROUTE_REGISTRY.filter(
  (route) => route.direction === 'foreign-to-twd',
);

export const REVERSE_CURRENCY_LANDING_ROUTES = CURRENCY_LANDING_ROUTE_REGISTRY.filter(
  (route) => route.direction === 'twd-to-foreign',
);
