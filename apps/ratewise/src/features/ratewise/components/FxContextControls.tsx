import { getRateProvider } from '../../../config/rateProviders';
import type { QuoteSnapshot } from '@app/shared/fx';
import { useTranslation } from 'react-i18next';
import { useConverterStore } from '../../../stores/converterStore';

/** Location is an explicit user choice; selecting a provider never changes country. */
export function FxContextControls({ quotes }: { quotes: readonly QuoteSnapshot[] }) {
  const { i18n } = useTranslation();
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
    <fieldset className="flex flex-wrap gap-3 p-3 text-sm">
      <legend>換匯條件</legend>
      <label>
        地點{' '}
        <select
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
      <label>
        方式{' '}
        <select
          aria-label="換匯方式"
          value={state.rateType}
          onChange={(e) => state.setRateType(e.target.value === 'cash' ? 'cash' : 'spot')}
        >
          <option value="cash">現鈔／臨櫃</option>
          <option value="spot">帳戶／網銀</option>
        </select>
      </label>
      <label>
        來源{' '}
        <select
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
          <option value="best">比較未含費用牌告</option>
          {manual && !providers.includes(manual) && (
            <option value={manual}>{manual}（此地點無報價）</option>
          )}
          {providers.map((provider) => (
            <option key={provider} value={provider}>
              {getRateProvider(provider)?.label ?? provider}
            </option>
          ))}
        </select>
      </label>
      {branches.length > 0 && (
        <label>
          分店{' '}
          <select
            aria-label="換匯分店"
            value={state.branchId ?? ''}
            onChange={(e) => state.setBranchId(e.target.value || null)}
          >
            <option value="">請選擇分店</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch === 'myeongdong' ? '明洞 Myeongdong' : branch}
              </option>
            ))}
          </select>
        </label>
      )}
    </fieldset>
  );
}
