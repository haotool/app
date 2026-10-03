import { getRateProvider } from '../../../config/rateProviders';
import type { QuoteSnapshot } from '@app/shared/fx';
import { useTranslation } from 'react-i18next';
import { useConverterStore } from '../../../stores/converterStore';

/** Location is an explicit user choice; selecting a provider never changes country. */
const labelClass = 'flex flex-col gap-1 text-xs text-neutral-text-secondary';
const selectClass =
  'w-full rounded-lg border border-primary/20 bg-surface px-2 py-2 text-sm text-text';

export function FxContextControls({ quotes }: { quotes: readonly QuoteSnapshot[] }) {
  const { i18n, t } = useTranslation();
  const state = useConverterStore();
  const locale = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(i18n?.language ?? '')
    ? i18n.language
    : 'zh-TW';
  const regionNames = new Intl.DisplayNames([locale], { type: 'region' });
  const countries = [
    ...new Set(
      ['TW', state.serviceCountry, ...quotes.map((q) => q.sourceQuote.serviceCountry)].filter(
        (country): country is string => /^[A-Z]{2}$/.test(country),
      ),
    ),
  ];
  const local = quotes.filter((q) => q.sourceQuote.serviceCountry === state.serviceCountry);
  const providers = [...new Set(local.map((q) => q.providerId))];
  const branches = [
    ...new Set(local.flatMap((q) => (q.sourceQuote.branchId ? [q.sourceQuote.branchId] : []))),
  ];
  const manual = state.providerPreference.manualProvider?.providerId;
  return (
    <details className="mx-3 mt-3 rounded-xl border border-primary/15 bg-surface text-xs">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-text">
        {t('fxUi.conditions')}
      </summary>
      <fieldset className="grid grid-cols-1 gap-3 border-t border-primary/10 p-3 text-sm">
        <legend className="sr-only">{t('fxUi.advancedConditions')}</legend>
        <label className={labelClass}>
          {t('fxUi.location')}{' '}
          <select
            className={selectClass}
            aria-label="換匯地點"
            value={state.serviceCountry}
            onChange={(e) => state.setServiceCountry(e.target.value)}
          >
            {countries.map((country) => (
              <option key={country} value={country}>
                {regionNames.of(country) ?? country}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {t('fxUi.provider')}{' '}
          <select
            className={selectClass}
            aria-label="牌告來源"
            value={state.providerPreference.mode === 'best' ? 'best' : (manual ?? '')}
            onChange={(e) =>
              state.setProviderPreference(
                e.target.value === 'best'
                  ? { mode: 'best' }
                  : {
                      mode: 'manual',
                      manualProvider: {
                        providerId: e.target.value,
                        sourceKind: getRateProvider(e.target.value)?.sourceKind ?? 'bank',
                      },
                    },
              )
            }
          >
            <option value="best">{t('fxUi.compareBoardRates')}</option>
            {manual && !providers.includes(manual) && (
              <option value={manual}>
                {getRateProvider(manual)?.label ?? manual}（{t('fxUi.unavailableInLocation')}）
              </option>
            )}
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {getRateProvider(provider)?.label ?? provider}
              </option>
            ))}
          </select>
        </label>
        {branches.length > 0 && (
          <label className={labelClass}>
            {t('fxUi.branch')}{' '}
            <select
              className={selectClass}
              aria-label="換匯分店"
              value={state.branchId ?? ''}
              onChange={(e) => state.setBranchId(e.target.value || null)}
            >
              <option value="">{t('fxUi.chooseBranch')}</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {providers
                    .map((provider) => getRateProvider(provider)?.branchLabels?.[branch])
                    .find(Boolean) ?? branch}
                </option>
              ))}
            </select>
          </label>
        )}
      </fieldset>
    </details>
  );
}
