import { describe, expect, it } from 'vitest';
import { normalizeQuote } from '@app/shared/fx';
import { getFxQuoteNotices as getNotices } from '../fxQuoteNotices';

const NOW = '2026-09-30T00:00:00Z';
const base = {
  providerId: 'bot',
  subjectCurrency: 'USD',
  priceCurrency: 'TWD',
  unitAmount: '1',
  providerBuyPrice: '30',
  providerSellPrice: '32',
  sourcePublishedAt: NOW as string | null,
  fetchedAt: NOW,
  lastSuccessfulCheckAt: NOW,
  serviceCountry: 'TW',
  deliveryMethod: 'cash' as const,
  channel: 'branch' as const,
  dataKind: 'published_board' as const,
};
const quotes = (providerId: string, sourcePublishedAt: string | null) =>
  normalizeQuote({ ...base, providerId, sourcePublishedAt });

type NoticeInput = Parameters<typeof getNotices>[0];
const getFxQuoteNotices = (
  input: Omit<NoticeInput, 'serviceCountry' | 'fallbackActive'> &
    Partial<Pick<NoticeInput, 'serviceCountry' | 'fallbackActive'>>,
) => getNotices({ serviceCountry: 'TW', fallbackActive: false, ...input });

describe('getFxQuoteNotices', () => {
  it('stays silent when the selected provider is fresh and healthy', () => {
    expect(
      getFxQuoteNotices({
        quotes: quotes('bot', NOW),
        providerStatuses: new Map([['bot', 'ok']]),
        preference: { mode: 'manual', manualProvider: { providerId: 'bot' } },
        now: NOW,
        refreshFailed: false,
      }),
    ).toEqual([]);
  });

  it('warns that a manually selected stale provider is still used', () => {
    const notices = getFxQuoteNotices({
      quotes: quotes('bot', '2020-01-01T00:00:00Z'),
      preference: { mode: 'manual', manualProvider: { providerId: 'bot' } },
      now: NOW,
      refreshFailed: false,
    });
    expect(notices).toHaveLength(1);
    expect(notices[0]).toContain('已超過更新門檻');
    expect(notices[0]).toContain('僅供參考');
  });

  it('explains why unknown and stale providers are excluded in best mode', () => {
    const notices = getFxQuoteNotices({
      quotes: [
        ...quotes('bot', NOW),
        ...quotes('second-bank', null),
        ...quotes('third-bank', '2020-01-01T00:00:00Z'),
      ],
      preference: { mode: 'best' },
      now: NOW,
      refreshFailed: false,
    });
    expect(notices.join('\n')).toContain('second-bank：來源未提供發布時間');
    expect(notices.join('\n')).toContain('third-bank：牌告已超過更新門檻');
    expect(notices.every((notice) => notice.endsWith('未列入最佳推薦。'))).toBe(true);
  });

  it('reports failed provider checks and refresh failures', () => {
    const notices = getFxQuoteNotices({
      quotes: quotes('bot', NOW),
      providerStatuses: new Map([['bot', 'failed']]),
      preference: { mode: 'manual', manualProvider: { providerId: 'bot' } },
      now: NOW,
      refreshFailed: true,
    });
    expect(notices[0]).toContain('最新報價更新失敗');
    expect(notices.join('\n')).toContain('來源最近檢查未成功');
  });

  it('does not claim a refresh failure when no verified quotes are displayed', () => {
    expect(
      getFxQuoteNotices({
        quotes: [],
        preference: { mode: 'best' },
        now: NOW,
        refreshFailed: true,
      }),
    ).toEqual([]);
  });

  it('does not call legacy fallback quotes verified; it discloses the fallback instead', () => {
    const notices = getFxQuoteNotices({
      quotes: quotes('bot', NOW),
      preference: { mode: 'best' },
      now: NOW,
      refreshFailed: true,
      fallbackActive: true,
    });
    expect(notices).toEqual(['最新報價載入失敗，暫以備援牌告顯示，換錢所報價暫不可用。']);
  });

  it('ignores providers that only quote another service country', () => {
    const korea = normalizeQuote({
      ...base,
      providerId: 'moneybox',
      serviceCountry: 'KR',
      sourcePublishedAt: '2020-01-01T00:00:00Z',
    });
    const preference = { mode: 'best' as const };

    expect(
      getFxQuoteNotices({ quotes: korea, preference, now: NOW, refreshFailed: false }),
    ).toEqual([]);
    expect(
      getFxQuoteNotices({
        quotes: korea,
        preference,
        now: NOW,
        refreshFailed: false,
        serviceCountry: 'KR',
      }),
    ).toHaveLength(1);
  });

  it('covers a manual provider whose only location differs from the preferred country', () => {
    const korea = normalizeQuote({
      ...base,
      providerId: 'moneybox',
      serviceCountry: 'KR',
      sourcePublishedAt: '2020-01-01T00:00:00Z',
    });

    const notices = getFxQuoteNotices({
      quotes: korea,
      preference: { mode: 'manual', manualProvider: { providerId: 'moneybox' } },
      now: NOW,
      refreshFailed: false,
      serviceCountry: 'TW',
    });

    expect(notices).toHaveLength(1);
    expect(notices[0]).toContain('已超過更新門檻');
  });
});
