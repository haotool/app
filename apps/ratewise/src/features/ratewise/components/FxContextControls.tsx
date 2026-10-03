import { getRateProvider } from '../../../config/rateProviders';
import type { QuoteSnapshot } from '@app/shared/fx';
import { useTranslation } from 'react-i18next';
import { useConverterStore } from '../../../stores/converterStore';

/**
 * 地點由來源決定：選來源時自動採用該來源的地點，不需要使用者另外挑地點。
 * 地點選擇只在真的有歧義時顯示——Best 模式只比較單一地點的牌告，而且有多個地點可選，
 * 或手動來源在多個地點都有牌告。
 */
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
  const countriesByProvider = new Map<string, Set<string>>();
  for (const quote of quotes) {
    const set = countriesByProvider.get(quote.providerId) ?? new Set<string>();
    set.add(quote.sourceQuote.serviceCountry);
    countriesByProvider.set(quote.providerId, set);
  }
  const providers = [...countriesByProvider.keys()];
  const manual = state.providerPreference.manualProvider?.providerId;
  const isBest = state.providerPreference.mode === 'best';
  const manualCountries = manual ? [...(countriesByProvider.get(manual) ?? [])] : [];
  // 手動來源在目前地點沒有牌告時，換算會改用其地點；介面也以該地點呈現，不顯示矛盾的狀態。
  const country =
    !isBest && manualCountries.length > 0 && !manualCountries.includes(state.serviceCountry)
      ? (manualCountries[0] ?? state.serviceCountry)
      : state.serviceCountry;
  const countries = [
    ...new Set(
      (isBest
        ? ['TW', state.serviceCountry, ...quotes.map((q) => q.sourceQuote.serviceCountry)]
        : manualCountries
      ).filter((code): code is string => /^[A-Z]{2}$/.test(code)),
    ),
  ];
  const showLocation = countries.length > 1;
  const local = quotes.filter(
    (q) =>
      q.sourceQuote.serviceCountry === country && (isBest || !manual || q.providerId === manual),
  );
  const branches = [
    ...new Set(local.flatMap((q) => (q.sourceQuote.branchId ? [q.sourceQuote.branchId] : []))),
  ];
  const selectProvider = (providerId: string) => {
    if (providerId === 'best') {
      state.setProviderPreference({ mode: 'best' });
      return;
    }
    const available = [...(countriesByProvider.get(providerId) ?? [])];
    const nextCountry = available.includes(state.serviceCountry)
      ? state.serviceCountry
      : available[0];
    if (nextCountry && nextCountry !== state.serviceCountry) state.setServiceCountry(nextCountry);
    // 該來源在此地點只有一間分店時一併採用，避免因分店未選而仍被判定為條件不符。
    const providerBranches = new Set(
      quotes
        .filter((q) => q.providerId === providerId && q.sourceQuote.serviceCountry === nextCountry)
        .flatMap((q) => (q.sourceQuote.branchId ? [q.sourceQuote.branchId] : [])),
    );
    const [onlyBranch] = [...providerBranches];
    if (providerBranches.size === 1 && onlyBranch) state.setBranchId(onlyBranch);
    state.setProviderPreference({
      mode: 'manual',
      manualProvider: {
        providerId,
        sourceKind: getRateProvider(providerId)?.sourceKind ?? 'bank',
      },
    });
  };
  return (
    <details className="mx-3 mt-3 rounded-xl border border-primary/15 bg-surface text-xs">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-text">
        {t('fxUi.conditions')}
      </summary>
      <fieldset className="grid grid-cols-1 gap-3 border-t border-primary/10 p-3 text-sm">
        <legend className="sr-only">{t('fxUi.advancedConditions')}</legend>
        {showLocation && (
          <label className={labelClass}>
            {t('fxUi.location')}{' '}
            <select
              className={selectClass}
              aria-label="換匯地點"
              value={country}
              onChange={(e) => state.setServiceCountry(e.target.value)}
            >
              {countries.map((country) => (
                <option key={country} value={country}>
                  {regionNames.of(country) ?? country}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={labelClass}>
          {t('fxUi.provider')}{' '}
          <select
            className={selectClass}
            aria-label="牌告來源"
            value={state.providerPreference.mode === 'best' ? 'best' : (manual ?? '')}
            onChange={(e) => selectProvider(e.target.value)}
          >
            <option value="best">{t('fxUi.compareBoardRates')}</option>
            {manual && !providers.includes(manual) && (
              <option value={manual}>{getRateProvider(manual)?.label ?? manual}</option>
            )}
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {getRateProvider(provider)?.label ?? provider}
              </option>
            ))}
          </select>
        </label>
        {branches.length > 1 && (
          <label className={labelClass}>
            {t('fxUi.branch')}{' '}
            <select
              className={selectClass}
              aria-label="換匯分店"
              value={state.branchId ?? ''}
              onChange={(e) => {
                // 顯示的地點是由來源推導出的；使用者選分店時一併寫入，避免 store 仍留舊國家而全部不適用。
                if (country !== state.serviceCountry) state.setServiceCountry(country);
                state.setBranchId(e.target.value || null);
              }}
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
