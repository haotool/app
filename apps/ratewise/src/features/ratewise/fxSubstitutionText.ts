import { getRateProvider } from '../../config/rateProviders';
import type { FxContextSubstitution } from './fxEffectiveContext';

const regions = new Intl.DisplayNames(['zh-TW'], { type: 'region' });

export function formatFxSubstitution(substitution: FxContextSubstitution): string {
  if (substitution.kind === 'deliveryMethod')
    return `${substitution.toCurrency}無${substitution.from === 'account' ? '即期' : '現鈔'}報價，改以${substitution.to === 'cash' ? '現鈔' : '即期'}計算。`;
  const providers = substitution.providerIds
    ?.map((id) => getRateProvider(id)?.label ?? id)
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
  return `${substitution.toCurrency}：${providers}僅提供${region ?? '該地點'}${branch}據點報價，已以該地點計算。`;
}
