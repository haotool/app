/**
 * Mock data for E2E tests
 * Ensures tests are stable and don't depend on external APIs
 *
 * @see https://playwright.dev/docs/best-practices#mock-external-dependencies
 */

export const mockExchangeRates = {
  date: '2025-10-25',
  updateTime: '2025-10-25T03:18:12+08:00',
  source: 'Taiwan Bank (Mock)',
  rates: {
    TWD: 1.0,
    USD: 31.07,
    HKD: 4.011,
    GBP: 41.96,
    AUD: 20.47,
    CAD: 22.43,
    SGD: 24.05,
    CHF: 39.13,
    JPY: 0.2055,
    EUR: 36.31,
    KRW: 0.02361,
    CNY: 4.39,
  },
};

export const mockHistoricalRates = {
  '2025-10-25': mockExchangeRates,
  '2025-10-24': {
    ...mockExchangeRates,
    date: '2025-10-24',
    updateTime: '2025-10-24T03:18:12+08:00',
  },
  '2025-10-23': {
    ...mockExchangeRates,
    date: '2025-10-23',
    updateTime: '2025-10-23T03:18:12+08:00',
  },
  '2025-10-22': {
    ...mockExchangeRates,
    date: '2025-10-22',
    updateTime: '2025-10-22T03:18:12+08:00',
  },
  '2025-10-21': {
    ...mockExchangeRates,
    date: '2025-10-21',
    updateTime: '2025-10-21T03:18:12+08:00',
  },
  '2025-10-20': {
    ...mockExchangeRates,
    date: '2025-10-20',
    updateTime: '2025-10-20T03:18:12+08:00',
  },
};
