import { getRateProvider } from '../../config/rateProviders';
import type { FxContextSubstitution } from './fxEffectiveContext';

const regions = new Intl.DisplayNames(['zh-TW'], { type: 'region' });

const MAX_LISTED_CURRENCIES = 3;

/** 幣別較多時只列前幾項並標示總數，避免多幣別頁一句話塞滿整個版面。 */
const formatCurrencies = (currencies: readonly string[]) =>
  currencies.length <= MAX_LISTED_CURRENCIES
    ? currencies.join('、')
    : `${currencies.slice(0, MAX_LISTED_CURRENCIES).join('、')} 等 ${currencies.length} 種幣別`;

export function formatFxSubstitution(
  substitution: FxContextSubstitution,
  currencies: readonly string[] = [substitution.toCurrency],
): string {
  const subject = formatCurrencies(currencies);
  if (substitution.kind === 'deliveryMethod')
    return `${subject}無${substitution.from === 'account' ? '即期' : '現鈔'}報價，改以${substitution.to === 'cash' ? '現鈔' : '即期'}計算。`;
  const providers = [...new Set(substitution.providerIds)]
    .map((id) => getRateProvider(id)?.label ?? id)
    .join('、');
  const region = substitution.country ? regions.of(substitution.country) : null;
  const branchId = substitution.branchId;
  const branchLabel =
    substitution.branchLabel ??
    (branchId
      ? substitution.providerIds
          ?.map((id) => getRateProvider(id)?.branchLabels?.[branchId])
          .find(Boolean)
      : undefined);
  const branch = branchLabel
    ? `（${branchLabel}）`
    : substitution.branchId
      ? `（${substitution.branchId}）`
      : '';
  return `${subject}：${providers}僅提供${region ?? '該地點'}${branch}據點報價，已以該地點計算。`;
}

/**
 * 多幣別頁每個幣別各產生一筆相同原因的替換；依原因合併成一句，並列出受影響幣別。
 * 原因相同＝種類、來源與目標地點／交付方式、來源名單皆相同。
 */
export function summarizeFxSubstitutions(
  substitutions: readonly FxContextSubstitution[],
): string[] {
  const groups = new Map<string, { sample: FxContextSubstitution; currencies: string[] }>();
  for (const substitution of substitutions) {
    const key = [
      substitution.kind,
      substitution.from,
      substitution.to,
      substitution.country ?? '',
      substitution.branchId ?? '',
      [...new Set(substitution.providerIds)].sort().join(','),
    ].join('|');
    const group = groups.get(key);
    if (!group) groups.set(key, { sample: substitution, currencies: [substitution.toCurrency] });
    else if (!group.currencies.includes(substitution.toCurrency))
      group.currencies.push(substitution.toCurrency);
  }
  return [...groups.values()].map(({ sample, currencies }) =>
    formatFxSubstitution(sample, currencies),
  );
}
